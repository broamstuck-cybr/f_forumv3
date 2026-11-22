export type MotionMarqueeRow = 0 | 1 | 2 | 3;

export type MotionMarqueeCategory =
  | 'Hero & Giới thiệu'
  | 'Cảnh 3D'
  | 'Kêu gọi hành động'
  | 'Trình diễn sản phẩm'
  | 'Bảng giá & Thẻ'
  | 'Chân trang & Điều hướng';

export interface MotionMarqueeSpecs {
  layout: string;
  motion: string;
  responsive: string;
  durationMs: number;
  easing: string;
}

export interface MotionMarqueeItem {
  id: string;
  row: 0 | 1 | 2 | 3;
  title: string;
  category: string;
  imageUrl: string;
  fallbackUrl: string;
  summaryVi: string;
  specs: MotionMarqueeSpecs;
  tags: string[];
  promptText: string;
  starterPrompt: string;
}

export const MOTION_MARQUEE_CATEGORIES: readonly MotionMarqueeCategory[] = [
  'Hero & Giới thiệu',
  'Cảnh 3D',
  'Kêu gọi hành động',
  'Trình diễn sản phẩm',
  'Bảng giá & Thẻ',
  'Chân trang & Điều hướng',
];

export const MOTION_MARQUEE_ITEMS: MotionMarqueeItem[] = [
  {
    "id": "ms-velorah-hero",
    "row": 0,
    "title": "Velorah",
    "category": "Hero & Giới thiệu",
    "imageUrl": "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261016_125845_ec7f8569-08dd-4a78-8310-9e094f5dd0a3.png&w=720&q=82",
    "fallbackUrl": "https://raw.githubusercontent.com/broamstuck-cybr/SOURCEOFKNOWLEDGFORAI/main/assets/previews/codefronts-course-card.png",
    "summaryVi": "Khung mở đầu phân lớp thị giác với tiêu đề tương phản cao và cụm nút điều hướng nổi.",
    "specs": {
      "layout": "12 cột lệch tâm · Hero phân tầng",
      "motion": "Trượt mượt theo trục Y + mờ dần lớp nền",
      "responsive": "Điện thoại · máy tính bảng · máy tính",
      "durationMs": 520,
      "easing": "cubic-bezier(0.22, 1, 0.36, 1)"
    },
    "tags": [
      "Hero",
      "Phân lớp",
      "Tương phản",
      "Mở đầu"
    ],
    "promptText": "Create a single-page hero section with a fullscreen looping background video, glassmorphic navigation, and cinematic typography. Use React + Vite + Tailwind CSS + TypeScript with shadcn/ui.\nVideo Background:\nFullscreen <video> element with autoPlay, loop, muted, playsInline\nSource URL: [asset-url]\nPositioned absolute inset-0 w-full h-full object-cover z-0\nFonts:\nImport from Google Fonts: Instrumental Serif (display) and Plus Jakarta Sans weights 400/500 (body)\nCSS variables: --font-display: 'Instrument Serif', serif and --font-body: 'Plus Jakarta Sans', sans-serif\nBody uses var(--font-body), headings use inline fontFamily: \"'Instrument Serif', serif\"\nColor Theme (dark, HSL values for CSS variables):\n--background: 201 100% 13% (deep navy blue)\n--foreground: 0 0% 100% (white)\n--muted-foreground: 240 4% 66% (muted gray)\n--primary: 0 0% 100%, --primary-foreground: 0 0% 4%\n--secondary: 0 0% 10%, --muted: 0 0% 10%, --accent: 0 0% 10%\n--border: 0 0% 18%, --input: 0 0% 18%\nNavigation Bar:\nrelative z-10, flex row, justify-between, px-8 py-6, max-w-7xl mx-auto\nLogo: \"Velorah \" ( as <sup className=\"text-xs\">), text-3xl tracking-tight, Instrument Serif font, text-foreground",
    "starterPrompt": "Dựng khung mở đầu Velorah với tiêu đề phân tầng, nền chuyển sắc tối và cụm nút hành động chính rõ ràng trên cả điện thoại lẫn máy tính."
  },
  {
    "id": "ms-space-planet",
    "row": 0,
    "title": "Space planet",
    "category": "Cảnh 3D",
    "imageUrl": "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260827_202133_508c64b8-a31e-4290-bdfc-1187df70e0a6.png&w=720&q=82",
    "fallbackUrl": "https://raw.githubusercontent.com/broamstuck-cybr/SOURCEOFKNOWLEDGFORAI/main/assets/previews/lucianlabs-isometric-data-blocks.png",
    "summaryVi": "Cảnh hành tinh 3D xoay quanh trục nghiêng kết hợp lớp nhãn thông số quỹ đạo thời gian thực.",
    "specs": {
      "layout": "Khung dựng 3D toàn cảnh + lớp phủ HUD",
      "motion": "Quay quỹ đạo liên tục + giảm chấn góc nhìn",
      "responsive": "Điện thoại · máy tính bảng · máy tính",
      "durationMs": 720,
      "easing": "cubic-bezier(0.16, 1, 0.3, 1)"
    },
    "tags": [
      "Hành tinh",
      "Quỹ đạo",
      "Lớp phủ HUD",
      "WebGL"
    ],
    "promptText": "Build a single, self-contained HTML file: a full-viewport space-themed hero section\nfor a site called \"SpaceEdu\". No build step, no frameworks, no external JS. All CSS in\none <style> block in <head>, all JS in one <script> block before </body>. It must be\npixel-faithful to the spec below and fully mobile responsive.\n1. CONCEPT\nA cinematic hero. A looping video of a single planet fills the whole viewport as the\nbackground. Centred over it: eyebrow \"PLANET\", a huge serif planet name, a short cyan\nrule, a paragraph, and a glossy white pill button. Flanking the button, cropped by the\nleft and right screen edges, sit two transparent planet cut-outs with serif labels.\nThree planets exist: EARTH, VENUS, MARS. Exactly one is \"featured\" (its clip is the\nbackground, its name is the headline). The other two occupy the left and right slots.\nClicking a side planet makes it featured; the two slots then re-fill with the other\ntwo. Earth is featured on load. The rotation is fully reversible.\n2. ASSETS use these exact URLs\nBackground clips (10s, 16:9, 1276x720, silent, loop):\nEARTH [asset-url]\nVENUS [asset-url]\nMARS [asset-url]",
    "starterPrompt": "Dựng cảnh hành tinh 3D có vòng quỹ đạo xoay mượt, kèm các thẻ thông số độ cao và tốc độ ở bốn góc màn hình."
  },
  {
    "id": "ms-vertex",
    "row": 0,
    "title": "Vertex",
    "category": "Trình diễn sản phẩm",
    "imageUrl": "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261031_020340_4815bb8d-68c3-48c4-ad05-6307d085e896.png&w=720&q=85",
    "fallbackUrl": "https://raw.githubusercontent.com/broamstuck-cybr/SOURCEOFKNOWLEDGFORAI/main/assets/previews/lucianlabs-liquid-glass-button.png",
    "summaryVi": "Bảng điều khiển phân tích mô hình với biểu đồ thời gian thực và luồng nhật ký xử lý.",
    "specs": {
      "layout": "Bố cục ứng dụng 3 vùng · Khung biểu đồ chính",
      "motion": "Cập nhật đường cong mượt + chuyển tab tức thì",
      "responsive": "Điện thoại · máy tính bảng · máy tính",
      "durationMs": 380,
      "easing": "cubic-bezier(0.22, 1, 0.36, 1)"
    },
    "tags": [
      "Bảng điều khiển",
      "Biểu đồ",
      "Thời gian thực",
      "Phân tích"
    ],
    "promptText": "Build a single, self-contained, production-ready `index.html` one file, no build\nstep, no frameworks, no local assets. It renders a full-viewport dark hero section\nfor a fictional e-commerce SaaS called \"Vertex Shops\". Every image loads from the\nabsolute CloudFront URLs in 8. There is NO video anywhere in this page.\nTwo components below are marked PIXEL CONTRACT. Those are the most commonly\nbotched parts of this design. Implement them exactly as written, including the\nDO-NOT lists. Do not \"improve\" them, do not substitute a more conventional\nbutton/pill pattern, do not add glows or centring that is not specified.\n=====================================================================\n0. GLOBAL SHELL\n=====================================================================\n<!doctype html>, <html lang=\"en-US\">.\n<title>Vision Streamline the shop virtual</title>\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1, viewport-fit=cover\">\nFONTS exactly these three tags in <head>, in this order:\n<link rel=\"preconnect\" href=\"[asset-url]\">\n<link rel=\"preconnect\" href=\"[asset-url]\" crossorigin>\n<link href=\"[asset-url]\" rel=\"stylesheet\">",
    "starterPrompt": "Dựng giao diện sản phẩm Vertex gồm thanh bên thu gọn, biểu đồ hiệu năng trung tâm và bảng nhật ký truy vấn."
  },
  {
    "id": "ms-guardnet-benefits",
    "row": 0,
    "title": "Guardnet Benefits",
    "category": "Kêu gọi hành động",
    "imageUrl": "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261029_050506_a830ff21-4c71-4272-bc39-b61cacb54463.png&w=720&q=85",
    "fallbackUrl": "https://threeui.com/social/pages/hero/advanced-glass-material.jpg",
    "summaryVi": "Khối tổng hợp quyền lợi bảo mật doanh nghiệp kèm nút kích hoạt dùng thử và bảng cam kết SLA.",
    "specs": {
      "layout": "Ba cột quyền lợi gọn, một dải mời dùng thử",
      "motion": "Nổi thẻ khi lướt chuột + sáng chỉ báo trạng thái",
      "responsive": "Điện thoại · máy tính bảng · máy tính",
      "durationMs": 420,
      "easing": "cubic-bezier(0.22, 1, 0.36, 1)"
    },
    "tags": [
      "Bảo mật",
      "Quyền lợi",
      "Chuyển đổi",
      "Doanh nghiệp"
    ],
    "promptText": "Build a single React + TypeScript section using Tailwind CSS. No extra libraries. Fully mobile-responsive. Black background, white text.\n## Global Prerequisites\n- Font: `@import url([asset-url]);`\n- Body: `font-family: 'Futura Md BT Medium', system-ui, -apple-system, sans-serif; background-color: #000; color: #fff; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;`\n- Section sits inside a `w-full max-w-[1400px]` wrapper on a black page.\n## BenefitsSection\nContainer: `relative w-full bg-black px-4 sm:px-6 md:px-10 py-12 sm:py-20`\n### Section Heading\n`text-white text-3xl sm:text-4xl md:text-5xl font-light text-center mb-12 sm:mb-24` with inline style `letterSpacing: '-0.04em'`\nText: **\"Key Benefits\"**\n### Three-Column Card Grid\n`grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4`\nAll three cards share: `relative h-[380px] sm:h-[460px] rounded-2xl bg-neutral-950 overflow-hidden`\n#### Card 1: Text Card (Left)\nAdditional classes: `p-6 sm:p-8`\n**Blue Blob:** `absolute top-1/2 -translate-y-1/2 -left-[420px] h-[460px] w-[460px] rounded-full bg-[#1e3a8a] blur-3xl opacity-40`\n**Content wrapper:** `relative z-10 flex flex-col h-full`",
    "starterPrompt": "Tạo khối quyền lợi Guardnet với 6 thẻ tính năng bảo mật, chỉ số cam kết hoạt động 99.99% và cụm nút đăng ký kiểm thử."
  },
  {
    "id": "ms-price-calculator",
    "row": 0,
    "title": "Price Calculator",
    "category": "Bảng giá & Thẻ",
    "imageUrl": "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261029_050506_a830ff21-4c71-4272-bc39-b61cacb54463.png&w=720&q=85",
    "fallbackUrl": "https://threeui.com/social/pages/three-js/structure-flow/expanse-field.jpg",
    "summaryVi": "Bảng tính chi phí linh hoạt theo quy mô người dùng và chu kỳ thanh toán tháng/năm có chiết khấu.",
    "specs": {
      "layout": "Thanh trượt quy mô + 3 cột gói cước so sánh",
      "motion": "Nội suy con số giá tiền mượt khi kéo thanh trượt",
      "responsive": "Điện thoại · máy tính bảng · máy tính",
      "durationMs": 360,
      "easing": "cubic-bezier(0.2, 0.8, 0.2, 1)"
    },
    "tags": [
      "Bảng giá",
      "Công cụ tính",
      "So sánh",
      "Thanh trượt"
    ],
    "promptText": "Recreate Project Estimation Calculator Section\nCreate a full-width dark calculator section with id calculator-section. Background: bg-background, padding py-16 md:py-28 px-4 md:px-16, max-width max-w-7xl centered.\nHeader: Centered. Small mono uppercase tracking-widest label \"Try project estimation calculator\" in text-muted-foreground. Below it, an h2: \"Get premium website within your budget\" text-3xl md:text-4xl lg:text-5xl font-normal.\nLayout: 2-column grid (grid-cols-1 lg:grid-cols-2), rounded-2xl overflow-hidden, no gap.\nLEFT COLUMN (Calculator Form): Background #0D0D0D, padding p-8 lg:p-12, sections divided by divide-y divide-[#1E1E1E].\n4 sections separated by horizontal dividers:\nService Type (radio buttons): h3 \"What kind of service do you need?\" 3 options: \"Only Design\" (design), \"Only Development\" (development), \"Design + Development\" (both, default). Custom radio circles: w-5 h-5 rounded-full border-2, active = border-[#FF5656] with inner w-2 h-2 rounded-full bg-[#FF5656].\nNumber of Pages (slider): h3 with current value in #FF5656. Shadcn <Slider> min=1, max=30, step=1, default=5. Labels \"1\" and \"30\" below.",
    "starterPrompt": "Xây dựng bảng tính giá tương tác với công tắc chuyển Tháng/Năm, thanh trượt số lượng thành viên và 3 thẻ gói dịch vụ."
  },
  {
    "id": "ms-haul-footer",
    "row": 0,
    "title": "HAUL!",
    "category": "Chân trang & Điều hướng",
    "imageUrl": "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260430_115327_3f256636-9e63-4885-8d0b-09317dc2b0a5.png",
    "fallbackUrl": "https://threeui.com/social/pages/motion-design/cathode-session/angles.jpg",
    "summaryVi": "Chân trang khổ lớn với chữ đồ họa toàn chiều ngang, lưới liên kết 4 cột và thanh trạng thái hệ thống.",
    "specs": {
      "layout": "Lưới liên kết 4 cột + chữ khổ lớn sát đáy",
      "motion": "Gạch chân trượt mượt + lộ chữ lớn khi cuộn tới đáy",
      "responsive": "Điện thoại · máy tính bảng · máy tính",
      "durationMs": 460,
      "easing": "cubic-bezier(0.22, 1, 0.36, 1)"
    },
    "tags": [
      "Chân trang",
      "Chữ khổ lớn",
      "Liên kết",
      "Trạng thái"
    ],
    "promptText": "Build a React functional component using Tailwind CSS, `motion/react` for animations, and `lucide-react` for icons.\n**1. Typography & Setup:**\n- Import the \"Plus Jakarta Sans\" font from Google Fonts (weights 400, 500, 600, 700) and set it as the default sans-serif font in the Tailwind config/CSS.\n- The overall background of the page should be `#f8f9fa`.\n**2. Top Spacer Section (View Below):**\n- Create a section at the top of the page. Height should be `50vh` (on mobile/lg) and `30vh` (on md screens).\n- Background color: `#FDFDFD`.\n- Center a text element that says \"View Below\". The text should be `text-gray-300`, small font, bold, uppercase, with wide `tracking-[0.5em]`.\n- Animate this text with Framer Motion to fade in from `opacity: 0` to `opacity: 1`.\n**3. Main Parallax Container:**\n- Below the spacer, create a main full-viewport-height (`h-screen`) section.\n- Set its background image to: `[asset-url]`\n- Make sure the background covers the container (`bg-cover bg-center`) and set `overflow-hidden` with `relative` positioning.\n- Set up a Framer Motion `useScroll` target on this container. Map the `scrollYProgress` from `[0, 1]` to `[-50, 150]` using `useTransform`.",
    "starterPrompt": "Dựng chân trang HAUL gồm 4 cột điều hướng phân nhóm rõ ràng, ô đăng ký nhận tin và dòng chữ thương hiệu khổ lớn ở đáy trang."
  },
  {
    "id": "ms-space-voyage",
    "row": 0,
    "title": "Space Voyage",
    "category": "Hero & Giới thiệu",
    "imageUrl": "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260808_192942_e1086505-d7da-433b-a59b-8220f4e6c808.png&w=720&q=85",
    "fallbackUrl": "https://threeui.com/social/pages/landing-pages/aera-01-landing-page.jpg",
    "summaryVi": "Bố cục mở đầu chủ đề không gian với chiều sâu thị sai và thanh điều hướng cố định.",
    "specs": {
      "layout": "Khung toàn màn hình · Tâm điểm thị sai",
      "motion": "Trôi quỹ đạo chậm + xuất hiện chữ tuần tự",
      "responsive": "Điện thoại · máy tính bảng · máy tính",
      "durationMs": 640,
      "easing": "cubic-bezier(0.16, 1, 0.3, 1)"
    },
    "tags": [
      "Không gian",
      "Thị sai",
      "Toàn khung",
      "Điều hướng"
    ],
    "promptText": "# Build: \"Planet Jumping\" single-page immersive space portal experience\nCreate a SINGLE self-contained HTML file (inline <style> and <script>, no build step,\nno external JS/CSS libraries). It must render a full-viewport cinematic landing\nexperience with a canvas-driven 3D \"portal\" and a video preloader sequence.\n====================================================================\n1. REMOTE ASSETS use these EXACT URLs (do not substitute)\n====================================================================\nBASE = [asset-url]\nMARS_BG (video) = BASE/3c83091e-4046-4fd6-adbb-2edb728be79a.mp4\nTO_EARTH (video) = BASE/fc3ded42-e845-41f3-a830-5cab512d79cd.mp4\nTO_VENUS (video) = BASE/b30f64d9-1637-477a-83df-d0fc6461a422.mp4\nTO_MARS (video) = BASE/5fc5651c-3b5d-4171-b507-87f7e635d1b4.mp4\nMERCURY (image) = BASE/d6fb8b6b-c15e-4aaa-9cf7-45bbb5e33372.jpg\nLOGO (svg) = BASE/eb7e0f53-50cd-4af5-abc4-8b9a52cdc01b.svg\nAll <video> tags: muted, playsinline, preload=\"auto\". No controls, no autoplay\nattribute (playback is driven by JS).\n====================================================================\n2. FONTS\n====================================================================",
    "starterPrompt": "Thiết kế trang mở đầu Space Voyage với nền không gian đa lớp, tiêu đề cỡ lớn chính giữa và thanh điều hướng tối giản."
  },
  {
    "id": "ms-phoenix-ignis",
    "row": 0,
    "title": "Phoenix ignis",
    "category": "Cảnh 3D",
    "imageUrl": "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261031_020340_4815bb8d-68c3-48c4-ad05-6307d085e896.png&w=720&q=82",
    "fallbackUrl": "https://threeui.com/social/pages/sections/footers/section-aera-01-footers.jpg",
    "summaryVi": "Cảnh hạt phát sáng chuyển động theo luồng nhiệt với tiêu đề đặt nổi trên lớp sương mờ.",
    "specs": {
      "layout": "Sân khấu hạt 3D + khung chữ căn đáy",
      "motion": "Luồng hạt bốc lên + biến thiên độ sáng",
      "responsive": "Điện thoại · máy tính bảng · máy tính",
      "durationMs": 680,
      "easing": "cubic-bezier(0.22, 1, 0.36, 1)"
    },
    "tags": [
      "Hệ hạt",
      "Ánh lửa",
      "Chiều sâu",
      "Sân khấu"
    ],
    "promptText": "# Myth Atlas Äî Interactive 3D Creature Field Guide (exact recreation prompt)\nBuild a single-file, full-viewport web app called **Myth Atlas**: an interactive 3D field guide to creatures that never existed. It looks like a museum specimen plate on warm sandstone paper. A phoenix and a kraken sit in the centre as real textured 3D models you can drag, zoom and spin. A left sidebar, two specimen tabs, and a right catalogue card surround them. Clicking a tab flies one model out and springs the other in, while the card's copy swaps with a staggered rise. A sun button flips the whole page and the 3D lighting to a dark dusk mode.\nVanilla HTML, CSS and JS in one file, using Three.js r170 from a CDN import map. No frameworks and no build step. Reproduce every value, string, icon, URL and timing below exactly.\n## 1. Head and external resources\n- `<!DOCTYPE html>`, `lang=\"en\"`, charset utf-8, viewport `width=device-width, initial-scale=1, viewport-fit=cover`.\n- Title: `Myth Atlas Äî Featured creatures`\n- Meta description: `Turn a phoenix and a kraken in your hands. An interactive 3D field guide to creatures that never existed.`",
    "starterPrompt": "Tạo sân khấu 3D Phoenix Ignis với hiệu ứng hạt phát sáng chuyển động mềm, đặt tiêu đề lớn và nút khám phá ở phần dưới."
  },
  {
    "id": "ms-nexacore-control",
    "row": 0,
    "title": "NexaCore Control",
    "category": "Trình diễn sản phẩm",
    "imageUrl": "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260516_090123_74be96d4-9c1b-40cf-932a-96f4f4babed3.png&w=720&q=85",
    "fallbackUrl": "https://raw.githubusercontent.com/broamstuck-cybr/SOURCEOFKNOWLEDGFORAI/main/assets/previews/codefronts-course-card.png",
    "summaryVi": "Trung tâm giám sát hạ tầng đám mây với sơ đồ nút mạng, trạng thái cụm máy chủ và cảnh báo.",
    "specs": {
      "layout": "Lưới mô-đun giám sát · Thẻ trạng thái",
      "motion": "Xung nhịp kết nối + mở rộng ngăn chi tiết",
      "responsive": "Điện thoại · máy tính bảng · máy tính",
      "durationMs": 400,
      "easing": "cubic-bezier(0.2, 0.8, 0.2, 1)"
    },
    "tags": [
      "Hạ tầng",
      "Giám sát",
      "Sơ đồ nút",
      "Mô-đun"
    ],
    "promptText": "Build a single React + TypeScript + Tailwind CSS v3 component called `FreedomSection`. It uses `hls.js` for HLS video streaming and `useEffect` / `useRef` from React. No external icon libraries all icons are inline SVG or `<img>` tags. Fully mobile-responsive. No hover states.\n## Global font\nRegister **\"Mazzard H\"** in `index.css` and apply it globally:\n```css\n@font-face {\nfont-family: 'Mazzard H';\nfont-weight: 400;\nfont-style: normal;\nsrc: url('[asset-url]') format('woff2'),\nurl('[asset-url]') format('woff'),\nurl('[asset-url]') format('truetype');\n}\n@font-face {\nfont-family: 'Mazzard H';\nfont-weight: 500;\nfont-style: normal;\nsrc: url('[asset-url]') format('woff2'),\nurl('[asset-url]') format('woff'),\nurl('[asset-url]') format('truetype');\n}\n@tailwind base;\n@tailwind components;\n@tailwind utilities;\n@layer base {\nhtml, body, * { font-family: 'Mazzard H', sans-serif; }\n}\n```\n## Dependencies\n`hls.js` must be installed: `npm install hls.js`. It is imported as `import Hls from 'hls.js'`.\n## File: `src/components/FreedomSection.tsx`\n### Constants (top of file)\n```ts\nconst HLS_SRC = '[asset-url]';\nconst CROSS_ICON = '[asset-url]';\nconst CHECK_ICON = '[asset-url]';",
    "starterPrompt": "Tạo bảng điều khiển NexaCore hiển thị sơ đồ kết nối cụm máy chủ, tỷ lệ tải CPU/RAM và danh sách sự kiện hệ thống."
  },
  {
    "id": "ms-design-rocket-email-hero",
    "row": 0,
    "title": "Email Marketing",
    "category": "Kêu gọi hành động",
    "imageUrl": "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260514_154203_6c6f94dc-a07e-4ba5-8688-106f01ccd2c8.png&w=720&q=85",
    "fallbackUrl": "https://raw.githubusercontent.com/broamstuck-cybr/SOURCEOFKNOWLEDGFORAI/main/assets/previews/lucianlabs-isometric-data-blocks.png",
    "summaryVi": "Khối đăng ký nhận bản tin thiết kế hàng tuần với biểu mẫu 1 trường nhập và thẻ xem trước số mới nhất.",
    "specs": {
      "layout": "Chia 2 cột: biểu mẫu đăng ký + bản xem trước",
      "motion": "Kiểm tra email tức thì + chuyển trạng thái gửi",
      "responsive": "Điện thoại · máy tính bảng · máy tính",
      "durationMs": 380,
      "easing": "cubic-bezier(0.2, 0.8, 0.2, 1)"
    },
    "tags": [
      "Bản tin",
      "Biểu mẫu",
      "Chuyển đổi",
      "Đăng ký"
    ],
    "promptText": "Prompt: Recreate \"Design Rocket Certificates\" Email-Style Landing Page\nBuild a single-page React + TypeScript + Vite + Tailwind CSS project that renders an email-style marketing page for a \"Design Rocket Certificates\" AI leadership course, built in collaboration with Microsoft. Use lucide-react for icons. No other UI libraries.\nGlobal setup\nindex.html\nTitle: Newsletter Design Build Out\nPreconnect to fonts.googleapis.com and fonts.gstatic.com\nLoad Google Fonts: Instrument Serif (ital 0,1) and Plus Jakarta Sans (weights 400, 500, 600, 700)\nsrc/index.css\n@tailwind base;\n@tailwind components;\n@tailwind utilities;\n:root {\n--font-display: 'Instrument Serif', serif;\n--font-body: 'Plus Jakarta Sans', sans-serif;\n}\nbody {\nfont-family: var(--font-body);\nfont-weight: 400;\n-webkit-font-smoothing: antialiased;\n}\nHeadings use inline style={{ fontFamily: \"'Instrument Serif', serif\" }}. Body copy uses Plus Jakarta Sans (default).\nPage shell\nOuter page: min-h-screen bg-[#050505] py-10 px-4 font-sans\nEmail container: max-w-[640px] mx-auto shadow-2xl overflow-hidden ring-1 ring-white/5\nContent card: bg-[#111111] text-[#F2F2F2]\nShared components\nStep numbered row",
    "starterPrompt": "Dựng khu vực đăng ký bản tin gồm ô nhập email có kiểm tra hợp lệ, nút xác nhận rõ ràng và khung xem trước kỳ phát hành mới."
  },
  {
    "id": "ms-spatial-closet",
    "row": 0,
    "title": "Spatial Closet",
    "category": "Bảng giá & Thẻ",
    "imageUrl": "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261114_023843_9fce0893-294b-4ede-8abb-5962c0f6f88a.png&w=720&q=82",
    "fallbackUrl": "https://raw.githubusercontent.com/broamstuck-cybr/SOURCEOFKNOWLEDGFORAI/main/assets/previews/lucianlabs-liquid-glass-button.png",
    "summaryVi": "Lưới thẻ Bento quản lý danh mục tài sản số với biểu đồ dung lượng, thẻ phân loại và bộ lọc nhanh.",
    "specs": {
      "layout": "Lưới Bento 4×3 · Thẻ kích thước đa dạng",
      "motion": "Co giãn bố cục khi lọc + nổi viền thẻ đang chọn",
      "responsive": "Điện thoại · máy tính bảng · máy tính",
      "durationMs": 420,
      "easing": "cubic-bezier(0.22, 1, 0.36, 1)"
    },
    "tags": [
      "Lưới Bento",
      "Thẻ dữ liệu",
      "Dung lượng",
      "Phân loại"
    ],
    "promptText": "# HERO PROMPT \"Atelia\" spatial / AR closet shopping interface (exact recreation)\nBuild one self-contained `index.html` with inline `<style>` and `<script>`, no framework and no build step. It must recreate the \"Atelia Spatial Closet\" hero exactly as specified below.\nThe hero is a full-screen AR-concept shopping interface floating inside a photoreal dark-walnut walk-in closet:\n1. **Featured window (left).** A thick warm-taupe glass frame holding an editorial photo, a small-caps kicker and a light serif headline. Three glass pill tabs hang along its top edge: **TRENDING**, **COLLECTIONS** and **EXPLORE**.\n2. **Tile wall (right).** Eight taupe glass category tiles on a 2×4 wall turned toward the viewer: the right column is nearer and larger.\n3. **Pop-out card.** One frontal card (\"Clothing 345 items \") pops out over the window's right edge.\n**Interaction:**\n- Clicking a tile glides its card out of the wall into the pop-out position and switches the window to that category.\n- The tabs switch the editorial.\n- The cursor tilts the scene slightly.\n**Rules:**\n- Every number below is load-bearing. Where a value is given, use exactly that value.",
    "starterPrompt": "Thiết kế bảng thẻ Bento Spatial Closet gồm thẻ thống kê dung lượng, danh sách tệp gần đây và bộ lọc theo định dạng."
  },
  {
    "id": "ms-heritage-grove",
    "row": 0,
    "title": "Heritage Grove",
    "category": "Chân trang & Điều hướng",
    "imageUrl": "https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/4f690bd1-881a-4192-82f2-d714d34c8fb9.png",
    "fallbackUrl": "https://threeui.com/social/pages/hero/advanced-glass-material.jpg",
    "summaryVi": "Chân trang biên tập tông ấm kết hợp thông tin liên hệ, giờ làm việc, bản đồ vị trí và mục lục trang.",
    "specs": {
      "layout": "Khung thông tin 2 tầng · Chia 5 cột cân đối",
      "motion": "Chuyển màu liên kết mượt + cuộn mượt lên đầu trang",
      "responsive": "Điện thoại · máy tính bảng · máy tính",
      "durationMs": 420,
      "easing": "cubic-bezier(0.25, 1, 0.5, 1)"
    },
    "tags": [
      "Biên tập",
      "Mục lục",
      "Liên hệ",
      "Cuộn đầu trang"
    ],
    "promptText": "Create exactly ONE file, named `index.html`, in the project root.\nDo not create any other file: no footer.html, no styles.css, no script.js, no assets\nfolder, no README, no config. Everything markup, CSS, SVG icons lives inside\n`index.html`. If `index.html` already exists, overwrite it.\nBuild a single, self-contained, full-viewport website footer section. No build step,\nno frameworks, no external JS. Only external resource allowed: Google Fonts.\nSet the document title to \"Heritage Grove Footer\".\n=== BACKGROUND VIDEO (use these exact URLs verbatim, do not download or substitute) ===\nVideo (MP4):\n[asset-url]\nPoster / reduced-motion still (PNG):\n[asset-url]\nThe clip is a 10s, 1080p, 16:9 loop of a hand-drawn teal ink landscape misty layered\nmountains, a still lake, pine-covered rocky outcrops on both edges, two cranes gliding\nacross a cream paper sky. Static camera. It is the section's only imagery.\n=== FONTS ===\n<link rel=\"preconnect\" href=\"[asset-url]\">\n<link rel=\"preconnect\" href=\"[asset-url]\" crossorigin>\n[asset-url]\n- Body/UI: Poppins, fallback \"Helvetica Neue\", Arial, sans-serif\n- Brand wordmark only: Cormorant Garamond 500, fallback Georgia, serif",
    "starterPrompt": "Thiết kế chân trang Heritage Grove mang phong cách biên tập ấm áp với địa chỉ, danh mục bài viết, liên kết xã hội và nút về đầu trang."
  },
  {
    "id": "ms-portal",
    "row": 1,
    "title": "Portal",
    "category": "Hero & Giới thiệu",
    "imageUrl": "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261108_070809_9454266a-bcc7-474e-854a-bc5770e5ceb3.png&w=720&q=88",
    "fallbackUrl": "https://threeui.com/social/pages/three-js/structure-flow/expanse-field.jpg",
    "summaryVi": "Cửa sổ trung tâm mở rộng theo cuộn trang kết hợp khung chữ biên tập sắc nét.",
    "specs": {
      "layout": "Khung cửa sổ tâm điểm · Lưới đối xứng",
      "motion": "Phóng khung khẩu độ theo tiến độ cuộn",
      "responsive": "Điện thoại · máy tính bảng · máy tính",
      "durationMs": 580,
      "easing": "cubic-bezier(0.22, 1, 0.36, 1)"
    },
    "tags": [
      "Khẩu độ",
      "Cuộn trang",
      "Biên tập",
      "Tâm điểm"
    ],
    "promptText": "Build a password manager landing page hero section using React, TypeScript, Tailwind CSS, Framer Motion, and Lucide React icons. Here is every specification:\n### Fonts\n- **Heading font:** \"Helvetica Now Display Bold\" -- load via this stylesheet in `index.html`:\n```\n<link href=\"[asset-url]\" rel=\"stylesheet\">\n```\n- **Body font:** \"Plus Jakarta Sans\" (weights 300-900) -- load via Google Fonts in `index.css`:\n```\n@import url('[asset-url]');\n```\n### CSS Variables (defined in `:root` in `index.css`)\n```\n--font-heading: 'Helvetica Now Display Bold', sans-serif;\n--font-body: 'Plus Jakarta Sans', sans-serif;\n--color-text: #192837;\n--color-accent: #7342E2;\n--color-login-bg: #F2F2EE;\n```\nGlobal reset: `* { box-sizing: border-box; }`, body uses `var(--font-body)`, `var(--color-text)`, margin/padding 0.\n### Background\nFull-viewport looping background video, absolutely positioned, covering the entire page with `object-cover`. URL:\n```\n[asset-url]\n```\nAttributes: `autoPlay`, `muted`, `loop`, `playsInline`. Classes: `absolute inset-0 z-0 w-full h-full object-cover`.\n### Logo (inline SVG component)\nA custom geometric SVG logo, 32x32, viewBox `0 0 256 256`, fill `#192837`:\n```",
    "starterPrompt": "Dựng bố cục Portal với khung cửa sổ trung tâm mở rộng khi cuộn, đặt tiêu đề hai dòng và nút thao tác nhanh bên dưới."
  },
  {
    "id": "ms-orbit-flora",
    "row": 1,
    "title": "Orbit Flora",
    "category": "Cảnh 3D",
    "imageUrl": "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260808_192942_e1086505-d7da-433b-a59b-8220f4e6c808.png&w=720&q=82",
    "fallbackUrl": "https://threeui.com/social/pages/motion-design/cathode-session/angles.jpg",
    "summaryVi": "Vòng xoay thực thể hữu cơ sắp xếp theo quỹ đạo elip trong không gian ba chiều.",
    "specs": {
      "layout": "Quỹ đạo elip 3D · Tâm chữ cố định",
      "motion": "Xoay vòng thẻ theo vận tốc cuộn và kéo chuột",
      "responsive": "Điện thoại · máy tính bảng · máy tính",
      "durationMs": 620,
      "easing": "cubic-bezier(0.22, 1, 0.36, 1)"
    },
    "tags": [
      "Quỹ đạo elip",
      "Không gian",
      "Kéo xoay",
      "Thẻ nổi"
    ],
    "promptText": "Build a **single-file** `index.html` full-viewport poster. No scroll. No frameworks. No redesign. Match layout, type, color, both image URLs, entrance choreography, mobile menu, and mouse morph-reveal **exactly**.\n## 0. Document shell\n```html\n<!doctype html>\n<html lang=\"en\" class=\"anim\">\n<head>\n<meta charset=\"utf-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1, viewport-fit=cover\">\n<meta name=\"theme-color\" content=\"#161616\">\n<title>Orbit Secure system</title>\n```\n- Root `<html>` starts with class `anim`\n- `html, body`: `width/height 100%`, `margin: 0`, `overflow: hidden`, background `#161616`\n- Body: `\"Orbit Sans\", Arial, Helvetica, sans-serif`, color `#fff`, antialiased\n- CSS vars:\n- `--ink: #ffffff`\n- `--surface: #161616`\n- `--orb-reveal: cubic-bezier(.16, 1, .3, 1)`\n- `--orb-soft: cubic-bezier(.25, .8, .28, 1)`\nStructure:\n```\nmain.viewport (fixed, inset 0, black)\nsection.stage (absolute, inset 0, contain:strict, isolation:isolate)\n[all poster elements]\n```\nZ-order: wordmark `1` flower `2` corner copy `3` brand/nav/pill `4`. Mobile: scrim `9`, sheet `10`, burger `12`.\n## 1. Fonts (mandatory)",
    "starterPrompt": "Xây dựng vòng xoay Orbit Flora xếp các thẻ hình ảnh theo quỹ đạo elip 3D bao quanh cụm tiêu đề trung tâm."
  },
  {
    "id": "ms-digitwist-hero",
    "row": 1,
    "title": "Digitwist AI Builder",
    "category": "Trình diễn sản phẩm",
    "imageUrl": "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260728_050334_5b076e26-0ce7-4898-b432-d764190e448f.png&w=720&q=85",
    "fallbackUrl": "https://threeui.com/social/pages/landing-pages/aera-01-landing-page.jpg",
    "summaryVi": "Trình dựng giao diện trực quan kéo thả khối thành phần kèm khung xem trước đa kích thước.",
    "specs": {
      "layout": "Khung soạn thảo 2 ngăn + thanh công cụ nổi",
      "motion": "Khớp vị trí khối bằng lò xo + đổi khung nhìn",
      "responsive": "Điện thoại · máy tính bảng · máy tính",
      "durationMs": 420,
      "easing": "cubic-bezier(0.22, 1, 0.36, 1)"
    },
    "tags": [
      "Trình dựng",
      "Xem trước",
      "Kéo thả",
      "Đa khung nhìn"
    ],
    "promptText": "Create a dark mode hero section for an AI website builder with the following exact specifications:\n## Technical Setup\n### Required Packages\nInstall these packages:\n- `motion` (version 12.23.24 or later) - for animations\n- `hls.js` (version 1.6.15 or later) - for video streaming\n- `lucide-react` (version 0.487.0 or later) - for icons\n### Fonts\nImport these Google Fonts:\n```css\n@import url('[asset-url]');\n```\n## Layout Structure\n### Navbar Component\nCreate a fixed, transparent navbar with:\n**Position & Styling:**\n- Fixed to top, full width, z-index 50\n- Background: fully transparent (bg-transparent)\n- Padding: px-6 py-4\n- Flexbox layout: items-center justify-between\n**Left Section:**\n- Sunburst icon (24x24px SVG) in white color\n**Center Section** (hidden on mobile, visible md:flex):\n- Navigation links: \"Products\" (with ChevronDown icon), \"Customer Stories\", \"Resources\", \"Pricing\"\n- Font: Instrument Sans, text-sm, font-medium\n- Color: text-white/80, hover:text-white\n- Gap: gap-8\n**Right Section:**\n- \"Book A Demo\" link (hidden on small screens, sm:block)\n- \"Get Started\" button: white background, black text, rounded-full, px-5 py-2.5, font-semibold\n### Hero Section Component",
    "starterPrompt": "Xây dựng màn hình sản phẩm Digitwist với danh sách khối bên trái, sân khấu chỉnh sửa ở giữa và nút chuyển giữa khung điện thoại, máy tính bảng và máy tính."
  },
  {
    "id": "ms-designpro-hero",
    "row": 1,
    "title": "DesignPro Academy",
    "category": "Kêu gọi hành động",
    "imageUrl": "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260727_225202_f9e684f3-dc19-469a-8142-eb391bfc601b.png&w=720&q=85",
    "fallbackUrl": "https://threeui.com/social/pages/sections/footers/section-aera-01-footers.jpg",
    "summaryVi": "Khung chiêu sinh khóa học thực hành thiết kế giao diện với lộ trình tuần, học phí và nút giữ chỗ.",
    "specs": {
      "layout": "Khung tiêu điểm + thẻ lộ trình 4 chặng",
      "motion": "Mở chi tiết từng tuần + nổi nút đăng ký",
      "responsive": "Điện thoại · máy tính bảng · máy tính",
      "durationMs": 440,
      "easing": "cubic-bezier(0.22, 1, 0.36, 1)"
    },
    "tags": [
      "Khóa học",
      "Lộ trình",
      "Đăng ký",
      "Đào tạo"
    ],
    "promptText": "Create a full-screen hero section for a product design education platform called \"DesignPro\" with the following exact specifications:\nBackground:\nFull-screen looping video background using this exact CloudFront URL: [asset-url]\nVideo should autoplay, loop, be muted, and play inline\nBackground color: black (#000000)\nNavigation Bar:\nLogo: Circular design with a white border (2px), containing a smaller filled white circle inside, followed by \"DesignPro\" text\nNavigation links in a rounded pill container with gray-700 border: Home, About Us, Courses, Instructors, Testimonials, Blog, Contact us (with arrow icon)\nAll nav links: white/80 opacity, hover to full white\nFont size: text-sm\nMobile: Show hamburger menu icon on screens smaller than lg\nMax width: 7xl container with proper padding\nContent Layout:\nTop Section (below nav):\nTwo-column layout on large screens, stacked on mobile\nLeft column: \"We deliver transformative programs that empower emerging product designers with cutting-edge expertise and vision to thrive globally.\"\nRight column (right-aligned on lg+): \"8000+ Talented Designers Launched !\"\nBoth paragraphs: white/80 opacity, text-sm on mobile, text-base on desktop",
    "starterPrompt": "Thiết kế khối kêu gọi đăng ký khóa học DesignPro với danh sách 4 học phần, số suất còn nhận và nút đăng ký học thử."
  },
  {
    "id": "ms-card-stack",
    "row": 1,
    "title": "Card Stack",
    "category": "Bảng giá & Thẻ",
    "imageUrl": "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261106_084005_ab0d1fcf-a93f-4e32-a277-1523e1768fbe.png&w=720&q=82",
    "fallbackUrl": "https://raw.githubusercontent.com/broamstuck-cybr/SOURCEOFKNOWLEDGFORAI/main/assets/previews/codefronts-course-card.png",
    "summaryVi": "Bộ thẻ xếp chồng có thể lật chuyển mượt mà để so sánh các gói quyền lợi và thông số kỹ thuật.",
    "specs": {
      "layout": "Ngăn xếp thẻ 3 lớp · Điều hướng tiến/lùi",
      "motion": "Đẩy thẻ đầu ra sau với quán tính lò xo",
      "responsive": "Điện thoại · máy tính bảng · máy tính",
      "durationMs": 460,
      "easing": "cubic-bezier(0.22, 1, 0.36, 1)"
    },
    "tags": [
      "Xếp chồng",
      "Thẻ lật",
      "Lò xo",
      "So sánh"
    ],
    "promptText": "# Opaque Stack: WebGL Leaning-Card Portfolio with Fly-to-Page Transition (exact recreation prompt)\nBuild a single-file portfolio home page for a fictional creative studio, **OPAQUE **.\n**The stack:** on an off-white `#fafafa` canvas, a long diagonal row of thin portrait image cards stands in 3D. Each card is turned 30 and the row leans from the lower left to the upper right, seen through a very narrow 5 lens from slightly above.\n- **Scroll or drag:** the row slides endlessly along its diagonal, with eased momentum.\n- **Hover:** the card under the cursor slides out of the stack, and its uppercase title follows the cursor.\n- **Click a card:**\n1. Every other card vanishes at once.\n2. The clicked card glides to the centre of the screen, turns to face the viewer and becomes square, while the camera flies to a straight-on view.\n3. The project page fades in over it: a centred title and description, a two-column image grid, and a \"Next project\" row.\n- **Back:** clicking \"OPAQUE PROJECTS\" (or pressing Esc) returns to the stack, and the row flies in again.\nEach card's edges blur softly into the page through a custom shader: sharp in the middle, blurred towards every edge.",
    "starterPrompt": "Dựng thành phần Card Stack xếp 4 thẻ thông tin chồng lên nhau, cho phép bấm hoặc gạt để chuyển thẻ phía sau lên đầu."
  },
  {
    "id": "ms-koru-tech-footer",
    "row": 1,
    "title": "Koru Tech Footer",
    "category": "Chân trang & Điều hướng",
    "imageUrl": "https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/139344bb-585a-4867-9a31-94cbfad8f6d9.jpg",
    "fallbackUrl": "https://raw.githubusercontent.com/broamstuck-cybr/SOURCEOFKNOWLEDGFORAI/main/assets/previews/lucianlabs-isometric-data-blocks.png",
    "summaryVi": "Chân trang kỹ thuật tối giản có đèn báo trạng thái máy chủ, bộ chọn ngôn ngữ và sơ đồ tài liệu.",
    "specs": {
      "layout": "Lưới kỹ thuật viền 1px · 4 nhóm tài liệu",
      "motion": "Nhấp nháy đèn trạng thái xanh + mở menu ngôn ngữ",
      "responsive": "Điện thoại · máy tính bảng · máy tính",
      "durationMs": 360,
      "easing": "cubic-bezier(0.2, 0.8, 0.2, 1)"
    },
    "tags": [
      "Kỹ thuật",
      "Tài liệu",
      "Trạng thái",
      "Đa ngôn ngữ"
    ],
    "promptText": "# Prompt: Koru Tech footer\nBuild a single-file **website footer section** (header bar plus full footer, one screen) for a fictional IT services company, **Koru Tech**. Use plain HTML, CSS and vanilla JS, with no framework and no build step. The look is dark and techy: a near-black green page and a glass nav. At the bottom, a glowing emerald horizon over a perspective grid floor, with a giant outlined \"KORU TECH\" wordmark standing on the horizon line. Emerald accents throughout.\n## Media\n- **Still:** `[asset-url]` (1920×1280, 3:2). A dark green-black sky, a bright emerald horizon light low in the frame (horizon at 78.6% height), and a faint emerald perspective grid floor below.\n- **Motion:** a muted 4s loop of the same scene, `[asset-url]` (1600×1064).\n- The camera glides forward over the grid; the grid lines stream towards the viewer and the horizon glow breathes brighter and dimmer.\n- The horizon was stabilised so it never moves, and the last second crossfades into the first, so it loops without a jump and never plays in reverse.\n- Fade it in (0.9s) once its first frame is ready.\n- **Rule:** nothing in the scene is drawn or animated in code. Only the UI animates.",
    "starterPrompt": "Tạo chân trang Koru Tech với khung viền 1px, chỉ báo trạng thái hệ thống hoạt động ổn định và 4 cột dẫn tới tài liệu API."
  },
  {
    "id": "ms-aethera-hero",
    "row": 1,
    "title": "Aethera Studio",
    "category": "Hero & Giới thiệu",
    "imageUrl": "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261107_110008_97f7187c-1b33-4746-ac94-dc00336495be.png&w=720&q=88",
    "fallbackUrl": "https://raw.githubusercontent.com/broamstuck-cybr/SOURCEOFKNOWLEDGFORAI/main/assets/previews/lucianlabs-liquid-glass-button.png",
    "summaryVi": "Trang giới thiệu studio thiết kế theo lưới tạp chí với nhịp chữ serif và khoảng trắng rộng.",
    "specs": {
      "layout": "Lưới biên tập 4 cột · Khoảng thở lớn",
      "motion": "Lật dòng tiêu đề + chuyển ảnh mượt",
      "responsive": "Điện thoại · máy tính bảng · máy tính",
      "durationMs": 480,
      "easing": "cubic-bezier(0.25, 1, 0.5, 1)"
    },
    "tags": [
      "Tạp chí",
      "Serif",
      "Studio",
      "Lưới 4 cột"
    ],
    "promptText": "Prompt: Cinematic Hero Section with Looping Video Background\nCreate a fullscreen single-page hero section using React + Vite + Tailwind CSS + TypeScript with the following specifications:\nFonts:\nDisplay text (headings, logo): Instrument Serif\nBody text (navigation, descriptions): Plus Jakarta Sans\nImport both fonts in /src/styles/fonts.css\nVideo Background:\nURL: [asset-url]\nPosition: top: '300px' with inset: 'auto 0 0 0'\nImplement custom fade-in/fade-out loop logic using React useEffect and useRef:\nUse requestAnimationFrame to continuously monitor currentTime and duration\nFade in over 0.5s at the start (opacity 0 to 1)\nFade out over 0.5s before the end (opacity 1 to 0)\nOn ended event: set opacity to 0, wait 100ms, reset currentTime = 0, then play() again\nThis creates a seamless manual loop with smooth fade transitions\nAdd gradient overlays: absolute inset-0 bg-gradient-to-b from-background via-transparent to-background positioned over the video\nNavigation Bar:\nLogo: \"Aethera \" (with registered trademark symbol as superscript)\nLogo styling: text-3xl, tracking-tight, Instrument Serif, color #000000",
    "starterPrompt": "Tạo giao diện mở đầu Aethera theo phong cách biên tập tạp chí với chữ serif lớn, danh sách chỉ mục và thẻ hình ảnh cân đối."
  },
  {
    "id": "ms-driftlab-hero",
    "row": 1,
    "title": "Jellyfish Scroll",
    "category": "Cảnh 3D",
    "imageUrl": "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261102_045255_3cb4b3c2-3cb5-4af9-93b4-bd88f2f883c3.png",
    "fallbackUrl": "https://threeui.com/social/pages/hero/advanced-glass-material.jpg",
    "summaryVi": "Chuyển động sinh học trôi nổi theo nhịp cuộn dọc kết hợp hiệu ứng khúc xạ bề mặt nước.",
    "specs": {
      "layout": "Lớp cảnh sâu 3 tầng · Cuộn đồng bộ",
      "motion": "Bồng bềnh theo hàm sin + lệch pha khi cuộn",
      "responsive": "Điện thoại · máy tính bảng · máy tính",
      "durationMs": 700,
      "easing": "cubic-bezier(0.25, 1, 0.5, 1)"
    },
    "tags": [
      "Khúc xạ",
      "Cuộn dọc",
      "Sinh học",
      "Đa tầng"
    ],
    "promptText": "# Driftlab Jellyfish Scroll Hero (exact recreation prompt)\nGive me a single-file, scroll-driven hero called **Driftlab**. A pink jellyfish floats in the middle of a lilac sky. Huge condensed black words arrive big from the lower right on a curve, pass behind the jellyfish, pause in the centre and leave to the left. After the last word falls away, the jellyfish grows and two text panels appear in turn while it moves to the other side.\nPlain HTML, CSS and one vanilla script with raw WebGL2 in one file, with no libraries. The only external resources are the Google Fonts and the three media URLs below. Reproduce every value, string and timing exactly, and use the complete code at the end as the source of truth.\nSix rules define it:\n1. **One canvas, drawn in this order:** sky, points, words, jellyfish. Depth is simply draw order, which is why the jellyfish is always in front of the letters.\n2. **The jellyfish is a green-screen video keyed in a shader.** `d = g - max(r,b)` and `alpha = 1 - smoothstep(.10,.38,d)`. Green spill is clamped with `g = min(g, max(r,b)*.96)`. Translucent tentacles keep the letters visible through them.\n3.",
    "starterPrompt": "Dựng trang Driftlab với hoạt cảnh chuyển động nhịp nhàng theo vị trí cuộn trang và lớp thẻ thông số bán trong suốt."
  },
  {
    "id": "ms-neuralyn-hero",
    "row": 1,
    "title": "Neuralyn",
    "category": "Trình diễn sản phẩm",
    "imageUrl": "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261108_192006_dd6f50c5-96f1-4366-a0b9-0e4a09cf5b0d.png&w=720&q=85",
    "fallbackUrl": "https://threeui.com/social/pages/three-js/structure-flow/expanse-field.jpg",
    "summaryVi": "Không gian làm việc xử lý dữ liệu âm thanh và ngôn ngữ với sóng phổ trực quan.",
    "specs": {
      "layout": "Khung sóng âm trung tâm + thẻ chỉ số 4 cột",
      "motion": "Dao động cột sóng + trượt thanh tiến trình",
      "responsive": "Điện thoại · máy tính bảng · máy tính",
      "durationMs": 450,
      "easing": "cubic-bezier(0.25, 1, 0.5, 1)"
    },
    "tags": [
      "Sóng âm",
      "Xử lý",
      "Chỉ số",
      "Trực quan"
    ],
    "promptText": "Create a dark landing page for \"Neuralyn\" an analytics dashboard SaaS. Use React + Vite + Tailwind CSS + TypeScript + Framer Motion + shadcn/ui.\nFonts\nPlus Jakarta Sans (400, 500, 600, 700) for body/UI via @fontsource/Plus Jakarta Sans\nInstrument Serif (400, 400-italic) for the italic accent word via @fontsource/instrument-serif\nColor Theme (all HSL, dark mode by default in :root)\nBackground: 0 0% 0% (pure black)\nForeground: 0 0% 100% (pure white)\nMuted foreground: 0 0% 65%\nCard: 0 0% 5%\nBorder: 0 0% 20%\nHero subtitle: 210 17% 95%\nPage Structure\nSection 1: Hero (full viewport height, overflow-hidden)\nNavbar horizontal, padded px-8 md:px-28 py-4:\nLeft: Logo image + \"Neuralyn\" text (text-xl font-bold tracking-tight) + nav links (Home, Services with ChevronDown icon, Reviews, Contact us) links hidden on mobile, gap-1 between links, gap-12 md:gap-20 between logo and links\nRight: \"Sign In\" button solid white background (bg-foreground), black text (text-background), rounded-lg text-sm font-semibold, hover opacity transition\nHero Content centered column, mt-16 md:mt-20 px-4:",
    "starterPrompt": "Thiết kế giao diện Neuralyn hiển thị biểu đồ sóng âm tương tác, bộ lọc nguồn dữ liệu và 4 thẻ thông số độ trễ."
  },
  {
    "id": "ms-datacore-booking-hero",
    "row": 1,
    "title": "Datacore Booking",
    "category": "Kêu gọi hành động",
    "imageUrl": "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261021_093215_b7826239-e451-4e15-b42b-d6bcf9497a32.png&w=720&q=82",
    "fallbackUrl": "https://threeui.com/social/pages/motion-design/cathode-session/angles.jpg",
    "summaryVi": "Khung đặt lịch tư vấn kỹ thuật trực tiếp tích hợp bộ chọn ngày giờ và xác nhận múi giờ tự động.",
    "specs": {
      "layout": "Khung thông tin + lịch chọn khung giờ",
      "motion": "Chuyển bước chọn ngày -> giờ -> xác nhận mượt",
      "responsive": "Điện thoại · máy tính bảng · máy tính",
      "durationMs": 400,
      "easing": "cubic-bezier(0.22, 1, 0.36, 1)"
    },
    "tags": [
      "Đặt lịch",
      "Tư vấn",
      "Khung giờ",
      "Biểu mẫu"
    ],
    "promptText": "Create a responsive, full-screen hero section for a web application using React and Tailwind CSS.\nDesign System & Assets:\nFonts: Load and use 'Manrope' (for UI/Nav), 'Cabin' (for buttons/tags), 'Instrument Serif' (for headlines), and 'Plus Jakarta Sans' (for body text).\nPrimary Color: Purple #7b39fc\nSecondary/Dark Color: Dark Purple #2b2344\nBackground: Use a full-screen, absolute-positioned HTML5 video background. The video should autoplay, loop, mute, and play inline. Ensure it covers the viewport (min-h-screen, object-cover) without an overlay (keep it opaque).\nVideo URL: [asset-url]\n1. Navbar Component (Top Overlay)\nLayout: Full width, transparent background, z-20 relative positioning.\nPadding: px-6 (mobile) to px-[120px] (desktop), py-[16px].\nLogo (Left): Use this specific SVG path filled with white:\nPath: M1.04356 6.35771L13.6437 0.666504... (Future logo shape).\nNavigation Links (Center-Left, Desktop Only):\nItems: \"Home\", \"Services\" (with a ChevronDown icon), \"Reviews\", \"Contact us\".\nStyle: Manrope font, Medium weight, 14px size, White.\nHover effect: opacity-80.\nAction Buttons (Right, Desktop Only):",
    "starterPrompt": "Tạo giao diện đặt lịch tư vấn Datacore cho phép chọn ngày trên lịch tháng, chọn ca làm việc trống và điền thông tin liên hệ."
  },
  {
    "id": "ms-f1-racing-hub",
    "row": 1,
    "title": "F1 Racing Hub",
    "category": "Bảng giá & Thẻ",
    "imageUrl": "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260709_152331_bd312d1a-1f20-46b9-9b68-12bcdcf6d53e.png",
    "fallbackUrl": "https://threeui.com/social/pages/landing-pages/aera-01-landing-page.jpg",
    "summaryVi": "Bảng thẻ thông số tốc độ, thời gian vòng đua và thứ hạng đội đua trình bày theo lưới kỹ thuật.",
    "specs": {
      "layout": "Lưới thẻ telemetry 4 cột · Số liệu monospace",
      "motion": "Cập nhật thanh tốc độ + đổi vòng đua đang xem",
      "responsive": "Điện thoại · máy tính bảng · máy tính",
      "durationMs": 380,
      "easing": "cubic-bezier(0.16, 1, 0.3, 1)"
    },
    "tags": [
      "Thông số",
      "Bảng hạng",
      "Monospace",
      "Thể thao"
    ],
    "promptText": "# Recreate This Page Exactly Lewis Hamilton / Silverstone F1 Hero\n## Tech stack\n- React + TypeScript + Vite\n- Tailwind CSS (config extends `fontFamily.sans` = `['\"Albert Sans\"', 'sans-serif']`, plus custom `f1.dark = rgb(41,41,41)` and `f1.yellow = rgb(237,180,11)`)\n- lucide-react for icons (X, Menu used)\n- Google Font: **Albert Sans** weights 300;400;500;600;700;800, loaded in index.html via `[asset-url]`\n- Body background: `#0a0e1c`, antialiased\n## Overall layout\nA full-screen hero section (`relative w-full overflow-hidden font-sans`) with a page background image and dark overlay, then two responsive layouts:\n**Page background image (used for both page and inside phone screens):**\n```\n[asset-url]\n```\n- Page: `<img>` absolute inset-0 w-full h-full object-cover z-0, then `<div className=\"absolute inset-0 bg-black/70 z-[1]\" />`\n**Desktop (md+):** `hidden md:flex relative z-[2] w-full h-screen items-center justify-center py-6` a flex row `items-end justify-center gap-[2vw]` containing three phone mockups, each wrapped in `animate-fade-slide-up` with delays 300/500/700. Middle phone has `-mb-6`.",
    "starterPrompt": "Tạo bảng thông số kỹ thuật hiển thị thời gian từng chặng, biểu đồ vận tốc và bảng xếp hạng bằng phông chữ monospace sắc nét."
  },
  {
    "id": "ms-nimbusos-footer",
    "row": 1,
    "title": "NimbusOS Footer",
    "category": "Chân trang & Điều hướng",
    "imageUrl": "https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/4ec0de15-9d60-43b1-a76e-7d721f094fd6.jpg",
    "fallbackUrl": "https://threeui.com/social/pages/sections/footers/section-aera-01-footers.jpg",
    "summaryVi": "Chân trang hệ điều hành đám mây tích hợp phím tắt điều hướng nhanh, thông tin phiên bản và nhật ký phát hành.",
    "specs": {
      "layout": "Thanh thông số phiên bản + lưới điều hướng",
      "motion": "Sáng viền thẻ phiên bản + sao chép lệnh cài đặt",
      "responsive": "Điện thoại · máy tính bảng · máy tính",
      "durationMs": 400,
      "easing": "cubic-bezier(0.22, 1, 0.36, 1)"
    },
    "tags": [
      "Hệ điều hành",
      "Phiên bản",
      "Cài đặt",
      "Điều hướng"
    ],
    "promptText": "# Prompt: NimbusOS footer section\nBuild a single-file **footer section** for a fictional digital-growth agency, **NimbusOS**. Use plain HTML, CSS and vanilla JS, with no framework and no build step. A deep indigo, photographic \"sky\" with a soft diagonal light fold fills the screen. A white newsletter call-to-action sits on it at the top left, and a crisp white footer card floats above a striped indigo floor at the bottom.\n## Media\n- **Sky:** `[asset-url]`. A deep indigo-to-violet gradient with a soft diagonal light fold, `background-size: cover`, anchored to the bottom centre.\n- **Floor:** `[asset-url]`. Horizontal indigo and lavender stripes, stretched to 100% width and 157.5u tall at the bottom. Its top 8u fades in with a mask.\n- **Grain:** a fine SVG noise overlay at 7% opacity in `soft-light` blend, tiled at 220u.\n- **Background colour:** `#03063A` behind everything. The background never moves.\n## Scale\n- **Units:** every size is in reference pixels of a 1433×1098 artboard, multiplied by `--u = min(100vw/1433, max(.68px, 100vh/1098))`.\n- **Fill:** the page is one viewport tall.",
    "starterPrompt": "Dựng chân trang NimbusOS có ô sao chép nhanh dòng lệnh cài đặt, huy hiệu phiên bản mới nhất và sơ đồ liên kết toàn trang."
  },
  {
    "id": "ms-asme-hero",
    "row": 2,
    "title": "Asme",
    "category": "Hero & Giới thiệu",
    "imageUrl": "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260801_104316_80b428ea-dc99-4399-afb3-8ccb7b34b2d0.png&w=720&q=85",
    "fallbackUrl": "https://raw.githubusercontent.com/broamstuck-cybr/SOURCEOFKNOWLEDGFORAI/main/assets/previews/codefronts-course-card.png",
    "summaryVi": "Hồ sơ năng lực studio kiến trúc số với khung trưng bày tác phẩm và chỉ số trực quan.",
    "specs": {
      "layout": "Chia đôi bất đối xứng 5/7 · Khung dự án",
      "motion": "Trượt thẻ ngang + đổi trạng thái con trỏ",
      "responsive": "Điện thoại · máy tính bảng · máy tính",
      "durationMs": 460,
      "easing": "cubic-bezier(0.22, 1, 0.36, 1)"
    },
    "tags": [
      "Hồ sơ",
      "Bất đối xứng",
      "Chỉ số",
      "Trưng bày"
    ],
    "promptText": "Build a single-page hero section with a full-screen looping background video, liquid glass UI elements, and a dark cinematic aesthetic. Use React, TypeScript, Tailwind CSS, and Lucide React icons. Here are the exact specifications:\nBackground Video:\nFull-screen muted autoplaying video covering the entire viewport, positioned absolutely with object-cover\nVideo source URL: [asset-url]\nThe video is shifted down by 17% (translate-y-[17%]) so the top portion of the video is cropped -- the interesting content is in the lower portion of the frame\nThe video loops seamlessly with a custom JavaScript fade system (no CSS transitions): 500ms requestAnimationFrame-based fade-in on load/loop start, 500ms fade-out when 0.55 seconds remain before the video ends. A fadingOutRef boolean prevents re-triggering the fade-out from repeated timeUpdate events. On ended, opacity is set to 0, then after 100ms the video resets to currentTime = 0, plays, and fades back in. Each new fade cancels any running animation frame to prevent competing animations. Fades resume from the current opacity rather than snapping.\nThe outer container is min-h-screen bg-black with overflow-hidden\nFont:",
    "starterPrompt": "Xây dựng trang mở đầu Asme chia hai cột bất đối xứng: cột trái đặt tuyên ngôn thiết kế, cột phải hiển thị thẻ dự án tiêu biểu."
  },
  {
    "id": "ms-pixel-garden",
    "row": 2,
    "title": "Pixel Garden",
    "category": "Cảnh 3D",
    "imageUrl": "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261109_023150_cc5c0d10-d6fc-429d-9245-a05e69771f45.png&w=720&q=82",
    "fallbackUrl": "https://raw.githubusercontent.com/broamstuck-cybr/SOURCEOFKNOWLEDGFORAI/main/assets/previews/lucianlabs-isometric-data-blocks.png",
    "summaryVi": "Ma trận điểm ảnh tương tác biến đổi mật độ và độ cao khi di chuyển con trỏ qua vùng lưới.",
    "specs": {
      "layout": "Lưới ma trận điểm · Khung điều khiển góc",
      "motion": "Gợn sóng điểm ảnh theo bán kính con trỏ",
      "responsive": "Điện thoại · máy tính bảng · máy tính",
      "durationMs": 420,
      "easing": "cubic-bezier(0.2, 0.8, 0.2, 1)"
    },
    "tags": [
      "Ma trận",
      "Điểm ảnh",
      "Gợn sóng",
      "Tương tác"
    ],
    "promptText": "# HERO PROMPT \"Dune Play\" by Grovekit (interactive pixel-art plant playground)\nBuild a single self-contained `index.html` (inline CSS + inline vanilla JS, no frameworks, no build step) that recreates the page described below **exactly**. The page is a full-viewport, non-scrolling toy: three pixel-art desert plants (a coconut palm, a barrel cactus with a pink flower, and a jacaranda tree) stand on small sand mounds over a flat warm-sand background. You can click or brush them to shake their leaves and petals loose, turn on weather so the wind bends them and strips foliage off, watch leaves fall and pile up as litter, have everything \"grow back\", flip to an x-ray \"skeleton\" view, toggle sound, switch to a single-plant carousel and toggle dark mode.\nEverything visual on the plants is made of square \"cells\" (fat pixels) drawn on one full-screen `<canvas>`. All UI chrome is HTML floating above the canvas.\nDocument title: **`Dune Play Grovekit`** (with a middle dot). `lang=\"en\"`, UTF-8, `width=device-width,initial-scale=1` viewport.\n## 1. Assets\nExactly three sprites are used.",
    "starterPrompt": "Thiết kế lưới Pixel Garden phản hồi theo vị trí con trỏ chuột với hiệu ứng gợn sóng mượt và bảng chọn chế độ hiển thị."
  },
  {
    "id": "ms-nexora-hero",
    "row": 2,
    "title": "Nexora Automation",
    "category": "Trình diễn sản phẩm",
    "imageUrl": "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260725_120544_94be5de4-0f4f-494c-bb78-c532290040a6.png&w=720&q=85",
    "fallbackUrl": "https://raw.githubusercontent.com/broamstuck-cybr/SOURCEOFKNOWLEDGFORAI/main/assets/previews/lucianlabs-liquid-glass-button.png",
    "summaryVi": "Trình quản lý quy trình tự động hóa kết nối các bước tác vụ bằng đường dẫn trực quan.",
    "specs": {
      "layout": "Sơ đồ luồng ngang · Thẻ bước tác vụ",
      "motion": "Chạy điểm sáng dọc đường nối khi kích hoạt",
      "responsive": "Điện thoại · máy tính bảng · máy tính",
      "durationMs": 480,
      "easing": "cubic-bezier(0.22, 1, 0.36, 1)"
    },
    "tags": [
      "Quy trình",
      "Tự động hóa",
      "Sơ đồ luồng",
      "Tác vụ"
    ],
    "promptText": "Create a SaaS landing page hero section with the following exact specifications:\nPage Layout\nThe entire page is h-screen flex flex-col bg-background overflow-hidden the Navbar + Hero fill exactly 100vh with no scroll.\nThe page uses two Google Fonts imported via CSS: Instrument Serif (display/headings, including italic) and Plus Jakarta Sans (body text).\nFonts & Design Tokens (index.css)\nImport fonts:\n@import url('[asset-url]');\nCSS variables (:root):\n--background: 0 0% 100% (white)\n--foreground: 210 14% 17% (dark charcoal)\n--primary: 210 14% 17% / --primary-foreground: 0 0% 100%\n--secondary: 0 0% 96% / --secondary-foreground: 0 0% 9%\n--muted: 0 0% 96% / --muted-foreground: 184 5% 55%\n--accent: 239 84% 67% (indigo/blue) / --accent-foreground: 0 0% 100%\n--border: 0 0% 90%\n--ring: 239 84% 67%\n--radius: 0.5rem\n--font-display: 'Instrument Serif', serif\n--font-body: 'Plus Jakarta Sans', sans-serif\n--shadow-dashboard: 0 25px 80px -12px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.06)\nTailwind config extends fontFamily with display and body mapped to the CSS vars. All colors use hsl(var(--token)) pattern.\nNavbar",
    "starterPrompt": "Dựng khung trình diễn quy trình Nexora với 4 nút tác vụ nối tiếp nhau, trạng thái chạy thực tế và bảng cấu hình nhanh."
  },
  {
    "id": "ms-launchex-about",
    "row": 2,
    "title": "LaunchEx About",
    "category": "Kêu gọi hành động",
    "imageUrl": "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260514_154203_6c6f94dc-a07e-4ba5-8688-106f01ccd2c8.png&w=720&q=82",
    "fallbackUrl": "https://threeui.com/social/pages/hero/advanced-glass-material.jpg",
    "summaryVi": "Tuyên ngôn ra mắt sản phẩm kết hợp cột mốc phát triển và lời mời tham gia danh sách chờ ưu tiên.",
    "specs": {
      "layout": "Trục cột mốc dọc + hộp đăng ký danh sách chờ",
      "motion": "Sáng dần cột mốc khi cuộn + phản hồi gửi form",
      "responsive": "Điện thoại · máy tính bảng · máy tính",
      "durationMs": 460,
      "easing": "cubic-bezier(0.25, 1, 0.5, 1)"
    },
    "tags": [
      "Danh sách chờ",
      "Cột mốc",
      "Ra mắt",
      "Tuyên ngôn"
    ],
    "promptText": "--\n**Prompt to recreate the About section:**\n> Build a full-viewport \"About the Founders\" section using React with Tailwind CSS and lucide-react for icons. This is a single `<section>` with the following exact specifications:\n>\n> **Section container:**\n> - `id=\"about\"`\n> - Background color: `#F0F5F7`\n> - `min-height: 100vh`\n> - Position relative\n> - Padding: `py-20 sm:py-28 px-6 sm:px-10`\n> - Uses `flex flex-col justify-center` to vertically center content\n>\n> **Inner wrapper:**\n> - `max-w-7xl mx-auto`\n>\n> **Top row -- heading + description (side by side on desktop):**\n> - A flex container: `flex flex-col lg:flex-row items-start justify-between gap-10 lg:gap-20`\n> - All text color: `#154359`\n>\n> **Left side -- Section heading:**\n> - `<h2>` with text `About` on line 1, `the founders` on line 2 (separated by `<br />`)\n> - Uses custom font class `.font-firs` (font-family: `'TT Firs Neue', 'Plus Jakarta Sans', system-ui, sans-serif`)\n> - Font sizes: `text-[36px] sm:text-[48px] lg:text-[54px]`\n> - `font-semibold uppercase tracking-tight leading-[0.95]`\n>\n> **Right side -- Description block:**\n> - `flex flex-col max-w-xl`",
    "starterPrompt": "Dựng trang giới thiệu và đăng ký sớm LaunchEx với dòng thời gian 4 giai đoạn và biểu mẫu nhận quyền truy cập đợt đầu."
  },
  {
    "id": "ms-vela-terms-hero",
    "row": 2,
    "title": "Vela Terms",
    "category": "Bảng giá & Thẻ",
    "imageUrl": "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261108_190717_6580d844-f3b0-4240-8b4a-239355685fc9.png&w=720&q=85",
    "fallbackUrl": "https://threeui.com/social/pages/three-js/structure-flow/expanse-field.jpg",
    "summaryVi": "Bảng thẻ điều khoản và biểu phí giao dịch minh bạch với thanh tìm kiếm mục lục và tóm tắt nhanh.",
    "specs": {
      "layout": "Cột mục lục cố định + lưới thẻ biểu phí",
      "motion": "Cuộn neo mượt tới từng mục + mở rộng giải thích",
      "responsive": "Điện thoại · máy tính bảng · máy tính",
      "durationMs": 360,
      "easing": "cubic-bezier(0.2, 0.8, 0.2, 1)"
    },
    "tags": [
      "Biểu phí",
      "Minh bạch",
      "Mục lục",
      "Tra cứu"
    ],
    "promptText": "# Prompt: Vela \"in your terms\" hero\nBuild a single-file, one-screen hero for a fictional privacy app, **vela**: a secure messaging app, crypto wallet and Web3 browser. Use plain HTML, CSS and vanilla JS, with no framework and no build step. The look is soft and warm: a grainy pastel gradient panel and a huge tight grotesk headline. The first word cycles through four verbs, each with its own glossy 3D icon, and the panel's colour changes with every word. A cream stats strip with a curved notch sits underneath.\n## Media\nFour glossy 3D icons, each a 320×320 webp with transparency, in a soft inflated candy material. The files are orange, but the page shows each icon in its own word's hue (see **Icon tint** below).\n| Word | Icon | File |\n|---|---|---|\n| Message | rounded chat bubble with three embossed dots | `[asset-url]` |\n| Browse | four-pointed sparkle star with two small orbiting spheres | `[asset-url]` |\n| Transact | two curved arrows cycling around a $ coin | `[asset-url]` |\n| Build web | a globe of rounded hexagon-like cells with meridian grooves | `[asset-url]` |\n## Scale and type",
    "starterPrompt": "Thiết kế trang biểu phí và điều khoản Vela gồm mục lục neo bên trái, bảng so sánh mức phí rõ ràng và hộp tóm tắt ngắn gọn."
  },
  {
    "id": "ms-offline-footer",
    "row": 2,
    "title": "Offline",
    "category": "Chân trang & Điều hướng",
    "imageUrl": "https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/af6deff1-d678-4dc6-ae24-2880b16cdb20.jpg",
    "fallbackUrl": "https://threeui.com/social/pages/motion-design/cathode-session/angles.jpg",
    "summaryVi": "Chân trang tương phản cao với đồng hồ múi giờ các văn phòng, liên kết mạng xã hội và bản quyền.",
    "specs": {
      "layout": "Dải đồng hồ 3 múi giờ + cột điều hướng đôi",
      "motion": "Cập nhật kim giây thời gian thực + gạch chân liên kết",
      "responsive": "Điện thoại · máy tính bảng · máy tính",
      "durationMs": 380,
      "easing": "cubic-bezier(0.2, 0.8, 0.2, 1)"
    },
    "tags": [
      "Múi giờ",
      "Tương phản",
      "Văn phòng",
      "Tối giản"
    ],
    "promptText": "# Prompt: \"offline\" power-button footer\nBuild a single-file **website footer** for a fictional digital-wellbeing product, **offline** (\"Everything you need to know before you finally log off\"). Use plain HTML, CSS and vanilla JS, with no framework and no build step. The footer is one full-bleed cinematic scene: a small beige vintage all-in-one computer (generic, no brand logo) on a grassy hill under a blue sky. The wordmark's \"o\" is a power button. Clicking it takes the scene offline: the sky turns to night, the CRT collapses to a point, and that last point of light flies up into the power-o.\n## Media\n- **Scene clip, 1080p:** [asset-url] (1920×1080, 60 fps, 5.0 s, no audio)\n- **Scene clip, 720p, for screens 900 px:** [asset-url]\n- **Poster:** [asset-url] (the clip's first frame: day, screen off)\n- **Fonts:**\n- Instrument Serif 400 (wordmark and column headings), self-hosted latin woff2: [asset-url]\n- Plus Jakarta Sans 400/500 (body and links), latin variable woff2: [asset-url]\n### Clip timeline\nThe clip is one locked-off shot:\n| Time (s) | What happens |\n|---|---|\n| 0 1.17 | Day, CRT off (glossy black screen) |",
    "starterPrompt": "Thiết kế chân trang Offline hiển thị giờ địa phương tại 3 thành phố lớn, danh sách liên kết chính và dòng bản quyền gọn gàng."
  },
  {
    "id": "ms-bloom-ai-hero",
    "row": 2,
    "title": "Bloom AI",
    "category": "Hero & Giới thiệu",
    "imageUrl": "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261113_115509_577e7e29-0e80-43e6-93ac-e6cf71972818.png&w=720&q=85",
    "fallbackUrl": "https://threeui.com/social/pages/landing-pages/aera-01-landing-page.jpg",
    "summaryVi": "Giao diện mở đầu nền tảng trợ lý thông minh với khung nhập lệnh trực tiếp và thẻ gợi ý.",
    "specs": {
      "layout": "Trục dọc tâm điểm · Khung nhập lệnh nổi",
      "motion": "Sáng viền xung nhịp + gõ chữ tuần tự",
      "responsive": "Điện thoại · máy tính bảng · máy tính",
      "durationMs": 440,
      "easing": "cubic-bezier(0.2, 0.8, 0.2, 1)"
    },
    "tags": [
      "Trợ lý",
      "Khung lệnh",
      "Gợi ý",
      "Tương tác"
    ],
    "promptText": "Create a full-screen hero landing page for \"Bloom\" an AI-powered plant/floral design platform. The design uses a liquid glass morphism aesthetic over a looping video background.\nBackground\nFull-screen autoplaying, looping, muted video background: [asset-url]\nVideo covers entire viewport with object-cover, sits at z-0. All content floats above at z-10.\nFonts\nDisplay/Body: Poppins (Google Fonts) used for headings and body text\nSerif accent: Source Serif 4 (Google Fonts) used only for italic/emphasis text inside headings (e.g., <em>, <i>, .italic inside h1-h3)\nHeadings use font-weight: 500\nColor Palette\nStrict grayscale only all CSS variables are 0 0% X% HSL values\nText is text-white, text-white/80, text-white/60, text-white/50 for hierarchy\nNo colored accents whatsoever\nLiquid Glass CSS (two tiers)\nDefine under @layer components:\n.liquid-glass (light)\nbackground: rgba(255,255,255,0.01);\nbackground-blend-mode: luminosity;\nbackdrop-filter: blur(4px);\nborder: none;\nbox-shadow: inset 0 1px 1px rgba(255,255,255,0.1);\nposition: relative; overflow: hidden;",
    "starterPrompt": "Dựng khung mở đầu Bloom với ô nhập lệnh trung tâm, 4 chip gợi ý tác vụ nhanh và bảng kết quả mẫu bên dưới."
  },
  {
    "id": "ms-vell-lookbook",
    "row": 2,
    "title": "Runway Lookbook",
    "category": "Cảnh 3D",
    "imageUrl": "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261102_042056_1a704ff7-b0e5-4a9f-bbda-62392b819fb6.png&w=720&q=82",
    "fallbackUrl": "https://threeui.com/social/pages/sections/footers/section-aera-01-footers.jpg",
    "summaryVi": "Cuộn trưng bày bộ sưu tập theo trục Z đưa từng khung hình tiến về phía người xem.",
    "specs": {
      "layout": "Trục chiều sâu Z · Khung ảnh toàn cảnh",
      "motion": "Tiến lớp ảnh theo trục Z + khóa tiêu cự",
      "responsive": "Điện thoại · máy tính bảng · máy tính",
      "durationMs": 650,
      "easing": "cubic-bezier(0.16, 1, 0.3, 1)"
    },
    "tags": [
      "Trục Z",
      "Bộ sưu tập",
      "Tiêu cự",
      "Trưng bày"
    ],
    "promptText": "# Maison Vell Runway Depth Lookbook (exact recreation prompt)\nGive me a single-file, full-viewport fashion page called **Maison Vell**. Six models stand in one line that recedes from the right of the screen into a blurred distance on the left. Dragging, scrolling or pressing the arrow keys walks the whole line forward: the front model grows and slides out behind the product column, everyone else takes the next place, and a new model arrives out of the haze at the back. The product column on the right scrolls in sync, and a big look number rolls over at bottom left. It loops forever.\nPlain HTML, CSS and one vanilla script in one file, with no libraries. The only external resources are the Google Fonts and the two image sheets below. Reproduce every value, string and timing exactly, and use the complete code at the end as the source of truth.\nSix rules define it:\n1. **One number drives everything.** `p` is the current look position as a float. Each model's depth is `d = wrap(i - p, 6)`, moved into the range -1 to 5. Model, product column and look number are all computed from `p` alone.\n2.",
    "starterPrompt": "Tạo khung trưng bày Lookbook cuộn theo chiều sâu trục Z, hiển thị số thứ tự, tên mẫu và thông số chất liệu ở cạnh bên."
  },
  {
    "id": "ms-adhd-planner",
    "row": 2,
    "title": "ADHD Planner",
    "category": "Trình diễn sản phẩm",
    "imageUrl": "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261107_005547_8a9e6889-76aa-4688-81b5-4452d9afa4ad.png&w=720&q=85",
    "fallbackUrl": "https://raw.githubusercontent.com/broamstuck-cybr/SOURCEOFKNOWLEDGFORAI/main/assets/previews/codefronts-course-card.png",
    "summaryVi": "Ứng dụng lập kế hoạch ngày chia theo khung giờ trực quan, danh sách ưu tiên và đồng hồ tập trung.",
    "specs": {
      "layout": "Lịch trục dọc + cột việc ưu tiên + bộ đếm",
      "motion": "Đánh dấu hoàn thành mượt + co giãn khối giờ",
      "responsive": "Điện thoại · máy tính bảng · máy tính",
      "durationMs": 360,
      "easing": "cubic-bezier(0.2, 0.8, 0.2, 1)"
    },
    "tags": [
      "Lập kế hoạch",
      "Đồng hồ",
      "Ưu tiên",
      "Năng suất"
    ],
    "promptText": "Build a single-page landing site for \"Drift\" -- a calm, ADHD-friendly planner app. Use React + Vite + TypeScript + Tailwind CSS + lucide-react for icons. No other UI libraries.\n### Fonts\nImport via Google Fonts in `index.css`:\n- **Plus Jakarta Sans** (weights 400, 500, 600) -- used as base body font\n- **Instrument Serif** (italic only) -- used for the italic word \"the stress\" in the hero heading\n```css\n@import url('[asset-url]');\n```\nBody: `font-family: 'Plus Jakarta Sans', sans-serif;` with antialiased rendering. `overflow-x: clip` on body.\n### Color Palette\n- Hero overlay: `bg-black/20`\n- About section background: `#F6E4CF`\n- Dark text / icons in About: `#321C04`\n- Light cream (button backgrounds in About): `#FFF9F2`\n- Muted accent (divider, secondary button bg): `#D9C4AA`\n- Secondary button hover: `#CEBA9E`\n- Dark button hover: `#1F1003`\n### Tailwind Config\nAdd a custom keyframe `fade-in-down` (0%: opacity 0, translateY -8px; 100%: opacity 1, translateY 0) with 0.2s ease-out animation.\n### SECTION 1: HERO (full viewport height)\n- Full-screen section (`h-screen`, `overflow-hidden`, `mb-[-25px]` negative bottom margin so the next section overlaps it slightly)",
    "starterPrompt": "Tạo giao diện ứng dụng lập kế hoạch trong ngày gồm dòng thời gian theo giờ, danh sách 3 việc trọng tâm và đồng hồ đếm ngược."
  },
  {
    "id": "ms-kindred-dots-hero",
    "row": 2,
    "title": "Kindred Dot Hands",
    "category": "Kêu gọi hành động",
    "imageUrl": "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261030_025250_100df7b8-31fd-4614-aa4a-c1b7d5b6b273.png",
    "fallbackUrl": "https://raw.githubusercontent.com/broamstuck-cybr/SOURCEOFKNOWLEDGFORAI/main/assets/previews/lucianlabs-isometric-data-blocks.png",
    "summaryVi": "Khối kêu gọi tham gia cộng đồng sáng tạo với bản đồ thành viên điểm chấm và nút kết nối nhanh.",
    "specs": {
      "layout": "Đồ họa ma trận điểm + khung kêu gọi trung tâm",
      "motion": "Nhấp nháy nút điểm thành viên + phóng nhẹ nút chính",
      "responsive": "Điện thoại · máy tính bảng · máy tính",
      "durationMs": 480,
      "easing": "cubic-bezier(0.22, 1, 0.36, 1)"
    },
    "tags": [
      "Cộng đồng",
      "Ma trận điểm",
      "Kết nối",
      "Thành viên"
    ],
    "promptText": "# Kindred Dot-Matrix Hands Hero (exact recreation prompt)\nBuild a single-file, full-viewport landing hero for **Kindred**, a community platform for creatives. The page is a calm off-white canvas with a centered headline, a black pill CTA with a rainbow underglow, and a row of partner logos at the bottom. Behind the copy, **two human hands reach toward each other (Creation-of-Adam style), drawn live in code as a black dot-matrix / LED halftone made of horizontal scanline rows of dots**. The hands slowly drift, roll and breathe, and each hand periodically **glitch-dissolves dot by dot into a second pose** and back. The background is rendered on a `<canvas>` every frame. It is not a video and not a GIF.\nPlain HTML, CSS and vanilla JS in one file, with no frameworks. The only external resources are the Google Font and one Higgsfield image used as the luminance source for the halftone.\n## 1. Assets (use exactly these URLs)\n| Use | URL |\n|---|---|\n| Hand source sheet (2×2 black-and-white photo sheet of four isolated hands on pure white, 2688×1520 original, requested at w=1600 1600×905).",
    "starterPrompt": "Thiết kế khối kêu gọi tham gia cộng đồng Kindred với đồ họa ma trận điểm, số lượng thành viên đang hoạt động và nút gia nhập."
  },
  {
    "id": "ms-vaultra-hero",
    "row": 2,
    "title": "Vaultra",
    "category": "Bảng giá & Thẻ",
    "imageUrl": "https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/f1631235-0a76-464d-8f1d-2c4b48a997d5.jpg",
    "fallbackUrl": "https://raw.githubusercontent.com/broamstuck-cybr/SOURCEOFKNOWLEDGFORAI/main/assets/previews/lucianlabs-liquid-glass-button.png",
    "summaryVi": "Thẻ két sắt lưu trữ tài sản số kèm bảng phân bổ danh mục, lịch sử biến động và cấp độ bảo chứng.",
    "specs": {
      "layout": "Thẻ tổng tài sản + 3 thẻ chỉ số bảo chứng",
      "motion": "Đổ đầy thanh tỷ lệ phân bổ + đổi đơn vị hiển thị",
      "responsive": "Điện thoại · máy tính bảng · máy tính",
      "durationMs": 420,
      "easing": "cubic-bezier(0.22, 1, 0.36, 1)"
    },
    "tags": [
      "Danh mục",
      "Bảo chứng",
      "Thẻ chỉ số",
      "Tài chính"
    ],
    "promptText": "# Prompt: Vaultra crypto finance hero\nBuild a single-file, one-screen **landing hero for a fictional crypto finance platform, Vaultra**. Use plain HTML, CSS and vanilla JS, with no framework and no build step. The look is a black night with a huge dotted particle globe rising from the bottom. Its rim glows red, blue and magenta, and it **slowly spins**. Thin straight light lines and small glass coin chips cross the dark sky, and a large gradient headline sits on top.\n## Media\n- **Globe still:** `[asset-url]` (1672×941). The dotted particle globe with latitude rings and coloured rim glows, plus the thin diagonal lines and nodes.\n- **Globe video:** `[asset-url]` (1280×720, 4s, muted, loops). The same globe rotating steadily left to right, with its particle rings sliding and its rim glows shimmering. The camera is still and the lines don't move.\n- The last second crossfades into the first, so it loops with no jump and never plays in reverse.\n- It sits over the still with identical geometry and fades in once its first frame is ready.\n- **Masks:** both layers stretch to a plate that covers the hero.",
    "starterPrompt": "Dựng cụm thẻ tài chính Vaultra hiển thị tổng giá trị lưu ký, tỷ lệ phân bổ theo nhóm tài sản và trạng thái xác thực bảo mật."
  },
  {
    "id": "ms-shipcraft-footer",
    "row": 2,
    "title": "Shipcraft Footer",
    "category": "Chân trang & Điều hướng",
    "imageUrl": "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261021_093821_db49f268-cd69-4ac0-b92b-e0b8a7062322.png&w=720&q=82",
    "fallbackUrl": "https://threeui.com/social/pages/hero/advanced-glass-material.jpg",
    "summaryVi": "Chân trang nền tảng vận chuyển và triển khai phần mềm với băng chuyền số liệu và cột liên kết sản phẩm.",
    "specs": {
      "layout": "Khung CTA cuối trang + lưới 4 cột + thanh pháp lý",
      "motion": "Nổi nút bắt đầu miễn phí + hiệu ứng di chuột liên kết",
      "responsive": "Điện thoại · máy tính bảng · máy tính",
      "durationMs": 420,
      "easing": "cubic-bezier(0.22, 1, 0.36, 1)"
    },
    "tags": [
      "Triển khai",
      "Khối cuối",
      "Pháp lý",
      "Sản phẩm"
    ],
    "promptText": "# Prompt: Shipcraft CTA and footer\nBuild a single-file **closing CTA plus footer section** for a fictional app builder, **Shipcraft**. Use plain HTML, CSS and vanilla JS, with no framework and no build step. The look is near-black and warm:\n- a tilted 3D editor panel glowing amber on the right\n- a glossy amber-glass CTA button\n- a four-part footer\n- two white marble sculpture hands reaching toward each other, lit with an amber rim light\n- a giant thin amber-brown \"Shipcraft\" wordmark sinking off the bottom edge\n## Media (transparent PNGs)\n- **Editor panel:** `[asset-url]` (912×700). A perspective-tilted dark glass editor with a \"Widget Tree\" column, where \"Home Screen\" is selected in amber, and a \"Code\" column with amber, peach, lilac and teal syntax. It has a glowing amber top edge and fades out at the bottom and left.\n- **Left hand:** `[asset-url]` (582×290).\n- **Right hand:** `[asset-url]` (558×328).\n- **Hands:** both are polished white Carrara marble with grey veins and a warm amber rim light, reaching in from the left and right edges.\n- **Motion:** no video. Only the UI animates.\n## Type and colour\n- **Font:** Google Sans Flex (variable) for everything.",
    "starterPrompt": "Tạo chân trang Shipcraft kết hợp hộp kêu gọi dùng thử ở tầng trên và lưới 4 cột liên kết sản phẩm, tài nguyên ở tầng dưới."
  },
  {
    "id": "ms-digital-epoch-hero",
    "row": 3,
    "title": "Digital Epoch",
    "category": "Hero & Giới thiệu",
    "imageUrl": "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261109_013341_08629ffd-6ab5-44a8-bec8-f1939ab3a6cd.png&w=720&q=88",
    "fallbackUrl": "https://threeui.com/social/pages/three-js/structure-flow/expanse-field.jpg",
    "summaryVi": "Bố cục kỷ nguyên số kết hợp lưới tọa độ mảnh, đồng hồ trạng thái và tiêu đề khổ rộng.",
    "specs": {
      "layout": "Lưới tọa độ kỹ thuật · Viền 1px",
      "motion": "Quét đường lưới + nhảy bộ đếm số liệu",
      "responsive": "Điện thoại · máy tính bảng · máy tính",
      "durationMs": 500,
      "easing": "cubic-bezier(0.16, 1, 0.3, 1)"
    },
    "tags": [
      "Kỹ thuật",
      "Tọa độ",
      "Bộ đếm",
      "Viền mảnh"
    ],
    "promptText": "Build a modern, high-performance landing page section using React, TypeScript, Tailwind CSS v4, and Motion. The application should match the following exact specifications:\n1. Dependencies & Setup\nLibraries: Install lucide-react, motion, clsx, and tailwind-merge.\nFonts & CSS: In index.css, import the Plus Jakarta Sans and Outfit fonts from Google Fonts: @import url('[asset-url]');\nConfigure the Tailwind theme in your CSS to use Plus Jakarta Sans as --font-sans and Outfit as --font-display.\nThe global body background should be #f9fafb.\n2. Main Hero Container & Video Background\nCreate a hero section container with these exact classes: relative w-full max-w-[1400px] mx-auto rounded-[48px] bg-white border border-slate-200/50 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.03)] overflow-hidden h-[600px] flex flex-col.\nInside, add an absolutely positioned underlying layer (absolute inset-0 pointer-events-none z-0 overflow-hidden select-none) for the background video.\nThe video tag must point to exactly this URL: [asset-url] It must include autoPlay, loop, muted, and playsInline attributes, with the classes: w-full h-full object-cover scale-105 transition-transform duration-1000.",
    "starterPrompt": "Thiết kế khung mở đầu Digital Epoch với lưới tọa độ kỹ thuật 1px, thanh trạng thái thời gian thực và tiêu đề khổ lớn."
  },
  {
    "id": "ms-lumen-roof-hero",
    "row": 3,
    "title": "Solar Fog",
    "category": "Cảnh 3D",
    "imageUrl": "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261102_040343_a73684b4-3f71-4613-a843-c8be80fb1211.png&w=720&q=82",
    "fallbackUrl": "https://threeui.com/social/pages/motion-design/cathode-session/angles.jpg",
    "summaryVi": "Mô phỏng góc chiếu sáng mặt trời đổi màu bầu trời và bóng đổ kiến trúc theo thanh trượt giờ.",
    "specs": {
      "layout": "Khung kiến trúc 3D + thanh trượt thời gian",
      "motion": "Nội suy góc chiếu sáng và nhiệt độ màu",
      "responsive": "Điện thoại · máy tính bảng · máy tính",
      "durationMs": 560,
      "easing": "cubic-bezier(0.22, 1, 0.36, 1)"
    },
    "tags": [
      "Chiếu sáng",
      "Kiến trúc",
      "Thanh trượt",
      "Bóng đổ"
    ],
    "promptText": "# Lumen Roof Morning / Night Fog Hero (exact recreation prompt)\nGive me a single-file, full-viewport solar company hero called **Lumen Roof**. A charcoal farmhouse with solar panels fills the screen under a big centred headline. A glass Morning / Night toggle sits at the bottom. Clicking it sinks the whole house about a quarter of the screen into rising fog, swaps the time of day while it is hidden, and floats the house back up in the new light, while the sky, fog colour, nav, headline and button change with it.\nPlain HTML, CSS and one vanilla script with raw WebGL2 in one file, with no libraries. The only external resources are the Google Font and the six image URLs below. Reproduce every value, string and timing exactly, and use the complete code at the end as the source of truth.\nSix rules define it:\n1. **Three layers, one moving.** A blurred sky stays still. The house and its garden sit in one layer that moves on the Y axis only. Fog is a live shader canvas above both, and all text sits above the fog.\n2. **Two images make the moving layer.** The full photo is masked so only its lower part shows (the ground and shrubs).",
    "starterPrompt": "Dựng giao diện Lumen Roof cho phép kéo thanh trượt thời gian từ bình minh đến hoàng hôn để đổi ánh sáng và bóng đổ."
  },
  {
    "id": "ms-kids-store",
    "row": 3,
    "title": "Kids Store",
    "category": "Trình diễn sản phẩm",
    "imageUrl": "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261113_115509_577e7e29-0e80-43e6-93ac-e6cf71972818.png&w=720&q=82",
    "fallbackUrl": "https://threeui.com/social/pages/landing-pages/aera-01-landing-page.jpg",
    "summaryVi": "Cửa hàng sản phẩm sáng tạo với bộ lọc màu sắc trực quan, thẻ sản phẩm bo góc và giỏ hàng nhanh.",
    "specs": {
      "layout": "Lưới sản phẩm 3 cột + thanh lọc nổi",
      "motion": "Phóng nhẹ ảnh khi di chuột + trượt ngăn giỏ hàng",
      "responsive": "Điện thoại · máy tính bảng · máy tính",
      "durationMs": 400,
      "easing": "cubic-bezier(0.22, 1, 0.36, 1)"
    },
    "tags": [
      "Thương mại",
      "Bộ lọc",
      "Giỏ hàng",
      "Thẻ sản phẩm"
    ],
    "promptText": "# BUNTO kids' basics hero with a rotating garment ring\nBuild a single-screen, full-viewport hero for a fictional premium kids' clothing brand called BUNTO . It is one HTML file with inline CSS and JavaScript, no frameworks and no build step. The page never scrolls (body overflow hidden). Everything below is exact; follow the numbers, the copy and the timings as written.\n## 1. Overall idea\nA warm off-white page with tiny wide-tracked all-caps labels around the edges, a huge pale ghost word \"TINY\" behind the centre, and six floating kids' garments arranged on an invisible horizontal ring that turns slowly and continuously, left to right across the front. The front piece is the largest, straight and highest. The side pieces are smaller, lower and lean outwards. The back pieces sit lower still, tucked behind the side pieces. Visitors can drag or fling the ring with mouse or touch. Hovering a piece updates the large index number bottom-left.",
    "starterPrompt": "Thiết kế trang trưng bày cửa hàng với bộ lọc theo nhóm tuổi, lưới thẻ sản phẩm rõ giá và ngăn giỏ hàng trượt từ cạnh phải."
  },
  {
    "id": "ms-custom-spaces",
    "row": 3,
    "title": "Custom Spaces",
    "category": "Kêu gọi hành động",
    "imageUrl": "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260725_120544_94be5de4-0f4f-494c-bb78-c532290040a6.png&w=720&q=82",
    "fallbackUrl": "https://threeui.com/social/pages/sections/footers/section-aera-01-footers.jpg",
    "summaryVi": "Trình cấu hình không gian làm việc theo nhu cầu kèm nút yêu cầu báo giá chi tiết theo diện tích.",
    "specs": {
      "layout": "Khung tùy chỉnh trực quan + thẻ tóm tắt yêu cầu",
      "motion": "Đổi thông số diện tích/chi phí tức thì khi chọn",
      "responsive": "Điện thoại · máy tính bảng · máy tính",
      "durationMs": 420,
      "easing": "cubic-bezier(0.2, 0.8, 0.2, 1)"
    },
    "tags": [
      "Tùy chỉnh",
      "Báo giá",
      "Không gian",
      "Cấu hình"
    ],
    "promptText": "Recreate this exact single-page marketing landing page for Bespoke Architecture Studio pixel-faithfully. Stack: React + TypeScript + Vite + Tailwind CSS. Page title: Bespoke Architecture Studio . Pure white background (#ffffff). No cards in the hero. No purple. No cream. No dark mode. Minimal black/white architectural aesthetic. Body must use overflow-hidden on the root page wrapper: min-h-screen bg-white overflow-hidden.\nFONTS\nLoad Google Fonts Geist exactly as:\n<link rel=\"preconnect\" href=\"[asset-url]\" />\n<link rel=\"preconnect\" href=\"[asset-url]\" crossorigin />\n<link href=\"[asset-url]\" rel=\"stylesheet\" />\nApply globally:\nbody { font-family: 'Geist', sans-serif; }\nPAGE STRUCTURE (top bottom, 4 sections)\n1) Fixed Navbar\n2) HeroContent\n3) ImageMarquee (infinite drag-enabled horizontal strip with curved white masks)\n4) BottomSection\n1) NAVBAR fixed top bar\nPosition: fixed top-0 left-0 right-0 z-50\nLayout: flex items-center justify-between\nPadding: px-4 sm:px-6 md:px-10 py-4 sm:py-5\nLEFT Logo SVG (28×28), viewBox=\"0 0 256 256\", fill=\"#1a1a1a\", exact path:",
    "starterPrompt": "Tạo khối cấu hình Custom Spaces cho phép chọn quy mô nhóm, phong cách bố trí và gửi yêu cầu nhận bản thiết kế sơ bộ."
  },
  {
    "id": "ms-cobalt-hour",
    "row": 3,
    "title": "Cobalt Hour",
    "category": "Bảng giá & Thẻ",
    "imageUrl": "https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/19548534-c502-431f-904d-24d31b17c471.jpg",
    "fallbackUrl": "https://raw.githubusercontent.com/broamstuck-cybr/SOURCEOFKNOWLEDGFORAI/main/assets/previews/codefronts-course-card.png",
    "summaryVi": "Bộ thẻ gói dịch vụ tài chính doanh nghiệp trên nền xanh đậm với bảng đối chiếu hạn mức chi tiết.",
    "specs": {
      "layout": "3 thẻ gói dịch vụ + bảng đối chiếu tính năng",
      "motion": "Nổi thẻ gói khuyên dùng + đổi hạn mức theo quy mô",
      "responsive": "Điện thoại · máy tính bảng · máy tính",
      "durationMs": 400,
      "easing": "cubic-bezier(0.22, 1, 0.36, 1)"
    },
    "tags": [
      "Gói dịch vụ",
      "Hạn mức",
      "Đối chiếu",
      "Doanh nghiệp"
    ],
    "promptText": "Build a single-file landing hero, `index.html`, for a fictional fintech brand \"Meridian\": plain HTML, one inline `<style>`, inline `<script>`s, no frameworks. It is one full-viewport hero section. Reproduce every value below exactly. Do not round numbers, add sections or restyle anything.\n## 1. Assets\n- **Background video (silent, looping, 1586×992, 9 s, 24 fps):**\n`[asset-url]`\nA low-angle photographic portrait: a young woman with dark hair in a loose low bun, black turtleneck and oversized cobalt-blue wool coat. One hand is at her collar and she gazes up to the right. Warm golden side light falls on her face. The top ~55% of the frame is an empty deep-navy sky (near `#020816`), shading to a brighter blue towards the bottom. In the video a breeze moves her hair and coat.\n- **Poster / still image (same composition, 1586×992):** `assets/images/meridian-hero.jpg`. If you don't have that file, use\n`[asset-url]`\n- **Fonts:** three static WOFF2s from the free GUST \"TeX Gyre\" collection:\n- \"M Display\" = TeX Gyre Adventor Regular (the ITC Avant Garde Gothic design), weight 400\n- \"M Sans\" = TeX Gyre Heros Regular (Helvetica design), weight 400",
    "starterPrompt": "Tạo bảng giá Cobalt Hour với 3 cấp độ thẻ dịch vụ, đánh dấu nổi bật gói tiêu chuẩn và bảng đối chiếu 8 quyền lợi bên dưới."
  },
  {
    "id": "ms-vantix-footer",
    "row": 3,
    "title": "Vantix Footer",
    "category": "Chân trang & Điều hướng",
    "imageUrl": "https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/4a917d4c-123f-4b68-8125-b201961b7791.jpg",
    "fallbackUrl": "https://raw.githubusercontent.com/broamstuck-cybr/SOURCEOFKNOWLEDGFORAI/main/assets/previews/lucianlabs-isometric-data-blocks.png",
    "summaryVi": "Chân trang doanh nghiệp hiện đại với thẻ chứng nhận bảo mật, danh mục giải pháp và biểu mẫu liên hệ nhanh.",
    "specs": {
      "layout": "Cột giới thiệu + 3 cột giải pháp + huy hiệu chuẩn",
      "motion": "Hiệu ứng sáng nhẹ huy hiệu + chuyển trạng thái liên kết",
      "responsive": "Điện thoại · máy tính bảng · máy tính",
      "durationMs": 400,
      "easing": "cubic-bezier(0.22, 1, 0.36, 1)"
    },
    "tags": [
      "Chứng nhận",
      "Giải pháp",
      "Doanh nghiệp",
      "Chuẩn mực"
    ],
    "promptText": "# Prompt: Vantix footer (\"Cobalt Flare\")\nBuild a single-file **website footer** for a fictional creative agency, **Vantix**. Use plain HTML, CSS, inline SVG and vanilla JS, with no framework and no build step. The look is a deep-navy footer under a glowing electric cobalt and cyan aurora band. A thin blue arc runs through a glowing glass ring, and a big vertical cyan wordmark stands between two hairline dividers, with link columns, a \"Book a call\" call to action and social icons.\n## Media\n- **Glow plate:** `[asset-url]` (2240×843). A smooth cobalt-to-cyan light field across the top that fades into dark navy.\n- **Motion:** a muted 4s loop over the plate: `[asset-url]` (1600×600).\n- The aurora ribbons flow, ripple and curl across the band while the light drifts sideways.\n- The last second crossfades into the first, so it loops without a jump and never plays in reverse.\n- It fades in (0.9s) once its first frame is ready.\n- **Rule:** nothing in the glow is drawn or animated in code. Only the UI animates.\n## Scale\n- **Units:** desktop is a 1326 × 1186 reference composition, with 1 unit = `--u = min(100cqw/1326, clamp(1px, 100cqw/2200, 1.16px), 100vh/1186)`.",
    "starterPrompt": "Dựng chân trang Vantix hiển thị các huy hiệu tuân thủ bảo mật, 3 cột giải pháp theo ngành và thông tin hỗ trợ kỹ thuật."
  },
  {
    "id": "ms-luminex-hero",
    "row": 3,
    "title": "Luminex",
    "category": "Hero & Giới thiệu",
    "imageUrl": "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261107_130252_7b1b8485-d5c5-440c-8921-f5ae01054c6a.png&w=720&q=90",
    "fallbackUrl": "https://raw.githubusercontent.com/broamstuck-cybr/SOURCEOFKNOWLEDGFORAI/main/assets/previews/lucianlabs-liquid-glass-button.png",
    "summaryVi": "Mặt phẳng giao diện hiệu ứng tán xạ ánh sáng cạnh viền với độ tương phản chữ đạt chuẩn.",
    "specs": {
      "layout": "Tấm kính tối · Điểm sáng hướng tâm",
      "motion": "Dịch chuyển luồng sáng theo vị trí trỏ chuột",
      "responsive": "Điện thoại · máy tính bảng · máy tính",
      "durationMs": 540,
      "easing": "cubic-bezier(0.22, 1, 0.36, 1)"
    },
    "tags": [
      "Ánh sáng",
      "Viền kính",
      "Theo con trỏ",
      "Nền tối"
    ],
    "promptText": "Create a modern React landing page with a full-screen HLS video background, glassmorphic navigation header, and hero content positioned in the bottom-left corner.\n\nTECHNICAL SPECIFICATION (Luminex - Hero & Giới thiệu):\n- Summary: Mặt phẳng giao diện hiệu ứng tán xạ ánh sáng cạnh viền với độ tương phản chữ đạt chuẩn.\n- Layout Architecture: Tấm kính tối · Điểm sáng hướng tâm using CSS Grid and Flexbox with 8px spacing scale (--space-2: 8px, --space-4: 16px, --space-6: 24px, --space-8: 32px).\n- Motion Choreography: Dịch chuyển luồng sáng theo vị trí trỏ chuột with duration 540ms and easing cubic-bezier(0.22, 1, 0.36, 1).\n- Responsive Breakpoints: 390 / 768 / 1440px with zero horizontal overflow at 390px, single-line top navigation, WCAG AA contrast (>= 4.5:1), focus-visible outlines, and prefers-reduced-motion fallback.",
    "starterPrompt": "Tạo giao diện Luminex nền tối với hiệu ứng ánh sáng viền phản hồi theo chuột, tiêu đề sắc nét và hai nút điều hướng."
  },
  {
    "id": "ms-prisma-landing",
    "row": 3,
    "title": "Prisma Creative Studio",
    "category": "Cảnh 3D",
    "imageUrl": "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260405_171918_4a5edc79-d78f-4637-ac8b-53c43c220606.png&w=720&q=82",
    "fallbackUrl": "https://threeui.com/social/pages/hero/advanced-glass-material.jpg",
    "summaryVi": "Khối lăng kính đa diện tán sắc ánh sáng khi xoay nhẹ theo chuyển động nghiêng của chuột.",
    "specs": {
      "layout": "Tâm điểm lăng kính 3D · Lưới thông tin 3 cột",
      "motion": "Nghiêng trục X/Y + dịch dải phổ màu",
      "responsive": "Điện thoại · máy tính bảng · máy tính",
      "durationMs": 540,
      "easing": "cubic-bezier(0.22, 1, 0.36, 1)"
    },
    "tags": [
      "Lăng kính",
      "Tán sắc",
      "Nghiêng 3D",
      "Đa diện"
    ],
    "promptText": "Create a React + Vite + TypeScript + Tailwind CSS landing page for a creative studio called \"Prisma\". The page has 3 sections: Hero, About, and Features. Use framer-motion for animations and lucide-react for icons. The design is dark, moody, and cinematic with a warm cream color palette.\nFONTS\nLoad two Google Fonts in index.html:\nAlmarai (weights: 300, 400, 700, 800) -- used as the global default font\nInstrument Serif (italic only) -- used for italic accent text in the About section\nIn index.css, set the global font family:\n* { font-family: 'Almarai', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif; }\nIn tailwind.config.js, extend:\ncolors.primary: #DEDBC8 (warm cream, used for all primary text and accents)\nfontFamily.serif: ['\"Instrument Serif\"', 'serif']\nCOLOR SYSTEM\nBackground: black (#000000) globally, #101010 for the About card, #212121 for Features cards\nPrimary text color: #E1E0CC (applied via inline style, slightly different from Tailwind primary)\nTailwind primary: #DEDBC8 (used for utility classes like text-primary, text-primary/70)\nGray text: text-gray-400, text-gray-500",
    "starterPrompt": "Thiết kế trang Prisma với khối lăng kính trung tâm nghiêng theo chuột và 3 thẻ giới thiệu tính năng ở chân khung."
  },
  {
    "id": "ms-balloon-drop",
    "row": 3,
    "title": "Balloon Drop",
    "category": "Trình diễn sản phẩm",
    "imageUrl": "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261109_013341_08629ffd-6ab5-44a8-bec8-f1939ab3a6cd.png",
    "fallbackUrl": "https://threeui.com/social/pages/three-js/structure-flow/expanse-field.jpg",
    "summaryVi": "Trang ra mắt bộ sưu tập giới hạn với đồng hồ đếm ngược, bộ chọn phiên bản và xem chi tiết góc chụp.",
    "specs": {
      "layout": "Sân khấu sản phẩm lớn + cột đặt hàng",
      "motion": "Chuyển góc ảnh mượt + phản hồi nút chọn cỡ",
      "responsive": "Điện thoại · máy tính bảng · máy tính",
      "durationMs": 440,
      "easing": "cubic-bezier(0.22, 1, 0.36, 1)"
    },
    "tags": [
      "Ra mắt",
      "Bộ sưu tập",
      "Đặt hàng",
      "Đếm ngược"
    ],
    "promptText": "# HERO PROMPT \"olla\" Stack-smart Kitchenware Landing Page (Balloon-Drop Grill)\n> Exact recreation brief. Build a **single self-contained HTML file** (inline `<style>` and inline `<script>`, no frameworks, no build step, no libraries) that reproduces the page described below pixel-for-pixel and frame-for-frame. Every number in this document is load-bearing. Where a value is given in `vw`, `vh`, `%` or `px`, use exactly that unit. Where an easing curve, duration or delay is given, use exactly that. Every copy string is quoted verbatim do not rephrase, re-capitalise or add punctuation.\n## 0. Concept in one paragraph\nA minimal, warm-beige kitchenware landing page for a brand called **olla**. At the top: a fixed white rounded navigation bar with a \"Shop\" mega-menu that wipes open downward into a strip of five line-icons. Below it, a hero made of two rounded panels side by side: a wide **night-sky panel** (deep navy sky, lilac clouds) on the left, and a narrow **yellow product card** on the right that plays a looping video of cookware nesting into itself. In the sky panel, a **folding grill pan hangs from a bunch of seven yellow balloons**, gently bobbing.",
    "starterPrompt": "Dựng trang ra mắt sản phẩm giới hạn gồm khung ảnh phóng lớn, bộ chọn màu sắc/kích cỡ và thanh trạng thái số lượng còn lại."
  },
  {
    "id": "ms-designer-portfolio",
    "row": 3,
    "title": "Designer Portfolio",
    "category": "Kêu gọi hành động",
    "imageUrl": "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261107_011718_f1fd2b4c-d260-44ae-a0a2-8256134a4c35.png",
    "fallbackUrl": "https://threeui.com/social/pages/motion-design/cathode-session/angles.jpg",
    "summaryVi": "Khối liên hệ hợp tác dành cho nhà thiết kế độc lập với lịch trống theo tháng và nút sao chép email.",
    "specs": {
      "layout": "Thẻ trạng thái nhận việc + danh mục dịch vụ",
      "motion": "Phản hồi sao chép clipboard + trượt thẻ dự án",
      "responsive": "Điện thoại · máy tính bảng · máy tính",
      "durationMs": 390,
      "easing": "cubic-bezier(0.22, 1, 0.36, 1)"
    },
    "tags": [
      "Hợp tác",
      "Lịch trống",
      "Sao chép",
      "Hồ sơ"
    ],
    "promptText": "# Recreate the \"Adrian Korvel\" portfolio hero exactly\nBuild a single-file, full-viewport portfolio hero for a fictional independent designer, Adrian Korvel. It is one screen, with no scrolling on desktop. The page is a deep burnt-terracotta scene. A giant, softly glowing condensed serif name sits behind an illustrated portrait of a young man with long curly hair that blows in the wind. Dark agave leaves sway in the bottom corners, and small sparkles twinkle. Around this sit small uppercase typewriter-style text blocks, a minimal nav and a strip of five badges along the bottom. Everything below must be reproduced exactly: values, text, assets, timings.\n## 1. Assets (use these exact URLs; do not re-host, crop or re-encode)\n| Role | Type | URL | Size | How it is used |\n|---|---|---|---|---|\n| Scene still (background plate) | PNG, served as WebP through the image proxy | `[asset-url]` | 2048 × 1360 (3:2) | CSS background of the plate box, stretched to the box (`background-size:100% 100%`). Terracotta field, soft central glow, dark brown agave clusters in the bottom-left and bottom-right corners, 3 small white four-point sparkles. No text, no person. |",
    "starterPrompt": "Dựng khối liên hệ hợp tác gồm huy hiệu trạng thái nhận dự án mới, 3 gói dịch vụ thiết kế và nút sao chép địa chỉ email."
  },
  {
    "id": "ms-sellix",
    "row": 3,
    "title": "Sellix",
    "category": "Bảng giá & Thẻ",
    "imageUrl": "https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/82e7eb75-c65f-490a-99b5-f3d1cad54200.webp",
    "fallbackUrl": "https://threeui.com/social/pages/landing-pages/aera-01-landing-page.jpg",
    "summaryVi": "Bảng thẻ doanh thu thương mại điện tử, tỷ lệ chuyển đổi và cấu hình cổng thanh toán đa tiền tệ.",
    "specs": {
      "layout": "Lưới thẻ KPI + bảng phí theo phương thức",
      "motion": "Chuyển tab tiền tệ mượt + làm nổi dòng đang trỏ",
      "responsive": "Điện thoại · máy tính bảng · máy tính",
      "durationMs": 380,
      "easing": "cubic-bezier(0.2, 0.8, 0.2, 1)"
    },
    "tags": [
      "Thanh toán",
      "Doanh thu",
      "Đa tiền tệ",
      "Thẻ KPI"
    ],
    "promptText": "Build a single, self-contained `index.html` one file, no build step, no frameworks,\nno external CSS or JS libraries. All CSS in one <style> in <head>. All JS in inline\n<script> tags. The page is a full-viewport hero section with a looping video background.\n============================================================\n0. DOCUMENT\n============================================================\n<!DOCTYPE html>, <html lang=\"en\">.\n<meta charset=\"utf-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1, viewport-fit=cover\">\n<title>Sellix Cross-border finance</title>\n============================================================\n1. FONTS\n============================================================\nTypeface: Plus Jakarta Sans, weights 300, 400, 500, 600, 800.\nLoad from Google Fonts and alias the family to 'PJS' via @font-face, or link it\ndirectly and use the family name in the stack. Use font-display: block (the entrance\nanimation waits on document.fonts.ready; a swap would play the headline reveal\nagainst invisible text).\nbody font stack:\n'PJS', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    "starterPrompt": "Thiết kế cụm thẻ Sellix kết hợp biểu đồ doanh thu tuần, tỷ lệ thanh toán thành công và bảng phí giao dịch theo từng khu vực."
  },
  {
    "id": "ms-atlas-nav",
    "row": 3,
    "title": "Atlas Nav",
    "category": "Chân trang & Điều hướng",
    "imageUrl": "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260928_144652_9eaf1d6a-3e8d-4460-bd5b-0ec7221685a0.png&w=720&q=82",
    "fallbackUrl": "https://threeui.com/social/pages/sections/footers/section-aera-01-footers.jpg",
    "summaryVi": "Hệ thống thanh điều hướng cố định thông minh kèm bảng menu mở rộng đa cột và ngăn điều hướng di động.",
    "specs": {
      "layout": "Thanh đỉnh 1 dòng + bảng Mega Menu 3 cột",
      "motion": "Bung bảng menu mượt + biến đổi nút 3 gạch trên mobile",
      "responsive": "Điện thoại · máy tính bảng · máy tính",
      "durationMs": 340,
      "easing": "cubic-bezier(0.22, 1, 0.36, 1)"
    },
    "tags": [
      "Thanh đỉnh",
      "Mega Menu",
      "Di động",
      "Điều hướng"
    ],
    "promptText": "Build a single standalone index.html file: a full-screen hero section for \"Halden\", an expedition travel brand. Put the CSS in a <style> tag and the JS in a <script> tag, with no frameworks and no build step. Match every value below exactly.\n=====================================================================\n1. FONTS & GLOBAL\n=====================================================================\n- Google Fonts: Geist, weights 400 and 500.\n<link rel=\"preconnect\" href=\"[asset-url]\">\n<link rel=\"preconnect\" href=\"[asset-url]\" crossorigin>\n<link href=\"[asset-url]\" rel=\"stylesheet\">\n- font-family: \"Geist\", \"Plus Jakarta Sans\", system-ui, sans-serif; -webkit-font-smoothing: antialiased.\n- <title>: Halden Expeditions to the edge\n- Reset: * { box-sizing: border-box }, html/body margin 0; links inherit color with no underline; buttons have no background, border or padding, inherit font and color, cursor pointer; img display block.\n- :focus-visible { outline: 2px solid #fff; outline-offset: 3px; border-radius: 6px }\nCSS custom properties on :root:\n--ink: #0b1013 (body background)\n--panel: rgba(14, 19, 23, 0.84) (dropdown and mobile sheet background)",
    "starterPrompt": "Thiết kế thanh điều hướng Atlas Nav 1 dòng gọn gàng trên máy tính có bảng menu mở rộng và ngăn trượt toàn màn hình trên điện thoại."
  }
];
