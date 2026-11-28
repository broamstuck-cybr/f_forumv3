import { fetchMotionRecipes, fetchVaultShard, type VaultShardPayload } from '../features/explore/vaultLoader';
import { apiClient } from '../services/apiClient';
import type { BYOKConfig, SuggestedVaultItem, WorkspaceFile } from '../types/index';
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
import {
  applyAssemblyPlanToBlueprint,
  applyIncrementalPatches,
  buildStitchedVaultSlots,
  detectClientWorkspaceIntent,
  stitchVaultModulesIntoFiles,
  toVaultSlotBriefs,
} from './vaultStitcher';
import {
  bundleProjectFiles,
  computeProjectFileDiffs,
  detectLanguageFromPath,
  sanitizeVirtualPath,
  sortProjectFiles,
  splitHtmlToProjectFiles,
  type FileDiffSummary,
} from './workspaceBundler';

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
  files: WorkspaceFile[];
  changedFiles: FileDiffSummary[];
  blueprint: ComposerBlueprint;
  matchedResources: MatchedVaultResource[];
  motionSignature: string;
  trace: AgentTraceStep[];
  audit: AestheticAuditReport;
  summaryText: string;
  diff: { added: number; removed: number };
  durationMs: number;
  usedLiveAi: boolean;
  mode?: 'assistant' | 'build';
  modelUsed?: string;
  tokensTotal?: number;
  estimatedCostUsd?: number;
  suggestedResources?: SuggestedVaultItem[];
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
  previousFiles?: WorkspaceFile[];
  previousBlueprint: ComposerBlueprint | null;
  behaviorScores?: Record<string, BehaviorItemScore>;
  excludeIds?: string[];
  seedItemId?: string;
  forceVariation?: boolean;
  isAuthenticated?: boolean;
  byok?: BYOKConfig;
  model?: string;
  intent?: 'auto' | 'assistant' | 'assemble' | 'patch';
  chatHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

function shouldUseReactTsxScaffold(
  prompt: string,
  previousFiles?: WorkspaceFile[]
): boolean {
  if (previousFiles && previousFiles.some((f) => /\.(tsx|jsx)$/i.test(f.path))) {
    return true;
  }
  const folded = foldVi(prompt);
  return /\b(react|tsx|jsx|component|components|dashboard|bang dieu khien|ung dung tuong tac|kanban|tracker)\b/.test(
    folded
  );
}

