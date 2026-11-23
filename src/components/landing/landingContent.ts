export interface LandingChapter {
  id: string;
  code: string;
  label: string;
}

export interface KineticStageCard {
  id: string;
  title: string;
  category: string;
  imageUrl: string;
  fallbackUrl: string;
  tone: string;
}

export const LANDING_CHAPTERS: LandingChapter[] = [
  { id: 'top', code: 'I', label: 'Khởi đầu' },
  { id: 'quy-trinh', code: 'II', label: '50 Trưng bày' },
  { id: 'tuyen-ngon', code: 'III', label: 'Nghiên cứu' },
  { id: 'du-an', code: 'IV', label: 'Hệ thống' },
  { id: 'faq', code: 'V', label: 'Hỏi đáp' },
];

const FALLBACK_COURSE_CARD =
  'https://raw.githubusercontent.com/broamstuck-cybr/SOURCEOFKNOWLEDGFORAI/main/assets/previews/codefronts-course-card.png';
const FALLBACK_ISOMETRIC =
  'https://raw.githubusercontent.com/broamstuck-cybr/SOURCEOFKNOWLEDGFORAI/main/assets/previews/lucianlabs-isometric-data-blocks.png';
const FALLBACK_LIQUID_GLASS =
  'https://raw.githubusercontent.com/broamstuck-cybr/SOURCEOFKNOWLEDGFORAI/main/assets/previews/lucianlabs-liquid-glass-button.png';

export const TIDEWELL_CARDS: KineticStageCard[] = [
  {
    id: 'ff-space-voyage',
    title: 'Trục điều hướng không gian',
    category: 'Bố cục mở',
    imageUrl: 'https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/b5f79c5a-2ebd-41ef-865e-24c660ac98bd.png',
    fallbackUrl: FALLBACK_ISOMETRIC,
    tone: '#7DA3BB',
  },
  {
    id: 'ff-codenest',
    title: 'Bảng điều khiển mã nguồn',
    category: 'Hệ quản trị',
    imageUrl: 'https://threeui.com/social/pages/three-js/halftone-keyboard/keyboard.jpg',
    fallbackUrl: FALLBACK_COURSE_CARD,
    tone: '#DDAD95',
  },
  {
    id: 'ff-stellar-v2',
    title: 'Không gian đối thoại AI',
    category: 'Hội thoại',
    imageUrl: 'https://threeui.com/social/pages/three-js/retro-metallic/agent-selector.jpg',
    fallbackUrl: FALLBACK_ISOMETRIC,
    tone: '#BAD9E6',
  },
  {
    id: 'ff-transform-data',
    title: 'Dòng dữ liệu thời gian thực',
    category: 'Phân tích',
    imageUrl: 'https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/193afe38-41fa-4454-9d48-ed154b66d17c.png',
    fallbackUrl: FALLBACK_COURSE_CARD,
    tone: '#B0AEC6',
  },
  {
    id: 'ff-orbit-3d',
    title: 'Quỹ đạo tương tác 3D',
    category: 'Cảnh WebGL',
    imageUrl: 'https://threeui.com/social/pages/three-js/app-orbit.jpg',
    fallbackUrl: FALLBACK_LIQUID_GLASS,
    tone: '#EFCEBE',
  },
  {
    id: 'ff-aethera',
    title: 'Tạp chí học thuật số',
    category: 'Ấn phẩm',
    imageUrl: 'https://threeui.com/social/pages/three-js/ashen-press.jpg',
    fallbackUrl: FALLBACK_LIQUID_GLASS,
    tone: '#EBC9AE',
  },
  {
    id: 'ff-prompt-composer',
    title: 'Trình soạn thẻ tác vụ',
    category: 'Nhập liệu',
    imageUrl: FALLBACK_COURSE_CARD,
    fallbackUrl: FALLBACK_COURSE_CARD,
    tone: '#7DA3BB',
  },
  {
    id: 'ff-designpro',
    title: 'Hồ sơ trưng bày sản phẩm',
    category: 'Trình diễn',
    imageUrl: 'https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/4f690bd1-881a-4192-82f2-d714d34c8fb9.png',
    fallbackUrl: FALLBACK_COURSE_CARD,
    tone: '#DDAD95',
  },
  {
    id: 'ff-devices-3d',
    title: 'Mô phỏng thiết bị đa khung',
    category: 'Đa màn hình',
    imageUrl: 'https://threeui.com/social/pages/3d-assets/apple-devices.jpg',
    fallbackUrl: FALLBACK_ISOMETRIC,
    tone: '#BAD9E6',
  },
  {
    id: 'ff-theme-switch',
    title: 'Bộ chuyển sắc độ Mực và Giấy',
    category: 'Vi tương tác',
    imageUrl: FALLBACK_LIQUID_GLASS,
    fallbackUrl: FALLBACK_LIQUID_GLASS,
    tone: '#B0AEC6',
  },
  {
    id: 'ff-data-field',
    title: 'Lưới hạt cấu trúc động',
    category: 'Đồ họa',
    imageUrl: 'https://threeui.com/social/pages/three-js/structure-flow/data-field.jpg',
    fallbackUrl: FALLBACK_ISOMETRIC,
    tone: '#EFCEBE',
  },
  {
    id: 'ff-luminex',
    title: 'Bề mặt khúc xạ ánh sáng',
    category: 'Thị giác',
    imageUrl: 'https://threeui.com/social/pages/hero/advanced-glass-material.jpg',
    fallbackUrl: FALLBACK_LIQUID_GLASS,
    tone: '#EBC9AE',
  },
];

