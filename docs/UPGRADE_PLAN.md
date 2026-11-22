# Kế hoạch nâng cấp F-FORUM v3

Trạng thái ghi ở đây là **đã kiểm chứng**, không phải ý định. Mỗi ô `[x]` đi kèm
bằng chứng chạy được (`tsc`, `npm run build`, `node --test`, curl API, hoặc
script đo viết riêng). Ô `[~]` là đã làm một phần, ô `[ ]` là chưa.

## Nguyên tắc bất biến

| # | Nguyên tắc | Trạng thái | Ghi chú |
|---|---|---|---|
| 1 | Zero External Leakage | `[x]` | `grep -rn 'target="_blank"' src` chỉ còn 0 kết quả ngoài luồng nội bộ; các nút "Mở nguồn / Trang gốc / Mở trang gốc" đã bị thay bằng hành động nội bộ (đính kèm, chép liên kết, mở Workspace). |
| 2 | Strict Reuse Policy | `[x]` | SearchCard, Chips, LiquidTabs, ReactionBar (tim PinUI), FileBox, `original/dynamic-drop-zone`, `original/theme-switch`, Three.js đều là component có sẵn trong kho, không viết lại bản sao. |
| 3 | Cơ chế thật, không mock | `[~]` | Live Preview đã gate theo mã thật; ThreeStage chạy WebGL thật; telemetry Admin đọc từ bộ đếm server thật. Phần "Chuyển động" còn phụ thuộc bản dựng sẵn của từng mục. |
| 4 | Zero Status Clutter | `[x]` | Không còn nhãn `LIVE` / `ACTIVE` trong `src`. |
| 5 | Anti-regression | `[x]` | `npm run build` + `node --test tests/core.test.mjs` xanh sau mỗi cụm thay đổi. |

## Module 1 — Demo sản phẩm & Explore

- `[x]` Bỏ "Mở trang gốc" khỏi sân khấu 3D và bỏ `Trang gốc` khỏi thẻ chi tiết.
- `[x]` Nhóm **Không gian 3D** giờ là sân khấu WebGL thật (`ThreeStage.tsx`): kéo xoay, lăn/chụm thu phóng, 3 hình học, nút reset, tôn trọng reduced-motion.
- `[x]` Bỏ dòng boilerplate `Lưới lợi ích 3 cột + dải kêu gọi hành động`; hộp thoại mẫu chuyển động bỏ hẳn ô `ms` và `easing`.
- `[x]` Mọi mục không có bản dựng chạy được đều hiện lời mời tái tạo + nút chép bản mô tả, thay vì một khung nửa vời.
- `[ ]` **Chưa xong:** dựng lại bố cục showcase 1:1 theo Motion AI (Ảnh 2) — mới xử lý phần chữ và luồng, chưa đối chiếu từng khối thị giác với ảnh gốc.
- `[~]` Năm danh mục: `Tương tác` (PinUIPlayground thật), `Không gian 3D` (WebGL thật), `Hiệu ứng`/`Bố cục` (SandboxPreview chạy `previewHtml` thật), `Chuyển động` (một phần mục chỉ có prompt, chưa có bản dựng).

## Module 2 — Tìm kiếm & tủ tài nguyên

- `[x]` `SearchCard` PinUI trải hết bề ngang (`max-width: 1120px`, cao 54px).
- `[x]` Tim + lưu đồng bộ chuẩn PinUI qua `ReactionBar` (icon tim thật, nảy lò xo khi thả) — mọi nơi dùng chung một component.
- `[x]` Dòng `Nhiều quá? Đơn giản nha!!!` nằm ngay dưới thanh tìm kiếm.
- `[x]` Nút **Hộp File 3D** (khối isometric CSS, nắp mở/khép theo trạng thái tủ).
- `[x]` Tủ hồ sơ: nhóm theo danh mục, tag riêng lọc được, mỗi tài nguyên đúng một dòng chỉ có tên, tên dài cắt ellipsis, không nhãn LIVE.
- `[x]` Script kiểm: 61 tài nguyên, tên dài nhất 74 ký tự vẫn một dòng.