export function renderBlueprintToReactFiles(bp: ComposerBlueprint): {
  files: WorkspaceFile[];
  html: string;
  audit: AestheticAuditReport;
} {
  const now = new Date().toISOString();
  const palette = resolveCraftPalette(bp.profile.personality, bp.themeMode, bp.accentKey);
  const baseCss = buildCraftStylesheet(
    bp.profile.personality,
    bp.themeMode,
    bp.signature,
    bp.accentKey
  );
  const siteTitle = bp.profile.siteName || bp.heroTitle;

  const extraReactCss = `
.rx-filterBar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 18px;
}
.rx-searchInput {
  flex: 1 1 240px;
  min-height: 42px;
  padding: 0 14px;
  border-radius: 999px;
  border: 1px solid var(--line-strong);
  background: var(--surface);
  color: var(--fg);
  font-family: inherit;
  font-size: 0.9rem;
}
.rx-countTag {
  font-size: 0.82rem;
  color: var(--muted);
  font-family: var(--font-mono, monospace);
}
.rx-cardActive {
  border-color: var(--accent) !important;
  box-shadow: 0 0 0 1px var(--accent);
}
`;

  const indexHtml = `<!DOCTYPE html>
<html lang="vi" data-page-theme="${bp.themeMode}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(siteTitle)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="${VIETNAMESE_GOOGLE_FONTS_LINK}" rel="stylesheet" />
  <link rel="stylesheet" href="src/styles.css" />
</head>
<body id="top">
  <div id="root"></div>
  <script type="module" src="src/App.tsx"></script>
</body>
</html>
`;

  const dataTs = `export interface StatItem {
  value: string;
  label: string;
}

export interface FeatureCard {
  tag: string;
  title: string;
  description: string;
}

export interface TimelineItem {
  time: string;
  title: string;
  detail: string;
}

export const SITE_META = ${JSON.stringify(
    {
      siteName: siteTitle,
      eyebrow: bp.eyebrow,
      heroTitle: bp.heroTitle,
      heroSubtitle: bp.heroSubtitle,
      primaryCta: bp.primaryCta,
      secondaryCta: bp.secondaryCta,
      defaultTheme: bp.themeMode,
      registerHeading: bp.registerHeading,
      registerLead: bp.registerLead,
      registerCta: bp.registerCta,
      footerNote: bp.footerNote,
    },
    null,
    2
  )};

export const STATS: StatItem[] = ${JSON.stringify(bp.stats, null, 2)};

export const CARDS: FeatureCard[] = ${JSON.stringify(bp.cards, null, 2)};

export const TIMELINE: TimelineItem[] = ${JSON.stringify(bp.timeline, null, 2)};
`;

  const headerTsx = `import React from 'react';

export interface HeaderProps {
  siteName: string;
  primaryCta: string;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export function Header({ siteName, primaryCta, theme, onToggleTheme }: HeaderProps) {
  return (
    <header className="site-nav">
      <div className="wrap site-nav__inner">
        <a className="brand-mark" href="#top">
          <span className="brand-dot" aria-hidden="true" />
          <span>{siteName}</span>
        </a>
        <nav className="nav-links" aria-label="Điều hướng trang">
          <a href="#so-lieu">Số liệu</a>
          <a href="#noi-bat">Nội dung</a>
          <a href="#lich-trinh">Lịch trình</a>
          <a href="#dang-ky">Liên hệ</a>
        </nav>
        <div className="nav-actions">
          <button
            type="button"
            className="icon-toggle"
            onClick={onToggleTheme}
            aria-label={theme === 'dark' ? 'Chuyển nền sáng' : 'Chuyển nền tối'}
            title="Đổi nền"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
            </svg>
          </button>
          <a className="btn btn--primary" href="#dang-ky">{primaryCta}</a>
        </div>
      </div>
    </header>
  );
}
`;

  const appTsx = `import React, { useEffect, useMemo, useState } from 'react';
import { Header } from './components/Header';
import { CARDS, SITE_META, STATS, TIMELINE } from './data';
import './styles.css';

export default function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>(SITE_META.defaultTheme as 'dark' | 'light');
  const [query, setQuery] = useState<string>('');
  const [pickedCard, setPickedCard] = useState<string>(CARDS[0]?.title || '');
  const [name, setName] = useState<string>('');
  const [contact, setContact] = useState<string>('');
  const [status, setStatus] = useState<string>('');

  useEffect(() => {
    document.documentElement.setAttribute('data-page-theme', theme);
  }, [theme]);

  const visibleCards = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return CARDS;
    return CARDS.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.tag.toLowerCase().includes(q)
    );
  }, [query]);

  const handleSubmit = (ev: any) => {
    ev.preventDefault();
    if (!name.trim() || !contact.trim()) {
      setStatus('Vui lòng điền họ tên và email hoặc số điện thoại.');
      return;
    }
    console.info('[App] Form submitted:', name.trim());
    setStatus('Đã ghi nhận thông tin của ' + name.trim() + '. Cảm ơn bạn đã gửi.');
    setName('');
    setContact('');
  };

  return (
    <>
      <div className="craft-grain" aria-hidden="true" />
      <Header
        siteName={SITE_META.siteName}
        primaryCta={SITE_META.primaryCta}
        theme={theme}
        onToggleTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
      />

      <main>
        <section className="hero">
          <div className="wrap">
            <p className="eyebrow">{SITE_META.eyebrow}</p>
            <h1>{SITE_META.heroTitle}</h1>
            <p className="hero__sub">{SITE_META.heroSubtitle}</p>
            <div className="hero__cta">
              <a className="btn btn--primary" href="#noi-bat">{SITE_META.primaryCta}</a>
              <a className="btn btn--ghost" href="#dang-ky">{SITE_META.secondaryCta}</a>
            </div>
          </div>
        </section>

        {STATS.length > 0 && (
          <section className="section" id="so-lieu">
            <div className="wrap">
              <div className="section__head">
                <div>
                  <span className="section__num">01 / SỐ LIỆU CỐT LÕI</span>
                  <h2>Những con số cụ thể</h2>
                </div>
              </div>
              <div className="stats-grid">
                {STATS.map((st, idx) => (
                  <article key={idx} className="stat-card craft-surface">
                    <div className="stat-card__val">{st.value}</div>
                    <div className="stat-card__label">{st.label}</div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="section" id="noi-bat">
          <div className="wrap">
            <div className="section__head">
              <div>
                <span className="section__num">02 / TRỌNG TÂM</span>
                <h2>Nội dung chính</h2>
              </div>
            </div>

            <div className="rx-filterBar">
              <input
                type="search"
                name="card-search"
                className="rx-searchInput"
                value={query}
                onChange={(e: any) => setQuery(e.target.value)}
                placeholder="Lọc nhanh theo từ khóa..."
                aria-label="Lọc nội dung"
              />
              <span className="rx-countTag">
                {visibleCards.length} / {CARDS.length} mục
              </span>
            </div>

            <div className="cards-grid cards-grid--3">
              {visibleCards.map((card) => (
                <article
                  key={card.title}
                  className={
                    pickedCard === card.title
                      ? 'feature-card craft-surface rx-cardActive'
                      : 'feature-card craft-surface'
                  }
                  onClick={() => setPickedCard(card.title)}
                >
                  <span className="feature-card__tag">{card.tag}</span>
                  <h3>{card.title}</h3>
                  <p>{card.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {TIMELINE.length > 0 && (
          <section className="section" id="lich-trinh">
            <div className="wrap">
              <div className="section__head">
                <div>
                  <span className="section__num">03 / LỊCH TRÌNH</span>
                  <h2>Các mốc thực hiện</h2>
                </div>
              </div>
              <div className="timeline">
                {TIMELINE.map((step, idx) => (
                  <article key={idx} className="timeline__item craft-surface">
                    <div className="timeline__time">{step.time}</div>
                    <div className="timeline__body">
                      <h3>{step.title}</h3>
                      <p>{step.detail}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="section" id="dang-ky">
          <div className="wrap">
            <div className="section__head">
              <div>
                <span className="section__num">04 / KẾT NỐI</span>
                <h2>{SITE_META.registerHeading}</h2>
              </div>
              <p className="section__lead">{SITE_META.registerLead}</p>
            </div>
            <form className="reg-form craft-surface" onSubmit={handleSubmit} noValidate>
              <div className="reg-row">
                <div className="field">
                  <label htmlFor="rx-name">Họ và tên</label>
                  <input
                    id="rx-name"
                    name="name"
                    type="text"
                    value={name}
                    onChange={(e: any) => setName(e.target.value)}
                    placeholder="Nguyễn Minh Anh"
                  />
                </div>
                <div className="field">
                  <label htmlFor="rx-contact">Email hoặc số điện thoại</label>
                  <input
                    id="rx-contact"
                    name="contact"
                    type="text"
                    value={contact}
                    onChange={(e: any) => setContact(e.target.value)}
                    placeholder="minhanh@example.com"
                  />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                <button type="submit" className="btn btn--primary">{SITE_META.registerCta}</button>
                {status && <p className="form-status" role="status">{status}</p>}
              </div>
            </form>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="wrap site-footer__row">
          <span>{SITE_META.footerNote}</span>
          <span>React TSX · F-Forum Studio</span>
        </div>
      </footer>
    </>
  );
}
`;

  const metadata = {
    name: siteTitle,
    mode: 'react-tsx',
    domain: bp.profile.domain,
    personality: bp.profile.personality,
    motionSignature: SIGNATURE_MOTIONS[bp.signature].label,
    entry: 'src/App.tsx',
    sources: bp.sourceRefs.map((r) => ({ id: r.id, title: r.title, library: r.library })),
    updatedAt: now,
  };

  const files: WorkspaceFile[] = sortProjectFiles([
    { path: 'index.html', content: indexHtml, language: 'html', summary: 'Điểm nạp HTML chính', updatedAt: now },
    { path: 'src/App.tsx', content: appTsx, language: 'typescript', summary: 'Thành phần React chính', updatedAt: now },
    { path: 'src/components/Header.tsx', content: headerTsx, language: 'typescript', summary: 'Thanh điều hướng & đổi nền', updatedAt: now },
    { path: 'src/data.ts', content: dataTs, language: 'typescript', summary: 'Dữ liệu và kiểu TypeScript', updatedAt: now },
    { path: 'src/styles.css', content: `${baseCss}\n${extraReactCss}`, language: 'css', summary: 'Hệ thống màu và bố cục', updatedAt: now },
    { path: 'metadata.json', content: `${JSON.stringify(metadata, null, 2)}\n`, language: 'json', summary: 'Cấu hình dự án', updatedAt: now },
    {
      path: 'README.md',
      content: `# ${siteTitle}\n\nDự án React/TSX đa tệp dựng từ F-Forum Workspace.\n\n- \`index.html\`: Trang khung chính\n- \`src/App.tsx\`: Giao diện tương tác React\n- \`src/components/Header.tsx\`: Thanh điều hướng\n- \`src/data.ts\`: Dữ liệu có kiểu TypeScript\n- \`src/styles.css\`: Bộ biến màu và layout responsive\n`,
      language: 'markdown',
      summary: 'Hướng dẫn dự án',
      updatedAt: now,
    },
  ]);

  const bundled = bundleProjectFiles(files, { enableConsoleBridge: false });
  const audit = auditGeneratedPage(bundled.standaloneHtml, palette);
  return { files, html: bundled.standaloneHtml, audit };
}

