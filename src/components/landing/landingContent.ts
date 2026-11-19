import type { LucideIcon } from 'lucide-react';
import {
  BookOpenCheck,
  Compass,
  FileText,
  Headphones,
  HelpCircle,
  Lightbulb,
  MessagesSquare,
  Paperclip,
  ShieldCheck,
  Users,
} from 'lucide-react';

export const HERO_TRUST = [
  'Tập trung vào thực chiến & học thuật',
  'Live Sandbox Preview & Diff tự động',
  'Tính năng cốt lõi hiện miễn phí',
];

export const FEATURES: {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  accent: string;
  span: 'lg' | 'md';
  bullets?: string[];
}[] = [
  {
    id: 'qa',
    title: 'Hỏi đáp & phản biện kỹ thuật',
    description:
      'Mô tả điều đang vướng, thêm bối cảnh mã nguồn và cùng thành viên khác trao đổi. Lời giải hữu ích được ghi nhận rõ ràng.',
    icon: HelpCircle,
    accent: 'amber',
    span: 'lg',
    bullets: ['Gắn chủ đề rõ ràng', 'Lưu lời giải ngay dưới câu hỏi', 'Fork nhanh vào Work space'],
  },
  {
    id: 'materials',
    title: 'Kho template & học liệu UI/UX',
    description:
      'Tra cứu 121 thành phần và kho tài nguyên có kiểm chứng, ghi nhận đầy đủ bản quyền MIT và nguồn chính thức.',
    icon: FileText,
    accent: 'sky',
    span: 'md',
  },
  {
    id: 'clubs',
    title: 'Câu lạc bộ & Hồ sơ chuyển giao',
    description:
      'Tìm không gian theo chuyên đề và lưu giữ Hồ sơ chuyển giao dự án để các thế hệ tiếp nối mạch lạc.',
    icon: Users,
    accent: 'teal',
    span: 'md',
  },
  {
    id: 'chat',
    title: 'Work space AI 3 cột',
    description:
      'Soạn giao diện HTML/CSS/JS với Live Preview sandbox, Diff từng dòng và bộ kiểm định tĩnh tự động.',
    icon: MessagesSquare,
    accent: 'amber',
    span: 'md',
  },
  {
    id: 'focus',
    title: 'Xuất dự án an toàn',
    description:
      'Tự động quét lộ lọt khóa bí mật trước khi đóng gói ZIP cùng bộ RULES và SKILLS cho môi trường lập trình.',
    icon: Headphones,
    accent: 'emerald',
    span: 'md',
  },
];

export const SHOWCASE_STEPS: {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
  points: string[];
}[] = [
  {
    id: 'ask',
    eyebrow: 'Khởi tạo',
    title: 'Bắt đầu từ ý tưởng trong Home Launchpad',
    description:
      'Chọn nhanh 1 trong 5 thẻ tác vụ và cấu trúc prompt không tốn token trước khi chuyển thẳng vào Work space.',
    icon: BookOpenCheck,
    points: ['Prompt Blueprint trực quan', 'Chuyển cảnh mượt sang Work space', 'Lưu lịch sử dự án cục bộ'],
  },
  {
    id: 'belong',
    eyebrow: 'Khám phá',
    title: 'Kết hợp thư viện 121 template UI/UX',
    description:
      'Duyệt bộ sưu tập Split Stage 60/40 với live preview và đính kèm trực tiếp vào ngữ cảnh dự án chỉ bằng một cú bấm.',
    icon: Compass,
    points: ['Lọc theo thư viện & phong cách', 'Xem trước sân khấu bên phải', 'Ghi nhận bản quyền rõ ràng'],
  },
  {
    id: 'materials',
    eyebrow: 'Kiểm định',
    title: 'Kiểm tra Diff, Checks và chia sẻ cộng đồng',
    description:
      'Mọi thay đổi đều hiển thị diff từng dòng, kiểm tra cấu trúc HTML/JS/Responsive và có thể chia sẻ lên Source of Knowledge.',
    icon: FileText,
    points: ['Unified & Split Diff', 'Quét bí mật trước khi Export ZIP', 'Phản biện & Accepted Solution'],
  },
];

