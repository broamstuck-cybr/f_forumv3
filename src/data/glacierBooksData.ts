import type { SourceLibraryName } from '../types/index';

export type GlacierBookGroup = 'ui' | 'spatial' | 'motion' | 'glacier';

export type GlacierBookMotif =
  | 'grid'
  | 'orbit'
  | 'prism'
  | 'wave'
  | 'glass'
  | 'type'
  | 'layers'
  | 'rings'
  | 'shader'
  | 'frame'
  | 'matrix'
  | 'lens';

export interface GlacierBookSpec {
  id: string;
  code: string;
  title: string;
  subtitleEn: string;
  group: GlacierBookGroup;
  groupLabel: string;
  year: string;
  countLabel: string;
  accent: string;
  secondary: string;
  motif: GlacierBookMotif;
  editionTag: string;
  paperTone: string;
  catalogLibrary: SourceLibraryName;
  featuredItemIds: string[];
  synopsisVi: string;
  creditVi: string;
  promptTemplate: string;
}

export const GLACIER_BOOK_GROUPS: ReadonlyArray<{
  id: 'all' | GlacierBookGroup;
  label: string;
}> = [
  { id: 'all', label: 'Tất cả (12)' },
  { id: 'ui', label: 'Giao diện UI (4)' },
  { id: 'spatial', label: 'Không gian 3D (2)' },
  { id: 'motion', label: 'Chuyển động (2)' },
  { id: 'glacier', label: 'Hệ Glacier (4)' },
];

