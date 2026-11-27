import type * as THREE from './threeSubset';

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

export interface HonorPhotoSpec {
  src: string;
  cropYStart?: number;
  cropYEnd?: number;
  focusY?: number;
}

export interface HonorDossier {
  roleTitle: string;
  focusArea: string;
  cycle: string;
  bio: string;
  coreContribution: string;
  architectureResults: string;
  honors: string;
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
  photo?: HonorPhotoSpec;
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
  dossier: HonorDossier;
  relatedIds: [string, string, string];
}

export const HONOR_EXHIBITS: HonorExhibit[] = [
  {
    id: 'team-core',
    code: '01',
    title: 'Ban Phát Triển F-Forum',
    subtitle: 'Kiến Trúc Giao Diện & Xưởng Lắp Ráp Mở',
    track: 'Thành viên Sáng lập · Cộng đồng F-Forum',
    kicker: 'ĐỘI NGŨ PHÁT TRIỂN · 01',
    milestone: 'Phiên bản 3.0 · 2026',
    motif: 'compass',
    photo: {
      src: '/assets/team/member-1.jpg',
      cropYStart: 0.0,
      cropYEnd: 0.92,
      focusY: 0.22,
    },
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
    dossier: {
      roleTitle: 'Kiến trúc sư trưởng · Giao diện Mở',
      focusArea: 'Nền tảng lõi & Thiết kế hệ thống',
      cycle: 'Khởi tạo v1 → Chuẩn hóa v3',
      bio: 'Tập thể sáng lập và điều phối định hướng sản phẩm F-Forum — xây dựng xưởng lắp ráp web bản địa hóa tiếng Việt dành cho học sinh và sinh viên yêu công nghệ.',
      coreContribution:
        'Khởi xướng và trực tiếp xây dựng F-Forum như một xưởng lắp ráp web mở dành cho học sinh yêu công nghệ. Mọi thao tác từ chọn mẫu giao diện, thử nghiệm trong hộp cát đến xuất bản dự án đều vận hành liền mạch ngay trên trình duyệt.',
      architectureResults:
        'Hợp nhất Bàn soi Khám phá, Workspace chỉnh sửa trực tiếp, Cộng đồng Tri thức và Trình kiểm định 6 lớp vào một kiến trúc thống nhất, giảm tối đa rào cản cài đặt môi trường cho người mới bắt đầu.',
      honors:
        'Ghi nhận công lao đặt nền móng hệ sinh thái mở theo giấy phép MIT và dẫn dắt cộng đồng học sinh, sinh viên giữ vững kỷ luật làm sản phẩm thật.',
    },
    relatedIds: ['team-systems', 'team-ai-robotics', 'mentors-council'],
  },
  {
    id: 'team-systems',
    code: '02',
    title: 'Đội Ngũ Kỹ Thuật & Dữ Liệu',
    subtitle: 'Hạ Tầng Thử Nghiệm & Kiểm Chứng Thực Tế',
    track: 'Thành viên Phát triển · Cộng đồng F-Forum',
    kicker: 'ĐỘI NGŨ PHÁT TRIỂN · 02',
    milestone: '5.909 Mẫu · 195 Khảo sát',
    motif: 'nodes',
    photo: {
      src: '/assets/team/member-2.jpg',
      cropYStart: 0.04,
      cropYEnd: 0.96,
      focusY: 0.3,
    },
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
      { label: 'Thành phần đã kiểm', value: '5.909 UI' },
      { label: 'Công cụ & Repo', value: '60 / 122' },
      { label: 'Kiểm định tự động', value: '6 lớp' },
    ],
    dossier: {
      roleTitle: 'Kỹ sư Hệ thống & Phân tích Dữ liệu',
      focusArea: 'Kho tài nguyên & Khảo sát học đường',
      cycle: 'Thu thập → Chuẩn hóa shard',
      bio: 'Nhóm kỹ sư bảo đảm tính xác thực của toàn bộ kho 5.909 mẫu giao diện, 60 công cụ và 122 kho mã nguồn cùng bộ dữ liệu khảo sát học đường.',
      coreContribution:
        'Phụ trách tổng hợp, phân loại và xác minh tính khả thi của từng mẫu giao diện, bảo đảm mọi tài nguyên hiển thị đều có mã nguồn đối chiếu và câu lệnh sử dụng minh bạch.',
      architectureResults:
        'Tổ chức dữ liệu theo các mảnh nén tải theo nhu cầu, kết hợp trình xem trước cô lập giúp học sinh thử nghiệm trực tiếp mà không phải cấu hình môi trường phức tạp.',
      honors:
        'Vinh danh tinh thần tỉ mỉ của nhóm kỹ thuật dữ liệu và các thành viên câu lạc bộ đã trực tiếp kiểm chứng hiệu năng trên nhiều thiết bị thực tế.',
    },
    relatedIds: ['team-core', 'team-ai-robotics', 'research-195'],
  },
  {
    id: 'team-ai-robotics',
    code: '03',
    title: 'Nghiên Cứu AI & Robotics',
    subtitle: 'Ứng Dụng Tư Duy Kỹ Thuật & Giao Lưu Quốc Tế',
    track: 'Thành viên Nghiên cứu · Cộng đồng F-Forum',
    kicker: 'ĐỘI NGŨ PHÁT TRIỂN · 03',
    milestone: 'AI & Robotics · 2026',
    motif: 'spiral',
    photo: {
      src: '/assets/team/member-3.png',
      cropYStart: 0.24,
      cropYEnd: 0.84,
      focusY: 0.52,
    },
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
      { label: 'Lĩnh vực nghiên cứu', value: 'AI & Robotics' },
      { label: 'Chế độ giao diện', value: 'Eco / Balanced / Fab' },
      { label: 'Định hướng', value: 'Học tập chủ động' },
    ],
    dossier: {
      roleTitle: 'Nghiên cứu AI & Thiết kế Tương tác',
      focusArea: 'Tư duy phản biện & Giáo dục STEM',
      cycle: 'Nghiên cứu → Thử nghiệm mô hình',
      bio: 'Đội ngũ nghiên cứu ứng dụng tư duy kỹ thuật Robotics và mô hình AI vào trải nghiệm học tập chủ động, giúp người học làm chủ nguyên lý thay vì sao chép thụ động.',
      coreContribution:
        'Kết nối tinh thần nghiên cứu AI & Robotics học đường vào trải nghiệm thiết kế web, khuyến khích học sinh hiểu nguyên lý hoạt động bên dưới thay vì sao chép kết quả có sẵn.',
      architectureResults:
        'Đóng góp ý tưởng cho các chế độ hiển thị thích ứng và trải nghiệm tương tác trực quan, giúp người học quan sát trực tiếp cấu trúc mã nguồn song song với kết quả hiển thị.',
      honors:
        'Trân trọng ghi nhận sự đồng hành của gia đình, thầy cô và bạn bè đã tiếp sức cho tinh thần sáng tạo khoa học kỹ thuật qua từng cuộc thi và dự án.',
    },
    relatedIds: ['team-core', 'team-systems', 'anti-slop-engine'],
  },
  {
    id: 'mentors-council',
    code: '04',
    title: 'Hội Đồng Thầy Cô Cố Vấn',
    subtitle: 'Định Hướng Sư Phạm & Khoa Học Kỹ Thuật',
    track: 'Cố vấn Chuyên môn · Cộng đồng F-Forum',
    kicker: 'TRI ÂN CỐ VẤN · 04',
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
    dossier: {
      roleTitle: 'Cố vấn Khoa học & Hướng dẫn Sư phạm',
      focusArea: 'Phương pháp luận & Đạo đức AI',
      cycle: 'Đặt vấn đề → Thẩm định dữ liệu',
      bio: 'Quý thầy cô cố vấn học thuật định hướng phương pháp nghiên cứu khoa học kỹ thuật, chuẩn hóa tiêu chí đánh giá và đạo đức sử dụng AI trong học đường.',
      coreContribution:
        'Định hướng câu hỏi nghiên cứu cốt lõi: làm thế nào để học sinh sử dụng AI như một công cụ nâng cao năng lực thiết kế và tư duy phản biện thay vì sao chép thụ động.',
      architectureResults:
        'Chuẩn hóa khung đánh giá sản phẩm theo tiêu chí minh bạch, yêu cầu mọi mẫu giao diện đều có cấu trúc rõ ràng, mã nguồn đối chiếu và câu lệnh gợi ý cụ thể.',
      honors:
        'Tri ân sâu sắc quý thầy cô đã kiên nhẫn phản biện 6 vòng duyệt từ bố cục câu hỏi khảo sát đến quy trình kiểm thử thực tế trên lớp học.',
    },
    relatedIds: ['research-195', 'team-core', 'system-architecture'],
  },
  {
    id: 'research-195',
    code: '05',
    title: 'Khảo Sát 195 Học Sinh',
    subtitle: 'Dữ Liệu Thực Chứng & Đối Chiếu OECD PISA 2025',
    track: 'Nhóm Nghiên cứu Khoa học · Cộng đồng F-Forum',
    kicker: 'BẰNG CHỨNG THỰC NGHIỆM · 05',
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
    dossier: {
      roleTitle: 'Điều tra viên & Phân tích Số liệu',
      focusArea: 'Khảo sát học đường & Đối chiếu PISA',
      cycle: '195 mẫu → Định lượng thực chứng',
      bio: 'Nhóm nghiên cứu thực nghiệm trực tiếp khảo sát 195 học sinh và đối chiếu với báo cáo OECD PISA 2025 để xác định chính xác điểm nghẽn khi làm web cùng AI.',
      coreContribution:
        'Thực hiện khảo sát nghiêm túc trên 195 học sinh và người dùng thực tế để đo lường khoảng trống giữa việc sử dụng AI đại trà và khả năng tạo ra giao diện web hoàn chỉnh.',
      architectureResults:
        'Kết quả ghi nhận 91,2% người tham gia đánh giá cao mô hình thư viện UI/UX trực quan kết hợp đối chiếu mã nguồn, đồng thời khẳng định nhu cầu cấp thiết về công cụ kiểm tra chất lượng đầu ra.',
      honors:
        'Ghi nhận đóng góp thẳng thắn của 195 bạn học sinh và người dùng thử nghiệm — nền móng dữ liệu xác thực cho mọi quyết định kiến trúc của F-Forum.',
    },
    relatedIds: ['anti-slop-engine', 'ui-vault-7662', 'mentors-council'],
  },
  {
    id: 'system-architecture',
    code: '06',
    title: 'Kiến Trúc Lõi & Đồng Bộ',
    subtitle: 'Cầu Nối API Bảo Mật & Workspace Thời Gian Thực',
    track: 'Nhóm Hạ tầng Kỹ thuật · Core Runtime',
    kicker: 'HẠ TẦNG HỆ THỐNG · 06',
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
    dossier: {
      roleTitle: 'Kỹ sư Backend & Kiến trúc Runtime',
      focusArea: 'Cầu nối API · Diff Engine · ZIP Export',
      cycle: 'Thiết kế Schema → Bảo vệ luồng AI',
      bio: 'Đội ngũ hạ tầng vận hành cầu nối API kiểm soát hạn mức, trình đối chiếu sai khác mã nguồn theo dòng và hộp cát thực thi cô lập.',
      coreContribution:
        'Xây dựng toàn bộ xương sống kỹ thuật gồm cầu nối API kiểm soát hạn mức, trình tính toán sai khác mã nguồn (Diff Engine), quản lý phiên bản snapshot và xuất gói ZIP an toàn.',
      architectureResults:
        'Cho phép xem trước giao diện đa khung hình (390px / 768px / 1440px) trong iframe cô lập hoàn toàn, hỗ trợ cấu hình khóa API cá nhân (BYOK) lưu cục bộ không gửi lên kho lưu trữ công khai.',
      honors:
        'Vinh danh sự kỷ luật của nhóm hạ tầng trong việc bảo đảm tốc độ phản hồi 60fps, tính ổn định và khả năng kiểm chứng từng dòng thay đổi.',
    },
    relatedIds: ['security-shield', 'anti-slop-engine', 'team-core'],
  },
  {
    id: 'anti-slop-engine',
    code: '07',
    title: 'Động Cơ Chống "AI Slop"',
    subtitle: 'Chuẩn Kiểm Định 6 Lớp & Kỷ Luật Thiết Kế',
    track: 'Nhóm Chất lượng Mã & Thẩm mỹ · QA Gate',
    kicker: 'TIÊU CHUẨN CHẤT LƯỢNG · 07',
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
    dossier: {
      roleTitle: 'Kỹ sư QA & Kiểm định A11y',
      focusArea: 'Kiểm định tĩnh · Tương phản · Zero-Slop',
      cycle: 'Định nghĩa 6 lớp → Tự động hóa cổng',
      bio: 'Nhóm kiểm định chất lượng xây dựng bộ quy tắc loại bỏ giao diện rập khuôn AI, bảo đảm độ tương phản WCAG >= 4.5:1 và 0px tràn ngang.',
      coreContribution:
        'Thiết lập bộ quy tắc chống "AI Slop" — loại bỏ văn bản giả, gradient tím-xanh rập khuôn, biểu tượng cảm xúc thay thế icon và mã nguồn thiếu khả năng tiếp cận.',
      architectureResults:
        'Tích hợp trình kiểm tra 6 lớp (cấu trúc HTML, cú pháp JS, bố cục đa màn hình, liên kết nội bộ, rà quét bí mật, khả năng tiếp cận) chạy trực tiếp trước khi người dùng xuất mã.',
      honors:
        'Ghi nhận nhóm kiểm định đã giữ vững kỷ luật "bằng chứng thật", biến tiêu chuẩn kỹ thuật chuyên nghiệp thành phản hồi trực quan cho người học.',
    },
    relatedIds: ['ui-vault-7662', 'system-architecture', 'research-195'],
  },
  {
    id: 'ui-vault-7662',
    code: '08',
    title: 'Kho 5.909 Mẫu Giao Diện',
    subtitle: 'Bản Địa Hóa 5 Thư Viện UI/UX Mở Hàng Đầu',
    track: 'Nhóm Thẩm mỹ & Biên soạn · Design Vault',
    kicker: 'TỦ SÁCH TÀI NGUYÊN · 08',
    milestone: '5.909 UI · 60 Công cụ · 122 Repo',
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
      { label: 'Thành phần UI chuẩn', value: '5.909 mẫu' },
      { label: 'Công cụ & Kho mã', value: '60 tools · 122 repo' },
      { label: 'Thư viện nguồn', value: '5 hệ sinh thái' },
    ],
    dossier: {
      roleTitle: 'Biên soạn Tài nguyên & Chuẩn hóa Shard',
      focusArea: 'PinUI · ThreeUI · lucianLabs · MotionSites · CodeFronts',
      cycle: 'Phân loại → Nén mảnh → Đồng bộ Bàn soi',
      bio: 'Nhóm biên soạn chịu trách nhiệm Việt hóa ngữ cảnh, kiểm chứng mã nguồn và đóng gói 5.909 thành phần từ 5 hệ sinh thái UI/UX mã nguồn mở miễn phí.',
      coreContribution:
        'Phân loại, kiểm tra tính khả thi và Việt hóa ngữ cảnh sử dụng cho 5.909 mẫu giao diện cùng 60 công cụ và 122 kho mã nguồn GitHub tuyển chọn.',
      architectureResults:
        'Đóng gói tài nguyên theo các mảnh dữ liệu nén (.jgz) tải theo nhu cầu, giúp trình duyệt tìm kiếm và xem trước hàng nghìn thành phần mượt mà không phụ thuộc máy chủ ngoài.',
      honors:
        'Tri ân các tác giả mã nguồn mở theo giấy phép MIT và nhóm biên soạn đã kiểm duyệt từng mẫu để bảo đảm tính minh bạch về bản quyền và chất lượng.',
    },
    relatedIds: ['anti-slop-engine', 'research-195', 'security-shield'],
  },
  {
    id: 'security-shield',
    code: '09',
    title: 'Lá Chắn Bảo Mật & Cộng Đồng Mở',
    subtitle: 'Rà Quét Bí Mật, Sandbox Cô Lập & Chia Sẻ Học Thuật',
    track: 'An toàn Hệ thống & Cộng đồng · F-Forum',
    kicker: 'BẢO MẬT & CỘNG ĐỒNG · 09',
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
      { label: 'Cô lập xem trước', value: 'Sandbox an toàn' },
      { label: 'Lưu giữ tri thức', value: 'Học liệu mở' },
    ],
    dossier: {
      roleTitle: 'Chuyên trách Bảo mật & Điều phối Cộng đồng',
      focusArea: 'Secret Scanner · Sandbox · Học liệu Mở',
      cycle: 'Rà soát đầu cuối → Khóa rò rỉ',
      bio: 'Nhóm an toàn hệ thống thiết lập hàng rào kiểm soát rò rỉ khóa bí mật, tách biệt quyền quản trị và bảo vệ môi trường thực hành học thuật lành mạnh.',
      coreContribution:
        'Xây dựng hàng rào bảo vệ đa tầng: trình quét khóa bí mật trước khi đóng gói ZIP, tách biệt khung xem trước khỏi dữ liệu phiên và giữ không gian trao đổi học thuật lành mạnh.',
      architectureResults:
        'Đảm bảo mọi cấu hình khóa API cá nhân chỉ lưu cục bộ trên trình duyệt người dùng, không rò rỉ thông tin nhạy cảm vào lịch sử mã nguồn hay tệp báo cáo.',
      honors:
        'Vinh danh các thành viên phụ trách an toàn hệ thống và cộng đồng câu lạc bộ công nghệ đã luôn đặt sự an tâm của thầy cô và học sinh lên hàng đầu.',
    },
    relatedIds: ['system-architecture', 'anti-slop-engine', 'team-core'],
  },
];