export interface ManifestoBeat {
  id: string;
  headline: string;
  body: string;
  stickers: Array<{ label: string; bg: string; tilt: number }>;
  badge: 'prism' | 'viewport' | 'code' | 'matrix';
}

export const MANIFESTO_BEATS: ManifestoBeat[] = [
  {
    id: 'beat-reality',
    headline: '01 · 02 · 03 — Không thiếu AI, mà thiếu lộ trình và kho mẫu chuẩn.',
    body: 'OECD PISA 2025 (9/2026) ghi nhận 95,9% học sinh dùng AI sáng tạo, nhưng vướng 3 điểm nghẽn: (01) người mới "vibe code" thiếu lộ trình bắt đầu; (02) dễ phụ thuộc câu trả lời AI có sẵn mà chưa biến được ý tưởng thành sản phẩm hoàn chỉnh; (03) muốn tự làm sản phẩm học tập nhưng thiếu nguồn mẫu chuẩn và không gian tập trung để lưu trữ, chia sẻ kinh nghiệm thực tế.',
    stickers: [
      { label: 'PISA 2025 · 95,9%', bg: '#EFCEBE', tilt: -2.5 },
      { label: '3 Thực trạng 01/02/03', bg: '#BAD9E6', tilt: 2 },
    ],
    badge: 'prism',
  },
  {
    id: 'beat-solution',
    headline: 'Biện pháp: Bộ khung UI/UX & Starter Kits kiểm định trước khi vào thư viện.',
    body: 'F-Forum cung cấp các bộ khung giao diện (UI/UX), mã nguồn mở và cấu trúc dự án mẫu cho web, ứng dụng và sản phẩm AI đã được phân loại, kiểm tra tính khả thi. Hệ thống tự động đối chiếu nhu cầu để gợi ý Kit phù hợp như chọn template trên Canva, giúp người mới "vibe coding" có nền tảng đúng chuẩn do cộng đồng chuyên gia biên soạn và AI hỗ trợ.',
    stickers: [
      { label: 'Starter Kits chuẩn', bg: '#EBC9AE', tilt: -2 },
      { label: 'Chuyên gia + AI gợi ý', bg: '#DDAD95', tilt: 2.5 },
    ],
    badge: 'viewport',
  },
  {
    id: 'beat-antislop',
    headline: 'Mục tiêu nghiên cứu: Làm chủ quy trình & Chống "AI Slop".',
    body: 'Đánh giá mức độ cải thiện khả năng tìm học liệu chuẩn, tư duy phản biện ý tưởng và tỷ lệ hoàn thiện sản phẩm thực tế của học sinh. Thay vì rơi vào bẫy sao chép hàng loạt rác nội dung rập khuôn từ AI (AI Slop), F-Forum cung cấp cấu trúc mẫu chọn lọc để người học tự lắp ghép, kiểm chứng và làm chủ quy trình sáng tạo.',
    stickers: [
      { label: 'Chống "AI Slop"', bg: '#B0AEC6', tilt: 2 },
      { label: 'Tư duy phản biện', bg: '#EFCEBE', tilt: -2.5 },
    ],
    badge: 'code',
  },
  {
    id: 'beat-survey',
    headline: 'Kết quả nghiên cứu: 91,2% trên 195 người dùng đánh giá cao mẫu UI/UX trực quan.',
    body: 'Khảo sát trên 195 học sinh và người dùng cho thấy 91,2% đánh giá cao việc tiếp cận mẫu thiết kế web và thành phần UI/UX trực quan thay vì làm từ con số không. Các Starter Kits tích hợp prompt và mã mẫu giúp hệ thống hóa lại nguồn tài nguyên kỹ thuật vốn phân tán, khó tra cứu trên GitHub.',
    stickers: [
      { label: '195 học sinh & người dùng', bg: '#BAD9E6', tilt: -2 },
      { label: '91,2% đánh giá cao', bg: '#DDAD95', tilt: 2.5 },
    ],
    badge: 'matrix',
  },
  {
    id: 'beat-open-workshop',
    headline: 'Bản địa hóa học đường Việt Nam & "Xưởng lắp ráp mở" miễn phí.',
    body: 'Toàn bộ "Tủ sách tài nguyên" và thư viện prompt được phân loại tiếng Việt bám sát bài toán phổ thông tại TH, THCS và THPT FPT. Khác công cụ AI thương mại làm thay hoàn toàn, F-Forum là một xưởng lắp ráp mở: học sinh tự chọn chủ đề, thành phần thiết kế, còn bạn làm vibe coding có sẵn Skills chuẩn để huấn luyện AI bài bản và dễ kiểm soát.',
    stickers: [
      { label: 'Xưởng lắp ráp mở', bg: '#EFCEBE', tilt: -2 },
      { label: 'Bản địa hóa Việt Nam', bg: '#BAD9E6', tilt: 2.5 },
    ],
    badge: 'prism',
  },
  {
    id: 'beat-architecture',
    headline: 'Cơ chế JSON mã hóa, Bộ lọc AI an toàn & Đồng bộ WebSocket.',
    body: 'Trình duyệt gửi yêu cầu API đăng nhập để máy chủ cùng AI xác minh; dữ liệu được mã hóa trong hệ thống tệp JSON. Bộ lọc AI ghi nhận spam, ngôn từ thô tục, cảnh cáo và vô hiệu hóa bài vi phạm. Kiến trúc phục vụ trọn bộ Hỏi đáp, Threads, Kho đề thi, Hồ sơ, API mã bảo mật riêng và WebSocket đồng bộ thời gian thực.',
    stickers: [
      { label: 'JSON + Bộ lọc AI', bg: '#EBC9AE', tilt: 2 },
      { label: 'WebSocket Real-time', bg: '#B0AEC6', tilt: -2 },
    ],
    badge: 'code',
  },
];

