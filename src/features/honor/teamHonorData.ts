import * as THREE from 'three';

export type HonorMotif =
  | 'compass'
  | 'pillars'
  | 'chart195'
  | 'lattice'
  | 'prism'
  | 'grid7662'
  | 'shield'
  | 'nodes'
  | 'spiral';

export interface HonorMetric {
  label: string;
  value: string;
}

export interface HonorExhibit {
  id: string;
  code: string;
  title: string;
  subtitle: string;
  track: string;
  kicker: string;
  milestone: string;
  motif: HonorMotif;
  palette: {
    bgTop: string;
    bgBottom: string;
    ink: string;
    muted: string;
    accent: string;
    secondary: string;
    frameTint: string;
  };
  metrics: HonorMetric[];
  options: {
    roles: string[];
    categories: string[];
    phases: string[];
  };
  accordions: {
    coreContribution: string;
    architectureResults: string;
    gratitude: string;
  };
  relatedIds: [string, string, string];
}

export const HONOR_EXHIBITS: HonorExhibit[] = [
  {
    id: 'team-core',
    code: '01',
    title: 'Ban Phát Triển FPT Forum',
    subtitle: 'Nhóm Kiến Trúc & Thi Công Nền Tảng',
    track: 'Tập thể Tác giả · TH, THCS & THPT FPT',
    kicker: 'HỒ SƠ SÁNG LẬP · 01',
    milestone: 'Phiên bản 3.0 · 2026',
    motif: 'compass',
    palette: {
      bgTop: '#101c1a',
      bgBottom: '#0a1211',
      ink: '#f4f7f5',
      muted: '#a8beb6',
      accent: '#38c99a',
      secondary: '#e6b385',
      frameTint: '#1b2b28',
    },
    metrics: [
      { label: 'Không gian tích hợp', value: '5 phân hệ' },
      { label: 'Chuẩn đáp ứng', value: '390 / 768 / 1440' },
      { label: 'Mã nguồn mở', value: 'MIT License' },
    ],
    options: {
      roles: ['Kiến trúc sư trưởng', 'Kỹ sư Giao diện', 'Điều phối sản phẩm'],
      categories: ['Nền tảng lõi', 'Trải nghiệm học tập', 'Thiết kế hệ thống'],
      phases: ['Khởi tạo v1', 'Tái cấu trúc v3', 'Chuẩn hóa mở'],
    },
    accordions: {
      coreContribution:
        'Khởi xướng và trực tiếp xây dựng FPT Forum như một xưởng lắp ráp web mở dành cho học sinh yêu công nghệ. Mọi thao tác từ chọn mẫu giao diện, thử nghiệm trong hộp cát đến xuất bản dự án đều vận hành liền mạch ngay trên trình duyệt.',
      architectureResults:
        'Hợp nhất Bàn soi Khám phá, Workspace chỉnh sửa trực tiếp, Cộng đồng Tri thức và Trình kiểm định 6 lớp vào một kiến trúc thống nhất, giảm tối đa rào cản cài đặt môi trường cho người mới bắt đầu.',
      gratitude:
        'Tri ân các thành viên nòng cốt đã bền bỉ thử nghiệm qua từng bản dựng, giữ vững tinh thần làm sản phẩm thật phục vụ cộng đồng học sinh FPT.',
    },
    relatedIds: ['mentors-council', 'system-architecture', 'open-assembly-roadmap'],
  },
  {
    id: 'mentors-council',
    code: '02',
    title: 'Hội Đồng Thầy Cô Cố Vấn',
    subtitle: 'Định Hướng Sư Phạm & Khoa Học Kỹ Thuật',
    track: 'Cố vấn Chuyên môn · TH, THCS & THPT FPT',
    kicker: 'TRI ÂN CỐ VẤN · 02',
    milestone: 'Đồng hành xuyên suốt',
    motif: 'pillars',
    palette: {
      bgTop: '#f5f1e7',
      bgBottom: '#e7e1d1',
      ink: '#15201d',
      muted: '#4d5d57',
      accent: '#0b7a59',
      secondary: '#9c622d',
      frameTint: '#d8d0be',
    },
    metrics: [
      { label: 'Chuẩn nghiên cứu', value: 'KHKT Cấp trường' },
      { label: 'Phản biện học thuật', value: '6 vòng duyệt' },
      { label: 'Mục tiêu sư phạm', value: 'Tư duy độc lập' },
    ],
    options: {
      roles: ['Cố vấn Khoa học', 'Hướng dẫn Sư phạm', 'Phản biện Kỹ thuật'],
      categories: ['Phương pháp luận', 'Đạo đức AI', 'Định hướng học sinh'],
      phases: ['Đặt vấn đề', 'Thẩm định dữ liệu', 'Hoàn thiện báo cáo'],
    },
    accordions: {
      coreContribution:
        'Định hướng câu hỏi nghiên cứu cốt lõi: làm thế nào để học sinh sử dụng AI như một công cụ nâng cao năng lực thiết kế và tư duy phản biện thay vì sao chép thụ động.',
      architectureResults:
        'Chuẩn hóa khung đánh giá sản phẩm theo tiêu chí minh bạch, yêu cầu mọi mẫu giao diện đều có giải thích cấu trúc, mã nguồn đối chiếu và câu lệnh gợi ý rõ ràng.',
      gratitude:
        'Xin gửi lời cảm ơn sâu sắc tới quý thầy cô đã kiên nhẫn lắng nghe, góp ý từng chi tiết nhỏ từ bố cục câu hỏi khảo sát đến quy trình kiểm thử thực tế.',
    },
    relatedIds: ['research-195', 'team-core', 'community-hub'],
  },
  {
    id: 'research-195',
    code: '03',
    title: 'Khảo Sát 195 Học Sinh',
    subtitle: 'Dữ Liệu Thực Chứng & Đối Chiếu OECD PISA 2025',
    track: 'Nhóm Nghiên cứu Khoa học · FPT Schools',
    kicker: 'BẰNG CHỨNG THỰC NGHIỆM · 03',
    milestone: '195 phiếu hợp lệ · 91,2%',
    motif: 'chart195',
    palette: {
      bgTop: '#161b22',
      bgBottom: '#0d1217',
      ink: '#f3f6f4',
      muted: '#a4b4be',
      accent: '#38c99a',
      secondary: '#7aa8b8',
      frameTint: '#242d37',
    },
    metrics: [
      { label: 'Mẫu khảo sát thực tế', value: '195 học sinh' },
      { label: 'Đánh giá cao UI trực quan', value: '91,2%' },
      { label: 'Tham chiếu PISA 2025', value: '95,9% dùng AI' },
    ],
    options: {
      roles: ['Điều tra viên', 'Phân tích số liệu', 'Biên tập báo cáo'],
      categories: ['Khảo sát học đường', 'Đối chiếu PISA', 'Kiểm chứng giả thuyết'],
      phases: ['Thu thập 195 mẫu', 'Xử lý định lượng', 'Đo tỷ lệ hoàn thiện'],
    },
    accordions: {
      coreContribution:
        'Thực hiện khảo sát nghiêm túc trên 195 học sinh và người dùng thực tế để đo lường khoảng trống giữa việc sử dụng AI đại trà và khả năng tạo ra giao diện web hoàn chỉnh.',
      architectureResults:
        'Kết quả ghi nhận 91,2% người tham gia đánh giá cao mô hình thư viện UI/UX trực quan kết hợp đối chiếu mã nguồn, đồng thời khẳng định nhu cầu cấp thiết về công cụ kiểm tra chất lượng đầu ra.',
      gratitude:
        'Cảm ơn 195 bạn học sinh và người dùng thử nghiệm đã dành thời gian phản hồi thẳng thắn, tạo nền móng dữ liệu vững chắc cho mọi quyết định thiết kế của F-Forum.',
    },
    relatedIds: ['anti-slop-engine', 'ui-vault-7662', 'mentors-council'],
  },
  {
    id: 'system-architecture',
    code: '04',
    title: 'Kiến Trúc Lõi & Đồng Bộ',
    subtitle: 'Cầu Nối API Bảo Mật & Workspace Thời Gian Thực',
    track: 'Nhóm Hạ tầng Kỹ thuật · Core Runtime',
    kicker: 'HẠ TẦNG HỆ THỐNG · 04',
    milestone: 'Node + React 19 + Vite',
    motif: 'lattice',
    palette: {
      bgTop: '#1b1824',
      bgBottom: '#110f17',
      ink: '#f5f2f7',
      muted: '#b5aec2',
      accent: '#38c99a',
      secondary: '#e6b385',
      frameTint: '#2b2638',
    },
    metrics: [
      { label: 'Kiểm định đầu ra', value: '6 lớp tự động' },
      { label: 'Cô lập thực thi', value: 'Sandbox iframe' },
      { label: 'Lưu trữ cục bộ', value: 'JSON + Snapshot' },
    ],
    options: {
      roles: ['Kỹ sư Backend', 'Kiến trúc Runtime', 'Quản lý Trạng thái'],
      categories: ['Cầu nối API', 'Lưu trữ Snapshot', 'Đóng gói ZIP'],
      phases: ['Thiết kế Schema', 'Tối ưu Diff Engine', 'Bảo vệ luồng AI'],
    },
    accordions: {
      coreContribution:
        'Xây dựng toàn bộ xương sống kỹ thuật gồm cầu nối API kiểm soát hạn mức, trình tính toán sai khác mã nguồn (Diff Engine), quản lý phiên bản snapshot và xuất gói ZIP an toàn.',
      architectureResults:
        'Cho phép xem trước giao diện đa khung hình (390px / 768px / 1440px) trong iframe cô lập hoàn toàn, hỗ trợ cấu hình khóa API cá nhân (BYOK) lưu cục bộ không gửi lên kho lưu trữ công khai.',
      gratitude:
        'Ghi nhận sự tỉ mỉ của đội ngũ phát triển hạ tầng trong việc giữ cho mọi thao tác dựng web luôn nhanh, mượt và có thể kiểm chứng từng dòng thay đổi.',
    },
    relatedIds: ['security-shield', 'anti-slop-engine', 'team-core'],
  },
  {
    id: 'anti-slop-engine',
    code: '05',
    title: 'Động Cơ Chống "AI Slop"',
    subtitle: 'Chuẩn Kiểm Định 6 Lớp & Kỷ Luật Thiết Kế',
    track: 'Nhóm Chất lượng Mã & Thẩm mỹ · QA Gate',
    kicker: 'TIÊU CHUẨN CHẤT LƯỢNG · 05',
    milestone: 'Zero-Slop · 6 Layers',
    motif: 'prism',
    palette: {
      bgTop: '#0f1f1c',
      bgBottom: '#081210',
      ink: '#f2f7f5',
      muted: '#9eb8b0',
      accent: '#38c99a',
      secondary: '#6fd4aa',
      frameTint: '#1a322d',
    },
    metrics: [
      { label: 'Lớp rà soát tự động', value: 'HTML / CSS / JS' },
      { label: 'Độ tương phản chuẩn', value: '>= 4.5 : 1' },
      { label: 'Lỗi tràn ngang', value: '0px Overflow' },
    ],
    options: {
      roles: ['Kỹ sư QA', 'Thiết kế Rule', 'Kiểm định A11y'],
      categories: ['Kiểm định tĩnh', 'Độ tương phản', 'Chống mẫu rác'],
      phases: ['Định nghĩa 6 lớp', 'Tích hợp Workspace', 'Tự động hóa cổng'],
    },
    accordions: {
      coreContribution:
        'Thiết lập bộ quy tắc chống "AI Slop" — loại bỏ văn bản giả, gradient tím-xanh rập khuôn, biểu tượng cảm xúc thay thế icon và mã nguồn thiếu khả năng tiếp cận.',
      architectureResults:
        'Tích hợp trình kiểm tra 6 lớp (cấu trúc HTML, cú pháp JS, bố cục đa màn hình, liên kết nội bộ, rà quét bí mật, khả năng tiếp cận) chạy trực tiếp trước khi người dùng xuất mã.',
      gratitude:
        'Cảm ơn nhóm kiểm định đã giữ vững kỷ luật "bằng chứng thật", biến tiêu chuẩn kỹ thuật chuyên nghiệp thành phản hồi dễ hiểu cho học sinh.',
    },
    relatedIds: ['ui-vault-7662', 'system-architecture', 'research-195'],
  },
  {
    id: 'ui-vault-7662',
    code: '06',
    title: 'Kho 7.662 Mẫu Giao Diện',
    subtitle: 'Bản Địa Hóa 6 Thư Viện UI/UX Mở Hàng Đầu',
    track: 'Nhóm Thẩm mỹ & Biên soạn · Design Vault',
    kicker: 'TỦ SÁCH TÀI NGUYÊN · 06',
    milestone: '7.662 UI · 60 Công cụ · 122 Repo',
    motif: 'grid7662',
    palette: {
      bgTop: '#f1ede2',
      bgBottom: '#dfd8c6',
      ink: '#131b19',
      muted: '#4d5b55',
      accent: '#0b7a59',
      secondary: '#8a5627',
      frameTint: '#cfc6b0',
    },
    metrics: [
      { label: 'Thành phần UI chuẩn', value: '7.662 mẫu' },
      { label: 'Công cụ & Kho mã', value: '60 tools · 122 repo' },
      { label: 'Thư viện nguồn', value: '6 hệ sinh thái' },
    ],
    options: {
      roles: ['Biên soạn Tài nguyên', 'Chuẩn hóa Shard', 'Việt hóa Đặc tả'],
      categories: ['PinUI & ThreeUI', 'Motion AI & GetLayers', 'CodeFronts & LucianLabs'],
      phases: ['Phân loại danh mục', 'Nén dữ liệu tĩnh', 'Đồng bộ Bàn soi'],
    },
    accordions: {
      coreContribution:
        'Phân loại, kiểm tra tính khả thi và Việt hóa ngữ cảnh sử dụng cho 7.662 mẫu giao diện cùng 60 công cụ và 122 kho mã nguồn GitHub tuyển chọn.',
      architectureResults:
        'Đóng gói tài nguyên theo các mảnh dữ liệu nén (.jgz) tải theo nhu cầu, giúp trình duyệt tìm kiếm và xem trước hàng nghìn thành phần mượt mà không phụ thuộc máy chủ ngoài.',
      gratitude:
        'Tri ân các tác giả mã nguồn mở theo giấy phép MIT và nhóm biên soạn đã kiểm duyệt từng mẫu để bảo đảm tính minh bạch về bản quyền và chất lượng.',
    },
    relatedIds: ['anti-slop-engine', 'research-195', 'open-assembly-roadmap'],
  },
  {
    id: 'security-shield',
    code: '07',
    title: 'Lá Chắn Bảo Mật & Riêng Tư',
    subtitle: 'Rà Quét Bí Mật, Kiểm Duyệt AI & Bảo Vệ Phiên',
    track: 'Nhóm An toàn Thông tin · Security Guard',
    kicker: 'AN TOÀN HỆ THỐNG · 07',
    milestone: 'Zero Secret Leak',
    motif: 'shield',
    palette: {
      bgTop: '#16141e',
      bgBottom: '#0d0c13',
      ink: '#f4f5f7',
      muted: '#aba9ba',
      accent: '#38c99a',
      secondary: '#8cbcc8',
      frameTint: '#252233',
    },
    metrics: [
      { label: 'Rà quét khóa API', value: 'Trước khi xuất ZIP' },
      { label: 'Cô lập xem trước', value: 'Không same-origin' },
      { label: 'Kiểm duyệt diễn đàn', value: 'Lọc spam tự động' },
    ],
    options: {
      roles: ['Chuyên trách Bảo mật', 'Kiểm duyệt Nội dung', 'Quản trị Dữ liệu'],
      categories: ['Secret Scanner', 'Sandbox Isolation', 'Chống Spam Cộng đồng'],
      phases: ['Rà soát đầu cuối', 'Khóa đường dẫn rò rỉ', 'Kiểm thử xâm nhập'],
    },
    accordions: {
      coreContribution:
        'Xây dựng hàng rào bảo vệ đa tầng: trình quét khóa bí mật trước khi đóng gói ZIP, tách biệt khung xem trước khỏi dữ liệu phiên và bộ lọc nội dung tự động cho diễn đàn.',
      architectureResults:
        'Đảm bảo mọi cấu hình khóa API cá nhân chỉ lưu cục bộ trên trình duyệt người dùng, không rò rỉ thông tin nhạy cảm vào lịch sử mã nguồn hay tệp báo cáo.',
      gratitude:
        'Cảm ơn các thành viên phụ trách an toàn hệ thống đã luôn đặt sự an tâm của thầy cô và học sinh lên hàng đầu trong mọi bản cập nhật.',
    },
    relatedIds: ['system-architecture', 'community-hub', 'anti-slop-engine'],
  },
  {
    id: 'community-hub',
    code: '08',
    title: 'Không Gian Tri Thức Mở',
    subtitle: 'Hỏi Đáp, Hộp Cát Showcase & Chuyển Giao CLB',
    track: 'Nhóm Cộng đồng Học thuật · Community Hub',
    kicker: 'KẾT NỐI CỘNG ĐỒNG · 08',
    milestone: '4 Kênh · Học liệu Mở',
    motif: 'nodes',
    palette: {
      bgTop: '#f3efe6',
      bgBottom: '#e3ddd0',
      ink: '#141c1a',
      muted: '#4d5b56',
      accent: '#0b7a59',
      secondary: '#7aa8b8',
      frameTint: '#d2cab8',
    },
    metrics: [
      { label: 'Kênh chuyên môn', value: 'Hỏi đáp · Drops' },
      { label: 'Hồ sơ CLB', value: 'Bàn giao minh bạch' },
      { label: 'Trình diễn mã', value: 'Hộp cát trực tiếp' },
    ],
    options: {
      roles: ['Điều phối Cộng đồng', 'Biên tập Học liệu', 'Chủ nhiệm CLB'],
      categories: ['Hỏi đáp Kỹ thuật', 'Showcase Mã nguồn', 'Hồ sơ Chuyển giao'],
      phases: ['Khởi tạo diễn đàn', 'Gắn kết CLB', 'Lưu giữ tri thức'],
    },
    accordions: {
      coreContribution:
        'Xây dựng văn hóa chia sẻ học thuật lành mạnh: câu hỏi kỹ thuật có giải pháp được chấp nhận, bản trình diễn chạy trực tiếp và hồ sơ bàn giao dự án giữa các thế hệ câu lạc bộ.',
      architectureResults:
        'Giúp tri thức của các anh chị khóa trước không bị thất truyền khi chuyển giao nhiệm kỳ, đồng thời cho phép học sinh mới sao chép thẳng gói cấu hình vào Workspace để thực hành.',
      gratitude:
        'Tri ân cộng đồng câu lạc bộ công nghệ và các bạn học sinh đã đóng góp câu hỏi, chia sẻ kinh nghiệm sửa lỗi và duy trì không khí trao đổi cởi mở.',
    },
    relatedIds: ['mentors-council', 'security-shield', 'open-assembly-roadmap'],
  },
  {
    id: 'open-assembly-roadmap',
    code: '09',
    title: 'Xưởng Lắp Ráp Mở Tương Lai',
    subtitle: 'Tầm Nhìn FPT Forum Notebook & Học Tập Suốt Đời',
    track: 'Định hướng Phát triển · FPT Forum Roadmap',
    kicker: 'TẦM NHÌN TIẾP NỐI · 09',
    milestone: 'FPT Forum Notebook',
    motif: 'spiral',
    palette: {
      bgTop: '#111b1b',
      bgBottom: '#0b1111',
      ink: '#f4f7f5',
      muted: '#a9bdb6',
      accent: '#38c99a',
      secondary: '#e6b385',
      frameTint: '#1c2b2a',
    },
    metrics: [
      { label: 'Truy cập công cụ', value: '100% Miễn phí' },
      { label: 'Hỗ trợ BYOK', value: 'Đa giao thức AI' },
      { label: 'Chế độ tiết kiệm', value: 'Eco / Balanced / Fab' },
    ],
    options: {
      roles: ['Hoạch định Lộ trình', 'Mở rộng Cộng đồng', 'Phát triển Mở'],
      categories: ['Học liệu Tương tác', 'Tối ưu Hiệu năng', 'Kết nối Liên trường'],
      phases: ['Mở rộng kho mẫu', 'Chế độ Eco xanh', 'Lan tỏa tri thức'],
    },
    accordions: {
      coreContribution:
        'Định vị FPT Forum không chỉ là một trang web tĩnh mà là cuốn Sổ tay Lắp ráp Mở đồng hành lâu dài cùng hành trình tự học lập trình và thiết kế của học sinh.',
      architectureResults:
        'Tiếp tục mở rộng chế độ hiển thị linh hoạt (Eco tiết kiệm pin, Balanced cân bằng, Fabulous trải nghiệm toàn phần) cùng kho tài nguyên liên tục được thẩm định.',
      gratitude:
        'Hành trình này chỉ mới bắt đầu — cảm ơn bạn đã ghé thăm phòng vinh danh 3D và trở thành một phần của cộng đồng sáng tạo FPT Forum.',
    },
    relatedIds: ['team-core', 'ui-vault-7662', 'community-hub'],
  },
];