export function renderBlueprintToFiles(
  bp: ComposerBlueprint,
  preferReactTsx = false
): {
  files: WorkspaceFile[];
  html: string;
  audit: AestheticAuditReport;
} {
  if (preferReactTsx) {
    return renderBlueprintToReactFiles(bp);
  }
  const { html, audit } = renderBlueprintToHtml(bp);
  const files = splitHtmlToProjectFiles(html, {
    title: bp.profile.siteName || bp.heroTitle,
    domain: bp.profile.domain,
    personality: bp.profile.personality,
    motionSignature: SIGNATURE_MOTIONS[bp.signature].label,
    sources: bp.sourceRefs,
  });
  return { files, html, audit };
}

function unescapeDoubleEncodedText(raw: string): string {
  const realNewlines = (raw.match(/\n/g) || []).length;
  const literalNewlines = (raw.match(/\\n/g) || []).length;
  if (literalNewlines >= 3 && (realNewlines <= 2 || literalNewlines > realNewlines * 4)) {
    let fixed = raw
      .replace(/\\r\\n/g, '\n')
      .replace(/\\n/g, '\n')
      .replace(/\\t/g, '  ');
    if (fixed.includes('\\"') && !fixed.includes('class="')) {
      fixed = fixed.replace(/\\"/g, '"');
    }
    return fixed;
  }
  return raw;
}

function isFreshTopicPrompt(prompt: string, previousTitle?: string): boolean {
  const clean = foldVi(prompt).trim();
  if (!clean) return false;
  const startsFresh = /^(tao|dung|lam|thiet ke|xay dung|build|create|make|design)\b/.test(clean);
  if (!startsFresh || !previousTitle) return false;
  const prevWords = foldVi(previousTitle)
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length >= 3);
  if (prevWords.length === 0) return false;
  return !prevWords.some((w) => clean.includes(w));
}

