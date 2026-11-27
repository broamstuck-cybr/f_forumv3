import { fetchVaultShard } from '../features/explore/vaultLoader';
import { apiClient } from '../services/apiClient';
import { bundleAiFilesToSingleHtml } from '../utils/hardenPreviewHtml';
import type { BYOKConfig } from '../types/index';
import type {
  AgentTraceStep,
  BehaviorItemScore,
  BrandPersonality,
  MatchedVaultResource,
  OnboardingDomain,
  OnboardingProfile,
  PageSectionKey,
} from '../types/workspaceV4';
import { auditGeneratedPage, type AestheticAuditReport } from './aestheticGuard';
import {
  BRAND_PALETTES,
  buildCraftStylesheet,
  pickMotionSignature,
  resolveCraftPalette,
  SIGNATURE_MOTIONS,
  VIETNAMESE_GOOGLE_FONTS_LINK,
  type CraftThemeMode,
  type SignatureMotionId,
} from './motionCraftPack';
import { recommendVaultResources } from './mitRecommender';

export type VisualMotif =
  | 'solar'
  | 'history'
  | 'biology'
  | 'robotics'
  | 'workshop'
  | 'concert'
  | 'stem'
  | 'dev'
  | 'minimal-design'
  | 'ceramic'
  | 'noteflow'
  | 'photo'
  | 'three-space'
  | 'devtools'
  | 'scroll-story';

export interface StatEntry {
  value: string;
  label: string;
}

export interface CardEntry {
  tag: string;
  title: string;
  description: string;
}

export interface TimelineEntry {
  time: string;
  title: string;
  detail: string;
}

