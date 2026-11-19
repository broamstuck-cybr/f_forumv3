# F-FORUM v3 — Product Specification

This document defines the product requirements, route contracts, functional modules, quota enforcement policies, and export pipelines for F-FORUM v3 (incorporating all v2.0 baseline specifications plus v3 spatial and governance enhancements).

## 1. Route Contract & Dual-Entry Topology

F-FORUM v3 preserves the legacy editorial landing page at the root route while exposing the full 4-tab application workspace and dedicated administration console:

| Route / Query | Surface ID | Purpose |
|---|---|---|
| `/` | `landing` | Retained Legacy Editorial Landing Page (`LandingPage.tsx` + `HardwareShowcase.tsx` + all 9 editorial sections). Clicking "Enter App", "Launch Workspace", or any primary CTA transitions into `/app` (`home`). |
| `/app` or `/?view=home` | `home` | Spatial Home Launchpad (`src/features/launchpad/HomeView.tsx`) with client-side Prompt Blueprint Composer, 4-Act Scroll Storytelling Engine (`src/components/launchpad/ScrollStoryEngine.tsx`), Recent Projects Filmstrip, Verified Repo Leaderboard teaser, and Curated Drop Spotlight. |
| `/explore` or `/?view=explore` | `explore` | Non-grid Explore hub (`src/features/explore/ExploreView.tsx`) with three sub-modes inside the Floating Liquid Glass Command Dock: **Thư viện Tài nguyên** (26 verified items across 8 curated groups), **Kho Template UI/UX** (60/40 Split-Stage interactive showcase across 121 items from all 5 `SOURCEOFKNOWLEDGFORAI` libraries), and **Bảng Xếp Hạng Repo & Skills** (`src/features/explore/RepoLeaderboard.tsx` — 41 open-source repositories & skill packs verified live against the GitHub API). |
| `/work` or `/?view=workspace` | `workspace` | 3-Column Build Workspace (`src/features/workspace/WorkspaceView.tsx`) with Multi-File Virtual FS, Sandboxed Live Preview, Line-by-Line Diff Viewer, Automated Static/DOM Checks Runner, and Secret-Scanned ZIP Export. |
| `/community` or `/?view=community` | `community` | Source of Knowledge Dev Forum & Club Hub (`Q&A`, `Showcase`, `Prompts & Rules Drops`, and `Club Hub Project Continuity Dossiers`). |
| `/settings` or `/?view=settings` | `settings` | User preferences (Theme, Reduced Motion, Default Target IDE, Bring-Your-Own-Key override headers, LocalStorage workspace snapshot import/export). |
| `/admin` or `/?view=admin` | `admin` | Dedicated Unlimited Admin Control Plane (Gateway configuration overrides, Moderation queue, User & Quota registry, Real Telemetry & Audit Logs, System Changelog editor). |
| `*` (unmatched) | `not-found` | Typo-recovering 404 Route View with quick keyboard/click jump back to `/app` or `/`. |

## 2. Single-Line 4-Tab Application Navbar

When inside the application shell (`home`, `explore`, `workspace`, `community`, `settings`, `admin`), the top header adheres to strict single-line spatial rules:

1. **Brand & Kinetic Aperture Logo**: Clicking the brand mark returns to `home` (with a secondary quick link to view the `/` editorial landing page). The logo morphs across five real-time system states (`idle`, `thinking`, `streaming`, `verified`, `error`).
2. **Primary 4-Tab Navigation Pill**:
   - `Home`
   - `Explore`
   - `Work`
   - `Source of Knowledge`
   All four tab labels remain on a single horizontal line (`white-space: nowrap`) with sliding pill active indicators and keyboard shortcut hints.
3. **Right Utility Cluster**:
   - Command Palette trigger (`Ctrl+K` / `Cmd+K`)
   - Live AI Turn Quota meter (`15 / 15` remaining for Guest/Standard users; `UNLIMITED` badge for Admin accounts)
   - Adaptive Theme Switch (`Obsidian Foundry` Dark / `Editorial Stone` Light)
   - Settings & Account / Admin drawer trigger

