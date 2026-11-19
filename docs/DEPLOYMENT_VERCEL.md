# F-FORUM v3 — Vercel Deployment Guide (`fforum`)

This guide covers deploying F-FORUM v3 to a new Vercel project named `fforum` without altering any existing deployments, configuring required environment variables, and verifying production security.

## 1. Dual-Runtime Architecture Overview

F-FORUM v3 is engineered to run identically in local development and on Vercel:

- **Static SPA Bundle (`./dist`)**: Built by `npm run build` (`tsc -b && vite build`) and served by Vercel's edge CDN.
- **Serverless API Functions (`./api`)**:
  - `api/health.ts` -> `GET /api/health`
  - `api/ai/chat.ts` -> `POST /api/ai/chat`
  - `api/ai/quota.ts` -> `GET /api/ai/quota`
  - `api/auth/[action].ts` -> `POST /api/auth/login`, `POST /api/auth/register`, `POST /api/auth/admin-login`, `POST /api/auth/logout`, `GET /api/auth/session`
  - `api/admin/[action].ts` -> `GET|POST /api/admin/state`, `POST /api/admin/config`, `POST /api/admin/moderate`, `POST /api/admin/quota-reset`, `POST /api/admin/changelog`
  - `api/community/[action].ts` -> `GET /api/community/list`, `POST /api/community/create`, `POST /api/community/upvote`, `POST /api/community/accept`, `POST /api/community/report`
- **Routing & Headers (`./vercel.json`)**: Routes `/api/*` requests to the serverless handlers and rewrites all other application paths (`/`, `/app`, `/explore`, `/work`, `/community`, `/settings`, `/admin`) to `/index.html` with strict security headers (`X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: strict-origin-when-cross-origin`).

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

Initialize or push the verified repository to your clean GitHub remote (for example `https://github.com/broamstuck-cybr/fforum.git`):

```bash
git remote -v
git push -u origin main
```

### Step 2.3 — Create the `fforum` Project in Vercel

1. Sign in to the target Vercel account and click **Add New... -> Project**.
2. Import the `broamstuck-cybr/fforum` GitHub repository.
3. Set the **Project Name** explicitly to `fforum` (creating an isolated project that does not touch any legacy project or domain).
4. Confirm the build settings (auto-detected from `package.json` and `vercel.json`):
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### Step 2.4 — Configure Required Environment Variables

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

### Step 2.5 — Deploy and Verify Endpoints

1. Click **Deploy** in the Vercel dashboard (or run `npx vercel --prod` after linking to the `fforum` project).
2. Once deployed, verify the health endpoint and route rewrites:

```bash
curl -s https://fforum.vercel.app/api/health
curl -s https://fforum.vercel.app/api/ai/quota
```

3. Open `https://fforum.vercel.app/` in a browser and confirm:
   - `/` renders the Legacy Editorial Landing Page.
   - `/app`, `/explore`, `/work`, and `/community` load the 4-tab application shell with zero console errors.
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
- [ ] **Server-Only Secrets**: Confirm that no environment variable containing a secret is prefixed with `VITE_`.
- [ ] **Disable Bootstrap Password in Production**: Leave `ADMIN_BOOTSTRAP_PASSWORD` unset in Vercel Production environment variables; rely exclusively on `ADMIN_PASSWORD_HASH`.
- [ ] **Cookie Security**: In production (`NODE_ENV=production` or `VERCEL=1`), `authEngine.ts` sets `HttpOnly; SameSite=Lax; Secure` on session cookies.
- [ ] **Export Secret Scanning**: Verify in `/work` that attempting to export a file containing a test token triggers `secretScanner.ts` before creating the ZIP archive.
