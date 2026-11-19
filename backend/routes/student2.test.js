
import express from 'express';
import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import { registerStudent2Routes } from './student2.js';

// Create an isolated Express app for Student 2 tests.
const app = express();

registerStudent2Routes(app);

let server;
let baseUrl;

before(async () => {
  server = await new Promise((resolve) => {
    const instance = app.listen(0, '127.0.0.1', () => {
      resolve(instance);
    });
  });

  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (server) {
    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  }
});

// Test 1: Health check
test('Health API returns 200', async () => {
  const res = await fetch(`${baseUrl}/api/health`);
  const data = await res.json();

  assert.equal(res.status, 200);
  assert.equal(data.status, 'ok');
});

// Test 2: English localization
test('English translations work', async () => {
  const res = await fetch(`${baseUrl}/api/i18n/en`);
  const data = await res.json();

  assert.equal(res.status, 200);
  assert.equal(data.nav.home, 'Home');
});

// Test 3: Spanish localization
test('Spanish translations work', async () => {
  const res = await fetch(`${baseUrl}/api/i18n/es`);
  const data = await res.json();

  assert.equal(res.status, 200);
  assert.equal(data.nav.home, 'Inicio');
});

// Test 4: Unsupported language
test('Unsupported language returns 400', async () => {
  const res = await fetch(`${baseUrl}/api/i18n/fr`);
  const data = await res.json();

  assert.equal(res.status, 400);
  assert.equal(data.error, 'Unsupported language');
});

// Test 5: Static favicon
test('Favicon is accessible', async () => {
  const res = await fetch(`${baseUrl}/assets/favicon.svg`);

  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-type'), /image\/svg\+xml/);
});

// Test 6: Chocolate image
test('Chocolate image is accessible', async () => {
  const res = await fetch(
    `${baseUrl}/assets/B2B/images/homemade-chocolate-bars-500x500.jpg`
  );

  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-type'), /image\/jpeg/);
});

// Test 7: Missing asset
test('Missing asset returns 404', async () => {
  const res = await fetch(
    `${baseUrl}/assets/nonexistent.jpg`
  );

  assert.equal(res.status, 404);
});
