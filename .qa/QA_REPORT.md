# Visual & Functional QA Report — F-Forum v3 (v16.1 Polish)

- **Pipeline:** Workspace 2-Tier Composer & Clean Mobile Dock, Full-Width Explore IDE Code Viewer, and Settings 3D `FileBox` Local Archive Cabinet
- **Overall Verdict:** `PASS`
- **Timestamp:** 2026-11-21T14:52:00+07:00

---

## 1. Build, Unit Tests & Code Hygiene Checks

- `npm run typecheck` (`tsc --noEmit`): `0` errors (`exit 0`)
- `npm run lint` (`tsc --noEmit`): `0` errors (`exit 0`)
- `npm test` (`node --test tests/*.test.mjs`): `18/18` PASS across `6` suites (`0` failed, `0` skipped)
- `npm run build` (`tsc -b && vite build`): PASS (`9.76s` / `8.63s`, 2,842 modules transformed)
- 5-step verification suite: `EXIT=0` (all checks passed)
- Hygiene scan across changed `src/` files: `0` source comments (`WorkspaceView.tsx:257` only matches CSS selector `* {` inside fallback stylesheet string), `0` emojis, `0` host path leaks
- Freeze Zone verification (`git diff --name-only` across simulator, server, vercel config, core tests, original pinui components, source catalog): `0` modified files

---

## 2. Visual & Interactive Verification (`1440px`, `768px`, `390px`)

Fresh multi-viewport captures in `.qa/` (`1440.png` at `1440x13716`, `768.png` at `768x14370`, `390.png` at `390x15059`, `1440-top.png` at `1440x13716`) plus interactive Chromium verification:

1. **Workspace 2-Tier PromptComposer (`WorkspaceView.tsx`, `workspace.css`):** Stacked `.pcmp__row` vertically at all widths inside `.ws-arena-composer-shell` (`"field"` over `"pill"`) and removed the duplicate `<Paperclip />` button from `extraControls`, giving full-width prompt input and unobstructed toolbar spacing on both desktop (`1440px`) and mobile (`390px`).
2. **Full-Width Explore IDE Code Viewer (`ExperienceView.tsx`, `PlateTable.tsx`, `explore.css`):** Removed `OriginalFileBox` and `.ex-source-box` from Explore and Experience detail drawers, expanding `.ex-source-editor` to `100%` width with single-header `TSX/HTML | CSS | Prompt` tabs and copy controls (`07-explore-filebox-ide.png`).
3. **Settings 3D `FileBox` Local Archive Cabinet (`SettingsView.tsx`, `settings.css`):** Integrated the interactive 5-folder `OriginalFileBox` inside `Cài đặt -> Dữ liệu & Sao lưu` (`Kho lưu trữ & Sao lưu cục bộ`) paired with `Ngăn 1`..`Ngăn 5` archive tabs (`Dự án Workspace`, `Mục đã lưu`, `Xuất tệp sao lưu JSON`, `Sao chép JSON nhanh`, `Khôi phục / Đặt lại mặc định`) and JSON restore `DynamicDropZone`. Fixed TDZ declaration order (`handleExportDownload`/`handleCopyJson` via `useCallback` before `archiveFolders`) and fixed intrinsic `1:1` sizing without `fill` (`09-settings-data-3d-filebox.png`).
4. **Multi-Viewport & Console Hygiene:** `0px` horizontal overflow (`landingOverflow: false`, `mobileWsOverflow: false`) at `1440px`, `768px`, and `390px`; `0` app console or page errors (`consoleErrors: []`, `pageErrors: []`); `bootSplashHasWhiteSeoText: false`; `wsNavbarHidden: true`; `wsStageCompact: "compact"`; `wsStageSplit: "split"`; `settingsHasDoiSangBtn: false`; `afterPinuiTheme: "light"`. Note: `.qa/console.txt` logs 2 `net::ERR_BLOCKED_BY_ORB` entries from the external `SoundHelix-Song-1.mp3` audio request on `1440`/`768` viewports.