## 3. Spatial Home Launchpad (`home` — `src/features/launchpad/HomeView.tsx`)

The Home view replaces generic dashboard card grids with an asymmetrical editorial workbench above the fold and a 4-Act GPU Scroll Storytelling Engine below the fold:

- **Centered Masthead & Ambient ASCII Glyph Canvas**:
  - Interactive 2D procedural ASCII glyph particle backdrop reacting to pointer clicks and feed ripples without heavy binary video assets.
  - Dynamic time-aware greeting (`Good morning/afternoon/evening`) paired with active session identity and frosted avatar badge.
- **Client-Side Prompt Blueprint Composer (`PinUI PromptComposer` + `LiquidVoice`)**:
  - Features SVG `feTurbulence` + `feDisplacementMap` liquid glass refraction and double-rim specular highlights (`inset 1px 1px`).
  - Fanned quick-action cards (`Landing Page`, `Dashboard`, `Club Hub`, `Quiz & Tools`, `Design to Code`) calibrated across desktop and `390px` mobile container queries (`@container pcmp (max-width: 560px)`) with zero horizontal clipping.
  - Synthesizes a structured engineering prompt blueprint on the client (`0` server AI turns consumed) or dispatches directly into the `Work` space (`1` AI turn consumed on generation).
- **4-Act Scroll Storytelling Engine (`src/components/launchpad/ScrollStoryEngine.tsx` + `src/styles/story.css`)**:
  - Driven by native `window.scrollY` and a `requestAnimationFrame` lerp loop (`k = 1 - (1 - 0.14) ** (dt / 16.67)`) updating DOM refs directly without wheel hijacking or 60fps React state re-renders, accompanied by an interactive Act jump rail (`01 Fan | 02 Craft | 03 Portal | 04 Manifesto`).
  - **Act 1 (`01 Fan`)**: 7 technical 9x9 pixel SVGs (`terminal`, `prism`, `diff-gate`, `grid-break`, `sandbox-shield`, `blueprint-spark`, `stack-layers`) morphing into `"Ideas in Motion"` while 6 artifact cards rise with `easeOutBack` into an arc fan.
  - **Act 2 (`02 Craft`)**: Word-by-word blur reveal of `"From prompt to product / built through real craft"` while 12 self-contained F-FORUM mini-UI artifact cards (`Navbar`, `PromptComposer`, `LiquidTabs`, `SplitStage`, `Arena 3-Col`, `LiveSandbox`, `UnifiedDiff`, `ChecksRunner`, `SecretScan`, `ClubDossier`, `RepoRank`, `KineticMark`) transition through `Fan -> Scatter -> Pile -> Rotating Wheel`. Clicking any card navigates directly to its feature or pre-launches a prompt.
  - **Act 3 (`03 Portal`)**: Gated `clip-path: inset(... round 14px -> 0)` portal window expansion (`"Not just visuals / Real products that run"`) with a 3D-tilting Live Viewport Frame (`perspective: 900px`, yaw `-10deg..+10deg`, sine bob).
  - **Act 4 (`04 Manifesto`)**: Sticky dark horizontal kinetic manifesto track with per-character staggered reveal, 5 spring-overshoot badges (`zero slop`, `source-traced`, `sandboxed`, `open repos`, `verified checks`), and direct CTAs (`Mở Work space`, `Xem Bảng Xếp Hạng Repo & Skills`).
  - **Accessibility Fallback**: Automatically collapses into a clean static multi-band editorial layout (`height: auto`, zero sticky traps) when `prefers-reduced-motion: reduce` or the in-app `reducedMotion` toggle is active.
- **Attached Context Shelf, Recent Projects Filmstrip & Verified Repo Teaser**:
  - Displays pinned `Explore` references, a horizontal rail of persisted Workspace projects, and a compact teaser strip deep-linking into Explore's `Bảng Xếp Hạng Repo & Skills` mode (`sessionStorage.setItem('ff_explore_mode', 'leaderboard')` + `ff:explore-mode` custom event).

