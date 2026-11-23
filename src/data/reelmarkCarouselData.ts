export type ShowcaseLibraryKind = 'PinUI' | 'Motion AI';
export type ShowcaseFilterMode = 'all' | ShowcaseLibraryKind;

export interface ShowcaseExperienceCard {
  id: string;
  sourceId: string;
  motionsitesSlug?: string;
  liveUrl?: string;
  library: ShowcaseLibraryKind;
  title: string;
  category: string;
  summaryVi: string;
  imageUrl: string;
  videoUrl?: string;
  fallbackUrl: string;
  promptText: string;
  hasLiveHtml?: boolean;
  accent?: string;
  tileIndex: number;
}

const FALLBACK_PREVIEW =
  'https://raw.githubusercontent.com/broamstuck-cybr/SOURCEOFKNOWLEDGFORAI/main/assets/previews/codefronts-course-card.png';

export const PINUI_EXPERIENCE_POOL: Array<Omit<ShowcaseExperienceCard, 'tileIndex'>> = [
  {
    id: 'pinui-presence-cards',
    sourceId: 'presence-cards',
    library: 'PinUI',
    title: 'Presence Cards',
    category: 'Tương tác nhóm',
    summaryVi: 'Thẻ trạng thái thành viên trực tuyến với chuyển động lò xo mượt mà.',
    imageUrl: '',
    fallbackUrl: FALLBACK_PREVIEW,
    promptText: 'Dựng cụm thẻ Presence Cards hiển thị trạng thái thành viên trực tuyến với hiệu ứng hover 3D.',
  },
  {
    id: 'pinui-theme-switch',
    sourceId: 'theme-switch',
    library: 'PinUI',
    title: 'Theme Switch',
    category: 'Vi tương tác',
    summaryVi: 'Bộ chuyển giao diện Sáng / Tối với 3 chế độ tương tác vật lý.',
    imageUrl: '',
    fallbackUrl: FALLBACK_PREVIEW,
    promptText: 'Tạo công tắc chuyển chế độ Sáng và Tối có phản hồi âm thanh và quán tính mượt.',
  },
  {
    id: 'pinui-reader-card',
    sourceId: 'reader-card',
    library: 'PinUI',
    title: 'Reader Card',
    category: 'Ấn phẩm số',
    summaryVi: 'Thẻ đọc bài viết tích hợp thanh tiến độ và lớp kính khúc xạ.',
    imageUrl: '',
    fallbackUrl: FALLBACK_PREVIEW,
    promptText: 'Thiết kế thẻ đọc tài liệu với mục lục trượt, thanh tiến độ và hiệu ứng kính mờ.',
  },
  {
    id: 'pinui-search-card',
    sourceId: 'search-card',
    library: 'PinUI',
    title: 'Search Card',
    category: 'Tìm kiếm nhanh',
    summaryVi: 'Hộp tra cứu nhanh theo phím tắt với bộ lọc kết quả tức thì.',
    imageUrl: '',
    fallbackUrl: FALLBACK_PREVIEW,
    promptText: 'Dựng thanh tìm kiếm nổi dạng Command Palette kèm lọc danh mục và phím tắt bàn phím.',
  },
  {
    id: 'pinui-selection-list',
    sourceId: 'selection-list',
    library: 'PinUI',
    title: 'Selection List',
    category: 'Danh sách chọn',
    summaryVi: 'Danh sách lựa chọn tương tác mượt với chỉ báo trượt đàn hồi.',
    imageUrl: '',
    fallbackUrl: FALLBACK_PREVIEW,
    promptText: 'Thiết kế danh sách chọn mục nhiều trạng thái với khung đánh dấu trượt mượt.',
  },
  {
    id: 'pinui-desk-computer',
    sourceId: 'desk-computer',
    library: 'PinUI',
    title: 'Desk Computer',
    category: 'Mô phỏng phần cứng',
    summaryVi: 'Trạm máy tính cổ điển tương tác bàn phím, màn hình CRT và âm thanh cơ học.',
    imageUrl: '',
    fallbackUrl: FALLBACK_PREVIEW,
    promptText: 'Dựng mô hình máy tính để bàn tương tác trực tiếp với màn hình và bàn phím cơ.',
  },
  {
    id: 'pinui-liquid-voice',
    sourceId: 'liquid-voice',
    library: 'PinUI',
    title: 'Liquid Voice',
    category: 'Âm thanh & Giọng nói',
    summaryVi: 'Giao diện thu âm giọng nói với sóng chất lỏng phản hồi theo tần số.',
    imageUrl: '',
    fallbackUrl: FALLBACK_PREVIEW,
    promptText: 'Thiết kế bộ ghi âm giọng nói AI với hiệu ứng cầu chất lỏng biến thiên theo âm lượng.',
  },
  {
    id: 'pinui-file-box',
    sourceId: 'file-box',
    library: 'PinUI',
    title: '3D File Box',
    category: 'Tổ chức dữ liệu',
    summaryVi: 'Hộp hồ sơ 3D mở nắp khi lướt chuột, phân loại tài liệu trực quan.',
    imageUrl: '',
    fallbackUrl: FALLBACK_PREVIEW,
    promptText: 'Tạo ngăn kéo hồ sơ 3D gồm 3 tờ tài liệu trượt lên khi người dùng di chuột vào.',
  },
  {
    id: 'pinui-copy-paste-pad',
    sourceId: 'copy-paste-pad',
    library: 'PinUI',
    title: 'Copy Paste Pad',
    category: 'Phím tắt vật lý',
    summaryVi: 'Bàn phím 3 phím cơ học Ctrl+C / Ctrl+V với hành trình phím thật.',
    imageUrl: '',
    fallbackUrl: FALLBACK_PREVIEW,
    promptText: 'Dựng bàn phím mini Copy Paste 3D với nắp phím phản hồi lực nhấn và đổi màu nền.',
  },
  {
    id: 'pinui-task-card',
    sourceId: 'task-card',
    library: 'PinUI',
    title: 'Task Card',
    category: 'Quản lý tác vụ',
    summaryVi: 'Thẻ nhiệm vụ hoàn thiện với hiệu ứng đánh dấu và sắp xếp ưu tiên.',
    imageUrl: '',
    fallbackUrl: FALLBACK_PREVIEW,
    promptText: 'Thiết kế thẻ công việc học tập có tiến độ, nhãn môn học và hoạt ảnh hoàn tất.',
  },
  {
    id: 'pinui-magnify',
    sourceId: 'magnify',
    library: 'PinUI',
    title: 'Magnify Lens',
    category: 'Thị giác & Soi chi tiết',
    summaryVi: 'Thấu kính phóng đại chi tiết giao diện theo vị trí con trỏ chuột.',
    imageUrl: '',
    fallbackUrl: FALLBACK_PREVIEW,
    promptText: 'Tạo thấu kính phóng đại trực tiếp vùng giao diện bên dưới con trỏ chuột.',
  },
  {
    id: 'pinui-progress-image',
    sourceId: 'progress-image',
    library: 'PinUI',
    title: 'Progress Image',
    category: 'Hiển thị đa phương tiện',
    summaryVi: 'Khung hình ảnh hiện dần theo tiến trình với hiệu ứng chiều sâu sắc nét.',
    imageUrl: '',
    fallbackUrl: FALLBACK_PREVIEW,
    promptText: 'Dựng khung hiển thị ảnh có thanh tiến trình nạp và hiệu ứng mở màn sắc nét.',
  },
  {
    id: 'pinui-prompt-composer',
    sourceId: 'prompt-composer',
    library: 'PinUI',
    title: 'Prompt Composer',
    category: 'Khung nhập liệu AI',
    summaryVi: 'Khung soạn thảo đa tác vụ với thẻ gợi ý và bộ chọn mô hình thông minh.',
    imageUrl: '',
    fallbackUrl: FALLBACK_PREVIEW,
    promptText: 'Thiết kế khung nhập prompt hai tầng tích hợp chọn tác vụ, đính kèm tệp và phím tắt.',
  },
  {
    id: 'pinui-calendar-card',
    sourceId: 'calendar-card',
    library: 'PinUI',
    title: 'Calendar Card',
    category: 'Lịch trình & Sự kiện',
    summaryVi: 'Thẻ lịch tháng tương tác với hiệu ứng lật ngày và ghi chú sự kiện.',
    imageUrl: '',
    fallbackUrl: FALLBACK_PREVIEW,
    promptText: 'Dựng thẻ lịch tương tác hỗ trợ chọn ngày, xem lịch hẹn và chuyển tháng mượt mà.',
  },
  {
    id: 'pinui-chat-room',
    sourceId: 'chat-room',
    library: 'PinUI',
    title: 'Chat Room',
    category: 'Phòng trao đổi',
    summaryVi: 'Khung trò chuyện trực tiếp với bóng tin nhắn đàn hồi và âm thanh tinh tế.',
    imageUrl: '',
    fallbackUrl: FALLBACK_PREVIEW,
    promptText: 'Thiết kế khung chat trực tiếp theo thời gian thực có phản hồi gõ phím và gửi nhanh.',
  },
  {
    id: 'pinui-dynamic-drop-zone',
    sourceId: 'dynamic-drop-zone',
    library: 'PinUI',
    title: 'Dynamic Drop Zone',
    category: 'Tải tệp & Kéo thả',
    summaryVi: 'Vùng kéo thả tệp thông minh với hiệu ứng hút từ tính và tiến trình tải.',
    imageUrl: '',
    fallbackUrl: FALLBACK_PREVIEW,
    promptText: 'Tạo vùng kéo thả tệp đa định dạng có hoạt ảnh mở rộng khi kéo tệp vào khung.',
  },
  {
    id: 'pinui-swap-card',
    sourceId: 'swap-card',
    library: 'PinUI',
    title: 'Swap Card',
    category: 'Quy đổi & Tương tác',
    summaryVi: 'Thẻ hoán đổi hai chiều với hiệu ứng xoay trục và cập nhật tức thì.',
    imageUrl: '',
    fallbackUrl: FALLBACK_PREVIEW,
    promptText: 'Thiết kế thẻ chuyển đổi hai chiều với nút đảo chiều xoay 180 độ và bảng chọn nhanh.',
  },
  {
    id: 'pinui-liquid-tabs',
    sourceId: 'liquid-tabs',
    library: 'PinUI',
    title: 'Liquid Tabs',
    category: 'Điều hướng mượt',
    summaryVi: 'Thanh chuyển tab với giọt chỉ báo đàn hồi theo vận tốc chuyển tab.',
    imageUrl: '',
    fallbackUrl: FALLBACK_PREVIEW,
    promptText: 'Tạo thanh tab điều hướng với viên nang nền co giãn mượt khi đổi giữa các mục.',
  },
  {
    id: 'pinui-thermal-dial',
    sourceId: 'thermal-dial',
    library: 'PinUI',
    title: 'Thermal Dial',
    category: 'Điều khiển xoay',
    summaryVi: 'Núm xoay nhiệt độ xúc giác với vạch chia phát sáng theo góc quay.',
    imageUrl: '',
    fallbackUrl: FALLBACK_PREVIEW,
    promptText: 'Dựng núm xoay điều chỉnh thông số hình tròn có vạch chia sáng dần theo thao tác kéo.',
  },
  {
    id: 'pinui-lamp-switch',
    sourceId: 'lamp-switch',
    library: 'PinUI',
    title: 'Lamp Switch',
    category: 'Vật lý & Ánh sáng',
    summaryVi: 'Dây kéo đèn tương tác mô phỏng lực kéo đàn hồi và ánh sáng lan tỏa.',
    imageUrl: '',
    fallbackUrl: FALLBACK_PREVIEW,
    promptText: 'Dựng công tắc dây kéo đèn mô phỏng đàn hồi vật lý bật tắt ánh sáng tức thì.',
  },
  {
    id: 'pinui-joystick',
    sourceId: 'joystick',
    library: 'PinUI',
    title: 'Tactile Joystick',
    category: 'Điều khiển 2D',
    summaryVi: 'Cần điều khiển xúc giác phản hồi góc nghiêng và lực hồi tâm mượt mà.',
    imageUrl: '',
    fallbackUrl: FALLBACK_PREVIEW,
    promptText: 'Tạo cần điều khiển ảo phản hồi theo tọa độ chuột/chạm và tự đàn hồi về tâm.',
  },
  {
    id: 'pinui-weather',
    sourceId: 'weather',
    library: 'PinUI',
    title: 'Weather Widget',
    category: 'Dữ liệu trực quan',
    summaryVi: 'Thẻ thời tiết sinh động thay đổi bầu trời và hiệu ứng mưa nắng theo trạng thái.',
    imageUrl: '',
    fallbackUrl: FALLBACK_PREVIEW,
    promptText: 'Thiết kế thẻ thời tiết tương tác chuyển đổi mượt giữa nắng, mây và mưa.',
  },
  {
    id: 'pinui-recorder',
    sourceId: 'recorder',
    library: 'PinUI',
    title: 'Audio Recorder',
    category: 'Ghi âm & Sóng âm',
    summaryVi: 'Bộ ghi âm tối giản với biểu đồ sóng âm thanh trực tiếp và đồng hồ đếm giây.',
    imageUrl: '',
    fallbackUrl: FALLBACK_PREVIEW,
    promptText: 'Dựng thanh ghi âm có biểu đồ sóng trực tiếp, nút tạm dừng và lưu bản ghi.',
  },
  {
    id: 'pinui-taxi',
    sourceId: 'taxi',
    library: 'PinUI',
    title: 'Ride Tracker',
    category: 'Bản đồ & Trạng thái',
    summaryVi: 'Thẻ theo dõi lộ trình di chuyển trực quan với mốc thời gian cập nhật liên tục.',
    imageUrl: '',
    fallbackUrl: FALLBACK_PREVIEW,
    promptText: 'Thiết kế thẻ theo dõi lộ trình thời gian thực kèm trạng thái tài xế và điểm đón.',
  },
  {
    id: 'pinui-balance-card',
    sourceId: 'balance-card',
    library: 'PinUI',
    title: 'Balance Card',
    category: 'Thẻ thông số',
    summaryVi: 'Thẻ tổng quan chỉ số tương tác cho phép chuyển đổi chế độ xem tức thì.',
    imageUrl: '',
    fallbackUrl: FALLBACK_PREVIEW,
    promptText: 'Dựng thẻ tổng hợp số liệu với chế độ ẩn hiện chi tiết và hoạt ảnh số lật.',
  },
];

