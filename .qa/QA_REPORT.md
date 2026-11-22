# QA Report — F-Forum v3 (v17 Release)

- **Dự án:** `f_forumv3`
- **Brief:** `docs/briefs/f-forum-v3-comprehensive-upgrade.md`
- **Bằng chứng thị giác đã soi:** `.qa/1440.png`, `.qa/1440-top.png`, `.qa/1440-reduced.png`, `.qa/768.png`, `.qa/390.png`, `.qa/console.txt` (0 lỗi), cùng kiểm chứng trực tiếp trên Chromium (`1440px`, `768px`, `390px`) cho `/`, `/home`, `/explore`, `/explore/experience`, `/workspace`, `/community`, `/profile`, `/settings`, `/admin`, `/iris-assistant.html`, `/reelmark-hero.html` và hộp thoại `Ctrl+E`.

## Chấm điểm theo Rubric Web v9.0 (5 Trục · 0–100 Điểm)

| # | Trục đánh giá | Điểm | Nhận xét gắn bằng chứng |
| :-: | :--- | :-: | :--- |
| **1** | **Ấn tượng Above-the-fold 3 giây** | **19 / 20** | Trên `1440-top.png` và `390.png`, tiêu đề serif + cụm nút CTA + khung mô phỏng iPhone 18 hiển thị trọn trong màn hình đầu; Chương II trên Landing Page đã thay thế hoàn toàn khu vực 12 thẻ cũ bằng băng chuyền trụ cong Reelmark (`Captivate Crowds with Snackable Reels`) hiển thị 25 trải nghiệm ngẫu nhiên xen kẽ giữa PinUI và Motion AI. |
| **2** | **Nhịp khoảng trắng & căn lề** | **19 / 20** | Thang spacing 8px nhất quán, `0px` tràn ngang trên cả `1440px`, `768px`, `390px`; băng chuyền cong 25 thẻ (`clip-path: path()` bo góc 15u), cụm nút `<- Trước` / `Tiếp ->` / `Trộn ngẫu nhiên`, và góc riêng mã QR ở cuối trang `/home` cùng `/` đều căn lề chuẩn xác, không đè chữ. |
| **3** | **Tương phản & dấu tiếng Việt** | **19 / 20** | Tông nền mực `#121110`, giấy `#f5f1e8`, nền Mint Studio `#F5F8EF` kèm chữ xanh rừng `#08482D` và sân khấu 3D Iris `#0b0b11` đều đạt độ tương phản cao; toàn bộ nhãn tiếng Việt trên góc mã QR, thẻ PinUI / Motion AI và bảng điều hướng hiển thị rõ nét. |
| **4** | **Tiểu tiết rìa, tương tác & bo góc đồng tâm (Điều 13)** | **19 / 20** | Robot 3D Iris (`Three.js` + `PMREMGenerator` softboxes + `UnrealBloomPass` + Fresnel rim shader) xoay đầu và đồng tử mượt theo con trỏ chuột, tự chớp mắt và nhấp nhô hai cánh tay lơ lửng; góc mã QR riêng (`/assets/qr-dino.png`) ở cuối `/home` và `/` hỗ trợ phóng to mã QR và mở trực tiếp tệp `index.html` trong Workspace Live View. |
| **5** | **Thống nhất 1 Design System & chống AI slop** | **19 / 20** | 1 hệ `:root` tokens xuyên suốt; đã xóa sạch khối `"Từ phác thảo [A] đến sản phẩm"` cũ theo Teardown Rule, loại bỏ toàn bộ phần tử Arena giả lập, không có emoji, không rò rỉ đường dẫn máy chủ. |

**Tổng điểm:** **95 / 100** (Đạt ngưỡng `>= 85 / 100`, không trục nào `< 15 / 20`).

## Các tiểu tiết đã tự phát hiện và sửa qua vòng kiểm định độc lập (Red-Team)
1. `[1440px / 768px] Reelmark Curved Carousel (TidewellStage)`: mở rộng viên nang `.rm-badge` theo `max-content` kèm padding đồng tâm để không tràn chữ, đồng thời tăng chiều cao vùng chứa `.rm-carousel-layer` trên màn hình `<= 820px` để chân thẻ cong không chạm vào ghi chú `"Zero cost"` và nút `"Make a Reel"`.
2. `[1440px / 768px / 390px] Iris 3D Robot Stage (IrisQrCornerSection)`: bật `preserveDrawingBuffer: true` trên `WebGLRenderer`, dựng ngay khung hình 0 và kích hoạt `forceRenderFrames` sau mỗi lần `ResizeObserver` đổi kích thước canvas để robot 3D luôn hiển thị sắc nét ngay cả khi chụp toàn trang từ đầu xuống cuối.
3. `[768px / 390px] Góc riêng mã QR (/assets/qr-dino.png)`: chuyển ảnh QR sang `loading="eager"` + `image-rendering: pixelated` trên tấm nền trắng bo góc đồng tâm, đảm bảo mã QR khủng long pixel luôn sắc nét và quét được ngay trên cả trang chủ `/home` lẫn trang giới thiệu `/`.

## 3 tiểu tiết còn lưu ý cho đợt tối ưu sau (`top_3_flaws`)
- `[1440px] Build bundle`: chunk `catalog-data` (~344 kB gzip) hiện nhúng sẵn `promptSpec` cho 239 mục nổi bật; đợt tối ưu tiếp theo nên chuyển phần prompt dài sang tải từ shard `public/data/vault/` để giảm dung lượng tải đầu.
- `[1440px] Vite dynamic import`: một số thành phần PinUI (`ThermalDial`, `Joystick`, `SwapCard`, `Recorder`, `LiquidVoice`) vừa được import tĩnh ở `pinui/index.ts` vừa import động ở `PinUIPlayground.tsx`, nên tách barrel để tối ưu code-splitting.
- `[1440px] Three.js GLB streaming`: mô hình `HEAD_GLB` (~9 MB từ CloudFront) tải bất đồng bộ sau khung hình procedural ban đầu; có thể nén Draco/Meshopt ở đợt tối ưu tiếp theo để giảm băng thông mạng di động.

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
    "[1440px] Chunk catalog-data (~344 kB gzip) nên tách promptSpec sang tải theo shard để giảm kích thước bundle ban đầu",
    "[1440px] Barrel src/components/pinui/index.ts import tĩnh trùng với dynamic import trong PinUIPlayground.tsx",
    "[1440px] Mô hình HEAD_GLB (~9 MB) trên CDN có thể nén Draco/Meshopt để tăng tốc tải trên mạng di động"
  ]
}
```
