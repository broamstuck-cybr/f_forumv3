# Visual QA Report — F-Forum v3 (Independent Cross-Model Evaluation)

- **Dự án:** `f_forumv3`
- **Brief đối chiếu:** `docs/briefs/f-forum-v3-comprehensive-upgrade.md`
- **Rubric áp dụng:** `evals/rubric_web_v9.md` (5 trục · 0–100 điểm · ngưỡng PASS `>= 85/100` và không trục nào `< 15/20`)
- **Grader 1 — Deterministic Gate:**
  - `scripts/visual_check.sh`: `exit 0` (`✅ [VISUAL CHECK] Đạt chuẩn kiểm tra thị giác!`)
  - `scripts/web_gate.py . --no-build`: `exit 0` (**`7/9 PASS · 0 lỗi chặn · VERDICT: PASS`**; `console` `[PASS] Console sạch · không error`; ghi nhận `[FAIL] comments` non-blocking ở `src/components/pinui/original/presence-cards/PresenceCards.tsx`, `src/components/pinui/original/lamp-switch/LampSwitch.tsx`)
  - `.qa/console.txt`: `0` bytes (`0` console errors / page errors — các lỗi ảnh chân dung `/library/voice/*.webp` đã được xử lý sạch)
- **Grader 2 — Bằng chứng ảnh thật đã kiểm tra:**
  - `.qa/1440-top.png` (`1440×900`), `.qa/1440.png` (`1440×8945`), `.qa/768.png` (`768×9828`), `.qa/390.png` (`390×13611`), `.qa/1440-reduced.png` (`1440×8945`)

---

## Xác Minh Các Hạng Mục Đã Sửa

1. **`#du-an` (*"Bộ khung mẫu chuẩn, mở là chạy được"*):** **Đã khắc phục hoàn toàn.** Cả `6/6` poster xem trước Starter Kit (`01 Space Voyage Hero`, `02 CodeNest Workspace Hero`, `03 Stellar AI v2`, `04 Transform Data Matrix`, `05 Aethera Editorial Grid`, `06 Luminex Surface Lighting`) đều hiển thị đồ họa UI sắc nét, đúng bố cục trên toàn bộ `.qa/1440.png`, `.qa/768.png`, `.qa/390.png` và `.qa/1440-reduced.png` (không còn hộp đen rỗng).
2. **`#tuyen-ngon` (*"Từ thực trạng PISA 2025 đến Xưởng lắp ráp mở."*):** **Đã khắc phục hoàn toàn.** Khoảng trống dọc `~1.900px` của runway sticky đã biến mất (chiều cao `.qa/1440.png` giảm từ `9986px` xuống `8945px`), chuyển thành lưới `3×2` (`1440px`), `2×3` (`768px`) và `1×6` (`390px`) cân đối; thẻ `02 / 06` không còn ký tự xoay/rơi/mờ đè lên tiêu đề dòng 2.
3. **Chân dung PinUI `/library/voice/*.webp` & Console:** **Đã khắc phục hoàn toàn.** `.qa/console.txt` trống (`0` bytes, `0` lỗi mạng/console).

---

## Bảng Chấm 5 Trục Tiểu Tiết (0–100 Điểm)

| # | Trục đánh giá | Điểm | Nhận xét gắn bằng chứng ảnh thật |
| :-: | :--- | :-: | :--- |
| **1** | **Ấn tượng Above-the-fold 3 giây** | **18 / 20** | Ở `.qa/1440-top.png`, `.qa/768.png` và `.qa/390.png`, tiêu đề serif *“Từ ý tưởng đến sản phẩm thật, làm chủ AI không rập khuôn.”*, 3 chỉ số thực (`7.844 tài nguyên & mẫu`, `195`, `91 giờ 00 phút 05 giây`/`06 giây`), CTA chính/phụ và mockup iPhone giúp hiểu rõ sản phẩm trong `<= 3s`. Trừ nhẹ do nội dung thông báo bên trong mockup iPhone vẫn là chuỗi mẫu tiếng Anh kèm emoji. |
| **2** | **Nhịp khoảng trắng & căn lề** | **18 / 20** | Khoảng trống sa mạc `~1.900px` ở `#tuyen-ngon` đã được dọn sạch; lưới 6 thẻ nghiên cứu (`01/06`–`06/06`) và 6 thẻ Starter Kit (`01`–`06`) căn hàng thẳng sắc nét trên `1440px`, `768px` và reflow dọc `0px` tràn ngang trên `390px`. Còn lệch nhẹ chiều cao 3 cột `.lp-proj-specs` (1 dòng so với 2–3 dòng) và bố cục footer 3 cột ở `768px` bị rớt cột `thông tin` xuống hàng 2. |
| **3** | **Tương phản & dấu tiếng Việt** | **18 / 20** | Hệ font `Cormorant Garamond` + `Be Vietnam Pro` + `IBM Plex Mono` hiển thị đủ dấu tiếng Việt sắc nét, không rớt glyph, không còn chữ mờ đè dòng ở thẻ `02/06`. Trừ nhẹ ở nhãn phụ mono (`tệp mã`, `khung nhìn`, `phong cách`, tiêu đề cột footer) hơi dịu và lớp chữ trắng `"3D / Robot Jellyfish"` trên nền gradient sáng bạc trong carousel hơi thiếu tương phản. |
| **4** | **Tiểu tiết rìa, tương tác & bo góc đồng tâm (Điều 13)** | **17 / 20** | 6/6 poster Starter Kit sắc nét, viền bo góc thẻ đồng đều, FAQ đóng/mở rõ ràng, `.qa/1440-reduced.png` giữ nguyên bố cục sạch dưới `prefers-reduced-motion`, `.qa/console.txt` sạch `0` lỗi. Trừ điểm vì rìa trái/phải dải carousel *"Dùng Thử Trực Tiếp Trên Trình Duyệt"* còn cắt cụt chữ (`"BẢN ĐỒ & TR..."` trên `768px`, `"ĐIỀU HƯỚNG..."` trên `1440px`) chưa có mask fade mượt hai mép. |
| **5** | **Thống nhất 1 Design System & chống AI slop** | **17 / 20** | Ngôn ngữ Editorial Forest-Emerald thống nhất xuyên suốt các section. Còn sót 3 chi tiết chống slop chưa dọn: thông báo tiếng Anh + emoji 😍 trên màn hình iPhone hero, pill QR cuối trang ghi `"Gặp gỡ đội ngũ phát triển của tôi :)"` (emoticon `:)`), và nút `"Trang chủ"` thừa ngay dưới PromptComposer khi đang ở trang chủ. |