export interface CachedHonorArtwork {
  canvas: HTMLCanvasElement;
  dataUrl: string;
  texture: THREE.CanvasTexture | null;
  loadedPhoto: boolean;
  listeners: Set<() => void>;
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
      ctx.arc(
        Math.cos(Math.PI * 2 * turns) * radius * 0.88,
        Math.sin(Math.PI * 2 * turns) * radius * 0.88,
        7,
        0,
        Math.PI * 2
      );
      ctx.fill();
      break;
    }
  }

  ctx.restore();
}

const wrappedTextCache = new Map<string, string[]>();

function wrapTextLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  cacheKey?: string
): string[] {
  if (cacheKey) {
    const cached = wrappedTextCache.get(cacheKey);
    if (cached) return cached;
  }
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
  if (cacheKey) {
    wrappedTextCache.set(cacheKey, lines);
  }
  return lines;
}

function paintPlateBase(
  ctx: CanvasRenderingContext2D,
  exhibit: HonorExhibit,
  W: number,
  H: number,
  loadedImg?: HTMLImageElement
): void {
  const { bgTop, bgBottom, ink, muted, accent, secondary } = exhibit.palette;
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, bgTop);
  grad.addColorStop(1, bgBottom);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = `${ink}12`;
  ctx.lineWidth = 1;
  for (let x = 44; x < W - 40; x += 80) {
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

  if (exhibit.photo) {
    const boxX = 42;
    const boxY = 98;
    const boxW = W - 84;
    const boxH = 382;

    ctx.save();
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxW, boxH, 10);
    ctx.clip();

    ctx.fillStyle = exhibit.palette.frameTint;
    ctx.fillRect(boxX, boxY, boxW, boxH);

    if (loadedImg && loadedImg.naturalWidth > 0 && loadedImg.naturalHeight > 0) {
      const cropYStart = exhibit.photo.cropYStart ?? 0;
      const cropYEnd = exhibit.photo.cropYEnd ?? 1;
      const srcBaseY = loadedImg.naturalHeight * cropYStart;
      const srcBandH = Math.max(1, loadedImg.naturalHeight * (cropYEnd - cropYStart));
      const srcBandW = loadedImg.naturalWidth;

      const boxRatio = boxW / boxH;
      const bandRatio = srcBandW / srcBandH;

      let sx = 0;
      let sy = srcBaseY;
      let sw = srcBandW;
      let sh = srcBandH;

      if (bandRatio > boxRatio) {
        sw = srcBandH * boxRatio;
        sx = (srcBandW - sw) * 0.5;
      } else {
        sh = srcBandW / boxRatio;
        const focus = exhibit.photo.focusY ?? 0.35;
        sy = srcBaseY + Math.max(0, srcBandH - sh) * focus;
      }

      ctx.drawImage(loadedImg, sx, sy, sw, sh, boxX, boxY, boxW, boxH);
    } else {
      drawMotif(ctx, exhibit, W / 2, boxY + boxH / 2, 110);
    }
    ctx.restore();

    ctx.strokeStyle = `${accent}66`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxW, boxH, 10);
    ctx.stroke();
  } else {
    drawMotif(ctx, exhibit, W / 2, 290, 138);
  }

  ctx.fillStyle = `${ink}12`;
  ctx.font = '600 84px "Cormorant Garamond", Georgia, serif';
  ctx.textAlign = 'right';
  ctx.fillText(exhibit.code, W - 44, 526);
  ctx.textAlign = 'left';

  ctx.fillStyle = secondary;
  ctx.font = '600 13px "Be Vietnam Pro", system-ui, sans-serif';
  ctx.fillText(exhibit.track.toUpperCase(), 46, 514);

  ctx.fillStyle = ink;
  ctx.font = '600 34px "Cormorant Garamond", Georgia, serif';
  const titleLines = wrapTextLines(ctx, exhibit.title, W - 96, `${exhibit.id}:title:${W}`);
  let ty = 558;
  for (const line of titleLines.slice(0, 2)) {
    ctx.fillText(line, 46, ty);
    ty += 40;
  }

  ctx.fillStyle = muted;
  ctx.font = '400 15.5px "Be Vietnam Pro", system-ui, sans-serif';
  const subLines = wrapTextLines(ctx, exhibit.subtitle, W - 96, `${exhibit.id}:sub:${W}`);
  let sy = ty + 6;
  for (const line of subLines.slice(0, 2)) {
    ctx.fillText(line, 46, sy);
    sy += 22;
  }

  ctx.strokeStyle = `${ink}22`;
  ctx.beginPath();
  ctx.moveTo(46, H - 72);
  ctx.lineTo(W - 46, H - 72);
  ctx.stroke();

  ctx.fillStyle = muted;
  ctx.font = '500 12px "IBM Plex Mono", ui-monospace, monospace';
  ctx.fillText('F-FORUM NOTEBOOK · HỌC SINH & SINH VIÊN YÊU CÔNG NGHỆ', 46, H - 44);
}