export const MOTION_AI_EXPERIENCE_POOL: Array<Omit<ShowcaseExperienceCard, 'tileIndex'>> = [
  {
    id: 'ms-space-planet',
    sourceId: 'ms-space-planet',
    motionsitesSlug: 'space-planet',
    liveUrl: 'https://motionsites.ai/sections#space-planet',
    library: 'Motion AI',
    title: 'Space Planet',
    category: 'Cảnh 3D',
    summaryVi: 'Trình diễn khối hành tinh không gian chuyển động mượt cùng góc nhìn điện ảnh nguyên bản MotionSites.',
    imageUrl: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260827_202133_508c64b8-a31e-4290-bdfc-1187df70e0a6.png&w=720&q=82',
    videoUrl: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260827_202422_3ffb4889-c520-432d-8458-038009eb40df.mp4',
    fallbackUrl: 'https://raw.githubusercontent.com/broamstuck-cybr/SOURCEOFKNOWLEDGFORAI/main/assets/previews/lucianlabs-isometric-data-blocks.png',
    promptText: 'Dựng cảnh hành tinh 3D có vòng quỹ đạo xoay mượt, kèm các thẻ thông số độ cao và tốc độ ở bốn góc màn hình.',
    hasLiveHtml: true,
  },
  {
    id: 'ms-guardnet-benefits',
    sourceId: 'ms-guardnet-benefits',
    motionsitesSlug: 'guardnet-benefits',
    liveUrl: 'https://motionsites.ai/sections#guardnet-benefits',
    library: 'Motion AI',
    title: 'Guardnet Benefits',
    category: 'Kêu gọi hành động',
    summaryVi: 'Bố cục trình bày quyền lợi bảo mật sắc nét kèm chuyển động thị giác nguyên bản MotionSites.',
    imageUrl: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261029_050506_a830ff21-4c71-4272-bc39-b61cacb54463.png&w=720&q=85',
    videoUrl: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260421_072701_f6a01abb-eb30-4559-9d6e-774362defbc3.mp4',
    fallbackUrl: 'https://threeui.com/social/pages/hero/advanced-glass-material.jpg',
    promptText: 'Tạo khối quyền lợi Guardnet với 6 thẻ tính năng bảo mật, chỉ số cam kết hoạt động 99.99% và cụm nút đăng ký kiểm thử.',
    hasLiveHtml: true,
  },
  {
    id: 'ms-driftlab-hero',
    sourceId: 'ms-driftlab-hero',
    motionsitesSlug: 'driftlab-hero',
    liveUrl: 'https://motionsites.ai/sections#driftlab-hero',
    library: 'Motion AI',
    title: 'Jellyfish Scroll',
    category: 'Cảnh 3D',
    summaryVi: 'Hoạt cảnh sinh học chuyển động mềm mại theo cuộn trang kèm bản chạy HTML gốc từ MotionSites.',
    imageUrl: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261102_045255_3cb4b3c2-3cb5-4af9-93b4-bd88f2f883c3.png',
    videoUrl: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20261102_045327_a6584765-3154-43e6-b1c9-4e574f83a811.mp4',
    fallbackUrl: 'https://threeui.com/social/pages/hero/advanced-glass-material.jpg',
    promptText: 'Dựng trang Driftlab với hoạt cảnh chuyển động nhịp nhàng theo vị trí cuộn trang và lớp thẻ thông số bán trong suốt.',
    hasLiveHtml: true,
  },
  {
    id: 'ms-monolith-hero',
    sourceId: 'monolith-hero',
    motionsitesSlug: 'monolith-hero',
    liveUrl: 'https://motionsites.ai/sections#monolith-hero',
    library: 'Motion AI',
    title: 'Monolith Hero',
    category: 'Kiến trúc & 3D',
    summaryVi: 'Không gian kiến trúc Monolith với ánh sáng động và bố cục màn hình rộng nguyên bản từ MotionSites.',
    imageUrl: 'https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/b5f79c5a-2ebd-41ef-865e-24c660ac98bd.png',
    videoUrl: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260928_024808_abbfad57-4496-4906-9abc-49f0d153d287.mp4',
    fallbackUrl: 'https://raw.githubusercontent.com/broamstuck-cybr/SOURCEOFKNOWLEDGFORAI/main/assets/previews/lucianlabs-isometric-data-blocks.png',
    promptText: 'Dựng trang mở đầu kiến trúc Monolith với video nền toàn màn hình, chữ serif khổ lớn và thanh điều hướng tối giản.',
    hasLiveHtml: true,
  },
  {
    id: 'ms-pet-diagnostics',
    sourceId: 'pet-diagnostics',
    motionsitesSlug: 'pet-diagnostics',
    liveUrl: 'https://motionsites.ai/sections#pet-diagnostics',
    library: 'Motion AI',
    title: 'Pet Diagnostics',
    category: 'Y tế & Tương tác',
    summaryVi: 'Trải nghiệm chẩn đoán trực quan với video nền chất lượng cao và bản dựng HTML tương tác gốc.',
    imageUrl: 'https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/193afe38-41fa-4454-9d48-ed154b66d17c.png',
    videoUrl: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260814_034538_de4032ce-5035-473d-a5b1-0e2224635a6a.mp4',
    fallbackUrl: 'https://raw.githubusercontent.com/broamstuck-cybr/SOURCEOFKNOWLEDGFORAI/main/assets/previews/lucianlabs-isometric-data-blocks.png',
    promptText: 'Dựng giao diện trình diễn chẩn đoán thông minh với thẻ thông số trực quan và nền chuyển động độ phân giải cao.',
    hasLiveHtml: true,
  },
  {
    id: 'ms-macos-widget',
    sourceId: 'macos-widget',
    motionsitesSlug: 'macos-widget',
    liveUrl: 'https://motionsites.ai/sections#macos-widget',
    library: 'Motion AI',
    title: 'macOS Widget',
    category: 'SaaS & Giao diện',
    summaryVi: 'Cụm tiện ích phong cách macOS kèm hiệu ứng kính và chuyển động giao diện thực tế.',
    imageUrl: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20261014_121838_c97d0940-f430-4304-8573-4f47ee44f447.png',
    videoUrl: 'https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/4d01c727-d9c5-47c8-a778-35a451ffd39f.mp4',
    fallbackUrl: 'https://raw.githubusercontent.com/broamstuck-cybr/SOURCEOFKNOWLEDGFORAI/main/assets/previews/lucianlabs-isometric-data-blocks.png',
    promptText: 'Thiết kế chân trang và tiện ích phong cách desktop macOS tối giản kèm hiệu ứng chuyển tiếp mượt.',
    hasLiveHtml: true,
  },
  {
    id: 'ms-velorah-hero',
    sourceId: 'ms-velorah-hero',
    motionsitesSlug: 'velorah-hero',
    liveUrl: 'https://motionsites.ai/sections#velorah-hero',
    library: 'Motion AI',
    title: 'Velorah',
    category: 'Hero & Giới thiệu',
    summaryVi: 'Velorah mở ra phần giới thiệu mạch lạc cùng video nền chuyển sắc điện ảnh.',
    imageUrl: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261016_125845_ec7f8569-08dd-4a78-8310-9e094f5dd0a3.png&w=720&q=82',
    videoUrl: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260314_131748_f2ca2a28-fed7-44c8-b9a9-bd9acdd5ec31.mp4',
    fallbackUrl: FALLBACK_PREVIEW,
    promptText: 'Dựng khung mở đầu Velorah với tiêu đề phân tầng, nền chuyển sắc tối và cụm nút hành động chính rõ ràng trên điện thoại lẫn máy tính.',
  },
  {
    id: 'ms-design-rocket-email-hero',
    sourceId: 'ms-design-rocket-email-hero',
    motionsitesSlug: 'design-rocket-email-hero',
    liveUrl: 'https://motionsites.ai/sections#design-rocket-email-hero',
    library: 'Motion AI',
    title: 'Email Marketing',
    category: 'Kêu gọi hành động',
    summaryVi: 'Email Marketing sắp xếp rõ giá trị cốt lõi và điểm nhấn hành động giúp người mới nắm ý chính ngay.',
    imageUrl: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260514_154203_6c6f94dc-a07e-4ba5-8688-106f01ccd2c8.png&w=720&q=85',
    videoUrl: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260419_064822_f120e48a-d545-45dd-a02d-facb07829888.mp4',
    fallbackUrl: 'https://raw.githubusercontent.com/broamstuck-cybr/SOURCEOFKNOWLEDGFORAI/main/assets/previews/lucianlabs-isometric-data-blocks.png',
    promptText: 'Dựng khu vực đăng ký bản tin gồm ô nhập email có kiểm tra hợp lệ, nút xác nhận rõ ràng và khung xem trước kỳ phát hành mới.',
  },
  {
    id: 'ms-heritage-grove',
    sourceId: 'ms-heritage-grove',
    motionsitesSlug: 'heritage-grove',
    liveUrl: 'https://motionsites.ai/sections#heritage-grove',
    library: 'Motion AI',
    title: 'Heritage Grove',
    category: 'Chân trang & Điều hướng',
    summaryVi: 'Heritage Grove gom gọn điều hướng cuối trang với phong cách biên tập ấm áp.',
    imageUrl: 'https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/4f690bd1-881a-4192-82f2-d714d34c8fb9.png',
    videoUrl: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260901_122529_931c22c8-8d2d-47c0-ad51-b97f56a91e42.mp4',
    fallbackUrl: 'https://threeui.com/social/pages/hero/advanced-glass-material.jpg',
    promptText: 'Thiết kế chân trang Heritage Grove mang phong cách biên tập ấm áp với địa chỉ, danh mục bài viết, liên kết xã hội và nút về đầu trang.',
  },
  {
    id: 'ms-portal',
    sourceId: 'ms-portal',
    motionsitesSlug: 'portal',
    liveUrl: 'https://motionsites.ai/sections#portal',
    library: 'Motion AI',
    title: 'Portal',
    category: 'Hero & Giới thiệu',
    summaryVi: 'Portal mở rộng khung cửa sổ trung tâm với chiều sâu thị giác cuốn hút.',
    imageUrl: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261108_070809_9454266a-bcc7-474e-854a-bc5770e5ceb3.png&w=720&q=88',
    videoUrl: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260606_131516_eca35265-ea66-4fbd-8d52-22aae6e1a503.mp4',
    fallbackUrl: 'https://threeui.com/social/pages/three-js/structure-flow/expanse-field.jpg',
    promptText: 'Dựng bố cục Portal với khung cửa sổ trung tâm mở rộng khi cuộn, đặt tiêu đề hai dòng và nút thao tác nhanh bên dưới.',
  },
  {
    id: 'ms-designpro-hero',
    sourceId: 'ms-designpro-hero',
    motionsitesSlug: 'designpro-hero',
    liveUrl: 'https://motionsites.ai/sections#designpro-hero',
    library: 'Motion AI',
    title: 'DesignPro Academy',
    category: 'Kêu gọi hành động',
    summaryVi: 'DesignPro Academy trình diễn khóa học thiết kế kèm video minh họa sống động.',
    imageUrl: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260727_225202_f9e684f3-dc19-469a-8142-eb391bfc601b.png&w=720&q=85',
    videoUrl: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260328_105406_16f4600d-7a92-4292-b96e-b19156c7830a.mp4',
    fallbackUrl: 'https://threeui.com/social/pages/sections/footers/section-aera-01-footers.jpg',
    promptText: 'Thiết kế khối kêu gọi đăng ký khóa học DesignPro với danh sách 4 học phần, số suất còn nhận và nút đăng ký học thử.',
  },
  {
    id: 'ms-koru-tech-footer',
    sourceId: 'ms-koru-tech-footer',
    motionsitesSlug: 'koru-tech-footer',
    liveUrl: 'https://motionsites.ai/sections#koru-tech-footer',
    library: 'Motion AI',
    title: 'Koru Tech Footer',
    category: 'Chân trang & Điều hướng',
    summaryVi: 'Koru Tech Footer gom gọn điều hướng kỹ thuật 1px với trạng thái hệ thống trực quan.',
    imageUrl: 'https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/139344bb-585a-4867-9a31-94cbfad8f6d9.jpg',
    videoUrl: 'https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/17d62c8c-c7a4-491d-82ff-b0cbd3387820.mp4',
    fallbackUrl: 'https://raw.githubusercontent.com/broamstuck-cybr/SOURCEOFKNOWLEDGFORAI/main/assets/previews/lucianlabs-isometric-data-blocks.png',
    promptText: 'Tạo chân trang Koru Tech với khung viền 1px, chỉ báo trạng thái hệ thống hoạt động ổn định và 4 cột dẫn tới tài liệu API.',
  },
  {
    id: 'ms-neuralyn-hero',
    sourceId: 'ms-neuralyn-hero',
    motionsitesSlug: 'neuralyn-hero',
    liveUrl: 'https://motionsites.ai/sections#neuralyn-hero',
    library: 'Motion AI',
    title: 'Neuralyn',
    category: 'Trình diễn sản phẩm',
    summaryVi: 'Neuralyn trực quan hóa tín hiệu âm thanh và luồng dữ liệu AI thời gian thực.',
    imageUrl: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261108_192006_dd6f50c5-96f1-4366-a0b9-0e4a09cf5b0d.png&w=720&q=85',
    videoUrl: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260307_083826_e938b29f-a43a-41ec-a153-3d4730578ab8.mp4',
    fallbackUrl: 'https://threeui.com/social/pages/three-js/structure-flow/expanse-field.jpg',
    promptText: 'Thiết kế giao diện Neuralyn hiển thị biểu đồ sóng âm tương tác, bộ lọc nguồn dữ liệu và 4 thẻ thông số độ trễ.',
  },
  {
    id: 'ms-datacore-booking-hero',
    sourceId: 'ms-datacore-booking-hero',
    motionsitesSlug: 'datacore-booking-hero',
    liveUrl: 'https://motionsites.ai/sections#datacore-booking-hero',
    library: 'Motion AI',
    title: 'Datacore Booking',
    category: 'Kêu gọi hành động',
    summaryVi: 'Datacore Booking sắp xếp trải nghiệm đặt lịch rõ ràng với hoạt ảnh mượt mà.',
    imageUrl: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261021_093215_b7826239-e451-4e15-b42b-d6bcf9497a32.png&w=720&q=82',
    videoUrl: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260210_031346_d87182fb-b0af-4273-84d1-c6fd17d6bf0f.mp4',
    fallbackUrl: 'https://threeui.com/social/pages/motion-design/cathode-session/angles.jpg',
    promptText: 'Tạo giao diện đặt lịch tư vấn Datacore cho phép chọn ngày trên lịch tháng, chọn ca làm việc trống và điền thông tin liên hệ.',
  },
  {
    id: 'ms-asme-hero',
    sourceId: 'ms-asme-hero',
    motionsitesSlug: 'asme-hero',
    liveUrl: 'https://motionsites.ai/sections#asme-hero',
    library: 'Motion AI',
    title: 'Asme',
    category: 'Hero & Giới thiệu',
    summaryVi: 'Asme chia bố cục hai cột bất đối xứng sắc sảo cho trang giới thiệu sản phẩm.',
    imageUrl: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260801_104316_80b428ea-dc99-4399-afb3-8ccb7b34b2d0.png&w=720&q=85',
    videoUrl: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260328_115001_bcdaa3b4-03de-47e7-ad63-ae3e392c32d4.mp4',
    fallbackUrl: FALLBACK_PREVIEW,
    promptText: 'Xây dựng trang mở đầu Asme chia hai cột bất đối xứng: cột trái đặt tuyên ngôn thiết kế, cột phải hiển thị thẻ dự án tiêu biểu.',
  },
  {
    id: 'ms-nexora-hero',
    sourceId: 'ms-nexora-hero',
    motionsitesSlug: 'nexora-hero',
    liveUrl: 'https://motionsites.ai/sections#nexora-hero',
    library: 'Motion AI',
    title: 'Nexora Automation',
    category: 'Trình diễn sản phẩm',
    summaryVi: 'Nexora Automation mô phỏng luồng tự động hóa nhiều bước ngay trên màn hình chính.',
    imageUrl: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260725_120544_94be5de4-0f4f-494c-bb78-c532290040a6.png&w=720&q=85',
    videoUrl: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260319_015952_e1deeb12-8fb7-4071-a42a-60779fc64ab6.mp4',
    fallbackUrl: 'https://raw.githubusercontent.com/broamstuck-cybr/SOURCEOFKNOWLEDGFORAI/main/assets/previews/lucianlabs-liquid-glass-button.png',
    promptText: 'Dựng khung trình diễn quy trình Nexora với 4 nút tác vụ nối tiếp nhau, trạng thái chạy thực tế và bảng cấu hình nhanh.',
  },
  {
    id: 'ms-offline-footer',
    sourceId: 'ms-offline-footer',
    motionsitesSlug: 'offline-footer',
    liveUrl: 'https://motionsites.ai/sections#offline-footer',
    library: 'Motion AI',
    title: 'Offline',
    category: 'Chân trang & Điều hướng',
    summaryVi: 'Offline gom gọn đồng hồ thế giới và thanh liên kết cuối trang đầy nhịp điệu.',
    imageUrl: 'https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/af6deff1-d678-4dc6-ae24-2880b16cdb20.jpg',
    videoUrl: 'https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/abdab52e-bb1b-477d-ae7c-26c5f8915433.mp4',
    fallbackUrl: 'https://threeui.com/social/pages/motion-design/cathode-session/angles.jpg',
    promptText: 'Thiết kế chân trang Offline hiển thị giờ địa phương tại 3 thành phố lớn, danh sách liên kết chính và dòng bản quyền gọn gàng.',
  },
  {
    id: 'ms-bloom-ai-hero',
    sourceId: 'ms-bloom-ai-hero',
    motionsitesSlug: 'bloom-ai-hero',
    liveUrl: 'https://motionsites.ai/sections#bloom-ai-hero',
    library: 'Motion AI',
    title: 'Bloom AI',
    category: 'Hero & Giới thiệu',
    summaryVi: 'Bloom AI kết hợp ô lệnh trung tâm với hoạt cảnh chuyển sắc sống động.',
    imageUrl: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261113_115509_577e7e29-0e80-43e6-93ac-e6cf71972818.png&w=720&q=85',
    videoUrl: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260315_073750_51473149-4350-4920-ae24-c8214286f323.mp4',
    fallbackUrl: 'https://threeui.com/social/pages/landing-pages/aera-01-landing-page.jpg',
    promptText: 'Dựng khung mở đầu Bloom với ô nhập lệnh trung tâm, 4 chip gợi ý tác vụ nhanh và bảng kết quả mẫu bên dưới.',
  },
  {
    id: 'ms-adhd-planner',
    sourceId: 'ms-adhd-planner',
    motionsitesSlug: 'adhd-planner',
    liveUrl: 'https://motionsites.ai/sections#adhd-planner',
    library: 'Motion AI',
    title: 'ADHD Planner',
    category: 'Trình diễn sản phẩm',
    summaryVi: 'ADHD Planner trực quan hóa kế hoạch trong ngày với chuyển động dịu mắt.',
    imageUrl: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261107_005547_8a9e6889-76aa-4688-81b5-4452d9afa4ad.png&w=720&q=85',
    videoUrl: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260711_090308_1dd0cea7-f9ba-4db4-8147-c7d746061c9e.mp4',
    fallbackUrl: FALLBACK_PREVIEW,
    promptText: 'Tạo giao diện ứng dụng lập kế hoạch trong ngày gồm dòng thời gian theo giờ, danh sách 3 việc trọng tâm và đồng hồ đếm ngược.',
  },
  {
    id: 'ms-vaultra-hero',
    sourceId: 'ms-vaultra-hero',
    motionsitesSlug: 'vaultra-hero',
    liveUrl: 'https://motionsites.ai/sections#vaultra-hero',
    library: 'Motion AI',
    title: 'Vaultra',
    category: 'Bảng giá & Thẻ',
    summaryVi: 'Vaultra thể hiện thẻ tổng quan tài sản sắc nét với độ tương phản cao.',
    imageUrl: 'https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/f1631235-0a76-464d-8f1d-2c4b48a997d5.jpg',
    videoUrl: 'https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/e71aea27-a808-4ae3-8231-a469d49285d4.mp4',
    fallbackUrl: 'https://raw.githubusercontent.com/broamstuck-cybr/SOURCEOFKNOWLEDGFORAI/main/assets/previews/lucianlabs-liquid-glass-button.png',
    promptText: 'Dựng cụm thẻ tài chính Vaultra hiển thị tổng giá trị lưu ký, tỷ lệ phân bổ theo nhóm tài sản và trạng thái xác thực bảo mật.',
  },
  {
    id: 'ms-digital-epoch-hero',
    sourceId: 'ms-digital-epoch-hero',
    motionsitesSlug: 'digital-epoch-hero',
    liveUrl: 'https://motionsites.ai/sections#digital-epoch-hero',
    library: 'Motion AI',
    title: 'Digital Epoch',
    category: 'Hero & Giới thiệu',
    summaryVi: 'Digital Epoch xây dựng lưới tọa độ kỹ thuật 1px kết hợp hoạt cảnh điện ảnh.',
    imageUrl: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261109_013341_08629ffd-6ab5-44a8-bec8-f1939ab3a6cd.png&w=720&q=88',
    videoUrl: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260505_101331_74f9b798-3f00-4e86-8a01-377aa16ffeaa.mp4',
    fallbackUrl: 'https://threeui.com/social/pages/three-js/structure-flow/expanse-field.jpg',
    promptText: 'Thiết kế khung mở đầu Digital Epoch với lưới tọa độ kỹ thuật 1px, thanh trạng thái thời gian thực và tiêu đề khổ lớn.',
  },
  {
    id: 'ms-cobalt-hour',
    sourceId: 'ms-cobalt-hour',
    motionsitesSlug: 'cobalt-hour',
    liveUrl: 'https://motionsites.ai/sections#cobalt-hour',
    library: 'Motion AI',
    title: 'Cobalt Hour',
    category: 'Bảng giá & Thẻ',
    summaryVi: 'Cobalt Hour trình bày so sánh cấu hình và bảng thẻ dịch vụ trực quan.',
    imageUrl: 'https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/19548534-c502-431f-904d-24d31b17c471.jpg',
    videoUrl: 'https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/0e1b18f2-b590-4b97-96f0-b05e019d07eb.mp4',
    fallbackUrl: FALLBACK_PREVIEW,
    promptText: 'Tạo bảng giá Cobalt Hour với 3 cấp độ thẻ dịch vụ, đánh dấu nổi bật gói tiêu chuẩn và bảng đối chiếu 8 quyền lợi bên dưới.',
  },
  {
    id: 'ms-vantix-footer',
    sourceId: 'ms-vantix-footer',
    motionsitesSlug: 'vantix-footer',
    liveUrl: 'https://motionsites.ai/sections#vantix-footer',
    library: 'Motion AI',
    title: 'Vantix Footer',
    category: 'Chân trang & Điều hướng',
    summaryVi: 'Vantix Footer sắp xếp hệ thống liên kết và huy hiệu kỹ thuật gọn gàng.',
    imageUrl: 'https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/4a917d4c-123f-4b68-8125-b201961b7791.jpg',
    videoUrl: 'https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/a8f60da5-538f-403a-a812-6be0f098e319.mp4',
    fallbackUrl: 'https://raw.githubusercontent.com/broamstuck-cybr/SOURCEOFKNOWLEDGFORAI/main/assets/previews/lucianlabs-isometric-data-blocks.png',
    promptText: 'Dựng chân trang Vantix hiển thị các huy hiệu tuân thủ bảo mật, 3 cột giải pháp theo ngành và thông tin hỗ trợ kỹ thuật.',
  },
  {
    id: 'ms-prisma-landing',
    sourceId: 'ms-prisma-landing',
    motionsitesSlug: 'prisma-landing',
    liveUrl: 'https://motionsites.ai/sections#prisma-landing',
    library: 'Motion AI',
    title: 'Prisma Creative Studio',
    category: 'Cảnh 3D',
    summaryVi: 'Prisma Creative Studio trình diễn khối lăng kính 3D khúc xạ ánh sáng động.',
    imageUrl: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260405_171918_4a5edc79-d78f-4637-ac8b-53c43c220606.png&w=720&q=82',
    videoUrl: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260406_133058_0504132a-0cf3-4450-a370-8ea3b05c95d4.mp4',
    fallbackUrl: 'https://threeui.com/social/pages/hero/advanced-glass-material.jpg',
    promptText: 'Thiết kế trang Prisma với khối lăng kính trung tâm nghiêng theo chuột và 3 thẻ giới thiệu tính năng ở chân khung.',
  },
  {
    id: 'ms-balloon-drop',
    sourceId: 'ms-balloon-drop',
    motionsitesSlug: 'balloon-drop',
    liveUrl: 'https://motionsites.ai/sections#balloon-drop',
    library: 'Motion AI',
    title: 'Balloon Drop',
    category: 'Trình diễn sản phẩm',
    summaryVi: 'Balloon Drop trình diễn trang ra mắt sản phẩm với hoạt cảnh nhịp nhàng.',
    imageUrl: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261109_013341_08629ffd-6ab5-44a8-bec8-f1939ab3a6cd.png',
    videoUrl: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20261109_014328_9a7b4687-246e-497b-9bb9-42c285db3f47.mp4',
    fallbackUrl: 'https://threeui.com/social/pages/three-js/structure-flow/expanse-field.jpg',
    promptText: 'Dựng trang ra mắt sản phẩm giới hạn gồm khung ảnh phóng lớn, bộ chọn màu sắc/kích cỡ và thanh trạng thái số lượng còn lại.',
  },
];

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleWithRng<T>(arr: readonly T[], rng: () => number): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = copy[i];
    copy[i] = copy[j];
    copy[j] = tmp;
  }
  return copy;
}

