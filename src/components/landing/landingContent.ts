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
  { id: 'quy-trinh', code: 'II', label: 'Mẫu mở' },
  { id: 'tuyen-ngon', code: 'III', label: 'Cách làm' },
  { id: 'du-an', code: 'IV', label: 'Hệ thống' },
  { id: 'faq', code: 'V', label: 'Hỏi đáp' },
];

export const LANDING_CHAPTERS_EN: LandingChapter[] = [
  { id: 'top', code: 'I', label: 'Start' },
  { id: 'quy-trinh', code: 'II', label: 'Templates' },
  { id: 'tuyen-ngon', code: 'III', label: 'Approach' },
  { id: 'du-an', code: 'IV', label: 'System' },
  { id: 'faq', code: 'V', label: 'FAQ' },
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
    headline: 'Ai cũng mở AI, nhưng ít người đi hết tới sản phẩm chạy được.',
    body: 'Khảo sát OECD PISA 2025 chỉ ra 95,9% học sinh đã dùng AI. Vướng mắc nằm ở chỗ: nhiều bạn không biết bắt đầu từ bố cục nào, dễ chép nguyên mã sinh sẵn rồi kẹt khi cần sửa lỗi hoặc ghép thành trang hoàn chỉnh.',
    stickers: [
      { label: 'PISA 2025 · 95,9%', bg: '#BFE9D9', tilt: -2.5 },
      { label: 'Thiếu điểm xuất phát', bg: '#C6E0E4', tilt: 2 },
    ],
    badge: 'prism',
  },
  {
    id: 'beat-solution',
    headline: 'Mẫu chạy thật đã lọc sạch, mở lên là bấm thử được ngay.',
    body: 'Tất cả thành phần UI, hiệu ứng chuyển động và cảnh 3D miễn phí trong kho đều kèm mã nguồn gốc cùng prompt chuẩn; bạn không phải ngồi mò từng repo rời rạc hay vẽ lại từ trang trắng.',
    stickers: [
      { label: 'Mã nguồn thật', bg: '#E9D5BE', tilt: -2 },
      { label: 'Chép Prompt 1 chạm', bg: '#BFE9D9', tilt: 2.5 },
    ],
    badge: 'viewport',
  },
  {
    id: 'beat-antislop',
    headline: 'Tự ghép, tự sửa, giữ quyền kiểm soát đầu ra.',
    body: 'Giao AI gõ từ đầu thường ra một kiểu trang giống hệt nhau. Ở đây bạn chọn đúng khung mình thích, mở cây tệp trong Workspace, sửa thẳng từng dòng HTML/CSS/JS và thấy kết quả đổi theo ngay bên cạnh.',
    stickers: [
      { label: 'Chống rập khuôn', bg: '#D2E2DE', tilt: 2 },
      { label: 'Chỉnh mã trực tiếp', bg: '#E9D5BE', tilt: -2.5 },
    ],
    badge: 'code',
  },
  {
    id: 'beat-survey',
    headline: '91,2% trong 195 người dùng khảo sát thích học qua mẫu trực quan.',
    body: 'Nhìn một nút kính hay bố cục Bento đang chạy thật rồi mở mã của nó ra xem dễ hiểu hơn rất nhiều so với đọc tài liệu khô. Bạn thấy ngay thứ gì làm nên hiệu ứng đó.',
    stickers: [
      { label: '195 người khảo sát', bg: '#C6E0E4', tilt: -2 },
      { label: '91,2% đồng thuận', bg: '#BFE9D9', tilt: 2.5 },
    ],
    badge: 'matrix',
  },
  {
    id: 'beat-open-workshop',
    headline: 'Xưởng dựng web tiếng Việt, mở trình duyệt là chạy.',
    body: 'Kho mẫu, 58 kỹ thuật chuyển động và 15 trang khởi đầu đều sắp xếp bằng tiếng Việt dễ tra. Máy cấu hình thấp vẫn chạy ổn vì không cần cài môi trường cục bộ.',
    stickers: [
      { label: 'Không cần cài đặt', bg: '#BFE9D9', tilt: -2 },
      { label: 'Cộng đồng F-Forum', bg: '#C6E0E4', tilt: 2.5 },
    ],
    badge: 'prism',
  },
  {
    id: 'beat-architecture',
    headline: 'Chạy cô lập, chia sẻ link nhanh và tải gói ZIP sạch.',
    body: 'Làm xong trang nào, bạn bấm xuất bản để lấy link công khai gửi bạn bè hoặc tải trọn bộ thư mục mã nguồn về máy dùng tiếp trên editor quen thuộc.',
    stickers: [
      { label: 'Xem đa màn hình', bg: '#E9D5BE', tilt: 2 },
      { label: 'Xuất bản & ZIP', bg: '#D2E2DE', tilt: -2 },
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
  '5.909 mẫu giao diện miễn phí đã lọc sạch lỗi (42 Pin UI, 320 MotionSites, 21 ThreeUI 3D, 480 lucianLabs, 5.046 CodeFronts) kèm 58 kỹ thuật chuyển động, 60 công cụ và 122 repo chọn lọc.',
  'Sắp xếp hoàn toàn bằng tiếng Việt cho học sinh, sinh viên và người tự học dựng web thực chiến.',
  'Mở dùng ngay trên trình duyệt không cần cài đặt; đăng nhập để đồng bộ dự án, tạo link công khai /p/ hoặc tải gói mã nguồn ZIP.',
  'Workspace đa tệp kèm xem trực tiếp Desktop/Tablet/Mobile, Cộng đồng Remix và 15 mẫu khởi đầu sẵn mã.',
];

export const FAQ_ITEMS: Array<{ id: string; question: string; answer: string }> = [
  {
    id: 'f1',
    question: 'F-Forum giải quyết vấn đề gì khi học sinh dùng AI làm web?',
    answer:
      'Dữ liệu OECD PISA 2025 cho thấy 95,9% học sinh dùng AI, nhưng phần lớn vướng ở hai khâu: khó chọn bố cục khởi đầu và khó sửa mã AI sinh ra thành sản phẩm hoàn chỉnh. F-Forum gom sẵn mẫu UI chạy thật, prompt gốc và trình sửa mã ngay trên trình duyệt để bạn tự ráp và hiểu rõ từng phần.',
  },
  {
    id: 'f2',
    question: 'Khác gì so với mấy trang gõ 1 câu lệnh rồi AI tự sinh hết?',
    answer:
      'Gõ một câu lệnh cho AI làm thay rất dễ ra giao diện giống nhau và khó chỉnh theo ý riêng. F-Forum hoạt động giống một xưởng lắp ráp mở: bạn tự chọn mẫu đã chạy thật, chép prompt chuẩn hoặc mở thẳng cây mã nguồn trong Workspace để sửa từng tệp theo nhu cầu của mình.',
  },
  {
    id: 'f3',
    question: 'Khảo sát 195 người dùng cho thấy điều gì?',
    answer:
      'Trong 195 học sinh và người dùng thử nghiệm, 91,2% chọn xem mẫu tương tác kèm mã mở thay vì tự mò từng kho GitHub rời rạc. Có sẵn khung mẫu kiểm lọc, 58 kỹ thuật chuyển động, 60 công cụ và 122 repo giúp rút ngắn thời gian thử nghiệm đáng kể.',
  },
  {
    id: 'f4',
    question: 'Dự án tạo trong Workspace được lưu và bảo vệ như thế nào?',
    answer:
      'Khách có thể sửa mã và xuất gói ZIP ngay trên máy. Khi đăng nhập, dự án tự đồng bộ lên tài khoản và kiểm tra rò rỉ khóa API trước khi đóng gói; các bài đăng Cộng đồng cũng có bộ lọc chống spam và đồng bộ tức thời.',
  },
];