const ARTWORK_LOGICAL_W = 567;
const ARTWORK_LOGICAL_H = 763;

const pendingPhotoRepaints: Array<() => void> = [];
let photoRepaintScheduled = false;

function scheduleNextPhotoFlush(): void {
  if (photoRepaintScheduled || typeof window === 'undefined') return;
  photoRepaintScheduled = true;
  window.requestAnimationFrame(() => {
    window.setTimeout(flushNextPhotoRepaint, 32);
  });
}

function flushNextPhotoRepaint(): void {
  photoRepaintScheduled = false;
  const next = pendingPhotoRepaints.shift();
  if (next) next();
  if (pendingPhotoRepaints.length > 0) {
    scheduleNextPhotoFlush();
  }
}

function schedulePhotoRepaint(task: () => void): void {
  pendingPhotoRepaints.push(task);
  scheduleNextPhotoFlush();
}

function configureCanvasTexture(
  three: typeof THREE,
  canvas: HTMLCanvasElement,
  maxAnisotropy: number,
  lightweightFilter = false
): THREE.CanvasTexture {
  const tex = new three.CanvasTexture(canvas);
  tex.colorSpace = three.SRGBColorSpace;
  if (lightweightFilter) {
    tex.generateMipmaps = false;
    tex.minFilter = three.LinearFilter;
    tex.magFilter = three.LinearFilter;
    tex.anisotropy = 1;
  } else {
    tex.anisotropy = Math.min(4, Math.max(1, maxAnisotropy));
  }
  tex.needsUpdate = true;
  return tex;
}

