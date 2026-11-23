# QA Report — F-Forum v3 (Polish v3: Tidewell Scale, Explore Media Fidelity, Balanced/Eco/Fabulous Modes & 3D Honor Gallery · 2026-11-23)

- **Dự án:** `f_forumv3` (TH, THCS và THPT FPT · FPT Forum)
- **Kiểm định độc lập (Maker != Checker):**
  - `npx tsc --noEmit`: `exit 0` (`0` lỗi)
  - `npm test`: **28/28 passed** (`8 suites`, `0 fail`, `0 skipped`)
  - `npm run build` (`tsc -b && vite build`): `exit 0` (`8.40s`)
  - `python3 "$STUDIO_ROOT/scripts/public_release_audit.py" --repo . --check-history`: `exit 0` (`[PASS] Public release audit clean`)
  - `python3 "$STUDIO_ROOT/scripts/web_gate.py" . --no-build`: `exit 0` (**`7/9 PASS · 0 lỗi chặn · VERDICT: PASS`**)
- **Kiểm chứng trực tiếp (`dev:api :8787` + `vite preview :4173`, Playwright Chromium `1440px / 768px / 390px`):**
  - `0` console errors, `0` page errors, `0` failed assets (`>= 400`), `0px` tràn ngang trên cả 8 lượt đo (`landing-{1440,768,390}`, `explore-{1440,768,390}`, `honor-{1440,390}`).
  - Bộ ảnh chụp mới tại `.qa/1440.png` (`2130KB`), `.qa/768.png` (`1610KB`), `.qa/390.png` (`1448KB`), `.qa/1440-top.png`, `.qa/1440-reduced.png`, `.qa/console.txt` (`0` dòng lỗi).

## Kiểm chứng chi tiết theo 4 phân hệ nâng cấp

| Phân hệ | Bằng chứng thực tế đã soi | Kết quả |
| :--- | :--- | :-: |
| **1. Landing & Tidewell Carousel (`/`)** | Navbar đọc `'Template'` (không còn `'50 Trưng bày'`); khung `.rm-frame` mở rộng `1440×952px`, 8 thẻ hiển thị trải sát hai mép màn hình (`minLeft: -404`, `maxRight: 1959`, `maxCardW: 369`, `maxCardH: 856`); nội dung Neo-Vietnamese bám sát dữ liệu thật (`95,9%` OECD PISA 2025, `195` khảo sát, `7.662` mẫu, `60` công cụ, `122` repo); modal thẻ có **`0`** nút `'Trang gốc'`. | **PASS** |
| **2. Explore / Bàn soi (`/explore`)** | Đã xóa sạch thanh `LiquidTabs` `'Tất cả 7662...'`, câu `'Đặt mẫu lên bàn...'`, `'xem tất cả →'`, `'Nhiều quá'`; hàng tìm kiếm `SearchCard` + `'Kho trải nghiệm'` + `'Đã lưu (0)'` cân đối cùng chiều cao `44px` trên 1 hàng ở `1440px` và `768px` (xếp gọn ở `390px`); **`0`** liên kết `'Trang gốc'` trên `/explore`, `SpecimenSheet`, `ToolIndex`, `RepoChart`, `ExperienceView`; dải ribbon đồng đều (`365×304` ở `1440px`, `203×203` ở `768px`); `Nền & Lớp` hiển thị ảnh `.webp`/`.mp4` thật (`Knight's Repose`, `Glass Spires`, `Ink Bloom`); `Chuyển động` hiển thị `22 Living Portrait` sống động và **`0`** lỗi CSP/SVG/CORS trong console. | **PASS** |
| **3. Settings & 3 Chế độ Giao diện (`/settings`)** | Đã xóa khung xem trước Sáng/Tối cỡ lớn; hiển thị 3 thẻ icon SVG vẽ riêng (`Fabulous`, `Balanced` đang chọn mặc định, `Eco`); bật `Eco` tắt `AmbientVideoBackdrop` (`0` thẻ video) và đặt `backdrop-filter: none` trên `.st-card` sau khi đóng gói `vite build`; bật `Fabulous` kích hoạt `SearchCard` morphing dropdown (`hasRichDropdown: true`), navbar kính mờ (`.nav`), `PinHeartButton` trên `CommunityView` và composer nổi bật trên `Workspace`. | **PASS** |
| **4. Phòng Vinh Danh 3D (`/honor`)** | Nhấn `"Gặp gỡ đội ngũ phát triển của tôi :)"` chuyển sang `/honor`, ẩn `AppNavbar`/`AppFooter`; hành lang WebGL Three.js dựng hình mượt (`1440×900` và `390×844`, `webglFallbackShown: false`); `section#honor-sheet` mở đúng với `9` chip tương tác, `3` accordion và nút lưu hồ sơ; ngăn kéo `Hồ sơ đã lưu` và bảng `Danh sách` 9 thẻ giữ độ tương phản chữ tối `#131c1a` rõ nét trên nền kem `#ece8de`/`#f6f3eb`; nút `'Quay lại F-Forum'` quay về `/home` sạch sẽ. | **PASS** |

