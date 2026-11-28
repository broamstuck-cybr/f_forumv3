# F-FORUM v3 — Full-Stack Visual & Functional QA Report

- **Project:** `f_forumv3` (`https://fforum3.vercel.app`)
- **Date:** `2026-11-28`
- **Test Environment:** Live local production server (`tsx server/index.ts` + `vite preview` serving `dist/`) + Live OpenRouter Gateway (`sk-***0899`) stored privately in Supabase RLS `ff_admin_config`
- **Viewports Verified:** Desktop `1440x900`, Tablet `768px`, Mobile `390x844`
- **Runtime Hygiene:** `0` host console/page errors, `0px` horizontal overflow across desktop & mobile routes, `0` secret hits in source/git history, `52 / 52` automated tests green.

---

## 1. Deterministic Verification & Live Flow Matrix

| Check | Result | Evidence |
| :--- | :---: | :--- |
| `npm run typecheck` (`tsc --noEmit`) | **PASS** | `0` TypeScript errors |
| `npm run build` (`tsc -b && vite build`) | **PASS** | `795` modules built cleanly |
| `npm test` (4 suites) | **PASS** | `52 / 52` passed (`core` incl. Bolt/Studio XML artifact & patch parser, `security-pool`, `tier5-adversarial`, `vault-and-cleanup`) |
| Secret & public-release history scan | **PASS** | `0` secret hits (OpenRouter & Gemini keys stored exclusively in RLS-locked Supabase `ff_admin_config`, hydration hardened with `sbInsertIfMissing` `resolution=ignore-duplicates` so transient reads can never overwrite saved gateway credentials) |
| **Flow 1:** Real Bespoke Multi-File AI & Live SSE Streaming (`server/aiEngine.ts` + `src/engine/repoWebComposer.ts`) | **PASS** | Removed cookie-cutter `useAssemblyPlan` / local template wrapper and silent fallback substitution; implemented Bolt/Studio XML artifact protocol (`<summary>`, `<file path="...">`, `<patch path="..."><find>/<replace>`) with `maxOutputTokens: 8192`, `reasoning: { enabled: false }` (cutting OpenRouter TTFT from ~26s to 0.47–0.63s), 15s first-token stall failover across `:free` models, real-time file-writing stream card (`Writing index.html · N dòng`), and real `AbortController` Stop button |
| **Flow 2:** Two Completely Independent Bespoke Live OpenRouter Builds | **PASS** | Verified live via `openrouter/auto-smart` (`nvidia/nemotron-3.5-lightning:free`): Build #1 (`KŌHĪ Roastery` coffee shop, `index.html` + `src/styles.css` + `src/app.js`, `7,652` tokens) and after clicking `Dự án mới`, Build #2 (`Pomodoro 25:00 + Todo App`, `5,672` tokens) rendered two completely distinct bespoke designs with `0` repeated boilerplates |
| **Flow 3:** Inspiration Cards Prefill, Split-Pane Persistence & Session Restore | **PASS** | Workspace opens directly with clean empty canvas (`0` pre-made `15 mẫu demo` bait), clicking any of the 4 random visual cards fills the composer with an editable art-directed prompt without auto-firing canned output, dragging `SplitDivider` persists ratio (`52.0%`) in `localStorage` across reload (double-click resets to `39%`), and active AI project files/messages restore across reload |
| **Flow 4:** Sandbox Storage Shim & 1-Click Console `AI sửa lỗi` | **PASS** | Injected `data-ff-storage-shim` in `hardenPreviewHtml.ts` providing an in-memory `localStorage`/`sessionStorage` polyfill inside strict isolated iframes (`0` `SecurityError` crashes), and wired `ConsoleDrawer` 1-click `AI sửa lỗi` patch button when runtime/bundler errors occur |
| **Flow 5:** Responsive Desktop & Mobile UI (`1440/768/390px`) + Light & Dark Modes | **PASS** | Verified in Chromium Light & Dark modes (`1440x900` & `390x844`): cohesive Warm Alabaster Ivory Light Mode (`#f6f4ef`), crisp mint-ink `AI sửa lỗi` button on dark IDE console bar, thin translucent chat scrollbar next to split handle, and clean `+ Dự án mới` mobile topbar |

---

## 2. 5-Axis Visual Evaluation

```json
{
  "axis_scores": {
    "above_the_fold_3s": 19,
    "spacing_alignment": 19,
    "contrast_vietnamese": 19,
    "edge_interaction_concentric": 19,
    "design_system_antislop": 20
  },
  "total_score": 96,
  "pass": true,
  "top_3_flaws": []
}
```

**VERDICT: PASS (96/100 · Release Ready)**
