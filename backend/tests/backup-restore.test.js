/**
 * These tests verify the backup/restore *logic* — serialization, file
 * layout, upsert-by-_id semantics, and the --wipe path — against an in-memory
 * fake standing in for the MongoDB driver. This sandbox has no network
 * access to a real MongoDB server (Atlas or otherwise) to download and run
 * one against, so this is what's testable here.
 *
 * Before trusting this against production data: run `npm run backup` once
 * against your real Atlas cluster, then `npm run restore <dir>` against a
 * scratch/staging database and confirm document counts match. That
 * live round-trip is documented as a required manual step in
 * BACKUP_RESTORE.md — it is NOT what this automated test covers.
 */
import { test, describe, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import mongoose from 'mongoose';

let runBackup, runRestore;

// A minimal fake standing in for a MongoDB `Db` — just enough surface area
// (`collection(name).find/deleteMany/replaceOne`) for backup.js/restore.js.
function makeFakeDb(initialData = {}) {
  const store = new Map(Object.entries(initialData).map(([k, v]) => [k, [...v]]));

  return {
    collection(name) {
      if (!store.has(name)) store.set(name, []);
      return {
        find() {
          return { toArray: async () => store.get(name).map((d) => ({ ...d })) };
        },
        async deleteMany() {
          store.set(name, []);
        },
        async replaceOne(filter, doc, opts) {
          const arr = store.get(name);
          const idx = arr.findIndex((d) => d._id === filter._id);
          if (idx >= 0) {
            arr[idx] = doc;
          } else if (opts?.upsert) {
            arr.push(doc);
          }
        },
      };
    },
    _dump() {
      return Object.fromEntries(store.entries());
    },
  };
}

before(async () => {
  ({ runBackup } = await import('../scripts/backup.js'));
  ({ runRestore } = await import('../scripts/restore.js'));
});

describe('backup/restore round trip (mocked driver)', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'backup-test-'));
  });

  after(() => {
    // best-effort cleanup of the connection mock between describe blocks
  });

  test('backup writes one JSON file per collection plus a manifest', async () => {
    const fakeDb = makeFakeDb({
      projects: [{ _id: 'prj_1', title: 'Test Project', createdAt: new Date('2026-01-01') }],
      skills: [{ _id: 'skl_1', name: 'JavaScript' }],
      messages: [],
      users: [{ _id: 'usr_1', email: 'a@b.com', passwordHash: 'hash', role: 'admin' }],
      likes: [{ _id: 'lik_1', projectId: 'prj_1', visitorId: 'visitor-abc' }],
    });
    mongoose.connection.db = fakeDb;

    const outDir = path.join(tmpDir, 'snapshot');
    await runBackup({ outDir });

    for (const name of ['projects', 'skills', 'messages', 'users', 'likes']) {
      assert.ok(fs.existsSync(path.join(outDir, `${name}.json`)), `${name}.json should exist`);
    }
    const manifest = JSON.parse(fs.readFileSync(path.join(outDir, 'manifest.json'), 'utf8'));
    assert.equal(manifest.collections.projects, 1);
    assert.equal(manifest.collections.skills, 1);
    assert.equal(manifest.collections.messages, 0);
  });

  test('backup preserves Date types via EJSON (not just stringified)', async () => {
    const created = new Date('2026-03-15T10:00:00.000Z');
    const fakeDb = makeFakeDb({
      projects: [{ _id: 'prj_1', title: 'Dated', createdAt: created }],
      skills: [],
      messages: [],
      users: [],
      likes: [],
    });
    mongoose.connection.db = fakeDb;

    const outDir = path.join(tmpDir, 'snapshot-dates');
    await runBackup({ outDir });

    const raw = fs.readFileSync(path.join(outDir, 'projects.json'), 'utf8');
    // EJSON represents dates as { "$date": "..." }, proving it's not plain JSON.stringify
    assert.ok(raw.includes('$date'), 'expected EJSON date wrapper in backup file');

    const { EJSON } = await import('bson');
    const parsed = EJSON.parse(raw);
    assert.ok(parsed[0].createdAt instanceof Date);
    assert.equal(parsed[0].createdAt.toISOString(), created.toISOString());
  });

  test('restore upserts by _id without wiping existing unrelated documents', async () => {
    const backupDb = makeFakeDb({
      projects: [{ _id: 'prj_1', title: 'From Backup' }],
      skills: [],
      messages: [],
      users: [],
      likes: [],
    });
    mongoose.connection.db = backupDb;
    const outDir = path.join(tmpDir, 'to-restore');
    await runBackup({ outDir });

    // Simulate a target DB that already has a *different* document.
    const targetDb = makeFakeDb({
      projects: [{ _id: 'prj_existing', title: 'Already There' }],
      skills: [],
      messages: [],
      users: [],
      likes: [],
    });
    mongoose.connection.db = targetDb;

    await runRestore(outDir, { wipe: false });

    const finalProjects = targetDb._dump().projects;
    const ids = finalProjects.map((p) => p._id).sort();
    assert.deepEqual(ids, ['prj_1', 'prj_existing'], 'restore should upsert, not replace the whole collection');
  });

  test('restore with --wipe clears the collection before restoring', async () => {
    const backupDb = makeFakeDb({
      projects: [{ _id: 'prj_1', title: 'From Backup' }],
      skills: [],
      messages: [],
      users: [],
      likes: [],
    });
    mongoose.connection.db = backupDb;
    const outDir = path.join(tmpDir, 'to-restore-wipe');
    await runBackup({ outDir });

    const targetDb = makeFakeDb({
      projects: [{ _id: 'prj_stale', title: 'Should be wiped' }],
      skills: [],
      messages: [],
      users: [],
      likes: [],
    });
    mongoose.connection.db = targetDb;

    await runRestore(outDir, { wipe: true });

    const finalProjects = targetDb._dump().projects;
    assert.deepEqual(finalProjects.map((p) => p._id), ['prj_1']);
  });
});
