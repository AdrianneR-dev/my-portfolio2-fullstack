/**
 * Dumps every application collection to EJSON files under backups/<timestamp>/.
 * Uses the MongoDB driver directly (via the existing mongoose connection)
 * rather than the external `mongodump` binary, so it works anywhere Node
 * runs (including Render) with no extra system dependencies to install.
 *
 * EJSON (MongoDB's Extended JSON) is used instead of plain JSON.stringify so
 * BSON-specific types — ObjectIds, Dates — round-trip exactly on restore
 * instead of degrading into plain strings.
 *
 * Usage: npm run backup
 */
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { EJSON } from 'bson';
import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../src/config/db.js';

const COLLECTIONS = ['projects', 'skills', 'messages', 'users', 'likes'];

export async function runBackup({ outDir } = {}) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const dir = outDir || path.join(process.cwd(), 'backups', timestamp);
  fs.mkdirSync(dir, { recursive: true });

  const db = mongoose.connection.db;
  const manifest = { createdAt: new Date().toISOString(), collections: {} };

  for (const name of COLLECTIONS) {
    const docs = await db.collection(name).find({}).toArray();
    const filePath = path.join(dir, `${name}.json`);
    fs.writeFileSync(filePath, EJSON.stringify(docs, null, 2));
    manifest.collections[name] = docs.length;
    console.log(`[backup] ${name}: ${docs.length} document(s) -> ${filePath}`);
  }

  fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.log(`[backup] manifest written -> ${path.join(dir, 'manifest.json')}`);
  return dir;
}

// Only auto-run when executed directly (`node scripts/backup.js`), not when
// imported by tests.
if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    await connectDB();
    await runBackup();
    await disconnectDB();
  })().catch((err) => {
    console.error('[backup] failed:', err);
    process.exit(1);
  });
}
