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

export interface GlacierBookSettings {
  blurPx: number;
  opacityPct: number;
  radiusPx: number;
  motionMs: number;
  grainPct: number;
}

export interface GlacierBookResource {
  title: string;
  tag: string;
  detail: string;
}

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
  synopsisVi: string;
  creditVi: string;
  settings: GlacierBookSettings;
  resources: GlacierBookResource[];
  cssSnippet: string;
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
    synopsisVi:
      'Tuyển tập 41 thành phần tương tác vật lý lò xo với độ nảy, lực cản và quán tính được hiệu chỉnh chuẩn xác cho thao tác kéo, bật công tắc và khay công cụ.',
    creditVi: 'Biên soạn từ 41 mẫu thành phần tương tác thực thi trực tiếp của F-Forum Studio.',
    settings: {
      blurPx: 14,
      opacityPct: 86,
      radiusPx: 18,
      motionMs: 420,
      grainPct: 8,
    },
    resources: [
      {
        title: 'Khung soạn lệnh đa năng (Prompt Composer)',
        tag: 'COMPONENT · TSX',
        detail: 'Khung nhập lệnh mở rộng tự động với menu mô hình bật lên theo quán tính lò xo.',
      },
      {
        title: 'Thẻ hiện diện thời gian thực (Presence Cards)',
        tag: 'COMPONENT · TSX',
        detail: 'Cụm thẻ trạng thái thành viên xếp chồng có hiệu ứng tách lớp khi di chuột.',
      },
      {
        title: 'Chuyển đổi giao diện giọt nước (Theme Switch)',
        tag: 'COMPONENT · CSS',
        detail: 'Công tắc Sáng/Tối biến dạng lỏng kèm phản hồi xúc giác thị giác 380ms.',
      },
      {
        title: 'Vùng thả tệp động (Dynamic Drop Zone)',
        tag: 'COMPONENT · TSX',
        detail: 'Khung nhận tệp phản hồi lực hút từ tính và hiển thị tiến độ nạp tức thì.',
      },
      {
        title: 'Thanh chọn thẻ lỏng (Liquid Tabs)',
        tag: 'COMPONENT · TSX',
        detail: 'Thanh điều hướng trượt viên nang nền mượt giữa các mục không giật khung.',
      },
    ],
    cssSnippet: `:root {
  --spring-ease: cubic-bezier(0.22, 1, 0.36, 1);
  --spring-duration: 420ms;
  --spring-surface: rgba(31, 63, 176, 0.12);
  --spring-border: rgba(31, 63, 176, 0.32);
  --spring-radius: 18px;
}

.glacier-spring-card {
  border-radius: var(--spring-radius);
  background: var(--spring-surface);
  border: 1px solid var(--spring-border);
  backdrop-filter: blur(14px);
  transition: transform var(--spring-duration) var(--spring-ease),
              box-shadow var(--spring-duration) var(--spring-ease);
}

.glacier-spring-card:hover {
  transform: translateY(-4px) scale(1.015);
  box-shadow: 0 18px 38px -12px rgba(31, 63, 176, 0.28);
}`,
    promptTemplate:
      'Thiết kế cụm thành phần tương tác lò xo gồm thanh chọn thẻ trượt mượt, thẻ trạng thái xếp chồng và khung nhập lệnh có độ nảy tự nhiên (--spring-ease: cubic-bezier(0.22, 1, 0.36, 1), 420ms), hỗ trợ đầy đủ 390px và 1440px.',
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
    synopsisVi:
      'Hệ thống 55 cảnh dựng 3D WebGL, trường hạt quỹ đạo và bề mặt địa hình thời gian thực tối ưu tốc độ khung hình 60fps trên trình duyệt.',
    creditVi: 'Chuẩn hóa từ 55 mẫu không gian 3D và trường cấu trúc WebGL trong kho F-Forum.',
    settings: {
      blurPx: 18,
      opacityPct: 78,
      radiusPx: 20,
      motionMs: 640,
      grainPct: 12,
    },
    resources: [
      {
        title: 'Trường mở rộng cấu trúc (Structure Flow Field)',
        tag: 'WEBGL · SCENE',
        detail: 'Lưới hạt 3D chuyển động theo trường vector với chiều sâu sương mù tuyến tính.',
      },
      {
        title: 'Địa hình sương núi (Alpine Terrain Plume)',
        tag: 'WEBGL · MESH',
        detail: 'Bề mặt địa hình đa giác thấp biến thiên độ cao theo hàm nhiễu Perlin.',
      },
      {
        title: 'Huy hiệu bản đồ nhiệt (Heatmap Badge Canvas)',
        tag: 'CANVAS · 3D',
        detail: 'Thẻ 3D phản chiếu bản đồ nhiệt tương tác trực tiếp với góc nghiêng con trỏ.',
      },
      {
        title: 'Cung dự báo điểm ảnh (Predictive Arc Halftone)',
        tag: 'WEBGL · HALFTONE',
        detail: 'Vòm cầu ánh sáng bán sắc xoay mượt làm nền cho tiêu đề kỹ thuật.',
      },
    ],
    cssSnippet: `:root {
  --spatial-perspective: 1200px;
  --spatial-accent: #2C5B78;
  --spatial-glow: rgba(44, 91, 120, 0.26);
  --spatial-radius: 20px;
}

.spatial-stage-viewport {
  perspective: var(--spatial-perspective);
  transform-style: preserve-3d;
  border-radius: var(--spatial-radius);
  overflow: hidden;
  background: radial-gradient(circle at 50% 35%, var(--spatial-glow), transparent 72%);
}`,
    promptTemplate:
      'Dựng sân khấu 3D có chiều sâu thị sai (perspective: 1200px) với vòng quỹ đạo xoay quanh tâm, lớp thẻ thông số HUD neo bốn góc và chế độ giảm chuyển động an toàn.',
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
    synopsisVi:
      'Bộ 35 mẫu phản hồi vi mô cho nút bấm, viền phát sáng hướng tâm, con trỏ từ tính và chuyển trạng thái dữ liệu tức thì không gây mỏi mắt.',
    creditVi: 'Tổng hợp từ 35 mẫu hiệu ứng vi mô và nút kính khúc xạ thuộc danh mục Hiệu ứng.',
    settings: {
      blurPx: 12,
      opacityPct: 90,
      radiusPx: 14,
      motionMs: 280,
      grainPct: 6,
    },
    resources: [
      {
        title: 'Nút kính viền sáng (Aster Glass Button)',
        tag: 'MICROFX · CSS',
        detail: 'Nút chữ nhật viền kính 1px phản chiếu ánh sáng chạy dọc cạnh khi di chuột.',
      },
      {
        title: 'Khung phóng đại tiêu điểm (Magnify Lens)',
        tag: 'MICROFX · TSX',
        detail: 'Thấu kính phóng đại chi tiết đồ họa mượt mà theo tọa độ trỏ chuột.',
      },
      {
        title: 'Núm xoay nhiệt độ (Thermal Dial Control)',
        tag: 'MICROFX · SVG',
        detail: 'Vòng xoay chia vạch cơ học cập nhật màu sắc và giá trị theo góc kéo.',
      },
      {
        title: 'Thanh neo đỉnh hoạt họa (Animated Top Dock)',
        tag: 'MICROFX · CSS',
        detail: 'Thanh công cụ thu phóng kích thước mục lân cận theo hàm khoảng cách Gauss.',
      },
    ],
    cssSnippet: `:root {
  --fx-accent: #D63A27;
  --fx-border: rgba(214, 58, 39, 0.35);
  --fx-fast: 280ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

.microfx-pill {
  position: relative;
  overflow: hidden;
  border-radius: 14px;
  border: 1px solid var(--fx-border);
  transition: transform var(--fx-fast), border-color var(--fx-fast);
}

.microfx-pill:focus-visible {
  outline: 2px solid var(--fx-accent);
  outline-offset: 2px;
}`,
    promptTemplate:
      'Tạo bộ nút bấm và thẻ điều khiển có hiệu ứng viền sáng phản hồi theo tọa độ chuột, thời lượng phản hồi 280ms sắc gọn, kèm trạng thái focus-visible rõ ràng.',
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
    synopsisVi:
      '48 kịch bản dàn dựng chuyển động cho trang mở đầu, dải băng chuyền 4 tầng và hiệu ứng xuất hiện chữ theo nhịp thời gian biên tập.',
    creditVi: 'Đúc kết từ 48 mẫu trình diễn chuyển động đã kiểm chứng HTTP 200 trong kho F-Forum.',
    settings: {
      blurPx: 16,
      opacityPct: 84,
      radiusPx: 16,
      motionMs: 540,
      grainPct: 10,
    },
    resources: [
      {
        title: 'Băng chuyền 4 hàng đảo chiều (Quad Marquee Wall)',
        tag: 'MOTION · WALL',
        detail: '4 dải thẻ chạy ngược chiều nhau với giảm tốc mượt khi dừng chuột đọc chi tiết.',
      },
      {
        title: 'Khung tiêu đề biến hình (Morphing Headline)',
        tag: 'MOTION · TYPE',
        detail: 'Chuyển tiếp hai thông điệp mở đầu bằng hiệu ứng mờ lớp và trượt trục Y.',
      },
      {
        title: 'Sân khấu góc nghiêng (Cathode Session Angles)',
        tag: 'MOTION · STAGE',
        detail: 'Chuyển góc máy 3D giữa các phân cảnh sản phẩm theo tiến độ thời gian.',
      },
      {
        title: 'Tiêu đề âm thanh nhịp sóng (Audio Wordmark)',
        tag: 'MOTION · SVG',
        detail: 'Cụm chữ tiêu đề dao động biên độ đồng bộ với nhịp tần số âm thanh.',
      },
    ],
    cssSnippet: `:root {
  --kinetic-duration: 540ms;
  --kinetic-curve: cubic-bezier(0.16, 1, 0.3, 1);
  --marquee-speed: 38s;
}

.kinetic-track {
  display: flex;
  gap: 16px;
  width: max-content;
  will-change: transform;
  transition: animation-play-state var(--kinetic-duration) var(--kinetic-curve);
}`,
    promptTemplate:
      'Xây dựng sân khấu chuyển động gồm tiêu đề xuất hiện tuần tự theo từng dòng và băng chuyền thẻ trưng bày dừng mượt khi người dùng trỏ chuột vào.',
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
    synopsisVi:
      '30 cấu trúc lưới tạp chí, bảng đối chiếu, lưới Bento bất đối xứng và chân trang khổ lớn đảm bảo nhịp điệu thị giác mạch lạc.',
    creditVi: 'Tuyển chọn từ 30 mẫu bố cục trang đích, phần giới thiệu và chân trang chuẩn mực.',
    settings: {
      blurPx: 10,
      opacityPct: 94,
      radiusPx: 12,
      motionMs: 360,
      grainPct: 7,
    },
    resources: [
      {
        title: 'Trang đích kiến trúc Aera (Aera 01 Landing)',
        tag: 'LAYOUT · PAGE',
        detail: 'Lưới 12 cột chia tỷ lệ vàng kết hợp đường kẻ phân mục 1px sắc nét.',
      },
      {
        title: 'Khối giới thiệu biên tập (Editorial About Section)',
        tag: 'LAYOUT · SECTION',
        detail: 'Bố cục hai cột bất đối xứng đặt tuyên ngôn chữ lớn bên cạnh bảng số liệu.',
      },
      {
        title: 'Chân trang chỉ mục đa cột (Aera 01 Footers)',
        tag: 'LAYOUT · FOOTER',
        detail: 'Chân trang 5 cột phân cấp rõ tài liệu, trạng thái hệ thống và bản quyền.',
      },
      {
        title: 'Bàn soi mẫu ruy-băng ngang (Plate Ribbon Table)',
        tag: 'LAYOUT · MATRIX',
        detail: '5 dải ruy-băng phân loại mẫu trực quan kết hợp ngăn chạy thử tại chỗ.',
      },
    ],
    cssSnippet: `:root {
  --grid-columns: 12;
  --grid-gap: 24px;
  --grid-max-width: 1360px;
  --grid-rule: 1px solid rgba(63, 94, 77, 0.22);
}

.editorial-grid-shell {
  max-width: var(--grid-max-width);
  margin-inline: auto;
  display: grid;
  grid-template-columns: repeat(var(--grid-columns), minmax(0, 1fr));
  gap: var(--grid-gap);
  border-top: var(--grid-rule);
}`,
    promptTemplate:
      'Dựng bố cục trang theo lưới biên tập 12 cột với đường kẻ phân tách 1px, khoảng cách theo thang 8px, mục lục cố định bên trái và nội dung chính bên phải.',
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
    synopsisVi:
      'Chuẩn vật liệu kính băng hà (Glacier Glass) với độ mờ phân lớp, viền phản quang trong suốt và kiểm soát góc bo không rò bóng.',
    creditVi: 'Hệ thống vật liệu cốt lõi của ngôn ngữ thiết kế Glacier 2026 tại F-Forum.',
    settings: {
      blurPx: 24,
      opacityPct: 72,
      radiusPx: 22,
      motionMs: 460,
      grainPct: 9,
    },
    resources: [
      {
        title: 'Vật liệu kính đa lớp (Advanced Glass Material)',
        tag: 'GLACIER · SURFACE',
        detail: 'Kết hợp backdrop-filter 24px, lớp phủ sáng đỉnh và viền 1px bán trong suốt.',
      },
      {
        title: 'Khung bo góc khép kín (Clean Squircle Clip)',
        tag: 'GLACIER · RULE',
        detail: 'Đảm bảo overflow: hidden và clip-path đồng bộ, triệt tiêu hoàn toàn bóng thừa ở góc.',
      },
      {
        title: 'Thẻ nổi độ sâu kép (Dual-Elevation Card)',
        tag: 'GLACIER · CARD',
        detail: 'Tách biệt bóng môi trường tán xạ rộng và bóng tiếp xúc sắc nét dưới đáy thẻ.',
      },
      {
        title: 'Thanh điều hướng kính mờ (Frosted Top Bar)',
        tag: 'GLACIER · NAV',
        detail: 'Thanh điều hướng 1 dòng duy trì độ tương phản chữ >= 4.5:1 trên mọi nền.',
      },
    ],
    cssSnippet: `:root {
  --glacier-blur: 24px;
  --glacier-bg: rgba(255, 255, 255, 0.72);
  --glacier-border: rgba(43, 108, 176, 0.24);
  --glacier-highlight: inset 0 1px 0 rgba(255, 255, 255, 0.65);
  --glacier-radius: 22px;
}

.glacier-glass-panel {
  border-radius: var(--glacier-radius);
  overflow: hidden;
  background: var(--glacier-bg);
  backdrop-filter: blur(var(--glacier-blur)) saturate(140%);
  border: 1px solid var(--glacier-border);
  box-shadow: var(--glacier-highlight), 0 20px 44px -16px rgba(15, 23, 42, 0.16);
}`,
    promptTemplate:
      'Áp dụng vật liệu Glacier Glass cho bảng điều khiển với độ mờ 24px, viền sáng bên trong 1px, bo góc 22px ôm khít hoàn toàn và độ tương phản chữ đạt chuẩn WCAG AA.',
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
    synopsisVi:
      '12 cặp phông chữ biên tập kết hợp Serif trưng bày, Sans-serif hỗ trợ tiếng Việt hoàn chỉnh và Monospace cho bảng số liệu kỹ thuật.',
    creditVi: 'Chuẩn hóa thang chữ linh hoạt clamp() và dấu tiếng Việt cho toàn bộ giao diện F-Forum.',
    settings: {
      blurPx: 8,
      opacityPct: 96,
      radiusPx: 12,
      motionMs: 320,
      grainPct: 5,
    },
    resources: [
      {
        title: 'Tiêu đề bài viết hoạt họa (Article Headings Scale)',
        tag: 'TYPE · DISPLAY',
        detail: 'Thang chữ clamp(2.25rem, 4.5vw, 4.25rem) với line-height 1.08 không cắt dấu tiếng Việt.',
      },
      {
        title: 'Cặp phông biên tập & kỹ thuật (Editorial + Mono Pairing)',
        tag: 'TYPE · PAIRING',
        detail: 'Kết hợp Fraunces / Playfair cho tiêu đề, Be Vietnam Pro cho nội dung và JetBrains Mono cho số liệu.',
      },
      {
        title: 'Bảng số liệu đẳng rộng (Tabular Numeric Tokens)',
        tag: 'TYPE · NUMERIC',
        detail: 'Kích hoạt font-variant-numeric: tabular-nums để các cột số thẳng hàng tuyệt đối.',
      },
      {
        title: 'Độ rộng dòng đọc tối ưu (Optimal Measure 65ch)',
        tag: 'TYPE · READABILITY',
        detail: 'Giới hạn chiều ngang đoạn văn từ 58ch đến 68ch giúp đọc tài liệu dài thoải mái.',
      },
    ],
    cssSnippet: `:root {
  --font-display: 'Fraunces', Georgia, serif;
  --font-sans: 'Be Vietnam Pro', 'Plus Jakarta Sans', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  --type-hero: clamp(2.25rem, 4.2vw, 4rem);
  --type-body: clamp(0.95rem, 1.05vw, 1.0625rem);
}

.glacier-heading {
  font-family: var(--font-display);
  font-size: var(--type-hero);
  line-height: 1.12;
  letter-spacing: -0.02em;
}`,
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
    synopsisVi:
      '16 kịch bản kể chuyện theo cuộn trang: ghim sân khấu trung tâm, thu gọn thẻ về khung cửa sổ và mở khóa từng chương nội dung mượt mà.',
    creditVi: 'Ứng dụng trực tiếp trên sân khấu cuộn Tidewell và khu trưng bày dự án của F-Forum.',
    settings: {
      blurPx: 16,
      opacityPct: 82,
      radiusPx: 20,
      motionMs: 600,
      grainPct: 10,
    },
    resources: [
      {
        title: 'Sân khấu ghim quỹ đạo (Pinned Orbit Stage)',
        tag: 'SCROLL · PINNED',
        detail: 'Ghim khung nhìn 100vh trong khi 12 thẻ xoay theo quỹ đạo elip rồi hội tụ vào cửa sổ trung tâm.',
      },
      {
        title: 'Chồng thẻ ghim tuần tự (Stacking Project Cards)',
        tag: 'SCROLL · STACK',
        detail: 'Các thẻ dự án trượt chồng lên nhau theo thứ tự chỉ mục 01-04 khi cuộn xuống.',
      },
      {
        title: 'Thanh tiến độ chương (Chapter Progress Rail)',
        tag: 'SCROLL · RAIL',
        detail: 'Thước đo vị trí cuộn hiển thị chương hiện tại và cho phép nhảy nhanh tới từng mục.',
      },
      {
        title: 'Chế độ tôn trọng giảm chuyển động (Reduced Motion Safe)',
        tag: 'SCROLL · A11Y',
        detail: 'Tự động chuyển sang bố cục tĩnh dễ đọc khi hệ điều hành bật prefers-reduced-motion.',
      },
    ],
    cssSnippet: `:root {
  --scroll-stage-height: 320vh;
  --scroll-window-radius: 20px;
  --scroll-ease: cubic-bezier(0.22, 1, 0.36, 1);
}

.scroll-pinned-viewport {
  position: sticky;
  top: 0;
  height: 100vh;
  overflow: hidden;
  display: grid;
  place-items: center;
}`,
    promptTemplate:
      'Dựng phân cảnh cuộn trang có khung sticky 100vh, tiến trình hóa từ các thẻ vệ tinh hội tụ về cửa sổ sản phẩm trung tâm và tự động tắt hiệu ứng khi bật prefers-reduced-motion.',
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
    synopsisVi:
      '24 mẫu shader ánh sáng, tán xạ bề mặt kính, nhiễu hạt phim (film grain) và trường màu chuyển dịch mượt mà không dùng gradient tím-xanh.',
    creditVi: 'Tối ưu từ bộ shader nền và hiệu ứng chiếu sáng bề mặt trong kho đồ họa F-Forum.',
    settings: {
      blurPx: 28,
      opacityPct: 68,
      radiusPx: 24,
      motionMs: 720,
      grainPct: 14,
    },
    resources: [
      {
        title: 'Khúc xạ kính nâng cao (Specular Glass Shader)',
        tag: 'SHADER · GLSL',
        detail: 'Mô phỏng chỉ số khúc xạ ánh sáng qua mép kính cong với độ lệch sắc nhẹ.',
      },
      {
        title: 'Trường sáng hướng tâm (Radial Ambient Field)',
        tag: 'SHADER · LIGHT',
        detail: 'Nguồn sáng mềm di chuyển chậm theo tọa độ trỏ chuột với hệ số giảm chấn.',
      },
      {
        title: 'Lớp hạt giấy biên tập (Editorial Film Grain)',
        tag: 'SHADER · TEXTURE',
        detail: 'Lớp nhiễu SVG siêu nhẹ tạo cảm giác bề mặt giấy in cao cấp trên cả nền Sáng và Tối.',
      },
      {
        title: 'Bóng đổ môi trường đa tầng (Multi-Layer Ambient Shadow)',
        tag: 'SHADER · SHADOW',
        detail: 'Kết hợp 3 lớp box-shadow theo cấp số nhân để tạo chiều sâu tự nhiên.',
      },
    ],
    cssSnippet: `:root {
  --shader-spot-x: 50%;
  --shader-spot-y: 35%;
  --shader-tint: rgba(30, 78, 104, 0.22);
  --shader-radius: 24px;
}

.shader-lit-surface {
  border-radius: var(--shader-radius);
  background:
    radial-gradient(640px circle at var(--shader-spot-x) var(--shader-spot-y),
      var(--shader-tint), transparent 70%);
}`,
    promptTemplate:
      'Tạo bề mặt giao diện có nguồn sáng radial-gradient phản hồi mượt theo biến CSS (--shader-spot-x, --shader-spot-y) kết hợp lớp hạt mịn và bóng đổ 3 tầng.',
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
    synopsisVi:
      '20 bộ biến CSS (:root) quản lý đồng bộ bảng màu Giấy/Mực, thang khoảng cách 8px, bán kính góc bo và tốc độ chuyển động toàn cục.',
    creditVi: 'Kiến trúc token đơn nguồn (Single Source of Truth) vận hành toàn bộ F-Forum v3.',
    settings: {
      blurPx: 14,
      opacityPct: 88,
      radiusPx: 16,
      motionMs: 380,
      grainPct: 7,
    },
    resources: [
      {
        title: 'Bảng màu kép Giấy & Mực (Paper & Ink Dual Palette)',
        tag: 'TOKENS · COLOR',
        detail: 'Định nghĩa đầy đủ --bg, --surface, --ink, --muted, --accent cho cả hai chế độ Sáng và Tối.',
      },
      {
        title: 'Thang khoảng cách 8px (8pt Spatial Grid)',
        tag: 'TOKENS · SPACING',
        detail: 'Chuẩn hóa khoảng đệm từ 4px, 8px, 16px, 24px, 32px, 48px tới 96px.',
      },
      {
        title: 'Phân cấp độ cao Z-Index (Elevation & Layer Scale)',
        tag: 'TOKENS · LAYER',
        detail: 'Quản lý rõ lớp nền (0), thẻ nổi (10), thanh đỉnh (40) và hộp thoại (80).',
      },
      {
        title: 'Hồ sơ đường cong chuyển động (Easing Token Set)',
        tag: 'TOKENS · MOTION',
        detail: 'Cung cấp --ease-out-expo, --ease-spring và --duration-fast/base/slow nhất quán.',
      },
    ],
    cssSnippet: `:root {
  --bg-paper: #F6F3EC;
  --ink-primary: #141413;
  --ink-muted: #5C5A54;
  --accent-glacier: #375A7F;
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 16px;
  --space-4: 24px;
  --space-6: 48px;
  --radius-md: 16px;
}`,
    promptTemplate:
      'Khởi tạo bộ biến CSS :root hoàn chỉnh gồm bảng màu Sáng/Tối, thang khoảng cách bội số 8px, thang chữ linh hoạt và các biến đường cong chuyển động.',
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
    synopsisVi:
      '15 mẫu khung đáp ứng đa thiết bị đảm bảo 0px tràn ngang ở 390px, bố cục máy tính bảng cân đối ở 768px và toàn cảnh rộng ở 1440px.',
    creditVi: 'Được kiểm định tự động qua cổng đo lường 3 khung nhìn 390 / 768 / 1440px.',
    settings: {
      blurPx: 12,
      opacityPct: 92,
      radiusPx: 16,
      motionMs: 340,
      grainPct: 6,
    },
    resources: [
      {
        title: 'Thanh điều hướng 1 dòng bất biến (Single-Line Navbar)',
        tag: 'VIEWPORT · NAV',
        detail: 'Giữ toàn bộ mục điều hướng nằm gọn trên 1 dòng, tự động thu gọn khéo léo ở màn hình 390px.',
      },
      {
        title: 'Lưới tự co giãn không Media Query (Auto-Fit Fluid Grid)',
        tag: 'VIEWPORT · GRID',
        detail: 'Sử dụng repeat(auto-fit, minmax(min(100%, 280px), 1fr)) chống tràn ngang tuyệt đối.',
      },
      {
        title: 'Khung chuyển đổi 390/768/1440 (Viewport Switcher Stage)',
        tag: 'VIEWPORT · STAGE',
        detail: 'Cho phép kiểm tra trực tiếp giao diện ở 3 kích thước chuẩn ngay trong sân khấu xem trước.',
      },
      {
        title: 'Bốn trạng thái dữ liệu chuẩn (4-State View Guard)',
        tag: 'VIEWPORT · STATE',
        detail: 'Đảm bảo mọi khung nhìn đều có đủ trạng thái Trống, Đang tải, Lỗi và Có dữ liệu.',
      },
    ],
    cssSnippet: `:root {
  --container-pad: clamp(16px, 4vw, 48px);
  --card-min: 280px;
}

.adaptive-fluid-grid {
  width: 100%;
  padding-inline: var(--container-pad);
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, var(--card-min)), 1fr));
  gap: clamp(16px, 2.5vw, 28px);
}`,
    promptTemplate:
      'Xây dựng giao diện đáp ứng hoàn hảo trên 390px, 768px và 1440px với lưới fluid grid không tràn ngang, thanh điều hướng 1 dòng và đủ 4 trạng thái dữ liệu.',
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
    synopsisVi:
      '12 quy chuẩn cô lập hộp cát chạy mã HTML/CSS/JS trực tiếp trên trình duyệt với chính sách bảo mật nghiêm ngặt và bộ kiểm định 6 phép đo.',
    creditVi: 'Áp dụng cho toàn bộ Sân khấu Tương tác, Live Stage trong Workspace và Demo Tri thức.',
    settings: {
      blurPx: 20,
      opacityPct: 80,
      radiusPx: 18,
      motionMs: 400,
      grainPct: 8,
    },
    resources: [
      {
        title: 'Khung chạy thử cô lập (Isolated Iframe Stage)',
        tag: 'SANDBOX · SECURITY',
        detail: 'Chỉ bật sandbox="allow-scripts" và referrerPolicy="no-referrer", tuyệt đối không mở quyền cùng nguồn.',
      },
      {
        title: 'Bộ lọc làm sạch mã nhúng (Snippet Sanitizer Gate)',
        tag: 'SANDBOX · FILTER',
        detail: 'Loại bỏ @import ngoài và chuẩn hóa phông chữ nội bộ để không phát sinh lỗi CSP.',
      },
      {
        title: 'Cổng kiểm định 6 phép đo (6-Check Diff & Audit)',
        tag: 'SANDBOX · AUDIT',
        detail: 'Kiểm tra tự động cấu trúc ngữ nghĩa, tương phản, đáp ứng, bảo mật và hiệu năng.',
      },
      {
        title: 'Trình chuyển nền Mực / Giấy (Ink & Paper Stage Toggle)',
        tag: 'SANDBOX · THEME',
        detail: 'Đổi nhanh môi trường nền Sáng/Tối bên trong hộp cát để kiểm thử độ tương phản thực tế.',
      },
    ],
    cssSnippet: `:root {
  --sandbox-radius: 18px;
  --sandbox-border: rgba(91, 75, 138, 0.28);
  --sandbox-surface: #121316;
}

.glacier-sandbox-frame {
  width: 100%;
  min-height: 420px;
  border-radius: var(--sandbox-radius);
  border: 1px solid var(--sandbox-border);
  background: var(--sandbox-surface);
  overflow: hidden;
}`,
    promptTemplate:
      'Tạo khung chạy thử mã HTML/CSS/JS có thanh công cụ chọn khung nhìn 390/768/1440px, nút chuyển nền Mực/Giấy, nút Chạy lại và bảng xem mã nguồn sạch sẽ.',
  },
];
