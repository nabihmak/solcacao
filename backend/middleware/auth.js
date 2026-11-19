/**
 * auth.js - sign-in checks any route can use (Student 1).
 *
 *   import { protect, requireB2B } from '../middleware/auth.js';
 *   app.get('/api/cart', protect, handler);                     // signed-in users only
 *   app.post('/api/b2b/quote', protect, requireB2B, handler);  // corporate partners only
 *
 * protect reads "Authorization: Bearer <token>", checks the JWT and loads the user
 * from the database into req.user. A handler should use req.user, never a user sent by the browser.
 */
import jwt from 'jsonwebtoken';
import * as userStore from '../db/userStore.js';

const TOKEN_LIFETIME = '7d';

function secret() {
  const value = process.env.JWT_SECRET;
  if (!value) throw new Error('JWT_SECRET is not set in backend/.env');
  return value;
}

export function signToken(user) {
  return jwt.sign({ sub: user._id }, secret(), { expiresIn: TOKEN_LIFETIME });
}

// Same 401 message for a missing, expired or fake token
const notAuthorized = (res) => res.status(401).json({ message: 'Not authorized: please sign in again' });

export function makeProtect(store = userStore) {
  return async function protect(req, res, next) {
    const [scheme, token] = (req.headers.authorization || '').split(' ');
    if (scheme !== 'Bearer' || !token) return notAuthorized(res);

    let payload;
    try {
      payload = jwt.verify(token, secret());
    } catch {
      return notAuthorized(res);
    }

    const user = await store.findUserById(payload.sub); // the account may have been removed
    if (!user) return notAuthorized(res);
    req.user = user;
    return next();
  };
}

export const protect = makeProtect();

// Use after protect: lets only corporate (B2B) accounts through
export function requireB2B(req, res, next) {
  if (req.user?.accountType !== 'B2B') {
    return res.status(403).json({ message: 'Only corporate partner accounts can do this' });
  }
  return next();
}
