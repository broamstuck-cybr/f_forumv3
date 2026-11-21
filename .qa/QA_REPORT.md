# Visual & Functional QA Report — F-Forum v3 (v15 Release)

- **Pipeline:** Arena Workspace Alignment, Editorial Serif Typography (`Cormorant Garamond` + `Great Vibes` / `Ballet`), Settings Wallpaper Presets & Global Theme Atmosphere, Centered Route Loader & Seamless Video Loop
- **Overall Verdict:** `PASS`
- **Timestamp:** 2026-11-21T13:38:00+07:00

---

## 1. Build, Unit Tests & Code Hygiene Checks

- `npm run typecheck` (`tsc --noEmit`): `0` errors (`exit 0`)
- `npm run lint` (`tsc --noEmit`): `0` errors (`exit 0`)
- `npm test` (`node --test tests/*.test.mjs`): `18/18` PASS across `6` suites (`0` failed, `0` skipped)
- `npm run build` (`tsc -b && vite build`): PASS (`12.45s`, 2,841 modules transformed, entry chunk `dist/assets/index-BBSys19u.js`)
- Hygiene scan across modified/added `src/` and `index.html`: `0` comments (`TOTAL COMMENT HITS: 0`), `0` emojis, `0` host path leaks, `0` secret leaks
- Freeze Zone verification (`git diff --name-only` across simulator, server, vercel config, core tests, original pinui components, source catalog): `0` modified files

---

## 2. Multi-Viewport & Interactive Visual Verification (`1440px`, `768px`, `390px`)

Fresh multi-viewport captures generated in `.qa/` (`1440.png` 2,428 KB at `1440x13636`, `768.png` 1,663 KB at `768x14353`, `390.png` 1,505 KB at `390x15057`, `1440-top.png` at `1440x13636`) alongside interactive Chromium flows across `/`, `/home`, `/workspace`, and `/settings`:

1. **Navbar Consolidation & Global Light/Dark Atmosphere:** Removed `.nav__modeBtn` from `AppNavbar.tsx` (`0` residual mode buttons in DOM); moved night/light effect controls (`droplet`, `rain`, `diwali`, `none`) into `SettingsView.tsx` and wired `GlobalThemeAtmosphere.tsx` to animate full-viewport transitions across both dark and light modes.
2. **Workspace Arena 3-Pane Parity & Full-Bleed Preview:** Streamlined `ProjectRail.tsx` (`Phiên Arena`, flat `New Chat` & search controls), rebuilt `Thread.tsx` with right-aligned user bubble, unboxed assistant prose, collapsible `Ran commands`, minimal copy + elapsed/clock footer, unified `.ws-arena-composer-shell` + `[Build | Refine | Audit]` mode switcher, single-row 46px `LiveStage.tsx` bar with `/` URL pill, and defaulted desktop viewport in `LivePreviewFrame.tsx` to `fit` (`data-fit="true"`, eliminating tiny boxed scaling).
3. **Editorial Display Serif & K-Pop Autograph Signature:** Replaced partial display font with `@fontsource/cormorant-garamond`, `@fontsource/great-vibes`, and `@fontsource-variable/ballet` (complete Vietnamese subsets), styled Hero pairing with editorial Regular + Italic contrast (`LandingHero.tsx`), and redesigned `StreetGraffitiMark.tsx` into a sweeping single-stroke K-pop autograph with 4-point star flourish verified in both dark and light modes.
4. **Centered Route/Action Loading GUI:** Added `GlobalRouteLoader.tsx` with softly dimmed translucent backdrop (`blur(4px)`) centered cleanly on screen during navigation and lazy chunk loads.
5. **Seamless Looping Ambient Backgrounds & Presets:** Implemented dual-`<video>` overlap crossfade (`LOOP_CROSSFADE_S = 1.35`) in `AmbientVideoBackdrop.tsx` alongside canvas aurora/constellation presets, plus `[data-wallpaper=...]` token themes in `src/styles/tokens.css`.
6. **Settings Appearance Grid (`SettingsView.tsx`):** Two-column sticky Settings shell featuring `90%–115%` interface scale selector, live preset preview card with color swatches, 8 wallpaper cards with `Tất cả / Tối / Sáng` filter, and instant Dark/Light mode switcher.
7. **Static Runtime Resilience (`appStore.tsx`):** Added strict boundary guards on `quota` state updates (`typeof data.quota.unlimited === 'boolean'`) preventing white-screen crashes when backend auth endpoints are absent in static previews (`0` runtime page errors and `0` app console errors).
8. **Multi-Viewport & Console Hygiene:** `0px` horizontal overflow (`docOverflow: false`, `mobileOverflow: false`) across `1440px`, `768px`, and `390px`. Note: `.qa/console.txt` records 4 `net::ERR_BLOCKED_BY_ORB` entries solely from the external audio URL inside Freeze-Zone `public/iphone18-simulator.html`.
