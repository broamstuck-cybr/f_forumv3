export interface ChatLandingShowcaseItem {
  id: string;
  title: string;
  category: string;
  tone: 'light' | 'dark';
  image: string;
  prompt: string;
}

export const CHAT_LANDING_SHOWCASE: readonly ChatLandingShowcaseItem[] = [
  {
    id: 'monolith-hero',
    title: 'Stratum Kiến trúc',
    category: 'Kiến trúc',
    tone: 'dark',
    image: '/assets/chat-showcase/monolith-hero.webp',
    prompt:
      'Dựng trang giới thiệu studio kiến trúc đương đại Stratum nền tối chiều sâu, chữ tiêu đề nổi bật, danh mục công trình tiêu biểu và nút đặt lịch tư vấn từ kho mẫu F-Forum.',
  },
  {
    id: 'lumen-roof-hero',
    title: 'Lumen Năng lượng',
    category: 'Năng lượng',
    tone: 'dark',
    image: '/assets/chat-showcase/lumen-roof-hero.webp',
    prompt:
      'Dựng trang dự án điện mặt trời áp mái Lumen Roof có bảng chỉ số tiết kiệm năng lượng, chuyển đổi chế độ Ngày/Đêm và 2 câu hỏi nhanh từ kho mẫu F-Forum.',
  },
  {
    id: 'halden-port-hero',
    title: 'Halden Trợ lý AI',
    category: 'SaaS',
    tone: 'light',
    image: '/assets/chat-showcase/halden-port-hero.webp',
    prompt:
      'Dựng trang giới thiệu nền tảng trợ lý AI Halden nền sáng tối giản, khu tính năng chính dạng bento, dải đối tác và biểu mẫu đăng ký dùng thử từ kho mẫu F-Forum.',
  },
  {
    id: 'planetary-pulse',
    title: 'Terranova Kính lỏng',
    category: 'Khoa học',
    tone: 'light',
    image: '/assets/chat-showcase/planetary-pulse.webp',
    prompt:
      'Dựng trang thuyết trình khoa học khí hậu Terranova phong cách kính lỏng nền sáng tinh gọn, có bảng số liệu nghiên cứu và lộ trình dự án từ kho mẫu F-Forum.',
  },
  {
    id: 'redline-mars-hero',
    title: 'Mars Du hành 3D',
    category: '3D Web',
    tone: 'dark',
    image: '/assets/chat-showcase/redline-mars-hero.webp',
    prompt:
      'Dựng trang triển lãm khám phá sao Hỏa Redline tông cam đất đậm, tiêu đề lớn ấn tượng, mốc hành trình 3 giai đoạn và thẻ đặt chỗ tham quan từ kho mẫu F-Forum.',
  },
  {
    id: 'vell-lookbook',
    title: 'Vell Thời trang',
    category: 'Thời trang',
    tone: 'light',
    image: '/assets/chat-showcase/vell-lookbook.webp',
    prompt:
      'Dựng trang lookbook bộ sưu tập mùa mới Maison Vell nền trắng biên tập, lưới ảnh sản phẩm gọn sạch, mô tả chất liệu và nút đặt lịch thử đồ từ kho mẫu F-Forum.',
  },
  {
    id: 'ai-runtime',
    title: 'AI Runtime',
    category: 'Nền tảng AI',
    tone: 'dark',
    image: '/assets/chat-showcase/ai-runtime.webp',
    prompt:
      'Dựng trang nền tảng vận hành AI Runtime nền tối tối giản, điểm nhấn công nghệ, 3 chỉ số hiệu năng thực tế và phần hỏi đáp nhanh từ kho mẫu F-Forum.',
  },
  {
    id: 'medusa-jellyfish-hero',
    title: 'Medusa Robotics',
    category: 'Robotics',
    tone: 'light',
    image: '/assets/chat-showcase/medusa-jellyfish-hero.webp',
    prompt:
      'Dựng trang giới thiệu CLB Robotics & Cơ khí Medusa nền sáng kỹ thuật, bảng thông số mô hình, lịch tập huấn và form đăng ký thành viên từ kho mẫu F-Forum.',
  },
  {
    id: 'phoenix-ignis',
    title: 'Myth Atlas 3D',
    category: 'Triển lãm',
    tone: 'light',
    image: '/assets/chat-showcase/phoenix-ignis.webp',
    prompt:
      'Dựng trang cẩm nang trưng bày tư liệu Myth Atlas tông giấy ấm biên tập, chia mục tra cứu rõ ràng, thẻ chi tiết hiện vật và câu hỏi ôn tập từ kho mẫu F-Forum.',
  },
  {
    id: 'fernhollow',
    title: 'Fernhollow 3D',
    category: 'Studio 3D',
    tone: 'dark',
    image: '/assets/chat-showcase/fernhollow.webp',
    prompt:
      'Dựng trang giới thiệu studio sáng tạo bền vững Fernhollow nền đêm giàu chiều sâu, khu trưng bày dự án nổi bật và biểu mẫu liên hệ hợp tác từ kho mẫu F-Forum.',
  },
  {
    id: 'living-portrait-hero',
    title: 'Mina Hồ sơ 3D',
    category: 'Hồ sơ 3D',
    tone: 'dark',
    image: '/assets/chat-showcase/living-portrait-hero.webp',
    prompt:
      'Dựng hồ sơ cá nhân nhà thiết kế 3D nền tối tinh gọn, hiển thị kỹ năng chuyên môn, 3 dự án nổi bật, mốc kinh nghiệm và thông tin liên hệ từ kho mẫu F-Forum.',
  },
  {
    id: 'macos-widget',
    title: 'Driftbar Ứng dụng',
    category: 'Ứng dụng',
    tone: 'light',
    image: '/assets/chat-showcase/macos-widget.webp',
    prompt:
      'Dựng trang ra mắt ứng dụng ghi chú & tiện ích máy tính Driftbar nền sáng tối giản, khu tính năng nổi bật, bảng gói sử dụng và nút tải bản thử từ kho mẫu F-Forum.',
  },
  {
    id: 'gold-standard',
    title: 'Soscale Thương hiệu',
    category: 'Thương hiệu',
    tone: 'dark',
    image: '/assets/chat-showcase/gold-standard.webp',
    prompt:
      'Dựng trang giới thiệu agency sáng tạo nội dung Soscale tông trầm sang trọng, chữ tiêu đề nổi bật, dự án khách hàng và nút đặt lịch trao đổi từ kho mẫu F-Forum.',
  },
  {
    id: 'vante-ribbon-hero',
    title: 'Vante Portfolio',
    category: 'Portfolio',
    tone: 'dark',
    image: '/assets/chat-showcase/vante-ribbon-hero.webp',
    prompt:
      'Dựng hồ sơ sáng tạo chuyển động Vante nền tối tương phản cao, lưới sản phẩm thị giác, quy trình làm việc 4 bước và mục liên hệ từ kho mẫu F-Forum.',
  },
  {
    id: 'aurex-finance',
    title: 'Aurex Tài chính',
    category: 'Tài chính',
    tone: 'dark',
    image: '/assets/chat-showcase/aurex-finance.webp',
    prompt:
      'Dựng trang giới thiệu sản phẩm quản lý tài chính số Aurex nền tối tinh tế, bảng chỉ số minh bạch, khu bảo mật và biểu mẫu mở tài khoản từ kho mẫu F-Forum.',
  },
  {
    id: 'keylight',
    title: 'Keylight Bảo mật',
    category: 'SaaS',
    tone: 'light',
    image: '/assets/chat-showcase/keylight.webp',
    prompt:
      'Dựng trang sản phẩm xác thực bảo mật Keylight chia đôi sáng tối rõ nét, bảng tính năng an toàn, đánh giá người dùng và nút bắt đầu dùng thử từ kho mẫu F-Forum.',
  },
  {
    id: 'data-signal',
    title: 'Vantage Dữ liệu',
    category: 'Dữ liệu',
    tone: 'dark',
    image: '/assets/chat-showcase/data-signal.webp',
    prompt:
      'Dựng trang nền tảng phân tích dữ liệu Vantage tông tối ấm, nhấn mạnh tốc độ xử lý, bảng số liệu trực quan và lịch hẹn xem bản demo từ kho mẫu F-Forum.',
  },
  {
    id: 'cyber-layer',
    title: 'Cyber Layer',
    category: 'An ninh',
    tone: 'dark',
    image: '/assets/chat-showcase/cyber-layer.webp',
    prompt:
      'Dựng trang giải pháp an ninh hệ thống Cyber Layer nền tối kỹ thuật, 3 chỉ số độ tin cậy, kiến trúc bảo vệ nhiều lớp và nút liên hệ tư vấn từ kho mẫu F-Forum.',
  },
  {
    id: 'driftlab-hero',
    title: 'Driftlab Sáng tạo',
    category: 'Tương tác',
    tone: 'light',
    image: '/assets/chat-showcase/driftlab-hero.webp',
    prompt:
      'Dựng trang giới thiệu xưởng thiết kế web tương tác Driftlab nền sáng hiện đại, tiêu đề mạnh mẽ, khu trình diễn hiệu ứng và biểu mẫu gửi brief từ kho mẫu F-Forum.',
  },
  {
    id: 'pet-diagnostics',
    title: 'Pet Care Y tế',
    category: 'Dịch vụ',
    tone: 'light',
    image: '/assets/chat-showcase/pet-diagnostics.webp',
    prompt:
      'Dựng trang dịch vụ chăm sóc thú cưng nền sáng ấm áp, bảng so sánh 2 gói khám rõ ràng, quy trình tiếp nhận và biểu mẫu đặt lịch hẹn từ kho mẫu F-Forum.',
  },
  {
    id: 'real-time-alerts',
    title: 'Signal Cảnh báo',
    category: 'Công nghệ',
    tone: 'light',
    image: '/assets/chat-showcase/real-time-alerts.webp',
    prompt:
      'Dựng trang ứng dụng giám sát sự cố thời gian thực Signal nền sáng sắc nét, khu thông số độ trễ, danh sách tính năng cốt lõi và nút đăng ký từ kho mẫu F-Forum.',
  },
  {
    id: 'orbit-flora',
    title: 'Orbit Poster',
    category: 'Sự kiện',
    tone: 'dark',
    image: '/assets/chat-showcase/orbit-flora.webp',
    prompt:
      'Dựng trang giới thiệu sự kiện triển lãm nghệ thuật số Orbit nền tối nổi bật, lịch trình chương trình, danh sách diễn giả và mục giữ vé từ kho mẫu F-Forum.',
  },
];

