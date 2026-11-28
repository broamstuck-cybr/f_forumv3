# F-FORUM v3 — Full-Stack Visual & Functional QA Report (Commit 2408082)

- **Project:** `f_forumv3` (`https://fforum3.vercel.app`)
- **Date:** `2026-11-28`
- **Test Environment:** Live local production server (`tsx server/index.ts` on `:8787` + `vite preview` serving `dist/` on `:4179`) + Live Vercel Production (`2408082`)
- **Viewports Verified:** Desktop `1440x900`, Mobile `390x844`
- **Runtime Hygiene:** `0` page errors, `0px` horizontal overflow across desktop & mobile routes, `0` secret hits, `51 / 51` automated tests green.

---

## 1. Deterministic Verification & Live Flow Matrix

| Check | Result | Evidence |
| :--- | :---: | :--- |
| `npm run typecheck` (`tsc --noEmit`) | **PASS** | `0` TypeScript errors |
| `npm run build` (`tsc -b && vite build`) | **PASS** | `794` modules built cleanly |
| `npm test` (4 suites) | **PASS** | `51 / 51` passed (`core`, `security-pool`, `tier5-adversarial`, `vault-and-cleanup`) |
| Full-stack build, test & secret scan | **PASS** | All deterministic & security checks passed (`0` secret hits) |
| **Flow 1:** Landing / Home Carousel PinUI Live Previews | **PASS** | Replaced all wireframe skeletons (`.rm-pinui-prev-canvas`: `0`) with live scaled `PinUIPlayground` thumbnails (`5` active scalers in viewport: `Task Card`, `Calendar Card`, `Magnify Lens`, etc.) |
| **Flow 2:** Experience Vault 40/60 Sticky Split & Zero-Stale Switching (`/explore/experience`) | **PASS** | Verified exact split (`listPct: 39%`, `prevPct: 59%`, `position: sticky`), synchronous item-tagged shard loading (`Interactive Blog` -> `Holographic NFT Collectible Card` renders `Nebula Drifter #042`, `holoLeaksOldBlog: false`), clean category/Next arrow cycling (`Character Carousel` -> `Engraved Certificate`) |
| **Flow 3:** Workspace Vault-Grounded AI Assembly + `\n` Unescape + Model/BYOK Picker (`/workspace`) | **PASS** | Unescapes double-encoded `\\n` server- & client-side, hydrates top 3 Vault shards + Motion Recipe into AI context, prevents stale onboarding title hijack, adds compact Model selector (`Gemini 3 Flash`, `Gemini 2.5 Flash`, `Gemini 2.5 Pro`) + inline BYOK API Key popover (`Gemini`, `OpenRouter`, `OpenAI`, `DeepSeek`, `Claude`) |
| **Flow 4:** Spacious 1-Handed Mobile UI (`390x844`) | **PASS** | `overflowX: 0` across `/home`, `/explore/experience`, `/workspace`, `/settings`; `bodyFontSize: 15px`; `18px` gutters; `>= 42–46px` tap targets; `96px` safe bottom dock clearance |
| **Flow 5:** Live Vercel Production (`https://fforum3.vercel.app`) | **PASS** | Commit `2408082` deployed (`state: success`), all core routes return HTTP `200` |

---

## 2. 5-Axis Visual Evaluation

```json
{
  "axis_scores": {
    "above_the_fold_3s": 19,
    "spacing_alignment": 19,
    "contrast_vietnamese": 19,
    "edge_interaction_concentric": 18,
    "design_system_antislop": 19
  },
  "total_score": 94,
  "pass": true,
  "top_3_flaws": []
}
```

**VERDICT: PASS (94/100 · Release Ready)**