export const BENEFITS: {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
}[] = [
  {
    id: 'context',
    title: 'Bối cảnh trước, lời giải sau',
    description:
      'Một yêu cầu rõ mục tiêu, bố cục và ràng buộc kỹ thuật luôn cho kết quả chính xác hơn nhiều so với một dòng chung chung.',
    icon: HelpCircle,
  },
  {
    id: 'reasoning',
    title: 'Cách nghĩ quan trọng như kết quả',
    description:
      'Chia sẻ các bước lập luận giúp người học hiểu vì sao kiến trúc này hoạt động tốt và khi nào cần điều chỉnh.',
    icon: Lightbulb,
  },
  {
    id: 'verification',
    title: 'Đối chiếu, đừng tin tuyệt đối',
    description:
      'Nội dung do AI hay cộng đồng tạo ra cần luôn được kiểm chứng bằng Checks thực tế và tài liệu chính thống.',
    icon: ShieldCheck,
  },
];

export const QUESTION_GUIDE: {
  id: string;
  tag: string;
  title: string;
  body: string;
  icon: LucideIcon;
}[] = [
  {
    id: 'context',
    tag: 'Bối cảnh',
    title: 'Nêu mục tiêu và đề bài rõ ràng',
    body: 'Cho người đọc biết bạn đang xây dựng tính năng nào, dùng công nghệ gì và điều kiện ràng buộc ra sao.',
    icon: BookOpenCheck,
  },
  {
    id: 'stuck',
    tag: 'Điểm mắc',
    title: 'Chỉ ra điều chưa thông',
    body: 'Nói bạn đã thử cách nào, vướng ở bước nào, hoặc muốn cộng đồng kiểm tra giả định kỹ thuật nào.',
    icon: HelpCircle,
  },
  {
    id: 'source',
    tag: 'Tài liệu',
    title: 'Đính kèm đúng phần liên quan',
    body: 'Thêm đoạn mã, template tham chiếu hoặc ảnh minh họa và tuyệt đối tránh chia sẻ khóa API hay dữ liệu cá nhân.',
    icon: Paperclip,
  },
];

export const PRICING_PLANS: {
  id: string;
  name: string;
  tagline: string;
  highlight?: boolean;
  badge?: string;
  features: string[];
  footnote?: string;
}[] = [
  {
    id: 'student',
    name: 'F-Forum v3 · Không gian Học thuật & Kiến tạo',
    tagline: 'Các tính năng cốt lõi hiện mở miễn phí với hạn mức 15 lượt AI và hỗ trợ BYOK cá nhân.',
    highlight: true,
    badge: 'HỌC · TẠO · CHIA SẺ',
    features: [
      'Home Launchpad & Work space AI 3 cột với Live Sandbox Preview',
      'Thư viện Explore 121 template UI/UX & 8 nhóm tài nguyên',
      'Source of Knowledge: Dev Q&A, Project Showcase, Drops và Club Hub',
      'Kiểm định tự động, Diff từng dòng và Export ZIP quét lộ lọt bí mật',
    ],
    footnote: 'Tra cứu tự do; tạo tài khoản để đồng bộ lượt AI, lưu tài nguyên và tham gia thảo luận.',
  },
];

export const FAQ_ITEMS: { id: string; question: string; answer: string }[] = [
  {
    id: 'f1',
    question: 'F-Forum v3 hiện có miễn phí không?',
    answer:
      'Các tính năng cốt lõi hiện mở miễn phí. Khách và thành viên có 15 lượt sinh mã AI tiêu chuẩn, hoặc có thể cấu hình khóa API cá nhân (BYOK) trong mục Cài đặt.',
  },
  {
    id: 'f2',
    question: 'Work space có chạy mã nguồn an toàn không?',
    answer:
      'Live Preview chạy trong iframe sandbox tách biệt với CSP nghiêm ngặt, đồng thời kiểm tra cấu trúc HTML, cú pháp JS và quét khóa bí mật trước khi xuất tệp ZIP.',
  },
  {
    id: 'f3',
    question: 'Kho template trong Explore có ghi nhận bản quyền không?',
    answer:
      'Tất cả các thành phần từ PinUI, lucianLabs, CodeFronts, MotionSites và ThreeUI đều được lưu rõ nguồn gốc, đường dẫn chính thức và giấy phép MIT trong mục Notice.',
  },
  {
    id: 'f4',
    question: 'Làm sao để kiểm chứng độ chính xác của nội dung AI và lời giải?',
    answer:
      'Luôn chạy bảng Checks tự động trong Work space, đọc Diff từng dòng trước khi áp dụng và đối chiếu với tài liệu chính thống.',
  },
  {
    id: 'f5',
    question: 'Tôi nên làm gì nếu phát hiện nội dung sai lệch trên cộng đồng?',
    answer:
      'Bạn có thể phản biện trực tiếp dưới bài đăng hoặc bấm nút Báo cáo để chuyển vào Hàng đợi Kiểm duyệt của Ban Quản Trị.',
  },
];
