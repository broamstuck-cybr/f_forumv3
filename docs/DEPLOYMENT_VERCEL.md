# F-FORUM v3 — Vercel Deployment Guide (`fforum`)

This guide covers deploying F-FORUM v3 to a new Vercel project named `fforum` without altering any existing deployments, configuring required environment variables, and verifying production security.

## 1. Dual-Runtime Architecture Overview

F-FORUM v3 is engineered to run identically in local development and on Vercel:

- **Static SPA Bundle (`./dist`)**: Built by `npm run build` (`tsc -b && vite build`) and served by Vercel's edge CDN.
- **Serverless API Functions (`./api`)**:
  - `api/health.ts` -> `GET /api/health`
  - `api/ai/chat.ts` -> `POST /api/ai/chat`
  - `api/ai/quota.ts` -> `GET /api/ai/quota`
  - `api/auth/[action].ts` -> `GET /api/auth/me`, `POST /api/auth/login`, `POST /api/auth/register`, `POST /api/auth/admin-login`, `POST /api/auth/logout`
  - `api/admin/[action].ts` -> `GET /api/admin/state`, `GET|POST /api/admin/changelog`, `POST /api/admin/gateway`, `POST /api/admin/moderate`, `POST /api/admin/reset-quota`, `POST /api/admin/toggle-role`
  - `api/community/[action].ts` -> `GET /api/community/list`, `POST /api/community/create`, `POST /api/community/upvote`, `POST /api/community/answer`, `POST /api/community/accept`, `POST /api/community/fork`, `POST /api/community/dossier`, `POST /api/community/report`
  - `api/projects/[action].ts` -> `GET /api/projects/list`, `POST /api/projects/sync`, `POST /api/projects/delete` (authenticated users only)
