/**
 * Exercises the real Express app (middleware stack + routing) over actual
 * HTTP, without a database connection. Routes that need the DB are only
 * probed up to the point where validation or auth would reject the request
 * first — which is itself real coverage of the security middleware order.
 */
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-only-for-unit-tests';
process.env.CORS_ORIGIN = 'http://localhost:5173';

let server;
let baseUrl;

before(async () => {
  const { createApp } = await import('../src/app.js');
  const app = createApp();
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

describe('app wiring', () => {
  test('GET /health returns ok', async () => {
    const res = await fetch(`${baseUrl}/health`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.ok, true);
  });

  test('unknown routes return 404 via notFoundHandler', async () => {
    const res = await fetch(`${baseUrl}/api/does-not-exist`);
    assert.equal(res.status, 404);
    const body = await res.json();
    assert.equal(body.error, 'NotFound');
  });

  test('helmet security headers are present', async () => {
    const res = await fetch(`${baseUrl}/health`);
    assert.ok(res.headers.get('x-content-type-options'), 'expected X-Content-Type-Options header from helmet');
    assert.ok(!res.headers.get('x-powered-by'), 'helmet should remove X-Powered-By');
  });

  test('POST /api/auth/register rejects bad input before touching the DB', async () => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'not-an-email', password: '123' }),
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.error, 'ValidationError');
  });

  test('protected routes reject requests with no Authorization header', async () => {
    const res = await fetch(`${baseUrl}/api/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'x', description: 'y' }),
    });
    assert.equal(res.status, 401);
  });

  test('protected routes reject an invalid bearer token', async () => {
    const res = await fetch(`${baseUrl}/api/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer not-a-real-token' },
      body: JSON.stringify({ title: 'x', description: 'y' }),
    });
    assert.equal(res.status, 401);
  });

  test('a validly-signed but non-admin token gets 403 from requireAdmin', async () => {
    const { signToken } = await import('../src/utils/jwt.js');
    const token = signToken({ _id: 'usr_1', email: 'user@example.com', role: 'user' });
    const res = await fetch(`${baseUrl}/api/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ title: 'x', description: 'y' }),
    });
    assert.equal(res.status, 403);
  });

  test('GET /api/skills rejects an invalid sort field via query validation', async () => {
    const res = await fetch(`${baseUrl}/api/skills?sort=not-a-real-field`);
    assert.equal(res.status, 400);
  });

  test('oversized JSON body is rejected (100kb limit)', async () => {
    const bigPayload = JSON.stringify({ name: 'A', message: 'x'.repeat(200_000) });
    const res = await fetch(`${baseUrl}/api/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: bigPayload,
    });
    assert.equal(res.status, 413);
  });
});
