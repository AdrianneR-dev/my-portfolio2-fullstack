import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { registerSchema, loginSchema } from '../src/schemas/authSchemas.js';
import { createProjectSchema } from '../src/schemas/projectSchemas.js';
import { createSkillSchema, listSkillsQuerySchema } from '../src/schemas/skillSchemas.js';
import { createMessageSchema } from '../src/schemas/messageSchemas.js';
import { likeSchema } from '../src/schemas/likeSchemas.js';

describe('authSchemas', () => {
  test('registerSchema accepts a valid payload', () => {
    const result = registerSchema.safeParse({ email: 'Test@Example.com', password: 'longenough123' });
    assert.equal(result.success, true);
    assert.equal(result.data.email, 'test@example.com'); // lowercased + trimmed
  });

  test('registerSchema rejects a short password', () => {
    const result = registerSchema.safeParse({ email: 'a@b.com', password: 'short' });
    assert.equal(result.success, false);
  });

  test('registerSchema rejects an attempt to smuggle a role field (it is simply ignored/stripped by not being in the schema)', () => {
    const result = registerSchema.safeParse({ email: 'a@b.com', password: 'longenough123', role: 'admin' });
    assert.equal(result.success, true);
    assert.equal('role' in result.data, false, 'role must not pass through validation');
  });

  test('loginSchema rejects malformed email', () => {
    const result = loginSchema.safeParse({ email: 'not-an-email', password: 'x' });
    assert.equal(result.success, false);
  });
});

describe('projectSchemas', () => {
  test('createProjectSchema requires title and description', () => {
    const result = createProjectSchema.safeParse({});
    assert.equal(result.success, false);
    const paths = result.error.issues.map((i) => i.path[0]);
    assert.ok(paths.includes('title'));
    assert.ok(paths.includes('description'));
  });

  test('createProjectSchema rejects more than 20 tags', () => {
    const tags = Array.from({ length: 21 }, (_, i) => `tag${i}`);
    const result = createProjectSchema.safeParse({ title: 'T', description: 'D', tags });
    assert.equal(result.success, false);
  });

  test('createProjectSchema accepts an empty string url (optional)', () => {
    const result = createProjectSchema.safeParse({ title: 'T', description: 'D', url: '' });
    assert.equal(result.success, true);
  });
});

describe('skillSchemas', () => {
  test('createSkillSchema rejects an invalid category', () => {
    const result = createSkillSchema.safeParse({ name: 'Rust', category: 'Not A Category' });
    assert.equal(result.success, false);
  });

  test('listSkillsQuerySchema defaults sort/order when omitted', () => {
    const result = listSkillsQuerySchema.safeParse({});
    assert.equal(result.success, true);
    assert.equal(result.data.sort, 'order');
    assert.equal(result.data.order, 'asc');
  });
});

describe('messageSchemas', () => {
  test('createMessageSchema rejects an empty message', () => {
    const result = createMessageSchema.safeParse({ name: 'A', message: '' });
    assert.equal(result.success, false);
  });

  test('createMessageSchema rejects a message over 1000 chars', () => {
    const result = createMessageSchema.safeParse({ name: 'A', message: 'x'.repeat(1001) });
    assert.equal(result.success, false);
  });
});

describe('likeSchemas', () => {
  test('likeSchema requires a visitorId of at least 8 chars', () => {
    assert.equal(likeSchema.safeParse({ visitorId: 'short' }).success, false);
    assert.equal(likeSchema.safeParse({ visitorId: 'a-valid-uuid-like-string' }).success, true);
  });
});