function mergeAiReturnedFiles(
  returnedFiles: Array<{ path: string; content: string; summary?: string }>,
  baseFiles: WorkspaceFile[],
  meta: {
    title: string;
    domain: string;
    personality: string;
    motionSignature: string;
    sources: MatchedVaultResource[];
  }
): WorkspaceFile[] | null {
  const now = new Date().toISOString();
  const normalized: WorkspaceFile[] = [];

  for (const rf of returnedFiles) {
    const safePath = sanitizeVirtualPath(rf.path);
    if (!safePath || typeof rf.content !== 'string') continue;
    const cleanContent = unescapeDoubleEncodedText(rf.content);
    normalized.push({
      path: safePath,
      content: cleanContent,
      language: detectLanguageFromPath(safePath),
      summary: rf.summary || 'Cập nhật bởi AI',
      updatedAt: now,
    });
  }

  if (normalized.length === 0) return null;

  // Reject broken AI output if HTML still leaks literal "\n\n" tokens after unescaping
  const returnedHtml = normalized.find((f) => /\.html?$/i.test(f.path));
  if (returnedHtml && (returnedHtml.content.match(/\\n/g) || []).length >= 5) {
    return null;
  }

  // If AI returned only a single monolithic index.html, organize it cleanly into multi-file layout
  if (normalized.length === 1 && /\.html?$/i.test(normalized[0].path)) {
    return splitHtmlToProjectFiles(normalized[0].content, meta);
  }

  const fileMap = new Map<string, WorkspaceFile>();
  // Keep untouched existing project files so incremental AI updates never wipe unrelated assets
  for (const bf of baseFiles) {
    fileMap.set(bf.path, bf);
  }
  for (const nf of normalized) {
    fileMap.set(nf.path, nf);
  }

  if (!fileMap.has('index.html')) {
    const fallbackIndex = baseFiles.find((f) => f.path === 'index.html');
    if (fallbackIndex) fileMap.set('index.html', fallbackIndex);
  }

  const hasReact = Array.from(fileMap.keys()).some((p) => /\.(tsx|jsx)$/i.test(p));
  const metadata = {
    name: meta.title,
    mode: hasReact ? 'react-tsx' : 'multi-file-web',
    domain: meta.domain,
    personality: meta.personality,
    motionSignature: meta.motionSignature,
    entry: hasReact
      ? Array.from(fileMap.keys()).find((p) => /app\.(tsx|jsx)$/i.test(p)) || 'src/App.tsx'
      : 'index.html',
    sources: meta.sources.map((s) => ({ id: s.id, title: s.title, library: s.library })),
    updatedAt: now,
  };
  fileMap.set('metadata.json', {
    path: 'metadata.json',
    content: `${JSON.stringify(metadata, null, 2)}\n`,
    language: 'json',
    summary: 'Thông tin dự án',
    updatedAt: now,
  });

  if (!fileMap.has('README.md')) {
    const listMd = Array.from(fileMap.keys())
      .map((p) => `- \`${p}\``)
      .join('\n');
    fileMap.set('README.md', {
      path: 'README.md',
      content: `# ${meta.title}\n\nDự án đa tệp tạo bằng F-Forum Workspace.\n\n## Danh sách tệp\n\n${listMd}\n`,
      language: 'markdown',
      summary: 'Hướng dẫn dự án',
      updatedAt: now,
    });
  }

  return sortProjectFiles(Array.from(fileMap.values()));
}