export function buildShowcase50(
  seed = Date.now(),
  filter: ShowcaseFilterMode = 'all'
): ShowcaseExperienceCard[] {
  const rng = mulberry32(seed);
  if (filter === 'PinUI') {
    return shuffleWithRng(PINUI_EXPERIENCE_POOL, rng).map((item, idx) => ({
      ...item,
      tileIndex: idx % 10,
    }));
  }
  if (filter === 'Motion AI') {
    return shuffleWithRng(MOTION_AI_EXPERIENCE_POOL, rng).map((item, idx) => ({
      ...item,
      tileIndex: idx % 10,
    }));
  }

  const pinShuffled = shuffleWithRng(PINUI_EXPERIENCE_POOL, rng);
  const motionShuffled = shuffleWithRng(MOTION_AI_EXPERIENCE_POOL, rng);
  const startWithMotion = rng() >= 0.5;
  const total = pinShuffled.length + motionShuffled.length;
  const result: ShowcaseExperienceCard[] = [];
  let pIdx = 0;
  let mIdx = 0;

  for (let i = 0; i < total; i += 1) {
    const pickMotion = startWithMotion ? i % 2 === 0 : i % 2 === 1;
    if (pickMotion && mIdx < motionShuffled.length) {
      result.push({ ...motionShuffled[mIdx], tileIndex: i % 10 });
      mIdx += 1;
    } else if (pIdx < pinShuffled.length) {
      result.push({ ...pinShuffled[pIdx], tileIndex: i % 10 });
      pIdx += 1;
    } else if (mIdx < motionShuffled.length) {
      result.push({ ...motionShuffled[mIdx], tileIndex: i % 10 });
      mIdx += 1;
    }
  }
  return result;
}

