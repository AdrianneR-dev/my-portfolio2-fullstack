# my-portfolio2 — backend

Express + MongoDB (Atlas) API for the portfolio's projects, skills, guestbook, endorsements, and auth. See `../README.md` for the overall project, `SECURITY.md` for the security audit, `BACKUP_RESTORE.md` for backup/restore, and `DEPLOYMENT.md` for deploying to Render + Atlas.

## Local setup

```bash
cd backend
npm install
cp .env.example .env   # then fill in MONGODB_URI, JWT_SECRET, etc.
npm run apply-validation   # applies native MongoDB schema validation (run once, safe to re-run)
npm run seed                # seeds projects, skills, and a bootstrap admin
npm run dev                  # starts the API on PORT (default 5000) with auto-reload
```

```bash
npm test       # unit + integration tests (no live DB required — see SECURITY.md/BACKUP_RESTORE.md for what is/isn't covered by these)
npm run backup                 # snapshot the DB to backend/backups/<timestamp>/
npm run restore <backup-dir>   # restore a snapshot (upsert by default; --wipe to replace)
```

## API

All responses are JSON. Protected routes require `Authorization: Bearer <token>`.

### Auth
| Method | Path | Auth | Body |
|---|---|---|---|
| POST | `/api/auth/register` | — | `{ email, password }` → `{ token, user }` |
| POST | `/api/auth/login` | — | `{ email, password }` → `{ token, user }` |
| GET | `/api/auth/me` | user | — → `{ user }` |

### Projects
| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/api/projects` | — | List all, each with `likeCount` |
| GET | `/api/projects/:id` | — | Single project with `likeCount` |
| POST | `/api/projects/:id/like` | — | Body `{ visitorId }`. Race-proof (see `models/Like.js`); returns `{ liked, alreadyLiked, likeCount }` |
| POST | `/api/projects` | admin | Create |
| PUT | `/api/projects/:id` | admin | Update (partial) |
| DELETE | `/api/projects/:id` | admin | Delete (and its likes) |

### Skills
| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/api/skills?search=&sort=name\|category\|level\|order&order=asc\|desc` | — | Searchable + sortable |
| POST | `/api/skills` | admin | Create |
| PUT | `/api/skills/:id` | admin | Update (partial) |
| DELETE | `/api/skills/:id` | admin | Delete |

### Guestbook messages
| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/api/messages` | — | Most recent 200 |
| POST | `/api/messages` | — | Body `{ name, message }`, rate-limited |
| DELETE | `/api/messages/:id` | admin | Moderation |

### Misc
| Method | Path | Notes |
|---|---|---|
| GET | `/health` | Used by Render's health check |

## Project structure

```
backend/
  server.js               # entry point
  src/
    app.js                # Express app: helmet, cors, rate limiting, sanitize, routes
    config/db.js           # Mongoose connection
    models/                # Project, Skill, Message, User, Like (all custom string _id)
    schemas/                # Zod request/query schemas
    middleware/              # validate, auth (requireAuth/requireAdmin), rate limiters, error handler
    routes/                   # auth, projects, skills, messages
    utils/                     # customId (nanoid), jwt
  scripts/
    seed.js                    # idempotent seed: projects, skills, bootstrap admin
    backup.js / restore.js      # EJSON-based backup/restore (no external DB tools needed)
  atlas/
    apply-validation.js          # applies native MongoDB $jsonSchema validators
  tests/                          # node:test — schemas, auth, app wiring, backup/restore
```
