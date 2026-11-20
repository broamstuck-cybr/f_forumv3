export interface ThreeUIDemoProfile {
  engine:
    | 'tetra-solid'
    | 'origami-sheet'
    | 'halftone-keymatrix'
    | 'retro-crt-dial'
    | 'orbital-constellation'
    | 'terrain-valley'
    | 'architectural-tower'
    | 'isometric-assembly'
    | 'structure-flow'
    | 'refractive-glass'
    | 'magnetic-dock';
  accentDark: string;
  accentLight: string;
  secondaryDark: string;
  secondaryLight: string;
  badge: string;
  subtitleVi: string;
  variant: number;
  density: number;
  pitch: number;
  yaw: number;
}

const SPECIFIC_PROFILES: Record<string, ThreeUIDemoProfile> = {
  'three-js-365-tetrahedron': {
    engine: 'tetra-solid',
    accentDark: '#63B3ED',
    accentLight: '#1E4E8C',
    secondaryDark: '#F6AD55',
    secondaryLight: '#C05621',
    badge: 'POLYHEDRON · 365',
    subtitleVi: 'Khối tứ diện khúc xạ ánh sáng hướng tâm và lưới chữ điểm ảnh 3D',
    variant: 0,
    density: 24,
    pitch: 0.42,
    yaw: 0.65,
  },
  'three-js-365-tetrahedron-cube': {
    engine: 'tetra-solid',
    accentDark: '#76E4F7',
    accentLight: '#0987A0',
    secondaryDark: '#FBD38D',
    secondaryLight: '#B7791F',
    badge: 'HEXAHEDRON · 365',
    subtitleVi: 'Khối lập phương đa diện cắt lớp quang học và tia sáng thể tích',
    variant: 1,
    density: 28,
    pitch: 0.55,
    yaw: -0.48,
  },
  'three-js-3d-paper': {
    engine: 'origami-sheet',
    accentDark: '#F6E05E',
    accentLight: '#975A16',
    secondaryDark: '#68D391',
    secondaryLight: '#276749',
    badge: 'PAPER MESH · VERLET',
    subtitleVi: 'Tấm giấy 3D biến dạng đàn hồi theo lực trỏ chuột và nếp gấp',
    variant: 0,
    density: 16,
    pitch: 0.58,
    yaw: 0.35,
  },
  'three-js-3d-paper-certificate': {
    engine: 'origami-sheet',
    accentDark: '#FBD38D',
    accentLight: '#B7791F',
    secondaryDark: '#63B3ED',
    secondaryLight: '#2B6CB0',
    badge: 'ARCHIVE SEAL · 3D',
    subtitleVi: 'Bản chứng nhận nổi 3D có dấu niêm phong đồng và vân giấy dập nổi',
    variant: 1,
    density: 18,
    pitch: 0.46,
    yaw: -0.28,
  },
  'three-js-woven-cloth-atelier': {
    engine: 'origami-sheet',
    accentDark: '#FC8181',
    accentLight: '#C53030',
    secondaryDark: '#F6AD55',
    secondaryLight: '#B7791F',
    badge: 'WOVEN CLOTH · ATELIER',
    subtitleVi: 'Lưới sợi dệt đàn hồi theo trường gió 3D và sóng dao động ngang',
    variant: 2,
    density: 20,
    pitch: 0.52,
    yaw: 0.44,
  },
  'three-js-ashen-press': {
    engine: 'origami-sheet',
    accentDark: '#CBD5E0',
    accentLight: '#2D3748',
    secondaryDark: '#F6AD55',
    secondaryLight: '#C05621',
    badge: 'EDITORIAL PRESS · 3D',
    subtitleVi: 'Bản in khắc chữ 3D nhiều lớp với khung排版 biên tập chuyển động',
    variant: 3,
    density: 15,
    pitch: 0.4,
    yaw: 0.25,
  },
  'three-js-book-of-tea': {
    engine: 'origami-sheet',
    accentDark: '#68D391',
    accentLight: '#2F855A',
    secondaryDark: '#F6E05E',
    secondaryLight: '#975A16',
    badge: 'CODEX FOLIO · 3D',
    subtitleVi: 'Sách chuyên khảo mở trang 3D với cấu trúc giấy truyền thống nhiều lớp',
    variant: 4,
    density: 16,
    pitch: 0.48,
    yaw: -0.35,
  },
  'three-js-halftone-keyboard-keyboard': {
    engine: 'halftone-keymatrix',
    accentDark: '#F6AD55',
    accentLight: '#C05621',
    secondaryDark: '#63B3ED',
    secondaryLight: '#2B6CB0',
    badge: '60% BOARD · HALFTONE',
    subtitleVi: 'Bàn phím cơ 60% phối cảnh 3D với hành trình phím lò xo và lưới bán sắc',
    variant: 0,
    density: 32,
    pitch: 0.68,
    yaw: 0.32,
  },
  'three-js-halftone-keyboard-crt': {
    engine: 'halftone-keymatrix',
    accentDark: '#68D391',
    accentLight: '#276749',
    secondaryDark: '#F6E05E',
    secondaryLight: '#975A16',
    badge: 'CRT TERMINAL · HALFTONE',
    subtitleVi: 'Trạm đầu cuối CRT kết hợp bàn phím bán sắc và sóng quét phosphor',
    variant: 1,
    density: 30,
    pitch: 0.56,
    yaw: -0.26,
  },
  'three-js-retro-metallic-agent-selector': {
    engine: 'retro-crt-dial',
    accentDark: '#F6AD55',
    accentLight: '#B7791F',
    secondaryDark: '#90CDF4',
    secondaryLight: '#2C5282',
    badge: 'RETRO METALLIC · DIAL',
    subtitleVi: 'Cụm núm xoay kim loại phay xước chọn tác nhân 3D có khấc cơ học',
    variant: 0,
    density: 24,
    pitch: 0.36,
    yaw: 0.28,
  },
  'three-js-retro-metallic-crt': {
    engine: 'retro-crt-dial',
    accentDark: '#76E4F7',
    accentLight: '#0987A0',
    secondaryDark: '#F6AD55',
    secondaryLight: '#C05621',
    badge: 'CRT-14 · METALLIC',
    subtitleVi: 'Màn hình khối CRT-14 vỏ kim loại với lưới đo sóng âm 3D thời gian thực',
    variant: 1,
    density: 28,
    pitch: 0.32,
    yaw: -0.34,
  },
  'three-js-app-orbit': {
    engine: 'orbital-constellation',
    accentDark: '#63B3ED',
    accentLight: '#2B6CB0',
    secondaryDark: '#68D391',
    secondaryLight: '#2F855A',
    badge: 'ORBITAL SYSTEM · 3D',
    subtitleVi: 'Hệ quỹ đạo vệ tinh đa tầng với các nút ứng dụng xoay quanh tâm',
    variant: 0,
    density: 26,
    pitch: 0.45,
    yaw: 0.5,
  },
  'motion-design-cathode-session-angles': {
    engine: 'orbital-constellation',
    accentDark: '#F687B3',
    accentLight: '#97266D',
    secondaryDark: '#63B3ED',
    secondaryLight: '#2C5282',
    badge: 'CATHODE ANGLES · STAGE',
    subtitleVi: 'Sân khấu đổi góc máy 3D đa trục với quỹ đạo khung ngắm chính xác',
    variant: 1,
    density: 22,
    pitch: 0.52,
    yaw: -0.6,
  },
  'motion-design-ar-005-motion': {
    engine: 'orbital-constellation',
    accentDark: '#68D391',
    accentLight: '#276749',
    secondaryDark: '#76E4F7',
    secondaryLight: '#0987A0',
    badge: 'AR / 005 · HUD ORBIT',
    subtitleVi: 'Khung định vị không gian AR / 005 với thước đo góc phương vị 3D',
    variant: 2,
    density: 30,
    pitch: 0.38,
    yaw: 0.72,
  },
  'three-js-sunset-valley-aurora': {
    engine: 'terrain-valley',
    accentDark: '#68D391',
    accentLight: '#276749',
    secondaryDark: '#63B3ED',
    secondaryLight: '#2B6CB0',
    badge: 'AURORA VALLEY · MESH',
    subtitleVi: 'Thung lũng địa hình 3D kết hợp dải cực quang chuyển động tầng cao',
    variant: 0,
    density: 22,
    pitch: 0.52,
    yaw: 0.3,
  },
  'three-js-sunset-valley-blue-hour': {
    engine: 'terrain-valley',
    accentDark: '#63B3ED',
    accentLight: '#2C5282',
    secondaryDark: '#F6AD55',
    secondaryLight: '#C05621',
    badge: 'BLUE HOUR · TERRAIN',
    subtitleVi: 'Địa hình sườn núi chạng vạng với ánh sáng tán xạ đường chân trời',
    variant: 1,
    density: 22,
    pitch: 0.48,
    yaw: -0.35,
  },
  'backgrounds-terrain-plume-alpine': {
    engine: 'terrain-valley',
    accentDark: '#90CDF4',
    accentLight: '#2B6CB0',
    secondaryDark: '#CBD5E0',
    secondaryLight: '#4A5568',
    badge: 'ALPINE PLUME · WEBGL',
    subtitleVi: 'Dãy núi Alpine đa giác thấp với lớp sương địa hình biến thiên độ cao',
    variant: 2,
    density: 24,
    pitch: 0.58,
    yaw: 0.42,
  },
  'three-js-structure-flow-emerald-horizon': {
    engine: 'terrain-valley',
    accentDark: '#48BB78',
    accentLight: '#276749',
    secondaryDark: '#81E6D9',
    secondaryLight: '#234E52',
    badge: 'EMERALD HORIZON · WAVE',
    subtitleVi: 'Chân trời sóng ngọc lục bảo với lưới độ cao đồng tâm phản hồi chuột',
    variant: 3,
    density: 26,
    pitch: 0.44,
    yaw: 0.18,
  },
  'backgrounds-trochil-abyss': {
    engine: 'terrain-valley',
    accentDark: '#4FD1C5',
    accentLight: '#234E52',
    secondaryDark: '#63B3ED',
    secondaryLight: '#2A4365',
    badge: 'ABYSS FIELD · TROCHIL',
    subtitleVi: 'Trường sóng sâu thẳm đa tầng với dòng hạt sinh học lượn theo con trỏ',
    variant: 4,
    density: 25,
    pitch: 0.5,
    yaw: -0.45,
  },
  'three-js-japanese-tower': {
    engine: 'architectural-tower',
    accentDark: '#F6AD55',
    accentLight: '#C05621',
    secondaryDark: '#FC8181',
    secondaryLight: '#9B2C2C',
    badge: 'TIMBER PAGODA · 5-TIER',
    subtitleVi: 'Tháp kiến trúc gỗ 5 tầng với mái hiên vươn và mặt cắt cấu trúc 3D',
    variant: 0,
    density: 20,
    pitch: 0.38,
    yaw: 0.55,
  },
  'three-js-japanese-tower-cambodia': {
    engine: 'architectural-tower',
    accentDark: '#F6E05E',
    accentLight: '#975A16',
    secondaryDark: '#F6AD55',
    secondaryLight: '#C05621',
    badge: 'TEMPLE SPIRE · KHMER',
    subtitleVi: 'Tháp đá bậc thang đối xứng tâm với các tầng vòm thu nhỏ dần lên đỉnh',
    variant: 1,
    density: 22,
    pitch: 0.42,
    yaw: -0.48,
  },
  'three-js-japanese-tower-china': {
    engine: 'architectural-tower',
    accentDark: '#FC8181',
    accentLight: '#C53030',
    secondaryDark: '#FBD38D',
    secondaryLight: '#B7791F',
    badge: 'OCTAGONAL TOWER · 3D',
    subtitleVi: 'Tháp bát giác nhiều tầng với hệ khung dầm đỡ và đèn lồng phát sáng',
    variant: 2,
    density: 24,
    pitch: 0.36,
    yaw: 0.62,
  },
  '3d-assets-amber-house-study': {
    engine: 'architectural-tower',
    accentDark: '#F6AD55',
    accentLight: '#B7791F',
    secondaryDark: '#FBD38D',
    secondaryLight: '#744210',
    badge: 'AMBER HOUSE · STUDY',
    subtitleVi: 'Mô hình kiến trúc Amber House cắt lớp với ánh sáng nội thất ấm',
    variant: 3,
    density: 18,
    pitch: 0.46,
    yaw: 0.38,
  },
  'three-js-bookshelf': {
    engine: 'architectural-tower',
    accentDark: '#90CDF4',
    accentLight: '#2B6CB0',
    secondaryDark: '#FBD38D',
    secondaryLight: '#975A16',
    badge: 'ARCHIVE SHELF · 3D',
    subtitleVi: 'Kệ lưu trữ 3D nhiều ngăn với các gáy sách tương tác bật mở theo chuột',
    variant: 4,
    density: 24,
    pitch: 0.32,
    yaw: -0.3,
  },
  'three-js-isometric-illustration-browser': {
    engine: 'isometric-assembly',
    accentDark: '#63B3ED',
    accentLight: '#2B6CB0',
    secondaryDark: '#4FD1C5',
    secondaryLight: '#285E61',
    badge: 'ISOMETRIC BROWSER · CAD',
    subtitleVi: 'Khung trình duyệt trục đo isometric phân lớp DOM, thanh thẻ và lưới',
    variant: 0,
    density: 20,
    pitch: 0.6,
    yaw: 0.78,
  },
  'three-js-iso-mail-lightshafts-camera-drone': {
    engine: 'isometric-assembly',
    accentDark: '#76E4F7',
    accentLight: '#0987A0',
    secondaryDark: '#F6E05E',
    secondaryLight: '#975A16',
    badge: 'DRONE & OPTICS · ISO',
    subtitleVi: 'Cụm máy bay bốn cánh và ống kính quang học kèm chùm sáng thể tích',
    variant: 1,
    density: 24,
    pitch: 0.56,
    yaw: -0.72,
  },
  'three-js-wood-icons-chair': {
    engine: 'isometric-assembly',
    accentDark: '#F6AD55',
    accentLight: '#9C4221',
    secondaryDark: '#FBD38D',
    secondaryLight: '#744210',
    badge: 'WOOD JOINERY · CHAIR',
    subtitleVi: 'Ghế gỗ lắp ghép mộng 3D có thể tách rời từng chi tiết khung và mặt ghế',
    variant: 2,
    density: 18,
    pitch: 0.5,
    yaw: 0.64,
  },
  'three-js-wood-icons-desk': {
    engine: 'isometric-assembly',
    accentDark: '#FBD38D',
    accentLight: '#975A16',
    secondaryDark: '#68D391',
    secondaryLight: '#276749',
    badge: 'STUDIO DESK · WOOD 3D',
    subtitleVi: 'Bàn làm việc gỗ kỹ thuật với ngăn kéo và giá đỡ màn hình phân rã 3D',
    variant: 3,
    density: 20,
    pitch: 0.54,
    yaw: -0.58,
  },
  'three-js-grid-illustrations-charts': {
    engine: 'isometric-assembly',
    accentDark: '#68D391',
    accentLight: '#2F855A',
    secondaryDark: '#63B3ED',
    secondaryLight: '#2B6CB0',
    badge: '3D GRID CHARTS · ISO',
    subtitleVi: 'Biểu đồ cột và mặt phẳng dữ liệu 3D trên lưới tọa độ trục đo',
    variant: 4,
    density: 25,
    pitch: 0.62,
    yaw: 0.7,
  },
  'three-js-isometric-motion-grid-contact': {
    engine: 'isometric-assembly',
    accentDark: '#4FD1C5',
    accentLight: '#234E52',
    secondaryDark: '#F6AD55',
    secondaryLight: '#C05621',
    badge: 'MOTION GRID · CONTACT',
    subtitleVi: 'Lưới khối lập phương isometric nâng hạ theo sóng tương tác liên hệ',
    variant: 5,
    density: 25,
    pitch: 0.6,
    yaw: -0.78,
  },
  '3d-assets-apple-devices': {
    engine: 'isometric-assembly',
    accentDark: '#CBD5E0',
    accentLight: '#2D3748',
    secondaryDark: '#63B3ED',
    secondaryLight: '#2B6CB0',
    badge: 'DEVICE ECOSYSTEM · 3D',
    subtitleVi: 'Tổ hợp khung máy trạm, màn hình và thiết bị cầm tay nhôm nguyên khối',
    variant: 6,
    density: 22,
    pitch: 0.44,
    yaw: 0.52,
  },
  '3d-assets-aureon-assets-applications': {
    engine: 'isometric-assembly',
    accentDark: '#F6E05E',
    accentLight: '#975A16',
    secondaryDark: '#63B3ED',
    secondaryLight: '#2C5282',
    badge: 'AUREON SILICON · SoC',
    subtitleVi: 'Bộ vi xử lý Aureon 3D với các lớp đế silicon, chân mạch và lõi tính toán',
    variant: 7,
    density: 28,
    pitch: 0.58,
    yaw: 0.46,
  },
  'ui-elements-line-illustrations-model': {
    engine: 'isometric-assembly',
    accentDark: '#90CDF4',
    accentLight: '#2C5282',
    secondaryDark: '#CBD5E0',
    secondaryLight: '#4A5568',
    badge: 'WIREFRAME CAD · MODEL',
    subtitleVi: 'Bản vẽ kỹ thuật nét mảnh 3D với các trục kích thước và mặt cắt trực giao',
    variant: 8,
    density: 24,
    pitch: 0.48,
    yaw: -0.62,
  },
  'ui-elements-line-illustrations-airpods': {
    engine: 'isometric-assembly',
    accentDark: '#E2E8F0',
    accentLight: '#1A202C',
    secondaryDark: '#63B3ED',
    secondaryLight: '#2B6CB0',
    badge: 'ACOUSTIC DRIVER · CAD',
    subtitleVi: 'Mô hình buồng âm thanh và màng loa đồng trục phân tách lớp 3D',
    variant: 9,
    density: 26,
    pitch: 0.42,
    yaw: 0.58,
  },
  'three-js-structure-flow-data-field': {
    engine: 'structure-flow',
    accentDark: '#63B3ED',
    accentLight: '#2B6CB0',
    secondaryDark: '#4FD1C5',
    secondaryLight: '#234E52',
    badge: 'DATA FIELD · VECTOR',
    subtitleVi: 'Trường vector dữ liệu 3D với các luồng hạt chuyển động theo gradient',
    variant: 0,
    density: 36,
    pitch: 0.45,
    yaw: 0.4,
  },
  'three-js-structure-flow-dimensional-field': {
    engine: 'structure-flow',
    accentDark: '#76E4F7',
    accentLight: '#0987A0',
    secondaryDark: '#B794F4',
    secondaryLight: '#553C9A',
    badge: 'DIMENSIONAL LATTICE · 3D',
    subtitleVi: 'Mạng tinh thể đa chiều biến dạng xoắn ốc theo lực hút con trỏ',
    variant: 1,
    density: 38,
    pitch: 0.52,
    yaw: -0.45,
  },
  'three-js-structure-flow-dot-matrix': {
    engine: 'structure-flow',
    accentDark: '#F6E05E',
    accentLight: '#975A16',
    secondaryDark: '#68D391',
    secondaryLight: '#276749',
    badge: 'DOT MATRIX · VOLUME',
    subtitleVi: 'Khối ma trận điểm ảnh 3D tạo sóng giao thoa đồng tâm theo thời gian thực',
    variant: 2,
    density: 40,
    pitch: 0.6,
    yaw: 0.35,
  },
  'three-js-structure-flow-ember-storm': {
    engine: 'structure-flow',
    accentDark: '#F6AD55',
    accentLight: '#C05621',
    secondaryDark: '#FC8181',
    secondaryLight: '#9B2C2C',
    badge: 'EMBER VORTEX · PARTICLE',
    subtitleVi: 'Xoáy hạt tàn lửa đối lưu nhiệt 3D với quỹ đạo xoắn ốc hướng tâm',
    variant: 3,
    density: 42,
    pitch: 0.38,
    yaw: -0.55,
  },
  'three-js-structure-flow-expanse-field': {
    engine: 'structure-flow',
    accentDark: '#90CDF4',
    accentLight: '#2C5282',
    secondaryDark: '#FBD38D',
    secondaryLight: '#975A16',
    badge: 'EXPANSE FIELD · HORIZON',
    subtitleVi: 'Trường không gian mở rộng với chiều sâu sương mù tuyến tính và lưới hạt',
    variant: 4,
    density: 38,
    pitch: 0.34,
    yaw: 0.28,
  },
  'three-js-noema-bloom-bloom': {
    engine: 'structure-flow',
    accentDark: '#F687B3',
    accentLight: '#97266D',
    secondaryDark: '#FBD38D',
    secondaryLight: '#B7791F',
    badge: 'NOEMA BLOOM · FIBONACCI',
    subtitleVi: 'Cấu trúc cánh hoa Fibonacci 3D nở mở theo tỷ lệ vàng và góc nghiêng chuột',
    variant: 5,
    density: 36,
    pitch: 0.48,
    yaw: 0.62,
  },
  'backgrounds-predictive-arc-amber-halftone': {
    engine: 'structure-flow',
    accentDark: '#F6AD55',
    accentLight: '#B7791F',
    secondaryDark: '#F6E05E',
    secondaryLight: '#744210',
    badge: 'PREDICTIVE ARC · HALFTONE',
    subtitleVi: 'Vòm cầu bán sắc hổ phách quay theo quỹ đạo dự báo điểm ảnh 3D',
    variant: 6,
    density: 34,
    pitch: 0.4,
    yaw: -0.4,
  },
  'three-js-heatmap-badge-canvas': {
    engine: 'structure-flow',
    accentDark: '#FC8181',
    accentLight: '#C53030',
    secondaryDark: '#68D391',
    secondaryLight: '#276749',
    badge: 'HEATMAP BADGE · THERMAL',
    subtitleVi: 'Huy hiệu bản đồ nhiệt 3D đổi phổ màu theo mật độ tương tác con trỏ',
    variant: 7,
    density: 32,
    pitch: 0.35,
    yaw: 0.3,
  },
  'hero-advanced-glass-material': {
    engine: 'refractive-glass',
    accentDark: '#76E4F7',
    accentLight: '#0987A0',
    secondaryDark: '#63B3ED',
    secondaryLight: '#2B6CB0',
    badge: 'REFRACTIVE GLASS · IOR 1.52',
    subtitleVi: 'Vật liệu kính quang học đa lớp với tán sắc cạnh và vòng sáng tụ quang',
    variant: 0,
    density: 24,
    pitch: 0.38,
    yaw: 0.45,
  },
  'hero-anima': {
    engine: 'refractive-glass',
    accentDark: '#90CDF4',
    accentLight: '#2C5282',
    secondaryDark: '#F6AD55',
    secondaryLight: '#C05621',
    badge: 'ANIMA CORE · REFRACTION',
    subtitleVi: 'Khối cầu thủy tinh biến thiên hình học hữu cơ phản chiếu ánh sáng môi trường',
    variant: 1,
    density: 28,
    pitch: 0.44,
    yaw: -0.38,
  },
  'buttons-amber-house-day-night': {
    engine: 'refractive-glass',
    accentDark: '#F6AD55',
    accentLight: '#C05621',
    secondaryDark: '#63B3ED',
    secondaryLight: '#2B6CB0',
    badge: 'SOLAR / LUNAR · SWITCH',
    subtitleVi: 'Cơ cấu chuyển đổi Ngày / Đêm bằng lăng kính trượt và quỹ đạo mặt trời',
    variant: 2,
    density: 20,
    pitch: 0.3,
    yaw: 0.25,
  },
  'buttons-rectangle-buttons-aster-glass-access': {
    engine: 'refractive-glass',
    accentDark: '#68D391',
    accentLight: '#276749',
    secondaryDark: '#76E4F7',
    secondaryLight: '#0987A0',
    badge: 'ASTER GLASS · ACCESS',
    subtitleVi: 'Khối nút kính vát cạnh viền sáng chạy quanh chu vi theo góc tới con trỏ',
    variant: 3,
    density: 22,
    pitch: 0.34,
    yaw: -0.28,
  },
  'buttons-rectangle-buttons-aster-glass-arrow': {
    engine: 'refractive-glass',
    accentDark: '#63B3ED',
    accentLight: '#2B6CB0',
    secondaryDark: '#FBD38D',
    secondaryLight: '#975A16',
    badge: 'ASTER GLASS · VECTOR',
    subtitleVi: 'Nút kính định hướng vector với mũi tên 3D trượt theo xung lượng chuột',
    variant: 4,
    density: 22,
    pitch: 0.36,
    yaw: 0.32,
  },
  'css-animated-top-dock': {
    engine: 'magnetic-dock',
    accentDark: '#63B3ED',
    accentLight: '#2B6CB0',
    secondaryDark: '#4FD1C5',
    secondaryLight: '#234E52',
    badge: 'GAUSSIAN DOCK · 3D',
    subtitleVi: 'Thanh neo công cụ thu phóng theo hàm phân phối chuẩn Gauss và nghiêng 3D',
    variant: 0,
    density: 18,
    pitch: 0.35,
    yaw: 0.22,
  },
  'css-animated-top-dock-modern': {
    engine: 'magnetic-dock',
    accentDark: '#76E4F7',
    accentLight: '#0987A0',
    secondaryDark: '#F6AD55',
    secondaryLight: '#C05621',
    badge: 'COMMAND BAR · SPATIAL',
    subtitleVi: 'Thanh lệnh không gian tích hợp chỉ báo từ tính và phản hồi độ sâu Z',
    variant: 1,
    density: 20,
    pitch: 0.4,
    yaw: -0.25,
  },
  'landing-pages-aera-01-landing-page': {
    engine: 'magnetic-dock',
    accentDark: '#CBD5E0',
    accentLight: '#2D3748',
    secondaryDark: '#F6AD55',
    secondaryLight: '#B7791F',
    badge: 'AERA 01 · ARCHITECTURAL',
    subtitleVi: 'Bố cục trang đích AERA 01 dựng trong không gian phối cảnh 12 cột 3D',
    variant: 2,
    density: 22,
    pitch: 0.45,
    yaw: 0.38,
  },
  'landing-pages-aeris-pool-landing-page': {
    engine: 'magnetic-dock',
    accentDark: '#4FD1C5',
    accentLight: '#234E52',
    secondaryDark: '#63B3ED',
    secondaryLight: '#2B6CB0',
    badge: 'AERIS POOL · CAUSTIC',
    subtitleVi: 'Không gian trưng bày Aeris với mặt nước khúc xạ và thẻ thông số nổi',
    variant: 3,
    density: 24,
    pitch: 0.5,
    yaw: -0.35,
  },
  'sections-about': {
    engine: 'magnetic-dock',
    accentDark: '#FBD38D',
    accentLight: '#975A16',
    secondaryDark: '#63B3ED',
    secondaryLight: '#2C5282',
    badge: 'EDITORIAL STORY · 3D',
    subtitleVi: 'Phân cảnh giới thiệu biên tập với các lớp thẻ niên biểu xếp chồng theo trục Z',
    variant: 4,
    density: 20,
    pitch: 0.38,
    yaw: 0.3,
  },
  'sections-footers-section-aera-01-footers': {
    engine: 'magnetic-dock',
    accentDark: '#90CDF4',
    accentLight: '#2C5282',
    secondaryDark: '#68D391',
    secondaryLight: '#276749',
    badge: 'AERA 01 · INDEX MATRIX',
    subtitleVi: 'Cấu trúc chân trang đa cột 3D với bảng trạng thái nút mạng trực tiếp',
    variant: 5,
    density: 22,
    pitch: 0.42,
    yaw: -0.32,
  },
  'text-animation-article-headings': {
    engine: 'magnetic-dock',
    accentDark: '#F6AD55',
    accentLight: '#C05621',
    secondaryDark: '#CBD5E0',
    secondaryLight: '#2D3748',
    badge: 'KINETIC HEADINGS · 3D',
    subtitleVi: 'Dàn chữ tiêu đề biên tập xoay trục 3D theo vận tốc con trỏ',
    variant: 6,
    density: 24,
    pitch: 0.32,
    yaw: 0.28,
  },
  'text-animation-article-headings-audio-wordmark': {
    engine: 'magnetic-dock',
    accentDark: '#68D391',
    accentLight: '#276749',
    secondaryDark: '#76E4F7',
    secondaryLight: '#0987A0',
    badge: 'AUDIO WORDMARK · FFT',
    subtitleVi: 'Cụm chữ biểu trưng dao động theo phổ tần số âm thanh 3D thời gian thực',
    variant: 7,
    density: 28,
    pitch: 0.36,
    yaw: -0.24,
  },
};

