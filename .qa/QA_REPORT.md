# F-FORUM v4 — Independent Visual & Functional QA Report

- **Project:** `f_forumv3`
- **Test Environment:** Live local server (`tsx server/index.ts` on `:8787` + `vite preview` serving production `dist/` on `:4173`, with `GOOGLE_CLIENT_ID` unset)
- **Viewports Verified:** Desktop `1440×900`, Tablet `768px`, Mobile `390×844`
- **Runtime Hygiene:** `0` console errors, `0` page errors, `0` failed API calls, `0px` horizontal overflow across all desktop & mobile routes, `0` secrets detected (`audit_secrets.py`), `0` broken visible images.

---

## 1. Grader 1 — Deterministic Verification & Live Flow Matrix

| Check | Result | Evidence |
| :--- | :---: | :--- |
| `npm run typecheck` (`tsc --noEmit`) | **PASS** | `0` TypeScript errors |
| `npm run build` (`tsc -b && vite build`) | **PASS** | `783` modules built cleanly |
| `npm test` (4 suites) | **PASS** | `51 / 51` tests passed (`core`, `security-pool`, `tier5-adversarial`, `vault-and-cleanup`) |
| `web_gate.py --no-build` | **PASS** | Verdict `PASS` — all blocking checks green (`brief`, `shot1440/768/390`, `banned`, `slopcopy`, `alt`, `console`, `interact`) |
| `audit_secrets.py` | **PASS** | `0` secret hits |
| **Flow 1:** Landing (`/`) & Home (`/home`) | **PASS** | Updated truthful counts (`5.994` free items · `58` motion techniques · `60` tools · `122` repos, `0` GetLayers), `0` broken visible images, `0px` overflow |
| **Flow 2:** Explore (`/explore`) & Experience Vault (`/explore/experience`) | **PASS** | `5.994` purified free items, `0` Glacier/GetLayers, single `Đã lưu` & `Trải nghiệm` placement, centered PinUI stage, full-width `297px` search bar on `390px` |
| **Flow 3:** Workspace (`/workspace`) | **PASS** | 5-step borderless dark Onboarding (`#0b0e10` + `#38c99a`), `1px` draggable divider, `0` device switchers, 15 Agent Showcase drawer, Arena trace, `[Xem trực tiếp \| Mã nguồn]`, `Tải ZIP`, live `/p/:slug` HTTP 200 via Vite preview proxy (`standalone HTML`), `0` stray hamburger on `1440px`, `0` clipped controls on `390px`, single-line generated mobile header CTA |
| **Flow 4:** Community Remix & Sổ tay Tri thức (`/community`) | **PASS** | 15 live Remix cards + published pages, mapped Vietnamese roles (`Học sinh / SV`), crisp 2-column tab bar on `390px`, 58 Motion Techniques with expand/copy/`Áp dụng` |
| **Flow 5:** Auth Modal | **PASS** | `0` broken Google button when unset, single-surface compact modal fits `100%` inside `900px` height (`751px`), clear active emerald tab state on Login & Register, guest continue + email/username registration working end-to-end |

---

## 2. Grader 2 — Rubric v9.0 5-Axis Visual Evaluation (Post-Fix Pass)

```json
{
  "axis_scores": {
    "above_the_fold_3s": 19,
    "spacing_alignment": 18,
    "contrast_vietnamese": 19,
    "edge_interaction_concentric": 18,
    "design_system_antislop": 19
  },
  "total_score": 93,
  "pass": true,
  "top_3_flaws": []
}
```

**VERDICT: PASS (93/100 · Release Ready)**
