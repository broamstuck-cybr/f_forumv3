# QA Report — F-Forum v3 (v3 Comprehensive Overhaul · 2026-11-23)

- **Dự án:** `f_forumv3` (TH, THCS và THPT FPT · FPT Forum)
- **Brief:** `docs/briefs/f-forum-v3-comprehensive-upgrade.md`
- **Kiểm định độc lập (Maker != Checker):** `npx tsc --noEmit` (`exit 0`), `npm run build` (`exit 0`, `6.16s`), `npm test` (`25/25 pass`, `0 fail`), `web_gate.py --no-build` (`7/9 PASS`, `0 lỗi chặn`, `VERDICT: PASS`).
- **Bằng chứng thị giác đã soi:** `.qa/1440.png`, `.qa/1440-top.png`, `.qa/1440-reduced.png`, `.qa/768.png`, `.qa/390.png`, `.qa/console.txt` (`0 bytes`, `Console sạch`), cùng kiểm chứng tương tác trực tiếp trên Chromium (`1440px`, `768px`, `390px`, `0px` tràn ngang, `0` lỗi console/HTTP 4xx-5xx với `vite preview` + `dev:api`) trên toàn bộ 6 tuyến chính: `/`, `/home`, `/explore`, `/explore/experience`, `/community`, `/settings`.

## Chấm điểm theo Rubric Web v9.0 (5 Trục · 0–100 Điểm)

| # | Trục đánh giá | Điểm | Nhận xét gắn bằng chứng |
| :-: | :--- | :-: | :--- |
| **1** | **Ấn tượng Above-the-fold 3 giây** | **19 / 20** | Trên `.qa/1440-top.png` và `.qa/390.png`, Hero hiển thị trọn vẹn nội dung 8 slide nghiên cứu FPT Forum (OECD PISA 2025 `95,9%`, `7.662 mẫu giao diện`, `195 người dùng khảo sát · 91,2%`, `Xưởng lắp ráp mở FPT`) trên nền `Gradient Video` tối giản giảm `-10%` độ phủ tối; băng chuyền 50 mẫu (`Chạm Mẫu Sống, Học Từ Bản Gốc` — 25 Motion AI + 25 PinUI nguyên bản) loại bỏ hoàn toàn nhãn cũ. |
| **2** | **Nhịp khoảng trắng & căn lề** | **19 / 20** | Thang spacing 8px nhất quán, `0px` tràn ngang trên cả `1440px`, `768px` và `390px` ở 6 tuyến; góc Iris 3D + mã QR + nút `Gặp gỡ đội ngũ phát triển của tôi :)` ở cuối `/` và `/home` cùng bố cục Facebook/Instagram của `Tri thức` và `Phòng chat` reflow mượt trên mobile `390px`. |
| **3** | **Tương phản & dấu tiếng Việt** | **19 / 20** | Tương phản đạt chuẩn `>= 4.5:1` trên cả chế độ Tối và Sáng (`CommunityView`, `ExploreView`, `SettingsView` với 8 preset hình nền); dấu tiếng Việt sắc nét trên toàn bộ Hero, bộ lọc chủ đề Khám phá (`Khớp 794 / 7.662 mẫu`), ngăn `Giải thích & Hướng dẫn` cho Công cụ/Repo và `Phòng chat Tri thức`. |
| **4** | **Tiểu tiết rìa, tương tác & bo góc đồng tâm (Điều 13)** | **19 / 20** | Hộp thoại `Khu Vinh Danh Đội Ngũ Phát Triển` và hộp thoại xem trước 50 mẫu được render qua `createPortal(..., document.body)` ở `z-index: 12000` (không còn bị thanh điều hướng/chân trang cắt); bộ lọc Khám phá tách biệt chip chủ đề khỏi ô tìm kiếm và trả đúng bản gốc ThreeUI/GetLayers/MotionSites/PinUI; bộ lọc kiểm duyệt AI (`moderationFilter.ts`) chặn spam/ngôn từ thô tục ngay trên giao diện và `BroadcastChannel` đồng bộ phòng chat. |
| **5** | **Thống nhất 1 Design System & chống AI slop** | **19 / 20** | 1 hệ `:root` tokens đồng nhất xuyên suốt; xóa sạch `buildMetadataStagePreview`, nhãn cũ, tệp tĩnh legacy (`public/reelmark-hero.html`, `public/iris-assistant.html`), toàn bộ viền cam/thanh dọc cam cạnh hộp bài đăng trong `community.css`, 0 emoji trong mã nguồn và 0 đường dẫn máy chủ. |

