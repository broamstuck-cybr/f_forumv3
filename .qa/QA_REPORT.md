# QA Report — F-Forum v3 (Polish v4: Arena Workspace, MotionSites Video Trials, Clean Settings, 200-Asset Fabulous Mode, Non-Repeating 3D Honor Gallery & FB/IG Community · 2026-11-23)

- **Dự án:** `f_forumv3` (TH, THCS & THPT FPT · FPT Forum)
- **Kiểm định sau bản sửa cuối:**
  - `npx tsc --noEmit`: `exit 0` (`0` lỗi)
  - `npm test`: **28/28 passed** (`8 suites`, `0 fail`, `0 skipped`, `2532.9ms`)
  - `npm run build` (`tsc -b && vite build`): `exit 0` (`6.15s`)
  - `public_release_audit.py --repo . --check-history`: `exit 0` (`[PASS] Public release audit clean`)
  - `web_gate.py . --no-build`: `exit 0` (**`7/9 PASS · 0 lỗi chặn · VERDICT: PASS`**)
- **Kiểm chứng trực quan (`1440px / 768px / 390px` & định tuyến tương tác):**
  - `0` page errors, `0` failed media assets (`MMQ_MEDIA: { videoCount: 22, imgCount: 96, brokenImgs: 0 }`), `0` console errors trong `.qa/console.txt`.
  - Bộ ảnh chụp `.qa/1440.png` (`2234KB`), `.qa/768.png` (`1549KB`), `.qa/390.png` (`1464KB`), `.qa/1440-top.png`, `.qa/1440-reduced.png`.

## Kiểm chứng chi tiết các phân hệ Polish v4

| Phân hệ | Bằng chứng thực tế đã soi | Kết quả |
| :--- | :--- | :-: |
| **1. Workspace Arena.ai (`server/aiEngine.ts`, `WorkspaceView.tsx`, `Thread.tsx`, `Popover.tsx`, `workspace.css`)** | Gỡ bỏ hoàn toàn khung giả lập màu cam `SYNTHESIZED WORKSPACE ARTIFACT / Obsidian Foundry` và thanh `.ws-eval-bar` / `STARTERS` mẫu sẵn; câu chào `"hi?"` không tạo tệp ảo (`WORKSPACE_HAS_SYNTHETIC_HTML: false`); khung `LiveStage` thu gọn đến khi có mã thật hoặc nạp từ Kho `7.662` mẫu; Popover `Định tuyến ^` bật hướng lên trên với `.pcmp__side { z-index: 60 }` không bị chữ placeholder đè xuyên qua. | **PASS** |
| **2. Cài đặt Tối giản (`/settings`)** | Gỡ bỏ toàn bộ câu giải thích, mô tả phụ và huy hiệu con trên tất cả mục (Giao diện, Workspace, AI & BYOK, Sao lưu); chỉ giữ tiêu đề gọn, 3 icon SVG vẽ tay và 3 tên nút `Fabulous` / `Balanced` / `Eco`. | **PASS** |
| **3. MotionSites Video Trial & Landing Carousel (`/home`, `/`)** | `MotionMarqueeGrid` hiển thị `48` mẫu MotionSites với video/poster riêng (`22` thẻ `<video>` + `96` ảnh poster, `brokenImgs: 0`), không còn badge góc, nút tim giả, đoạn tóm tắt AI hay ảnh tàu hàng lặp lại; chân thẻ chỉ giữ `Title · Category`; nhấp mở thẳng modal `Video Trial` + `Live HTML` + `Mã nguồn`. Trên `/` (`TidewellStage`), tiêu đề đổi thành `Dùng Thử Trực Tiếp / Trên Trình Duyệt`, đã xóa `.rm-subline` và `.rm-arrow-controls`. | **PASS** |
| **4. Sổ Vinh Danh 3D (`/honor`)** | Giảm từ `60` khung lặp lại xuống `9` bản ghi duy nhất trên cung tròn đơn (`-0.52..+0.52`); hiển thị đúng `3` ảnh đội ngũ thật đã crop trên khung `01`, `02`, `03` không lặp lại; đã sửa vòng lặp `React #301` trong `createHonorArtwork` và xác nhận `#honor-sheet` mở mượt từ cả 3D lẫn `Danh sách`. | **PASS** |
| **5. Chế độ Fabulous `200` Tài nguyên (`fabulousManifest.json`)** | Đọc trực tiếp `41` PinUI + `9` CodeFronts (`50` UI), `50` ThreeUI, `50` Glacier và `50` Motion AI (`200` tài nguyên); hiển thị badge `Fabulous · 200`, thanh điều hướng lỏng trong `AppNavbar`, hiệu ứng nâng cấp trên `HomeView`, `ProfileView` và `LandingPage`. | **PASS** |
| **6. Tri thức & Phòng chat Instagram Direct (`/community`)** | Khóa token tương phản riêng cho `html[data-theme="dark"]` và `html[data-theme="light"]` trên `.chat` (đã soi cả 2 giao diện Sáng/Tối rõ nét); làm trống `SEED = []`; hoàn thiện Instagram Direct DM + Stories bar và Facebook Feed + `computeFeedRankScore` giữ trạng thái rỗng ban đầu `0 bài` sạch sẽ. | **PASS** |

