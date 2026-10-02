import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-only-for-unit-tests';
process.env.JWT_EXPIRES_IN = '1h';

let signToken, verifyToken;

before(async () => {
  ({ signToken, verifyToken } = await import('../src/utils/jwt.js'));
});

describe('password hashing (bcrypt)', () => {
  test('hash then compare succeeds for the correct password', async () => {
    const hash = await bcrypt.hash('correct horse battery staple', 12);
    assert.equal(await bcrypt.compare('correct horse battery staple', hash), true);
  });

  test('compare fails for the wrong password', async () => {
    const hash = await bcrypt.hash('correct horse battery staple', 12);
    assert.equal(await bcrypt.compare('wrong password', hash), false);
  });

  test('never stores the plaintext password in the hash', async () => {
    const hash = await bcrypt.hash('super-secret-value', 12);
    assert.equal(hash.includes('super-secret-value'), false);
  });
});

describe('JWT sign/verify', () => {
  test('signs a token that verifies back to the same claims', () => {
    const user = { _id: 'usr_abc123', email: 'a@b.com', role: 'admin' };
    const token = signToken(user);
    const payload = verifyToken(token);
    assert.equal(payload.sub, user._id);
    assert.equal(payload.email, user.email);
    assert.equal(payload.role, user.role);
  });

  test('rejects a tampered token', () => {
    const token = signToken({ _id: 'usr_1', email: 'a@b.com', role: 'user' });
    const tampered = token.slice(0, -2) + 'xx';
    assert.throws(() => verifyToken(tampered));
  });

  test('rejects a token signed with a different secret', async () => {
    const jwt = (await import('jsonwebtoken')).default;
    const foreignToken = jwt.sign({ sub: 'usr_1', role: 'admin' }, 'a-different-secret');
    assert.throws(() => verifyToken(foreignToken));
  });
});
