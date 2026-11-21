# Visual & Functional QA Report — F-Forum v3 (v14 Release)

- **Pipeline:** Bespoke FForum Display Typography, Pill Geometry Harmonization, Peer Social Profiles, WCAG AAA Contrast & Multi-Viewport Verification
- **Overall Verdict:** `PASS` (Independent Maker != Checker Verification Complete)
- **Timestamp:** 2026-11-21T12:50:00+07:00

---

## 1. Build, Unit Tests & Static Security Checks

- `npm run typecheck` (`tsc --noEmit`): `0` errors (`exit 0`)
- `npm test` (`node --test tests/*.test.mjs`): `18/18` PASS across `6` suites (`0` failed)
- `npm run build` (`tsc -b && vite build`): PASS (`9.96s`, 2,830 modules transformed, entry chunk `dist/assets/index-CbUBsLPn.js`)
- Hygiene scan across all modified/added files: `0` comments (`//`, `/* */`, `<!-- -->`), `0` emojis, `0` host path leaks, `0` `allow-same-origin` flags, `0` secret leaks
- Freeze Zone verification: `0` edits to `public/iphone18-simulator.html`, `server/`, `vercel.json`, `tests/core.test.mjs`, `src/components/pinui/original/`, `src/data/sourceCatalog.json`
- Quality Gate verification: bot-web (exit 0) and seo-audit (exit 0)

---

## 2. Full-Stack E2E & Visual 12-Point Verification (`1440px`, `768px`, `390px`)

Fresh multi-viewport screenshots captured at `.qa/1440.png` (`1440×13648`), `.qa/768.png` (`768×14520`), `.qa/390.png` (`390×15258`), and `.qa/1440-top.png`:

1. **Bespoke Display Typography (`FForum Display`):** Custom high-contrast editorial Didone font engineered for `#121110` dark theme. Built into `public/fonts/fforum-display.woff2` (`2.5 KB`) and `public/fonts/fforum-display.ttf` (`7.8 KB`) with complete Vietnamese diacritics support (anti-collision diacritics stacking for `ẫ`, `ẩ`, `ế`, `ố`, `ớ`, `ợ`, `ử`, `ừ`). Preloaded in `<head>` of `index.html` with zero FOUT/FOIT.
2. **Unified Pill Button Geometry (`var(--radius-pill)`):** All buttons, tabs, chips, and selects across the workspace, navbar, landing, and community strictly unified to `var(--radius-pill)` (`9999px`). Eliminated all mismatched rectangular buttons (`.btn`, `.ws-icon-pill`, `.ws-model-select`, `.pltabs-bar`, `.pltabs-btn`, `.pchips-btn`).
3. **Full Name & Project Title Legibility:** Expanded `.lp-nav-userName` from `180px` to `260px` in `landing.css`, completely eliminating awkward name truncation (`System Admi...`). Adjusted `.ws-head-title` in `workspace.css` to `flex: 0 1 auto; max-width: 320px; min-width: 120px;`, ensuring long project names like `Obsidian Spatial Workbench` display in full.
4. **Peer Social Profile Viewing (`/profile`):** Clicking any author avatar or name across Community post cards, comment threads, top answers, reader card drawer, and contributors list navigates to their public profile view (`isOtherUser`). Scoped exclusively to public contributions; private local projects and drafts are strictly omitted. Added `← Hồ sơ của tôi` return button and `Theo dõi` / `Đang theo dõi` interactive toggle.
5. **Guaranteed WCAG AAA Text Contrast:** Explicitly bound `color: var(--fg);` to `.lp-hero-line`, `.lp-hero-title`, and `.lp-head-copy .t-title` across Landing. Adjusted hero opacity scroll knee from `0.5` to `0.75` in `LandingHero.tsx` so headlines remain crisp and legible against ambient gradients.
6. **Discord-Inspired Channel Rail (`CommunityView.tsx`):** 3-column desktop layout collapsing to clean horizontal pill strip on mobile (`390px`) with `0px` horizontal overflow.
7. **Meta/Facebook Quick-Composer:** Inline top trigger bar with 1-click modal importing active workspace builds.
8. **Instagram Live Showcase Stage:** Sandboxed preview with reload, theme switch, viewport toggles, and fork actions.
9. **Threads Connected Reply Spine:** Connected `.cm-thread-spine` with accepted answers, nested comments, and expandable replies.
10. **Workspace Publish Flywheel:** 1-click publish from Live Stage to Community discussions with bidirectional navigation.
11. **Multi-Viewport Zero-Overflow:** Verified across `1440px`, `768px`, and `390px` with clean rendering and no horizontal page stretching.
12. **Independent Sign-Off:** Independent checker verified git diff, builds, tests, and visual assets -> `PASS`.
