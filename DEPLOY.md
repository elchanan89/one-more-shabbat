# Deployment (Railway)

The app runs as a **single service**: the Express backend serves both the REST API
(`/api/*`) and the compiled Angular app (everything else). One domain, no CORS in prod.

## How Railway builds & runs it

`railway.json` already configures everything:

| Phase | Command | What it does |
|-------|---------|--------------|
| Build | `npm run build` | installs deps for `frontend` + `backend` (incl. dev deps), builds the Angular app, compiles the TypeScript backend |
| Start | `npm start` | `node backend/dist/app.js` — serves API + static frontend |
| Health| `GET /health` | returns `{ "status": "ok" }` |

Node version is pinned to 20 (`.nvmrc` + `engines`).

## Steps

1. Push this repo to GitHub (already done).
2. In Railway: **New Project → Deploy from GitHub repo** → pick `one-more-shabbat`.
3. (Optional) choose the branch (e.g. `VERSION_1_QA` or `main`).
4. Railway reads `railway.json`, builds, and deploys. No build/start config needed by hand.
5. Open the generated domain — the app loads, the API is on the same origin.

## Environment variables

| Var | Required | Notes |
|-----|----------|-------|
| `PORT` | no | Provided automatically by Railway; the server reads it. |
| `DATA_DIR` | recommended for persistence | Absolute path where JSON data lives. Set this to a mounted **Volume** path (e.g. `/data`). If unset, data lives in `backend/data` which is **ephemeral** on Railway (wiped on each deploy/restart). |

## Data persistence

The JSON store is a file. Railway's container filesystem is ephemeral, so **without a
volume, data resets on every deploy/restart**:

- **History** re-seeds from `backend/seed/history.json` (the 22 records, "as it is now").
- **Shabbatot** are regenerated empty for the current Hebrew year, then auto-populate
  parasha/dates — **user selections are lost**.

### To keep selections across deploys (recommended)

1. In Railway: **Add Volume**, mount path `/data`.
2. Add variable `DATA_DIR=/data`.

Then on first boot the volume is empty → history seeds from `backend/seed/` once and
persists; shabbatot generates once and persists. Passed Shabbatot with a selection are
appended to history automatically on each startup (deduped by date).

> To refresh the seed history later, edit `backend/seed/history.json` and (if using a
> volume) delete `/data/history.json` so it re-seeds.

## Local development

```bash
npm run install:all     # install both projects
npm run dev:backend     # API on :3000  (ts-node-dev, hot reload)
npm run dev:frontend    # Angular on :4200  (proxies /api → :3000)
```

Open http://localhost:4200. The dev server proxies `/api` to the backend via
`frontend/proxy.conf.json`, so the same relative API URLs work in dev and prod.

## Production build locally

```bash
npm run build           # build frontend + backend
npm start               # serves everything on :3000
```