function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function resolveProfile(id: string, title: string, category: string): ThreeUIDemoProfile {
  const cleanId = id.trim().toLowerCase();
  if (SPECIFIC_PROFILES[cleanId]) {
    return SPECIFIC_PROFILES[cleanId];
  }
  const prefixed = cleanId.startsWith('three-js-') ? cleanId : `three-js-${cleanId}`;
  if (SPECIFIC_PROFILES[prefixed]) {
    return SPECIFIC_PROFILES[prefixed];
  }
  const foundKey = Object.keys(SPECIFIC_PROFILES).find(
    (k) => k.endsWith(cleanId) || cleanId.endsWith(k.replace(/^three-js-/, ''))
  );
  if (foundKey) {
    return SPECIFIC_PROFILES[foundKey];
  }

  const h = hashString(`${cleanId}:${category}:${title}`);
  const hay = `${cleanId} ${category.toLowerCase()} ${title.toLowerCase()}`;

  let engine: ThreeUIDemoProfile['engine'] = 'structure-flow';
  if (hay.includes('tetra') || hay.includes('cube') || hay.includes('poly') || hay.includes('prism')) {
    engine = 'tetra-solid';
  } else if (hay.includes('paper') || hay.includes('cloth') || hay.includes('book') || hay.includes('press')) {
    engine = 'origami-sheet';
  } else if (hay.includes('keyboard') || hay.includes('halftone')) {
    engine = 'halftone-keymatrix';
  } else if (hay.includes('retro') || hay.includes('metallic') || hay.includes('crt') || hay.includes('dial')) {
    engine = 'retro-crt-dial';
  } else if (hay.includes('orbit') || hay.includes('angle') || hay.includes('ar-')) {
    engine = 'orbital-constellation';
  } else if (hay.includes('valley') || hay.includes('terrain') || hay.includes('alpine') || hay.includes('horizon') || hay.includes('abyss')) {
    engine = 'terrain-valley';
  } else if (hay.includes('tower') || hay.includes('house') || hay.includes('shelf')) {
    engine = 'architectural-tower';
  } else if (hay.includes('iso') || hay.includes('wood') || hay.includes('device') || hay.includes('chart') || hay.includes('airpod') || hay.includes('model')) {
    engine = 'isometric-assembly';
  } else if (hay.includes('glass') || hay.includes('anima') || hay.includes('button') || hay.includes('frosted')) {
    engine = 'refractive-glass';
  } else if (hay.includes('dock') || hay.includes('landing') || hay.includes('section') || hay.includes('heading') || hay.includes('audio')) {
    engine = 'magnetic-dock';
  }

  const palettes: ReadonlyArray<[string, string, string, string]> = [
    ['#63B3ED', '#1E4E8C', '#F6AD55', '#C05621'],
    ['#68D391', '#276749', '#76E4F7', '#0987A0'],
    ['#F6AD55', '#B7791F', '#90CDF4', '#2C5282'],
    ['#4FD1C5', '#234E52', '#FBD38D', '#975A16'],
    ['#FC8181', '#C53030', '#63B3ED', '#2B6CB0'],
  ];
  const pal = palettes[h % palettes.length];

  return {
    engine,
    accentDark: pal[0],
    accentLight: pal[1],
    secondaryDark: pal[2],
    secondaryLight: pal[3],
    badge: `${category.toUpperCase() || 'THREE.JS'} · 3D STAGE`,
    subtitleVi: `Mô phỏng không gian 3D tương tác trực tiếp cho ${title || id}`,
    variant: h % 8,
    density: 20 + (h % 18),
    pitch: 0.35 + ((h % 25) / 100),
    yaw: -0.5 + (((h >> 4) % 100) / 100),
  };
}