export interface CachedHonorArtwork {
  canvas: HTMLCanvasElement;
  dataUrl: string;
  texture: THREE.CanvasTexture | null;
}

const artworkCache = new Map<string, CachedHonorArtwork>();

function drawMotif(
  ctx: CanvasRenderingContext2D,
  exhibit: HonorExhibit,
  cx: number,
  cy: number,
  radius: number
): void {
  const { accent, secondary, ink, muted } = exhibit.palette;
  ctx.save();
  ctx.translate(cx, cy);

  ctx.strokeStyle = `${ink}1c`;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.setLineDash([4, 6]);
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.78, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  switch (exhibit.motif) {
    case 'compass': {
      for (let i = 0; i < 8; i += 1) {
        const a = (i * Math.PI) / 4;
        ctx.strokeStyle = i % 2 === 0 ? accent : `${ink}44`;
        ctx.lineWidth = i % 2 === 0 ? 2 : 1;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * radius * 0.2, Math.sin(a) * radius * 0.2);
        ctx.lineTo(Math.cos(a) * radius * 0.92, Math.sin(a) * radius * 0.92);
        ctx.stroke();
      }
      ctx.fillStyle = secondary;
      ctx.beginPath();
      ctx.moveTo(0, -radius * 0.68);
      ctx.lineTo(radius * 0.14, 0);
      ctx.lineTo(0, radius * 0.68);
      ctx.lineTo(-radius * 0.14, 0);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.12, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'pillars': {
      const cols = [-0.62, -0.21, 0.21, 0.62];
      cols.forEach((offset, idx) => {
        const w = radius * 0.22;
        const h = radius * (0.95 + (idx % 2) * 0.18);
        ctx.fillStyle = idx % 2 === 0 ? `${accent}26` : `${secondary}24`;
        ctx.strokeStyle = idx % 2 === 0 ? accent : secondary;
        ctx.lineWidth = 1.8;
        ctx.fillRect(offset * radius - w / 2, -h / 2, w, h);
        ctx.strokeRect(offset * radius - w / 2, -h / 2, w, h);
      });
      ctx.strokeStyle = ink;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-radius * 0.85, -radius * 0.62);
      ctx.lineTo(radius * 0.85, -radius * 0.62);
      ctx.moveTo(-radius * 0.85, radius * 0.62);
      ctx.lineTo(radius * 0.85, radius * 0.62);
      ctx.stroke();
      break;
    }
    case 'chart195': {
      const bars = [0.32, 0.54, 0.68, 0.88, 0.95];
      const bw = radius * 0.22;
      bars.forEach((v, i) => {
        const x = (i - 2) * (bw * 1.45) - bw / 2;
        const h = radius * 1.2 * v;
        const y = radius * 0.58 - h;
        ctx.fillStyle = i >= 3 ? accent : `${muted}55`;
        ctx.fillRect(x, y, bw, h);
      });
      ctx.strokeStyle = secondary;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, -radius * 0.1, radius * 0.88, Math.PI * 1.05, Math.PI * 1.92);
      ctx.stroke();
      break;
    }
    case 'lattice': {
      const step = radius * 0.36;
      ctx.strokeStyle = `${ink}2e`;
      ctx.lineWidth = 1.2;
      for (let gx = -2; gx <= 2; gx += 1) {
        ctx.beginPath();
        ctx.moveTo(gx * step, -radius * 0.82);
        ctx.lineTo(gx * step, radius * 0.82);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-radius * 0.82, gx * step);
        ctx.lineTo(radius * 0.82, gx * step);
        ctx.stroke();
      }
      ctx.strokeStyle = accent;
      ctx.lineWidth = 2.2;
      ctx.strokeRect(-step * 1.4, -step * 1.4, step * 2.8, step * 2.8);
      ctx.strokeStyle = secondary;
      ctx.save();
      ctx.rotate(Math.PI / 4);
      ctx.strokeRect(-step, -step, step * 2, step * 2);
      ctx.restore();
      break;
    }
    case 'prism': {
      for (let i = 0; i < 6; i += 1) {
        const scale = 1 - i * 0.12;
        const r = radius * 0.86 * scale;
        ctx.strokeStyle = i === 0 ? accent : i % 2 === 0 ? secondary : `${ink}44`;
        ctx.lineWidth = i === 0 ? 2.4 : 1.4;
        ctx.beginPath();
        for (let k = 0; k < 6; k += 1) {
          const ang = (k * Math.PI) / 3 - Math.PI / 2;
          const px = Math.cos(ang) * r;
          const py = Math.sin(ang) * r;
          if (k === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();
      }
      break;
    }
    case 'grid7662': {
      const size = radius * 0.38;
      const gap = radius * 0.1;
      for (let row = -1; row <= 1; row += 1) {
        for (let col = -1; col <= 1; col += 1) {
          const x = col * (size + gap) - size / 2;
          const y = row * (size + gap) - size / 2;
          const isCenter = row === 0 && col === 0;
          ctx.fillStyle = isCenter ? accent : (row + col) % 2 === 0 ? `${accent}30` : `${secondary}2c`;
          ctx.strokeStyle = isCenter ? accent : `${ink}44`;
          ctx.lineWidth = 1.5;
          ctx.fillRect(x, y, size, size);
          ctx.strokeRect(x, y, size, size);
        }
      }
      break;
    }
    case 'shield': {
      ctx.strokeStyle = accent;
      ctx.lineWidth = 2.6;
      ctx.fillStyle = `${accent}1e`;
      ctx.beginPath();
      ctx.moveTo(0, -radius * 0.84);
      ctx.lineTo(radius * 0.72, -radius * 0.48);
      ctx.quadraticCurveTo(radius * 0.68, radius * 0.42, 0, radius * 0.88);
      ctx.quadraticCurveTo(-radius * 0.68, radius * 0.42, -radius * 0.72, -radius * 0.48);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = secondary;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(-radius * 0.25, radius * 0.04);
      ctx.lineTo(-radius * 0.05, radius * 0.26);
      ctx.lineTo(radius * 0.32, -radius * 0.18);
      ctx.stroke();
      break;
    }
    case 'nodes': {
      const pts: Array<[number, number, number]> = [
        [0, 0, 14],
        [-0.65, -0.45, 9],
        [0.68, -0.38, 10],
        [-0.58, 0.52, 8],
        [0.56, 0.56, 11],
        [0, -0.78, 8],
      ];
      ctx.strokeStyle = `${ink}40`;
      ctx.lineWidth = 1.5;
      for (let i = 1; i < pts.length; i += 1) {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(pts[i][0] * radius, pts[i][1] * radius);
        ctx.stroke();
      }
      pts.forEach(([px, py, rad], idx) => {
        ctx.fillStyle = idx === 0 ? accent : idx % 2 === 0 ? secondary : ink;
        ctx.beginPath();
        ctx.arc(px * radius, py * radius, rad, 0, Math.PI * 2);
        ctx.fill();
      });
      break;
    }
    case 'spiral': {
      ctx.strokeStyle = accent;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      const turns = 3.2;
      const steps = 140;
      for (let i = 0; i <= steps; i += 1) {
        const t = i / steps;
        const ang = t * Math.PI * 2 * turns;
        const rad = t * radius * 0.88;
        const px = Math.cos(ang) * rad;
        const py = Math.sin(ang) * rad;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.fillStyle = secondary;
      ctx.beginPath();
      ctx.arc(Math.cos(Math.PI * 2 * turns) * radius * 0.88, Math.sin(Math.PI * 2 * turns) * radius * 0.88, 7, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
  }

  ctx.restore();
}

function wrapTextLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export function createHonorArtwork(
  exhibit: HonorExhibit,
  maxAnisotropy = 4
): CachedHonorArtwork {
  const existing = artworkCache.get(exhibit.id);
  if (existing) {
    if (!existing.texture && typeof document !== 'undefined') {
      const tex = new THREE.CanvasTexture(existing.canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = Math.min(8, Math.max(1, maxAnisotropy));
      tex.needsUpdate = true;
      existing.texture = tex;
    }
    return existing;
  }

  const W = 567;
  const H = 763;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    const { bgTop, bgBottom, ink, muted, accent, secondary } = exhibit.palette;
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, bgTop);
    grad.addColorStop(1, bgBottom);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = `${ink}12`;
    ctx.lineWidth = 1;
    for (let x = 44; x < W - 40; x += 64) {
      ctx.beginPath();
      ctx.moveTo(x, 32);
      ctx.lineTo(x, H - 32);
      ctx.stroke();
    }

    ctx.strokeStyle = `${ink}2e`;
    ctx.lineWidth = 1.25;
    ctx.strokeRect(24, 24, W - 48, H - 48);

    ctx.strokeStyle = accent;
    ctx.lineWidth = 2;
    const corner = 16;
    const corners: Array<[number, number, number, number]> = [
      [24, 24, 1, 1],
      [W - 24, 24, -1, 1],
      [24, H - 24, 1, -1],
      [W - 24, H - 24, -1, -1],
    ];
    for (const [cx0, cy0, sx, sy] of corners) {
      ctx.beginPath();
      ctx.moveTo(cx0, cy0 + sy * corner);
      ctx.lineTo(cx0, cy0);
      ctx.lineTo(cx0 + sx * corner, cy0);
      ctx.stroke();
    }

    ctx.fillStyle = accent;
    ctx.font = '500 13px "IBM Plex Mono", ui-monospace, monospace';
    ctx.fillText(exhibit.kicker, 46, 62);

    ctx.fillStyle = muted;
    ctx.textAlign = 'right';
    ctx.font = '500 13px "IBM Plex Mono", ui-monospace, monospace';
    ctx.fillText(exhibit.milestone, W - 46, 62);
    ctx.textAlign = 'left';

    ctx.strokeStyle = `${ink}22`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(46, 80);
    ctx.lineTo(W - 46, 80);
    ctx.stroke();

    drawMotif(ctx, exhibit, W / 2, 290, 138);

    ctx.fillStyle = `${ink}12`;
    ctx.font = '600 92px "Cormorant Garamond", Georgia, serif';
    ctx.textAlign = 'right';
    ctx.fillText(exhibit.code, W - 44, 520);
    ctx.textAlign = 'left';

    ctx.fillStyle = secondary;
    ctx.font = '600 13px "Be Vietnam Pro", system-ui, sans-serif';
    ctx.fillText(exhibit.track.toUpperCase(), 46, 510);

    ctx.fillStyle = ink;
    ctx.font = '600 36px "Cormorant Garamond", Georgia, serif';
    const titleLines = wrapTextLines(ctx, exhibit.title, W - 92);
    let ty = 556;
    for (const line of titleLines.slice(0, 2)) {
      ctx.fillText(line, 46, ty);
      ty += 42;
    }

    ctx.fillStyle = muted;
    ctx.font = '400 16px "Be Vietnam Pro", system-ui, sans-serif';
    const subLines = wrapTextLines(ctx, exhibit.subtitle, W - 92);
    let sy = ty + 6;
    for (const line of subLines.slice(0, 2)) {
      ctx.fillText(line, 46, sy);
      sy += 23;
    }

    ctx.strokeStyle = `${ink}22`;
    ctx.beginPath();
    ctx.moveTo(46, H - 72);
    ctx.lineTo(W - 46, H - 72);
    ctx.stroke();

    ctx.fillStyle = muted;
    ctx.font = '500 12px "IBM Plex Mono", ui-monospace, monospace';
    ctx.fillText('F-FORUM NOTEBOOK · TH, THCS & THPT FPT', 46, H - 44);
  }

  let texture: THREE.CanvasTexture | null = null;
  try {
    texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = Math.min(8, Math.max(1, maxAnisotropy));
    texture.needsUpdate = true;
  } catch {
    texture = null;
  }

  let dataUrl = '';
  try {
    dataUrl = canvas.toDataURL('image/png');
  } catch {
    dataUrl = '';
  }

  const record: CachedHonorArtwork = { canvas, dataUrl, texture };
  artworkCache.set(exhibit.id, record);
  return record;
}

export function getHonorPlateDataUrl(exhibit: HonorExhibit): string {
  return createHonorArtwork(exhibit).dataUrl;
}
