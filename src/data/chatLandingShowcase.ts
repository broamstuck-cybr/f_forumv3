export interface ChatLandingShowcaseItem {
  id: string;
  title: string;
  category: string;
  tone: 'light' | 'dark';
  image: string;
  prompt: string;
}

interface MotionSiteFullRecord {
  id?: string;
  slug?: string;
  title?: string;
  category?: string;
  promptText?: string;
  css?: string;
}

interface MotionSitesFullPayload {
  items?: Record<string, MotionSiteFullRecord> | MotionSiteFullRecord[];
}

export const CHAT_LANDING_SHOWCASE: readonly ChatLandingShowcaseItem[] = [
  {
    id: 'monolith-hero',
    title: 'Stratum Kiến trúc',
    category: 'Kiến trúc',
    tone: 'dark',
    image: '/assets/chat-showcase/monolith-hero.webp',
    prompt:
      '[Mẫu gốc: Stratum Kiến trúc · motionsites/monolith-hero]\n' +
      'Thiết kế website tiếng Việt hoàn chỉnh cho studio kiến trúc đương đại Stratum, kế thừa tinh thần hình khối nguyên khối tối giản và tương phản đá tối (#15131b) phối be ấm (#e8d1cb) cùng chữ hiển thị sắc nét kiểu Chakra Petch + sans gọn.\n' +
      'Bố cục & trải nghiệm: Hero toàn màn hình với mặt cắt kiến trúc SVG/Canvas chuyển động êm theo cuộn và bảng chọn 6 chương trình không gian (Tầm nhìn, Biểu đạt, Thủ công, Tinh chỉnh, Cân bằng, Nguồn cội). Mở rộng thêm lưới dự án có bộ lọc loại hình (Nhà ở, Bảo tàng, Công cộng), ngăn kéo xem bản vẽ chi tiết và form đặt lịch tư vấn kiến trúc sư. Đáp ứng tốt 390px/768px/1440px, mọi nút tương tác hoạt động thật qua src/app.js.',
  },
  {
    id: 'lumen-roof-hero',
    title: 'Lumen Năng lượng',
    category: 'Năng lượng',
    tone: 'dark',
    image: '/assets/chat-showcase/lumen-roof-hero.webp',
    prompt:
      '[Mẫu gốc: Lumen Năng lượng · motionsites/lumen-roof-hero]\n' +
      'Thiết kế website tiếng Việt hoàn chỉnh cho giải pháp mái ngói năng lượng mặt trời Lumen Roof, giữ nguyên cơ chế chuyển cảnh Sáng/Đêm qua làn sương mù (Solar Fog) với nền than sâu (#0b1426, #0d1117), ánh lục non (#d8ee8e, #6d8f2a) và chữ Instrument Sans / Be Vietnam Pro.\n' +
      'Bố cục & tương tác: Hero có nút chuyển Ngày / Đêm làm công trình chìm nhẹ vào lớp sương Canvas/WebGL rồi nổi lên trong ánh sáng mới; mở rộng thêm máy tính sản lượng kWh & tiền điện tiết kiệm theo diện tích mái (m²), biểu đồ SVG 12 tháng, thông số tấm pin và form đặt khảo sát mái nhà. Đáp ứng tốt 390px/768px/1440px với JS tương tác thật trong src/app.js.',
  },
  {
    id: 'halden-port-hero',
    title: 'Halden Trợ lý AI',
    category: 'SaaS',
    tone: 'light',
    image: '/assets/chat-showcase/halden-port-hero.webp',
    prompt:
      '[Mẫu gốc: Halden Trợ lý AI · motionsites/halden-port-hero]\n' +
      'Thiết kế landing page tiếng Việt cho nền tảng trợ lý AI điều phối vận hành Halden, lấy cảm hứng từ vầng sáng xanh da trời dạng vòm (#8fd5f1, #d2daff, #3f7cff) trên nền trắng sứ tối giản (#ffffff) với thanh điều hướng viên thuốc nổi và nút CTA chấm sáng mở rộng thành mũi tên khi hover.\n' +
      'Bố cục & tương tác: Hero sáng thoáng, dải tuyên ngôn chữ hiện dần theo nhịp cuộn dẫn sang khối tương phản xanh đêm (#0a1528) chia 2 cột kèm hộp thử lệnh AI trực tiếp, lưới 4 tính năng cốt lõi, bảng chuyển đổi gói Tháng/Năm và form đăng ký dùng thử. Đáp ứng 390px/768px/1440px, JS tương tác thật trong src/app.js.',
  },
  {
    id: 'planetary-pulse',
    title: 'Terranova Kính lỏng',
    category: 'Khoa học',
    tone: 'light',
    image: '/assets/chat-showcase/planetary-pulse.webp',
    prompt:
      '[Mẫu gốc: Terranova Kính lỏng · motionsites/planetary-pulse]\n' +
      'Thiết kế trang dữ liệu khí hậu & sinh thái Terranova theo thẩm mỹ kính lỏng khúc xạ ánh sáng trên nền sáng mát (#f5f4f0, #c2ccd3) phối mực đen đậm (#000) và đường kẻ dọc kiến trúc tinh tế.\n' +
      'Bố cục & tương tác: Hero có quả địa cầu / bong bóng ánh sắc chuyển động mượt trên Canvas 2D kèm thẻ kính lỏng nổi bật và menu trượt toàn màn hình; mở rộng thêm bộ chọn vùng khí hậu (Châu Á, Thái Bình Dương, Châu Âu) cập nhật trực tiếp biểu đồ SVG nhiệt độ & độ ẩm, dòng thời gian nghiên cứu và đăng ký nhận bản tin khoa học.',
  },
  {
    id: 'redline-mars-hero',
    title: 'Mars Du hành 3D',
    category: '3D Web',
    tone: 'dark',
    image: '/assets/chat-showcase/redline-mars-hero.webp',
    prompt:
      '[Mẫu gốc: Mars Du hành 3D · motionsites/redline-mars-hero]\n' +
      'Thiết kế trang triển lãm & đặt chỗ du hành sao Hỏa Redline, tái hiện hành trình 3 bước trên nền cam đất nung đậm (#c94a1f) và kem cát ấm (#e9dfd2) với chữ hiển thị khổ lớn.\n' +
      'Bố cục & tương tác: Hero vẽ địa hình hành tinh & đường đồng mức trên Canvas phản hồi theo con trỏ chuột; thanh chọn 3 vùng đáp (Tharsis, Olympus, Valles Marineris) cập nhật tọa độ, trọng lực và áp suất khí quyển theo thời gian thực, kèm bảng lịch trình chuyến bay, chọn hạng khoang tàu và thẻ giữ chỗ tương tác.',
  },
  {
    id: 'vell-lookbook',
    title: 'Vell Thời trang',
    category: 'Thời trang',
    tone: 'light',
    image: '/assets/chat-showcase/vell-lookbook.webp',
    prompt:
      '[Mẫu gốc: Vell Thời trang · motionsites/vell-lookbook]\n' +
      'Thiết kế lookbook bộ sưu tập thời trang Maison Vell theo bố cục tạp chí biên tập chiều sâu (Runway Depth) trên nền sương lạnh thanh lịch (#eef4f9, #f6f9fc) phối chữ than chì (#16191f, #737b86).\n' +
      'Bố cục & tương tác: Sân khấu lookbook có số thứ tự bộ trang phục lớn ở góc dưới, cột sản phẩm đồng bộ khi kéo/bấm phím mũi tên, bộ lọc chất liệu (Linen, Lụa tơ tằm, Len dệt), ngăn kéo xem chi tiết đường may & bảng kích cỡ và form đặt lịch thử đồ tại showroom.',
  },
  {
    id: 'ai-runtime',
    title: 'AI Runtime',
    category: 'Nền tảng AI',
    tone: 'dark',
    image: '/assets/chat-showcase/ai-runtime.webp',
    prompt:
      '[Mẫu gốc: AI Runtime · motionsites/ai-runtime]\n' +
      'Thiết kế trang hạ tầng vận hành mô hình AI Runtime trên nền đen sâu (#000000) phối chữ trắng (#ffffff), xám kỹ thuật (#8e8e8e) và thanh điều hướng viên thuốc trắng tương phản cao (#28282a).\n' +
      'Bố cục & tương tác: Hero chia 3 tầng dọc gọn gàng kèm hiệu ứng trường hạt/sóng năng lượng trên Canvas; mở rộng khu terminal tương tác cho phép chuyển tab mã gọi API (cURL, TypeScript, Python) với nút sao chép thật, bảng so sánh độ trễ theo khu vực và thanh tính chi phí token trực tiếp.',
  },
  {
    id: 'medusa-jellyfish-hero',
    title: 'Medusa Robotics',
    category: 'Robotics',
    tone: 'light',
    image: '/assets/chat-showcase/medusa-jellyfish-hero.webp',
    prompt:
      '[Mẫu gốc: Medusa Robotics · motionsites/medusa-jellyfish-hero]\n' +
      'Thiết kế trang mô phỏng kỹ thuật phòng thí nghiệm Medusa JF-4 theo phong cách bảng điều khiển sáng kỹ thuật (#f1fbfa, #e3f4f3) phối mực xanh ngọc đậm (#0e3a3d), điểm nhấn san hô (#ff5a3c) và chữ monospace sắc nét.\n' +
      'Bố cục & tương tác: Mô hình sứa robot đa khớp vẽ bằng SVG/Canvas ở trung tâm với thanh tua tiến trình tháo lắp từng cụm cơ khí, cho phép bấm từng bộ phận để xem mô-men xoắn & cảm biến, kèm nhật ký thử nghiệm và form đăng ký tham quan lab.',
  },
  {
    id: 'phoenix-ignis',
    title: 'Myth Atlas 3D',
    category: 'Triển lãm',
    tone: 'light',
    image: '/assets/chat-showcase/phoenix-ignis.webp',
    prompt:
      '[Mẫu gốc: Myth Atlas 3D · motionsites/phoenix-ignis]\n' +
      'Thiết kế từ điển trực quan & triển lãm sinh vật huyền thoại Myth Atlas với bố cục 3 cột cân đối (thanh mục lục trái, sân khấu minh họa trung tâm, bảng hồ sơ chi tiết bên phải) trên nền giấy sáng ấm.\n' +
      'Bố cục & tương tác: Thanh tìm kiếm và lọc hiện vật theo chương/thời kỳ, minh họa đường nét SVG/Canvas tương tác theo chuột, cửa sổ đọc hồ sơ chi tiết và nút lưu mục yêu thích hoạt động thật qua JS.',
  },
  {
    id: 'fernhollow',
    title: 'Fernhollow 3D',
    category: 'Studio 3D',
    tone: 'dark',
    image: '/assets/chat-showcase/fernhollow.webp',
    prompt:
      '[Mẫu gốc: Fernhollow 3D · motionsites/fernhollow]\n' +
      'Thiết kế website cho studio thiết kế sinh thái bền vững Fernhollow trên nền thung lũng đêm xanh rêu trầm sâu phối ánh sáng dịu hữu cơ.\n' +
      'Bố cục & tương tác: Canvas hạt đom đóm/cánh hoa chuyển động êm phía sau lớp chữ tối giản; mở rộng danh mục dự án có nút so sánh Trước / Sau, bảng quy trình vật liệu tuần hoàn và form gửi brief hợp tác kèm ước tính thời gian triển khai.',
  },
  {
    id: 'living-portrait-hero',
    title: 'Mina Hồ sơ 3D',
    category: 'Hồ sơ 3D',
    tone: 'dark',
    image: '/assets/chat-showcase/living-portrait-hero.webp',
    prompt:
      '[Mẫu gốc: Mina Hồ sơ 3D · motionsites/living-portrait-hero]\n' +
      'Thiết kế portfolio cá nhân cho Creative Developer & 3D Artist tên Mina trên nền than tối (#0C0C0C), chữ gradient kim loại (#646973 đến #BBCCD7) và kiểu chữ Kanit / Be Vietnam Pro dứt khoát.\n' +
      'Bố cục & tương tác: Hero toàn màn hình kèm khung chân dung tương tác theo chuột, dải marquee kỹ năng, khu dịch vụ & gói hợp tác, bộ lọc dự án (WebGL, Motion, UI Craft), ngăn kéo case study chi tiết và nút sao chép email nhanh.',
  },
  {
    id: 'macos-widget',
    title: 'Driftbar Ứng dụng',
    category: 'Ứng dụng',
    tone: 'light',
    image: '/assets/chat-showcase/macos-widget.webp',
    prompt:
      '[Mẫu gốc: Driftbar Ứng dụng · motionsites/macos-widget]\n' +
      'Thiết kế trang giới thiệu ứng dụng ghi chú thanh menu Driftbar trên nền sáng thanh thoát phong cách desktop cao cấp.\n' +
      'Bố cục & tương tác: Nhúng ngay bản demo widget tương tác trực tiếp cho phép gõ thêm ghi chú, đánh dấu hoàn thành, lọc nhanh theo thẻ và thử phím tắt; kèm phần tính năng nổi bật, so sánh gói Cá nhân / Nhóm và nút tải xuống.',
  },
  {
    id: 'gold-standard',
    title: 'Soscale Thương hiệu',
    category: 'Thương hiệu',
    tone: 'dark',
    image: '/assets/chat-showcase/gold-standard.webp',
    prompt:
      '[Mẫu gốc: Soscale Thương hiệu · motionsites/gold-standard]\n' +
      'Thiết kế landing page cho agency định vị thương hiệu Soscale trên nền đen tuyền phối dải chữ cắt khoét táo bạo và điểm nhấn vàng đồng ấm.\n' +
      'Bố cục & tương tác: Typography tỷ lệ lớn co giãn theo khung hình, dải case study tương tác cho phép chuyển góc nhìn Chiến lược / Nhận diện / Tăng trưởng, chỉ số hiệu quả rõ ràng và biểu mẫu đặt lịch trao đổi.',
  },
  {
    id: 'vante-ribbon-hero',
    title: 'Vante Portfolio',
    category: 'Portfolio',
    tone: 'dark',
    image: '/assets/chat-showcase/vante-ribbon-hero.webp',
    prompt:
      '[Mẫu gốc: Vante Portfolio · motionsites/vante-ribbon-hero]\n' +
      'Thiết kế trang studio thiết kế chuyển động Vante trên nền tối tương phản cao kèm dải ruy-băng thẻ dự án uốn lượn theo tiến trình cuộn trên Canvas.\n' +
      'Bố cục & tương tác: Phòng thử nghiệm hiệu ứng cho phép chỉnh tốc độ & độ đàn hồi trực tiếp bằng thanh trượt, quy trình 4 bước thực thi và khu liên hệ nhanh.',
  },
  {
    id: 'aurex-finance',
    title: 'Aurex Tài chính',
    category: 'Tài chính',
    tone: 'dark',
    image: '/assets/chat-showcase/aurex-finance.webp',
    prompt:
      '[Mẫu gốc: Aurex Tài chính · motionsites/aurex-finance]\n' +
      'Thiết kế trang nền tảng quản lý tài sản & tài chính số Aurex trên nền đen thuần (#000000) phối điểm nhấn xanh băng sắc lạnh (#AFDDFF) và kiểu chữ Manrope tinh gọn.\n' +
      'Bố cục & tương tác: Thanh điều hướng đánh số kỹ thuật, thẻ trạng thái kết nối, thẻ kim loại nghiêng 3D theo chuột, công cụ tính lãi kép & phân bổ danh mục cập nhật biểu đồ SVG thời gian thực và form mở tài khoản.',
  },
  {
    id: 'keylight',
    title: 'Keylight Bảo mật',
    category: 'SaaS',
    tone: 'light',
    image: '/assets/chat-showcase/keylight.webp',
    prompt:
      '[Mẫu gốc: Keylight Bảo mật · motionsites/keylight]\n' +
      'Thiết kế trang nền tảng xác thực không mật khẩu Keylight theo bố cục chia đôi bất đối xứng: cột trái 41% nền xanh đêm với luồng sáng ấm hắt qua lỗ khóa và dải thẻ đánh giá kính mờ chạy êm; cột phải nền sáng gọn gàng.\n' +
      'Bố cục & tương tác: Mô phỏng quy trình đăng nhập Passkey tương tác từng bước ngay trên trang, công cụ kiểm tra chính sách bảo mật, bảng giá minh bạch và form đăng ký.',
  },
  {
    id: 'data-signal',
    title: 'Vantage Dữ liệu',
    category: 'Dữ liệu',
    tone: 'dark',
    image: '/assets/chat-showcase/data-signal.webp',
    prompt:
      '[Mẫu gốc: Vantage Dữ liệu · motionsites/data-signal]\n' +
      'Thiết kế trang nền tảng phân tích tín hiệu dữ liệu Vantage trên nền tối thuần (#000000) với bố cục neo góc dưới-trái táo bạo và cửa sổ kính mờ tối giản.\n' +
      'Bố cục & tương tác: Bảng điều khiển mẫu tương tác cho phép chuyển khung thời gian (24h / 7 ngày / 30 ngày) làm mới biểu đồ đường SVG & chỉ số cảnh báo theo thời gian thực, kèm khối tích hợp SDK và form đặt lịch demo.',
  },
  {
    id: 'cyber-layer',
    title: 'Cyber Layer',
    category: 'An ninh',
    tone: 'dark',
    image: '/assets/chat-showcase/cyber-layer.webp',
    prompt:
      '[Mẫu gốc: Cyber Layer · motionsites/cyber-layer]\n' +
      'Thiết kế trang giải pháp an ninh mạng đa tầng Cyber Layer trên nền đen tuyệt đối (#000000) phối chữ trắng (#ffffff), nhãn monospace (#949494) và điểm nhấn đỏ kỹ thuật (#c81b1c), không bo tròn rườm rà.\n' +
      'Bố cục & tương tác: Nhịp xuất hiện từng lớp sắc gọn, bản đồ luồng lưu lượng trên Canvas, công tắc mô phỏng chặn tấn công cập nhật nhật ký sự kiện trực tiếp, bảng SLA và form tư vấn doanh nghiệp.',
  },
  {
    id: 'driftlab-hero',
    title: 'Driftlab Sáng tạo',
    category: 'Tương tác',
    tone: 'light',
    image: '/assets/chat-showcase/driftlab-hero.webp',
    prompt:
      '[Mẫu gốc: Driftlab Sáng tạo · motionsites/driftlab-hero]\n' +
      'Thiết kế website cho xưởng thiết kế tương tác Driftlab trên nền tím phấn nhẹ (#dcd8f4) tương phản chữ đen đậm (#0b0b10) và kiểu chữ Space Mono kết hợp display cô đặc.\n' +
      'Bố cục & tương tác: Dải chữ cong trôi theo nhịp cuộn, khu playground cho phép thử trực tiếp 3 hiệu ứng con trỏ / lò xo / dải chữ, danh mục dự án có lọc và biểu mẫu gửi brief kèm ước tính ngân sách.',
  },
  {
    id: 'pet-diagnostics',
    title: 'Pet Care Y tế',
    category: 'Dịch vụ',
    tone: 'light',
    image: '/assets/chat-showcase/pet-diagnostics.webp',
    prompt:
      '[Mẫu gốc: Pet Care Y tế · motionsites/pet-diagnostics]\n' +
      'Thiết kế trang hệ thống xét nghiệm & chăm sóc thú cưng Lume Pet Care trên nền sáng ấm tự nhiên phối xanh ô-liu trầm (#20200f) và chữ trắng/kem thanh lịch.\n' +
      'Bố cục & tương tác: Chọn loại thú cưng (Chó / Mèo) để xem các chỉ số sức khỏe & gói tầm soát phù hợp, danh sách bác sĩ phụ trách và form đặt lịch hẹn chọn ngày giờ xác nhận ngay.',
  },
  {
    id: 'real-time-alerts',
    title: 'Signal Cảnh báo',
    category: 'Công nghệ',
    tone: 'light',
    image: '/assets/chat-showcase/real-time-alerts.webp',
    prompt:
      '[Mẫu gốc: Signal Cảnh báo · motionsites/real-time-alerts]\n' +
      'Thiết kế trang công cụ giám sát uptime & cảnh báo sự cố Signal trên nền sáng sắc nét tỷ lệ chuẩn desktop 1464×949 với bảng trạng thái và SVG kỹ thuật tinh gọn.\n' +
      'Bố cục & tương tác: Bảng dịch vụ tương tác cho phép kích hoạt thử một cảnh báo mẫu để xem luồng thông báo Slack/SMS, thanh đo độ trễ p99 trực quan và form đăng ký dùng thử.',
  },
  {
    id: 'orbit-flora',
    title: 'Orbit Poster',
    category: 'Sự kiện',
    tone: 'dark',
    image: '/assets/chat-showcase/orbit-flora.webp',
    prompt:
      '[Mẫu gốc: Orbit Poster · motionsites/orbit-flora]\n' +
      'Thiết kế trang triển lãm nghệ thuật số & hệ thống Orbit trên nền than tối (#161616) phối chữ trắng (#ffffff) và hiệu ứng hé lộ hình ảnh biến hình theo con trỏ chuột (morph trail).\n' +
      'Bố cục & tương tác: Bố cục poster chữ khổ lớn phân tầng z-index chuẩn xác, đồ họa hoa/hình học tương tác trên Canvas, lịch trình chia tab Ngày 1 / Ngày 2 / Workshop, hồ sơ nghệ sĩ và bộ chọn hạng vé giữ chỗ.',
  },
];

