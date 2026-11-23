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
    "id": "ms-monolith-hero",
    "sourceId": "ms-monolith-hero",
    "motionsitesSlug": "monolith-hero",
    "liveUrl": "https://motionsites.ai/sections#monolith-hero",
    "library": "Motion AI",
    "title": "Monolith Hero",
    "category": "Architecture",
    "summaryVi": "Trải nghiệm tương tác Monolith Hero kèm đầy đủ mã thiết kế và prompt gốc từ MotionSites.",
    "imageUrl": "https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/b5f79c5a-2ebd-41ef-865e-24c660ac98bd.png",
    "videoUrl": "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260928_024808_abbfad57-4496-4906-9abc-49f0d153d287.mp4",
    "fallbackUrl": "https://raw.githubusercontent.com/broamstuck-cybr/SOURCEOFKNOWLEDGFORAI/main/assets/previews/lucianlabs-isometric-data-blocks.png",
    "promptText": "# Prompt: recreate the Stratum hero page exactly\n\nRecreate this exact single-page real-estate hero site. This is a fidelity task, not a redesign. Implement the supplied content, assets, CSS, animations and interactions exactly as specified. Build only this one page. Keep it local; do not publish or deploy it. Do not add sections, headers, footers, cards, forms, extra buttons, extra links, extra animations or extra copy.\n\nThe complete `index.html` appended at the end of this prompt is the authoritative specification. Copy it byte-for-byte. Everything above it describes that file so you can chec",
    "hasLiveHtml": true
  },
  {
    "id": "ms-pet-diagnostics",
    "sourceId": "ms-pet-diagnostics",
    "motionsitesSlug": "pet-diagnostics",
    "liveUrl": "https://motionsites.ai/sections#pet-diagnostics",
    "library": "Motion AI",
    "title": "Pet Diagnostics",
    "category": "Healthcare",
    "summaryVi": "Trải nghiệm tương tác Pet Diagnostics kèm đầy đủ mã thiết kế và prompt gốc từ MotionSites.",
    "imageUrl": "https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/193afe38-41fa-4454-9d48-ed154b66d17c.png",
    "videoUrl": "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260814_034538_de4032ce-5035-473d-a5b1-0e2224635a6a.mp4",
    "fallbackUrl": "https://raw.githubusercontent.com/broamstuck-cybr/SOURCEOFKNOWLEDGFORAI/main/assets/previews/lucianlabs-isometric-data-blocks.png",
    "promptText": "Build a **single self-contained `index.html`** file. No build step, no framework, no external\nJS, no local image files. All CSS in one `<style>` block in `<head>`; one small `<script>`\nbefore `</body>`. Match every number below exactly — the layout is measurement-driven, not\neyeballed.\n\n---\n\n## 1. Assets (remote only — use these exact URLs)\n\n**Hero video (desktop, autoplaying background) — 1928×1076, 8.04 s, H.264 MP4, silent:**\n```\nhttps://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260814_034538_de4032ce-5035-473d-a5b1-0e2224635a6a.mp4\n```\n\n**Hero still (desktop) — dou",
    "hasLiveHtml": true
  },
  {
    "id": "ms-stillmind",
    "sourceId": "ms-stillmind",
    "motionsitesSlug": "stillmind",
    "liveUrl": "https://motionsites.ai/sections#stillmind",
    "library": "Motion AI",
    "title": "Stillmind",
    "category": "Hero",
    "summaryVi": "Trải nghiệm tương tác Stillmind kèm đầy đủ mã thiết kế và prompt gốc từ MotionSites.",
    "imageUrl": "/assets/motion-posters/halden-port-hero.jpg",
    "videoUrl": "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260702_081127_0992a171-d3c6-4978-8213-0ec5df8b6d63.mp4",
    "fallbackUrl": "https://raw.githubusercontent.com/broamstuck-cybr/SOURCEOFKNOWLEDGFORAI/main/assets/previews/lucianlabs-isometric-data-blocks.png",
    "promptText": "Create a fullscreen cinematic hero section for a mindfulness/focus app called \"Lumora\" using React, Tailwind CSS, and Lucide React icons.\n\n## Font\n\nUse **Instrument Serif** (Google Fonts, italic for the logo). Load it in index.html:\n```\n<link rel=\"preconnect\" href=\"https://fonts.googleapis.com\">\n<link rel=\"preconnect\" href=\"https://fonts.gstatic.com\" crossorigin>\n<link href=\"https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap\" rel=\"stylesheet\">\n```\n\nSet `font-family: 'Instrument Serif', serif` on html/body. Use `system-ui, sans-serif` inline for body text (subtext, ",
    "hasLiveHtml": true
  },
  {
    "id": "ms-driftlab-hero",
    "sourceId": "ms-driftlab-hero",
    "motionsitesSlug": "driftlab-hero",
    "liveUrl": "https://motionsites.ai/sections#driftlab-hero",
    "library": "Motion AI",
    "title": "Jellyfish Scroll",
    "category": "Interactive",
    "summaryVi": "Trải nghiệm tương tác Jellyfish Scroll kèm đầy đủ mã thiết kế và prompt gốc từ MotionSites.",
    "imageUrl": "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261102_045255_3cb4b3c2-3cb5-4af9-93b4-bd88f2f883c3.png",
    "videoUrl": "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20261102_045327_a6584765-3154-43e6-b1c9-4e574f83a811.mp4",
    "fallbackUrl": "https://raw.githubusercontent.com/broamstuck-cybr/SOURCEOFKNOWLEDGFORAI/main/assets/previews/lucianlabs-isometric-data-blocks.png",
    "promptText": "# Driftlab — Jellyfish Scroll Hero (exact recreation prompt)\n\nGive me a single-file, scroll-driven hero called **Driftlab**. A pink jellyfish floats in the middle of a lilac sky. Huge condensed black words arrive big from the lower right on a curve, pass behind the jellyfish, pause in the centre and leave to the left. After the last word falls away, the jellyfish grows and two text panels appear in turn while it moves to the other side.\n\nPlain HTML, CSS and one vanilla script with raw WebGL2 in one file, with no libraries. The only external resources are the Google Fonts and the three media UR",
    "hasLiveHtml": true
  },
  {
    "id": "ms-macos-widget",
    "sourceId": "ms-macos-widget",
    "motionsitesSlug": "macos-widget",
    "liveUrl": "https://motionsites.ai/sections#macos-widget",
    "library": "Motion AI",
    "title": "macOS widget",
    "category": "SaaS",
    "summaryVi": "Trải nghiệm tương tác macOS widget kèm đầy đủ mã thiết kế và prompt gốc từ MotionSites.",
    "imageUrl": "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20261014_121838_c97d0940-f430-4304-8573-4f47ee44f447.png",
    "videoUrl": "https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/4d01c727-d9c5-47c8-a778-35a451ffd39f.mp4",
    "fallbackUrl": "https://raw.githubusercontent.com/broamstuck-cybr/SOURCEOFKNOWLEDGFORAI/main/assets/previews/lucianlabs-isometric-data-blocks.png",
    "promptText": "# Prompt: Recreate the Driftbar Meadow Footer (exact spec)\n\nCopy everything below the line into your AI coding tool.\n\n---\n\nBuild a single-file `index.html` (inline CSS, no frameworks, no build step) that recreates the **Driftbar** footer **exactly** as specified. It is one full-viewport footer:\n- a pale paper top holding a brand block and three link columns\n- a looping video of a blue-hour meadow (lavender mist, fireflies, first stars) filling the lower half and fading into the paper\n- a giant frosted-glass \"Driftbar\" wordmark sinking into lavender fog at the bottom\n\nFollow every value literal",
    "hasLiveHtml": true
  },
  {
    "id": "ms-guardnet-benefits",
    "sourceId": "ms-guardnet-benefits",
    "motionsitesSlug": "guardnet-benefits",
    "liveUrl": "https://motionsites.ai/sections#guardnet-benefits",
    "library": "Motion AI",
    "title": "Guardnet Benefits",
    "category": "Benefits",
    "summaryVi": "Trải nghiệm tương tác Guardnet Benefits kèm đầy đủ mã thiết kế và prompt gốc từ MotionSites.",
    "imageUrl": "/assets/motion-posters/guardnet-benefits.jpg",
    "videoUrl": "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260421_072701_f6a01abb-eb30-4559-9d6e-774362defbc3.mp4",
    "fallbackUrl": "https://raw.githubusercontent.com/broamstuck-cybr/SOURCEOFKNOWLEDGFORAI/main/assets/previews/lucianlabs-isometric-data-blocks.png",
    "promptText": "Build a single React + TypeScript section using Tailwind CSS. No extra libraries. Fully mobile-responsive. Black background, white text.\n\n## Global Prerequisites\n\n- Font: `@import url(https://db.onlinewebfonts.com/c/e55e9079ee863276569c8a68d776ef04?family=Futura+Md+BT+Medium);`\n- Body: `font-family: 'Futura Md BT Medium', system-ui, -apple-system, sans-serif; background-color: #000; color: #fff; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;`\n- Section sits inside a `w-full max-w-[1400px]` wrapper on a black page.\n\n---\n\n## BenefitsSection\n\nContainer: `relative w-full ",
    "hasLiveHtml": true
  },
  {
    "id": "ms-aurex-finance",
    "sourceId": "ms-aurex-finance",
    "motionsitesSlug": "aurex-finance",
    "liveUrl": "https://motionsites.ai/sections#aurex-finance",
    "library": "Motion AI",
    "title": "Aurex Finance",
    "category": "Fintech",
    "summaryVi": "Trải nghiệm tương tác Aurex Finance kèm đầy đủ mã thiết kế và prompt gốc từ MotionSites.",
    "imageUrl": "/assets/motion-posters/aurex-finance.jpg",
    "videoUrl": "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260813_115057_94c3699b-0fd1-4124-bcf3-3626bb8c1f77.mp4",
    "fallbackUrl": "https://raw.githubusercontent.com/broamstuck-cybr/SOURCEOFKNOWLEDGFORAI/main/assets/previews/lucianlabs-isometric-data-blocks.png",
    "promptText": "Build a **single full-screen hero section** for a DeFi / private-banking landing page called **LŪMEN // ÍNDEX**. Use **React 18 + TypeScript + Vite + Tailwind CSS**, with `lucide-react` for icons. The entire page is ONE component rendering ONE `<section>` that fills the viewport — no scrolling, no other sections.\n\n## 0. Project setup\n\nDependencies: `react@^18.3.1`, `react-dom@^18.3.1`, `lucide-react@^0.446.0`. Dev: `vite@^5.4.2`, `@vitejs/plugin-react`, `tailwindcss@^3.4.1`, `postcss`, `autoprefixer`, `typescript@^5.5.3`.\n\n`tailwind.config.js` — leave the theme completely unextended. Nearly ev",
    "hasLiveHtml": true
  },
  {
    "id": "ms-gold-standard",
    "sourceId": "ms-gold-standard",
    "motionsitesSlug": "gold-standard",
    "liveUrl": "https://motionsites.ai/sections#gold-standard",
    "library": "Motion AI",
    "title": "Gold Standard",
    "category": "Portfolio",
    "summaryVi": "Trải nghiệm tương tác Gold Standard kèm đầy đủ mã thiết kế và prompt gốc từ MotionSites.",
    "imageUrl": "/assets/motion-posters/gold-standard.jpg",
    "videoUrl": "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260930_000857_e98f4291-826d-46eb-9a28-8022b5fb7e62.mp4",
    "fallbackUrl": "https://raw.githubusercontent.com/broamstuck-cybr/SOURCEOFKNOWLEDGFORAI/main/assets/previews/lucianlabs-isometric-data-blocks.png",
    "promptText": "# Prompt: recreate the SOSCALE hero landing page exactly\n\nBuild a single-file, zero-dependency static landing page (`index.html`, with inline `<style>` and two inline `<script>` blocks plus one tiny `<head>` script). The page is one full-viewport hero with no scrolling. Every size and position below is exact. Don't add or remove elements, rename classes or \"improve\" the design. Reproduce it one to one.\n\n---\n\n## 1. Assets\n\n| Asset | Source | Notes |\n|---|---|---|\n| Hero background video | `https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260930_000857_e98f4291-826d-46e",
    "hasLiveHtml": true
  },
  {
    "id": "ms-vante-ribbon-hero",
    "sourceId": "ms-vante-ribbon-hero",
    "motionsitesSlug": "vante-ribbon-hero",
    "liveUrl": "https://motionsites.ai/sections#vante-ribbon-hero",
    "library": "Motion AI",
    "title": "Video Ribbon",
    "category": "Portfolio",
    "summaryVi": "Trải nghiệm tương tác Video Ribbon kèm đầy đủ mã thiết kế và prompt gốc từ MotionSites.",
    "imageUrl": "/assets/motion-posters/vante-ribbon-hero.jpg",
    "videoUrl": "https://pub-86dc5b5484314368ac5436a674b0d919.r2.dev/designs/roadster-3d-car-landing.mp4",
    "fallbackUrl": "https://raw.githubusercontent.com/broamstuck-cybr/SOURCEOFKNOWLEDGFORAI/main/assets/previews/lucianlabs-isometric-data-blocks.png",
    "promptText": "# Video Ribbon — Vante Scroll Portfolio Hero (exact recreation prompt)\n\nBuild a single-file, full-viewport, scroll-driven portfolio hero called **Vante**. On a near-black page, the two-part headline `CRAFT IN` / `MOTION` slides across the screen in opposite directions while a continuous ribbon of live video cards spirals around the viewer in 3D. It starts small along the bottom, swings close in a shallow curved arc, wraps around the left edge, runs away along the top and leaves top right. Then the cards land one by one in a calm 3×2 grid.\n\nPlain HTML, CSS and one vanilla ES module in one file.",
    "hasLiveHtml": true
  },
  {
    "id": "ms-planetary-pulse",
    "sourceId": "ms-planetary-pulse",
    "motionsitesSlug": "planetary-pulse",
    "liveUrl": "https://motionsites.ai/sections#planetary-pulse",
    "library": "Motion AI",
    "title": "Planetary Pulse",
    "category": "Science",
    "summaryVi": "Trải nghiệm tương tác Planetary Pulse kèm đầy đủ mã thiết kế và prompt gốc từ MotionSites.",
    "imageUrl": "/assets/motion-posters/planetary-pulse.jpg",
    "videoUrl": "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260816_125506_3a597378-ec85-4ebd-bd22-03b45508ac62.mp4",
    "fallbackUrl": "https://raw.githubusercontent.com/broamstuck-cybr/SOURCEOFKNOWLEDGFORAI/main/assets/previews/lucianlabs-isometric-data-blocks.png",
    "promptText": "Build a single-screen, non-scrolling hero landing page called **Terranova — Signals from the Deep Green**. It is a full-bleed looping background video with a real-time refractive \"liquid glass\" card floating over it, plus a slide-in fullscreen menu. Vanilla HTML/CSS/JS only — **no frameworks, no build step, no Three.js, no WebGL, no canvas 3D**. The glass effect is done entirely with an SVG filter plus a 2D canvas that re-draws the video every frame.\n\nProduce exactly five files: `index.html`, `styles.css`, `glass-card.js`, `ui.js`, `serve.mjs`.\n\n---\n\n## 1. Global setup\n\n### Fonts\nIn `<head>`, ",
    "hasLiveHtml": true
  },
  {
    "id": "ms-real-time-alerts",
    "sourceId": "ms-real-time-alerts",
    "motionsitesSlug": "real-time-alerts",
    "liveUrl": "https://motionsites.ai/sections#real-time-alerts",
    "library": "Motion AI",
    "title": "Real-Time Alerts",
    "category": "Sign in",
    "summaryVi": "Trải nghiệm tương tác Real-Time Alerts kèm đầy đủ mã thiết kế và prompt gốc từ MotionSites.",
    "imageUrl": "/assets/motion-posters/real-time-alerts.jpg",
    "videoUrl": "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260813_052122_e77a27e6-17f1-4794-889b-3ceaa0e9e8cb.mp4",
    "fallbackUrl": "https://raw.githubusercontent.com/broamstuck-cybr/SOURCEOFKNOWLEDGFORAI/main/assets/previews/lucianlabs-isometric-data-blocks.png",
    "promptText": "Build a single, self-contained `index.html` file — no build step, no external requests except one video URL, no frameworks, no dependencies. Everything (CSS, JS, SVG) is inline. The file is a pixel-locked recreation of a designed login page, reconstructed from a 1464×949 reference frame. Follow every number exactly; the design is calibrated, not approximate.\n\n## 0. Global rules\n\n- `<!DOCTYPE html>`, `<html lang=\"en\">`.\n- `<meta name=\"viewport\" content=\"width=device-width, initial-scale=1, viewport-fit=cover\">`\n- `<title>Signal — Log in</title>`\n- `html,body{height:100%;background:var(--page)}`",
    "hasLiveHtml": true
  },
  {
    "id": "ms-ai-runtime",
    "sourceId": "ms-ai-runtime",
    "motionsitesSlug": "ai-runtime",
    "liveUrl": "https://motionsites.ai/sections#ai-runtime",
    "library": "Motion AI",
    "title": "AI Runtime",
    "category": "AI",
    "summaryVi": "Trải nghiệm tương tác AI Runtime kèm đầy đủ mã thiết kế và prompt gốc từ MotionSites.",
    "imageUrl": "/assets/motion-posters/ai-runtime.jpg",
    "videoUrl": "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260809_012548_ef22562c-c0ae-4816-ad9d-f8922af4e6a7.mp4",
    "fallbackUrl": "https://raw.githubusercontent.com/broamstuck-cybr/SOURCEOFKNOWLEDGFORAI/main/assets/previews/lucianlabs-isometric-data-blocks.png",
    "promptText": "Rebuild this as a **single-viewport, full-bleed video-background landing page** using static **HTML + CSS + vanilla JS** (no framework). Match the current implementation exactly. File structure:\n\n```\nindex.html\nstyles.css\nmain.js\nassets/logo.webp\nfonts/GeistPixel-Circle.woff2\n```\n\nDocument title: `Intelligence Designed To Evolve`.  \nBody: black `#000`, `overflow: hidden`, height `100vh` / `100dvh`, Inter for UI, retro dot-matrix display font for headline + stat symbols. Antialiased text.\n\n---\n\n## Exact background video (required)\n\nFull-viewport cover video behind all UI (`position: absolute; i",
    "hasLiveHtml": true
  },
  {
    "id": "ms-data-signal",
    "sourceId": "ms-data-signal",
    "motionsitesSlug": "data-signal",
    "liveUrl": "https://motionsites.ai/sections#data-signal",
    "library": "Motion AI",
    "title": "Data Signal",
    "category": "Analytics",
    "summaryVi": "Trải nghiệm tương tác Data Signal kèm đầy đủ mã thiết kế và prompt gốc từ MotionSites.",
    "imageUrl": "/assets/motion-posters/data-signal.jpg",
    "videoUrl": "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260808_064556_051587f1-74a1-4336-8c05-4dde3594ed05.mp4",
    "fallbackUrl": "https://raw.githubusercontent.com/broamstuck-cybr/SOURCEOFKNOWLEDGFORAI/main/assets/previews/lucianlabs-isometric-data-blocks.png",
    "promptText": "Recreate this page **pixel-faithfully** as a single static `index.html` (inline CSS + JS, no framework). Match structure, copy, spacing tokens, glass, motion, fonts, and media exactly. Do not invent extra sections, stats, cards, or marketing blocks. Full-viewport dark landing only — no page scroll (`html, body { overflow: hidden; background: #000 }`).\n\n## Product / brand\n- Brand: **Vantage**\n- Document title: `Stop Digging Through Dashboards`\n- Theme color: `#000000`\n- `color-scheme: dark`\n- One composition: full-bleed cinematic background + left hero stack + bottom-right glass demo card. No i",
    "hasLiveHtml": true
  },
  {
    "id": "ms-cyber-layer",
    "sourceId": "ms-cyber-layer",
    "motionsitesSlug": "cyber-layer",
    "liveUrl": "https://motionsites.ai/sections#cyber-layer",
    "library": "Motion AI",
    "title": "Cyber Layer",
    "category": "Cybersecurity",
    "summaryVi": "Trải nghiệm tương tác Cyber Layer kèm đầy đủ mã thiết kế và prompt gốc từ MotionSites.",
    "imageUrl": "/assets/motion-posters/cyber-layer.jpg",
    "videoUrl": "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260809_132544_b6ef0174-ed95-45ad-9a2f-ccb8acfbdce8.mp4",
    "fallbackUrl": "https://raw.githubusercontent.com/broamstuck-cybr/SOURCEOFKNOWLEDGFORAI/main/assets/previews/lucianlabs-isometric-data-blocks.png",
    "promptText": "Build a **single self-contained `index.html`** that recreates this cybersecurity landing page **pixel-faithfully**. Fixed fullscreen black stage, left-locked typography, right-side looping video atmosphere, one-shot entrance choreography, and a mobile burger overlay. No frameworks. No scroll. No cards. No purple. No rounded pills.\n\n---\n\n## 1. Document shell\n\n```html\n<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n<meta charset=\"utf-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1, viewport-fit=cover\">\n<title>Security built into every system layer</title>\n```\n\n- `html, body { heig",
    "hasLiveHtml": true
  },
  {
    "id": "ms-phoenix-ignis",
    "sourceId": "ms-phoenix-ignis",
    "motionsitesSlug": "phoenix-ignis",
    "liveUrl": "https://motionsites.ai/sections#phoenix-ignis",
    "library": "Motion AI",
    "title": "Phoenix ignis",
    "category": "3D",
    "summaryVi": "Trải nghiệm tương tác Phoenix ignis kèm đầy đủ mã thiết kế và prompt gốc từ MotionSites.",
    "imageUrl": "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261031_020340_4815bb8d-68c3-48c4-ad05-6307d085e896.png",
    "fallbackUrl": "https://raw.githubusercontent.com/broamstuck-cybr/SOURCEOFKNOWLEDGFORAI/main/assets/previews/lucianlabs-isometric-data-blocks.png",
    "promptText": "# Myth Atlas ‚Äî Interactive 3D Creature Field Guide (exact recreation prompt)\n\nBuild a single-file, full-viewport web app called **Myth Atlas**: an interactive 3D field guide to creatures that never existed. It looks like a museum specimen plate on warm sandstone paper. A phoenix and a kraken sit in the centre as real textured 3D models you can drag, zoom and spin. A left sidebar, two specimen tabs, and a right catalogue card surround them. Clicking a tab flies one model out and springs the other in, while the card's copy swaps with a staggered rise. A sun button flips the whole page and the ",
    "hasLiveHtml": true
  },
  {
    "id": "ms-redline-mars-hero",
    "sourceId": "ms-redline-mars-hero",
    "motionsitesSlug": "redline-mars-hero",
    "liveUrl": "https://motionsites.ai/sections#redline-mars-hero",
    "library": "Motion AI",
    "title": "Mars Trips",
    "category": "Travel",
    "summaryVi": "Trải nghiệm tương tác Mars Trips kèm đầy đủ mã thiết kế và prompt gốc từ MotionSites.",
    "imageUrl": "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261031_030432_a1948696-c1d5-4468-845e-7d1291f80943.png",
    "fallbackUrl": "https://raw.githubusercontent.com/broamstuck-cybr/SOURCEOFKNOWLEDGFORAI/main/assets/previews/lucianlabs-isometric-data-blocks.png",
    "promptText": "# Redline — Mars Trips Three-Step 3D Hero (exact recreation prompt)\n\nBuild a single-file, full-viewport landing hero for **Redline**, a space-travel brand selling seats to Mars. It is one continuous three-step experience with no page loads:\n\n1. **MARS:** a real 3D Mars swells from a speck in front of a giant white word, on a burnt-orange background.\n2. **THARSIS:** the planet slides left and turns, a region lights up crimson like a territory on a map, and a timeline of landing sites appears on the right with a hover photo card.\n3. **Landing:** the camera dives into the planet, whites out in a ",
    "hasLiveHtml": true
  },
  {
    "id": "ms-halden-port-hero",
    "sourceId": "ms-halden-port-hero",
    "motionsitesSlug": "halden-port-hero",
    "liveUrl": "https://motionsites.ai/sections#halden-port-hero",
    "library": "Motion AI",
    "title": "Halden AI Teammate Hero",
    "category": "AI",
    "summaryVi": "Trải nghiệm tương tác Halden AI Teammate Hero kèm đầy đủ mã thiết kế và prompt gốc từ MotionSites.",
    "imageUrl": "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261029_050506_a830ff21-4c71-4272-bc39-b61cacb54463.png",
    "fallbackUrl": "https://raw.githubusercontent.com/broamstuck-cybr/SOURCEOFKNOWLEDGFORAI/main/assets/previews/lucianlabs-isometric-data-blocks.png",
    "promptText": "# Prompt: Halden, AI teammate for port operators (bowl-glow scroll hero)\n\nGive me the superdetailed exact prompt to recreate this page exactly as it is, including the correct asset URL, all elements, animations, and fonts. This is that prompt.\n\n## What it is\n\nBuild a B2B SaaS landing hero for a fictional maritime-logistics AI company, **Halden**, whose AI agent is called **Hal**. Use one HTML file with plain CSS and vanilla JavaScript: no framework, no build step, no libraries.\n\nThe page is three scenes stacked in one scroll:\n\n1. **Hero.** A white page with a soft, rounded, **bowl-shaped sky-c",
    "hasLiveHtml": true
  },
  {
    "id": "ms-orbit-flora",
    "sourceId": "ms-orbit-flora",
    "motionsitesSlug": "orbit-flora",
    "liveUrl": "https://motionsites.ai/sections#orbit-flora",
    "library": "Motion AI",
    "title": "Orbit Flora",
    "category": "AI",
    "summaryVi": "Trải nghiệm tương tác Orbit Flora kèm đầy đủ mã thiết kế và prompt gốc từ MotionSites.",
    "imageUrl": "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260808_192942_e1086505-d7da-433b-a59b-8220f4e6c808.png",
    "fallbackUrl": "https://raw.githubusercontent.com/broamstuck-cybr/SOURCEOFKNOWLEDGFORAI/main/assets/previews/lucianlabs-isometric-data-blocks.png",
    "promptText": "Build a **single-file** `index.html` full-viewport poster. No scroll. No frameworks. No redesign. Match layout, type, color, both image URLs, entrance choreography, mobile menu, and mouse morph-reveal **exactly**.\n\n---\n\n## 0. Document shell\n\n```html\n<!doctype html>\n<html lang=\"en\" class=\"anim\">\n<head>\n  <meta charset=\"utf-8\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1, viewport-fit=cover\">\n  <meta name=\"theme-color\" content=\"#161616\">\n  <title>Orbit — Secure system</title>\n```\n\n- Root `<html>` starts with class `anim`\n- `html, body`: `width/height 100%`, `margin: 0`, ",
    "hasLiveHtml": true
  },
  {
    "id": "ms-keylight",
    "sourceId": "ms-keylight",
    "motionsitesSlug": "keylight",
    "liveUrl": "https://motionsites.ai/sections#keylight",
    "library": "Motion AI",
    "title": "Keylight",
    "category": "Authentication",
    "summaryVi": "Trải nghiệm tương tác Keylight kèm đầy đủ mã thiết kế và prompt gốc từ MotionSites.",
    "imageUrl": "https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/d889cba6-535c-450f-9b74-7270c0e01e9a.webp",
    "fallbackUrl": "https://raw.githubusercontent.com/broamstuck-cybr/SOURCEOFKNOWLEDGFORAI/main/assets/previews/lucianlabs-isometric-data-blocks.png",
    "promptText": "# Prompt: Recreate the Keylight sign-in page exactly\n\nCopy everything below the line into your AI coding tool.\n\n---\n\nRecreate the **Keylight** sign-in page: one self-contained `index.html` (inline CSS + vanilla JS, no framework, no build step). It must match **exactly**, so reproduce the source at the end byte for byte. Do not restyle, re-time or refactor anything.\n\n## What it is\n\n- **Split screen.**\n  - **Left:** a brand panel about 41% wide on a 1470√ó900 design frame. It holds:\n    - a still of a keyhole cut into a dark navy wall, with warm orange light pouring through it into blue haze\n   ",
    "hasLiveHtml": true
  },
  {
    "id": "ms-vell-lookbook",
    "sourceId": "ms-vell-lookbook",
    "motionsitesSlug": "vell-lookbook",
    "liveUrl": "https://motionsites.ai/sections#vell-lookbook",
    "library": "Motion AI",
    "title": "Runway Lookbook",
    "category": "Interactive",
    "summaryVi": "Trải nghiệm tương tác Runway Lookbook kèm đầy đủ mã thiết kế và prompt gốc từ MotionSites.",
    "imageUrl": "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261102_042056_1a704ff7-b0e5-4a9f-bbda-62392b819fb6.png",
    "fallbackUrl": "https://raw.githubusercontent.com/broamstuck-cybr/SOURCEOFKNOWLEDGFORAI/main/assets/previews/lucianlabs-isometric-data-blocks.png",
    "promptText": "# Maison Vell — Runway Depth Lookbook (exact recreation prompt)\n\nGive me a single-file, full-viewport fashion page called **Maison Vell**. Six models stand in one line that recedes from the right of the screen into a blurred distance on the left. Dragging, scrolling or pressing the arrow keys walks the whole line forward: the front model grows and slides out behind the product column, everyone else takes the next place, and a new model arrives out of the haze at the back. The product column on the right scrolls in sync, and a big look number rolls over at bottom left. It loops forever.\n\nPlain ",
    "hasLiveHtml": true
  },
  {
    "id": "ms-lumen-roof-hero",
    "sourceId": "ms-lumen-roof-hero",
    "motionsitesSlug": "lumen-roof-hero",
    "liveUrl": "https://motionsites.ai/sections#lumen-roof-hero",
    "library": "Motion AI",
    "title": "Solar Fog",
    "category": "Interactive",
    "summaryVi": "Trải nghiệm tương tác Solar Fog kèm đầy đủ mã thiết kế và prompt gốc từ MotionSites.",
    "imageUrl": "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261102_040343_a73684b4-3f71-4613-a843-c8be80fb1211.png",
    "fallbackUrl": "https://raw.githubusercontent.com/broamstuck-cybr/SOURCEOFKNOWLEDGFORAI/main/assets/previews/lucianlabs-isometric-data-blocks.png",
    "promptText": "# Lumen Roof — Morning / Night Fog Hero (exact recreation prompt)\n\nGive me a single-file, full-viewport solar company hero called **Lumen Roof**. A charcoal farmhouse with solar panels fills the screen under a big centred headline. A glass Morning / Night toggle sits at the bottom. Clicking it sinks the whole house about a quarter of the screen into rising fog, swaps the time of day while it is hidden, and floats the house back up in the new light, while the sky, fog colour, nav, headline and button change with it.\n\nPlain HTML, CSS and one vanilla script with raw WebGL2 in one file, with no li",
    "hasLiveHtml": true
  },
  {
    "id": "ms-living-portrait-hero",
    "sourceId": "ms-living-portrait-hero",
    "motionsitesSlug": "living-portrait-hero",
    "liveUrl": "https://motionsites.ai/sections#living-portrait-hero",
    "library": "Motion AI",
    "title": "Living Portrait",
    "category": "Portfolio",
    "summaryVi": "Trải nghiệm tương tác Living Portrait kèm đầy đủ mã thiết kế và prompt gốc từ MotionSites.",
    "imageUrl": "/assets/motion-posters/orbit-flora.jpg",
    "fallbackUrl": "https://raw.githubusercontent.com/broamstuck-cybr/SOURCEOFKNOWLEDGFORAI/main/assets/previews/lucianlabs-isometric-data-blocks.png",
    "promptText": "Build a 3D Creator portfolio landing page with an interactive living portrait for \"Mina\" using React, TypeScript, Tailwind CSS, Framer Motion, and Lucide React. The page has a dark theme (#0C0C0C background) with the font Kanit (Google Fonts, weights 300-900). The page title is \"Mina -- 3D Creator\".\n\nFONT\nLoad exactly: https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;500;600;700;800;900&display=swap with preconnect to https://fonts.googleapis.com and https://fonts.gstatic.com (crossorigin).\n\nGLOBAL STYLES\nBackground: #0C0C0C on html, body, #root, and the main wrapper\nFont family: 'K",
    "hasLiveHtml": true
  },
  {
    "id": "ms-price-calculator",
    "sourceId": "ms-price-calculator",
    "motionsitesSlug": "price-calculator",
    "liveUrl": "https://motionsites.ai/sections#price-calculator",
    "library": "Motion AI",
    "title": "Price Calculator",
    "category": "SaaS",
    "summaryVi": "Trải nghiệm tương tác Price Calculator kèm đầy đủ mã thiết kế và prompt gốc từ MotionSites.",
    "imageUrl": "/assets/motion-posters/price-calculator.jpg",
    "fallbackUrl": "https://raw.githubusercontent.com/broamstuck-cybr/SOURCEOFKNOWLEDGFORAI/main/assets/previews/lucianlabs-isometric-data-blocks.png",
    "promptText": "Recreate Project Estimation Calculator Section\n\nCreate a full-width dark calculator section with id calculator-section. Background: bg-background, padding py-16 md:py-28 px-4 md:px-16, max-width max-w-7xl centered.\n\nHeader: Centered. Small mono uppercase tracking-widest label \"Try project estimation calculator\" in text-muted-foreground. Below it, an h2: \"Get premium website within your budget\" — text-3xl md:text-4xl lg:text-5xl font-normal.\n\nLayout: 2-column grid (grid-cols-1 lg:grid-cols-2), rounded-2xl overflow-hidden, no gap.\n\nLEFT COLUMN (Calculator Form): Background #0D0D0D, padding p-8 l",
    "hasLiveHtml": true
  },
  {
    "id": "ms-fernhollow",
    "sourceId": "ms-fernhollow",
    "motionsitesSlug": "fernhollow",
    "liveUrl": "https://motionsites.ai/sections#fernhollow",
    "library": "Motion AI",
    "title": "Flower Valley",
    "category": "3D",
    "summaryVi": "Trải nghiệm tương tác Flower Valley kèm đầy đủ mã thiết kế và prompt gốc từ MotionSites.",
    "imageUrl": "/assets/motion-posters/fernhollow.jpg",
    "fallbackUrl": "https://raw.githubusercontent.com/broamstuck-cybr/SOURCEOFKNOWLEDGFORAI/main/assets/previews/lucianlabs-isometric-data-blocks.png",
    "promptText": "# Fernhollow — Night Flower Valley Hero (exact recreation prompt)\n\nGive me a single-file, full-screen hero for a regenerative design studio called **Fernhollow**. It sits on top of an interactive 3D night valley of glowing flowers. A centred cream headline \"Grown, not built.\" in tall condensed type sits over the valley, with a short caption, a round arrow button, a top nav and a sound toggle.\n\nThe valley is the 3D flower valley from gladeye.com, used with permission. It is not rebuilt. The page runs the original compiled engine: their webpack runtime and chunks, including three.js r154, the va",
    "hasLiveHtml": true
  },
  {
    "id": "ms-medusa-jellyfish-hero",
    "sourceId": "ms-medusa-jellyfish-hero",
    "motionsitesSlug": "medusa-jellyfish-hero",
    "liveUrl": "https://motionsites.ai/sections#medusa-jellyfish-hero",
    "library": "Motion AI",
    "title": "Robot Jellyfish",
    "category": "3D",
    "summaryVi": "Trải nghiệm tương tác Robot Jellyfish kèm đầy đủ mã thiết kế và prompt gốc từ MotionSites.",
    "imageUrl": "/assets/motion-posters/medusa-jellyfish-hero.jpg",
    "fallbackUrl": "https://raw.githubusercontent.com/broamstuck-cybr/SOURCEOFKNOWLEDGFORAI/main/assets/previews/lucianlabs-isometric-data-blocks.png",
    "promptText": "# Robot Jellyfish — Medusa JF-4 3D Field Simulator Hero (exact recreation prompt)\n\nBuild a single-file, full-viewport interactive page called **Medusa JF-4**. It is a live three.js field simulator of a robotic jellyfish that you can take apart piece by piece. A huge procedural 3D machine floats in the centre of a pale aqua-white instrument dashboard, and a 25-second looping tour opens each assembly in turn while every gauge on the page reacts.\n\nThere are no images, no video and no model files. Every petal, gear, link and rivet is three.js code. Plain HTML, CSS and one vanilla ES module in one ",
    "hasLiveHtml": true
  }
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
