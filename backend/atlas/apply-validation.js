/**
 * Applies MongoDB's native $jsonSchema validators directly on each Atlas
 * collection. Mongoose already validates on the application side, but that
 * only protects writes that go through this backend. Native schema
 * validation is enforced by the database itself for *any* write — including
 * from mongosh, Compass, a future service, or a bug that bypasses Mongoose —
 * which is what "MongoDB Atlas should have schema validation" means in
 * practice, distinct from ODM-level validation.
 *
 * Safe to re-run: uses collMod when the collection exists, createCollection
 * otherwise.
 *
 * Usage: npm run apply-validation
 */
import 'dotenv/config';
import { connectDB, disconnectDB } from '../src/config/db.js';
import mongoose from 'mongoose';

const validators = {
  projects: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['_id', 'title', 'description', 'createdAt', 'updatedAt'],
      properties: {
        _id: { bsonType: 'string', pattern: '^prj_' },
        title: { bsonType: 'string', minLength: 1, maxLength: 120 },
        description: { bsonType: 'string', minLength: 1, maxLength: 2000 },
        url: { bsonType: 'string', maxLength: 500 },
        imageUrl: { bsonType: 'string', maxLength: 500 },
        tags: { bsonType: 'array', items: { bsonType: 'string' }, maxItems: 20 },
        featured: { bsonType: 'bool' },
        order: { bsonType: 'number' },
      },
    },
  },
  skills: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['_id', 'name', 'category'],
      properties: {
        _id: { bsonType: 'string', pattern: '^skl_' },
        name: { bsonType: 'string', minLength: 1, maxLength: 60 },
        category: { enum: ['Languages', 'Frameworks & Libs', 'Tools & Clouds', 'Other'] },
        level: { enum: ['beginner', 'intermediate', 'advanced', 'expert'] },
        order: { bsonType: 'number' },
      },
    },
  },
  messages: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['_id', 'name', 'message', 'createdAt'],
      properties: {
        _id: { bsonType: 'string', pattern: '^msg_' },
        name: { bsonType: 'string', minLength: 1, maxLength: 80 },
        message: { bsonType: 'string', minLength: 1, maxLength: 1000 },
        ip: { bsonType: 'string' },
      },
    },
  },
  users: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['_id', 'email', 'passwordHash', 'role'],
      properties: {
        _id: { bsonType: 'string', pattern: '^usr_' },
        email: { bsonType: 'string', maxLength: 254 },
        passwordHash: { bsonType: 'string' },
        role: { enum: ['user', 'admin'] },
      },
    },
  },
  likes: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['_id', 'projectId', 'visitorId'],
      properties: {
        _id: { bsonType: 'string', pattern: '^lik_' },
        projectId: { bsonType: 'string', pattern: '^prj_' },
        visitorId: { bsonType: 'string', maxLength: 100 },
      },
    },
  },
};

async function applyOne(db, name, validator) {
  const existing = await db.listCollections({ name }).toArray();
  if (existing.length === 0) {
    await db.createCollection(name, { validator, validationLevel: 'strict', validationAction: 'error' });
    console.log(`[validation] created "${name}" with schema validation.`);
  } else {
    await db.command({ collMod: name, validator, validationLevel: 'strict', validationAction: 'error' });
    console.log(`[validation] updated schema validation on "${name}".`);
  }
}

async function main() {
  await connectDB();
  const db = mongoose.connection.db;
  for (const [name, validator] of Object.entries(validators)) {
    await applyOne(db, name, validator);
  }
  await disconnectDB();
  console.log('[validation] done.');
}

main().catch((err) => {
  console.error('[validation] failed:', err);
  process.exit(1);
});
