# Backup & Restore

`scripts/backup.js` and `scripts/restore.js` use the MongoDB Node driver directly (via the existing Mongoose connection) rather than the external `mongodump`/`mongorestore` binaries — no extra system tools to install, and it works anywhere Node runs, including Render.

## How it works

- **Backup** reads every document from each of the 5 application collections (`projects`, `skills`, `messages`, `users`, `likes`) and writes each to its own file as [EJSON](https://www.mongodb.com/docs/manual/reference/mongodb-extended-json/) (MongoDB's Extended JSON), under `backups/<ISO-timestamp>/`, plus a `manifest.json` recording the document count per collection. EJSON is used instead of plain `JSON.stringify` specifically so `Date` values and other BSON types round-trip exactly, rather than degrading into plain strings.
- **Restore** reads a backup directory and **upserts every document by `_id`** into the target database by default — safe to re-run, and it will not touch unrelated documents already in the target collection. Pass `--wipe` to instead delete all existing documents in each collection before restoring, for a "reset to exactly this snapshot" restore.

## Commands

```bash
# Back up the database pointed to by MONGODB_URI in your .env
npm run backup
# -> writes to backend/backups/<timestamp>/

# Restore into whatever database MONGODB_URI currently points to
npm run restore backups/2026-09-30T12-00-00-000Z

# Restore, first wiping each collection (use with care — this deletes existing data)
npm run restore backups/2026-09-30T12-00-00-000Z -- --wipe
```

**Point `MONGODB_URI` at a scratch/staging database before testing `restore`, especially with `--wipe`.** Restoring into production should be a deliberate, verified action, not something run by habit.

## What has been tested, and how

This sandbox has no network access to download or run a real MongoDB server, so a live Atlas round-trip couldn't be executed here. What **was** run and is passing (`npm test`, see `tests/backup-restore.test.js`):

1. `runBackup()` writes one JSON file per collection plus a `manifest.json`, with correct per-collection counts.
2. Backed-up files use real EJSON (`{"$date": "..."}` wrappers are present in the output, not plain ISO strings) — confirmed by parsing the file back and checking the result is a real `Date` instance with the exact original timestamp.
3. `runRestore()` **upserts** by `_id` — restoring into a database that already has an unrelated document leaves that document alone and adds the restored one (doesn't replace the whole collection).
4. `runRestore(dir, { wipe: true })` clears each collection before restoring, verified by seeding a target with a stale document first and confirming it's gone afterward.

This was done against an in-memory fake standing in for the MongoDB driver's `collection().find/deleteMany/replaceOne` — it proves the backup/restore *logic* is correct (serialization, upsert semantics, the wipe path), but it is **not** a substitute for exercising the real MongoDB wire protocol, real BSON encoding on the server side, or real index/constraint behavior during a restore.

## Required before you trust this in production

Run this once against your actual Atlas cluster before relying on it for real disaster recovery:

1. `npm run backup` against your real (or a staging clone of your real) `MONGODB_URI`.
2. Inspect `manifest.json` — do the counts match what you expect (e.g. via Atlas's own collection count in the UI)?
3. `npm run restore <that-backup-dir> -- --wipe` against a **separate scratch database** (not the one you just backed up from — create a second Atlas database in the same or a throwaway cluster for this).
4. Confirm document counts and spot-check a few documents (especially dates and the custom string `_id`s) match the original.
5. Only after that manual verification should you treat `npm run backup` as your real recovery mechanism, and consider scheduling it (e.g. a Render Cron Job or GitHub Action hitting a protected backup-trigger endpoint, or simply running it locally on a cadence) with the output stored somewhere durable outside the database itself (e.g. committed to a private backup repo, or uploaded to cloud storage) — the `backups/` directory here is local disk only and is *not* itself durable storage.

## Restore runbook (for an actual incident)

1. Stop writes if possible (put the Render service in maintenance, or scale it to 0).
2. Identify the most recent good backup directory.
3. `npm run restore <dir>` (upsert mode first — it's non-destructive to anything not in the backup).
4. Spot-check the app against the restored data.
5. Only use `--wipe` if you specifically need to discard data written *after* the backup was taken (e.g. reverting a bad migration) — understand that it is destructive to anything not in the snapshot.
