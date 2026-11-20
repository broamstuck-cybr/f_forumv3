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
  { id: 'quy-trinh', code: 'II', label: 'Quy trình' },
  { id: 'san-pham', code: 'III', label: 'Sản phẩm' },
  { id: 'tuyen-ngon', code: 'IV', label: 'Tuyên ngôn' },
  { id: 'faq', code: 'V', label: 'Hỏi đáp' },
];

const FALLBACK_COURSE_CARD =
  'https://raw.githubusercontent.com/broamstuck-cybr/SOURCEOFKNOWLEDGFORAI/main/assets/previews/codefronts-course-card.png';
const FALLBACK_ISOMETRIC =
  'https://raw.githubusercontent.com/broamstuck-cybr/SOURCEOFKNOWLEDGFORAI/main/assets/previews/lucianlabs-isometric-data-blocks.png';
const FALLBACK_LIQUID_GLASS =
  'https://raw.githubusercontent.com/broamstuck-cybr/SOURCEOFKNOWLEDGFORAI/main/assets/previews/lucianlabs-liquid-glass-button.png';

export const STAGE_CHIP_PREVIEW = {
  imageUrl: 'https://www.pinui.xyz/clips/thumb/magnify.webp',
  fallbackUrl: FALLBACK_LIQUID_GLASS,
  label: 'Khung soi giao diện',
};

