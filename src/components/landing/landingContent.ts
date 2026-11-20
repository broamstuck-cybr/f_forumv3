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
    headline: 'Chạy thử giao diện thật trước khi lấy mã.',
    body: 'Mỗi mẫu trong 196 giao diện đều mở kèm bản xem trước tương tác và liên kết nguồn gốc; bạn kiểm tra trực tiếp từng chuyển động cùng trạng thái nút bấm thay vì nhìn ảnh chụp tĩnh.',
    stickers: [
      { label: 'Xem trước tương tác', bg: '#EFCEBE', tilt: -3 },
      { label: 'Nguồn tham khảo', bg: '#BAD9E6', tilt: 2.5 },
    ],
    badge: 'prism',
  },
  {
    id: 'beat-viewport',
    headline: 'Đổi khung 390, 768 và 1440px ngay trên một màn hình.',
    body: 'Live View cô lập mã trong iframe sandbox không chia sẻ quyền đồng nguồn. Bạn kéo thử bố cục ở ba độ rộng chuẩn mà không làm rò rỉ dữ liệu từ phiên đang mở.',
    stickers: [
      { label: '390px · 768px · 1440px', bg: '#EBC9AE', tilt: -2 },
      { label: 'Chạy cô lập', bg: '#DDAD95', tilt: 3 },
    ],
    badge: 'viewport',
  },
  {
    id: 'beat-code',
    headline: 'Tách riêng HTML, CSS, JS để sửa trực tiếp tại chỗ.',
    body: 'Workspace chia rõ từng tệp mã nguồn. Trước khi bạn tải gói ZIP, bộ Diff & Check chạy 6 phép kiểm để đối chiếu thay đổi và tự động che mọi khóa bí mật.',
    stickers: [
      { label: 'HTML · CSS · JS', bg: '#B0AEC6', tilt: 2 },
      { label: '6 phép kiểm · Xuất ZIP', bg: '#EFCEBE', tilt: -2.5 },
    ],
    badge: 'code',
  },
  {
    id: 'beat-library',
    headline: '6.770 chi tiết UI/UX, 196 giao diện và 122 kho GitHub tiếng Việt.',
    body: 'Kho mở quy tụ thêm 61 công cụ AI cùng 83 mẫu chuyển động có sẵn prompt. Học sinh, sinh viên, giảng viên hay vibe coder đều mở được mã gốc để học cách dựng và gửi bản cải tiến lên Tri thức.',
    stickers: [
      { label: '6.770 chi tiết UI/UX', bg: '#BAD9E6', tilt: -2 },
      { label: '196 giao diện · 122 kho GitHub', bg: '#DDAD95', tilt: 2.5 },
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
  { id: 'd1', title: 'Mã tách bạch', text: 'Tệp HTML, CSS, JS độc lập để chỉnh ngay tại chỗ' },
  { id: 'd2', title: 'Prompt mở', text: 'Sao chép đặc tả gốc và đăng bản sửa lên Tri thức' },
  { id: 'd3', title: 'Kiểm 6 mục', text: 'Soát HTML, JS, khung 390/768/1440px, liên kết, khóa và A11y' },
  { id: 'd4', title: 'Hộp cát cô lập', text: 'Iframe sandbox tắt allow-same-origin, chặn rò rỉ phiên' },
];

export const OPEN_ACCESS_FEATURES: string[] = [
  'Live View cô lập mã trong sandbox kèm 6 phép kiểm trên 390px, 768px và 1440px',
  '196 giao diện tham khảo, 6.770 chi tiết UI/UX và 83 mẫu chuyển động kèm prompt',
  'Danh mục 122 kho GitHub tiếng Việt cùng 61 công cụ AI đã kiểm chứng đường dẫn',
  '15 lượt tạo mã miễn phí mỗi phiên, hỗ trợ gắn khóa API cá nhân lưu cục bộ',
];

export const FAQ_ITEMS: Array<{ id: string; question: string; answer: string }> = [
  {
    id: 'f1',
    question: 'F-Forum dùng để làm gì?',
    answer:
      'F-Forum là bàn dựng và kiểm định giao diện web trực tiếp trên trình duyệt cho học sinh, sinh viên, giảng viên cùng vibe coder. Bạn chọn mẫu từ Bàn soi, mở mã HTML/CSS/JS trong Workspace để chỉnh sửa, chạy 6 phép kiểm rồi chia sẻ lại kết quả lên Tri thức.',
  },
  {
    id: 'f2',
    question: 'Live View và Diff & Check hoạt động ra sao?',
    answer:
      'Live View nạp bản dựng vào iframe sandbox="allow-scripts" với referrerPolicy="no-referrer" và tắt hẳn allow-same-origin để cô lập trang chính. Khi bạn sửa mã, Diff & Check đối chiếu từng dòng thay đổi đồng thời chạy 6 phép kiểm: cấu trúc HTML, cú pháp JS, khung nhìn 390/768/1440px, liên kết nội bộ, quét khóa bí mật và tiêu chuẩn tiếp cận.',
  },
  {
    id: 'f3',
    question: 'Kho 196 giao diện, 6.770 chi tiết UI/UX và 122 kho GitHub gồm những gì?',
    answer:
      'Thư viện tổng hợp 6.770 chi tiết UI/UX chuẩn hóa, 196 giao diện chạy trực tiếp và 83 mẫu chuyển động có sẵn prompt. Ngoài ra, Bàn soi còn biên tập 122 kho GitHub tiếng Việt cùng 61 công cụ AI thực chiến để bạn tra cứu hoặc nạp thẳng vào Workspace.',
  },
  {
    id: 'f4',
    question: 'Chi phí và giới hạn lượt tạo mã là gì?',
    answer:
      'Mỗi phiên khách hoặc tài khoản thành viên có sẵn 15 lượt tạo mã miễn phí. Nếu cần chạy vượt định mức này, bạn gắn khóa API cá nhân (OpenAI-compatible, Anthropic hoặc Gemini) trong mục Cài đặt; trình duyệt chỉ giữ khóa ở bộ nhớ cục bộ và loại bỏ hoàn toàn khỏi tệp xuất ZIP.',
  },
];
