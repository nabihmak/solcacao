/**
 * auth.js - sign-up and sign-in (Student 1).
 *
 *   POST /api/auth/register  -> 201 { token, user }   400 field errors, 409 email taken
 *   POST /api/auth/login     -> 200 { token, user }   400 field errors, 401 wrong email or password
 *   GET  /api/auth/me        -> 200 { user }          401 no or bad token
 *   POST /api/auth/logout    -> 204                   (the browser deletes its token)
 */
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import * as userStore from '../db/userStore.js';
import { makeProtect, signToken } from '../middleware/auth.js';
import * as rules from '../utils/validation.js';

const BCRYPT_ROUNDS = 10;
// Compared against when the email is unknown, so both cases take the same time
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', BCRYPT_ROUNDS);

export function makeAuthRouter({ store = userStore } = {}) {
  const router = Router();
  const protect = makeProtect(store);

  router.post('/register', async (req, res) => {
    const body = req.body || {};
    const isB2B = body.accountType === 'B2B';
    const company = isB2B && body.company && typeof body.company === 'object' ? body.company : {};

    const errors = rules.validate({
      name: rules.required(body.name, 100),
      email: rules.email(body.email),
      password: rules.password(body.password),
      accountType: rules.oneOf(body.accountType, rules.ACCOUNT_TYPES),
      phone: rules.optional(body.phone, 30),
      'company.companyName': isB2B ? rules.required(company.companyName, 150) : null,
      'company.industry': isB2B ? rules.oneOf(company.industry, rules.INDUSTRIES) : null,
      'company.taxId': isB2B ? rules.optional(company.taxId, 50) : null,
      'company.website': isB2B ? rules.website(company.website) : null,
    });
    if (errors.length) return res.status(400).json({ message: 'Validation failed', errors });

    const email = rules.clean(body.email).toLowerCase();
    if (await store.emailExists(email)) {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }

    let user;
    try {
      user = await store.createUser({
        name: rules.clean(body.name),
        email,
        passwordHash: await bcrypt.hash(body.password, BCRYPT_ROUNDS),
        accountType: body.accountType,
        phone: rules.clean(body.phone),
        preferredLanguage: rules.LANGUAGES.includes(body.preferredLanguage) ? body.preferredLanguage : 'en',
        company: isB2B
          ? {
              companyName: rules.clean(company.companyName),
              industry: company.industry,
              taxId: rules.clean(company.taxId),
              website: rules.clean(company.website),
            }
          : null,
      });
    } catch (error) {
      // Two sign-ups with the same email at the same moment: the unique index stops the second one
      if (error.code === 'EMAIL_TAKEN') {
        return res.status(409).json({ message: 'An account with this email already exists' });
      }
      throw error;
    }
    return res.status(201).json({ token: signToken(user), user });
  });

  router.post('/login', async (req, res) => {
    const { email, password } = req.body || {};
    const errors = rules.validate({ email: rules.email(email), password: rules.required(password, 200) });
    if (errors.length) return res.status(400).json({ message: 'Validation failed', errors });

    const found = await store.findUserByEmail(rules.clean(email).toLowerCase());
    const matches = await bcrypt.compare(password, found?.passwordHash || DUMMY_HASH);
    // Same message for "no account" and "wrong password"
    if (!found || !matches) return res.status(401).json({ message: 'Invalid email or password' });

    return res.status(200).json({ token: signToken(found.user), user: found.user });
  });

  router.get('/me', protect, (req, res) => res.status(200).json({ user: req.user }));

  // A JWT cannot be "switched off" on the server; the browser forgets it
  router.post('/logout', (req, res) => res.status(204).end());

  return router;
}
