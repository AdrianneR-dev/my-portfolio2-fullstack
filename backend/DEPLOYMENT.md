# Deployment — Atlas + Render + Vercel

I can't create accounts or click buttons in your Atlas/Render/Vercel dashboards for you, but everything the code needs is ready — here's exactly what to do.

## 1. MongoDB Atlas

1. Create a free (M0) cluster at https://cloud.mongodb.com if you don't have one.
2. **Database Access** → add a database user with a strong generated password (not your Atlas login password).
3. **Network Access** → add an IP allowlist entry. For Render's free tier (non-static outbound IPs), use `0.0.0.0/0` (allow from anywhere) and rely on the database user's password + your app-level auth for protection; if you're on a paid Render plan with static outbound IPs, allowlist those instead.
4. **Database** → Connect → Drivers → copy the connection string. It looks like:
   `mongodb+srv://<user>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority`
   Add your database name before the `?`, e.g. `.../my-portfolio2?retryWrites=true...`.
5. Locally, put that in `backend/.env` as `MONGODB_URI`, then run:
   ```bash
   cd backend
   npm run apply-validation   # applies native schema validation to each collection
   npm run seed                # creates projects, skills, and your bootstrap admin
   ```

## 2. Backend on Render

1. Push this repo to GitHub (backend included).
2. In Render: **New +** → **Blueprint**, point it at your repo. Render will read `backend/render.yaml` — if Render doesn't auto-detect it, create the service manually as a **Web Service** with:
   - Root directory: `backend`
   - Build command: `npm install`
   - Start command: `npm start`
   - Health check path: `/health`
3. Set environment variables in the Render dashboard (the ones marked `sync: false` in `render.yaml` won't be filled automatically):
   - `MONGODB_URI` — from step 1
   - `JWT_SECRET` — Render can auto-generate this (see `render.yaml`), or set your own
   - `CORS_ORIGIN` — your Vercel URL, e.g. `https://my-portfolio2.vercel.app` (add `http://localhost:5173` too if you want local frontend dev to work against the deployed backend)
   - `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` — only needed if you plan to run `npm run seed` against production from your machine with the production `MONGODB_URI`
4. Deploy. Confirm `https://<your-service>.onrender.com/health` returns `{"ok": true}`.
5. Free-tier Render services spin down after inactivity — the first request after idle will be slow (cold start). That's expected, not a bug.

## 3. Frontend on Vercel

1. In Vercel: **New Project** → import the repo, root directory `my-portfolio2` (the frontend, not `backend/`).
2. Framework preset: Vite (auto-detected).
3. Environment variable: `VITE_API_URL` = your Render backend URL, e.g. `https://my-portfolio2-backend.onrender.com`.
4. Deploy. `vercel.json` already has the SPA rewrite so client-side routes (e.g. `/Projects`, `/Guestbook`) work on refresh/direct link.
5. Go back to Render and make sure `CORS_ORIGIN` includes this exact Vercel URL (no trailing slash) — until it does, the deployed frontend's API calls will be rejected by CORS.

## 4. Smoke test after both are live

- Visit the Vercel URL, confirm Home/Projects/Experience/Guestbook load data from the API (open devtools Network tab, confirm requests go to your Render URL and return 200).
- Register a normal account, confirm you can log in.
- Log in as the seeded admin, confirm admin-only actions work (create/edit/delete a project or skill, delete a guestbook message) and that a non-admin account gets rejected from those same actions.
- Like a project twice from the same browser, confirm the second attempt reports "already liked" rather than double-counting.
- Post a guestbook message, confirm it's rate-limited after repeated rapid submissions.

## 5. Ongoing

- Rotate `JWT_SECRET` if you ever suspect it leaked (this invalidates all existing sessions — acceptable for a portfolio site).
- Run `npm run backup` periodically (see `BACKUP_RESTORE.md`) and store the output somewhere durable outside of Render's local, ephemeral disk.
- Re-run `npm audit` before each deploy.
