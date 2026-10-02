# Security Audit — my-portfolio2 backend

Date: 2026-09-30
Scope: `backend/` — Express API, auth, and data-access layer.

## 1. Dependency audit

```
npm audit
```

**Result: 0 vulnerabilities** across 133 resolved packages (112 production, 22 dev) at time of writing.

```
vulnerabilities: { info: 0, low: 0, moderate: 0, high: 0, critical: 0, total: 0 }
```

This is a point-in-time result — re-run `npm audit` on every dependency bump, and ideally wire it into CI (`npm audit --audit-level=high` failing the build) so new advisories are caught automatically rather than discovered later.

## 2. Controls implemented, and why

| Control | Where | What it protects against |
|---|---|---|
| **Password hashing** | `bcryptjs`, 12 salt rounds (`routes/auth.routes.js`) | Plaintext password exposure if the database is ever read by an attacker. Passwords are never logged or returned in any response. |
| **JWT auth** | `utils/jwt.js`, `middleware/auth.js` | Stateless session verification. Tokens are HS256-signed, expire after `JWT_EXPIRES_IN` (default 2h), and the secret is required at boot (the server refuses to start with a missing `JWT_SECRET` rather than silently signing with `undefined`). |
| **No self-promotion to admin** | `routes/auth.routes.js` (`registerSchema` has no `role` field) | A public registration request can never set its own role; every new account is `role: "user"`. Admins exist only via the seed script or a direct DB update. |
| **Admin-gated routes** | `middleware/auth.js` (`requireAdmin`), applied to all project/skill mutation and message-deletion routes | Write access to portfolio content and moderation is restricted to admin accounts, checked server-side on every request — never trusted from the client. |
| **Input validation (Zod)** | `schemas/*.js` + `middleware/validate.js`, applied to every route that accepts a body or query params | Rejects malformed/oversized/wrong-typed input before it reaches a database query, with field-level error messages instead of leaking internals. |
| **Helmet** | `src/app.js` | Sets standard hardening headers (`X-Content-Type-Options`, `X-Frame-Options`, restrictive default CSP primitives, removes `X-Powered-By`, etc.) — verified present in `tests/app.test.js`. |
| **CORS allowlist** | `src/app.js` (`CORS_ORIGIN` env var) | Only the configured frontend origin(s) can make credentialed cross-origin requests; everything else is rejected at the CORS layer. |
| **Rate limiting** | `middleware/rateLimiters.js` | Three tiers: general API (200/15min), auth endpoints (10/15min, slows credential stuffing/brute force), public-write endpoints — likes & guestbook messages (20/10min, raises the cost of spam). |
| **NoSQL injection defense** | `express-mongo-sanitize` in `src/app.js` | Strips `$`/`.`-prefixed keys from `body`/`query`/`params` before they can be interpreted as MongoDB operators (e.g. a login payload like `{ "email": { "$gt": "" } }`). |
| **Body size limit** | `express.json({ limit: '100kb' })` | Bounds request payload size, mitigating trivial memory-exhaustion DoS via oversized bodies. Verified with a 200KB payload returning `413` in `tests/app.test.js`. |
| **Schema validation at the DB layer** | `atlas/apply-validation.js` (native MongoDB `$jsonSchema`) | Defense-in-depth: even a write that bypasses Mongoose entirely (a bug, a script, direct `mongosh` access) is rejected by MongoDB itself if it doesn't match the schema. |
| **Race-proof endorsements** | `models/Like.js` unique compound index on `(projectId, visitorId)` | Guarantees at most one like per visitor per project even under concurrent requests — enforced atomically by the database, not by a "check-then-write" race in application code. See inline comment in `models/Like.js`. |
| **No stack traces in production** | `middleware/errorHandler.js` | `NODE_ENV=production` responses return a generic message; the real error is only logged server-side. |
| **Duplicate-email/like handled as 409, not 500** | `middleware/errorHandler.js` (MongoDB error code `11000`) | Predictable, non-leaky error responses for constraint violations. |
| **`select: false` on sensitive fields** | `passwordHash` (User), `ip` (Message) | These fields are excluded from query results by default; a route has to explicitly opt in (`.select('+passwordHash')`, used only in the login handler) to read them. |
| **`trust proxy` set explicitly** | `src/app.js` | Ensures rate limiting and `req.ip` see the real client IP behind Render's reverse proxy, rather than the proxy's own IP (which would make rate limiting useless). |

## 3. What was verified vs. what is a code-review claim

- **Verified by automated test** (`tests/app.test.js`, `tests/auth.test.js`, `tests/schemas.test.js`; all passing, see `npm test`): Helmet headers present, `X-Powered-By` absent, oversized-body rejection, validation-before-DB-access ordering, 401/403 behavior for missing/invalid/non-admin tokens, bcrypt hash/compare correctness, JWT tamper/foreign-secret rejection, and every Zod schema's accept/reject boundaries.
- **Verified by code review, not automated test**: CORS allowlist behavior (would need a real preflight from a real browser origin to fully exercise), the native MongoDB `$jsonSchema` validators in `atlas/apply-validation.js` (requires a live Atlas connection to apply and test — see "Before going live" below), and rate-limiter thresholds under real concurrent load.

## 4. Before going live (manual steps required — cannot be done from this environment)

1. **Run `npm run apply-validation`** against your real Atlas connection string once collections exist, and confirm with a manual bad-shaped `mongosh` insert that it's rejected.
2. **Generate a real `JWT_SECRET`** (`node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`) and set it in Render's environment — don't rely on the `render.yaml` placeholder default long-term rotation plan.
3. **Set `CORS_ORIGIN`** to your actual Vercel domain(s) — the default in `.env.example` is a placeholder.
4. **Change the seeded admin password** immediately after first login; `SEED_ADMIN_PASSWORD` is a bootstrap value, not meant to persist.
5. **Confirm MongoDB Atlas network access** is restricted appropriately (either Render's static outbound IPs if you're on a paid Render plan, or `0.0.0.0/0` only if you understand the tradeoff — free-tier Render has non-static egress IPs, which is the practical constraint here).
6. **Re-run `npm audit`** right before deploying, since new advisories can appear between when this was written and when you ship.

## 5. Known limitations / accepted risk (documented, not hidden)

- The rate limiter's default in-memory store resets on every server restart/redeploy and isn't shared across multiple instances. Fine for a single free-tier Render instance; if you ever scale to multiple instances, switch to a shared store (e.g. Redis-backed).
- `visitorId` (used for the race-proof like feature) is a client-generated value stored in `localStorage` — a visitor who clears storage or uses a different browser can like a project again. This is an accepted tradeoff for an anonymous, account-free endorsement feature; it is not meant to be Sybil-resistant.
- The guestbook has no content moderation beyond admin-triggered deletion (no profanity filter, no spam-classification). Rate limiting raises the cost of abuse but doesn't eliminate it.