## 4. Non-Grid Explore Hub (`explore` — `src/features/explore/ExploreView.tsx`)

Controlled by a Floating Liquid Glass Command Dock with PinUI `LiquidTabs`, `Explore` provides three non-grid spatial modes:

### 4.1 Thư viện Tài nguyên — Resource Library (8 Groups, 26 Verified Items)

Curated technical index (`src/data/resourceLibrary.json`, 26 verified items including `res-opencode-cli`, `mattpocock/skills`, `obra/superpowers`, `affaan-m/ECC`, `anthropics/skills`, `PatrickJS/awesome-cursorrules`, and `modelcontextprotocol/servers`) organized along an interactive vertical spine and detail inspection drawer across 8 mandatory groups:

1. `AI Tools`
2. `Prompts`
3. `GitHub Repositories`
4. `Skills & Rules`
5. `UI/UX`
6. `Documentation`
7. `Learning`
8. `Dev Tools`

Every resource entry carries standardized metadata:
- `tech` (`React`, `Next.js`, `Tailwind`, `Python`, `TypeScript`, etc.)
- `platform` (`Antigravity`, `Cursor`, `GitHub`, `Web`)
- `level` (`Beginner`, `Intermediate`, `Advanced`)
- `cost` (`Free`, `Freemium`, `Paid`)
- `status` (`verified_tested`, `verified_info`, `unverified`)
- `lastVerified` (`2026-11-19`) and `officialUrl`

### 4.2 Kho Template UI/UX — Template Collection (60/40 Split-Stage, 121 Items)

