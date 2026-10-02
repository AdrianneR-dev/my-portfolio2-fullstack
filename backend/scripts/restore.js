/**
 * Restores collections from a backup directory produced by scripts/backup.js.
 *
 * By default this UPSERTS by _id (safe to re-run, never duplicates), which is
 * almost always what you want for disaster recovery onto a live cluster.
 * Pass --wipe to instead drop each collection before restoring, for
 * "reset to exactly this snapshot" restores (e.g. rebuilding a staging DB).
 *
 * Usage:
 *   node scripts/restore.js ./backups/2026-08-05T12-00-00-000Z
 *   node scripts/restore.js ./backups/2026-08-05T12-00-00-000Z --wipe
 */
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { EJSON } from 'bson';
import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../src/config/db.js';

const COLLECTIONS = ['projects', 'skills', 'messages', 'users', 'likes'];

export async function runRestore(backupDir, { wipe = false } = {}) {
  if (!backupDir || !fs.existsSync(backupDir)) {
    throw new Error(`Backup directory not found: ${backupDir}`);
  }

  const db = mongoose.connection.db;
  const summary = {};

  for (const name of COLLECTIONS) {
    const filePath = path.join(backupDir, `${name}.json`);
    if (!fs.existsSync(filePath)) {
      console.log(`[restore] ${name}: no backup file found, skipping.`);
      continue;
    }

    const docs = EJSON.parse(fs.readFileSync(filePath, 'utf8'));

    if (wipe) {
      await db.collection(name).deleteMany({});
    }

    let restored = 0;
    for (const doc of docs) {
      await db.collection(name).replaceOne({ _id: doc._id }, doc, { upsert: true });
      restored += 1;
    }

    summary[name] = restored;
    console.log(`[restore] ${name}: restored ${restored} document(s)${wipe ? ' (collection wiped first)' : ''}`);
  }

  return summary;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const backupDir = process.argv[2];
  const wipe = process.argv.includes('--wipe');

  if (!backupDir) {
    console.error('Usage: node scripts/restore.js <backup-dir> [--wipe]');
    process.exit(1);
  }

  (async () => {
    await connectDB();
    await runRestore(backupDir, { wipe });
    await disconnectDB();
  })().catch((err) => {
    console.error('[restore] failed:', err);
    process.exit(1);
  });
}
