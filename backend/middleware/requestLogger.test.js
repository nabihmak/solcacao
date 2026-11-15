// Tests for the request logger. Run: npm test
import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { requestLogger } from './requestLogger.js';

const lines = [];
const app = express();
app.use(requestLogger({ log: (line) => lines.push(line), enabled: true }));
app.get('/api/ping', (req, res) => res.json({ ok: true }));
const server = app.listen(0);
const base = `http://localhost:${server.address().port}`;
after(() => server.close());

test('logs method, path, status and time for each request', async () => {
  await fetch(`${base}/api/ping?secret=abc`);
  await fetch(`${base}/api/missing`);
  await new Promise((resolve) => setTimeout(resolve, 20));
  assert.match(lines[0], /^\S+ GET \/api\/ping 200 \d+ms$/);
  assert.match(lines[1], /^\S+ GET \/api\/missing 404 \d+ms$/);
});

test('never logs query strings', () => {
  assert.ok(lines.every((line) => !line.includes('secret')));
});

test('can be turned off', async () => {
  const quiet = [];
  const offApp = express();
  offApp.use(requestLogger({ log: (line) => quiet.push(line), enabled: false }));
  offApp.get('/x', (req, res) => res.end());
  const offServer = offApp.listen(0);
  await fetch(`http://localhost:${offServer.address().port}/x`);
  offServer.close();
  assert.equal(quiet.length, 0);
});
