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

export const MANIFESTO_TEXT =
  'Một giao diện đáng tin không dừng ở bản vẽ tĩnh. Nó bắt đầu từ câu hỏi đúng, chạy cô lập trong Live View, đi qua 6 phép kiểm của Diff & Check và đối chiếu trực tiếp với 6.770 mẫu thuộc 196 cấu trúc nền.';

export interface ManifestoBeat {
  id: string;
  headline: string;
  body: string;
  stickers: Array<{ label: string; bg: string; tilt: number }>;
  badge: 'prism' | 'viewport' | 'redpen' | 'matrix';
}

export const MANIFESTO_BEATS: ManifestoBeat[] = [
  {
    id: 'beat-question',
    headline: 'Đừng tin một giao diện đẹp nếu chưa thấy nó chạy.',
    body: 'Viết mã bằng AI rất nhanh, nhưng tốc độ không đồng nghĩa với độ tin cậy. F-Forum đặt câu hỏi phản biện trước khi sinh dòng HTML đầu tiên.',
    stickers: [
      { label: 'Câu hỏi đúng', bg: '#EFCEBE', tilt: -3 },
      { label: 'Chạy cô lập', bg: '#BAD9E6', tilt: 2.5 },
    ],
    badge: 'prism',
  },
  {
    id: 'beat-sandbox',
    headline: 'Mọi bản dựng đều chạy trong hộp cát tách quyền đồng nguồn.',
    body: 'Live View thực thi mã qua iframe sandbox="allow-scripts" và chặn rò rỉ referrer, cho phép soi thẳng trên 390px, 768px và 1440px.',
    stickers: [
      { label: '390px · 768px · 1440px', bg: '#EBC9AE', tilt: -2 },
      { label: 'Không đồng nguồn', bg: '#DDAD95', tilt: 3 },
    ],
    badge: 'viewport',
  },
  {
    id: 'beat-redpen',
    headline: 'Chấm bằng bút đỏ trên từng thay đổi trước khi xuất tệp.',
    body: 'Bộ Diff & Check rà soát 6 phép kiểm: cấu trúc HTML, cú pháp JS, khung nhìn di động, liên kết nội bộ, tiếp cận và quét khóa bí mật trước khi đóng gói ZIP.',
    stickers: [
      { label: '6 phép kiểm', bg: '#B0AEC6', tilt: 2 },
      { label: 'Quét khóa bí mật', bg: '#EFCEBE', tilt: -2.5 },
    ],
    badge: 'redpen',
  },
  {
    id: 'beat-catalog',
    headline: '6.770 mẫu thật, truy vết rõ ràng từ 196 cấu trúc nền.',
    body: 'Học sinh, giảng viên và người làm web có thể mở mã nguồn tham chiếu, kiểm định lại từng thành phần và dùng miễn phí 0đ ngay trên trình duyệt.',
    stickers: [
      { label: '6.770 mẫu', bg: '#BAD9E6', tilt: -2 },
      { label: '196 cấu trúc · 0đ', bg: '#DDAD95', tilt: 2.5 },
    ],
    badge: 'matrix',
  },
];

export const OPEN_ACCESS_FEATURES: string[] = [
  'Live View cô lập với khung nhìn 390px, 768px và 1440px không bật quyền đồng nguồn',
  'Kho 6.770 mẫu từ 196 cấu trúc chuẩn hóa, giữ nguyên đường dẫn tham chiếu và giấy phép công khai',
  'Diff & Check tự động 6 phép kiểm và quét khóa API bí mật trước khi đóng gói ZIP',
  '15 lượt tạo mã miễn phí cùng tùy chọn gắn khóa API riêng (BYOK) trong Cài đặt',
];

export const FAQ_ITEMS: Array<{ id: string; question: string; answer: string }> = [
  {
    id: 'f1',
    question: 'F-Forum là gì và giải quyết vấn đề gì cho người làm web?',
    answer:
      'F-Forum là không gian kiến tạo Web/UI và phản biện kỹ thuật dành cho học sinh, sinh viên, giảng viên và người thiết kế web. Thay vì sao chép mù quáng mã AI sinh ra, bạn cho mã chạy thật trong Live View cô lập và chấm từng dòng qua Diff & Check trước khi xuất bản.',
  },
  {
    id: 'f2',
    question: 'Live View và Diff & Check kiểm định mã nguồn như thế nào?',
    answer:
      'Mọi bản dựng chạy trong iframe sandbox="allow-scripts" không bật allow-same-origin và đi kèm referrerPolicy="no-referrer". Bộ Diff & Check tự động kiểm tra 6 lớp: cấu trúc HTML ngữ nghĩa, cú pháp JS, bố cục 390px/768px/1440px, liên kết nội bộ, quét khóa bí mật và tiêu chuẩn tiếp cận.',
  },
  {
    id: 'f3',
    question: '6.770 mẫu và 196 cấu trúc trong kho tham chiếu đến từ đâu?',
    answer:
      'Toàn bộ 6.770 thành phần trong kho tri thức F-Forum được lập chỉ mục từ 196 cấu trúc giao diện, thành phần tương tác, cảnh 3D và chuyển động thực tế. Mỗi mẫu đều giữ nguyên đường dẫn gốc, thông tin tác giả và giấy phép công khai.',
  },
  {
    id: 'f4',
    question: 'Chi phí sử dụng và giới hạn lượt AI được tính ra sao?',
    answer:
      'F-Forum mở miễn phí 0đ với 15 lượt tạo mã tiêu chuẩn cho mỗi phiên khách hoặc tài khoản thành viên. Khi cần mở rộng hạn mức, bạn có thể nhập khóa API cá nhân trong mục Cài đặt; khóa chỉ lưu tại trình duyệt cục bộ và không đi vào tệp sao lưu.',
  },
];