export const TIDEWELL_CARDS: KineticStageCard[] = [
  {
    id: 'ff-space-voyage',
    title: 'Trục điều hướng không gian',
    category: 'Bố cục mở',
    imageUrl: 'https://www.pinui.xyz/blocx/thumbs/orbit-hero.webp',
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
    imageUrl: 'https://www.pinui.xyz/blocx/thumbs/luna-hero.webp',
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
    imageUrl: 'https://www.pinui.xyz/clips/thumb/prompt-composer.webp',
    fallbackUrl: FALLBACK_COURSE_CARD,
    tone: '#7DA3BB',
  },
  {
    id: 'ff-designpro',
    title: 'Hồ sơ trưng bày sản phẩm',
    category: 'Trình diễn',
    imageUrl: 'https://www.pinui.xyz/blocx/thumbs/storybook-hero.webp',
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
    imageUrl: 'https://www.pinui.xyz/clips/thumb/theme-switch.webp',
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
    imageUrl: 'https://www.pinui.xyz/blocx/thumbs/partylabs-hero.webp',
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
    id: 'beat-preview',
    headline: 'Xem bản chạy thật trước khi chọn một giao diện.',
    body: 'Mỗi mẫu có bản xem trước tương tác và nguồn tham khảo đi kèm, nên bạn thấy chuyển động, bố cục và trạng thái thay vì chỉ một ảnh tĩnh.',
    stickers: [
      { label: 'Xem trước tương tác', bg: '#EFCEBE', tilt: -3 },
      { label: 'Nguồn tham khảo', bg: '#BAD9E6', tilt: 2.5 },
    ],
    badge: 'prism',
  },
  {
    id: 'beat-viewport',
    headline: 'Đổi khung 390, 768, 1440 ngay trong một cửa sổ.',
    body: 'Live View chạy mã trong iframe sandbox, tách khỏi trang chính, để bạn kiểm tra bố cục ở từng độ rộng mà không lo ảnh hưởng đến phiên làm việc.',
    stickers: [
      { label: '390px · 768px · 1440px', bg: '#EBC9AE', tilt: -2 },
      { label: 'Chạy cô lập', bg: '#DDAD95', tilt: 3 },
    ],
    badge: 'viewport',
  },
  {
    id: 'beat-code',
    headline: 'Mã sạch, đọc được và chỉnh được tại chỗ.',
    body: 'Mỗi bản dựng tách thành HTML, CSS và JS riêng. Bạn đối chiếu thay đổi, chỉnh thông số rồi tải về dạng ZIP sau khi khóa bí mật đã được quét.',
    stickers: [
      { label: 'HTML · CSS · JS', bg: '#B0AEC6', tilt: 2 },
      { label: 'Xuất ZIP', bg: '#EFCEBE', tilt: -2.5 },
    ],
    badge: 'code',
  },
  {
    id: 'beat-library',
    headline: '6.770 chi tiết UI/UX từ 196 giao diện tham khảo.',
    body: 'Học sinh, giảng viên và người làm web mở mã nguồn tham khảo, sao chép prompt và chia sẻ lại cho cộng đồng, dùng miễn phí ngay trên trình duyệt.',
    stickers: [
      { label: '6.770 chi tiết UI/UX', bg: '#BAD9E6', tilt: -2 },
      { label: '196 giao diện', bg: '#DDAD95', tilt: 2.5 },
    ],
    badge: 'matrix',
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

export const STAGE_SHOWCASE_SHOTS: string[] = ['ff-space-voyage', 'ff-codenest', 'ff-aethera', 'ff-designpro'];

export const STAGE_DIFFERENTIATORS: Array<{ id: string; title: string; text: string }> = [
  { id: 'd1', title: 'Mã sạch, sửa được', text: 'HTML, CSS, JS tách riêng, chỉnh tại chỗ' },
  { id: 'd2', title: 'Prompt dùng chung', text: 'Sao chép và chia sẻ cho cộng đồng' },
  { id: 'd3', title: 'Ba khung nhìn', text: 'Đổi 390, 768, 1440px trong một cửa sổ' },
  { id: 'd4', title: 'Chạy cô lập', text: 'Live View sandbox, không đồng nguồn' },
];

export const OPEN_ACCESS_FEATURES: string[] = [
  'Live View chạy mã trong sandbox trên 390px, 768px và 1440px',
  'Kho 196 giao diện tham khảo và 6.770 chi tiết UI/UX',
  'Xem mã HTML, CSS, JS sạch, sao chép prompt và tải gói ZIP',
  '15 lượt tạo mã miễn phí mỗi phiên và hỗ trợ khóa API cá nhân',
];

export const FAQ_ITEMS: Array<{ id: string; question: string; answer: string }> = [
  {
    id: 'f1',
    question: 'F-Forum dùng để làm gì?',
    answer:
      'F-Forum là nơi xem giao diện chạy thật, đọc mã HTML, CSS, JS sạch, chỉnh thông số và sao chép prompt. Công cụ dành cho học sinh, sinh viên, giảng viên, vibe coder và người thiết kế web.',
  },
  {
    id: 'f2',
    question: 'Live View và Diff & Check hoạt động ra sao?',
    answer:
      'Bản dựng chạy trong iframe sandbox="allow-scripts", không bật allow-same-origin và có referrerPolicy="no-referrer". Diff & Check so sánh thay đổi rồi kiểm tra 6 mục: cấu trúc HTML, cú pháp JS, bố cục 390/768/1440px, liên kết nội bộ, khóa bí mật và tiếp cận.',
  },
  {
    id: 'f3',
    question: '196 giao diện và 6.770 chi tiết UI/UX đến từ đâu?',
    answer:
      'Thư viện gồm 196 giao diện, mã nguồn cùng 6.770 chi tiết UI/UX về bố cục, thành phần tương tác, cảnh 3D và chuyển động để người dùng xem, chạy thử và mang trực tiếp vào Workspace.',
  },
  {
    id: 'f4',
    question: 'Chi phí và giới hạn lượt tạo mã là gì?',
    answer:
      'F-Forum miễn phí với 15 lượt tạo mã tiêu chuẩn cho mỗi phiên khách hoặc tài khoản thành viên. Khi cần thêm, bạn nhập khóa API cá nhân trong Cài đặt; khóa chỉ lưu cục bộ trong trình duyệt và không nằm trong tệp sao lưu.',
  },
];