- **Persistence**: Supabase PostgreSQL when `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set, otherwise a local JSON store under `./data` (local development only). `GET /api/health` reports the active mode in the `persistence` field (`supabase` or `local-json`).
- **Routing & Headers (`./vercel.json`)**: Routes `/api/*` requests to the serverless handlers and rewrites all other application paths (`/`, `/home`, `/explore`, `/workspace`, `/community`, `/settings`, `/admin`) to `/index.html` with strict security headers (`X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: strict-origin-when-cross-origin`).

## 2. Step-by-Step Deployment to a New Vercel Project (`fforum`)

### Step 2.1 — Pre-Deployment Verification

Before pushing to GitHub or deploying to Vercel, run the local verification suite from the project root:

```bash
npm run typecheck
npm test
npm run build
```

Verify that `.env` and `data/` are excluded by `.gitignore` and that `git status -u` contains zero untracked secret files.

### Step 2.2 — Push to the Target GitHub Repository

Initialize or push the verified repository to your clean GitHub remote (`https://github.com/broamstuck-cybr/f_forumv3.git`):

```bash
git remote -v
git push -u origin main
```

### Step 2.3 — Provision Supabase (one time)

Vercel Functions have no durable disk, so production accounts, quotas, community posts, moderation, audit logs, changelog and per-user workspace projects must live in Supabase.

1. Create a new project in the Supabase Dashboard and wait for provisioning to finish.
2. Open **Supabase Dashboard -> SQL Editor**, paste the full contents of `./supabase/schema.sql`, and run it once. The script creates all 8 tables and enables Row Level Security on each.
3. Copy the project URL and the `service_role` key from **Project Settings -> API**.
4. Verify locally with the same two values exported in your shell or placed in an untracked `.env`:

```bash
node scripts/verify-supabase.mjs
```

The script must report these tables as present with RLS enabled: `ff_users`, `ff_quotas`, `ff_community_posts`, `ff_community_reports`, `ff_admin_config`, `ff_audit_logs`, `ff_changelog`, `ff_projects`. If any table is missing, re-run `./supabase/schema.sql` in the SQL Editor.

### Step 2.4 — Create the `fforum` Project in Vercel

1. Sign in to the target Vercel account and click **Add New... -> Project**.
2. Import the `broamstuck-cybr/f_forumv3` GitHub repository.
3. Set the **Project Name** explicitly to `fforum` (creating an isolated project that does not touch any legacy project or domain).
4. Confirm the build settings (auto-detected from `package.json` and `vercel.json`):
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### Step 2.5 — Configure Required Environment Variables

In the Vercel project settings (**Settings -> Environment Variables**), configure the following variables for **Production**, **Preview**, and **Development**:

| Variable | Value Format | Notes |
|---|---|---|
| `AI_API_KEY` | Upstream provider secret key | Never expose in `VITE_*` client variables. Read only by `./server/aiEngine.ts`. |
| `AI_PROTOCOL` | `openai-compatible` (or `anthropic` / `gemini`) | Matches your upstream provider protocol. |
| `AI_BASE_URL` | `https://api.openai.com/v1` | Upstream API base URL. |
| `AI_MODEL` | `gpt-4o-mini` | Default model identifier for Workspace generation. |
| `ADMIN_USERNAME` | `admin` | Administrator login username for `/admin`. |
| `ADMIN_PASSWORD_HASH` | `<salt>:<scrypt-hex-hash>` | Generate locally using Node `crypto.scryptSync` (see Section 3 below). Do not use `ADMIN_BOOTSTRAP_PASSWORD` in production. |
| `SESSION_SECRET` | 32+ byte random hex string | Generate via `openssl rand -hex 32`. Signs `HttpOnly` session cookies. |
| `SUPABASE_URL` | `https://<project-ref>.supabase.co` | Server-only. Never prefix with `VITE_`. |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase `service_role` key | Server-only. Bypasses RLS, so never prefix with `VITE_` and never commit it. |

Use a freshly rotated value for `AI_API_KEY`; do not reuse any key that was shared or used during development.

### Step 2.6 — Deploy and Verify Endpoints

1. Deploy from the dashboard, or from the CLI using the target Vercel account:

```bash
vercel login
vercel link --project fforum
vercel
vercel --prod
```

`vercel` creates a Preview deployment for testing; `vercel --prod` promotes a Production deployment.

2. Once deployed, verify the health endpoint and route rewrites:

```bash
curl -s https://fforum.vercel.app/api/health
curl -s https://fforum.vercel.app/api/ai/quota
```

The health response must contain `"persistence":"supabase"`. A value of `local-json` means `SUPABASE_URL` or `SUPABASE_SERVICE_ROLE_KEY` is missing in the Vercel environment.

3. Open `https://fforum.vercel.app/` in a browser and confirm:
   - `/` renders the Legacy Editorial Landing Page.
   - `/home`, `/explore`, `/workspace`, and `/community` load the 4-tab application shell with zero console errors.
   - Standard Guest / User sessions display a `15` turn limit (`15 / 15`).
   - Signing in at `/admin` with `ADMIN_USERNAME` and the production admin password unlocks `UNLIMITED` quota mode and the Admin Control Plane.

## 3. Generating `ADMIN_PASSWORD_HASH` and `SESSION_SECRET`

Run the following one-liner locally to generate a cryptographically salted `scrypt` password hash for `ADMIN_PASSWORD_HASH` and a random `SESSION_SECRET`:

```bash
node -e '
const crypto = require("crypto");
const password = process.argv[1];
if (!password) { console.error("Usage: node -e ... <password>"); process.exit(1); }
const salt = crypto.randomBytes(16).toString("hex");
const hash = crypto.scryptSync(password, salt, 64).toString("hex");
console.log("ADMIN_PASSWORD_HASH=" + salt + ":" + hash);
console.log("SESSION_SECRET=" + crypto.randomBytes(32).toString("hex"));
' "replace-with-strong-admin-password"
```

## 4. Production Security Checklist

- [ ] **Rotate Dev/Test Keys**: Any temporary API key or bootstrap password used during local testing must be rotated before public launch.
- [ ] **Server-Only Secrets**: Confirm that no environment variable containing a secret (including `SUPABASE_SERVICE_ROLE_KEY`) is prefixed with `VITE_`.
- [ ] **Supabase RLS**: Confirm `node scripts/verify-supabase.mjs` reports RLS enabled on all 8 tables.
- [ ] **Disable Bootstrap Password in Production**: Leave `ADMIN_BOOTSTRAP_PASSWORD` unset in Vercel Production environment variables; rely exclusively on `ADMIN_PASSWORD_HASH`.
- [ ] **Cookie Security**: In production (`NODE_ENV=production` or `VERCEL=1`), `authEngine.ts` sets `HttpOnly; SameSite=Lax; Secure` on session cookies.
- [ ] **Export Secret Scanning**: Verify in `/workspace` that attempting to export a file containing a test token triggers `secretScanner.ts` before creating the ZIP archive.