export const GLACIER_BOOKS: GlacierBookSpec[] = [
  {
    id: 'ui-spring',
    code: 'VOL.01',
    title: 'Tương Tác Lò Xo',
    subtitleEn: 'SPRING PHYSICS SYSTEM',
    group: 'ui',
    groupLabel: 'LÒ XO UI',
    year: '2026',
    countLabel: '41 mẫu',
    accent: '#1F3FB0',
    secondary: '#DCE6FA',
    motif: 'rings',
    editionTag: 'TẬP 01',
    paperTone: '#F4F6FB',
    catalogLibrary: 'pinui',
    featuredItemIds: [
      'component/prompt-composer',
      'component/presence-cards',
      'component/theme-switch',
      'component/dynamic-drop-zone',
      'component/liquid-tabs',
      'component/swap-card',
    ],
    synopsisVi:
      'Hồ sơ 41 thành phần giao diện vận hành theo hệ phương trình lò xo với hệ số đàn hồi, giảm chấn và vận tốc đầu được định chuẩn cho thao tác kéo thả, bật công tắc và khay điều hướng.',
    creditVi: 'Biên mục từ 41 mẫu thành phần tương tác chạy trực tiếp trong kho lưu trữ F-Forum.',
    promptTemplate:
      'Thiết kế cụm thành phần tương tác lò xo gồm thanh chọn thẻ, thẻ trạng thái xếp lớp và khung nhập lệnh (--spring-ease: cubic-bezier(0.22, 1, 0.36, 1), 420ms), tương thích khung nhìn 390px và 1440px.',
  },
  {
    id: 'spatial-webgl',
    code: 'VOL.02',
    title: 'Không Gian 3D WebGL',
    subtitleEn: 'SPATIAL WEBGL STAGES',
    group: 'spatial',
    groupLabel: 'KHÔNG GIAN 3D',
    year: '2026',
    countLabel: '55 cảnh',
    accent: '#2C5B78',
    secondary: '#D9ECF5',
    motif: 'orbit',
    editionTag: 'TẬP 02',
    paperTone: '#F1F6F9',
    catalogLibrary: 'threeui',
    featuredItemIds: [
      'three-js-app-orbit',
      'three-js-bookshelf',
      'three-js-structure-flow-data-field',
      'backgrounds-terrain-plume-alpine',
      'three-js-365-tetrahedron',
      'three-js-isometric-illustration-browser',
    ],
    synopsisVi:
      'Tập hợp 55 cảnh dựng 3D WebGL, trường hạt quỹ đạo và lưới địa hình chiếu phối cảnh duy trì tốc độ 60 khung hình/giây trên trình duyệt.',
    creditVi: 'Hệ thống hóa từ 55 mẫu không gian 3D và trường cấu trúc WebGL trong kho F-Forum.',
    promptTemplate:
      'Dựng sân khấu 3D có chiều sâu phối cảnh (perspective: 1200px) với vòng quỹ đạo xoay quanh tâm, lớp thẻ thông số HUD neo bốn góc và nhánh xử lý prefers-reduced-motion.',
  },
  {
    id: 'ui-microfx',
    code: 'VOL.03',
    title: 'Hiệu Ứng Vi Mô',
    subtitleEn: 'MICRO MOTION DETAILS',
    group: 'ui',
    groupLabel: 'HIỆU ỨNG',
    year: '2026',
    countLabel: '35 mẫu',
    accent: '#D63A27',
    secondary: '#F9E1DC',
    motif: 'prism',
    editionTag: 'TẬP 03',
    paperTone: '#FAF4F2',
    catalogLibrary: 'lucianlabs',
    featuredItemIds: ['001', '002', '008', '208', '228', '013'],
    synopsisVi:
      'Danh mục 35 mẫu phản hồi vi mô cho nút lệnh, đường viền chiếu sáng theo góc trỏ chuột, núm xoay chia vạch và chuyển tiếp trạng thái dưới 300ms.',
    creditVi: 'Tổng hợp từ 35 mẫu phản hồi vi mô và nút kính khúc xạ thuộc nhóm Hiệu ứng.',
    promptTemplate:
      'Tạo bộ nút bấm và thẻ điều khiển có viền sáng phản hồi theo tọa độ chuột, thời lượng chuyển tiếp 280ms, kèm trạng thái focus-visible độ tương phản cao.',
  },
  {
    id: 'motion-kinetic',
    code: 'VOL.04',
    title: 'Nhịp Chuyển Động',
    subtitleEn: 'KINETIC CHOREOGRAPHY',
    group: 'motion',
    groupLabel: 'CHUYỂN ĐỘNG',
    year: '2026',
    countLabel: '48 bản mẫu',
    accent: '#8E4A26',
    secondary: '#F5E7DD',
    motif: 'wave',
    editionTag: 'TẬP 04',
    paperTone: '#F8F3EE',
    catalogLibrary: 'motionsites',
    featuredItemIds: [
      'ai-workflow',
      'audio-showcase',
      'interactive-discovery',
      'cyberpunk-reveal',
      'bold-studio',
      'equilibrium',
    ],
    synopsisVi:
      '48 kịch bản điều phối chuyển động cho khung mở đầu, dải băng chuyền 4 tầng đảo chiều và nhịp xuất hiện dòng tiêu đề theo chu kỳ thời gian.',
    creditVi: 'Biên tập từ 48 mẫu trình diễn chuyển động đã xác thực mã nguồn trong kho F-Forum.',
    promptTemplate:
      'Xây dựng sân khấu chuyển động gồm tiêu đề xuất hiện tuần tự theo từng dòng và băng chuyền thẻ trưng bày tạm dừng khi người dùng đưa chuột vào.',
  },
  {
    id: 'ui-layouts',
    code: 'VOL.05',
    title: 'Bố Cục Biên Tập',
    subtitleEn: 'EDITORIAL GRID SYSTEMS',
    group: 'ui',
    groupLabel: 'BỐ CỤC',
    year: '2026',
    countLabel: '30 cấu trúc',
    accent: '#3F5E4D',
    secondary: '#E1ECE5',
    motif: 'grid',
    editionTag: 'TẬP 05',
    paperTone: '#F2F6F3',
    catalogLibrary: 'codefronts',
    featuredItemIds: [
      'cf/css-calendar-designs/bento-grid-style-booking-system',
      'cf/css-3d-tilt-hover-cards/course-skill-learning-card',
      'cf/css-cards/3d-flip-business-card',
      'cf/css-forms/checkout-payment-form-with-order-summary',
      'cf/css-button-groups/acid-tags',
      'cf/css-custom-select/css-account-workspace-switcher-dropdown',
    ],
    synopsisVi:
      '30 cấu trúc lưới tạp chí 12 cột, bảng đối chiếu thông số, lưới Bento bất đối xứng và chân trang chỉ mục đa cột với đường kẻ phân vùng 1px.',
    creditVi: 'Tuyển chọn từ 30 mẫu bố cục trang đích, phân mục nội dung và chân trang trong kho lưu trữ.',
    promptTemplate:
      'Dựng bố cục trang theo lưới biên tập 12 cột với đường kẻ phân tách 1px, khoảng cách theo bội số 8px, cột mục lục cố định bên trái và vùng nội dung bên phải.',
  },
  {
    id: 'glacier-glass',
    code: 'VOL.06',
    title: 'Glacier Glass UI',
    subtitleEn: 'GLACIER REFRACTION TOKENS',
    group: 'glacier',
    groupLabel: 'KÍNH BĂNG HÀ',
    year: '2026',
    countLabel: '18 token',
    accent: '#2B6CB0',
    secondary: '#E2EFFA',
    motif: 'glass',
    editionTag: 'TẬP 06',
    paperTone: '#F2F7FC',
    catalogLibrary: 'pinui',
    featuredItemIds: [
      'blocx/halo-sign-in',
      'component/liquid-voice',
      'component/weather',
      'component/balance-card',
      '001',
      'hero-advanced-glass-material',
    ],
    synopsisVi:
      'Đặc tả vật liệu kính băng hà (Glacier Glass) gồm độ mờ hậu cảnh phân lớp, viền sáng nội bộ 1px và quy tắc cắt góc bo khép kín.',
    creditVi: 'Tài liệu thông số vật liệu nền tảng của hệ thiết kế Glacier 2026 tại F-Forum.',
    promptTemplate:
      'Áp dụng vật liệu Glacier Glass cho bảng điều khiển với độ mờ 24px, viền sáng bên trong 1px, bo góc 22px khép kín và tỷ lệ tương phản chữ đạt chuẩn WCAG AA.',
  },
  {
    id: 'glacier-type',
    code: 'VOL.07',
    title: 'Hệ Phông Biến Thể',
    subtitleEn: 'VARIABLE TYPOGRAPHY SCALE',
    group: 'glacier',
    groupLabel: 'PHÔNG CHỮ',
    year: '2026',
    countLabel: '12 hệ',
    accent: '#4C6165',
    secondary: '#E4ECEE',
    motif: 'type',
    editionTag: 'TẬP 07',
    paperTone: '#F3F6F7',
    catalogLibrary: 'pinui',
    featuredItemIds: [
      'component/magnify',
      'component/reader-card',
      'blocx/storybook-hero',
      'blocx/odometer-pricing',
      '205',
      'text-animation-article-headings',
    ],
    synopsisVi:
      '12 cấu hình kết hợp phông Serif tiêu đề, Sans-serif hỗ trợ đầy đủ dấu tiếng Việt và Monospace đẳng rộng cho bảng dữ liệu kỹ thuật.',
    creditVi: 'Định chuẩn thang chữ clamp() và khoảng cách dòng tiếng Việt cho toàn bộ giao diện F-Forum.',
    promptTemplate:
      'Thiết lập hệ thống phông chữ gồm Fraunces cho tiêu đề lớn, Be Vietnam Pro cho văn bản tiếng Việt và JetBrains Mono (tabular-nums) cho các thẻ chỉ số kỹ thuật.',
  },
  {
    id: 'motion-scroll',
    code: 'VOL.08',
    title: 'Động Lực Cuộn Trang',
    subtitleEn: 'SCROLL MOMENTUM STAGES',
    group: 'motion',
    groupLabel: 'NHỊP CUỘN',
    year: '2026',
    countLabel: '16 kịch bản',
    accent: '#2B5B6C',
    secondary: '#DCECF2',
    motif: 'layers',
    editionTag: 'TẬP 08',
    paperTone: '#F1F6F8',
    catalogLibrary: 'motionsites',
    featuredItemIds: [
      'immersive-ocean',
      'space-voyage',
      'organic-odyssey',
      '223',
      'blocx/orbit-hero',
      'portal',
    ],
    synopsisVi:
      '16 kịch bản điều hướng theo tiến độ cuộn trang: ghim khung nhìn trung tâm, hội tụ thẻ vệ tinh về cửa sổ chính và chuyển chương tuần tự.',
    creditVi: 'Áp dụng trực tiếp trên phân cảnh cuộn Tidewell và danh mục trưng bày dự án của F-Forum.',
    promptTemplate:
      'Dựng phân cảnh cuộn trang có khung sticky 100vh, chuyển pha từ các thẻ vệ tinh hội tụ về cửa sổ sản phẩm trung tâm và tắt hoạt họa cuộn khi bật prefers-reduced-motion.',
  },
  {
    id: 'spatial-shader',
    code: 'VOL.09',
    title: 'Shader & Ánh Sáng',
    subtitleEn: 'LIGHT & SHADER FIELDS',
    group: 'spatial',
    groupLabel: 'GLSL SHADER',
    year: '2026',
    countLabel: '24 shader',
    accent: '#1E4E68',
    secondary: '#D7E8F2',
    motif: 'shader',
    editionTag: 'TẬP 09',
    paperTone: '#EFF5F9',
    catalogLibrary: 'threeui',
    featuredItemIds: [
      'three-js-sunset-valley-aurora',
      'three-js-noema-bloom-bloom',
      'three-js-structure-flow-ember-storm',
      'three-js-structure-flow-emerald-horizon',
      'backgrounds-trochil-abyss',
      '211',
    ],
    synopsisVi:
      '24 mẫu shader chiếu sáng, tán xạ qua mép kính, lớp hạt bề mặt giấy in và vùng sáng hướng tâm bám theo tọa độ trỏ chuột.',
    creditVi: 'Tổng hợp từ bộ shader nền và hiệu ứng chiếu sáng bề mặt trong kho đồ họa F-Forum.',
    promptTemplate:
      'Tạo bề mặt giao diện có nguồn sáng radial-gradient phản hồi theo biến CSS (--shader-spot-x, --shader-spot-y) kết hợp lớp hạt bề mặt và bóng đổ 3 tầng.',
  },
  {
    id: 'glacier-tokens',
    code: 'VOL.10',
    title: 'Token Không Gian',
    subtitleEn: 'DESIGN TOKEN ARCHITECTURE',
    group: 'glacier',
    groupLabel: 'TOKEN HỆ THỐNG',
    year: '2026',
    countLabel: '20 bộ',
    accent: '#375A7F',
    secondary: '#DFECF7',
    motif: 'matrix',
    editionTag: 'TẬP 10',
    paperTone: '#F6F3EC',
    catalogLibrary: 'pinui',
    featuredItemIds: [
      'component/selection-list',
      'component/chips',
      'component/file-box',
      'component/thermal-dial',
      'component/lamp-switch',
      '049',
    ],
    synopsisVi:
      '20 bộ biến CSS (:root) quản lý bảng màu Giấy và Mực, thang khoảng cách bội số 8px, bán kính góc bo và thời lượng chuyển tiếp toàn cục.',
    creditVi: 'Kiến trúc token đơn nguồn (Single Source of Truth) vận hành toàn bộ giao diện F-Forum v3.',
    promptTemplate:
      'Khởi tạo bộ biến CSS :root gồm bảng màu Sáng và Tối, thang khoảng cách bội số 8px, thang chữ clamp() và các biến đường cong chuyển động.',
  },
  {
    id: 'ui-responsive',
    code: 'VOL.11',
    title: 'Khung Đáp Ứng',
    subtitleEn: 'ADAPTIVE VIEWPORT FRAMES',
    group: 'ui',
    groupLabel: '390–1440 PX',
    year: '2026',
    countLabel: '15 mẫu',
    accent: '#2E6B5E',
    secondary: '#DCF0EB',
    motif: 'frame',
    editionTag: 'TẬP 11',
    paperTone: '#F1F7F5',
    catalogLibrary: 'pinui',
    featuredItemIds: [
      'blocx/smart-pricing',
      'blocx/contact-form',
      'blocx/caremetric-footer',
      'blocx/synais-footer',
      '217',
      '221',
    ],
    synopsisVi:
      '15 mẫu khung đáp ứng đa kích thước đảm bảo 0px tràn ngang ở 390px, bố cục 2 cột ở 768px và lưới toàn cảnh ở 1440px.',
    creditVi: 'Được kiểm tra qua bộ đo tự động trên 3 khung nhìn 390px, 768px và 1440px.',
    promptTemplate:
      'Xây dựng giao diện đáp ứng trên 390px, 768px và 1440px với lưới fluid grid không tràn ngang, thanh điều hướng 1 dòng và đủ 4 trạng thái dữ liệu.',
  },
  {
    id: 'glacier-sandbox',
    code: 'VOL.12',
    title: 'Hộp Cát Thực Thi',
    subtitleEn: 'ISOLATED SANDBOX RUNTIME',
    group: 'glacier',
    groupLabel: 'SANDBOX',
    year: '2026',
    countLabel: '12 chuẩn',
    accent: '#5B4B8A',
    secondary: '#EAE5F7',
    motif: 'lens',
    editionTag: 'TẬP 12',
    paperTone: '#F5F3FA',
    catalogLibrary: 'codefronts',
    featuredItemIds: [
      'component/desk-computer',
      'component/copy-paste-pad',
      'component/task-card',
      'cf/css-animated-cards/add-to-cart-success-morph',
      'cf/css-flip-cards/album-cover-iris-aperture-reveal-card',
      '176',
    ],
    synopsisVi:
      '12 quy chuẩn cô lập hộp cát chạy mã HTML, CSS và JS trực tiếp trên trình duyệt với thuộc tính sandbox="allow-scripts" và bộ đo 6 chỉ số.',
    creditVi: 'Áp dụng cho toàn bộ Sân khấu Tương tác, Live Stage trong Workspace và kệ sách Glacier.',
    promptTemplate:
      'Tạo khung chạy thử mã HTML/CSS/JS có thanh công cụ chọn khung nhìn 390/768/1440px, nút chuyển nền Mực/Giấy, nút Chạy lại và bảng xem mã nguồn.',
  },
];