let motionSitesFullPromise: Promise<MotionSiteFullRecord[] | null> | null = null;
const formattedPromptCache = new Map<string, string>();

function normalizeRecordList(payload: MotionSitesFullPayload | null): MotionSiteFullRecord[] {
  if (!payload || !payload.items) return [];
  if (Array.isArray(payload.items)) return payload.items;
  return Object.values(payload.items);
}

async function fetchMotionSitesFullList(): Promise<MotionSiteFullRecord[] | null> {
  if (!motionSitesFullPromise) {
    motionSitesFullPromise = fetch('/data/motionsites-full.json')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<MotionSitesFullPayload>;
      })
      .then((payload) => {
        const list = normalizeRecordList(payload);
        return list.length > 0 ? list : null;
      })
      .catch(() => {
        motionSitesFullPromise = null;
        return null;
      });
  }
  return motionSitesFullPromise;
}

function fixMojibake(text: string): string {
  return text
    .replace(/‚Äî/g, '—')
    .replace(/‚Äì/g, '–')
    .replace(/‚Äô/g, "'")
    .replace(/‚Äú|‚Äù/g, '"')
    .replace(/√ó/g, '×');
}

function cleanRawSpec(raw: string): string {
  let text = fixMojibake(raw).replace(/\r\n/g, '\n');

  const cutPatterns = [
    /^#{1,3}\s+(?:Complete code|AUTHORITATIVE SOURCE|Full code|Interface code|Complete source|Appendix)\b/im,
    /^##\s+\d+\.\s+(?:Complete|Full)\s+code\b/im,
  ];
  for (const pat of cutPatterns) {
    const match = text.match(pat);
    if (match && typeof match.index === 'number' && match.index > 300) {
      text = text.slice(0, match.index);
    }
  }

  // WHY: Keep concise CSS token/font snippets (<= 340 chars) while dropping large verbatim source code blocks.
  text = text.replace(/```[a-zA-Z0-9_-]*\n([\s\S]*?)```/g, (full, body: string) => {
    const hasLongUrl = /https?:\/\/[^\s]{40,}/.test(body);
    if (body.length > 340 || hasLongUrl) return '';
    return full;
  });

  text = text.replace(
    /^#{1,3}\s+(?:\d+\)\s*|\d+\.\s*)?(?:Assets|Images|Videos|Media|File structure|Project setup|Exact background video|The hero media|The two image URLs)[^\n]*\n[\s\S]*?(?=\n#{1,3}\s|$)/gim,
    ''
  );

  text = text.replace(
    /https?:\/\/(?:pub-[^\s)"']+|d8j0ntlcm91z4\.cloudfront\.net[^\s)"']+|cdn\.[^\s)"']+|images\.[^\s)"']+|[^\s)"']+\.(?:mp4|webm|webp|png|jpg|jpeg|woff2|ttf|otf))(?:\?[^\s)"']*)?/gi,
    ''
  );

  const metaBans = [
    /^#\s+.*?(?:exact recreation prompt|recreate .*? exactly|exact spec).*$/gim,
    /Copy everything below the line[^.\n]*\./gi,
    /Reproduce every value, string and timing exactly[^.\n]*\./gi,
    /This is a fidelity task[^.\n]*\./gi,
    /Do not add sections[^.\n]*\./gi,
    /Build only this one page[^.\n]*\./gi,
    /The complete `?index\.html`? appended[^.\n]*\./gi,
    /The CSS, markup and script are given verbatim[^.\n]*\./gi,
    /Copy it byte-for-byte[^.\n]*\./gi,
    /Keep it local; do not publish or deploy it\./gi,
    /Match (?:the current implementation|layout, type, color[^.]*) exactly\./gi,
    /The entire page is ONE component[^.\n]*\./gi,
    /Plain HTML, CSS and one vanilla script[^.\n]*\./gi,
    /The only external resources are[^.\n]*\./gi,
  ];
  for (const ban of metaBans) {
    text = text.replace(ban, '');
  }

  return text
    .split('\n')
    .filter((line) => !/^\s*[-*]\s*(?:\*\*[^*]+:\*\*\s*)?`?\s*`?\s*$/i.test(line))
    .join('\n')
    .replace(/^\s*---\s*$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function splitSpecSections(cleaned: string): Array<{ heading: string; text: string }> {
  const lines = cleaned.split('\n');
  const sections: Array<{ heading: string; text: string }> = [];
  let current: { heading: string; body: string[] } = { heading: 'Concept', body: [] };

  for (const line of lines) {
    const hMatch =
      line.match(/^#{1,3}\s+(.+)$/) || line.match(/^([A-Z][A-Z0-9\s/&:-]{3,42})$/);
    if (hMatch) {
      const joined = current.body.join('\n').trim();
      if (joined) {
        sections.push({ heading: current.heading, text: joined });
      }
      current = { heading: hMatch[1].trim(), body: [] };
    } else {
      current.body.push(line);
    }
  }

  const tail = current.body.join('\n').trim();
  if (tail) {
    sections.push({ heading: current.heading, text: tail });
  }
  return sections;
}

function clipCleanly(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text.trim();
  const slice = text.slice(0, maxLen);

  const paraBreak = slice.lastIndexOf('\n\n');
  if (paraBreak > maxLen * 0.58) {
    return slice.slice(0, paraBreak).trim();
  }

  // Avoid cutting right after a list number like "2."
  const sentenceMatches = Array.from(slice.matchAll(/(?<!\b\d)\.\s+(?=[A-ZÀ-Ỹ`"*])/g));
  const lastSentence = sentenceMatches[sentenceMatches.length - 1];
  if (lastSentence && typeof lastSentence.index === 'number' && lastSentence.index > maxLen * 0.56) {
    return slice.slice(0, lastSentence.index + 1).trim();
  }

  const lineBreak = slice.lastIndexOf('\n');
  if (lineBreak > maxLen * 0.62) {
    return slice.slice(0, lineBreak).trim();
  }

  const lastSpace = slice.lastIndexOf(' ');
  return (lastSpace > maxLen * 0.7 ? slice.slice(0, lastSpace) : slice).trim();
}

function formatMasterpiecePrompt(
  item: ChatLandingShowcaseItem,
  raw: MotionSiteFullRecord
): string {
  const header = `[Mẫu gốc: ${item.title} · motionsites/${item.id}]`;
  const cleaned = cleanRawSpec(raw.promptText || '');
  if (!cleaned) return item.prompt;

  const sections = splitSpecSections(cleaned).filter(
    (s) => !/^(?:\d+\.\s*)?(?:project setup|metadata|reset|acceptance check)$/i.test(s.heading)
  );
  if (sections.length === 0) return item.prompt;

  const priorityRx =
    /(token|color|palette|font|typography|css variable|layout|structure|scene|hero|stage|layer|switch|motion|scroll|shader|interaction|control|responsive|ribbon|depth|tour|panel|section|card|grid)/i;

  const picked: string[] = [];
  const maxTotal = 4200;
  let usedLen = header.length + 140;

  const lead = clipCleanly(sections[0].text, 1450);
  if (lead) {
    picked.push(lead);
    usedLen += lead.length + 2;
  }

  const rest = sections.slice(1);
  const prioritized = rest.filter(
    (s) => priorityRx.test(s.heading) || priorityRx.test(s.text.slice(0, 160))
  );
  const remaining = rest.filter((s) => !prioritized.includes(s));

  for (const sec of [...prioritized, ...remaining]) {
    if (usedLen >= maxTotal - 180) break;
    const budget = Math.min(620, maxTotal - usedLen - sec.heading.length - 10);
    if (budget < 120) break;
    const excerpt = clipCleanly(sec.text, budget);
    if (excerpt.length < 40) continue;
    picked.push(`${sec.heading}: ${excerpt}`);
    usedLen += sec.heading.length + excerpt.length + 4;
  }

  const tailNote =
    'Yêu cầu bản Việt hóa: giữ trung thành tinh thần thẩm mỹ, bảng màu, nhịp chuyển động và tương tác của đặc tả mẫu gốc ở trên; nội dung hiển thị bằng tiếng Việt tự nhiên, responsive 390px/768px/1440px và lắp ghép thêm mô-đun thật từ kho F-Forum Vault.';
  const full = `${header}\n${picked.join('\n\n')}\n\n${tailNote}`;
  const finalized = clipCleanly(full, 4300);
  return finalized.length >= 600 ? finalized : item.prompt;
}

export async function loadShowcaseFullPrompt(item: ChatLandingShowcaseItem): Promise<string> {
  const cached = formattedPromptCache.get(item.id);
  if (cached) return cached;

  const list = await fetchMotionSitesFullList();
  if (!list) return item.prompt;

  const matched = list.find(
    (entry) => entry.slug === item.id || entry.id === item.id || entry.id === `ms-${item.id}`
  );
  if (!matched || !matched.promptText) return item.prompt;

  const formatted = formatMasterpiecePrompt(item, matched);
  formattedPromptCache.set(item.id, formatted);
  return formatted;
}

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