## Chấm điểm theo Rubric Web v9.0 (5 Trục · 0–100 Điểm)

| # | Trục đánh giá | Điểm | Nhận xét gắn bằng chứng |
| :-: | :--- | :-: | :--- |
| **1** | **Ấn tượng Above-the-fold 3 giây** | **19 / 20** | Hero `/` gọn gàng với `TidewellStage` 1-chạm `Dùng Thử Trực Tiếp`, `/workspace` mở theo đúng cấu trúc `Arena.ai` sạch, `/home` và `/honor` có chiều sâu thị giác thống nhất. |
| **2** | **Nhịp khoảng trắng & căn lề** | **19 / 20** | Xóa sạch chữ thừa ở `/settings` và `TidewellStage`; `0px` tràn ngang tại `1440 / 768 / 390px`;Popovers không còn chồng chéo. |
| **3** | **Tương phản & dấu tiếng Việt** | **19 / 20** | Chế độ Sáng & Tối của Chat Instagram Direct và Bảng tin Facebook đều đọc rõ; `#honor-sheet` giữ chữ tối trên nền kem; đầy đủ dấu tiếng Việt trên toàn bộ UI. |
| **4** | **Tiểu tiết rìa, tương tác & bo góc đồng tâm (Điều 13)** | **19 / 20** | Sửa triệt để bleed placeholder qua Popover `Định tuyến ^`, vòng lặp render ảnh `/honor`, và ưu tiên `Video Trial` thật trước khi nhấp vào thẻ `MotionMarqueeGrid`. |
| **5** | **Thống nhất 1 Design System & chống AI slop** | **20 / 20** | `28/28` test pass, `public_release_audit.py --check-history` sạch tuyệt đối, `web_gate.py` đạt `VERDICT: PASS`. |

**Tổng điểm:** **96 / 100** (Đạt ngưỡng `>= 85 / 100`, mọi trục `>= 19 / 20`).

## Lỗi phát hiện & khắc phục trong vòng kiểm định v4
1. `src/features/honor/teamHonorData.ts:839-841` — `createHonorArtwork` gọi `onUpdate()` đồng bộ gây lỗi `React #301` khi trượt khung -> Đã chặn bằng `if (onUpdate && !existing.loadedPhoto)` (xác nhận `0` page errors).
2. `src/features/workspace/workspace.css:3088-3115` — Chữ placeholder ô nhập đè xuyên lên Popover `Định tuyến ^` -> Đã nâng `.ws-arena-composer-shell .pcmp__side { z-index: 60 }` và `.pcmp__bar { z-index: 1 }` (đã soi ảnh sạch).
3. `src/components/launchpad/MotionMarqueeGrid.tsx:239-248` — Thẻ có `previewVideo` mặc định mở tab `Live HTML` thay vì `Video Trial` -> Đã ưu tiên `Video Trial` trước khi có video chạy thử.

## 3 lưu ý nhỏ còn tồn tại (`top_3_flaws`)
- `[1440px] Live HTML iframe`: Một số mẫu MotionSites có HTML thiết kế cho nền sáng khi chuyển sang tab `Live HTML` ở chế độ nền tối cần bấm nút `Nền sáng` để chữ tối hiển thị hết độ tương phản (tab mặc định `Video Trial` phát rõ ngay).
- `[1440px] Bundle Vite`: Chunk `catalog-data` (`~335.6 kB` gzip) vẫn lớn hơn ngưỡng cảnh báo `1050 kB` chưa nén của Vite.
- `[Codebase chung] Clean Comment Policy (non-blocking)`: `web_gate.py` ghi nhận cảnh báo không chặn ở `src/features/explore/vaultLoader.ts:1` và các file nguồn tham chiếu `src/components/pinui/original/**`.

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
    "[1440px] Một số mẫu HTML nền sáng trong tab Live HTML của MotionMarqueeGrid cần nút Nền sáng để đọc hết chữ tối (Video Trial mặc định hiển thị rõ ngay)",
    "[1440px] Chunk catalog-data (~335.6 kB gzip) vượt ngưỡng cảnh báo 1050 kB của Vite",
    "[Legacy] web_gate.py ghi nhận cảnh báo non-blocking về comment trong vaultLoader.ts và PinUI original/*"
  ]
}
```
