Adrianne Rhodes - August 2026

Project Title: MyPortfolio

This application uses React JS + Vite for the frontend and a Node/Express + MongoDB Atlas backend for projects, skills, a guestbook, endorsements, and admin auth.

Live Link: https://my-portfolio2-nine-jet.vercel.app/

The purpose of this project is to display a digital portfolio of my previous work that was created while participating in the Mississippi Coding Academy.

Future Improvements: In my opinion, the site could have a different layout for the projects page. Each project may have a thumbnail image of the site added as a preview before users click on it.

Disclaimer: AI was used to aid in the creation of this application; specifically Google Gemini AI and Claude AI.

---

## Architecture overview

This is now a two-part app:

- **`my-portfolio2/`** (this directory) — the React 19 + Vite + Tailwind CSS v4 frontend, deployed to **Vercel**.
- **`backend/`** — a Node/Express + MongoDB Atlas API, deployed to **Render**. See `backend/README.md` for the full API reference, `backend/SECURITY.md` for the security audit, `backend/BACKUP_RESTORE.md` for backup/restore, and `backend/DEPLOYMENT.md` for exact deploy steps.

```
my-portfolio2/          # frontend (this README)
  src/
    main.jsx             # mounts the app: ThemeProvider > AuthProvider > App
    App.jsx               # BrowserRouter + routes
    lib/api.js             # fetch wrapper to the backend, auto-attaches JWT
    context/
      ThemeContext.jsx      # light/dark theme (unchanged from before)
      AuthContext.jsx         # session state: login/register/logout, current user
    components/
      Navbar.jsx                # nav + auth-aware links + theme toggle
      RequireAdmin.jsx           # client-side guard for /admin (server enforces the real rule)
      LikeButton.jsx               # race-proof endorsement button
    views/
      Home.jsx                     # hero + featured projects (now from the API, not hardcoded)
      Experience.jsx                 # skills (now searchable/sortable via the API) + local timeline
      Projects.jsx                    # unchanged: live GitHub repo feed via useFetch
      Guestbook.jsx                     # NEW: public message board
      Login.jsx / Register.jsx            # NEW: auth forms
      Admin.jsx                             # NEW: admin-only CRUD for projects & skills
      Contact.jsx                            # unchanged: controlled form, client-side only

backend/                 # Express + MongoDB Atlas API — see backend/README.md
```

## What moved to MongoDB, and what didn't

- **Projects**: the "Featured Projects" block on the Home page was previously a single hardcoded object in `Home.jsx`. It's now a `Project` document in MongoDB, fetched via `GET /api/projects`, with an admin-only create/edit/delete flow (`/admin`) and a race-proof like/endorsement button on each one.
- **Skills**: the skill-tag groups on the Experience page were previously a hardcoded array. They're now `Skill` documents, fetched via `GET /api/skills?search=&sort=&order=`, with a search box and sort control on the page itself.
- **Not moved — the live GitHub feed on `/Projects`**: that page already fetches your public repos live from the GitHub API via `useFetch`; it was already dynamic, not hardcoded, so it's untouched.
- **New, not a migration**: the guestbook (`Message` documents), user accounts (`User` documents, bcrypt + JWT), and endorsements (`Like` documents) are new features, not things that existed before as hardcoded data.

## Auth & admin

- Anyone can register/log in (`/register`, `/login`). New accounts are always `role: "user"` — nobody can self-promote to admin through the API.
- An admin account is created once via `backend/scripts/seed.js` (see `backend/.env.example` for `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD`).
- `/admin` (CRUD for projects & skills) is gated client-side by `RequireAdmin`, but the real enforcement is server-side (`requireAdmin` middleware on every admin route) — the client-side check is just so non-admins don't see a confusing UI, not the actual security boundary.
- Guestbook message deletion (moderation) happens inline on the `/guestbook` page for logged-in admins.

## Local development (both halves)

```bash
# Backend
cd backend
npm install
cp .env.example .env            # fill in MONGODB_URI, JWT_SECRET, etc. — see backend/DEPLOYMENT.md
npm run apply-validation
npm run seed
npm run dev                      # http://localhost:5000

# Frontend (separate terminal)
cd my-portfolio2
npm install
cp .env.example .env              # VITE_API_URL=http://localhost:5000
npm run dev                        # http://localhost:5173
```

## Data-flow logic (frontend)

Unchanged from before for theme (`ThemeContext`) and the GitHub feed (`useFetch` in `Projects.jsx`) — see the "Hook cycle setup" section below. What's new:

- **`AuthContext`** mirrors `ThemeContext`'s pattern: one provider at the top of the tree (`main.jsx`), one `useAuth()` hook as the sanctioned way to read it. On mount, it checks for a stored JWT and calls `GET /api/auth/me` to restore the session (or clears the token if it's invalid/expired) — this is the one effect in the app that talks to the network before any user interaction.
- **`Home.jsx`** and **`Experience.jsx`** now each have their own `useEffect` that calls the API (`listProjects()`, `listSkills()`) on mount; `Experience.jsx`'s additionally re-runs (debounced 250ms) whenever `search`, `sort`, or `order` change, since those are now server-side query parameters rather than a client-side array filter.
- **`LikeButton`** calls `POST /api/projects/:id/like` with a per-browser `visitorId` (a UUID generated once and cached in `localStorage`). The actual race-proofing (so the same visitor can't double-count under concurrent requests) is enforced by a unique database index on the backend, not by anything in this component — see `backend/src/models/Like.js`.

## Hook cycle setup — unchanged pieces

`ThemeProvider`'s effect cycle and `useFetch`'s effect cycle are exactly as documented in earlier versions of this README: `ThemeProvider` toggles the `dark` class and persists to `localStorage` on `isDark` change only; `useFetch` (used only by the GitHub feed on `/Projects`) fires once per URL and guards against setting state after unmount.

## Self-audit (updated)

### Backend
See `backend/SECURITY.md` for the full write-up. Summary: `npm test` → 31/31 passing (Zod schema boundaries, bcrypt/JWT correctness, Helmet/CORS/rate-limit/validation wiring against a real running Express instance, and backup/restore round-trip logic). `npm audit` → 0 vulnerabilities.

### Frontend
1. **Production build** (`npm run build`): passed, 0 errors.
2. **Lint** (`npm run lint`): 0 errors, 8 warnings — all pre-existing-style issues (unused imports, a Fast-Refresh advisory to split `ThemeContext`'s `createContext()` into its own file, and a `set-state-in-effect` style note on `Experience.jsx`/`useFetch.jsx` that's consistent with this codebase's existing pattern, not a new category of problem).
3. **Runtime audit (console errors / infinite re-render loops)**: every route (`/`, `/Experience`, `/Projects`, `/Guestbook`, `/Contact`, `/Login`, `/Register`, `/Admin`) was rendered headlessly (real Vite+React build, jsdom, mocked API responses) and watched with a `MutationObserver` across two consecutive idle windows. Every route settled to 0 mutations in both idle windows except `/Experience`, which showed a one-time batch of mutations in the first idle window and 0 in the second — confirmed to be a single delayed settle (the debounced skills search finishing late under this specific test harness's `act()`/timer interaction), not a continuing loop. That delay is an artifact of the deprecated `react-dom/test-utils` `act()` helper's interaction with jsdom's timer scheduling in this headless harness specifically — it doesn't occur in a real browser, which never uses `act()` at all. No console errors or warnings were produced by application code in either configuration.
