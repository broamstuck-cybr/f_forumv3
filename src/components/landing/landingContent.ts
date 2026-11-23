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
  { id: 'quy-trinh', code: 'II', label: 'Template' },
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
    headline: '3 điểm nghẽn khi học sinh dùng AI: thiếu lộ trình, phụ thuộc và thiếu mẫu chuẩn.',
    body: 'OECD PISA 2025 (9/2026) ghi nhận 95,9% học sinh dùng AI sáng tạo, nhưng vướng 3 điểm nghẽn: (01) người mới "vibe code" thiếu lộ trình bắt đầu; (02) dễ phụ thuộc câu trả lời có sẵn thay vì biến ý tưởng thành sản phẩm; (03) thiếu kho mẫu chuẩn và không gian tập trung để lưu trữ, chia sẻ kinh nghiệm thực tế.',
    stickers: [
      { label: 'PISA 2025 · 95,9%', bg: '#BFE9D9', tilt: -2.5 },
      { label: '3 điểm nghẽn 01–03', bg: '#C6E0E4', tilt: 2 },
    ],
    badge: 'prism',
  },
  {
    id: 'beat-solution',
    headline: 'Bộ khung UI/UX & Starter Kits kiểm định khả thi trước khi vào thư viện.',
    body: 'F-Forum cung cấp các bộ khung UI/UX, mã nguồn mở và cấu trúc dự án mẫu cho web, ứng dụng và sản phẩm AI đã được phân loại, kiểm tra tính khả thi. Hệ thống đối chiếu nhu cầu để gợi ý Kit phù hợp tương tự chọn template trên Canva, giúp người mới có nền tảng chuẩn.',
    stickers: [
      { label: 'Starter Kits kiểm định', bg: '#E9D5BE', tilt: -2 },
      { label: 'Gợi ý theo nhu cầu', bg: '#BFE9D9', tilt: 2.5 },
    ],
    badge: 'viewport',
  },
  {
    id: 'beat-antislop',
    headline: 'Chống "AI Slop": tự lắp ghép, phản biện và làm chủ quy trình.',
    body: 'Nghiên cứu đánh giá khả năng tìm học liệu chuẩn, tư duy phản biện ý tưởng và tỷ lệ hoàn thiện sản phẩm thực tế của học sinh. Thay vì sao chép hàng loạt sản phẩm rập khuôn từ AI (AI Slop), người học dùng cấu trúc mẫu chọn lọc để tự lắp ghép, kiểm chứng và làm chủ quy trình sáng tạo.',
    stickers: [
      { label: 'Chống "AI Slop"', bg: '#D2E2DE', tilt: 2 },
      { label: 'Tư duy phản biện', bg: '#E9D5BE', tilt: -2.5 },
    ],
    badge: 'code',
  },
  {
    id: 'beat-survey',
    headline: 'Khảo sát 195 người dùng: 91,2% đánh giá cao mẫu UI/UX trực quan.',
    body: 'Khảo sát thực tế trên 195 học sinh và người dùng cho thấy 91,2% đánh giá cao việc tiếp cận mẫu thiết kế web và thành phần UI/UX trực quan thay vì làm từ con số không. Các Starter Kits tích hợp prompt và mã mẫu giúp hệ thống hóa lại tài nguyên kỹ thuật vốn phân tán trên GitHub.',
    stickers: [
      { label: '195 người tham gia', bg: '#C6E0E4', tilt: -2 },
      { label: '91,2% đánh giá cao', bg: '#BFE9D9', tilt: 2.5 },
    ],
    badge: 'matrix',
  },
  {
    id: 'beat-open-workshop',
    headline: 'Bản địa hóa học đường Việt Nam & Xưởng lắp ráp mở miễn phí.',
    body: 'Toàn bộ Tủ sách tài nguyên và thư viện prompt được phân loại bằng tiếng Việt bám sát bài toán học tập của học sinh & sinh viên yêu công nghệ. Khác công cụ AI thương mại làm thay hoàn toàn, F-Forum là xưởng lắp ráp mở: học sinh tự chọn thành phần thiết kế, còn người làm vibe coding có sẵn Skills chuẩn để kiểm soát AI.',
    stickers: [
      { label: 'Xưởng lắp ráp mở', bg: '#BFE9D9', tilt: -2 },
      { label: 'Cộng đồng F-Forum', bg: '#C6E0E4', tilt: 2.5 },
    ],
    badge: 'prism',
  },
  {
    id: 'beat-architecture',
    headline: 'Xác minh API, dữ liệu JSON mã hóa, Bộ lọc AI & WebSocket.',
    body: 'Trình duyệt gửi yêu cầu API đăng nhập để máy chủ và AI xác minh; dữ liệu được mã hóa trong hệ thống tệp JSON kèm mã bảo mật riêng. Bộ lọc AI phát hiện spam và ngôn từ thô tục để cảnh cáo, vô hiệu hóa bài vi phạm, đồng bộ thời gian thực qua WebSocket cho Hỏi đáp, Threads và Kho đề thi.',
    stickers: [
      { label: 'JSON + Bộ lọc AI', bg: '#E9D5BE', tilt: 2 },
      { label: 'WebSocket Real-time', bg: '#D2E2DE', tilt: -2 },
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
  '7.662 mẫu giao diện & Starter Kits kiểm định khả thi (41 PinUI · 321 Motion AI · 961 ThreeUI · 892 GetLayers · 400 LucianLabs · 5.047 CodeFronts) cùng 60 công cụ và 122 repo',
  'Bản địa hóa tiếng Việt theo bài toán học tập của học sinh & sinh viên yêu công nghệ — Chống "AI Slop", rèn tư duy phản biện',
  'Xác minh tài khoản API, mã hóa dữ liệu tệp JSON cùng Bộ lọc AI phát hiện và xử lý spam, ngôn từ thô tục',
  'Không gian Hỏi đáp, Threads, Kho đề thi, Hồ sơ học tập, đóng gói website riêng và đồng bộ WebSocket thời gian thực',
];

export const FAQ_ITEMS: Array<{ id: string; question: string; answer: string }> = [
  {
    id: 'f1',
    question: 'F-Forum giải quyết 3 thực trạng nào khi học sinh dùng AI?',
    answer:
      'Theo báo cáo OECD PISA 2025 (9/2026), 95,9% học sinh sử dụng AI trong sáng tạo nhưng vướng 3 điểm nghẽn: (01) người mới "vibe code" thiếu lộ trình bắt đầu; (02) dễ phụ thuộc câu trả lời AI có sẵn mà chưa biến được ý tưởng thành sản phẩm hoàn chỉnh; (03) thiếu nguồn mẫu chuẩn để tham khảo. F-Forum tập trung học liệu kiểm chứng và kinh nghiệm thực tế vào một không gian chung.',
  },
  {
    id: 'f2',
    question: 'F-Forum chống "AI Slop" và khác gì các công cụ AI làm thay toàn bộ?',
    answer:
      'Thay vì tạo ra sản phẩm rập khuôn từ một câu lệnh ("AI Slop"), F-Forum vận hành như một Xưởng lắp ráp mở miễn phí cho cộng đồng F-Forum: học sinh tự chọn chủ đề, ghép các thành phần UI/UX trực quan (tương tự chọn template trên Canva) để tự kiểm chứng, còn người làm vibe coding có sẵn Skills và Starter Kits chuẩn để kiểm soát đầu ra của AI.',
  },
  {
    id: 'f3',
    question: 'Kết quả khảo sát trên 195 người dùng cho thấy điều gì?',
    answer:
      'Khảo sát trên 195 học sinh và người dùng ghi nhận 91,2% đánh giá cao việc tiếp cận trực tiếp các mẫu thiết kế web và thành phần UI/UX trực quan thay vì tự thiết kế từ con số không. Việc hệ thống hóa 7.662 mẫu giao diện, 60 công cụ và 122 repo từ GitHub giúp rút ngắn thời gian tra cứu và nâng tỷ lệ hoàn thiện sản phẩm thực tế.',
  },
  {
    id: 'f4',
    question: 'Cơ chế xác minh, lưu trữ JSON, Bộ lọc AI và WebSocket hoạt động ra sao?',
    answer:
      'Trình duyệt gửi yêu cầu API đăng nhập để máy chủ và AI xác minh thông tin người dùng; dữ liệu được mã hóa trong hệ thống tệp JSON kèm API mã bảo mật riêng. Bộ lọc AI tự động ghi nhận hành vi spam hoặc ngôn từ thô tục để cảnh cáo và vô hiệu hóa bài viết vi phạm. WebSocket đồng bộ hai chiều theo thời gian thực trên toàn hệ thống Hỏi đáp, Threads, Kho đề thi và Hồ sơ.',
  },
];