function shuffleItems<T>(list: readonly T[]): T[] {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}

// WHY: Pick a fresh random quartet per visitor while balancing light and dark hero cards so the gallery never looks flat or monotone.
export function pickRandomChatShowcase(
  count = 4,
  excludeIds: readonly string[] = []
): ChatLandingShowcaseItem[] {
  const excluded = new Set(excludeIds);
  const freshPool = CHAT_LANDING_SHOWCASE.filter((item) => !excluded.has(item.id));
  const workingPool = freshPool.length >= count ? freshPool : CHAT_LANDING_SHOWCASE;

  const lights = shuffleItems(workingPool.filter((item) => item.tone === 'light'));
  const darks = shuffleItems(workingPool.filter((item) => item.tone === 'dark'));

  const targetLight = Math.min(Math.floor(count / 2), lights.length);
  const targetDark = Math.min(count - targetLight, darks.length);
  const picked: ChatLandingShowcaseItem[] = [
    ...lights.slice(0, targetLight),
    ...darks.slice(0, targetDark),
  ];

  if (picked.length < count) {
    const pickedIds = new Set(picked.map((p) => p.id));
    const extras = shuffleItems(workingPool.filter((item) => !pickedIds.has(item.id)));
    picked.push(...extras.slice(0, count - picked.length));
  }

  return shuffleItems(picked);
}