- **Left 60% Interactive Stage**: Live interactive preview or architectural brief inspection of the selected item from `src/data/sourceCatalog.json` (121 curated items spanning all 5 libraries in `SOURCEOFKNOWLEDGFORAI`: 41 `pinui`, 30 `threeui`, 20 `motionsites`, 15 `lucianlabs`, 15 `codefronts`).
- **Right 40% Scrubbable Index Rail**: Filterable by source library, runtime cost (`DOM + CSS`, `Motion`, `Canvas 2D`, `Three.js / WebGL`), and category.
- **Direct Actions**:
  - `Attach to Workspace Prompt` (pins the item's archive path, tokens, and motion brief into the active `Work` session)
  - `Open in Work Space` (spawns or updates a Workspace project seeded with the selected reference)
  - `Copy Prompt / Reference Path`

### 4.3 Bảng Xếp Hạng Repo & Skills — Verified Open-Source Leaderboard (41 Items)

Implemented in `src/features/explore/RepoLeaderboard.tsx` and backed by `src/data/repoLeaderboard.json` (generated and verified live against the GitHub API via `scripts/fetch-repo-leaderboard.mjs`):

- **Provenance & Live Telemetry Header**: Displays exact verification date (`2026-11-19`), total verified count (`41` repositories), and real GitHub API star/fork metrics across 4 categories:
  1. `Skills, Rules & Prompts` (11 repositories)
  2. `AI Agents & CLI` (10 repositories)
  3. `UI/UX & Motion` (10 repositories)
  4. `Local LLM & DevTools` (10 repositories)
- **Asymmetric Top-3 Podium**: Wide `#01` Lead Spotlight card on the left paired with stacked `#02` and `#03` cards on the right (`lg:grid-cols-[minmax(0,1.38fr)_minmax(0,1fr)]`).
- **Editorial Ranked Ledger (Ranks `#04..#41`)**: High-density technical rows with rank badge, `fullName`, primary language, license, live star/fork counts, last push date, Vietnamese architectural summary (`description` + `aiNote`), topic pills, `Copy Repo URL`, `Save`, and 1-click `Use in Project` (attaches the repository directly to the active `Work` session via `attachItemToWorkspace`).

## 5. 3-Column Arena Build Workspace (`workspace`)

The `Work` tab is an integrated 3-column IDE and verification arena:

1. **Left Column — Conversational Architect & Context Rail (26% width on desktop)**:
   - Prompt input with attached `Explore` references and quick iteration chips.
   - Turn history showing prompt, AI reasoning summary, touched files, and quota counter.
   - Project Setup Generator button producing `README.md`, `RULES.md`, `SKILLS.md`, `TASKS.md`, and `PROJECT_CONTEXT.md` tailored for `Antigravity` or `Cursor`.
2. **Center Column — Multi-File Code Editor & Sandboxed Live Preview Stage (48% width on desktop)**:
   - Virtual file tree (`index.html`, `styles.css`, `app.js`, plus generated docs/config files).
   - Mode switcher: **Live Preview** (sandboxed `iframe` with responsive viewport presets: `390px` Mobile, `768px` Tablet, `1440px` Desktop, or fluid resize), **Code Editor** (live editable buffer with instant preview hot-reload), and **Diff View** (unified and split line-by-line `+added / -deleted` hunk inspection against previous snapshot).
3. **Right Column — Verification Checks, Process Timeline & Secret-Scanned Export (26% width on desktop)**:
   - **Checks Tab**: Executes real static and DOM checks (`HTML Structure`, `JS Syntax Parse`, `Responsive Viewport & Overflow`, `Internal Link Integrity`, `Secret Leak Scan`, `Accessibility Basics`).
   - **Process & Snapshots Tab**: Step-by-step execution trace and one-click snapshot rollback.
   - **Export ZIP**: Bundles all virtual project files + generated IDE setup manifests into a downloadable `.zip` archive after passing `secretScanner.ts`. If any API key pattern (`sk-*`, `AIza*`, `ghp_*`, `xoxb-*`, bearer tokens) is detected, export is blocked or redacted with a clear warning.

## 6. Source of Knowledge — Dev Forum & Club Hub (`community`)

Four structured channels with zero fake metrics and full Workspace interoperability:

1. **Q&A (`qa`)**: Technical questions and implementation troubleshooting with syntax-highlighted snippets, upvotes, and `Accepted Answer` badges.
2. **Showcase (`showcase`)**: Built interfaces published directly from the `Work` Arena with embedded sandboxed preview and `Fork to Workspace` action.
3. **Prompts & Rules Drops (`drops`)**: Reusable system prompts, `.cursorrules` / `RULES.md` modules, and token recipes ready to attach to a project.
4. **Club Hub (`clubs`)**: Structured **Project Continuity Handover Dossiers** enabling university or engineering club cohorts to hand over multi-semester projects (architecture summary, environment contract, known bottlenecks, next milestone checklist) and fork directly into `Work`.

Every post includes a `Report` action that feeds directly into the `/admin` Moderation Queue.

## 7. Authentication, 15-Turn Quota Policy & Unlimited `/admin`

| Actor Role | Authentication Method | AI Generation Quota | Capabilities |
|---|---|---|---|
| **Guest** | Anonymous session cookie + IP hash | **15 turns max** (`MAX_STANDARD_TURNS = 15`) | Full read access, client-side Prompt Blueprint composer, 15 server AI generation turns, ZIP export, local persistence. |
| **Standard User** | Registered account (`scrypt` password hash + `HttpOnly` HMAC-SHA256 session cookie) | **15 turns max** (`MAX_STANDARD_TURNS = 15`) | All Guest capabilities plus persistent account identity, community posting, upvoting, and answer acceptance. |
| **Administrator (`admin`)** | Dedicated `/admin` login verified against `ADMIN_USERNAME` + `ADMIN_PASSWORD_HASH` (or local dev bootstrap) | **Unlimited** (`unlimited: true, limit: null`) | Bypasses the 15-turn cap across all endpoints; full access to `/admin` Control Plane (runtime AI gateway override, quota reset for any user/guest, moderation queue approval/hiding, audit logs, and changelog publishing). |

Users may also supply optional Bring-Your-Own-Key (BYOK) headers from `/settings` (`x-ff-byok-key`, `x-ff-byok-url`, `x-ff-byok-model`, `x-ff-byok-protocol`), which are forwarded only for that request and never persisted or logged on the server.