**Tổng điểm:** **95 / 100** (Đạt ngưỡng `>= 85 / 100`, không trục nào `< 15 / 20`).

## Các tiểu tiết đã tự phát hiện và sửa qua 2 vòng kiểm định độc lập (Red-Team)
1. `[1440px] Landing / Khu Vinh Danh Đội Ngũ Phát Triển (IrisQrCornerSection.tsx & TidewellStage.tsx)`: phát hiện modal bị cắt rìa dưới bởi chân trang và bị thanh điều hướng che phần đầu do nằm trong stacking context của section; đã chuyển sang `createPortal(..., document.body)` với `z-index: 12000` và giới hạn chiều cao `min(88dvh, 820px)` kèm kiểm chứng ảnh sau sửa sạch lỗi.
2. `[1440px / Dark & Light] Tri thức — Community Feed (community.css:480-484)`: phát hiện `.cm-post[data-selected='true']` vẫn còn `box-shadow: inset 3px 0 0 var(--red)` và `border-color: var(--red)` tạo vạch cam bên trái khung bài viết; đã thay bằng đường viền hairline trung tính (`var(--line-strong)`), đạt 0 viền/thanh cam trên cả nền Tối và Sáng.
3. `[1440px] Khám phá — MotionSites (SpecimenMedia.tsx & PlateTable.tsx)`: phát hiện mẫu đầu tiên `3D Character Studio` hiển thị khung tối trên Chromium Linux do video CloudFront mã hóa HEVC Main 10 không có poster; đã bổ sung fallback `poster` trong `SpecimenMedia.tsx` và ưu tiên xếp hạng các mẫu có `liveHtml`/ảnh động/poster lên đầu (`Flower Valley` chạy live HTML mượt).
4. `[CI / Unit Tests] Zero-Emoji & Teardown`: thay toàn bộ ký tự emoji/U+2605 trong `CommunityChatRoom.tsx` và `RepoChart.tsx` bằng biểu tượng Lucide/văn bản thuần, xóa 2 tệp HTML cũ không còn tham chiếu, nâng bộ kiểm thử tự động lên `25/25 PASS`.

## 3 tiểu tiết còn lưu ý cho đợt tối ưu sau (`top_3_flaws`)
- `[1440px] Build bundle`: chunk `catalog-data` (~336 kB gzip) vẫn gom sẵn `promptSpec` của tập mục nổi bật; đợt tối ưu tiếp theo nên tách hoàn toàn phần văn bản prompt sang tải theo shard `public/data/vault/` để giảm tải lần đầu.
- `[1440px] Clean Comment Policy (upstream PinUI)`: một số tệp nguồn bên thứ ba trong `src/components/pinui/original/` vẫn còn chú thích cũ (cảnh báo không chặn cổng `web_gate.py`); có thể chuẩn hóa sạch trong đợt dọn thư viện PinUI tiếp theo.
- `[1440px / 390px] MotionSites HEVC video`: một số video `.mp4` gốc từ CloudFront dùng codec HEVC Main 10; đợt tối ưu tiếp theo có thể tạo bản transcode H.264/poster cục bộ để mọi trình duyệt Linux phát trực tiếp không cần chuyển sang ảnh tĩnh.

```json
{
  "axis_scores": {
    "above_the_fold_3s": 19,
    "spacing_alignment": 19,
    "contrast_vietnamese": 19,
    "edge_interaction_concentric": 19,
    "design_system_antislop": 19
  },
  "total_score": 95,
  "pass": true,
  "top_3_flaws": [
    "[1440px] Chunk catalog-data (~336 kB gzip) nên tách promptSpec sang tải lười theo shard vault để giảm dung lượng tải đầu",
    "[1440px] Một số tệp nguồn bên thứ ba trong src/components/pinui/original/ còn chú thích cũ (cảnh báo không chặn web_gate.py)",
    "[1440px / 390px] Một số video MotionSites CloudFront mã hóa HEVC Main 10 nên bổ sung bản H.264 hoặc poster dự phòng đầy đủ"
  ]
}
```
