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
    headline: 'Bấm thử trước khi mang về.',
    body: 'Mẫu nào cũng chạy được ngay trong khung. Bạn rê, bấm, gõ thử đúng như người dùng cuối sẽ làm — cảm giác đúng rồi mới lấy mã, khỏi phải sửa đi sửa lại vì một tấm ảnh trông đẹp hơn thực tế.',
    stickers: [
      { label: 'Bấm thử được', bg: '#EFCEBE', tilt: -3 },
      { label: 'Không xem ảnh tĩnh', bg: '#BAD9E6', tilt: 2.5 },
    ],
    badge: 'prism',
  },
  {
    id: 'beat-viewport',
    headline: 'Một mẫu, xem trên điện thoại lẫn màn hình lớn.',
    body: 'Chuyển qua lại giữa khung điện thoại và khung máy tính chỉ bằng một cú bấm. Bạn thấy ngay chỗ nào chữ chen nhau, chỗ nào nút quá nhỏ — trước khi đưa lên máy thật.',
    stickers: [
      { label: 'Điện thoại ↔ máy tính', bg: '#EBC9AE', tilt: -2 },
      { label: 'Xem liền một mạch', bg: '#DDAD95', tilt: 3 },
    ],
    badge: 'viewport',
  },
  {
    id: 'beat-code',
    headline: 'Sửa đúng chỗ, thấy ngay kết quả.',
    body: 'Mã tách thành từng tệp để bạn đọc không lẫn. Đổi một dòng là khung bên cạnh cập nhật, nên vòng lặp thử — sửa — xem của bạn ngắn lại thật nhiều.',
    stickers: [
      { label: 'Sửa là thấy', bg: '#B0AEC6', tilt: 2 },
      { label: 'Tệp rõ ràng', bg: '#EFCEBE', tilt: -2.5 },
    ],
    badge: 'code',
  },
  {
    id: 'beat-library',
    headline: 'Một chỗ để tìm, một chỗ để dựng.',
    body: 'Mẫu giao diện, công cụ, kho mã và chuyển động nằm chung một bàn soi. Tìm được thứ vừa mắt là mang thẳng vào Workspace, không phải mở thêm mười tab rồi tự ghép lại.',
    stickers: [
      { label: 'Tìm là ra', bg: '#BAD9E6', tilt: -2 },
      { label: 'Mang thẳng vào Workspace', bg: '#DDAD95', tilt: 2.5 },
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
  { id: 'd1', title: 'Đọc không lẫn', text: 'Mỗi tệp một việc, mở ra là hiểu ngay đang sửa gì' },
  { id: 'd2', title: 'Hỏi bằng lời thường', text: 'Mô tả điều bạn muốn, không cần thuộc tên thuộc tính' },
  { id: 'd3', title: 'Soát giúp bạn', text: 'Bấm một lần là biết chỗ nào còn vướng trước khi gửi đi' },
  { id: 'd4', title: 'Thử mà không sợ', text: 'Bản dựng chạy riêng, nghịch thoải mái không đụng dữ liệu thật' },
];

export const OPEN_ACCESS_FEATURES: string[] = [
  'Xem trước chạy thật, thử mọi trạng thái trước khi lấy mã',
  'Mẫu giao diện, chuyển động và công cụ nằm chung một bàn soi',
  'Kho mã và công cụ chọn lọc, mở ra là dùng được ngay',
  'Dùng miễn phí mỗi phiên, cần thêm thì gắn khóa riêng của bạn',
];

export const FAQ_ITEMS: Array<{ id: string; question: string; answer: string }> = [
  {
    id: 'f1',
    question: 'F-Forum giúp mình làm nhanh hơn ở đâu?',
    answer:
      'Ở chỗ bạn không phải bắt đầu từ trang giấy trắng. Chọn một mẫu vừa mắt trong Bàn soi, mở sang Workspace, nhờ trợ lý sửa theo ý mình rồi xem kết quả ngay bên cạnh. Việc dựng một trang giới thiệu hay một bảng điều khiển nhỏ thường xong trong một buổi thay vì vài ngày.'
  },
  {
    id: 'f2',
    question: 'Khung xem trước có an toàn khi mình dán mã lạ không?',
    answer:
      'Có. Bản dựng chạy trong một khung tách biệt với trang chính, không đọc được dữ liệu phiên của bạn. Nếu đoạn mã có vòng lặp chạy mãi, khung tự dừng và báo lỗi thay vì treo cả trang. Bạn cứ thử thoải mái.'
  },
  {
    id: 'f3',
    question: 'Trong bàn soi có những gì?',
    answer:
      'Bốn nhóm chính: giao diện mẫu để soi và tái sử dụng, hiệu ứng và chuyển động để thử cảm giác, không gian ba chiều để nghịch bằng chuột, và một tủ tài nguyên gồm công cụ lẫn kho mã. Tất cả đều mở được ngay, không cần cài gì.'
  },
  {
    id: 'f4',
    question: 'Dùng miễn phí được bao lâu?',
    answer:
      'Mỗi phiên có sẵn một lượng lượt tạo mã miễn phí, đủ để thử vài ý tưởng. Khi cần làm nhiều hơn, bạn gắn khóa riêng của mình trong Cài đặt — khóa chỉ nằm trên máy bạn và không bao giờ đi kèm tệp xuất ra.'
  },
];
