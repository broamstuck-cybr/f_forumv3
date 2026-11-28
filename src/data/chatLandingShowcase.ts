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
      'Thiết kế website cho studio kiến trúc đương đại Stratum: nền đá bazan tối (#0d0f10) phối chữ trắng ngà và điểm nhấn đồng ấm (#c89b6e), hero toàn màn hình với bản vẽ mặt cắt kiến trúc SVG động, bộ lọc công trình theo loại hình (Nhà ở, Bảo tàng, Không gian công cộng), ngăn kéo xem chi tiết dự án và biểu mẫu đặt lịch tư vấn.',
  },
  {
    id: 'lumen-roof-hero',
    title: 'Lumen Năng lượng',
    category: 'Năng lượng',
    tone: 'dark',
    image: '/assets/chat-showcase/lumen-roof-hero.webp',
    prompt:
      'Thiết kế trang sản phẩm điện mặt trời áp mái Lumen Roof: nền than sâu phối xanh ngọc ánh sáng, thanh trượt tính toán sản lượng kWh và tiền điện tiết kiệm theo diện tích mái (m²), biểu đồ SVG trực quan 12 tháng, nút chuyển mô phỏng Ngày/Đêm và form nhận báo giá lắp đặt.',
  },
  {
    id: 'halden-port-hero',
    title: 'Halden Trợ lý AI',
    category: 'SaaS',
    tone: 'light',
    image: '/assets/chat-showcase/halden-port-hero.webp',
    prompt:
      'Thiết kế landing page cho nền tảng trợ lý AI Halden: nền trắng sứ tối giản (#faf9f6) với viền mảnh kiểu Thụy Sĩ và điểm nhấn xanh rừng đậm, khu mô phỏng hộp lệnh AI tương tác trực tiếp ngay trong hero, lưới bento 4 tính năng cốt lõi, bảng chuyển đổi giá Tháng/Năm và đăng ký dùng thử.',
  },
  {
    id: 'planetary-pulse',
    title: 'Terranova Kính lỏng',
    category: 'Khoa học',
    tone: 'light',
    image: '/assets/chat-showcase/planetary-pulse.webp',
    prompt:
      'Thiết kế trang dữ liệu khí hậu Terranova phong cách sáng tối giản thanh lịch: hero kết hợp quả địa cầu tuyến tính trên HTML5 Canvas xoay mượt, bộ chọn vùng khí hậu (Châu Á, Châu Âu, Thái Bình Dương) cập nhật trực tiếp biểu đồ nhiệt độ & độ ẩm, cùng dòng thời gian nghiên cứu tương tác.',
  },
  {
    id: 'redline-mars-hero',
    title: 'Mars Du hành 3D',
    category: '3D Web',
    tone: 'dark',
    image: '/assets/chat-showcase/redline-mars-hero.webp',
    prompt:
      'Thiết kế trang triển lãm thám hiểm sao Hỏa Redline: nền đêm vũ trụ kết hợp cam đất đỏ (#d95b2b), hero với địa hình đường đồng mức trên Canvas phản hồi theo con trỏ chuột, thanh chọn 3 trạm đổ bộ cập nhật tọa độ & áp suất khí quyển theo thời gian thực và thẻ đặt vé tham quan tương tác.',
  },
  {
    id: 'vell-lookbook',
    title: 'Vell Thời trang',
    category: 'Thời trang',
    tone: 'light',
    image: '/assets/chat-showcase/vell-lookbook.webp',
    prompt:
      'Thiết kế lookbook bộ sưu tập mùa mới Maison Vell: nền giấy kem ấm (#f7f4ee) kiểu tạp chí biên tập với font serif cổ điển, lưới bộ sưu tập lọc theo chất liệu (Linen, Lụa tơ tằm, Len dệt), chế độ xem nhanh bảng kích cỡ & chi tiết đường may, và form đặt lịch thử đồ tại showroom.',
  },
  {
    id: 'ai-runtime',
    title: 'AI Runtime',
    category: 'Nền tảng AI',
    tone: 'dark',
    image: '/assets/chat-showcase/ai-runtime.webp',
    prompt:
      'Thiết kế trang hạ tầng vận hành mô hình AI Runtime: nền tối kỹ thuật (#090c0e) kèm lưới điểm tinh tế, khu terminal tương tác cho phép chuyển tab mã gọi API (cURL, TypeScript, Python) và bấm sao chép thật, bảng so sánh độ trễ theo khu vực và thanh tính chi phí token trực tiếp.',
  },
  {
    id: 'medusa-jellyfish-hero',
    title: 'Medusa Robotics',
    category: 'Robotics',
    tone: 'light',
    image: '/assets/chat-showcase/medusa-jellyfish-hero.webp',
    prompt:
      'Thiết kế trang phòng thí nghiệm Robotics Medusa: nền sáng kỹ thuật kiểu bản vẽ công nghiệp (#f4f5f2) với chữ monospace sắc nét, sơ đồ cánh tay robot SVG tương tác cho phép chọn từng khớp để xem thông số mô-men xoắn & cảm biến, lịch trình thử nghiệm và đăng ký tham quan lab.',
  },
  {
    id: 'phoenix-ignis',
    title: 'Myth Atlas 3D',
    category: 'Triển lãm',
    tone: 'light',
    image: '/assets/chat-showcase/phoenix-ignis.webp',
    prompt:
      'Thiết kế thư viện lưu trữ nghệ thuật & hiện vật Myth Atlas: nền giấy ngà cổ điển (#f5efe4) phối mực nâu đen và đỏ son, thanh tìm kiếm & lọc hiện vật theo thời kỳ, cửa sổ đọc hồ sơ chi tiết kèm hình minh họa đường nét SVG tinh xảo và chức năng lưu mục yêu thích.',
  },
  {
    id: 'fernhollow',
    title: 'Fernhollow 3D',
    category: 'Studio 3D',
    tone: 'dark',
    image: '/assets/chat-showcase/fernhollow.webp',
    prompt:
      'Thiết kế website cho studio sáng tạo bền vững Fernhollow: nền xanh rêu đêm (#0a1410) phối ánh sáng dịu hữu cơ, canvas hạt lá chuyển động êm ở hero, danh sách dự án sinh thái có chuyển đổi trước/sau và biểu mẫu gửi yêu cầu hợp tác kèm ước tính thời gian thực hiện.',
  },
  {
    id: 'living-portrait-hero',
    title: 'Mina Hồ sơ 3D',
    category: 'Hồ sơ 3D',
    tone: 'dark',
    image: '/assets/chat-showcase/living-portrait-hero.webp',
    prompt:
      'Thiết kế portfolio cá nhân cho Creative Developer & 3D Artist tên Mina: nền đen than tinh gọn, hiệu ứng chữ động ở hero, bộ lọc dự án theo kỹ năng (WebGL, Motion, UI Craft), cửa sổ xem case study chi tiết, thanh kinh nghiệm và nút sao chép email liên hệ nhanh.',
  },
  {
    id: 'macos-widget',
    title: 'Driftbar Ứng dụng',
    category: 'Ứng dụng',
    tone: 'light',
    image: '/assets/chat-showcase/macos-widget.webp',
    prompt:
      'Thiết kế trang ra mắt ứng dụng ghi chú thanh menu máy tính Driftbar: nền sáng sạch sẽ kiểu ứng dụng desktop cao cấp, bản demo widget tương tác ngay trên trang cho phép gõ thêm ghi chú, đánh dấu hoàn thành & tìm nhanh bằng phím tắt, bảng so sánh gói Cá nhân/Đội nhóm và nút tải về.',
  },
  {
    id: 'gold-standard',
    title: 'Soscale Thương hiệu',
    category: 'Thương hiệu',
    tone: 'dark',
    image: '/assets/chat-showcase/gold-standard.webp',
    prompt:
      'Thiết kế trang agency định vị thương hiệu Soscale: nền đen tuyền phối điểm nhấn vàng đồng tinh tế (#d8a962), typography khổ lớn kiểu tạp chí, dải case study tương tác cho phép bật tắt góc nhìn Chiến lược / Nhận diện / Tăng trưởng và form đặt lịch trao đổi dự án.',
  },
  {
    id: 'vante-ribbon-hero',
    title: 'Vante Portfolio',
    category: 'Portfolio',
    tone: 'dark',
    image: '/assets/chat-showcase/vante-ribbon-hero.webp',
    prompt:
      'Thiết kế trang studio thiết kế chuyển động Vante: nền tối tương phản cao kèm dải sóng vector mượt trên HTML5 Canvas, khu thư viện hiệu ứng tương tác cho phép chỉnh tốc độ & độ đàn hồi trực tiếp bằng thanh trượt, quy trình 4 giai đoạn và khu liên hệ nhanh.',
  },
  {
    id: 'aurex-finance',
    title: 'Aurex Tài chính',
    category: 'Tài chính',
    tone: 'dark',
    image: '/assets/chat-showcase/aurex-finance.webp',
    prompt:
      'Thiết kế trang ứng dụng quản lý tài chính cá nhân & đầu tư Aurex: nền xanh đen sâu sang trọng với thẻ kim loại nghiêng 3D theo chuột, công cụ tính lãi kép tương tác cập nhật biểu đồ tăng trưởng SVG theo thời gian thực, khối bảo mật đa lớp và form mở tài khoản.',
  },
  {
    id: 'keylight',
    title: 'Keylight Bảo mật',
    category: 'SaaS',
    tone: 'light',
    image: '/assets/chat-showcase/keylight.webp',
    prompt:
      'Thiết kế trang nền tảng xác thực không mật khẩu Keylight: bố cục chia đôi sáng-tối sắc nét, mô phỏng quy trình đăng nhập Passkey tương tác từng bước ngay trên trang, bảng kiểm tra độ mạnh chính sách bảo mật và khu bảng giá minh bạch.',
  },
  {
    id: 'data-signal',
    title: 'Vantage Dữ liệu',
    category: 'Dữ liệu',
    tone: 'dark',
    image: '/assets/chat-showcase/data-signal.webp',
    prompt:
      'Thiết kế trang nền tảng phân tích dữ liệu thời gian thực Vantage: nền tối ấm (#110d0b) với điểm nhấn cam hổ phách, bảng điều khiển mẫu tương tác cho phép lọc theo 24h / 7 ngày / 30 ngày làm mới số liệu và biểu đồ đường SVG, cùng biểu mẫu đặt lịch demo.',
  },
  {
    id: 'cyber-layer',
    title: 'Cyber Layer',
    category: 'An ninh',
    tone: 'dark',
    image: '/assets/chat-showcase/cyber-layer.webp',
    prompt:
      'Thiết kế trang giải pháp tường lửa & giám sát hệ thống Cyber Layer: nền tối kỹ thuật sắc gọn, bản đồ luồng lưu lượng trực tiếp trên Canvas, công tắc mô phỏng chặn tấn công DDoS cập nhật nhật ký sự kiện thời gian thực, bảng SLA và form tư vấn doanh nghiệp.',
  },
  {
    id: 'driftlab-hero',
    title: 'Driftlab Sáng tạo',
    category: 'Tương tác',
    tone: 'light',
    image: '/assets/chat-showcase/driftlab-hero.webp',
    prompt:
      'Thiết kế website cho xưởng thiết kế web tương tác Driftlab: nền sáng kem hiện đại (#f7f5f0) kết hợp chữ đen đậm và điểm nhấn xanh ngọc, phòng thí nghiệm tương tác (playground) cho phép người xem thử trực tiếp 3 hiệu ứng con trỏ/lò xo/chữ động, danh mục dự án có lọc và biểu mẫu gửi brief kèm ước tính ngân sách.',
  },
  {
    id: 'pet-diagnostics',
    title: 'Pet Care Y tế',
    category: 'Dịch vụ',
    tone: 'light',
    image: '/assets/chat-showcase/pet-diagnostics.webp',
    prompt:
      'Thiết kế trang phòng khám thú y hiện đại Pet Care: nền sáng ấm thân thiện (#faf7f2) phối xanh lá dịu và cam đất, chọn loại thú cưng (Chó / Mèo) để xem lịch tiêm phòng & gói khám phù hợp, giới thiệu bác sĩ và form đặt lịch hẹn chọn ngày giờ có xác nhận ngay.',
  },
  {
    id: 'real-time-alerts',
    title: 'Signal Cảnh báo',
    category: 'Công nghệ',
    tone: 'light',
    image: '/assets/chat-showcase/real-time-alerts.webp',
    prompt:
      'Thiết kế trang công cụ giám sát uptime & cảnh báo sự cố Signal: nền trắng sắc nét kiểu Linear/Stripe, bảng trạng thái dịch vụ tương tác cho phép kích hoạt thử một cảnh báo mẫu để xem luồng thông báo Slack/SMS, thanh đo độ trễ p99 và đăng ký dùng miễn phí.',
  },
  {
    id: 'orbit-flora',
    title: 'Orbit Poster',
    category: 'Sự kiện',
    tone: 'dark',
    image: '/assets/chat-showcase/orbit-flora.webp',
    prompt:
      'Thiết kế trang triển lãm nghệ thuật số & âm thanh Orbit 2026: bố cục poster tương phản cao nền tối, đồ họa hình học chuyển động mượt trên Canvas, lịch trình chia tab theo Ngày 1 / Ngày 2 / Workshop, hồ sơ nghệ sĩ tham gia và trình chọn hạng vé giữ chỗ trực tiếp.',
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