export function createHonorArtwork(
  exhibit: HonorExhibit,
  maxAnisotropy = 4,
  onUpdate?: () => void,
  withTexture = true,
  isSoftwareRenderer = false,
  three?: typeof THREE
): CachedHonorArtwork {
  const existing = artworkCache.get(exhibit.id);
  if (existing) {
    if (onUpdate && !existing.loadedPhoto) {
      existing.listeners.add(onUpdate);
    }
    if (withTexture && three && !existing.texture && typeof document !== 'undefined') {
      try {
        existing.texture = configureCanvasTexture(three, existing.canvas, maxAnisotropy, isSoftwareRenderer);
      } catch {
        existing.texture = null;
      }
    }
    return existing;
  }

  const artworkScale = isSoftwareRenderer ? 0.5 : 0.75;
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(ARTWORK_LOGICAL_W * artworkScale);
  canvas.height = Math.round(ARTWORK_LOGICAL_H * artworkScale);
  const ctx = canvas.getContext('2d');

  if (ctx) {
    ctx.setTransform(artworkScale, 0, 0, artworkScale, 0, 0);
    paintPlateBase(ctx, exhibit, ARTWORK_LOGICAL_W, ARTWORK_LOGICAL_H);
  }

  let texture: THREE.CanvasTexture | null = null;
  if (withTexture && three) {
    try {
      texture = configureCanvasTexture(three, canvas, maxAnisotropy, isSoftwareRenderer);
    } catch {
      texture = null;
    }
  }

  const record: CachedHonorArtwork = {
    canvas,
    dataUrl: '',
    texture,
    loadedPhoto: !exhibit.photo,
    listeners: new Set(onUpdate ? [onUpdate] : []),
  };
  artworkCache.set(exhibit.id, record);

  if (exhibit.photo && typeof Image !== 'undefined' && ctx) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.decoding = 'async';
    let settled = false;
    const onDecoded = () => {
      if (settled) return;
      settled = true;
      if (img.naturalWidth <= 0 || img.naturalHeight <= 0) {
        record.loadedPhoto = true;
        record.listeners.clear();
        return;
      }
      schedulePhotoRepaint(() => {
        ctx.setTransform(artworkScale, 0, 0, artworkScale, 0, 0);
        paintPlateBase(ctx, exhibit, ARTWORK_LOGICAL_W, ARTWORK_LOGICAL_H, img);
        record.dataUrl = '';
        if (record.texture) {
          record.texture.needsUpdate = true;
        }
        record.loadedPhoto = true;
        record.listeners.forEach((cb) => cb());
        record.listeners.clear();
      });
    };
    const onFailed = () => {
      if (settled) return;
      settled = true;
      record.loadedPhoto = true;
      record.listeners.clear();
    };
    img.onerror = onFailed;
    if (typeof img.decode === 'function') {
      img.src = exhibit.photo.src;
      img.decode().then(onDecoded, onFailed);
    } else {
      img.onload = onDecoded;
      img.src = exhibit.photo.src;
    }
  }

  return record;
}

export function getHonorPlateDataUrl(exhibit: HonorExhibit, onUpdate?: () => void): string {
  const record = createHonorArtwork(exhibit, 4, onUpdate, false);
  if (!record.dataUrl && typeof document !== 'undefined') {
    try {
      const webp = record.canvas.toDataURL('image/webp', 0.9);
      record.dataUrl = webp.startsWith('data:image/webp')
        ? webp
        : record.canvas.toDataURL('image/png');
    } catch {
      record.dataUrl = '';
    }
  }
  return record.dataUrl;
}

export function disposeHonorArtworkTextures(): void {
  for (const record of artworkCache.values()) {
    if (record.texture) {
      record.texture.dispose();
      record.texture = null;
    }
  }
}