function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function buildThreeUIInteractiveHtml(
  id: string,
  title: string,
  category: string,
  theme: 'dark' | 'light'
): string {
  const profile = resolveProfile(id, title, category);
  const isDark = theme === 'dark';
  const bgPrimary = isDark ? '#0B0E14' : '#F4F1EA';
  const bgSecondary = isDark ? '#141A24' : '#E6E0D3';
  const inkPrimary = isDark ? '#F3F5F8' : '#16181D';
  const inkMuted = isDark ? '#94A3B8' : '#5A6270';
  const panelBg = isDark ? 'rgba(16, 22, 32, 0.78)' : 'rgba(248, 245, 238, 0.84)';
  const panelBorder = isDark ? 'rgba(148, 163, 184, 0.22)' : 'rgba(22, 24, 29, 0.16)';
  const accent = isDark ? profile.accentDark : profile.accentLight;
  const secondary = isDark ? profile.secondaryDark : profile.secondaryLight;
  const safeTitle = escapeHtml(title || id);
  const safeCategory = escapeHtml(category || 'Three.js');
  const safeBadge = escapeHtml(profile.badge);
  const safeSubtitle = escapeHtml(profile.subtitleVi);
  const seed = hashString(id);

  return `<!DOCTYPE html>
<html lang="vi" data-theme="${theme}">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${safeTitle}</title>
<style>
:root {
  --bg-0: ${bgPrimary};
  --bg-1: ${bgSecondary};
  --ink-0: ${inkPrimary};
  --ink-1: ${inkMuted};
  --accent: ${accent};
  --secondary: ${secondary};
  --panel-bg: ${panelBg};
  --panel-border: ${panelBorder};
  --font-sans: 'Be Vietnam Pro', 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
}
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  user-select: none;
  -webkit-user-select: none;
}
html, body {
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: radial-gradient(circle at 50% 38%, var(--bg-1) 0%, var(--bg-0) 76%);
  color: var(--ink-0);
  font-family: var(--font-sans);
}
#stage {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
  cursor: grab;
  touch-action: none;
}
#stage:active {
  cursor: grabbing;
}
.hud {
  position: fixed;
  inset: 0;
  pointer-events: none;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 14px 16px;
  z-index: 10;
}
.hud-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.hud-card {
  pointer-events: auto;
  background: var(--panel-bg);
  border: 1px solid var(--panel-border);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border-radius: 12px;
  padding: 10px 13px;
  max-width: min(430px, calc(100vw - 32px));
}
.hud-eyebrow {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--accent);
  margin-bottom: 4px;
}
.hud-dot {
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: var(--accent);
  box-shadow: 0 0 10px var(--accent);
}
.hud-title {
  font-size: 14px;
  font-weight: 700;
  line-height: 1.25;
  color: var(--ink-0);
  margin-bottom: 3px;
}
.hud-sub {
  font-size: 11.5px;
  line-height: 1.38;
  color: var(--ink-1);
}
.hud-controls {
  pointer-events: auto;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}
.hud-btn {
  appearance: none;
  border: 1px solid var(--panel-border);
  background: var(--panel-bg);
  color: var(--ink-0);
  font-family: var(--font-mono);
  font-size: 11px;
  padding: 7px 11px;
  border-radius: 9px;
  cursor: pointer;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  transition: transform 160ms ease, border-color 160ms ease, background 160ms ease;
}
.hud-btn:hover {
  border-color: var(--accent);
  transform: translateY(-1px);
}
.hud-btn:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}
.hud-btn[data-active="true"] {
  border-color: var(--accent);
  color: var(--accent);
}
.hud-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}
.hud-telemetry {
  pointer-events: auto;
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--panel-bg);
  border: 1px solid var(--panel-border);
  border-radius: 999px;
  padding: 6px 13px;
  font-family: var(--font-mono);
  font-size: 10.5px;
  color: var(--ink-1);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}
.hud-telemetry strong {
  color: var(--ink-0);
  font-weight: 600;
}
.hud-hint {
  font-family: var(--font-mono);
  font-size: 10.5px;
  color: var(--ink-1);
  background: var(--panel-bg);
  border: 1px solid var(--panel-border);
  border-radius: 999px;
  padding: 6px 12px;
}
@media (max-width: 560px) {
  .hud {
    padding: 10px;
  }
  .hud-sub, .hud-hint {
    display: none;
  }
}
</style>
</head>
<body>
<canvas id="stage" aria-label="${safeTitle}"></canvas>
<div class="hud">
  <div class="hud-top">
    <div class="hud-card">
      <div class="hud-eyebrow">
        <span class="hud-dot"></span>
        <span>${safeBadge}</span>
        <span>·</span>
        <span>${safeCategory}</span>
      </div>
      <div class="hud-title">${safeTitle}</div>
      <div class="hud-sub">${safeSubtitle}</div>
    </div>
    <div class="hud-controls" role="toolbar" aria-label="Điều khiển sân khấu 3D">
      <button type="button" class="hud-btn" id="btn-mode" data-active="true">Chế độ: Khối đặc</button>
      <button type="button" class="hud-btn" id="btn-explode" data-active="false">Phân tách: Tắt</button>
      <button type="button" class="hud-btn" id="btn-spin" data-active="true">Tự xoay: Bật</button>
      <button type="button" class="hud-btn" id="btn-pulse">Kích xung</button>
      <button type="button" class="hud-btn" id="btn-reset">Đặt lại</button>
    </div>
  </div>
  <div class="hud-bottom">
    <div class="hud-telemetry">
      <span>Góc xoay <strong id="tel-rot">0° / 0°</strong></span>
      <span>Thu phóng <strong id="tel-zoom">1.00x</strong></span>
      <span>Phần tử <strong id="tel-nodes">0</strong></span>
    </div>
    <div class="hud-hint">Kéo chuột xoay 3D · Cuộn thu phóng · Nhấp tạo sóng tương tác</div>
  </div>
</div>
<script>
(function() {
  const CONFIG = {
    id: ${JSON.stringify(id)},
    engine: ${JSON.stringify(profile.engine)},
    variant: ${profile.variant},
    density: ${profile.density},
    defaultPitch: ${profile.pitch.toFixed(3)},
    defaultYaw: ${profile.yaw.toFixed(3)},
    seed: ${seed},
    isDark: ${isDark ? 'true' : 'false'},
    accent: ${JSON.stringify(accent)},
    secondary: ${JSON.stringify(secondary)},
    ink: ${JSON.stringify(inkPrimary)},
    muted: ${JSON.stringify(inkMuted)},
    bg0: ${JSON.stringify(bgPrimary)},
    bg1: ${JSON.stringify(bgSecondary)}
  };

  const canvas = document.getElementById('stage');
  const ctx = canvas.getContext('2d');
  const btnMode = document.getElementById('btn-mode');
  const btnExplode = document.getElementById('btn-explode');
  const btnSpin = document.getElementById('btn-spin');
  const btnPulse = document.getElementById('btn-pulse');
  const btnReset = document.getElementById('btn-reset');
  const telRot = document.getElementById('tel-rot');
  const telZoom = document.getElementById('tel-zoom');
  const telNodes = document.getElementById('tel-nodes');

  const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const STATE = {
    width: window.innerWidth || 800,
    height: window.innerHeight || 520,
    dpr: Math.min(window.devicePixelRatio || 1, 2),
    yaw: CONFIG.defaultYaw,
    pitch: CONFIG.defaultPitch,
    targetYaw: CONFIG.defaultYaw,
    targetPitch: CONFIG.defaultPitch,
    zoom: 1.0,
    targetZoom: 1.0,
    dragging: false,
    lastX: 0,
    lastY: 0,
    pointerX: 0,
    pointerY: 0,
    normX: 0,
    normY: 0,
    renderMode: 0,
    exploded: 0,
    targetExploded: 0,
    autoSpin: !reducedMotion,
    pulseEnergy: 0,
    selectedSlot: CONFIG.variant % 5,
    time: (CONFIG.seed % 100) * 0.17,
    nodeCount: 0
  };

  if (reducedMotion) {
    btnSpin.setAttribute('data-active', 'false');
    btnSpin.textContent = 'Tự xoay: Tắt';
  }

  function resize() {
    STATE.width = Math.max(300, window.innerWidth);
    STATE.height = Math.max(240, window.innerHeight);
    STATE.dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(STATE.width * STATE.dpr);
    canvas.height = Math.floor(STATE.height * STATE.dpr);
    ctx.setTransform(STATE.dpr, 0, 0, STATE.dpr, 0, 0);
  }
  window.addEventListener('resize', resize);
  resize();

  function project3D(x, y, z) {
    const cy = Math.cos(STATE.yaw);
    const sy = Math.sin(STATE.yaw);
    const cp = Math.cos(STATE.pitch);
    const sp = Math.sin(STATE.pitch);

    const x1 = x * cy - z * sy;
    const z1 = x * sy + z * cy;
    const y2 = y * cp - z1 * sp;
    const z2 = y * sp + z1 * cp;

    const fov = Math.min(STATE.width, STATE.height) * 0.88 * STATE.zoom;
    const camDist = 4.6;
    const depth = camDist + z2;
    const scale = fov / Math.max(0.4, depth);
    return {
      x: STATE.width * 0.5 + x1 * scale,
      y: STATE.height * 0.52 + y2 * scale,
      z: z2,
      scale: scale
    };
  }

  function hexToRgba(hex, alpha) {
    const clean = hex.replace('#', '');
    const num = parseInt(clean, 16);
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
  }

  function drawStageGrid() {
    const rad = 1.95;
    const steps = 6;
    ctx.lineWidth = 1;
    ctx.strokeStyle = hexToRgba(CONFIG.muted, CONFIG.isDark ? 0.15 : 0.18);
    for (let i = -steps; i <= steps; i++) {
      const t = (i / steps) * rad;
      const a = project3D(-rad, 1.05, t);
      const b = project3D(rad, 1.05, t);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();

      const c = project3D(t, 1.05, -rad);
      const d = project3D(t, 1.05, rad);
      ctx.beginPath();
      ctx.moveTo(c.x, c.y);
      ctx.lineTo(d.x, d.y);
      ctx.stroke();
    }
  }

  function drawFace(pts3d, fillStyle, strokeStyle, lineWidth) {
    const proj = pts3d.map(function(p) { return project3D(p[0], p[1], p[2]); });
    ctx.beginPath();
    for (let i = 0; i < proj.length; i++) {
      if (i === 0) ctx.moveTo(proj[i].x, proj[i].y);
      else ctx.lineTo(proj[i].x, proj[i].y);
    }
    ctx.closePath();
    if (fillStyle && STATE.renderMode !== 1) {
      ctx.fillStyle = fillStyle;
      ctx.fill();
    }
    if (strokeStyle) {
      ctx.lineWidth = lineWidth || 1.25;
      ctx.strokeStyle = strokeStyle;
      ctx.stroke();
    }
    return proj;
  }

  function renderTetraSolid(t) {
    drawStageGrid();
    const ex = 1 + STATE.exploded * 0.55 + STATE.pulseEnergy * 0.25;
    const isCube = CONFIG.variant % 2 === 1;
    const faces = [];

    if (!isCube) {
      const v = [
        [0, -1.15, 0],
        [-1.08, 0.75, 0.92],
        [1.08, 0.75, 0.92],
        [0, 0.75, -1.12]
      ];
      const idx = [[0,1,2],[0,2,3],[0,3,1],[1,3,2]];
      idx.forEach(function(tri, fi) {
        const cx = (v[tri[0]][0] + v[tri[1]][0] + v[tri[2]][0]) / 3;
        const cy = (v[tri[0]][1] + v[tri[1]][1] + v[tri[2]][1]) / 3;
        const cz = (v[tri[0]][2] + v[tri[1]][2] + v[tri[2]][2]) / 3;
        const shift = (ex - 1) * 0.65;
        const pts = tri.map(function(vi) {
          return [
            v[vi][0] + cx * shift,
            v[vi][1] + cy * shift + Math.sin(t * 2 + fi) * 0.04,
            v[vi][2] + cz * shift
          ];
        });
        const centerProj = project3D(cx * ex, cy * ex, cz * ex);
        faces.push({ pts: pts, z: centerProj.z, fi: fi });
      });
    } else {
      const s = 0.82;
      const rawFaces = [
        [[-s,-s,s],[s,-s,s],[s,s,s],[-s,s,s],[0,0,1]],
        [[s,-s,-s],[-s,-s,-s],[-s,s,-s],[s,s,-s],[0,0,-1]],
        [[-s,-s,-s],[-s,-s,s],[-s,s,s],[-s,s,-s],[-1,0,0]],
        [[s,-s,s],[s,-s,-s],[s,s,-s],[s,s,s],[1,0,0]],
        [[-s,-s,-s],[s,-s,-s],[s,-s,s],[-s,-s,s],[0,-1,0]],
        [[-s,s,s],[s,s,s],[s,s,-s],[-s,s,-s],[0,1,0]]
      ];
      rawFaces.forEach(function(rf, fi) {
        const n = rf[4];
        const shift = (ex - 1) * 0.7;
        const pts = rf.slice(0, 4).map(function(p) {
          return [p[0] + n[0]*shift, p[1] + n[1]*shift, p[2] + n[2]*shift];
        });
        const cp = project3D(n[0]*ex, n[1]*ex, n[2]*ex);
        faces.push({ pts: pts, z: cp.z, fi: fi });
      });
    }

    for (let r = 0; r < 12; r++) {
      const ang = (r / 12) * Math.PI * 2 + t * 0.35;
      const p0 = project3D(0, 0, 0);
      const p1 = project3D(Math.cos(ang) * 1.9, Math.sin(ang) * 1.35, Math.sin(ang * 2) * 0.6);
      const grad = ctx.createLinearGradient(p0.x, p0.y, p1.x, p1.y);
      grad.addColorStop(0, hexToRgba(CONFIG.accent, 0.25));
      grad.addColorStop(1, hexToRgba(CONFIG.secondary, 0.0));
      ctx.strokeStyle = grad;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(p1.x, p1.y);
      ctx.stroke();
    }

    faces.sort(function(a, b) { return b.z - a.z; });
    faces.forEach(function(f) {
      const alpha = STATE.renderMode === 2 ? 0.16 : 0.34;
      const col = f.fi % 2 === 0 ? CONFIG.accent : CONFIG.secondary;
      const proj = drawFace(
        f.pts,
        hexToRgba(col, alpha),
        hexToRgba(col, 0.92),
        1.7
      );
      proj.forEach(function(pt) {
        ctx.fillStyle = CONFIG.ink;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 3.2, 0, Math.PI * 2);
        ctx.fill();
      });
    });

    STATE.nodeCount = faces.length * 4 + 12;
  }

  function renderOrigamiSheet(t) {
    drawStageGrid();
    const cols = 14;
    const rows = 10;
    const quads = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const u0 = (c / cols) * 2 - 1;
        const v0 = (r / rows) * 2 - 1;
        const u1 = ((c + 1) / cols) * 2 - 1;
        const v1 = ((r + 1) / rows) * 2 - 1;

        function elevation(u, v) {
          const dx = u - STATE.normX;
          const dy = v - STATE.normY;
          const d = Math.sqrt(dx * dx + dy * dy);
          const fold = CONFIG.variant % 2 === 0
            ? Math.sin(u * 3.4 + t * 1.6) * 0.22 + Math.cos(v * 2.6 - t) * 0.15
            : Math.abs(((u * 3) % 1) - 0.5) * 0.45 + Math.sin(v * 3 + t) * 0.14;
          const ripple = Math.cos(d * 6 - t * 3) * Math.exp(-d * 1.8) * (0.28 + STATE.pulseEnergy * 0.4);
          const layerOffset = STATE.exploded * ((r % 2 === 0 ? 1 : -1) * 0.28);
          return fold + ripple + layerOffset;
        }

        const p00 = [u0 * 1.55, elevation(u0, v0), v0 * 1.15];
        const p10 = [u1 * 1.55, elevation(u1, v0), v0 * 1.15];
        const p11 = [u1 * 1.55, elevation(u1, v1), v1 * 1.15];
        const p01 = [u0 * 1.55, elevation(u0, v1), v1 * 1.15];
        const cp = project3D((p00[0] + p11[0]) * 0.5, (p00[1] + p11[1]) * 0.5, (p00[2] + p11[2]) * 0.5);
        quads.push({ pts: [p00, p10, p11, p01], z: cp.z, r: r, c: c });
      }
    }
    quads.sort(function(a, b) { return b.z - a.z; });
    quads.forEach(function(q) {
      const isSeal = Math.abs(q.c - cols * 0.5) < 2 && Math.abs(q.r - rows * 0.5) < 2;
      const col = isSeal ? CONFIG.secondary : CONFIG.accent;
      const fillAlpha = STATE.renderMode === 1 ? 0 : (isSeal ? 0.46 : 0.22 + ((q.r + q.c) % 2) * 0.08);
      drawFace(q.pts, hexToRgba(col, fillAlpha), hexToRgba(col, 0.72), 1.0);
    });
    STATE.nodeCount = cols * rows;
  }

  function renderHalftoneKeymatrix(t) {
    const cols = 10;
    const rows = 4;
    const keys = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const kx = (c - (cols - 1) * 0.5) * 0.31;
        const kz = (r - (rows - 1) * 0.5) * 0.31 + 0.35;
        const dx = kx - STATE.normX * 1.5;
        const dz = kz - STATE.normY * 1.1;
        const dist = Math.sqrt(dx * dx + dz * dz);
        const press = Math.max(0, 1 - dist * 1.65) * 0.24 + ( ((r * cols + c) === STATE.selectedSlot % 40) ? 0.18 : 0 );
        const ky = 0.28 + press - STATE.exploded * ((r - 1.5) * 0.16);
        const cp = project3D(kx, ky, kz);
        keys.push({ kx: kx, ky: ky, kz: kz, press: press, z: cp.z, r: r, c: c });
      }
    }

    for (let i = -8; i <= 8; i++) {
      for (let j = -4; j <= 4; j++) {
        const hx = i * 0.21;
        const hy = -0.65 + j * 0.16;
        const hz = -0.85 - STATE.exploded * 0.4;
        const p = project3D(hx, hy, hz);
        const wave = 0.5 + 0.5 * Math.sin(i * 0.55 + t * 2.4 + j * 0.7);
        const radius = (1.5 + wave * 3.4) * (p.scale / 220);
        ctx.fillStyle = hexToRgba(wave > 0.55 ? CONFIG.accent : CONFIG.secondary, 0.78);
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(1, radius), 0, Math.PI * 2);
        ctx.fill();
      }
    }

    keys.sort(function(a, b) { return b.z - a.z; });
    keys.forEach(function(k) {
      const w = 0.125;
      const h = 0.09;
      const top = [
        [k.kx - w, k.ky - h, k.kz - w],
        [k.kx + w, k.ky - h, k.kz - w],
        [k.kx + w, k.ky - h, k.kz + w],
        [k.kx - w, k.ky - h, k.kz + w]
      ];
      const front = [
        [k.kx - w, k.ky - h, k.kz + w],
        [k.kx + w, k.ky - h, k.kz + w],
        [k.kx + w, k.ky + h, k.kz + w],
        [k.kx - w, k.ky + h, k.kz + w]
      ];
      const isHot = k.press > 0.09 || k.c === 0 || k.c === cols - 1;
      const col = isHot ? CONFIG.accent : CONFIG.secondary;
      drawFace(front, hexToRgba(col, 0.18), hexToRgba(col, 0.65), 1);
      drawFace(top, hexToRgba(col, isHot ? 0.48 : 0.25), hexToRgba(col, 0.9), 1.2);
    });
    STATE.nodeCount = keys.length + 153;
  }

  function renderRetroCrtDial(t) {
    drawStageGrid();
    const ringCount = 8;
    const ex = STATE.exploded * 0.45;
    for (let s = 0; s < ringCount; s++) {
      const ang0 = (s / ringCount) * Math.PI * 2 + t * 0.25;
      const ang1 = ((s + 0.78) / ringCount) * Math.PI * 2 + t * 0.25;
      const active = s === (STATE.selectedSlot % ringCount);
      const rIn = 0.62 + (active ? 0.08 : 0);
      const rOut = 1.18 + (active ? 0.14 : 0) + ex * 0.35;
      const zPlane = active ? 0.24 + ex : -0.1;
      const seg = [
        [Math.cos(ang0) * rIn, Math.sin(ang0) * rIn, zPlane],
        [Math.cos(ang0) * rOut, Math.sin(ang0) * rOut, zPlane],
        [Math.cos(ang1) * rOut, Math.sin(ang1) * rOut, zPlane],
        [Math.cos(ang1) * rIn, Math.sin(ang1) * rIn, zPlane]
      ];
      const col = active ? CONFIG.accent : CONFIG.secondary;
      drawFace(seg, hexToRgba(col, active ? 0.52 : 0.2), hexToRgba(col, 0.9), active ? 2 : 1.1);
    }

    ctx.beginPath();
    for (let i = 0; i <= 48; i++) {
      const u = (i / 48) * 2 - 1;
      const x = u * 0.85;
      const y = Math.sin(u * 6 + t * 4) * 0.22 * (1 + STATE.pulseEnergy) + Math.cos(u * 11 - t * 2) * 0.08;
      const p = project3D(x, y, 0.35 + ex);
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    }
    ctx.strokeStyle = CONFIG.accent;
    ctx.lineWidth = 2.2;
    ctx.stroke();
    STATE.nodeCount = ringCount * 4 + 48;
  }

  function renderOrbitalConstellation(t) {
    const rings = [0.75, 1.22, 1.68];
    const nodes = [];
    rings.forEach(function(rad, ri) {
      const tilt = (ri - 1) * 0.42 + STATE.exploded * 0.35;
      ctx.beginPath();
      for (let i = 0; i <= 64; i++) {
        const a = (i / 64) * Math.PI * 2;
        const x = Math.cos(a) * rad;
        const z = Math.sin(a) * rad * Math.cos(tilt);
        const y = Math.sin(a) * rad * Math.sin(tilt);
        const p = project3D(x, y, z);
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      }
      ctx.strokeStyle = hexToRgba(ri % 2 === 0 ? CONFIG.accent : CONFIG.secondary, 0.48);
      ctx.lineWidth = 1.25;
      ctx.stroke();

      const count = 4 + ri * 2;
      for (let k = 0; k < count; k++) {
        const a = (k / count) * Math.PI * 2 + t * (0.45 - ri * 0.11);
        const x = Math.cos(a) * rad;
        const z = Math.sin(a) * rad * Math.cos(tilt);
        const y = Math.sin(a) * rad * Math.sin(tilt);
        const p = project3D(x, y, z);
        nodes.push({ p: p, ri: ri, k: k });
      }
    });

    const center = project3D(0, 0, 0);
    const coreGrad = ctx.createRadialGradient(center.x, center.y, 2, center.x, center.y, 44 * STATE.zoom);
    coreGrad.addColorStop(0, CONFIG.accent);
    coreGrad.addColorStop(1, hexToRgba(CONFIG.accent, 0));
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(center.x, center.y, 44 * STATE.zoom, 0, Math.PI * 2);
    ctx.fill();

    nodes.sort(function(a, b) { return b.p.z - a.p.z; });
    nodes.forEach(function(n, idx) {
      ctx.strokeStyle = hexToRgba(CONFIG.accent, 0.24);
      ctx.beginPath();
      ctx.moveTo(center.x, center.y);
      ctx.lineTo(n.p.x, n.p.y);
      ctx.stroke();

      const r = (idx === STATE.selectedSlot % nodes.length ? 8 : 5.2) * (n.p.scale / 220);
      ctx.fillStyle = n.ri % 2 === 0 ? CONFIG.accent : CONFIG.secondary;
      ctx.beginPath();
      ctx.arc(n.p.x, n.p.y, Math.max(3, r), 0, Math.PI * 2);
      ctx.fill();
    });
    STATE.nodeCount = nodes.length + 3;
  }

  function renderTerrainValley(t) {
    const rows = 16;
    const cols = 22;
    for (let r = 0; r < rows; r++) {
      ctx.beginPath();
      for (let c = 0; c <= cols; c++) {
        const u = (c / cols) * 2 - 1;
        const v = (r / rows) * 2 - 1;
        const ridge = Math.abs(u) * 0.65;
        const noise = Math.sin(u * 4.2 + t + r * 0.45) * 0.16 + Math.cos(v * 3.5 - t * 0.8) * 0.14;
        const cursorLift = Math.exp(-((u - STATE.normX) * (u - STATE.normX) + (v - STATE.normY) * (v - STATE.normY)) * 4) * 0.35;
        const y = 0.55 - ridge - noise - cursorLift + STATE.exploded * ((r % 2) * 0.18);
        const p = project3D(u * 1.85, y, v * 1.45);
        if (c === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      }
      const mix = r / rows;
      ctx.strokeStyle = hexToRgba(mix < 0.5 ? CONFIG.accent : CONFIG.secondary, 0.45 + mix * 0.45);
      ctx.lineWidth = 1.4;
      ctx.stroke();
    }

    for (let b = 0; b < 3; b++) {
      ctx.beginPath();
      for (let i = 0; i <= 36; i++) {
        const u = (i / 36) * 2 - 1;
        const y = -0.82 - b * 0.18 + Math.sin(u * 3.5 + t * 1.5 + b) * 0.14;
        const z = -0.9 + Math.cos(u * 2.2 + t) * 0.25;
        const p = project3D(u * 1.7, y, z);
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      }
      ctx.strokeStyle = hexToRgba(b % 2 === 0 ? CONFIG.accent : CONFIG.secondary, 0.62);
      ctx.lineWidth = 2.4;
      ctx.stroke();
    }
    STATE.nodeCount = rows * cols + 108;
  }

  function renderArchitecturalTower(t) {
    drawStageGrid();
    const tiers = 5;
    const boxes = [];
    for (let lv = 0; lv < tiers; lv++) {
      const ratio = 1 - lv * 0.14;
      const w = 0.78 * ratio;
      const h = 0.18;
      const yBase = 0.72 - lv * (0.34 + STATE.exploded * 0.18);
      const sway = Math.sin(t * 1.5 + lv * 0.6) * 0.03 * (1 + STATE.pulseEnergy);
      const roof = [
        [-w * 1.22 + sway, yBase - h, -w * 1.22],
        [w * 1.22 + sway, yBase - h, -w * 1.22],
        [w * 1.22 + sway, yBase - h, w * 1.22],
        [-w * 1.22 + sway, yBase - h, w * 1.22]
      ];
      const front = [
        [-w + sway, yBase - h, w],
        [w + sway, yBase - h, w],
        [w + sway, yBase + h, w],
        [-w + sway, yBase + h, w]
      ];
      const side = [
        [w + sway, yBase - h, -w],
        [w + sway, yBase - h, w],
        [w + sway, yBase + h, w],
        [w + sway, yBase + h, -w]
      ];
      boxes.push({ pts: side, col: CONFIG.secondary, alpha: 0.26 });
      boxes.push({ pts: front, col: CONFIG.accent, alpha: 0.34 });
      boxes.push({ pts: roof, col: lv % 2 === 0 ? CONFIG.accent : CONFIG.secondary, alpha: 0.48 });
    }
    boxes.forEach(function(b) {
      drawFace(b.pts, hexToRgba(b.col, b.alpha), hexToRgba(b.col, 0.92), 1.4);
    });
    const spire0 = project3D(0, 0.85, 0);
    const spire1 = project3D(0, -1.35 - STATE.exploded * 0.7, 0);
    ctx.strokeStyle = CONFIG.accent;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(spire0.x, spire0.y);
    ctx.lineTo(spire1.x, spire1.y);
    ctx.stroke();
    STATE.nodeCount = tiers * 12 + 2;
  }

  function renderIsometricAssembly(t) {
    drawStageGrid();
    const layers = 4;
    const slabs = [];
    for (let l = 0; l < layers; l++) {
      const spread = (l - 1.5) * (0.28 + STATE.exploded * 0.32);
      const w = 0.92 - l * 0.1;
      const d = 0.68 - l * 0.06;
      const h = 0.07;
      const y = spread + Math.sin(t * 2 + l) * 0.025;
      const top = [[-w, y - h, -d], [w, y - h, -d], [w, y - h, d], [-w, y - h, d]];
      const left = [[-w, y - h, d], [w, y - h, d], [w, y + h, d], [-w, y + h, d]];
      const right = [[w, y - h, -d], [w, y - h, d], [w, y + h, d], [w, y + h, -d]];
      const col = l % 2 === 0 ? CONFIG.accent : CONFIG.secondary;
      slabs.push({ top: top, left: left, right: right, col: col, l: l });
    }
    slabs.forEach(function(s) {
      drawFace(s.right, hexToRgba(s.col, 0.2), hexToRgba(s.col, 0.75), 1.15);
      drawFace(s.left, hexToRgba(s.col, 0.28), hexToRgba(s.col, 0.85), 1.15);
      drawFace(s.top, hexToRgba(s.col, 0.42), hexToRgba(s.col, 0.96), 1.4);
    });
    STATE.nodeCount = layers * 12;
  }

  function renderStructureFlow(t) {
    const total = CONFIG.density * 5;
    const pts = [];
    const golden = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < total; i++) {
      const frac = i / total;
      const theta = i * golden + t * 0.45;
      const yBase = 1 - frac * 2;
      const rBase = Math.sqrt(Math.max(0, 1 - yBase * yBase));
      const wave = 1 + 0.25 * Math.sin(frac * 14 - t * 2.6) + STATE.exploded * 0.45;
      let x = Math.cos(theta) * rBase * 1.35 * wave;
      let y = yBase * 1.15 * wave;
      let z = Math.sin(theta) * rBase * 1.35 * wave;

      const dx = x - STATE.normX * 1.4;
      const dy = y - STATE.normY * 1.1;
      const d2 = dx * dx + dy * dy;
      const push = Math.exp(-d2 * 2.2) * (0.38 + STATE.pulseEnergy * 0.5);
      x += dx * push;
      y += dy * push;

      const p = project3D(x, y, z);
      pts.push({ p: p, i: i, frac: frac });
    }

    pts.sort(function(a, b) { return b.p.z - a.p.z; });
    for (let i = 0; i < pts.length; i++) {
      const item = pts[i];
      const col = item.i % 3 === 0 ? CONFIG.secondary : CONFIG.accent;
      const rad = Math.max(1.4, (2.2 + (1 - item.frac) * 2.8) * (item.p.scale / 230));
      if (STATE.renderMode !== 0 && i > 0 && i % 2 === 0) {
        const prev = pts[i - 1].p;
        ctx.strokeStyle = hexToRgba(col, 0.28);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(prev.x, prev.y);
        ctx.lineTo(item.p.x, item.p.y);
        ctx.stroke();
      }
      ctx.fillStyle = hexToRgba(col, 0.86);
      ctx.beginPath();
      ctx.arc(item.p.x, item.p.y, rad, 0, Math.PI * 2);
      ctx.fill();
    }
    STATE.nodeCount = total;
  }

  function renderRefractiveGlass(t) {
    drawStageGrid();
    const panes = 5;
    for (let i = 0; i < panes; i++) {
      const z = (i - 2) * (0.34 + STATE.exploded * 0.25);
      const tiltX = Math.sin(t * 1.2 + i * 0.7) * 0.12 + STATE.normX * 0.22;
      const tiltY = Math.cos(t * 1.1 + i * 0.5) * 0.1 + STATE.normY * 0.18;
      const w = 1.05 - i * 0.08;
      const h = 0.68 - i * 0.04;
      const pts = [
        [-w + tiltX, -h + tiltY, z],
        [w + tiltX, -h - tiltY, z],
        [w - tiltX, h - tiltY, z],
        [-w - tiltX, h + tiltY, z]
      ];
      const col = i % 2 === 0 ? CONFIG.accent : CONFIG.secondary;
      drawFace(pts, hexToRgba(col, 0.22), hexToRgba(col, 0.92), 1.6);
    }

    const core = project3D(STATE.normX * 0.45, STATE.normY * 0.35, 0);
    const rg = ctx.createRadialGradient(core.x, core.y, 4, core.x, core.y, 90 * STATE.zoom);
    rg.addColorStop(0, hexToRgba(CONFIG.accent, 0.45));
    rg.addColorStop(0.5, hexToRgba(CONFIG.secondary, 0.2));
    rg.addColorStop(1, hexToRgba(CONFIG.accent, 0));
    ctx.fillStyle = rg;
    ctx.beginPath();
    ctx.arc(core.x, core.y, 90 * STATE.zoom, 0, Math.PI * 2);
    ctx.fill();
    STATE.nodeCount = panes * 4 + 1;
  }

  function renderMagneticDock(t) {
    drawStageGrid();
    const count = 9;
    for (let i = 0; i < count; i++) {
      const u = (i / (count - 1)) * 2 - 1;
      const dist = Math.abs(u - STATE.normX);
      const gauss = Math.exp(-(dist * dist) * 5.5);
      const h = 0.24 + gauss * 0.68 + Math.sin(t * 2.5 + i * 0.7) * 0.08;
      const w = 0.13 + gauss * 0.05;
      const x = u * 1.45;
      const z = gauss * 0.45 + (i % 2 === 0 ? 1 : -1) * STATE.exploded * 0.3;
      const face = [
        [x - w, 0.55 - h * 2, z],
        [x + w, 0.55 - h * 2, z],
        [x + w, 0.55, z],
        [x - w, 0.55, z]
      ];
      const col = gauss > 0.45 ? CONFIG.accent : CONFIG.secondary;
      drawFace(face, hexToRgba(col, 0.26 + gauss * 0.35), hexToRgba(col, 0.92), 1.5);
    }
    STATE.nodeCount = count * 4;
  }

  function renderFrame() {
    ctx.clearRect(0, 0, STATE.width, STATE.height);

    if (STATE.autoSpin && !STATE.dragging) {
      STATE.targetYaw += 0.0055;
    }
    STATE.yaw += (STATE.targetYaw - STATE.yaw) * 0.12;
    STATE.pitch += (STATE.targetPitch - STATE.pitch) * 0.12;
    STATE.zoom += (STATE.targetZoom - STATE.zoom) * 0.14;
    STATE.exploded += (STATE.targetExploded - STATE.exploded) * 0.12;
    STATE.pulseEnergy *= 0.92;
    if (STATE.autoSpin || STATE.dragging || STATE.pulseEnergy > 0.01) {
      STATE.time += 0.018;
    }

    switch (CONFIG.engine) {
      case 'tetra-solid':
        renderTetraSolid(STATE.time);
        break;
      case 'origami-sheet':
        renderOrigamiSheet(STATE.time);
        break;
      case 'halftone-keymatrix':
        renderHalftoneKeymatrix(STATE.time);
        break;
      case 'retro-crt-dial':
        renderRetroCrtDial(STATE.time);
        break;
      case 'orbital-constellation':
        renderOrbitalConstellation(STATE.time);
        break;
      case 'terrain-valley':
        renderTerrainValley(STATE.time);
        break;
      case 'architectural-tower':
        renderArchitecturalTower(STATE.time);
        break;
      case 'isometric-assembly':
        renderIsometricAssembly(STATE.time);
        break;
      case 'refractive-glass':
        renderRefractiveGlass(STATE.time);
        break;
      case 'magnetic-dock':
        renderMagneticDock(STATE.time);
        break;
      default:
        renderStructureFlow(STATE.time);
        break;
    }

    const degY = Math.round((STATE.yaw * 180) / Math.PI) % 360;
    const degP = Math.round((STATE.pitch * 180) / Math.PI);
    telRot.textContent = degY + '° / ' + degP + '°';
    telZoom.textContent = STATE.zoom.toFixed(2) + 'x';
    telNodes.textContent = String(STATE.nodeCount);

    requestAnimationFrame(renderFrame);
  }

  canvas.addEventListener('pointerdown', function(e) {
    STATE.dragging = true;
    STATE.lastX = e.clientX;
    STATE.lastY = e.clientY;
    if (canvas.setPointerCapture) {
      try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
    }
  });

  window.addEventListener('pointermove', function(e) {
    STATE.pointerX = e.clientX;
    STATE.pointerY = e.clientY;
    STATE.normX = (e.clientX / Math.max(1, STATE.width)) * 2 - 1;
    STATE.normY = (e.clientY / Math.max(1, STATE.height)) * 2 - 1;
    if (!STATE.dragging) return;
    const dx = e.clientX - STATE.lastX;
    const dy = e.clientY - STATE.lastY;
    STATE.lastX = e.clientX;
    STATE.lastY = e.clientY;
    STATE.targetYaw += dx * 0.0085;
    STATE.targetPitch = Math.max(-1.25, Math.min(1.25, STATE.targetPitch + dy * 0.0075));
  });

  window.addEventListener('pointerup', function() {
    STATE.dragging = false;
  });

  canvas.addEventListener('click', function() {
    STATE.pulseEnergy = 1.0;
    STATE.selectedSlot = (STATE.selectedSlot + 1) % 48;
  });

  canvas.addEventListener('wheel', function(e) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.09 : 0.09;
    STATE.targetZoom = Math.max(0.58, Math.min(2.15, STATE.targetZoom + delta));
  }, { passive: false });

  const modeLabels = ['Chế độ: Khối đặc', 'Chế độ: Khung dây', 'Chế độ: Quang phổ'];
  btnMode.addEventListener('click', function() {
    STATE.renderMode = (STATE.renderMode + 1) % 3;
    btnMode.textContent = modeLabels[STATE.renderMode];
    STATE.pulseEnergy = 0.7;
  });

  btnExplode.addEventListener('click', function() {
    STATE.targetExploded = STATE.targetExploded > 0.5 ? 0 : 1;
    const on = STATE.targetExploded > 0.5;
    btnExplode.setAttribute('data-active', on ? 'true' : 'false');
    btnExplode.textContent = on ? 'Phân tách: Bật' : 'Phân tách: Tắt';
  });

  btnSpin.addEventListener('click', function() {
    STATE.autoSpin = !STATE.autoSpin;
    btnSpin.setAttribute('data-active', STATE.autoSpin ? 'true' : 'false');
    btnSpin.textContent = STATE.autoSpin ? 'Tự xoay: Bật' : 'Tự xoay: Tắt';
  });

  btnPulse.addEventListener('click', function() {
    STATE.pulseEnergy = 1.25;
    STATE.selectedSlot = (STATE.selectedSlot + 1) % 48;
  });

  btnReset.addEventListener('click', function() {
    STATE.targetYaw = CONFIG.defaultYaw;
    STATE.targetPitch = CONFIG.defaultPitch;
    STATE.targetZoom = 1.0;
    STATE.targetExploded = 0;
    btnExplode.setAttribute('data-active', 'false');
    btnExplode.textContent = 'Phân tách: Tắt';
    STATE.pulseEnergy = 0.6;
  });

  requestAnimationFrame(renderFrame);
})();
</script>
</body>
</html>`;
}
