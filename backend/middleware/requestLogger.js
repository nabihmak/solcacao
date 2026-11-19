/**
 * requestLogger.js - one log line per API request, for debugging.
 *
 *   2026-11-14T22:30:01.123Z POST /api/auth/login 200 84ms
 *
 * Only the method, path, status and time are written: never request bodies, passwords
 * or tokens. Set LOG_REQUESTS=false in backend/.env to turn it off.
 */
export function requestLogger({ log = console.log, enabled = process.env.LOG_REQUESTS !== 'false' } = {}) {
  return function logRequest(req, res, next) {
    if (!enabled) return next();
    const start = process.hrtime.bigint();
    res.on('finish', () => {
      const ms = Number(process.hrtime.bigint() - start) / 1e6;
      const path = req.originalUrl.split('?')[0]; // leave out query strings
      log(`${new Date().toISOString()} ${req.method} ${path} ${res.statusCode} ${Math.round(ms)}ms`);
    });
    return next();
  };
}