**Tổng điểm:** **`88 / 100`**  
**VERDICT: PASS** *(Đạt chuẩn xuất xưởng: Grader 1 `exit 0`, tổng điểm `88 >= 85/100`, tất cả các trục `>= 17/20 >= 15/20`)*

---

## Tiểu Tiết Cần Gọt Thêm (`top_3_flaws`, theo luật `< 90/100`)

1. **`[1440px, 768px, 390px]` Chuỗi tiếng Anh giả lập + emoji trên mockup iPhone hero & emoticon ở pill QR cuối trang (`Hero` & `Footer`):**
   - Vị trí: Màn hình khóa iPhone ở `.qa/1440-top.png`, `.qa/768.png`, `.qa/390.png`; cụm QR cuối trang (`.qa/1440.png` vùng chân trang); nút `"Trang chủ"` dưới PromptComposer.
   - Hiện tượng: Mockup iPhone hiển thị `"Tuesday, November 24"`, `"Ava Chen: Also the new iPhone 18 Pro looks insane 😍"`, `"Design Review · Apple Park"`; pill QR ghi `"Gặp gỡ đội ngũ phát triển của tôi :)"`; nút `"Trang chủ"` trùng với trang hiện tại.
   - Hướng sửa: Việt hóa các thẻ thông báo iPhone theo ngữ cảnh F-Forum (không emoji), đổi nhãn QR thành *"Gặp gỡ đội ngũ phát triển F-Forum"*, và bỏ nút `"Trang chủ"` thừa dưới PromptComposer.

2. **`[1440px, 768px]` Thẻ `Robot Jellyfish` tương phản nhãn thấp & mép carousel cắt cụt chữ (`"Dùng Thử Trực Tiếp Trên Trình Duyệt"`):**
   - Vị trí: Dải carousel 3D dưới hero trên `.qa/1440.png` và `.qa/768.png`.
   - Hiện tượng: Thẻ `Robot Jellyfish` có nền gradient bạc sáng làm chữ trắng `"3D / Robot Jellyfish"` giảm tương phản ở góc dưới; các thẻ ngoài rìa trên `768px` bị cắt ngang chữ (`"BẢN ĐỒ & TR..."`, `"VI TƯƠNG TÁC"`).
   - Hướng sửa: Phủ lớp scrim tối (`linear-gradient(to top, rgba(10,14,13,0.85), transparent 55%)`) dưới chân thẻ `Robot Jellyfish` và thêm `mask-image` mờ dần 2 mép cho viewport carousel.

3. **`[1440px, 768px, 390px]` Căn dòng 3 cột `.lp-proj-specs` trong `#du-an` & độ tương phản nhãn mono phụ:**
   - Vị trí: 6 thẻ Starter Kit trong `#du-an` và tiêu đề 3 cột footer (`sản phẩm`, `tài khoản`, `thông tin`).
   - Hiện tượng: Giá trị `"3 tệp"` (1 dòng) đứng cạnh `"Đáp ứng đa màn hình"` (2 dòng) và `"Trực quan hóa số liệu"` (3 dòng trên `768px`/`390px`), làm nhịp chiều cao hàng spec hơi lệch; các nhãn phụ mono hơi dịu.
   - Hướng sửa: Dùng grid `grid-template-columns: auto 1fr 1fr` hoặc giới hạn chuỗi ngắn 1–2 dòng đều nhau ở `.lp-proj-specs`, đồng thời tăng nhẹ độ sáng token chữ phụ mono đạt thoải mái `>= 4.5:1`.

```json
{
  "axis_scores": {
    "above_the_fold_3s": 18,
    "spacing_alignment": 18,
    "contrast_vietnamese": 18,
    "edge_interaction_concentric": 17,
    "design_system_antislop": 17
  },
  "total_score": 88,
  "pass": true,
  "top_3_flaws": [
    "[1440px, 768px, 390px] Màn hình khóa iPhone ở hero còn chuỗi tiếng Anh kèm emoji ('Ava Chen: Also the new iPhone 18 Pro looks insane 😍', 'Apple Park'), pill QR cuối trang dùng emoticon 'của tôi :)', và có nút 'Trang chủ' thừa dưới PromptComposer",
    "[1440px, 768px] Carousel 'Dùng Thử Trực Tiếp Trên Trình Duyệt': thẻ Robot Jellyfish nền bạc sáng làm chữ trắng '3D / Robot Jellyfish' thiếu tương phản và hai mép carousel cắt cụt nhãn thẻ ('BẢN ĐỒ & TR...')",
    "[1440px, 768px, 390px] Hàng 3 cột .lp-proj-specs trong #du-an xuống dòng không đều (1 dòng vs 3 dòng ở 'Trực quan hóa số liệu') và nhãn phụ mono / tiêu đề cột footer hơi dịu"
  ]
}
```
