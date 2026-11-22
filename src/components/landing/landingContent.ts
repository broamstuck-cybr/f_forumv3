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
    headline: 'Chạy thử giao diện thật trước khi lấy mã.',
    body: 'Mỗi mẫu giao diện đều chạy trực tiếp cùng trạng thái nút bấm và hiệu ứng thật ngay trên trình duyệt, không còn cảnh đoán qua ảnh chụp tĩnh.',
    stickers: [
      { label: 'Xem trước tương tác', bg: '#EFCEBE', tilt: -3 },
      { label: 'Chạy tại chỗ', bg: '#BAD9E6', tilt: 2.5 },
    ],
    badge: 'prism',
  },
  {
    id: 'beat-viewport',
    headline: 'Đổi khung Di động, Tablet và Desktop ngay trên một màn hình.',
    body: 'Khung xem thử chạy tách biệt với trang chính. Bạn kéo thử bố cục trên từng cỡ màn hình mà không ảnh hưởng tới tài khoản hay dữ liệu đang mở.',
    stickers: [
      { label: 'Đa khung nhìn', bg: '#EBC9AE', tilt: -2 },
      { label: 'Chạy tách biệt', bg: '#DDAD95', tilt: 3 },
    ],
    badge: 'viewport',
  },
  {
    id: 'beat-code',
    headline: 'Tách riêng HTML, CSS, JS để sửa trực tiếp tại chỗ.',
    body: 'Workspace chia rõ từng tệp mã nguồn. Trước khi bạn tải gói ZIP, bộ kiểm định tự động đối chiếu thay đổi và ẩn mọi khóa bí mật.',
    stickers: [
      { label: 'HTML · CSS · JS', bg: '#B0AEC6', tilt: 2 },
      { label: 'Kiểm định · Xuất ZIP', bg: '#EFCEBE', tilt: -2.5 },
    ],
    badge: 'code',
  },
  {
    id: 'beat-library',
    headline: 'Kho linh kiện UI/UX chuẩn hóa và cộng đồng chia sẻ prompt.',
    body: 'Học sinh, sinh viên, giảng viên và vibe coder đều mở được mã gốc để học cách dựng, tùy biến và đăng bản cải tiến lên Tri thức.',
    stickers: [
      { label: 'Thư viện mở', bg: '#BAD9E6', tilt: -2 },
      { label: 'Cộng đồng Việt Nam', bg: '#DDAD95', tilt: 2.5 },
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

export const OPEN_ACCESS_FEATURES: string[] = [
  'Khung xem thử chạy tách biệt kèm bộ kiểm tra lỗi tự động',
  'Kho linh kiện tương tác, hiệu ứng 3D, chuyển động và bố cục có sẵn prompt',
  'Danh mục công cụ AI và kho mã nguồn đã chọn lọc phục vụ học tập',
  '15 lượt tạo mã miễn phí mỗi phiên, hỗ trợ gắn khóa API cá nhân lưu cục bộ',
];

export const FAQ_ITEMS: Array<{ id: string; question: string; answer: string }> = [
  {
    id: 'f1',
    question: 'F-Forum dùng để làm gì?',
    answer:
      'F-Forum là bàn dựng và kiểm định giao diện web trực tiếp trên trình duyệt cho học sinh, sinh viên, giảng viên cùng vibe coder. Bạn chọn mẫu từ Bàn soi, mở mã HTML/CSS/JS trong Workspace để chỉnh sửa, kiểm tra tự động rồi chia sẻ lại kết quả lên Tri thức.',
  },
  {
    id: 'f2',
    question: 'Khung xem trực tiếp và bộ kiểm định hoạt động ra sao?',
    answer:
      'Bản dựng chạy trong khung xem thử tách biệt với trang chính để bảo vệ tài khoản đang đăng nhập. Khi bạn chỉnh sửa, hệ thống đối chiếu thay đổi và rà soát cấu trúc trang, lỗi kịch bản, bố cục đa màn hình, khóa bí mật và tiêu chuẩn tiếp cận.',
  },
  {
    id: 'f3',
    question: 'Kho tài nguyên trong F-Forum gồm những gì?',
    answer:
      'Thư viện hợp nhất các linh kiện tương tác, bố cục web, hiệu ứng đổ bóng, cảnh 3D và chuyển động có sẵn prompt đặc tả, giúp bạn tra cứu hoặc nạp thẳng vào Workspace để tùy biến ngay.',
  },
  {
    id: 'f4',
    question: 'Chi phí và giới hạn lượt tạo mã là gì?',
    answer:
      'Mỗi phiên khách hoặc tài khoản thành viên có sẵn 15 lượt tạo mã miễn phí. Nếu cần chạy vượt định mức này, bạn gắn khóa API cá nhân (OpenAI-compatible, Anthropic hoặc Gemini) trong mục Cài đặt; trình duyệt chỉ giữ khóa ở bộ nhớ cục bộ và loại bỏ hoàn toàn khỏi tệp xuất ZIP.',
  },
];
