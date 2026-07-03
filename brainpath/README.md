# BrainPath — Frontend & Backend Skeletons

## Structure
```
brainpath/
├── client/   # React (Vite) PWA — Tailwind v4, Dexie, Serwist, React Router
└── server/   # Express API — pg (Postgres/Supabase), CORS, Helmet, Morgan
```

## Backend — `server/`
```bash
cd server
npm install
cp .env.example .env     # fill in your Supabase DATABASE_URL
npm run dev               # http://localhost:5000
```
Check it's alive: `curl http://localhost:5000/api/health`

## Frontend — `client/`
```bash
cd client
npm install
cp .env.example .env      # points at your local API by default
npm run dev                # http://localhost:5173
```
This opens a status page confirming: API reachability, Dexie (offline cache), and network connection hints.

To test the actual PWA/service worker behavior, use a production build instead — Serwist's
service worker isn't active under `npm run dev`:
```bash
npm run build
npm run preview            # http://localhost:4173
```

## What's already wired
- **Backend:** layered route → controller → db pattern (see `courses.routes.js` /
  `courses.controller.js`) — copy this pattern for auth, lessons, progress, etc.
- **Frontend:** Tailwind v4 theme tokens set to the BrainPath palette (`bg-brand-blue`,
  `text-brand-emerald`, `border-brand-amber`), Dexie schema with a `synced` flag + `syncQueue`
  table ready for offline writes, and a `getConnectionHint()` helper for `navigator.connection`
  (returns `null` gracefully on Safari/iOS — handle that case in the UI).

## Not done yet — next sprint
- Auth (JWT) routes + middleware
- Postgres schema migration (courses/lessons/progress/quizzes tables)
- Offline sync queue draining logic (write → queue → flush on reconnect)
- Cloudinary upload/playback wiring
- Jitsi live class embed