export function buildRandomInterleaved25(seed = Date.now()): ShowcaseExperienceCard[] {
  return buildShowcase50(seed, 'all').slice(0, 25);
}

export function buildRoundedQuadClipPath(
  w: number,
  topL: number,
  hL: number,
  topR: number,
  hR: number,
  r: number
): string {
  const p0 = { x: 0, y: topL };
  const p1 = { x: w, y: topR };
  const p2 = { x: w, y: topR + hR };
  const p3 = { x: 0, y: topL + hL };
  const pts = [p0, p1, p2, p3];
  const cornerR = Math.max(2, Math.min(r, w * 0.25, hL * 0.2, hR * 0.2));

  const cmds: string[] = [];
  for (let i = 0; i < 4; i += 1) {
    const prev = pts[(i + 3) % 4];
    const curr = pts[i];
    const next = pts[(i + 1) % 4];

    const v1x = prev.x - curr.x;
    const v1y = prev.y - curr.y;
    const len1 = Math.hypot(v1x, v1y) || 1;
    const s1x = curr.x + (v1x / len1) * cornerR;
    const s1y = curr.y + (v1y / len1) * cornerR;

    const v2x = next.x - curr.x;
    const v2y = next.y - curr.y;
    const len2 = Math.hypot(v2x, v2y) || 1;
    const s2x = curr.x + (v2x / len2) * cornerR;
    const s2y = curr.y + (v2y / len2) * cornerR;

    if (i === 0) {
      cmds.push(`M ${s1x.toFixed(1)} ${s1y.toFixed(1)}`);
    } else {
      cmds.push(`L ${s1x.toFixed(1)} ${s1y.toFixed(1)}`);
    }
    cmds.push(`Q ${curr.x.toFixed(1)} ${curr.y.toFixed(1)} ${s2x.toFixed(1)} ${s2y.toFixed(1)}`);
  }
  cmds.push('Z');
  return `path('${cmds.join(' ')}')`;
}
