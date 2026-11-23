# QA Report — F-Forum v3 (Polish v4: Arena Workspace, FB Tri thức + IG Chat, Live-First Motion AI & Tidewell, Real Team 3D & Fabulous 200 · 2026-11-23)

- **Dự án:** `f_forumv3` (TH, THCS và THPT FPT · FPT Forum)
- **Kiểm định độc lập (Sau lượt sửa cuối cùng):**
  - `npx tsc --noEmit`: `exit 0` (`0` lỗi)
  - `npm test`: **28/28 passed** (`8` suites, `0` fail, `0` skipped)
  - `npm run build` (`tsc -b && vite build`): `exit 0` (`6.65s`, bundle chính `dist/assets/index-BFeXcA_w.js`)
  - `python3 "$STUDIO_ROOT/scripts/public_release_audit.py" --repo . --check-history`: `exit 0` (`[PASS] Public release audit clean`)
  - `python3 "$STUDIO_ROOT/scripts/web_gate.py" . --no-build`: `exit 0` (**`7/9 PASS · 0 lỗi chặn · VERDICT: PASS`**)
- **Kiểm chứng trực tiếp Playwright Chromium (`vite preview :4173`):**
  - `verify_all.mjs`: **15/15 passed**, **`0` console errors**, **`0` page errors** trên toàn tuyến (`/`, `/home`, `/settings`, `/explore`, `/workspace`, `/community`, `/honor`, và `390px` mobile overflow = `0`).
  - Bộ ảnh QA chuẩn: `.qa/1440.png` (`3118KB`), `.qa/768.png` (`1364KB`), `.qa/390.png` (`819KB`), `.qa/1440-top.png`, `.qa/1440-reduced.png`, `.qa/console.txt` (`0` bytes).

## Kiểm chứng chi tiết theo phân hệ

| Phân hệ | Bằng chứng thực tế đã soi & kiểm chứng | Kết quả |
| :--- | :--- | :-: |
| **1. Workspace Arena UX (`/workspace`, Dark + Light)** | Khởi tạo blank / gửi `"hi?"` giữ `rightMode === 'closed'` (`data-stage="closed"`), khung chat căn giữa `max-width: 820px`, sạch 100% fake card (`Obsidian Foundry`, `WCAG AAA`, `Iterations Verified`); popover `Tự động ^` mở ngược lên trên trong viewport (`y=599`); `html[data-theme="light"]` hiển thị tương phản `#111816` trên nền `#f7f9f8`. | **PASS** |
| **2. Landing Tidewell & Home Showcase (`/`, `/home`)** | Tidewell giữ headline `Dùng Thử Trực Tiếp / Trên Trình Duyệt`, bỏ `.rm-subline` và nút mũi tên/trộn; `MotionMarqueeGrid` sạch AI-slop summary/heart pills, `0` ảnh trùng lặp (`Guardnet Benefits` dùng `hero-guardnet-preview-DAQqiNXC.gif`); nhấp thẻ mở thẳng tab `Live HTML` tương tác (`SandboxPreview` 1440/768/390 + theme toggle); pill `Định tuyến` neo gọn trong thanh composer `.hm-composer-dock`, bỏ viền cầu vồng & chấm đỏ ở `"Phản biện"`. | **PASS** |
| **3. Settings & Fabulous 200 (`/settings`, `/explore`)** | `/settings` loại bỏ toàn bộ văn bản giải thích thừa (`hintCount=0`), chỉ giữ icon + tên `Fabulous / Balanced / Eco`; bật `Fabulous` kích hoạt toàn bộ 200 tài nguyên `fabulousManifest.json` (`ui50 + threeui50 + glacier50 + motion50`) cùng 4 preset CodeFronts và lớp `.fab-studio-anchor` không đè thanh Workspace rail hay bottom nav `390px`. | **PASS** |
| **4. Tri thức FB + Chat IG (`/community`, Dark + Light)** | Giữ `0` bài/tin nhắn giả ban đầu; bỏ nhãn xanh `"● Đang hoạt động"` gây rối ở tiêu đề kênh `#chung-fpt`; feed ranker đa tín hiệu EdgeRank + Story rings + phản ứng hover + bảng màu Light/Dark `#111816`/`#f7f9f8` rõ nét. | **PASS** |
| **5. Sổ Vinh Danh 3D (`/honor`)** | Khắc phục triệt để lỗi đồng bộ `Too many re-renders` (React #301) trong `createHonorArtwork`; 3 ảnh thành viên (`member-1.jpg`, `member-2.jpg`, `member-3.png`) hiển thị riêng biệt trên bảng `01/02/03`, `04..09` giữ tranh vector, hành lang WebGL chạy ổn định `0` console error. | **PASS** |

## Chấm điểm theo Rubric Web v9.0 (5 Trục · 0–100 Điểm)

| # | Trục đánh giá | Điểm | Nhận xét gắn bằng chứng |
| :-: | :--- | :-: | :--- |
| **1** | **Ấn tượng Above-the-fold 3 giây** | **19 / 20** | Hero `/home`, dải Tidewell & Marquee Live-first, Arena Workspace căn giữa và hành lang WebGL `/honor` nhất quán, giàu chiều sâu. |
| **2** | **Nhịp khoảng trắng & căn lề** | **19 / 20** | Pill `Định tuyến` hòa nhập trong composer, popover mở ngược không chạm mép dưới, dock `Fabulous · 200` tách khỏi footer rail và thanh điều hướng `390px`. |
| **3** | **Tương phản & dấu tiếng Việt** | **19 / 20** | Dark & Light parity đồng đều trên `/workspace`, `/community`, Chat và `/honor`; đầy đủ dấu tiếng Việt chuẩn. |
| **4** | **Tiểu tiết rìa, tương tác & bo góc đồng tâm (Điều 13)** | **19 / 20** | Interactive-first trên cả `TidewellStage` và `MotionMarqueeGrid`, `SandboxPreview` đổi được Dark/Light và viewport `390/768/1440`, sửa triệt để infinite loop `/honor`. |
| **5** | **Thống nhất 1 Design System & chống AI slop** | **20 / 20** | `public_release_audit.py --check-history` sạch, loại sạch văn bản thừa `/settings`, fake card `Obsidian Foundry`, và ảnh trùng lặp giữa các mẫu. |

**Tổng điểm:** **96 / 100** (Đạt ngưỡng `>= 85 / 100`, mọi trục `>= 19 / 20`).

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
    "[1440px] Thanh LiquidTabs ở /community (cm-feed-tabs) còn tràn ngang nhẹ ở tab cuối khi giữ đủ 6 bộ lọc",
    "[1440px] Chunk catalog-data (~335.6 kB gzip) vượt ngưỡng cảnh báo 1050 kB mặc định của Vite",
    "[Legacy] web_gate.py ghi nhận cảnh báo non-blocking comment ở vaultLoader.ts, PinUI original/* và 2 dòng tại CommunityView.tsx"
  ]
}
```