export async function composeWithAgent(
  options: ComposeAgentOptions
): Promise<ComposeResult> {
  const startedAt = performance.now();
  const {
    prompt,
    profile,
    previousHtml,
    previousFiles = [],
    previousBlueprint,
    behaviorScores,
    excludeIds,
    seedItemId,
    forceVariation = false,
    isAuthenticated = false,
    byok,
    model,
    intent: requestedIntent = 'auto',
    chatHistory = [],
  } = options;

  const hasExistingProject = Boolean(previousHtml || previousFiles.length > 0);
  const freshTopic = isFreshTopicPrompt(prompt, previousBlueprint?.heroTitle || profile.siteName);
  const detectedIntent = detectClientWorkspaceIntent(
    prompt,
    hasExistingProject && !freshTopic && !seedItemId,
    seedItemId ? 'assemble' : requestedIntent
  );
  const hasByok = Boolean(byok?.enabled && byok.apiKey.trim());

  // 1. ULTRA-LOW-TOKEN F-FORUM ASSISTANT MODE (Q&A about web, GitHub repo, or Vault discovery — zero HTML regeneration!)
  if (detectedIntent === 'assistant' && !forceVariation && !seedItemId) {
    const recAssist = await recommendVaultResources({
      profile,
      prompt,
      behaviorScores,
      excludeIds,
      limit: 4,
    });

    let assistantReply =
      'F-Forum v3 cung cấp kho 5.909 mẫu giao diện miễn phí (Pin UI, ThreeUI 3D, lucianLabs, MotionSites Free, CodeFronts), 58 kỹ thuật chuyển động, 60 công cụ và Xưởng lắp ghép đa tệp. Bạn có thể bấm "Ghép mẫu" ở thẻ gợi ý bên dưới hoặc mô tả trang web cần dựng.';
    let modelUsed = '';
    let tokensTotal: number | undefined;
    let estimatedCostUsd: number | undefined;
    let usedLiveAi = false;
    let suggestedResources: SuggestedVaultItem[] = recAssist.matched.slice(0, 4).map((m) => ({
      id: m.id,
      title: m.title,
      library: m.library,
      reason: m.reason,
    }));

    if (isAuthenticated || hasByok) {
      try {
        const aiRes = await apiClient.sendAiChat(
          {
            prompt,
            projectId: previousBlueprint?.heroTitle || 'f-forum-assistant',
            model: model && model !== 'auto' ? model : undefined,
            intent: 'assistant',
            files: [],
            attachedItems: [],
            history: chatHistory.slice(-4),
          },
          hasByok ? byok : undefined
        );
        if (aiRes && !aiRes.fallback && aiRes.message?.trim()) {
          assistantReply = aiRes.message.trim();
          modelUsed = aiRes.modelUsed || '';
          tokensTotal = aiRes.tokens?.total;
          estimatedCostUsd = aiRes.estimatedCostUsd;
          usedLiveAi = true;
          if (Array.isArray(aiRes.suggestedResources) && aiRes.suggestedResources.length > 0) {
            suggestedResources = aiRes.suggestedResources;
          }
        }
      } catch {
        usedLiveAi = false;
      }
    }

    const fallbackBp =
      previousBlueprint ||
      createInitialBlueprint(profile, prompt, recAssist.matched, 0);
    const keepPal = resolveCraftPalette(fallbackBp.profile.personality, fallbackBp.themeMode, fallbackBp.accentKey);
    const durationMs = Math.max(180, Math.round(performance.now() - startedAt));
    return {
      html: previousHtml || '',
      files: previousFiles,
      changedFiles: [],
      blueprint: fallbackBp,
      matchedResources: recAssist.matched,
      motionSignature: SIGNATURE_MOTIONS[fallbackBp.signature].label,
      trace: [
        {
          id: `tr-assist-${Date.now()}`,
          kind: 'vault_search',
          label: `Trợ lý F-Forum · Tra ${recAssist.totalScanned.toLocaleString('vi-VN')} mẫu (không dựng lại tệp)`,
          detail: suggestedResources.map((s) => `${s.title} (${s.library})`).join(' · '),
          status: 'done',
        },
      ],
      audit: auditGeneratedPage(previousHtml || '<html><body></body></html>', keepPal),
      summaryText: assistantReply,
      diff: { added: 0, removed: 0 },
      durationMs,
      usedLiveAi,
      mode: 'assistant',
      modelUsed,
      tokensTotal,
      estimatedCostUsd,
      suggestedResources,
    };
  }

  const isEdit = Boolean(hasExistingProject && previousBlueprint && !freshTopic && detectedIntent === 'patch');
  const effectiveProfile: OnboardingProfile = freshTopic
    ? { ...profile, siteName: '' }
    : profile;

  const rec = await recommendVaultResources({
    profile: effectiveProfile,
    prompt,
    behaviorScores,
    excludeIds,
    limit: 6,
    seedItemId,
  });

  // 2. FETCH REAL VAULT SHARDS FOR DETERMINISTIC ZERO-TOKEN STITCHING (HTML + Scoped CSS + JS)
  const shardTargets = rec.matched
    .slice(0, 5)
    .map((m) => ({ match: m, meta: rec.itemsById.get(m.id) }));

  const [fetchedShardEntries, motionRecipes] = await Promise.all([
    Promise.all(
      shardTargets.map(async ({ match, meta }) => {
        let payload: VaultShardPayload | undefined;
        if (meta?.s && meta.s !== 'pinui') {
          try {
            const shard = await fetchVaultShard(meta.s);
            payload = shard?.[meta.i];
          } catch {
            payload = undefined;
          }
        }
        return { match, payload };
      })
    ),
    fetchMotionRecipes().catch(() => []),
  ]);

  const stitchedSlots = buildStitchedVaultSlots(fetchedShardEntries);
  const vaultSlotBriefs = toVaultSlotBriefs(stitchedSlots);

  const hydratedSnippets: Array<{
    id: string;
    kind: 'resource';
    title: string;
    summary: string;
  }> = fetchedShardEntries.slice(0, 3).map(({ match, payload }) => {
    const parts: string[] = [`Library: ${match.library} · Reason: ${match.reason}`];
    if (payload?.p) parts.push(`Spec: ${payload.p.slice(0, 260)}`);
    if (payload?.h) parts.push(`HTML:\n${payload.h.slice(0, 700)}`);
    if (payload?.c) parts.push(`CSS:\n${payload.c.slice(0, 700)}`);
    return {
      id: match.id,
      kind: 'resource' as const,
      title: match.title,
      summary: parts.join('\n'),
    };
  });

  if (motionRecipes.length > 0) {
    const pickedRecipe = motionRecipes[Math.abs(prompt.length) % motionRecipes.length];
    if (pickedRecipe) {
      hydratedSnippets.push({
        id: pickedRecipe.id,
        kind: 'resource',
        title: `Motion Recipe: ${pickedRecipe.title}`,
        summary: `Use when: ${pickedRecipe.useWhen}\nCode:\n${pickedRecipe.code.slice(0, 600)}`,
      });
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
    summaryText = `Đã cập nhật dự án theo yêu cầu: ${changeSummary.join('; ')}.`;
  } else {
    blueprint = createInitialBlueprint(
      effectiveProfile,
      prompt,
      rec.matched,
      forceVariation ? 1 : 0
    );
    summaryText = `Đã lắp ghép dự án "${blueprint.heroTitle}" từ kho mẫu F-Forum (${stitchedSlots.length} khối thật) và hiệu ứng ${SIGNATURE_MOTIONS[blueprint.signature].label}.`;
  }

  const preferReact = shouldUseReactTsxScaffold(prompt, isEdit ? previousFiles : []);
  let { files, html, audit } = renderBlueprintToFiles(blueprint, preferReact);

  // Deterministically stitch real Vault modules on new HTML builds even before/without AI response
  if (!isEdit && !preferReact && stitchedSlots.length > 0) {
    files = stitchVaultModulesIntoFiles(files, stitchedSlots);
    const stitchedBundled = bundleProjectFiles(files, { enableConsoleBridge: false });
    if (stitchedBundled.standaloneHtml) {
      html = stitchedBundled.standaloneHtml;
      const pal = resolveCraftPalette(blueprint.profile.personality, blueprint.themeMode, blueprint.accentKey);
      audit = auditGeneratedPage(html, pal);
    }
  }

  let usedLiveAi = false;
  let aiModelLabel = '';
  let tokensTotal: number | undefined;
  let estimatedCostUsd: number | undefined;
  const useCompactAssemblyPlan = !isEdit && !preferReact && vaultSlotBriefs.length > 0;

  if (isAuthenticated || hasByok) {
    try {
      const contextFiles = isEdit
        ? (previousFiles.length > 0 ? previousFiles : files)
            .filter((f) => f.path !== 'metadata.json' && f.path !== 'README.md' && f.path !== 'src/vault-modules.css')
            .slice(0, 3)
            .map((f) => ({ path: f.path, content: f.content.slice(0, 2600) }))
        : useCompactAssemblyPlan
          ? []
          : files
              .filter((f) => f.path !== 'metadata.json' && f.path !== 'README.md')
              .slice(0, 4)
              .map((f) => ({ path: f.path, content: f.content.slice(0, 2800) }));

      const aiRes = await apiClient.sendAiChat(
        {
          prompt,
          projectId: blueprint.heroTitle || 'workspace-v4',
          model: model && model !== 'auto' ? model : undefined,
          intent: isEdit ? 'patch' : 'assemble',
          files: contextFiles,
          vaultSlots: useCompactAssemblyPlan ? vaultSlotBriefs : undefined,
          attachedItems: useCompactAssemblyPlan ? [] : hydratedSnippets,
        },
        hasByok ? byok : undefined
      );

      if (aiRes && !aiRes.fallback) {
        tokensTotal = aiRes.tokens?.total;
        estimatedCostUsd = aiRes.estimatedCostUsd;
        aiModelLabel = aiRes.modelUsed || (hasByok ? 'BYOK' : 'OpenRouter');

        // Path A: Ultra-low-token Assembly Plan + Real Vault Stitching (~75% fewer tokens!)
        if (aiRes.assemblyPlan && !preferReact) {
          const adaptedBlueprint = applyAssemblyPlanToBlueprint(blueprint, aiRes.assemblyPlan);
          const rendered = renderBlueprintToFiles(adaptedBlueprint, false);
          const stitched = stitchVaultModulesIntoFiles(rendered.files, stitchedSlots, aiRes.assemblyPlan);
          const bundled = bundleProjectFiles(stitched, { enableConsoleBridge: false });
          if (bundled.standaloneHtml) {
            const pal = resolveCraftPalette(
              adaptedBlueprint.profile.personality,
              adaptedBlueprint.themeMode,
              adaptedBlueprint.accentKey
            );
            blueprint = adaptedBlueprint;
            files = stitched;
            html = bundled.standaloneHtml;
            audit = auditGeneratedPage(html, pal);
            usedLiveAi = true;
            if (typeof aiRes.message === 'string' && aiRes.message.trim().length >= 8) {
              summaryText = aiRes.message.trim();
            }
          }
        }
        // Path B: Incremental find/replace patches on existing files (~70% fewer tokens!)
        else if (isEdit && Array.isArray(aiRes.patches) && aiRes.patches.length > 0 && previousFiles.length > 0) {
          const patched = applyIncrementalPatches(previousFiles, aiRes.patches);
          if (patched.appliedCount > 0) {
            const bundled = bundleProjectFiles(patched.files, { enableConsoleBridge: false });
            if (bundled.standaloneHtml) {
              const pal = resolveCraftPalette(blueprint.profile.personality, blueprint.themeMode, blueprint.accentKey);
              files = patched.files;
              html = bundled.standaloneHtml;
              audit = auditGeneratedPage(html, pal);
              usedLiveAi = true;
              if (typeof aiRes.message === 'string' && aiRes.message.trim().length >= 8) {
                summaryText = aiRes.message.trim();
              }
            }
          }
        }
        // Path C: Partial or full multi-file AI response (React TSX or custom edits)
        else if (Array.isArray(aiRes.files) && aiRes.files.length > 0) {
          const merged = mergeAiReturnedFiles(
            aiRes.files,
            isEdit && previousFiles.length > 0 ? previousFiles : files,
            {
              title: blueprint.heroTitle || effectiveProfile.siteName || 'Dự án F-Forum',
              domain: blueprint.profile.domain,
              personality: blueprint.profile.personality,
              motionSignature: SIGNATURE_MOTIONS[blueprint.signature].label,
              sources: rec.matched,
            }
          );
          if (merged && merged.length > 0) {
            const cssFile = merged.find((f) => /\.css$/i.test(f.path));
            const hasRealCss = Boolean(cssFile && cssFile.content.includes('{') && cssFile.content.split('\n').length >= 8);
            const hasInlineStyle = merged.some(
              (f) => /\.html?$/i.test(f.path) && /<style[\s>][\s\S]{120,}<\/style>/i.test(f.content)
            );
            if (hasRealCss || hasInlineStyle) {
              const bundled = bundleProjectFiles(merged, { enableConsoleBridge: false });
              if (bundled.standaloneHtml) {
                const pal = resolveCraftPalette(
                  blueprint.profile.personality,
                  blueprint.themeMode,
                  blueprint.accentKey
                );
                audit = auditGeneratedPage(bundled.standaloneHtml, pal);
                files = merged;
                html = bundled.standaloneHtml;
                usedLiveAi = true;
                if (typeof aiRes.message === 'string' && aiRes.message.trim().length >= 8) {
                  summaryText = aiRes.message.trim();
                }
              }
            }
          }
        }
      }
    } catch {
      usedLiveAi = false;
    }
  }

  const changedFiles = computeProjectFileDiffs(previousFiles, files);
  const diff = computeHtmlLineDiff(previousHtml, html);
  const durationMs = Math.max(240, Math.round(performance.now() - startedAt));
  const motionSpec = SIGNATURE_MOTIONS[blueprint.signature];
  const shardLoadedNote =
    stitchedSlots.length > 0
      ? `Đã ghép trực tiếp ${stitchedSlots.length} khối thật từ kho 5.909 mẫu (${stitchedSlots.map((s) => s.title).join(', ')}).`
      : '';

  const fileTraceSteps: AgentTraceStep[] = (
    changedFiles.length > 0
      ? changedFiles.filter((d) => d.path !== 'metadata.json')
      : files
          .filter((f) => f.path !== 'metadata.json')
          .map((f) => ({
            path: f.path,
            action: (isEdit ? 'edit' : 'create') as 'create' | 'edit',
            added: f.content.split('\n').length,
            removed: 0,
          }))
  ).map((fDiff, idx) => ({
    id: `tr-file-${Date.now()}-${idx}`,
    kind: fDiff.action === 'edit' ? 'file_edit' : 'file_create',
    label: fDiff.action === 'edit' ? `Edited ${fDiff.path}` : `Created ${fDiff.path}`,
    detail: fDiff.path,
    added: fDiff.added,
    removed: fDiff.removed,
    status: 'done',
  }));

  const trace: AgentTraceStep[] = [
    {
      id: `tr-thought-${Date.now()}`,
      kind: 'thought',
      label: usedLiveAi
        ? `AI (${aiModelLabel || 'OpenRouter'}) lắp ghép ${files.length} tệp${tokensTotal ? ` · ${tokensTotal.toLocaleString('vi-VN')} token` : ''}`
        : isEdit
          ? 'Cập nhật nhanh trên cấu trúc tệp hiện tại'
          : `Lắp ghép "${blueprint.heroTitle}" từ kho tài nguyên (${stitchedSlots.length} khối thật)`,
      detail: shardLoadedNote || `Mục tiêu: ${blueprint.profile.goal} · ${files.length} tệp nguồn.`,
      status: 'done',
    },
    {
      id: `tr-vault-${Date.now()}`,
      kind: 'vault_search',
      label: `Đã tra ${rec.totalScanned.toLocaleString('vi-VN')} mẫu kho tài nguyên (ghép ${Math.max(stitchedSlots.length, rec.matched.length)} khối)`,
      detail: rec.matched.map((m) => `${m.title} (${m.library})`).join(' · '),
      status: 'done',
    },
    ...fileTraceSteps,
    {
      id: `tr-check-${Date.now()}`,
      kind: 'check',
      label: `Kiểm tra tương phản ${audit.contrastBody}:1 · ${motionSpec.label}`,
      detail:
        audit.fixesApplied.length > 0
          ? audit.fixesApplied.join(' · ')
          : 'Tương phản chữ rõ, không tràn ngang 390px và hỗ trợ giảm chuyển động.',
      status: 'done',
    },
  ];

  return {
    html,
    files,
    changedFiles,
    blueprint,
    matchedResources: rec.matched,
    motionSignature: motionSpec.label,
    trace,
    audit,
    summaryText,
    diff,
    durationMs,
    usedLiveAi,
    mode: 'build',
    modelUsed: aiModelLabel || undefined,
    tokensTotal,
    estimatedCostUsd,
  };
}