export interface FlashcardEntry {
  tag: string;
  front: string;
  back: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface PricingTier {
  name: string;
  monthly: string;
  yearly: string;
  note: string;
  features: string[];
  featured?: boolean;
}

export interface TeamEntry {
  initials: string;
  name: string;
  role: string;
}

export interface ComposerBlueprint {
  profile: OnboardingProfile;
  themeMode: CraftThemeMode;
  accentKey?: string;
  signature: SignatureMotionId;
  visualMotif: VisualMotif;
  eyebrow: string;
  heroTitle: string;
  heroAccentWord?: string;
  heroSubtitle: string;
  primaryCta: string;
  secondaryCta: string;
  includeCountdown: boolean;
  countdownTitle: string;
  countdownDaysAhead: number;
  compactCopy: boolean;
  variationIndex: number;
  stats: StatEntry[];
  cards: CardEntry[];
  timeline: TimelineEntry[];
  flashcards: FlashcardEntry[];
  quiz: QuizQuestion[];
  pricing: PricingTier[];
  team: TeamEntry[];
  registerHeading: string;
  registerLead: string;
  registerCta: string;
  footerNote: string;
  sourceRefs: MatchedVaultResource[];
  customHighlights: string[];
}

export interface ComposeResult {
  html: string;
  blueprint: ComposerBlueprint;
  matchedResources: MatchedVaultResource[];
  motionSignature: string;
  trace: AgentTraceStep[];
  audit: AestheticAuditReport;
  summaryText: string;
  diff: { added: number; removed: number };
  durationMs: number;
  usedLiveAi: boolean;
}

function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function foldVi(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');
}

export function computeHtmlLineDiff(
  prevHtml: string | null,
  nextHtml: string
): { added: number; removed: number } {
  const nextLines = nextHtml.split('\n');
  if (!prevHtml) {
    return { added: nextLines.length, removed: 0 };
  }
  const prevLines = prevHtml.split('\n');
  const prevCounts = new Map<string, number>();
  for (const line of prevLines) {
    const k = line.trim();
    if (!k) continue;
    prevCounts.set(k, (prevCounts.get(k) ?? 0) + 1);
  }
  let added = 0;
  for (const line of nextLines) {
    const k = line.trim();
    if (!k) continue;
    const rem = prevCounts.get(k) ?? 0;
    if (rem > 0) {
      prevCounts.set(k, rem - 1);
    } else {
      added += 1;
    }
  }
  let removed = 0;
  for (const count of prevCounts.values()) {
    removed += count;
  }
  return { added: Math.max(1, added), removed };
}

function detectMotif(profile: OnboardingProfile, prompt: string): VisualMotif {
  const q = foldVi(`${profile.siteName} ${prompt}`);
  if (/nang luong|mat troi|solar|xanh|moi truong/.test(q)) return 'solar';
  if (/dien bien|lich su|chien dich|di tich/.test(q)) return 'history';
  if (/sinh hoc|te bao|adn|di truyen|on tap/.test(q)) return 'biology';
  if (/robot|robotics|cam bien|mach dien/.test(q)) return 'robotics';
  if (/workshop|hoi thao|thiet ke & ai|buoi hoc/.test(q)) return 'workshop';
  if (/dem nhac|hoa nhac|am nhac|ca nhac|concert/.test(q)) return 'concert';
  if (/hoc bong|stem|nghien cuu khoa hoc/.test(q)) return 'stem';
  if (/cong nghe thong tin|cntt|lap trinh vien|software/.test(q)) return 'dev';
  if (/gom|thu cong|moc|tra|cafe|banh/.test(q)) return 'ceramic';
  if (/noteflow|ghi chu|ung dung|app/.test(q)) return 'noteflow';
  if (/nhiep anh|chup anh|studio anh|photo/.test(q)) return 'photo';
  if (/khong gian 3d|threeui|trien lam 3d|webgl/.test(q)) return 'three-space';
  if (/cong cu lap trinh|cli|api|devtool/.test(q)) return 'devtools';
  if (/cuon muot|motion craft|ke chuyen/.test(q)) return 'scroll-story';
  if (profile.domain === 'education') return 'solar';
  if (profile.domain === 'event') return 'workshop';
  if (profile.domain === 'portfolio') return 'minimal-design';
  if (profile.domain === 'business') return 'noteflow';
  return 'three-space';
}

function buildDomainDefaults(
  profile: OnboardingProfile,
  prompt: string,
  motif: VisualMotif
): Omit<
  ComposerBlueprint,
  'profile' | 'themeMode' | 'signature' | 'visualMotif' | 'variationIndex' | 'sourceRefs'
> {
  const cleanTitle = profile.siteName.trim() || 'Trang Web Mới';

  const byDomain: Record<
    OnboardingDomain,
    {
      eyebrow: string;
      subtitle: string;
      primaryCta: string;
      secondaryCta: string;
      stats: StatEntry[];
      cards: CardEntry[];
      timeline: TimelineEntry[];
      flashcards: FlashcardEntry[];
      quiz: QuizQuestion[];
      pricing: PricingTier[];
      team: TeamEntry[];
      registerHeading: string;
      registerLead: string;
      registerCta: string;
    }
  > = {
    education: {
      eyebrow: 'Chuyên đề học tập & Trình bày',
      subtitle:
        'Hệ thống hóa dữ kiện cốt lõi, dẫn chứng trực quan và phần kiểm tra nhanh ngay trên một trang dễ đọc.',
      primaryCta: 'Xem nội dung chính',
      secondaryCta: 'Làm câu hỏi nhanh',
      stats: [
        { value: '4 phần', label: 'Mạch trình bày từ bối cảnh tới kết luận' },
        { value: '12 phút', label: 'Thời lượng thuyết trình chuẩn trên lớp' },
        { value: '6 thẻ', label: 'Ý trọng tâm có thể lật ôn lại ngay' },
        { value: '100%', label: 'Mở trực tiếp trên máy chiếu và điện thoại' },
      ],
      cards: [
        {
          tag: 'Phần 01',
          title: 'Đặt vấn đề từ số liệu thực tế',
          description:
            'Trình bày nguyên nhân gốc và phạm vi khảo sát ngắn gọn để người nghe nắm bối cảnh trong 90 giây đầu.',
        },
        {
          tag: 'Phần 02',
          title: 'Phân tích mô hình & so sánh',
          description:
            'Đối chiếu phương án hiện tại với hướng cải tiến bằng bảng tiêu chí rõ ràng, tránh chữ dày đặc.',
        },
        {
          tag: 'Phần 03',
          title: 'Đề xuất triển khai thực nghiệm',
          description:
            'Nêu các bước thử nghiệm quy mô nhỏ tại trường học, chi phí dự kiến và cách đo kết quả theo tuần.',
        },
      ],
      timeline: [
        { time: 'Tuần 01', title: 'Thu thập tài liệu & khảo sát', detail: 'Tổng hợp nguồn sách giáo khoa, bài báo khoa học và phiếu hỏi 80 học sinh.' },
        { time: 'Tuần 02', title: 'Lập dàn ý & đối chiếu số liệu', detail: 'Kiểm tra lại đơn vị đo, biểu đồ tỷ lệ và loại bỏ các ý trùng lặp.' },
        { time: 'Tuần 03', title: 'Dựng mô hình minh họa & tập thuyết trình', detail: 'Chạy thử trang web trên máy chiếu lớp và canh đúng mốc 12 phút.' },
      ],
      flashcards: [
        { tag: 'Khái niệm 01', front: 'Mục tiêu chính của phần mở đầu trong bài báo cáo là gì?', back: 'Nêu rõ câu hỏi trung tâm và lý do chủ đề đáng quan tâm chỉ trong 2–3 câu.' },
        { tag: 'Khái niệm 02', front: 'Vì sao nên tách số liệu thành khối riêng thay vì viết liền đoạn?', back: 'Giúp người xem trên máy chiếu quét nhanh con số chính mà không bị rối mắt.' },
        { tag: 'Khái niệm 03', front: 'Cách chốt bài thuyết trình để giáo viên nhớ lâu?', back: 'Tóm tắt lại 1 kết quả đo được và 1 hành động cụ thể có thể áp dụng ngay.' },
      ],
      quiz: [
        {
          question: 'Mỗi khung nhìn trên trang trình chiếu nên tập trung vào bao nhiêu ý chính?',
          options: ['1 ý chính rõ ràng kèm dẫn chứng ngắn', '5 đến 6 đoạn văn đầy màn hình', 'Chỉ đặt tiêu đề mà không có ví dụ'],
          correctIndex: 0,
          explanation: 'Một ý trọng tâm trên mỗi màn hình giúp người nghe theo kịp lời thuyết trình.',
        },
        {
          question: 'Khi trình bày dữ kiện lịch sử hoặc khoa học, yếu tố nào cần ưu tiên nhất?',
          options: ['Mốc thời gian và nguồn đối chiếu rõ ràng', 'Hiệu ứng bay nhảy liên tục', 'Dùng nhiều phông chữ khác nhau'],
          correctIndex: 0,
          explanation: 'Số liệu chính xác và mốc rõ ràng tạo độ tin cậy cho toàn bộ bài báo cáo.',
        },
      ],
      pricing: [
        {
          name: 'Nhóm tự học',
          monthly: 'Miễn phí',
          yearly: 'Miễn phí',
          note: 'Dành cho nhóm 2–4 bạn chuẩn bị bài thuyết trình',
          features: ['Đầy đủ phần trình bày & thẻ lật', 'Tải tệp HTML mở ngoại tuyến', 'Không cần đăng ký tài khoản'],
        },
        {
          name: 'Lớp học chia sẻ',
          monthly: '0đ',
          yearly: '0đ',
          note: 'Xuất bản liên kết để cả lớp xem trên điện thoại',
          features: ['Liên kết rút gọn dễ gửi nhóm lớp', 'Tương thích màn hình máy chiếu 16:9', 'Cho phép bạn học nhân bản để tự ôn'],
          featured: true,
        },
      ],
      team: [
        { initials: 'MA', name: 'Nguyễn Minh Anh', role: 'Nội dung & Dẫn chứng' },
        { initials: 'QH', name: 'Trần Quang Huy', role: 'Số liệu & Biểu đồ' },
        { initials: 'TL', name: 'Phạm Thảo Linh', role: 'Thiết kế & Thuyết trình' },
      ],
      registerHeading: 'Gửi câu hỏi thảo luận',
      registerLead: 'Thầy cô hoặc các bạn trong lớp có thể để lại câu hỏi phản biện cho nhóm ngay dưới đây.',
      registerCta: 'Gửi câu hỏi',
    },
    event: {
      eyebrow: 'Sự kiện & Câu lạc bộ',
      subtitle:
        'Lịch trình rõ từng khung giờ, thông tin diễn giả và biểu mẫu giữ chỗ nhanh trong 30 giây.',
      primaryCta: 'Đăng ký tham gia',
      secondaryCta: 'Xem lịch trình',
      stats: [
        { value: '180 chỗ', label: 'Sức chứa hội trường đã xác nhận' },
        { value: '04 phiên', label: 'Thực hành trực tiếp & giao lưu hỏi đáp' },
        { value: '14:00', label: 'Giờ đón khách & check-in tại sảnh A' },
        { value: 'Miễn phí', label: 'Mở cửa cho học sinh, sinh viên đăng ký trước' },
      ],
      cards: [
        {
          tag: 'Hoạt động 01',
          title: 'Thực hành cầm tay chỉ việc',
          description: 'Mỗi bàn có 1 mentor hướng dẫn trực tiếp từ khâu lên ý tưởng đến sản phẩm chạy thử.',
        },
        {
          tag: 'Hoạt động 02',
          title: 'Trưng bày sản phẩm theo nhóm',
          description: 'Các đội có 5 phút chạy demo thực tế trên sân khấu và nhận góp ý trực diện từ ban cố vấn.',
        },
        {
          tag: 'Hoạt động 03',
          title: 'Kết nối thành viên khóa mới',
          description: 'Phiên hỏi đáp mở giữa cựu thành viên và tân binh về lộ trình sinh hoạt cả học kỳ.',
        },
      ],
      timeline: [
        { time: '14:00 – 14:30', title: 'Đón khách & phát thẻ tên', detail: 'Check-in nhanh tại sảnh A, nhận tài liệu và chia bàn theo chủ đề quan tâm.' },
        { time: '14:30 – 16:00', title: 'Phiên chính & thực hành nhóm', detail: 'Hoàn thiện bài mẫu trực tiếp với bộ công cụ chuẩn bị sẵn trên máy tính.' },
        { time: '16:15 – 17:30', title: 'Trình diễn, hỏi đáp & tổng kết', detail: 'Các nhóm chia sẻ kết quả, trao quà kỷ niệm và chụp ảnh lưu niệm.' },
      ],
      flashcards: [
        { tag: 'Chuẩn bị 01', front: 'Cần mang theo gì khi tham gia buổi sinh hoạt?', back: 'Chỉ cần máy tính cá nhân sạc đầy pin và tinh thần sẵn sàng thử làm cùng nhóm.' },
        { tag: 'Chuẩn bị 02', front: 'Người chưa có nền tảng có theo kịp không?', back: 'Có. Tài liệu được chia từ mức cơ bản và luôn có thành viên khóa trên hỗ trợ.' },
        { tag: 'Chuẩn bị 03', front: 'Địa điểm tổ chức ở đâu?', back: 'Hội trường tầng 2, Khu nhà B — có biển chỉ dẫn từ cổng chính.' },
      ],
      quiz: [
        {
          question: 'Khung giờ check-in đón khách bắt đầu lúc mấy giờ?',
          options: ['14:00 tại sảnh A', '16:30 sau phiên thực hành', '08:00 sáng hôm sau'],
          correctIndex: 0,
          explanation: 'Ban tổ chức mở bàn check-in từ 14:00 để kịp chia nhóm trước 14:30.',
        },
      ],
      pricing: [
        {
          name: 'Vé tham dự chuẩn',
          monthly: 'Miễn phí',
          yearly: 'Miễn phí',
          note: 'Dành cho học sinh, sinh viên đăng ký trước',
          features: ['Tham dự trọn vẹn 3 phiên', 'Bộ tài liệu thực hành PDF', 'Giấy xác nhận tham gia CLB'],
          featured: true,
        },
        {
          name: 'Gói nhóm 4 bạn',
          monthly: 'Ưu tiên bàn',
          yearly: 'Ưu tiên bàn',
          note: 'Đăng ký chung theo lớp để ngồi cùng khu vực',
          features: ['Xếp chỗ ngồi liền kề theo đội', 'Cố vấn riêng hỗ trợ bài thực hành', 'Ưu tiên suất trình diễn sân khấu'],
        },
      ],
      team: [
        { initials: 'ĐK', name: 'Lê Đăng Khoa', role: 'Chủ nhiệm CLB' },
        { initials: 'NH', name: 'Vũ Ngọc Hân', role: 'Điều phối chương trình' },
        { initials: 'MT', name: 'Đỗ Minh Trí', role: 'Phụ trách kỹ thuật' },
      ],
      registerHeading: 'Giữ chỗ tham dự',
      registerLead: 'Điền thông tin ngắn để ban tổ chức gửi xác nhận và bản đồ phòng hội thảo.',
      registerCta: 'Xác nhận giữ chỗ',
    },
    portfolio: {
      eyebrow: 'Hồ sơ năng lực cá nhân',
      subtitle:
        'Tuyển chọn các dự án đã hoàn thiện, vai trò cụ thể và cách liên hệ trực tiếp cho công việc hoặc học bổng.',
      primaryCta: 'Xem dự án tiêu biểu',
      secondaryCta: 'Liên hệ trao đổi',
      stats: [
        { value: '08 dự án', label: 'Đã triển khai thực tế và công khai mã' },
        { value: '03 năm', label: 'Tập trung vào sản phẩm web và hệ thống' },
        { value: '98/100', label: 'Điểm tốc độ tải trang trên thiết bị di động' },
        { value: '24 giờ', label: 'Thời gian phản hồi email và lịch hẹn' },
      ],
      cards: [
        {
          tag: 'Dự án 01',
          title: 'Ứng dụng theo dõi lịch học nhóm',
          description: 'Thiết kế giao diện và xây dựng đồng bộ lịch làm bài cho 120 bạn trong câu lạc bộ.',
        },
        {
          tag: 'Dự án 02',
          title: 'Hệ thống thư viện đề ôn tập',
          description: 'Chuẩn hóa cấu trúc tìm kiếm theo môn học, rút thời gian tra cứu từ 3 phút xuống 15 giây.',
        },
        {
          tag: 'Dự án 03',
          title: 'Bộ nhận diện sự kiện thường niên',
          description: 'Thiết kế trang thông tin, vé điện tử và bộ ấn phẩm đồng nhất trên web lẫn bản in.',
        },
      ],
      timeline: [
        { time: '2025 – 2026', title: 'Trưởng nhóm thiết kế & phát triển sản phẩm', detail: 'Dẫn dắt 5 thành viên hoàn thiện 3 dự án cộng đồng đạt giải cấp thành phố.' },
        { time: '2024 – 2025', title: 'Cộng tác viên giao diện web', detail: 'Xây dựng trang giới thiệu cho các CLB trường học, tập trung độ rõ chữ và tốc độ.' },
        { time: '2023 – 2024', title: 'Khởi đầu tự học HTML, CSS & TypeScript', detail: 'Hoàn thành 15 bài tập thực hành độc lập và ghi chép lại thành tài liệu chia sẻ.' },
      ],
      flashcards: [
        { tag: 'Kỹ năng 01', front: 'Thế mạnh chính khi tham gia nhóm dự án?', back: 'Biến yêu cầu mơ hồ thành bản dựng chạy được sớm để cả nhóm kiểm chứng.' },
        { tag: 'Kỹ năng 02', front: 'Bộ công cụ làm việc hằng ngày?', back: 'TypeScript, React, CSS chuẩn thiết kế, Figma và Git.' },
      ],
      quiz: [
        {
          question: 'Yếu tố nào luôn được ưu tiên trước khi bàn giao một trang web?',
          options: ['Hiển thị rõ trên điện thoại và bấm được mọi nút', 'Thêm thật nhiều hiệu ứng nặng', 'Chỉ kiểm tra trên màn hình lớn'],
          correctIndex: 0,
          explanation: 'Độ ổn định trên màn hình nhỏ và trải nghiệm thực tế luôn quan trọng hơn hiệu ứng phô trương.',
        },
      ],
      pricing: [
        {
          name: 'Tư vấn & rà soát giao diện',
          monthly: 'Theo buổi',
          yearly: 'Theo gói',
          note: 'Góp ý bố cục, độ tương phản và tốc độ tải',
          features: ['Báo cáo chi tiết từng màn hình', 'Danh sách lỗi ưu tiên cần sửa trước', 'Buổi trao đổi 45 phút trực tuyến'],
        },
        {
          name: 'Thiết kế & dựng trang trọn gói',
          monthly: 'Theo dự án',
          yearly: 'Theo quý',
          note: 'Từ cấu trúc nội dung tới mã nguồn sạch',
          features: ['Thiết kế riêng theo nhận diện', 'Tương thích di động 390px – 1440px', 'Bàn giao mã nguồn dễ tự cập nhật'],
          featured: true,
        },
      ],
      team: [
        { initials: 'NL', name: 'Nguyễn Hải Lam', role: 'Thiết kế & Lập trình' },
        { initials: 'BT', name: 'Bùi Thanh Tùng', role: 'Cố vấn chuyên môn' },
      ],
      registerHeading: 'Trao đổi dự án hoặc học bổng',
      registerLead: 'Gửi ngắn gọn nội dung cần trao đổi, tôi sẽ phản hồi trong vòng 24 giờ.',
      registerCta: 'Gửi lời nhắn',
    },
    business: {
      eyebrow: 'Sản phẩm & Dịch vụ',
      subtitle:
        'Thông tin rõ ràng về sản phẩm, bảng giá minh bạch và kênh đặt lịch tư vấn trực tiếp không qua trung gian.',
      primaryCta: 'Xem sản phẩm',
      secondaryCta: 'Đặt lịch tư vấn',
      stats: [
        { value: '450+', label: 'Đơn hàng hoàn thiện trong 12 tháng qua' },
        { value: '4.9 / 5', label: 'Đánh giá trung thực từ khách đã mua' },
        { value: '48 giờ', label: 'Giao hàng nội thành & kiểm tra trước khi nhận' },
        { value: '12 tháng', label: 'Bảo hành và hỗ trợ đổi mới rõ điều kiện' },
      ],
      cards: [
        {
          tag: 'Dòng chính',
          title: 'Phiên bản tiêu chuẩn dùng hằng ngày',
          description: 'Cân bằng giữa độ bền vật liệu, thao tác gọn nhẹ và chi phí hợp lý cho nhu cầu thực tế.',
        },
        {
          tag: 'Đặt riêng',
          title: 'Tùy chỉnh theo kích thước & màu sắc',
          description: 'Nhận làm theo yêu cầu nhóm, quà tặng doanh nghiệp hoặc không gian riêng trong 5–7 ngày.',
        },
        {
          tag: 'Hậu mãi',
          title: 'Hướng dẫn sử dụng & chăm sóc định kỳ',
          description: 'Kèm tài liệu bảo quản rõ ràng và hỗ trợ kỹ thuật trực tiếp qua tin nhắn.',
        },
      ],
      timeline: [
        { time: 'Bước 01', title: 'Chọn mẫu & trao đổi nhu cầu', detail: 'Gửi yêu cầu cơ bản về số lượng, kích thước và thời gian mong muốn.' },
        { time: 'Bước 02', title: 'Chốt mẫu thử & báo giá cố định', detail: 'Xác nhận rõ tổng chi phí trước khi thực hiện, không phát sinh phụ phí ẩn.' },
        { time: 'Bước 03', title: 'Hoàn thiện, kiểm tra & giao tận tay', detail: 'Chụp ảnh thực tế sản phẩm trước khi đóng gói và bàn giao.' },
      ],
      flashcards: [
        { tag: 'Câu hỏi 01', front: 'Có được xem ảnh thật trước khi giao không?', back: 'Có. Mỗi đơn hàng đều được chụp ảnh kiểm tra dưới ánh sáng tự nhiên trước khi gửi.' },
        { tag: 'Câu hỏi 02', front: 'Chính sách đổi trả áp dụng như thế nào?', back: 'Đổi mới trong 7 ngày nếu sản phẩm có lỗi hoàn thiện hoặc nứt vỡ khi vận chuyển.' },
      ],
      quiz: [
        {
          question: 'Thời gian giao hàng tiêu chuẩn nội thành là bao lâu?',
          options: ['Trong vòng 48 giờ kể từ khi xác nhận', 'Từ 3 đến 4 tuần', 'Không hỗ trợ giao tận nơi'],
          correctIndex: 0,
          explanation: 'Các sản phẩm có sẵn được đóng gói cẩn thận và giao trong 48 giờ.',
        },
      ],
      pricing: [
        {
          name: 'Gói Cơ bản',
          monthly: '290.000đ',
          yearly: '240.000đ',
          note: 'Phù hợp khách trải nghiệm lần đầu',
          features: ['Sản phẩm hoàn thiện tiêu chuẩn', 'Hộp bảo vệ chống sốc khi giao', 'Hỗ trợ đổi trả trong 7 ngày'],
        },
        {
          name: 'Gói Chuyên sâu',
          monthly: '650.000đ',
          yearly: '540.000đ',
          note: 'Được chọn nhiều nhất cho quà tặng & nhóm',
          features: ['Tùy chỉnh chi tiết theo yêu cầu', 'Ưu tiên hoàn thiện trong 72 giờ', 'Bảo hành và chăm sóc 12 tháng'],
          featured: true,
        },
      ],
      team: [
        { initials: 'TH', name: 'Trần Thu Hà', role: 'Phụ trách sản phẩm' },
        { initials: 'VN', name: 'Võ Hoàng Nam', role: 'Kiểm định & Giao nhận' },
      ],
      registerHeading: 'Đặt lịch tư vấn & nhận báo giá',
      registerLead: 'Để lại số điện thoại hoặc email kèm nhu cầu ngắn gọn, chúng tôi phản hồi trong giờ làm việc.',
      registerCta: 'Gửi yêu cầu báo giá',
    },
    tech: {
      eyebrow: 'Sản phẩm Công nghệ & Tương tác',
      subtitle:
        'Kiến trúc gọn, tải nhanh dưới 1 giây, hỗ trợ tương tác trực tiếp bằng canvas nhẹ và mã nguồn sạch.',
      primaryCta: 'Trải nghiệm ngay',
      secondaryCta: 'Xem thông số',
      stats: [
        { value: '< 120ms', label: 'Độ trễ phản hồi thao tác giao diện' },
        { value: '60 fps', label: 'Mượt trên trình duyệt desktop & di động' },
        { value: '0 thư viện nặng', label: 'Chạy độc lập chỉ với 1 tệp HTML sạch' },
        { value: 'AA 4.5+', label: 'Độ tương phản văn bản được kiểm định' },
      ],
      cards: [
        {
          tag: 'Kiến trúc',
          title: 'Tách rõ dữ liệu, giao diện và chuyển động',
          description: 'Mỗi khối thành phần dùng chung hệ biến CSS token, dễ bảo trì và đổi tông màu tức thì.',
        },
        {
          tag: 'Tương tác',
          title: 'Không gian thị giác phản hồi con trỏ',
          description: 'Khung canvas hình học nhẹ tự động giảm tải khi bật chế độ tiết kiệm chuyển động.',
        },
        {
          tag: 'Triển khai',
          title: 'Xuất gói tĩnh chạy mọi máy chủ',
          description: 'Tải về một tệp duy nhất hoặc chia sẻ qua liên kết công khai mà không cần cài môi trường.',
        },
      ],
      timeline: [
        { time: 'v1.0', title: 'Nền tảng token & bố cục đáp ứng', detail: 'Chuẩn hóa lưới 390px, 768px và 1440px cùng tương phản chữ AA.' },
        { time: 'v1.5', title: 'Bổ sung mô-đun tương tác trực tiếp', detail: 'Tích hợp canvas 3D wireframe nhẹ, bộ lọc nhanh và trạng thái tải rõ ràng.' },
        { time: 'v2.0', title: 'Tối ưu xuất bản & nhân bản', detail: 'Cho phép chia sẻ tức thì qua liên kết riêng và chỉnh tiếp bằng hội thoại.' },
      ],
      flashcards: [
        { tag: 'Kỹ thuật 01', front: 'Vì sao dùng overflow-x: clip thay vì hidden?', back: 'Ngăn tràn ngang trên điện thoại mà vẫn giữ position: sticky hoạt động đúng.' },
        { tag: 'Kỹ thuật 02', front: 'Cách chống chớp nền trắng khi tải trang tối?', back: 'Đặt màu nền cho html, body ngay quy tắc CSS đầu tiên trong thẻ head.' },
      ],
      quiz: [
        {
          question: 'Thuộc tính CSS nào giúp tôn trọng người dùng nhạy cảm với chuyển động?',
          options: ['@media (prefers-reduced-motion: reduce)', 'animation-iteration-count: infinite', 'will-change: all'],
          correctIndex: 0,
          explanation: 'Media query prefers-reduced-motion đảm bảo mọi hiệu ứng đều có nhánh tĩnh an toàn.',
        },
      ],
      pricing: [
        {
          name: 'Mã nguồn mở',
          monthly: '0đ',
          yearly: '0đ',
          note: 'Dùng thoải mái cho dự án cá nhân & học tập',
          features: ['Toàn bộ tệp HTML/CSS/JS sạch', 'Không khóa bản quyền, tự host tự do', 'Hỗ trợ chế độ tối & sáng sẵn'],
          featured: true,
        },
        {
          name: 'Nhóm triển khai',
          monthly: '190.000đ',
          yearly: '150.000đ',
          note: 'Dành cho đội cần nhiều bản dựng song song',
          features: ['Quản lý nhiều phiên bản xuất bản', 'Kiểm định tự động trước khi chia sẻ', 'Hỗ trợ tích hợp tên miền riêng'],
        },
      ],
      team: [
        { initials: 'PM', name: 'Phạm Nhật Minh', role: 'Kiến trúc Frontend' },
        { initials: 'LT', name: 'Lê Gia Thịnh', role: 'Đồ họa Web & Motion' },
      ],
      registerHeading: 'Nhận bản cập nhật kỹ thuật',
      registerLead: 'Để lại email để nhận thông báo khi có mẫu thành phần và bản phát hành mới.',
      registerCta: 'Đăng ký nhận tin',
    },
  };

  const d = byDomain[profile.domain];
  const promptTrim = prompt.trim();
  const customSub =
    promptTrim.length > 24 && promptTrim.length < 180
      ? `${promptTrim.replace(/[.!?]+$/, '')}. ${d.subtitle}`
      : d.subtitle;

  return {
    eyebrow: d.eyebrow,
    heroTitle: cleanTitle,
    heroSubtitle: customSub,
    primaryCta: d.primaryCta,
    secondaryCta: d.secondaryCta,
    includeCountdown:
      profile.domain === 'event' || /dem nguoc|countdown|su kien|workshop|dem nhac/.test(foldVi(prompt)),
    countdownTitle: 'Thời gian tới mốc khai mạc',
    countdownDaysAhead: motif === 'concert' ? 14 : 9,
    compactCopy: false,
    stats: d.stats,
    cards: d.cards,
    timeline: d.timeline,
    flashcards: d.flashcards,
    quiz: d.quiz,
    pricing: d.pricing,
    team: d.team,
    registerHeading: d.registerHeading,
    registerLead: d.registerLead,
    registerCta: d.registerCta,
    footerNote: `Dựng trên F-Forum Workspace · ${cleanTitle}`,
    customHighlights: [],
  };
}

function renderVisualIllustration(motif: VisualMotif, title: string): string {
  if (motif === 'three-space' || motif === 'robotics' || motif === 'devtools') {
    const label =
      motif === 'robotics'
        ? 'Mô phỏng quỹ đạo cảm biến trực tiếp'
        : motif === 'devtools'
          ? 'Đồ thị phụ thuộc mô-đun thời gian thực'
          : 'Khung lưới không gian 3D tương tác chuột';
    return `<div class="hero__visual craft-surface" aria-label="${escapeHtml(title)}">
  <canvas id="craft-stage-canvas" width="520" height="360" data-motif="${motif}" style="width:100%;height:300px;background:var(--surface-high);border:1px solid var(--line);border-radius:14px;"></canvas>
  <div style="display:flex;justify-content:space-between;align-items:center;margin-top:12px;font-family:var(--font-mono);font-size:0.75rem;color:var(--muted);">
    <span>${escapeHtml(label)}</span>
    <span id="stage-fps">60 FPS</span>
  </div>
</div>`;
  }

  const shapes: Record<VisualMotif, string> = {
    solar: `
      <rect x="24" y="24" width="472" height="292" rx="18" fill="var(--surface-high)" stroke="var(--line)" />
      <circle cx="388" cy="108" r="56" fill="var(--accent-soft)" stroke="var(--accent)" stroke-width="1.5" />
      <circle cx="388" cy="108" r="26" fill="var(--accent)" opacity="0.88" />
      <g stroke="var(--line-strong)" stroke-width="1.2">
        <path d="M56 266 L196 172 L352 172 L248 266 Z" fill="var(--accent-soft)" stroke="var(--accent)" />
        <line x1="126" y1="219" x2="298" y2="219" />
        <line x1="156" y1="266" x2="274" y2="172" />
        <line x1="204" y1="266" x2="314" y2="172" />
      </g>
      <path d="M56 122 C110 122, 132 76, 188 76 C236 76, 256 112, 304 112" fill="none" stroke="var(--secondary)" stroke-width="2" stroke-dasharray="5 5" />
      <text x="56" y="72" fill="var(--muted)" font-size="12" font-family="IBM Plex Mono, monospace">HIỆU SUẤT PIN QUANG ĐIỆN · +24.8%</text>
      <text x="56" y="294" fill="var(--faint)" font-size="11" font-family="IBM Plex Mono, monospace">MÔ HÌNH ĐO LƯỜNG NĂNG LƯỢNG XANH 2026</text>`,
    history: `
      <rect x="24" y="24" width="472" height="292" rx="18" fill="var(--surface-high)" stroke="var(--line)" />
      <path d="M54 248 Q154 170 250 198 T456 114" fill="none" stroke="var(--accent)" stroke-width="2.4" />
      <path d="M54 270 Q168 214 274 230 T456 156" fill="none" stroke="var(--line-strong)" stroke-width="1.2" stroke-dasharray="4 4" />
      <circle cx="116" cy="212" r="7" fill="var(--accent)" />
      <circle cx="250" cy="198" r="7" fill="var(--accent)" />
      <circle cx="384" cy="144" r="9" fill="var(--accent)" stroke="var(--bg)" stroke-width="3" />
      <text x="54" y="72" fill="var(--muted)" font-size="12" font-family="IBM Plex Mono, monospace">56 NGÀY ĐÊM · 13/03 – 07/05/1954</text>
      <text x="98" y="236" fill="var(--fg)" font-size="11" font-family="Be Vietnam Pro, sans-serif">Đợt 1: Him Lam</text>
      <text x="220" y="182" fill="var(--fg)" font-size="11" font-family="Be Vietnam Pro, sans-serif">Đợt 2: Đồi A1</text>
      <text x="342" y="122" fill="var(--accent)" font-size="11" font-family="Be Vietnam Pro, sans-serif">Đợt 3: Toàn thắng</text>`,
    biology: `
      <rect x="24" y="24" width="472" height="292" rx="18" fill="var(--surface-high)" stroke="var(--line)" />
      <path d="M84 114 C154 114, 154 226, 224 226 C294 226, 294 114, 364 114 C404 114, 424 148, 444 170" fill="none" stroke="var(--accent)" stroke-width="2.6" />
      <path d="M84 226 C154 226, 154 114, 224 114 C294 114, 294 226, 364 226 C404 226, 424 192, 444 170" fill="none" stroke="var(--secondary)" stroke-width="2.6" />
      <g stroke="var(--line-strong)" stroke-width="1.5">
        <line x1="118" y1="126" x2="118" y2="214" />
        <line x1="188" y1="146" x2="188" y2="194" />
        <line x1="258" y1="146" x2="258" y2="194" />
        <line x1="328" y1="126" x2="328" y2="214" />
      </g>
      <text x="56" y="70" fill="var(--muted)" font-size="12" font-family="IBM Plex Mono, monospace">CẤU TRÚC XOẮN KÉP ADN · A–T / G–X</text>
      <text x="56" y="286" fill="var(--faint)" font-size="11" font-family="IBM Plex Mono, monospace">NHẤN THẺ ÔN TẬP BÊN DƯỚI ĐỂ KIỂM TRA NHANH</text>`,
    workshop: `
      <rect x="24" y="24" width="472" height="292" rx="18" fill="var(--surface-high)" stroke="var(--line)" />
      <rect x="54" y="64" width="184" height="106" rx="14" fill="var(--accent-soft)" stroke="var(--accent)" />
      <rect x="256" y="64" width="210" height="106" rx="14" fill="var(--surface)" stroke="var(--line-strong)" />
      <rect x="54" y="186" width="412" height="96" rx="14" fill="var(--surface)" stroke="var(--line)" />
      <text x="72" y="104" fill="var(--accent)" font-size="12" font-family="IBM Plex Mono, monospace">01 · BRIEF</text>
      <text x="72" y="132" fill="var(--fg)" font-size="14" font-family="Be Vietnam Pro, sans-serif">Chốt cấu trúc</text>
      <text x="274" y="104" fill="var(--secondary)" font-size="12" font-family="IBM Plex Mono, monospace">02 · BUILD</text>
      <text x="274" y="132" fill="var(--fg)" font-size="14" font-family="Be Vietnam Pro, sans-serif">Dựng bản chạy thật</text>
      <text x="72" y="226" fill="var(--muted)" font-size="12" font-family="IBM Plex Mono, monospace">03 · REVIEW & XUẤT BẢN · 14:00 – 17:30</text>`,
    concert: `
      <rect x="24" y="24" width="472" height="292" rx="18" fill="var(--surface-high)" stroke="var(--line)" />
      <g fill="var(--accent)">
        <rect x="76" y="150" width="10" height="72" rx="5" opacity="0.55" />
        <rect x="102" y="118" width="10" height="104" rx="5" opacity="0.75" />
        <rect x="128" y="90" width="10" height="132" rx="5" />
        <rect x="154" y="132" width="10" height="90" rx="5" opacity="0.7" />
        <rect x="180" y="102" width="10" height="120" rx="5" opacity="0.9" />
        <rect x="206" y="142" width="10" height="80" rx="5" opacity="0.6" />
        <rect x="232" y="84" width="10" height="138" rx="5" />
        <rect x="258" y="120" width="10" height="102" rx="5" opacity="0.8" />
        <rect x="284" y="146" width="10" height="76" rx="5" opacity="0.55" />
      </g>
      <circle cx="386" cy="160" r="64" fill="none" stroke="var(--secondary)" stroke-width="1.5" />
      <circle cx="386" cy="160" r="42" fill="none" stroke="var(--line-strong)" stroke-width="1.2" />
      <circle cx="386" cy="160" r="14" fill="var(--accent)" />
      <text x="76" y="274" fill="var(--muted)" font-size="12" font-family="IBM Plex Mono, monospace">ACOUSTIC LIVE · SÂN KHẤU NGOÀI TRỜI 19:00</text>`,
    stem: `
      <rect x="24" y="24" width="472" height="292" rx="18" fill="var(--surface-high)" stroke="var(--line)" />
      <polygon points="260,64 384,132 336,262 184,262 136,132" fill="var(--accent-soft)" stroke="var(--accent)" stroke-width="1.8" />
      <polygon points="260,96 346,144 314,234 206,234 174,144" fill="none" stroke="var(--line-strong)" stroke-width="1.2" />
      <circle cx="260" cy="64" r="5" fill="var(--accent)" />
      <circle cx="384" cy="132" r="5" fill="var(--accent)" />
      <circle cx="336" cy="262" r="5" fill="var(--accent)" />
      <circle cx="184" cy="262" r="5" fill="var(--accent)" />
      <circle cx="136" cy="132" r="5" fill="var(--accent)" />
      <text x="56" y="54" fill="var(--muted)" font-size="11" font-family="IBM Plex Mono, monospace">STEM PROFILE · TOÁN / LÝ / LẬP TRÌNH / NGHIÊN CỨU</text>`,
    dev: `
      <rect x="24" y="24" width="472" height="292" rx="18" fill="var(--surface-high)" stroke="var(--line)" />
      <circle cx="52" cy="48" r="5" fill="var(--line-strong)" />
      <circle cx="70" cy="48" r="5" fill="var(--line-strong)" />
      <circle cx="88" cy="48" r="5" fill="var(--accent)" />
      <line x1="24" y1="68" x2="496" y2="68" stroke="var(--line)" />
      <text x="52" y="106" fill="var(--accent)" font-size="13" font-family="IBM Plex Mono, monospace">$ build --target production</text>
      <text x="52" y="138" fill="var(--fg)" font-size="12" font-family="IBM Plex Mono, monospace">[OK] TypeScript strict: 0 errors</text>
      <text x="52" y="168" fill="var(--fg)" font-size="12" font-family="IBM Plex Mono, monospace">[OK] API p95 latency: 42ms</text>
      <text x="52" y="198" fill="var(--muted)" font-size="12" font-family="IBM Plex Mono, monospace">[OK] Lighthouse mobile: 98 / 100</text>
      <rect x="52" y="226" width="380" height="54" rx="10" fill="var(--accent-soft)" stroke="var(--accent)" />
      <text x="70" y="258" fill="var(--fg)" font-size="12" font-family="IBM Plex Mono, monospace">Sẵn sàng thực tập Full-stack / Backend</text>`,
    'minimal-design': `
      <rect x="24" y="24" width="472" height="292" rx="18" fill="var(--surface-high)" stroke="var(--line)" />
      <rect x="56" y="58" width="196" height="224" rx="14" fill="var(--surface)" stroke="var(--line-strong)" />
      <circle cx="154" cy="170" r="52" fill="var(--accent-soft)" stroke="var(--accent)" stroke-width="1.5" />
      <rect x="274" y="58" width="188" height="102" rx="14" fill="var(--surface)" stroke="var(--line)" />
      <rect x="274" y="180" width="188" height="102" rx="14" fill="var(--accent-soft)" stroke="var(--accent)" />
      <text x="292" y="114" fill="var(--muted)" font-size="12" font-family="IBM Plex Mono, monospace">GRID 8PX · TYPOGRAPHY</text>
      <text x="292" y="236" fill="var(--fg)" font-size="13" font-family="Be Vietnam Pro, sans-serif">Tỷ lệ & Khoảng thở</text>`,
    ceramic: `
      <rect x="24" y="24" width="472" height="292" rx="18" fill="var(--surface-high)" stroke="var(--line)" />
      <path d="M214 96 C214 84, 306 84, 306 96 L292 128 C332 158, 336 228, 296 266 L224 266 C184 228, 188 158, 228 128 Z" fill="var(--accent-soft)" stroke="var(--accent)" stroke-width="2" />
      <ellipse cx="260" cy="96" rx="46" ry="10" fill="var(--surface)" stroke="var(--accent)" stroke-width="1.6" />
      <line x1="112" y1="266" x2="408" y2="266" stroke="var(--line-strong)" stroke-width="1.5" />
      <text x="56" y="66" fill="var(--muted)" font-size="12" font-family="IBM Plex Mono, monospace">MEN TRO TỰ NHIÊN · NUNG 1.240°C</text>
      <text x="56" y="294" fill="var(--faint)" font-size="11" font-family="IBM Plex Mono, monospace">XƯỞNG GỐM THỦ CÔNG MỘC · LÀM TỪNG CHIẾC</text>`,
    noteflow: `
      <rect x="24" y="24" width="472" height="292" rx="18" fill="var(--surface-high)" stroke="var(--line)" />
      <rect x="48" y="54" width="128" height="232" rx="12" fill="var(--surface)" stroke="var(--line)" />
      <rect x="192" y="54" width="276" height="232" rx="12" fill="var(--surface)" stroke="var(--line-strong)" />
      <rect x="64" y="82" width="96" height="26" rx="8" fill="var(--accent-soft)" />
      <rect x="64" y="120" width="84" height="14" rx="6" fill="var(--line)" />
      <rect x="64" y="148" width="92" height="14" rx="6" fill="var(--line)" />
      <text x="214" y="96" fill="var(--fg)" font-size="15" font-family="Be Vietnam Pro, sans-serif" font-weight="600">Ghi chú chương 4 · Giải tích</text>
      <rect x="214" y="118" width="228" height="10" rx="5" fill="var(--line-strong)" />
      <rect x="214" y="140" width="194" height="10" rx="5" fill="var(--line)" />
      <rect x="214" y="176" width="228" height="82" rx="10" fill="var(--accent-soft)" stroke="var(--accent)" />
      <text x="232" y="212" fill="var(--accent)" font-size="12" font-family="IBM Plex Mono, monospace">3 thẻ ôn tập tạo tự động</text>`,
    photo: `
      <rect x="24" y="24" width="472" height="292" rx="18" fill="var(--surface-high)" stroke="var(--line)" />
      <rect x="52" y="52" width="416" height="236" rx="12" fill="none" stroke="var(--line-strong)" stroke-dasharray="6 6" />
      <circle cx="260" cy="170" r="68" fill="var(--accent-soft)" stroke="var(--accent)" stroke-width="1.8" />
      <circle cx="260" cy="170" r="32" fill="none" stroke="var(--fg)" stroke-width="1.4" />
      <line x1="260" y1="78" x2="260" y2="102" stroke="var(--accent)" />
      <line x1="260" y1="238" x2="260" y2="262" stroke="var(--accent)" />
      <text x="68" y="78" fill="var(--muted)" font-size="11" font-family="IBM Plex Mono, monospace">50mm · f/1.8 · ISO 200</text>
      <text x="348" y="274" fill="var(--muted)" font-size="11" font-family="IBM Plex Mono, monospace">RAW + CHỈNH MÀU</text>`,
    'scroll-story': `
      <rect x="24" y="24" width="472" height="292" rx="18" fill="var(--surface-high)" stroke="var(--line)" />
      <rect x="58" y="64" width="404" height="62" rx="14" fill="var(--surface)" stroke="var(--line)" />
      <rect x="78" y="138" width="364" height="62" rx="14" fill="var(--surface)" stroke="var(--line-strong)" />
      <rect x="98" y="212" width="324" height="68" rx="14" fill="var(--accent-soft)" stroke="var(--accent)" />
      <text x="82" y="100" fill="var(--muted)" font-size="12" font-family="IBM Plex Mono, monospace">CHƯƠNG 01 · NHỊP MỞ ĐẦU</text>
      <text x="102" y="174" fill="var(--fg)" font-size="12" font-family="IBM Plex Mono, monospace">CHƯƠNG 02 · CHỒNG LỚP THẺ</text>
      <text x="122" y="250" fill="var(--accent)" font-size="12" font-family="IBM Plex Mono, monospace">CHƯƠNG 03 · CHUYỂN CẢNH CUỘN</text>`,
    robotics: '',
    'three-space': '',
    devtools: '',
  };

  return `<div class="hero__visual craft-surface" aria-label="${escapeHtml(title)}">
  <svg viewBox="0 0 520 340" role="img" aria-label="${escapeHtml(title)}">
    ${shapes[motif] || shapes['minimal-design']}
  </svg>
</div>`;
}

function renderHeadingWithAccent(title: string, accentWord?: string): string {
  const safe = escapeHtml(title);
  if (accentWord && title.toLowerCase().includes(accentWord.toLowerCase())) {
    const idx = title.toLowerCase().indexOf(accentWord.toLowerCase());
    const before = escapeHtml(title.slice(0, idx));
    const mid = escapeHtml(title.slice(idx, idx + accentWord.length));
    const after = escapeHtml(title.slice(idx + accentWord.length));
    return `${before}<em>${mid}</em>${after}`;
  }
  const words = title.trim().split(/\s+/);
  if (words.length >= 3) {
    const tail = escapeHtml(words.slice(-2).join(' '));
    const head = escapeHtml(words.slice(0, -2).join(' '));
    return `${head} <em>${tail}</em>`;
  }
  return safe;
}

export function renderBlueprintToHtml(bp: ComposerBlueprint): {
  html: string;
  audit: AestheticAuditReport;
} {
  const palette = resolveCraftPalette(bp.profile.personality, bp.themeMode, bp.accentKey);
  const css = buildCraftStylesheet(
    bp.profile.personality,
    bp.themeMode,
    bp.signature,
    bp.accentKey
  );
  const sections = bp.profile.sections;
  const has = (key: PageSectionKey) => sections.includes(key);

  const navItems: Array<{ href: string; label: string }> = [];
  if (has('showcase') || has('stats')) navItems.push({ href: '#noi-bat', label: 'Điểm chính' });
  if (has('timeline')) navItems.push({ href: '#lich-trinh', label: 'Lịch trình' });
  if (has('quiz')) navItems.push({ href: '#tuong-tac', label: 'Ôn tập' });
  if (has('pricing')) navItems.push({ href: '#bang-gia', label: 'Gói & Giá' });
  if (has('team')) navItems.push({ href: '#doi-ngu', label: 'Đội ngũ' });
  if (has('register')) navItems.push({ href: '#dang-ky', label: 'Đăng ký' });
  const visibleNav = navItems.slice(0, 4);

  const primaryHref = has('register')
    ? '#dang-ky'
    : has('quiz')
      ? '#tuong-tac'
      : has('pricing')
        ? '#bang-gia'
        : '#noi-bat';

  const secondaryHref = has('timeline')
    ? '#lich-trinh'
    : has('quiz')
      ? '#tuong-tac'
      : '#noi-bat';

  let sectionIndex = 1;
  const nextNum = () => String(sectionIndex++).padStart(2, '0');

  const blocks: string[] = [];

  if (bp.includeCountdown) {
    blocks.push(`<section class="section" id="dem-nguoc">
  <div class="wrap">
    <div class="countdown-bar craft-surface reveal" data-days="${bp.countdownDaysAhead}">
      <div>
        <span class="section__num">${nextNum()} / ĐẾM NGƯỢC</span>
        <h2 style="font-size:1.35rem;">${escapeHtml(bp.countdownTitle)}</h2>
      </div>
      <div class="countdown-units" aria-live="polite">
        <div class="countdown-unit"><strong data-cd="d">${String(bp.countdownDaysAhead).padStart(2, '0')}</strong><span>Ngày</span></div>
        <div class="countdown-unit"><strong data-cd="h">08</strong><span>Giờ</span></div>
        <div class="countdown-unit"><strong data-cd="m">24</strong><span>Phút</span></div>
        <div class="countdown-unit"><strong data-cd="s">15</strong><span>Giây</span></div>
      </div>
    </div>
  </div>
</section>`);
  }

  if (has('stats')) {
    blocks.push(`<section class="section" id="so-lieu">
  <div class="wrap">
    <div class="section__head reveal">
      <div>
        <span class="section__num">${nextNum()} / SỐ LIỆU CỐT LÕI</span>
        <h2>Những con số cụ thể</h2>
      </div>
    </div>
    <div class="stats-grid">
      ${bp.stats
        .map(
          (st) => `<article class="stat-card craft-surface reveal">
        <div class="stat-card__val">${escapeHtml(st.value)}</div>
        <div class="stat-card__label">${escapeHtml(st.label)}</div>
      </article>`
        )
        .join('\n')}
    </div>
  </div>
</section>`);
  }

  if (has('showcase') || bp.cards.length > 0) {
    const cardsToRender = bp.compactCopy ? bp.cards.slice(0, 3) : bp.cards;
    blocks.push(`<section class="section" id="noi-bat">
  <div class="wrap">
    <div class="section__head reveal">
      <div>
        <span class="section__num">${nextNum()} / TRỌNG TÂM</span>
        <h2>Nội dung chính</h2>
      </div>
      ${bp.compactCopy ? '' : '<p class="section__lead">Mỗi khối tập trung đúng một phần thông tin, dễ theo dõi trên cả máy tính lẫn điện thoại.</p>'}
    </div>
    <div class="cards-grid cards-grid--3">
      ${cardsToRender
        .map(
          (c) => `<article class="feature-card craft-surface reveal">
        <span class="feature-card__tag">${escapeHtml(c.tag)}</span>
        <h3>${escapeHtml(c.title)}</h3>
        <p>${escapeHtml(bp.compactCopy ? c.description.split(',')[0] + '.' : c.description)}</p>
      </article>`
        )
        .join('\n')}
    </div>
    ${
      bp.customHighlights.length > 0
        ? `<div class="cards-grid cards-grid--2" style="margin-top:18px;">
      ${bp.customHighlights
        .map(
          (note, idx) => `<article class="feature-card craft-surface reveal">
        <span class="feature-card__tag">Cập nhật ${idx + 1}</span>
        <p style="color:var(--fg);">${escapeHtml(note)}</p>
      </article>`
        )
        .join('\n')}
    </div>`
        : ''
    }
  </div>
</section>`);
  }

  if (has('timeline')) {
    blocks.push(`<section class="section" id="lich-trinh">
  <div class="wrap">
    <div class="section__head reveal">
      <div>
        <span class="section__num">${nextNum()} / LỊCH TRÌNH</span>
        <h2>Các mốc thực hiện</h2>
      </div>
    </div>
    <div class="timeline">
      ${bp.timeline
        .map(
          (step) => `<article class="timeline__item craft-surface reveal">
        <div class="timeline__time">${escapeHtml(step.time)}</div>
        <div class="timeline__body">
          <h3>${escapeHtml(step.title)}</h3>
          <p>${escapeHtml(step.detail)}</p>
        </div>
      </article>`
        )
        .join('\n')}
    </div>
  </div>
</section>`);
  }

  if (has('quiz')) {
    const quizDataJson = JSON.stringify(bp.quiz).replace(/</g, '\\u003c');
    blocks.push(`<section class="section" id="tuong-tac">
  <div class="wrap">
    <div class="section__head reveal">
      <div>
        <span class="section__num">${nextNum()} / TƯƠNG TÁC</span>
        <h2>Thẻ lật & Câu hỏi nhanh</h2>
      </div>
      <div class="quiz-tabs" role="tablist" aria-label="Chế độ tương tác">
        <button type="button" class="quiz-tab is-active" role="tab" aria-selected="true" data-mode="cards">Thẻ lật ôn tập</button>
        <button type="button" class="quiz-tab" role="tab" aria-selected="false" data-mode="quiz">Trắc nghiệm</button>
      </div>
    </div>
    <div class="quiz-box craft-surface reveal">
      <div id="pane-cards" class="flashcard-grid">
        ${bp.flashcards
          .map(
            (card) => `<button type="button" class="flashcard" data-flipped="false" data-front="${escapeHtml(card.front)}" data-back="${escapeHtml(card.back)}">
          <span class="flashcard__tag">${escapeHtml(card.tag)}</span>
          <span class="flashcard__text">${escapeHtml(card.front)}</span>
          <span class="flashcard__hint">Nhấn để xem đáp án</span>
        </button>`
          )
          .join('\n')}
      </div>
      <div id="pane-quiz" hidden>
        <p class="quiz-q" id="quiz-question"></p>
        <div class="quiz-opts" id="quiz-options"></div>
        <div class="quiz-foot">
          <span id="quiz-feedback">Chọn một phương án để kiểm tra kết quả.</span>
          <div style="display:flex;gap:10px;align-items:center;">
            <strong id="quiz-score">0 / ${bp.quiz.length}</strong>
            <button type="button" class="btn btn--ghost" id="quiz-next" style="min-height:38px;padding:0 16px;">Câu tiếp</button>
          </div>
        </div>
      </div>
    </div>
    <script type="application/json" id="quiz-payload">${quizDataJson}</script>
  </div>
</section>`);
  }

  if (has('pricing')) {
    blocks.push(`<section class="section" id="bang-gia">
  <div class="wrap">
    <div class="section__head reveal">
      <div>
        <span class="section__num">${nextNum()} / GÓI & CHI PHÍ</span>
        <h2>Mức phí minh bạch</h2>
      </div>
      <div class="pricing-toggle" role="group" aria-label="Chu kỳ thanh toán">
        <button type="button" class="is-active" data-bill="monthly">Theo tháng / Lẻ</button>
        <button type="button" data-bill="yearly">Theo kỳ / Nhóm</button>
      </div>
    </div>
    <div class="cards-grid cards-grid--2">
      ${bp.pricing
        .map(
          (tier) => `<article class="price-card craft-surface reveal${tier.featured ? ' price-card--featured' : ''}">
        <div>
          <span class="feature-card__tag">${tier.featured ? 'Phổ biến' : 'Tiêu chuẩn'}</span>
          <h3 style="margin:6px 0 4px;">${escapeHtml(tier.name)}</h3>
          <p style="margin:0;color:var(--muted);font-size:0.9rem;">${escapeHtml(tier.note)}</p>
        </div>
        <div class="price-card__val" data-monthly="${escapeHtml(tier.monthly)}" data-yearly="${escapeHtml(tier.yearly)}">${escapeHtml(tier.monthly)}</div>
        <ul>
          ${tier.features.map((f) => `<li>${escapeHtml(f)}</li>`).join('')}
        </ul>
        <a href="${has('register') ? '#dang-ky' : '#top'}" class="btn ${tier.featured ? 'btn--primary' : 'btn--ghost'}">Chọn gói này</a>
      </article>`
        )
        .join('\n')}
    </div>
  </div>
</section>`);
  }

  if (has('team')) {
    blocks.push(`<section class="section" id="doi-ngu">
  <div class="wrap">
    <div class="section__head reveal">
      <div>
        <span class="section__num">${nextNum()} / ĐỘI NGŨ</span>
        <h2>Người thực hiện</h2>
      </div>
    </div>
    <div class="team-grid">
      ${bp.team
        .map(
          (member) => `<article class="team-card craft-surface reveal">
        <div class="team-avatar" aria-hidden="true">${escapeHtml(member.initials)}</div>
        <div>
          <h3>${escapeHtml(member.name)}</h3>
          <p>${escapeHtml(member.role)}</p>
        </div>
      </article>`
        )
        .join('\n')}
    </div>
  </div>
</section>`);
  }

  if (has('register')) {
    blocks.push(`<section class="section" id="dang-ky">
  <div class="wrap">
    <div class="section__head reveal">
      <div>
        <span class="section__num">${nextNum()} / KẾT NỐI</span>
        <h2>${escapeHtml(bp.registerHeading)}</h2>
      </div>
      <p class="section__lead">${escapeHtml(bp.registerLead)}</p>
    </div>
    <form class="reg-form craft-surface reveal" id="craft-reg-form" novalidate>
      <div class="reg-row">
        <div class="field">
          <label for="rf-name">Họ và tên</label>
          <input id="rf-name" name="name" type="text" required placeholder="Nguyễn Minh Anh" autocomplete="name" />
        </div>
        <div class="field">
          <label for="rf-contact">Email hoặc số điện thoại</label>
          <input id="rf-contact" name="contact" type="text" required placeholder="minhanh@example.com" />
        </div>
      </div>
      <div class="field">
        <label for="rf-note">Ghi chú ngắn</label>
        <textarea id="rf-note" name="note" rows="3" placeholder="Nội dung bạn muốn trao đổi thêm..."></textarea>
      </div>
      <div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap;">
        <button type="submit" class="btn btn--primary">${escapeHtml(bp.registerCta)}</button>
        <p class="form-status" id="craft-form-status" role="status" aria-live="polite"></p>
      </div>
    </form>
  </div>
</section>`);
  }

  const libsSummary = Array.from(new Set(bp.sourceRefs.map((r) => r.library))).join(' · ');
  const rawHtml = `<!DOCTYPE html>
<html lang="vi" data-page-theme="${bp.themeMode}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(bp.profile.siteName || bp.heroTitle)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="${VIETNAMESE_GOOGLE_FONTS_LINK}" rel="stylesheet" />
  <style>
${css}
  </style>
</head>
<body id="top">
  <div class="craft-grain" aria-hidden="true"></div>
  <header class="site-nav">
    <div class="wrap site-nav__inner">
      <a class="brand-mark" href="#top">
        <span class="brand-dot" aria-hidden="true"></span>
        <span>${escapeHtml(bp.profile.siteName || bp.heroTitle)}</span>
      </a>
      <nav class="nav-links" aria-label="Điều hướng trang">
        ${visibleNav.map((item) => `<a href="${item.href}">${escapeHtml(item.label)}</a>`).join('\n        ')}
      </nav>
      <div class="nav-actions">
        <button type="button" class="icon-toggle" id="page-theme-btn" aria-label="Đổi nền sáng tối" title="Đổi nền">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>
        </button>
        <a class="btn btn--primary" href="${primaryHref}">${escapeHtml(bp.primaryCta)}</a>
      </div>
    </div>
  </header>

  <main>
    <section class="hero">
      <div class="wrap">
        <div class="hero__grid hero__grid--split">
          <div class="reveal is-in">
            <p class="eyebrow">${escapeHtml(bp.eyebrow)}</p>
            <h1>${renderHeadingWithAccent(bp.heroTitle, bp.heroAccentWord)}</h1>
            <p class="hero__sub">${escapeHtml(bp.heroSubtitle)}</p>
            <div class="hero__cta">
              <a class="btn btn--primary" href="${primaryHref}">${escapeHtml(bp.primaryCta)}</a>
              <a class="btn btn--ghost" href="${secondaryHref}">${escapeHtml(bp.secondaryCta)}</a>
            </div>
          </div>
          <div class="reveal is-in">
            ${renderVisualIllustration(bp.visualMotif, bp.heroTitle)}
          </div>
        </div>
      </div>
    </section>

    ${blocks.join('\n\n    ')}
  </main>

  <footer class="site-footer">
    <div class="wrap site-footer__row">
      <span>${escapeHtml(bp.footerNote)}</span>
      <span>${escapeHtml(SIGNATURE_MOTIONS[bp.signature].label)}${libsSummary ? ` · ${escapeHtml(libsSummary)}` : ''}</span>
    </div>
  </footer>

  <script>
  (function () {
    var root = document.documentElement;
    var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduced && 'IntersectionObserver' in window) {
      root.classList.add('js-ready');
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in');
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12 });
      document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });
    }

    var themeBtn = document.getElementById('page-theme-btn');
    if (themeBtn) {
      themeBtn.addEventListener('click', function () {
        var cur = root.getAttribute('data-page-theme') || '${bp.themeMode}';
        root.setAttribute('data-page-theme', cur === 'dark' ? 'light' : 'dark');
      });
    }

    var cdWrap = document.querySelector('.countdown-bar');
    if (cdWrap) {
      var daysAhead = Number(cdWrap.getAttribute('data-days') || '9');
      var target = Date.now() + daysAhead * 86400000 + 28800000;
      var tick = function () {
        var diff = Math.max(0, target - Date.now());
        var d = Math.floor(diff / 86400000);
        var h = Math.floor((diff % 86400000) / 3600000);
        var m = Math.floor((diff % 3600000) / 60000);
        var s = Math.floor((diff % 60000) / 1000);
        var set = function (k, v) {
          var el = cdWrap.querySelector('[data-cd="' + k + '"]');
          if (el) el.textContent = String(v).padStart(2, '0');
        };
        set('d', d); set('h', h); set('m', m); set('s', s);
      };
      tick();
      window.setInterval(tick, 1000);
    }

    document.querySelectorAll('.flashcard').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var flipped = btn.getAttribute('data-flipped') === 'true';
        var next = !flipped;
        btn.setAttribute('data-flipped', String(next));
        var txt = btn.querySelector('.flashcard__text');
        var hint = btn.querySelector('.flashcard__hint');
        if (txt) txt.textContent = next ? (btn.getAttribute('data-back') || '') : (btn.getAttribute('data-front') || '');
        if (hint) hint.textContent = next ? 'Nhấn để quay về câu hỏi' : 'Nhấn để xem đáp án';
      });
    });

    var tabs = document.querySelectorAll('.quiz-tab');
    var paneCards = document.getElementById('pane-cards');
    var paneQuiz = document.getElementById('pane-quiz');
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        var mode = tab.getAttribute('data-mode');
        tabs.forEach(function (t) {
          var active = t === tab;
          t.classList.toggle('is-active', active);
          t.setAttribute('aria-selected', String(active));
        });
        if (paneCards && paneQuiz) {
          paneCards.hidden = mode !== 'cards';
          paneQuiz.hidden = mode !== 'quiz';
        }
      });
    });

    var payloadEl = document.getElementById('quiz-payload');
    if (payloadEl) {
      try {
        var questions = JSON.parse(payloadEl.textContent || '[]');
        var idx = 0, score = 0, answered = false;
        var qEl = document.getElementById('quiz-question');
        var optsEl = document.getElementById('quiz-options');
        var fbEl = document.getElementById('quiz-feedback');
        var scoreEl = document.getElementById('quiz-score');
        var nextBtn = document.getElementById('quiz-next');
        var renderQ = function () {
          if (!questions.length || !qEl || !optsEl) return;
          var item = questions[idx];
          answered = false;
          qEl.textContent = 'Câu ' + (idx + 1) + '/' + questions.length + ': ' + item.question;
          optsEl.innerHTML = '';
          if (fbEl) fbEl.textContent = 'Chọn một phương án để kiểm tra kết quả.';
          item.options.forEach(function (opt, oi) {
            var b = document.createElement('button');
            b.type = 'button';
            b.className = 'quiz-opt';
            b.textContent = opt;
            b.addEventListener('click', function () {
              if (answered) return;
              answered = true;
              if (oi === item.correctIndex) {
                score += 1;
                b.classList.add('is-right');
                if (fbEl) fbEl.textContent = 'Chính xác. ' + item.explanation;
              } else {
                b.classList.add('is-wrong');
                var rightBtn = optsEl.children[item.correctIndex];
                if (rightBtn) rightBtn.classList.add('is-right');
                if (fbEl) fbEl.textContent = 'Chưa đúng. ' + item.explanation;
              }
              if (scoreEl) scoreEl.textContent = score + ' / ' + questions.length;
            });
            optsEl.appendChild(b);
          });
        };
        renderQ();
        if (nextBtn) {
          nextBtn.addEventListener('click', function () {
            idx = (idx + 1) % questions.length;
            if (idx === 0) score = 0;
            if (scoreEl) scoreEl.textContent = score + ' / ' + questions.length;
            renderQ();
          });
        }
      } catch (e) {}
    }

    document.querySelectorAll('.pricing-toggle button').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var bill = btn.getAttribute('data-bill');
        document.querySelectorAll('.pricing-toggle button').forEach(function (b) {
          b.classList.toggle('is-active', b === btn);
        });
        document.querySelectorAll('.price-card__val').forEach(function (el) {
          var v = el.getAttribute(bill === 'yearly' ? 'data-yearly' : 'data-monthly');
          if (v) el.textContent = v;
        });
      });
    });

    var form = document.getElementById('craft-reg-form');
    var statusEl = document.getElementById('craft-form-status');
    if (form && statusEl) {
      form.addEventListener('submit', function (ev) {
        ev.preventDefault();
        var nameInput = document.getElementById('rf-name');
        var contactInput = document.getElementById('rf-contact');
        var nameVal = nameInput && nameInput.value ? nameInput.value.trim() : '';
        var contactVal = contactInput && contactInput.value ? contactInput.value.trim() : '';
        if (!nameVal || !contactVal) {
          statusEl.textContent = 'Vui lòng điền họ tên và email hoặc số điện thoại.';
          return;
        }
        statusEl.textContent = 'Đã ghi nhận thông tin của ' + nameVal + '. Cảm ơn bạn đã gửi.';
        form.reset();
      });
    }

    var canvas = document.getElementById('craft-stage-canvas');
    if (canvas && canvas.getContext) {
      var ctx = canvas.getContext('2d');
      var angle = 0;
      var pointerX = 0, pointerY = 0;
      var pts = [];
      for (var i = 0; i < 18; i++) {
        var phi = Math.acos(1 - (2 * (i + 0.5)) / 18);
        var theta = Math.PI * (1 + Math.sqrt(5)) * i;
        pts.push([Math.cos(theta) * Math.sin(phi), Math.sin(theta) * Math.sin(phi), Math.cos(phi)]);
      }
      canvas.addEventListener('pointermove', function (e) {
        var r = canvas.getBoundingClientRect();
        pointerX = ((e.clientX - r.left) / r.width - 0.5) * 1.4;
        pointerY = ((e.clientY - r.top) / r.height - 0.5) * 1.4;
      });
      var draw = function () {
        var w = canvas.width, h = canvas.height;
        ctx.clearRect(0, 0, w, h);
        var accent = getComputedStyle(root).getPropertyValue('--accent').trim() || '#38c99a';
        var line = getComputedStyle(root).getPropertyValue('--line-strong').trim() || 'rgba(255,255,255,0.22)';
        var rotY = angle + pointerX * 0.7;
        var rotX = 0.45 + pointerY * 0.5;
        var cy = Math.cos(rotY), sy = Math.sin(rotY);
        var cx = Math.cos(rotX), sx = Math.sin(rotX);
        var proj = pts.map(function (p) {
          var x1 = p[0] * cy - p[2] * sy;
          var z1 = p[0] * sy + p[2] * cy;
          var y2 = p[1] * cx - z1 * sx;
          var z2 = p[1] * sx + z1 * cx;
          var s = 230 / (3.1 - z2);
          return [w / 2 + x1 * s, h / 2 + y2 * s, z2];
        });
        ctx.strokeStyle = line;
        ctx.lineWidth = 1;
        for (var a = 0; a < proj.length; a++) {
          for (var b = a + 1; b < proj.length; b++) {
            var dx = proj[a][0] - proj[b][0];
            var dy = proj[a][1] - proj[b][1];
            if (dx * dx + dy * dy < 8800) {
              ctx.beginPath();
              ctx.moveTo(proj[a][0], proj[a][1]);
              ctx.lineTo(proj[b][0], proj[b][1]);
              ctx.stroke();
            }
          }
        }
        ctx.fillStyle = accent;
        proj.forEach(function (p) {
          var rad = Math.max(2.2, (p[2] + 1.4) * 2.1);
          ctx.beginPath();
          ctx.arc(p[0], p[1], rad, 0, Math.PI * 2);
          ctx.fill();
        });
        if (!reduced) {
          angle += 0.008;
          window.requestAnimationFrame(draw);
        }
      };
      draw();
    }
  })();
  </script>
</body>
</html>`;

  const audit = auditGeneratedPage(rawHtml, palette);
  return { html: audit.cleanHtml, audit };
}

export function createInitialBlueprint(
  profile: OnboardingProfile,
  prompt: string,
  sourceRefs: MatchedVaultResource[],
  variationIndex = 0
): ComposerBlueprint {
  const motif = detectMotif(profile, prompt);
  const sig = pickMotionSignature(profile, prompt, variationIndex);
  const defaults = buildDomainDefaults(profile, prompt, motif);
  const folded = foldVi(prompt);

  let themeMode: CraftThemeMode = BRAND_PALETTES[profile.personality].defaultTheme;
  if (/nen sang|nen trang|light mode|che do sang/.test(folded)) themeMode = 'light';
  if (/nen toi|nen den|dark mode|che do toi/.test(folded)) themeMode = 'dark';

  let accentKey: string | undefined;
  if (/cam dao|mau cam|am ap/.test(folded)) accentKey = 'peach';
  else if (/xanh bien|xanh duong|ocean/.test(folded)) accentKey = 'ocean';
  else if (/do san ho|mau do|coral/.test(folded)) accentKey = 'coral';
  else if (/xanh ngoc|emerald/.test(folded)) accentKey = 'emerald';

  const sections = new Set<PageSectionKey>(profile.sections);
  if (sections.size === 0) {
    sections.add('hero');
    sections.add('stats');
    sections.add('showcase');
  }
  if (/trac nghiem|the lat|flashcard|quiz/.test(folded)) sections.add('quiz');
  if (/lich trinh|timeline|moc thoi gian/.test(folded)) sections.add('timeline');
  if (/bang gia|pricing|goi dich vu/.test(folded)) sections.add('pricing');
  if (/dang ky|form|lien he|giu cho/.test(folded)) sections.add('register');
  if (/doi ngu|dien gia|thanh vien/.test(folded)) sections.add('team');

  return {
    ...defaults,
    profile: { ...profile, sections: Array.from(sections) },
    themeMode,
    accentKey,
    signature: sig.id,
    visualMotif: motif,
    variationIndex,
    sourceRefs,
  };
}

export function applyFollowUpMutation(
  current: ComposerBlueprint,
  instruction: string,
  newMatched?: MatchedVaultResource[],
  forceVariation = false
): { next: ComposerBlueprint; changeSummary: string[] } {
  const folded = foldVi(instruction);
  const changes: string[] = [];
  const next: ComposerBlueprint = {
    ...current,
    profile: {
      ...current.profile,
      sections: [...current.profile.sections],
    },
    customHighlights: [...current.customHighlights],
    sourceRefs: newMatched && newMatched.length > 0 ? newMatched : current.sourceRefs,
  };

  if (forceVariation) {
    next.variationIndex = current.variationIndex + 1;
    const nextSig = pickMotionSignature(next.profile, instruction, next.variationIndex);
    next.signature = nextSig.id;
    next.themeMode = current.themeMode === 'dark' ? 'light' : 'dark';
    changes.push(`Đổi sang hướng trình bày mới (${nextSig.label}, nền ${next.themeMode === 'dark' ? 'tối' : 'sáng'})`);
  }

  if (/nen sang|sang hon|nen trang|light/.test(folded)) {
    next.themeMode = 'light';
    changes.push('Chuyển toàn trang sang nền sáng tương phản cao');
  } else if (/nen toi|toi hon|nen den|dark/.test(folded)) {
    next.themeMode = 'dark';
    changes.push('Chuyển toàn trang sang nền tối');
  }

  if (/cam dao|mau cam/.test(folded)) {
    next.accentKey = 'peach';
    changes.push('Đổi màu nhấn sang cam đào');
  } else if (/xanh bien|xanh duong|teal/.test(folded)) {
    next.accentKey = 'ocean';
    changes.push('Đổi màu nhấn sang xanh biển');
  } else if (/xanh ngoc|emerald/.test(folded)) {
    next.accentKey = 'emerald';
    changes.push('Đổi màu nhấn sang xanh ngọc');
  } else if (/do san ho|mau do|cam do/.test(folded)) {
    next.accentKey = 'coral';
    changes.push('Đổi màu nhấn sang đỏ san hô');
  } else if (/xanh la|lime/.test(folded)) {
    next.accentKey = 'lime';
    changes.push('Đổi màu nhấn sang xanh lá sáng');
  }

  const personalityChecks: Array<[RegExp, BrandPersonality, string]> = [
    [/toi gian|minimal/, 'minimal', 'tối giản'],
    [/chuyen nghiep|editorial/, 'professional', 'chuyên nghiệp'],
    [/than thien|am ap/, 'friendly', 'thân thiện'],
    [/nang dong|tre trung/, 'playful', 'năng động'],
    [/manh me|ca tinh/, 'bold', 'mạnh mẽ'],
    [/hien dai|cong nghe/, 'modern', 'hiện đại'],
  ];
  for (const [re, pers, label] of personalityChecks) {
    if (re.test(folded) && next.profile.personality !== pers) {
      next.profile.personality = pers;
      changes.push(`Chuyển phong cách sang ${label}`);
      break;
    }
  }

  const isRemove = /\b(xoa|bo|an|go)\b/.test(folded);
  const toggleSection = (key: PageSectionKey, label: string) => {
    if (isRemove) {
      next.profile.sections = next.profile.sections.filter((s) => s !== key);
      changes.push(`Ẩn khối ${label}`);
    } else if (!next.profile.sections.includes(key)) {
      next.profile.sections.push(key);
      changes.push(`Thêm khối ${label}`);
    }
  };

  if (/trac nghiem|the lat|flashcard|quiz|cau hoi/.test(folded)) toggleSection('quiz', 'Trắc nghiệm & Thẻ lật');
  if (/lich trinh|timeline|moc thoi gian/.test(folded)) toggleSection('timeline', 'Lịch trình');
  if (/bang gia|pricing|chi phi/.test(folded)) toggleSection('pricing', 'Bảng giá');
  if (/dang ky|form|lien he|giu cho/.test(folded)) toggleSection('register', 'Form đăng ký');
  if (/doi ngu|dien gia|thanh vien/.test(folded)) toggleSection('team', 'Đội ngũ');
  if (/so lieu|thong ke|stats/.test(folded)) toggleSection('stats', 'Bảng số liệu');

  if (/dem nguoc|countdown|dong ho/.test(folded)) {
    next.includeCountdown = !isRemove;
    changes.push(isRemove ? 'Ẩn đồng hồ đếm ngược' : 'Thêm đồng hồ đếm ngược trực tiếp');
  }

  if (/rut gon|ngan gon|it chu|gon hon/.test(folded)) {
    next.compactCopy = true;
    next.heroSubtitle = next.heroSubtitle.split('.')[0] + '.';
    changes.push('Rút gọn văn bản toàn trang cho thoáng hơn');
  }

  const titleMatch = instruction.match(
    /(?:đổi tiêu đề thành|đổi tên trang thành|đổi tên thành|tiêu đề là)\s+["“]?([^"”\n]{3,80})["”]?/i
  );
  if (titleMatch?.[1]) {
    const updatedTitle = titleMatch[1].trim();
    next.heroTitle = updatedTitle;
    next.profile.siteName = updatedTitle;
    next.heroAccentWord = undefined;
    changes.push(`Đổi tiêu đề chính thành "${updatedTitle}"`);
  }

  if (changes.length === 0 && instruction.trim().length > 2) {
    const cleanNote = instruction.trim().slice(0, 140);
    next.customHighlights = [...next.customHighlights.slice(-2), cleanNote];
    changes.push('Cập nhật thêm điểm nhấn theo yêu cầu mới vào trang');
  }

  return { next, changeSummary: changes };
}

export interface ComposeAgentOptions {
  prompt: string;
  profile: OnboardingProfile;
  previousHtml: string | null;
  previousBlueprint: ComposerBlueprint | null;
  behaviorScores?: Record<string, BehaviorItemScore>;
  excludeIds?: string[];
  seedItemId?: string;
  forceVariation?: boolean;
  isAuthenticated?: boolean;
  byok?: BYOKConfig;
}

export async function composeWithAgent(
  options: ComposeAgentOptions
): Promise<ComposeResult> {
  const startedAt = performance.now();
  const {
    prompt,
    profile,
    previousHtml,
    previousBlueprint,
    behaviorScores,
    excludeIds,
    seedItemId,
    forceVariation = false,
    isAuthenticated = false,
    byok,
  } = options;

  const isEdit = Boolean(previousHtml && previousBlueprint);

  const rec = await recommendVaultResources({
    profile,
    prompt,
    behaviorScores,
    excludeIds,
    limit: 5,
    seedItemId,
  });

  // WHY: Opportunistically hydrate the top matched shard to honor repo references without blocking offline fallback.
  const firstMatch = rec.matched[0];
  const firstMeta = firstMatch ? rec.itemsById.get(firstMatch.id) : undefined;
  let shardLoadedNote = '';
  if (firstMeta?.s && firstMeta.s !== 'pinui') {
    try {
      const shard = await fetchVaultShard(firstMeta.s);
      if (shard && shard[firstMeta.i]) {
        shardLoadedNote = `Đã đọc cấu trúc mẫu "${firstMeta.t}" từ kho ${firstMeta.l}.`;
      }
    } catch {
      shardLoadedNote = '';
    }
  }

  let blueprint: ComposerBlueprint;
  let summaryText: string;

  if (isEdit && previousBlueprint) {
    const { next, changeSummary } = applyFollowUpMutation(
      previousBlueprint,
      prompt,
      rec.matched,
      forceVariation
    );
    blueprint = next;
    summaryText = `Đã cập nhật trang theo yêu cầu: ${changeSummary.join('; ')}.`;
  } else {
    blueprint = createInitialBlueprint(
      profile,
      prompt,
      rec.matched,
      forceVariation ? 1 : 0
    );
    summaryText = `Đã dựng hoàn chỉnh trang "${blueprint.heroTitle}" với phong cách ${BRAND_PALETTES[profile.personality].label.toLowerCase()} và hiệu ứng ${SIGNATURE_MOTIONS[blueprint.signature].label}.`;
  }

  let { html, audit } = renderBlueprintToHtml(blueprint);
  let usedLiveAi = false;
  let aiModelLabel = '';
  const hasByok = Boolean(byok?.enabled && byok.apiKey.trim());

  if (isAuthenticated || hasByok) {
    try {
      const baseHtml = (isEdit && previousHtml ? previousHtml : html).slice(0, 14000);
      const aiPrompt = isEdit
        ? `Chỉnh sửa trang web hiện tại theo đúng yêu cầu người dùng: "${prompt}". Giữ tiếng Việt tự nhiên có dấu, không emoji, không văn khoa trương, bố cục responsive gọn gàng, liên kết nội bộ dùng dạng #anchor.`
        : `Tạo trang web hoàn chỉnh tiếng Việt có dấu cho "${blueprint.profile.siteName || blueprint.heroTitle}" theo yêu cầu: "${prompt}". Phong cách: ${BRAND_PALETTES[profile.personality].label}. Tham khảo cấu trúc từ mẫu nền đã đính kèm nhưng viết nội dung mới thật sát yêu cầu, không emoji, tương phản chữ rõ nét và chạy mượt ngay trên trình duyệt.`;
      const aiRes = await apiClient.sendAiChat(
        {
          prompt: aiPrompt,
          projectId: blueprint.profile.siteName || 'workspace-v4',
          files: [{ path: 'index.html', content: baseHtml }],
          attachedItems: rec.matched.slice(0, 3).map((m) => ({
            id: m.id,
            kind: 'resource' as const,
            title: m.title,
            summary: `${m.library} — ${m.reason}`,
          })),
        },
        hasByok ? byok : undefined
      );
      if (aiRes && !aiRes.fallback && Array.isArray(aiRes.files) && aiRes.files.length > 0) {
        const bundledHtml = bundleAiFilesToSingleHtml(aiRes.files);
        if (bundledHtml) {
          const pal = resolveCraftPalette(blueprint.profile.personality, blueprint.themeMode, blueprint.accentKey);
          const reAudit = auditGeneratedPage(bundledHtml, pal);
          html = reAudit.cleanHtml;
          audit = reAudit;
          usedLiveAi = true;
          aiModelLabel = aiRes.modelUsed || (hasByok ? 'BYOK' : 'Gemini');
          if (typeof aiRes.message === 'string' && aiRes.message.trim().length >= 8) {
            summaryText = aiRes.message.trim();
          }
        }
      }
    } catch {
      usedLiveAi = false;
    }
  }

  const diff = computeHtmlLineDiff(previousHtml, html);
  const durationMs = Math.max(240, Math.round(performance.now() - startedAt));
  const motionSpec = SIGNATURE_MOTIONS[blueprint.signature];

  const trace: AgentTraceStep[] = [
    {
      id: `tr-thought-${Date.now()}`,
      kind: 'thought',
      label: usedLiveAi
        ? `AI (${aiModelLabel || 'Gemini'}) đã dựng trực tiếp theo yêu cầu`
        : isEdit
          ? 'Phân tích chỉnh sửa trực tiếp trên bản hiện tại'
          : `Lập cấu trúc cho "${blueprint.heroTitle}" (${BRAND_PALETTES[blueprint.profile.personality].label})`,
      detail: shardLoadedNote || `Mục tiêu: ${blueprint.profile.goal} · ${blueprint.profile.sections.length} phần nội dung.`,
      status: 'done',
    },
    {
      id: `tr-vault-${Date.now()}`,
      kind: 'vault_search',
      label: `Đã tra ${rec.totalScanned.toLocaleString('vi-VN')} mẫu kho tài nguyên (chọn ${rec.matched.length} khối)`,
      detail: rec.matched.map((m) => `${m.title} (${m.library})`).join(' · '),
      status: 'done',
    },
    {
      id: `tr-file-${Date.now()}`,
      kind: isEdit ? 'file_edit' : 'file_create',
      label: isEdit ? 'Edited index.html' : 'Created index.html',
      added: diff.added,
      removed: diff.removed,
      status: 'done',
    },
    {
      id: `tr-check-${Date.now()}`,
      kind: 'check',
      label: `Kiểm tra tương phản ${audit.contrastBody}:1 · ${motionSpec.label}`,
      detail:
        audit.fixesApplied.length > 0
          ? audit.fixesApplied.join(' · ')
          : 'Đạt chuẩn tương phản AA, không tràn ngang 390px và hỗ trợ giảm chuyển động.',
      status: 'done',
    },
  ];

  return {
    html,
    blueprint,
    matchedResources: rec.matched,
    motionSignature: motionSpec.label,
    trace,
    audit,
    summaryText,
    diff,
    durationMs,
    usedLiveAi,
  };
}