export const PROJECT_SHOWCASE_THUMBS: Record<string, string> = {
  'hms-space-voyage': 'ff-space-voyage',
  'hms-codenest': 'ff-codenest',
  'hms-stellar-ai-v2': 'ff-stellar-v2',
  'hms-transform-data': 'ff-transform-data',
  'hms-aethera': 'ff-aethera',
  'hms-luminex': 'ff-luminex',
};

export const OPEN_ACCESS_FEATURES: string[] = [
  '7.662 mẫu giao diện & Starter Kits đã kiểm tra tính khả thi (41 PinUI · 321 Motion AI · 961 ThreeUI · 892 GetLayers · 400 LucianLabs · 5.047 CodeFronts)',
  'Bản địa hóa tiếng Việt theo nhu cầu học đường TH, THCS và THPT FPT — Chống "AI Slop", làm chủ tư duy phản biện',
  'Xác minh tài khoản API, mã hóa dữ liệu trong tệp JSON cùng Bộ lọc AI phát hiện spam và ngôn từ thô tục',
  'Không gian Hỏi đáp, Threads, Kho đề thi, Hồ sơ, đóng gói website riêng và đồng bộ WebSocket thời gian thực',
];

export const FAQ_ITEMS: Array<{ id: string; question: string; answer: string }> = [
  {
    id: 'f1',
    question: 'FPT Forum (F-Forum) giải quyết 3 thực trạng nào của học sinh khi dùng AI?',
    answer:
      'Theo báo cáo OECD PISA 2025 (9/2026), 95,9% học sinh sử dụng AI trong sáng tạo nhưng gặp 3 điểm nghẽn: (01) người mới "vibe code" thiếu lộ trình bắt đầu; (02) dễ phụ thuộc câu trả lời AI có sẵn mà chưa biết biến ý tưởng thành sản phẩm hoàn chỉnh; (03) thiếu nguồn mẫu chuẩn để tự làm sản phẩm học tập. F-Forum tạo không gian tập trung để lưu trữ, tham khảo mẫu đã kiểm chứng và học hỏi kinh nghiệm thực tế.',
  },
  {
    id: 'f2',
    question: 'F-Forum chống "AI Slop" và khác gì các công cụ AI thương mại làm thay toàn bộ?',
    answer:
      'Thay vì để AI làm thay và tạo ra sản phẩm rập khuôn thiếu chiều sâu ("AI Slop"), F-Forum vận hành như một "Xưởng lắp ráp mở" miễn phí: học sinh tự chọn chủ đề, thành phần UI/UX trực quan (tương tự chọn template trên Canva) để tự lắp ghép và kiểm chứng, còn các bạn làm vibe coding có sẵn bộ kỹ năng (Skills) và Starter Kits chuẩn để huấn luyện AI làm việc bài bản, dễ kiểm soát.',
  },
  {
    id: 'f3',
    question: 'Kết quả khảo sát thực tế của nghiên cứu tại TH, THCS và THPT FPT cho thấy điều gì?',
    answer:
      'Khảo sát trên 195 học sinh và người dùng cho thấy 91,2% đánh giá cao việc được tiếp cận các mẫu thiết kế web và thành phần UI/UX trực quan, có tính thẩm mỹ cao thay vì tự thiết kế từ con số không. Việc hệ thống hóa lại các bộ prompt và mã nguồn vốn phân tán trên GitHub giúp rút ngắn thời gian tìm kiếm và nâng cao tỷ lệ hoàn thiện sản phẩm thực tế.',
  },
  {
    id: 'f4',
    question: 'Cơ chế xác minh, lưu trữ JSON, Bộ lọc AI và WebSocket trong F-Forum hoạt động ra sao?',
    answer:
      'Trình duyệt gửi yêu cầu API đăng nhập tới máy chủ để máy chủ và AI xác minh thông tin người dùng; dữ liệu được mã hóa trong hệ thống tệp JSON và cung cấp API mã bảo mật riêng. Bộ lọc AI tự động ghi nhận hành vi spam hoặc ngôn từ thô tục để cảnh cáo và vô hiệu hóa bài viết vi phạm. WebSocket đồng bộ hai chiều theo thời gian thực trên toàn hệ thống Hỏi đáp, Threads, Kho đề thi và Hồ sơ.',
  },
];