## Module 3 — Workspace & Live Preview

- `[x]` Xoá sạch chữ "Arena" khỏi UI (nhãn rail, aria-label, toast, prompt, tài liệu sinh ra).
- `[x]` `hasGeneratedWebCode()` gate Live Preview: 3 tệp khung nhận diện bằng dấu vân tay, sửa 1 ký tự là mở khoá.
- `[x]` Trạng thái chờ `PreviewWaiting` có thông điệp + 3 câu mẫu bấm là điền vào ô soạn.
- `[x]` Kiểm chứng gate bằng script: khung gốc → `false`, sửa index.html → `true`, thêm tệp mới → `true`, rỗng → `false`.

## Module 4 — Theme, chuyển sáng/tối, preset nền

- `[x]` `syncPageTheme()` ghi theme **trong** animation tại `PAGE_COMMIT_AT = 0.34`, áp cho cả 3 hiệu ứng (droplet/circle, rain, diwali) + `commit()` làm lưới an toàn.
- `[x]` `@property --bg/--bg-raised/--fg` + `html[data-theme-blend='open']` tween 380ms, có nhánh reduced-motion.
- `[x]` Giọt nước dùng bề mặt `raised` của theme mới.
- `[x]` 4 preset gradient mới theo Color Theory (Godray Amber, Mesh Dusk, Jade Halo, Rose Clay) + 2 preset cũ nay có gradient thật (Obsidian Foundry, Paper Ivory), khai báo token sáng/tối cho từng preset.
- `[x]` Dropzone sao lưu thay bằng `original/dynamic-drop-zone` của PinUI (cả Settings lẫn Workspace).
- `[ ]` **Chưa xong:** "+20% độ rõ nét" — chưa có phép đo tương phản nào chạy trên toàn bộ cặp màu chữ/nền.

## Module 5 — Copywriting

- `[x]` Xoá sạch `6.770`, `196 giao diện`, `390 · 768 · 1440`, `420 ms`, `02 · thông số & mã nguồn`, `LIVE VIEW`, `cách F-Forum làm việc` khỏi nội dung giới thiệu (kiểm bằng grep).
- `[x]` Viết lại manifest, 4 nhịp, 4 điểm khác biệt, FAQ, mô tả meta `App.tsx`.
- `[ ]` **Chưa xong:** rà giọng văn lần hai trên toàn bộ chuỗi trong `src/components/launchpad`, `features/workspace`, `community` — mới xử lý lớp landing.

## Module 6 — Admin Panel

- `[x]` Thêm chuỗi ngày thật vào server (`telemetryHistory`, 30 ngày) — ghi khi có lượt AI thật.
- `[x]` Tăng trưởng người dùng tính từ `createdAt` thật của tài khoản.
- `[x]` `AdminCharts`: hoạt động máy chủ theo ngày (4 chỉ số, tooltip, bàn phím), tài khoản cộng dồn, khối tài nguyên & vận hành.
- `[x]` Kiểm chứng: gọi `recordAiTelemetry` 4 lần → `history` có 1 ngày `{aiRequests:4, success:2, fallback:1, quotaBlocked:1}`; dữ liệu thử đã được đặt lại về 0.
- `[ ]` **Chưa xong:** rà layout Admin trên 390/768/1440 bằng mắt — môi trường này không có trình duyệt chụp ảnh.

## Kiểm định đã chạy

| Lệnh | Kết quả |
|---|---|
| `npx tsc --noEmit` | 0 lỗi (sau mỗi cụm thay đổi) |
| `npm run build` | xanh, chunk `three` tách riêng |
| `node --test tests/core.test.mjs` | 5 suite con xanh |
| Probe telemetry (`tsx`) | ghi/đọc đúng, rồi reset về 0 |
| Gate Live Preview (script) | 4/4 ca đúng như kỳ vọng |
| `grep` rà soát | 0 "Arena" trong UI, 0 `LIVE`, 0 `target="_blank"` sót |