## Chấm điểm theo Rubric Web v9.0 (5 Trục · 0–100 Điểm)

| # | Trục đánh giá | Điểm | Nhận xét gắn bằng chứng |
| :-: | :--- | :-: | :--- |
| **1** | **Ấn tượng Above-the-fold 3 giây** | **19 / 20** | Hero và dải Tidewell Carousel phóng đại cân xứng toàn chiều ngang, kết hợp phòng tranh 3D `/honor` mang bản sắc FPT Forum riêng biệt. |
| **2** | **Nhịp khoảng trắng & căn lề** | **19 / 20** | Hàng công cụ tìm kiếm `/explore` đồng bộ `44px`, dải ribbon tỷ lệ thống nhất, `0px` tràn ngang trên cả `1440 / 768 / 390px`. |
| **3** | **Tương phản & dấu tiếng Việt** | **19 / 20** | Đã khóa token `--fg`/`--ink` cục bộ trên `.thg-root`, xử lý triệt để lỗi chữ trắng trên nền kem tại Sheet và Drawer của `/honor`; đầy đủ dấu tiếng Việt trên mọi tuyến. |
| **4** | **Tiểu tiết rìa, tương tác & bo góc đồng tâm (Điều 13)** | **19 / 20** | Sửa triệt để lỗi `compileSpecimenSrcDoc` chèn CSP vào `<header>` thay vì `<head>`, lọc bỏ SVG placeholder `WORDMARK PATH`, và đảm bảo `Eco` giữ đúng `backdrop-filter: none` sau minify CSS. |
| **5** | **Thống nhất 1 Design System & chống AI slop** | **20 / 20** | Đạt `public_release_audit.py --check-history` (`exit 0`), xóa toàn bộ liên kết `'Trang gốc'` / text thừa, gỡ comment tường thuật thừa trên `TeamHonorGallery.tsx` (`web_gate.py` `VERDICT: PASS`). |

**Tổng điểm:** **96 / 100** (Đạt ngưỡng `>= 85 / 100`, mọi trục `>= 19 / 20`).

## Lỗi phát hiện trong vòng kiểm định độc lập (Red-Team) và đã xác nhận khắc phục
1. `src/styles/fabulous-mode.css:1` — Dính định danh studio khiến `public_release_audit.py` báo `[BLOCKED]` -> Đã gỡ sạch (`exit 0`).
2. `src/styles/fabulous-mode.css:16-17` — `vite build` loại bỏ `backdrop-filter: none !important` do đặt trước `-webkit-backdrop-filter: none !important` -> Đã đảo thứ tự, xác nhận `getComputedStyle(.st-card).backdropFilter === 'none'` ở chế độ `Eco`.
3. `src/features/honor/team-honor.css` & `TeamHonorGallery.tsx` — Tiêu đề `#honor-sheet` và Drawer bị kế thừa màu chữ trắng trên nền kem, cùng 92 comment tường thuật thừa -> Đã khóa `color: var(--thg-ink)` và dọn sạch comment, soi lại ảnh xác nhận độ tương phản rõ nét.
4. `src/features/explore/catalog.ts`, `PlateRibbon.tsx`, `SpecimenMedia.tsx` — `<meta>` CSP bị chèn nhầm vào `<header>` của mẫu thiếu `<head>`, `<path d="…WORDMARK PATH…">`, CORS font `/assets/*.woff2`, và card `22 Living Portrait` bị trắng -> Đã sửa regex `<head>`, lọc placeholder/font nội bộ, ưu tiên `.gif`, đạt `0` console error.

## 3 tiểu tiết còn lưu ý cho đợt tối ưu sau (`top_3_flaws`)
- `[1440px] Khám phá / CHUYỂN ĐỘNG`: Một số mẫu chỉ có video `.mp4` từ xa (`23 Video Ribbon`) chưa có ảnh poster tĩnh kèm sẵn nên hiển thị nền tối cho tới khi trình duyệt đệm xong khung hình đầu tiên.
- `[1440px] Bundle Vite`: Chunk `catalog-data` (~336 kB gzip) vẫn còn kích thước lớn so với ngưỡng cảnh báo mặc định của Vite; có thể tách tải lười thêm ở đợt sau.
- `[Codebase chung] Clean Comment Policy (non-blocking)`: `web_gate.py` vẫn ghi nhận comment cũ tại `src/features/explore/vaultLoader.ts:1` và các file gốc `src/components/pinui/original/**` (thuộc mã nguồn tham chiếu PinUI giữ nguyên bản).

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
  "top_3_flaws": [
    "[1440px] Một số mẫu chỉ có video MP4 từ xa (ví dụ 23 Video Ribbon) chưa có poster tĩnh nên hiển thị nền tối trước khi buffer khung hình đầu",
    "[1440px] Chunk catalog-data (~336 kB gzip) vượt ngưỡng cảnh báo mặc định 1050 kB của Vite",
    "[Legacy] web_gate.py ghi nhận cảnh báo non-blocking về comment trong vaultLoader.ts và PinUI original/*"
  ]
}
```
