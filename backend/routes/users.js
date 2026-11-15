/**
 * users.js - profile and address book for the signed-in user (Student 1).
 * Every route needs "Authorization: Bearer <token>".
 *
 *   PUT    /api/users/profile         -> 200 { user }      name, phone, language, company (B2B only)
 *   PUT    /api/users/password        -> 200 { message }   400 when the current password is wrong
 *   GET    /api/users/addresses       -> 200 { addresses } default address first
 *   POST   /api/users/addresses       -> 201 { address }
 *   PUT    /api/users/addresses/:id   -> 200 { address }   404 when it is not this user's address
 *   DELETE /api/users/addresses/:id   -> 200 { message }   404 when it is not this user's address
 */
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import * as userStore from '../db/userStore.js';
import { makeProtect } from '../middleware/auth.js';
import * as rules from '../utils/validation.js';

const BCRYPT_ROUNDS = 10;
const ADDRESS_LIMITS = { label: 50, street: 200, city: 100, state: 100, postalCode: 20, country: 100 };
const REQUIRED_ADDRESS_FIELDS = ['street', 'city', 'postalCode', 'country'];

const badRequest = (res, errors) => res.status(400).json({ message: 'Validation failed', errors });

// partial = true for an update: only the fields that were sent are checked
function checkAddress(values, partial) {
  const checks = {};
  Object.entries(ADDRESS_LIMITS).forEach(([field, max]) => {
    if (partial && values[field] === undefined) return;
    checks[field] = REQUIRED_ADDRESS_FIELDS.includes(field)
      ? rules.required(values[field], max)
      : rules.optional(values[field], max);
  });
  if (values.isDefault !== undefined && typeof values.isDefault !== 'boolean')
    checks.isDefault = 'auth.errors.required';
  return rules.validate(checks);
}

function cleanAddress(values, partial) {
  const result = {};
  Object.keys(ADDRESS_LIMITS).forEach((field) => {
    if (partial && values[field] === undefined) return;
    result[field] = rules.clean(values[field]);
  });
  if (values.isDefault !== undefined) result.isDefault = values.isDefault;
  return result;
}

export function makeUsersRouter({ store = userStore } = {}) {
  const router = Router();
  router.use(makeProtect(store));

  router.put('/profile', async (req, res) => {
    const changes = req.body || {};
    const company = changes.company;
    if (company !== undefined && req.user.accountType !== 'B2B') {
      return res.status(400).json({ message: 'Only B2B accounts have company details' });
    }
    if (company !== undefined && (typeof company !== 'object' || company === null)) {
      return badRequest(res, [{ field: 'company.companyName', message: 'auth.errors.required' }]);
    }

    const errors = rules.validate({
      name: changes.name !== undefined ? rules.required(changes.name, 100) : null,
      phone: rules.optional(changes.phone, 30),
      preferredLanguage:
        changes.preferredLanguage !== undefined ? rules.oneOf(changes.preferredLanguage, rules.LANGUAGES) : null,
      'company.companyName': company ? rules.required(company.companyName, 150) : null,
      'company.industry': company?.industry !== undefined ? rules.oneOf(company.industry, rules.INDUSTRIES) : null,
      'company.taxId': company ? rules.optional(company.taxId, 50) : null,
      'company.website': company ? rules.website(company.website) : null,
    });
    if (errors.length) return badRequest(res, errors);

    // Only these fields can change; email and account type stay the same
    const user = await store.updateUser(req.user._id, {
      name: changes.name !== undefined ? rules.clean(changes.name) : undefined,
      phone: changes.phone !== undefined ? rules.clean(changes.phone) : undefined,
      preferredLanguage: changes.preferredLanguage,
      company: company
        ? {
            companyName: rules.clean(company.companyName),
            industry: company.industry,
            taxId: company.taxId !== undefined ? rules.clean(company.taxId) : undefined,
            website: company.website !== undefined ? rules.clean(company.website) : undefined,
          }
        : undefined,
    });
    return res.status(200).json({ user });
  });

  router.put('/password', async (req, res) => {
    const { currentPassword, newPassword } = req.body || {};
    const errors = rules.validate({
      currentPassword: rules.required(currentPassword, 200),
      newPassword: rules.password(newPassword),
    });
    if (errors.length) return badRequest(res, errors);

    const hash = await store.getPasswordHash(req.user._id);
    if (!(await bcrypt.compare(currentPassword, hash))) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    await store.setPasswordHash(req.user._id, await bcrypt.hash(newPassword, BCRYPT_ROUNDS));
    return res.status(200).json({ message: 'Password changed successfully' });
  });

  router.get('/addresses', async (req, res) => {
    res.status(200).json({ addresses: await store.listAddresses(req.user._id) });
  });

  router.post('/addresses', async (req, res) => {
    const values = req.body || {};
    const errors = checkAddress(values, false);
    if (errors.length) return badRequest(res, errors);
    const address = await store.addAddress(req.user._id, cleanAddress(values, false));
    return res.status(201).json({ address });
  });

  router.put('/addresses/:id', async (req, res) => {
    const values = req.body || {};
    const errors = checkAddress(values, true);
    if (errors.length) return badRequest(res, errors);
    const address = await store.updateAddress(req.user._id, req.params.id, cleanAddress(values, true));
    if (!address) return res.status(404).json({ message: 'Address not found' });
    return res.status(200).json({ address });
  });

  router.delete('/addresses/:id', async (req, res) => {
    if (!(await store.deleteAddress(req.user._id, req.params.id))) {
      return res.status(404).json({ message: 'Address not found' });
    }
    return res.status(200).json({ message: 'Address deleted' });
  });

  return router;
}
