export type MotionMarqueeRow = 0 | 1 | 2 | 3;

export interface MotionMarqueeSpecs {
  layout: string;
  motion: string;
  responsive: string;
  durationMs: number;
  easing: string;
}

export interface MotionMarqueeItem {
  id: string;
  row: MotionMarqueeRow;
  title: string;
  category: string;
  imageUrl: string;
  videoUrl: string;
  specs: MotionMarqueeSpecs;
  tags: string[];
  promptText: string;
}

export const MOTION_MARQUEE_ITEMS: MotionMarqueeItem[] = [
  {
    "id": "ms-driftlab-hero",
    "row": 0,
    "title": "Jellyfish Scroll",
    "category": "Interactive",
    "imageUrl": "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261102_045255_3cb4b3c2-3cb5-4af9-93b4-bd88f2f883c3.png",
    "videoUrl": "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20261102_045327_a6584765-3154-43e6-b1c9-4e574f83a811.mp4",
    "specs": {
      "layout": "Interactive",
      "motion": "MP4 Preview + Interactive Prompt",
      "responsive": "390px / 768px / 1440px",
      "durationMs": 420,
      "easing": "cubic-bezier(0.22, 1, 0.36, 1)"
    },
    "tags": [
      "Interactive",
      "hero"
    ],
    "promptText": "# Driftlab — Jellyfish Scroll Hero (exact recreation prompt)\n\nGive me a single-file, scroll-driven hero called **Driftlab**. A pink jellyfish floats in the middle of a lilac sky. Huge condensed black words arrive big from the lower right on a curve, pass behind the jellyfish, pause in the centre and leave to the left. After the last word falls away, the jellyfish grows and two text panels appear in turn while it moves to the other side.\n\nPlain HTML, CSS and one vanilla script with raw WebGL2 in one file, with no libraries. The only external resources are the Google Fonts and the three media UR"
  },
  {
    "id": "ms-daisy-wild",
    "row": 1,
    "title": "Daisy Wild",
    "category": "Product",
    "imageUrl": "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260511_151621_4fba6892-ed21-4c2e-8cb3-0bd2ec2abefa.png",
    "videoUrl": "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260511_151818_65bb22c5-33ae-4e23-85ea-0a3dd89957c2.mp4",
    "specs": {
      "layout": "Product",
      "motion": "MP4 Preview + Interactive Prompt",
      "responsive": "390px / 768px / 1440px",
      "durationMs": 420,
      "easing": "cubic-bezier(0.22, 1, 0.36, 1)"
    },
    "tags": [
      "Product",
      "features"
    ],
    "promptText": "Build a standalone React + TypeScript + Tailwind CSS section component. This is a fragrance product showcase split into two halves: a looping video on the LEFT and a lime-green product panel on the RIGHT. On mobile it stacks vertically with the product panel ABOVE the video (achieved via `flex-col-reverse`). Every value below is exact.\n\n## Tech Stack\n- React 18 + TypeScript\n- Tailwind CSS 3 (default config, default breakpoints: `sm:640px`, `md:768px`)\n- Vite\n- No extra packages. No icon libraries needed.\n\n## Constants\n\n```ts\nconst TEXT_COLOR = '#000000';\nconst BG_LIME = '#BDE84F';\nconst EASE ="
  },
  {
    "id": "ms-adhd-planner",
    "row": 2,
    "title": "ADHD Planner",
    "category": "App",
    "imageUrl": "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260709_082449_46df5cc4-ad98-4541-9236-a2659c1478a4.png",
    "videoUrl": "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260711_090308_1dd0cea7-f9ba-4db4-8147-c7d746061c9e.mp4",
    "specs": {
      "layout": "App",
      "motion": "MP4 Preview + Interactive Prompt",
      "responsive": "390px / 768px / 1440px",
      "durationMs": 420,
      "easing": "cubic-bezier(0.22, 1, 0.36, 1)"
    },
    "tags": [
      "App",
      "hero"
    ],
    "promptText": "Build a single-page landing site for \"Drift\" -- a calm, ADHD-friendly planner app. Use React + Vite + TypeScript + Tailwind CSS + lucide-react for icons. No other UI libraries.\n\n### Fonts\n\nImport via Google Fonts in `index.css`:\n- **Inter** (weights 400, 500, 600) -- used as base body font\n- **Instrument Serif** (italic only) -- used for the italic word \"the stress\" in the hero heading\n\n```css\n@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@1&family=Inter:wght@400;500;600&display=swap');\n```\n\nBody: `font-family: 'Inter', sans-serif;` with antialiased rendering. `ove"
  },
  {
    "id": "ms-wellness-device",
    "row": 3,
    "title": "Wellness Devicex",
    "category": "Health",
    "imageUrl": "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260713_140344_79e1296a-86d7-43fd-9b5f-63ffe560f291.png",
    "videoUrl": "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260713_162101_0d7498c5-29bb-47bf-a99f-2773c0a880a9.mp4",
    "specs": {
      "layout": "Health",
      "motion": "MP4 Preview + Interactive Prompt",
      "responsive": "390px / 768px / 1440px",
      "durationMs": 420,
      "easing": "cubic-bezier(0.22, 1, 0.36, 1)"
    },
    "tags": [
      "Health",
      "hero"
    ],
    "promptText": "Build a single-page hero section for a product called \"Measured\" — a health/wellness wearable device landing page. The page is fullscreen (100vh), dark/moody aesthetic with layered imagery, a cursor-following spotlight reveal effect, and a frosted-glass navigation. Use React + Vite + Tailwind CSS + TypeScript.\n\n---\n\n## Fonts\n\n1. **Google Fonts — Inter** (weights 300-700): Used as the global default font on all elements (`* { font-family: 'Inter', sans-serif; }`)\n2. **Google Fonts — Instrument Serif** (regular + italic): Used for the hero heading \"Measured\". Load via `<link>` in index.html: `ht"
  },
  {
    "id": "ms-prompt-hero",
    "row": 0,
    "title": "PROMPT",
    "category": "Landing Page",
    "imageUrl": "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260629_104530_521b2f85-c0f3-4d0e-9704-b578315b4cb9.png",
    "videoUrl": "https://d8j0ntlcm91z4.cloudfront.net/user_39ca84eAE1ODL9hbR5VhoEj8tBf/hf_20260625_154433_532a85d3-dabf-4265-b8bd-19ac6af31842.mp4",
    "specs": {
      "layout": "Landing Page",
      "motion": "MP4 Preview + Interactive Prompt",
      "responsive": "390px / 768px / 1440px",
      "durationMs": 420,
      "easing": "cubic-bezier(0.22, 1, 0.36, 1)"
    },
    "tags": [
      "Landing Page",
      "hero"
    ],
    "promptText": "### Overview\n\nBuild a full-screen, scroll-driven fashion/archive landing page for a brand called \"prmpt\". The page has two main phases:\n\n1. **Hero phase** (first 100vh of scroll): Full-viewport video background with overlaid UI (logo, nav, product info, custom cursor). A black panel slides up from below covering the video.\n2. **Gallery phase** (continues scrolling): The black panel contains a scattered grid of product images that scale in/out as they enter/exit the viewport. At the end, a white overlay fades in with a \"view\" CTA button.\n\n---\n\n### Tech Stack\n\n- **React 19** + **TypeScript**\n- *"
  },
  {
    "id": "ms-autumn-fox",
    "row": 1,
    "title": "Autumn Fox",
    "category": "3D",
    "imageUrl": "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20261016_125845_ec7f8569-08dd-4a78-8310-9e094f5dd0a3.png",
    "videoUrl": "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20261016_125941_6c5f1180-2f4e-44ec-b90c-aa0b05e5109b.mp4",
    "specs": {
      "layout": "3D",
      "motion": "MP4 Preview + Interactive Prompt",
      "responsive": "390px / 768px / 1440px",
      "durationMs": 420,
      "easing": "cubic-bezier(0.22, 1, 0.36, 1)"
    },
    "tags": [
      "3D",
      "hero"
    ],
    "promptText": "Build a single, standalone index.html file: a full-screen hero section for a fictional AI automation brand called \"FENNEC\". Put everything (HTML, CSS, JS) in that one file. Use no build tools and no extra local files. Follow every spec below exactly.\n\n==================================================\n1. EXTERNAL ASSETS (use these exact URLs)\n==================================================\n- Background video (MP4, 1920x1080, 8s, loops):\n  https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20261016_125941_6c5f1180-2f4e-44ec-b90c-aa0b05e5109b.mp4\n- Still image (used as t"
  },
  {
    "id": "ms-space-planet",
    "row": 2,
    "title": "Space planet",
    "category": "3D",
    "imageUrl": "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260827_202133_508c64b8-a31e-4290-bdfc-1187df70e0a6.png",
    "videoUrl": "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260827_202422_3ffb4889-c520-432d-8458-038009eb40df.mp4",
    "specs": {
      "layout": "3D",
      "motion": "MP4 Preview + Interactive Prompt",
      "responsive": "390px / 768px / 1440px",
      "durationMs": 420,
      "easing": "cubic-bezier(0.22, 1, 0.36, 1)"
    },
    "tags": [
      "3D",
      "hero"
    ],
    "promptText": "Build a single, self-contained HTML file: a full-viewport space-themed hero section\nfor a site called \"SpaceEdu\". No build step, no frameworks, no external JS. All CSS in\none <style> block in <head>, all JS in one <script> block before </body>. It must be\npixel-faithful to the spec below and fully mobile responsive.\n\n════════════════════════════════════════════════════════════════════════\n1. CONCEPT\n════════════════════════════════════════════════════════════════════════\nA cinematic hero. A looping video of a single planet fills the whole viewport as the\nbackground. Centred over it: eyebrow \"P"
  },
  {
    "id": "ms-curved-reel",
    "row": 3,
    "title": "Curved Reel",
    "category": "Agency",
    "imageUrl": "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261108_070809_9454266a-bcc7-474e-854a-bc5770e5ceb3.png",
    "videoUrl": "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20261108_070920_ba374cc6-355a-4d14-84c6-1d40d14db660.mp4",
    "specs": {
      "layout": "Agency",
      "motion": "MP4 Preview + Interactive Prompt",
      "responsive": "390px / 768px / 1440px",
      "durationMs": 420,
      "easing": "cubic-bezier(0.22, 1, 0.36, 1)"
    },
    "tags": [
      "Agency",
      "hero"
    ],
    "promptText": "# HERO PROMPT — \"Norro.\" Curved Showreel (exact recreation brief)\n\nBuild a **single self-contained `index.html`** (inline `<style>` and one inline `<script>`, no build step, no framework, no external JS libraries) for a fictional Nordic film studio called **Norro.**. The page is a dark, full-viewport, non-scrolling showreel: a **WebGL2 fragment shader** draws a horizontal reel of 16:9 film stills bent onto a **concave cylinder** (as if seen from inside a curved cinema screen). Huge condensed uppercase project titles roll at the bottom-left, Next/Prev buttons sit bottom-right, a custom red-dot "
  },
  {
    "id": "ms-intelligent-operations",
    "row": 0,
    "title": "Intelligent Operations",
    "category": "Agency",
    "imageUrl": "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260728_050334_5b076e26-0ce7-4898-b432-d764190e448f.png",
    "videoUrl": "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260729_102822_0e6c87e8-c141-4744-bf32-ad30db296371.mp4",
    "specs": {
      "layout": "Agency",
      "motion": "MP4 Preview + Interactive Prompt",
      "responsive": "390px / 768px / 1440px",
      "durationMs": 420,
      "easing": "cubic-bezier(0.22, 1, 0.36, 1)"
    },
    "tags": [
      "Agency",
      "hero"
    ],
    "promptText": "# Exact recreation prompt — NovaAI landing page\n\nRecreate this page **pixel-faithfully**. Stack: React + TypeScript + Vite + Tailwind CSS + lucide-react. Do not invent alternate copy, layout, fonts, colors, or effects.\n\n---\n\n## Page identity\n\n- **Title:** `NOVA_AI — Today AI Aligns With Bold Dreams`\n- **Brand:** lowercase `novaai` with a Lucide `Hexagon` icon (size 24, strokeWidth 1.5) to the left\n- **Overall feel:** dark cinematic AI marketing site; full-viewport scroll-scrubbed video background; white typography with drop shadows; frosted glass UI chips; sparse editorial layout; no purple gr"
  },
  {
    "id": "ms-modern-agency",
    "row": 1,
    "title": "Modern Agency",
    "category": "Agency",
    "imageUrl": "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260516_090123_74be96d4-9c1b-40cf-932a-96f4f4babed3.png",
    "videoUrl": "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260516_122702_390f5305-8719-41d5-ae80-d23ab3796c28.mp4",
    "specs": {
      "layout": "Agency",
      "motion": "MP4 Preview + Interactive Prompt",
      "responsive": "390px / 768px / 1440px",
      "durationMs": 420,
      "easing": "cubic-bezier(0.22, 1, 0.36, 1)"
    },
    "tags": [
      "Agency",
      "hero"
    ],
    "promptText": "Build a React + Vite + Tailwind CSS landing page for \"Axion Studio\" - a design agency site. Use the `shaders` package (npm: `shaders`) for the hero background, `lucide-react` for icons. The page has 3 sections. Match every detail exactly:\n\n---\n\n## SECTION 1: HERO (Full viewport height)\n\n**Background:** Light gray `#EFEFEF` with a full-screen animated shader overlay (positioned absolute, inset-0, z-10, pointer-events-none). The shader stack uses components from `shaders/react`:\n- `Swirl` - colorA: `#ffffff`, colorB: `#f0f0f0`, detail: 1.7\n- `ChromaFlow` - baseColor: `#ffffff`, downColor/leftCol"
  },
  {
    "id": "ms-velorah-hero",
    "row": 2,
    "title": "Velorah",
    "category": "Agency",
    "imageUrl": "https://motionsites.ai/assets/hero-velorah-preview-CJNTtbpd.gif",
    "videoUrl": "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260314_131748_f2ca2a28-fed7-44c8-b9a9-bd9acdd5ec31.mp4",
    "specs": {
      "layout": "Agency",
      "motion": "MP4 Preview + Interactive Prompt",
      "responsive": "390px / 768px / 1440px",
      "durationMs": 420,
      "easing": "cubic-bezier(0.22, 1, 0.36, 1)"
    },
    "tags": [
      "Agency",
      "hero"
    ],
    "promptText": "Create a single-page hero section with a fullscreen looping background video, glassmorphic navigation, and cinematic typography. Use React + Vite + Tailwind CSS + TypeScript with shadcn/ui.\n\nVideo Background:\n\nFullscreen <video> element with autoPlay, loop, muted, playsInline\nSource URL: https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260314_131748_f2ca2a28-fed7-44c8-b9a9-bd9acdd5ec31.mp4\nPositioned absolute inset-0 w-full h-full object-cover z-0\n\nFonts:\n\nImport from Google Fonts: Instrumental Serif (display) and Inter weights 400/500 (body)\nCSS variables: --font-dis"
  },
  {
    "id": "ms-video-studio",
    "row": 3,
    "title": "Video Studio",
    "category": "Agency",
    "imageUrl": "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261110_224241_f6feccd5-1c45-4d22-b369-f927916f9973.png",
    "videoUrl": "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20261110_231342_88260d66-aa30-4612-9157-d7f1b5a66d8c.mp4",
    "specs": {
      "layout": "Agency",
      "motion": "MP4 Preview + Interactive Prompt",
      "responsive": "390px / 768px / 1440px",
      "durationMs": 420,
      "easing": "cubic-bezier(0.22, 1, 0.36, 1)"
    },
    "tags": [
      "Agency",
      "hero"
    ],
    "promptText": "# Kolibrie Studio: recreation prompt\n\nBuild a three-section landing page for **Kolibrie**, a fictional studio that makes short-form social films, reels and motion. It is a single self-contained HTML file (one inline `<style>`, one inline `<script>`, four self-hosted fonts) with a warm golden-hour, cream-and-tomato look. The three sections are: a full-screen **hero** with a looping video background and a photo card that follows the cursor; a pinned **\"Latest drops\"** section with copy on the left and a 3D stack of five case cards on the right that peels away as you scroll; and a tall **\"Meet th"
  },
  {
    "id": "ms-petalyx",
    "row": 0,
    "title": "Petalyx",
    "category": "Creative",
    "imageUrl": "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20261021_093215_b7826239-e451-4e15-b42b-d6bcf9497a32.png",
    "videoUrl": "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20261021_093331_5998f443-1b9c-4b62-820c-8219c73c72c4.mp4",
    "specs": {
      "layout": "Creative",
      "motion": "MP4 Preview + Interactive Prompt",
      "responsive": "390px / 768px / 1440px",
      "durationMs": 420,
      "easing": "cubic-bezier(0.22, 1, 0.36, 1)"
    },
    "tags": [
      "Creative",
      "hero"
    ],
    "promptText": "Build a single standalone index.html landing page called \"Petalyx\": a cherry-blossom, anime-watercolor themed SaaS page for measuring AI agents. One file, inline <style> and <script>, no build step, no local assets. Every image and video must load from the exact CloudFront URLs given below. Recreate everything exactly as specified.\n\n==================================================\n1. HEAD, FONTS, LIBRARIES\n==================================================\n- <title>Petalyx — Benchmark all AI staff</title>\n- <meta name=\"description\" content=\"Benchmark the impact of all your AI staff.\">\n- <met"
  },
  {
    "id": "ms-balloon-drop",
    "row": 1,
    "title": "Balloon Drop",
    "category": "Ecommerce",
    "imageUrl": "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261109_013341_08629ffd-6ab5-44a8-bec8-f1939ab3a6cd.png",
    "videoUrl": "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20261109_014328_9a7b4687-246e-497b-9bb9-42c285db3f47.mp4",
    "specs": {
      "layout": "Ecommerce",
      "motion": "MP4 Preview + Interactive Prompt",
      "responsive": "390px / 768px / 1440px",
      "durationMs": 420,
      "easing": "cubic-bezier(0.22, 1, 0.36, 1)"
    },
    "tags": [
      "Ecommerce",
      "hero"
    ],
    "promptText": "# HERO PROMPT — \"olla\" Stack-smart Kitchenware Landing Page (Balloon-Drop Grill)\n\n> Exact recreation brief. Build a **single self-contained HTML file** (inline `<style>` and inline `<script>`, no frameworks, no build step, no libraries) that reproduces the page described below pixel-for-pixel and frame-for-frame. Every number in this document is load-bearing. Where a value is given in `vw`, `vh`, `%` or `px`, use exactly that unit. Where an easing curve, duration or delay is given, use exactly that. Every copy string is quoted verbatim — do not rephrase, re-capitalise or add punctuation.\n\n---\n"
  },
  {
    "id": "ms-velia",
    "row": 2,
    "title": "Velia",
    "category": "Editorial",
    "imageUrl": "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20261021_093821_db49f268-cd69-4ac0-b92b-e0b8a7062322.png",
    "videoUrl": "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20261022_054532_4648c53b-8840-4872-b054-016a86833f5c.mp4",
    "specs": {
      "layout": "Editorial",
      "motion": "MP4 Preview + Interactive Prompt",
      "responsive": "390px / 768px / 1440px",
      "durationMs": 420,
      "easing": "cubic-bezier(0.22, 1, 0.36, 1)"
    },
    "tags": [
      "Editorial",
      "hero"
    ],
    "promptText": "Build a single standalone index.html (all CSS and JS inline, no build step, no local assets) for a premium AI creative-direction landing page called \"Velia\". Recreate it exactly as specified. All images and videos load directly from the CloudFront URLs given. The page must be fully mobile responsive with smooth, premium, staggered animations. Where this prompt gives code marked VERBATIM, copy it exactly as written; do not rewrite, simplify or \"improve\" it.\n\n====================================================================\n1. HEAD: FONTS, LIBRARIES, TOKENS\n==================================="
  },
  {
    "id": "ms-design-rocket-email-hero",
    "row": 3,
    "title": "Email Marketing",
    "category": "Email Marketing",
    "imageUrl": "https://motionsites.ai/assets/hero-design-rocket-email-preview-DBed7Yfk.gif",
    "videoUrl": "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260419_064822_f120e48a-d545-45dd-a02d-facb07829888.mp4",
    "specs": {
      "layout": "Email Marketing",
      "motion": "MP4 Preview + Interactive Prompt",
      "responsive": "390px / 768px / 1440px",
      "durationMs": 420,
      "easing": "cubic-bezier(0.22, 1, 0.36, 1)"
    },
    "tags": [
      "Email Marketing",
      "hero"
    ],
    "promptText": "Prompt: Recreate \"Design Rocket Certificates\" Email-Style Landing Page\nBuild a single-page React + TypeScript + Vite + Tailwind CSS project that renders an email-style marketing page for a \"Design Rocket Certificates\" AI leadership course, built in collaboration with Microsoft. Use lucide-react for icons. No other UI libraries.\n\nGlobal setup\nindex.html\n\nTitle: Newsletter Design Build Out\nPreconnect to fonts.googleapis.com and fonts.gstatic.com\nLoad Google Fonts: Instrument Serif (ital 0,1) and Inter (weights 400, 500, 600, 700)\nsrc/index.css\n\n@tailwind base;\n@tailwind components;\n@tailwind uti"
  },
  {
    "id": "ms-trueearth",
    "row": 0,
    "title": "TrueEarth",
    "category": "Environmental",
    "imageUrl": "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260831_224622_4eeb9d43-9e46-4483-9530-1eb4ef4c942d.png",
    "videoUrl": "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260831_231820_baf1d009-9cc2-4f94-a720-b04a94a8eab4.mp4",
    "specs": {
      "layout": "Environmental",
      "motion": "MP4 Preview + Interactive Prompt",
      "responsive": "390px / 768px / 1440px",
      "durationMs": 420,
      "easing": "cubic-bezier(0.22, 1, 0.36, 1)"
    },
    "tags": [
      "Environmental",
      "hero"
    ],
    "promptText": "Build a single, self-contained HTML file (one file: inline <style> and inline <script>, no\nbuild step, no frameworks, no external JS/CSS libraries) containing ONE full-viewport hero\nsection for an ocean-conservation nonprofit called \"OceanPulse\".\n\n=====================================================================\n1. GLOBAL SETUP\n=====================================================================\n- <!DOCTYPE html>, lang=\"en\".\n- <meta name=\"viewport\" content=\"width=device-width, initial-scale=1, viewport-fit=cover\">\n- <title>OceanPulse — Saving Oceans, Uniting The Coastline</title>\n- Font: "
  },
  {
    "id": "ms-bag-slots",
    "row": 1,
    "title": "Bag Slots",
    "category": "Fashion",
    "imageUrl": "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261106_072459_3a7afc56-a581-4651-8e7e-756e12183786.png",
    "videoUrl": "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20261106_073138_ef13b890-f508-46d7-bf25-278d3144c3d5.mp4",
    "specs": {
      "layout": "Fashion",
      "motion": "MP4 Preview + Interactive Prompt",
      "responsive": "390px / 768px / 1440px",
      "durationMs": 420,
      "easing": "cubic-bezier(0.22, 1, 0.36, 1)"
    },
    "tags": [
      "Fashion",
      "social-media"
    ],
    "promptText": "# Bag Slots: Glass Slot-Machine Bag Reveal Story (exact recreation prompt)\n\nBuild a single-file, interactive, vertical 9:16 social-media story for a fictional bag brand, **LUNE**.\n\nA young woman in a cropped indigo denim jacket stands against a grey studio wall. A frosted-glass panel floats across her chest, reading \"L U N E\". When you tap the glass, she reaches toward the camera with her hand, grabs the glass and pulls it down like a slot-machine lever. That plays from a real video clip.\n\nThe panel then becomes three slot reels of shoulder bags that spin with motion blur and stop one by one o"
  },
  {
    "id": "ms-fox-couture",
    "row": 2,
    "title": "Fox Couture",
    "category": "Fashion",
    "imageUrl": "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261107_005547_8a9e6889-76aa-4688-81b5-4452d9afa4ad.png",
    "videoUrl": "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20261107_145142_a39216fc-13cf-4ce3-baf8-d9bdbfd5f955.mp4",
    "specs": {
      "layout": "Fashion",
      "motion": "MP4 Preview + Interactive Prompt",
      "responsive": "390px / 768px / 1440px",
      "durationMs": 420,
      "easing": "cubic-bezier(0.22, 1, 0.36, 1)"
    },
    "tags": [
      "Fashion",
      "hero"
    ],
    "promptText": "# Novu® London — full recreation brief\n\nBuild a single-page, three-section fashion landing page for a fictional digital-fashion label called **Novu®**. Its mascot is a photoreal 3D fennec fox in orange shield sunglasses, a chunky silver chain and an oversized white varsity jacket. The page has three sections: a hero with a giant wordmark, a pinned \"story\" section, and a partners carousel with a footer. Behind the hero and the story runs **one continuous scroll-scrubbed video**. The fox walks in place the whole time while the camera orbits all the way around it (front close-up → profile → back "
  },
  {
    "id": "ms-future-fashion",
    "row": 3,
    "title": "Future Fashion",
    "category": "Fashion",
    "imageUrl": "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261105_170816_005f1a54-50e2-4842-b1b8-0b5d062fa432.png",
    "videoUrl": "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20261105_173304_f896736c-46d1-4e39-996c-3ee39ad7c52f.mp4",
    "specs": {
      "layout": "Fashion",
      "motion": "MP4 Preview + Interactive Prompt",
      "responsive": "390px / 768px / 1440px",
      "durationMs": 420,
      "easing": "cubic-bezier(0.22, 1, 0.36, 1)"
    },
    "tags": [
      "Fashion",
      "hero"
    ],
    "promptText": "# ORBE — Future Mode · hero recreation brief\n\nRecreate this page exactly as described: a single self-contained `index.html` (inline CSS and JS, fonts embedded as base64 WOFF2, everything else loaded from the URLs below). It is a one-screen, non-scrolling, full-viewport futuristic hero. A black sci-fi HUD bezel frames a night sky above the clouds, where violet aurora ribbons whip across the sky (a looping video). A huge white geometric headline, \"FUTURE MODE\", scrolls sideways behind a glass 3D figure whose head is a glowing cyan halo ring with a planet orbiting inside it. \"NEW\" and \"ERA\" sit i"
  },
  {
    "id": "ms-main-character",
    "row": 0,
    "title": "Main Character",
    "category": "Fashion",
    "imageUrl": "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261106_062711_9bf7546c-1db2-4093-97d4-0e32ea8d2abd.png",
    "videoUrl": "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20261106_062821_b3d651fe-7fbe-4e60-b4f5-77b953e1d1ce.mp4",
    "specs": {
      "layout": "Fashion",
      "motion": "MP4 Preview + Interactive Prompt",
      "responsive": "390px / 768px / 1440px",
      "durationMs": 420,
      "easing": "cubic-bezier(0.22, 1, 0.36, 1)"
    },
    "tags": [
      "Fashion",
      "social-media"
    ],
    "promptText": "# Main Character Mode: Interactive Life-Sim Social Post (exact recreation prompt)\n\nBuild a single-file, interactive 4:5 social-media post in the style of a life-simulation game. A stylish young woman sits on an invisible chair on a bright green hill under a clear blue sky. A green rotating crystal gem floats above her head, and cream pill-shaped action bubbles fan out around her like a game pie menu: \"Gossip\", \"Flirt\", \"Change Outfit\", \"Ask About Mood\", \"Talk About Pet\", \"More Choices…\".\n\nThe woman subtly comes alive in a looping video. Each bubble triggers its own effect:\n\n- floating hearts\n-"
  },
  {
    "id": "ms-kresna-footer",
    "row": 1,
    "title": "Kresna Footer",
    "category": "Footer Section",
    "imageUrl": "https://motionsites.ai/assets/footer-kresna-preview-BrIYYd2q.gif",
    "videoUrl": "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260503_104800_bc43ae09-f494-43e3-97d7-2f8c1692cfd7.mp4",
    "specs": {
      "layout": "Footer Section",
      "motion": "MP4 Preview + Interactive Prompt",
      "responsive": "390px / 768px / 1440px",
      "durationMs": 420,
      "easing": "cubic-bezier(0.22, 1, 0.36, 1)"
    },
    "tags": [
      "Footer Section",
      "footer"
    ],
    "promptText": "Build a single-file HTML footer component called Kresna — a sales-automation SaaS brand. The deliverable is one self-contained .html file with inline <style> and inline <script>. Render it inside a <section class=\"footer-section\"> on a white page (body { background: #ffffff; padding: 48px 24px; }).\nFonts\nLoad from Google Fonts in the <head>:\n\nDM Sans — weights 400, 500, 600, 700 (body, nav links, buttons, headings, watermark)\nCaveat — weights 500, 600, 700 (handwritten accents: \"Stay in touch!\", \"Feeling lucky?\", column titles \"Navigation\"/\"Company\")\n\nDefault body font: 'DM Sans', sans-serif. "
  },
  {
    "id": "ms-lumina-footer",
    "row": 2,
    "title": "Lumina",
    "category": "Footer Section",
    "imageUrl": "https://motionsites.ai/assets/footer-lumina-preview-CYkr-ACN.gif",
    "videoUrl": "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260429_114316_1c7889ad-2885-410e-b493-98119fee0ddb.mp4",
    "specs": {
      "layout": "Footer Section",
      "motion": "MP4 Preview + Interactive Prompt",
      "responsive": "390px / 768px / 1440px",
      "durationMs": 420,
      "easing": "cubic-bezier(0.22, 1, 0.36, 1)"
    },
    "tags": [
      "Footer Section",
      "footer"
    ],
    "promptText": "Create a React frontend using Tailwind CSS v4, the `motion/react` library for animations, and `lucide-react` for icons. I want to build a page with an immersive video background and a highly stylized \"liquid glass\" footer.\n\nPlease follow these exact specifications:\n\n1. Global CSS & Fonts (`index.css`):\nAdd the following exact `@font-face` to the CSS file and set it as the root Tailwind `--font-sans`:\n@font-face {\n    font-family: \"Helvetica Regular\";\n    src: url(\"https://db.onlinewebfonts.com/t/a64ff11d2c24584c767f6257e880dc65.eot\");\n    src: url(\"https://db.onlinewebfonts.com/t/a64ff11d2c245"
  },
  {
    "id": "ms-portal",
    "row": 3,
    "title": "Portal",
    "category": "Hero",
    "imageUrl": "https://motionsites.ai/assets/hero-portal-preview-DEscBr2T.gif",
    "videoUrl": "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260606_131516_eca35265-ea66-4fbd-8d52-22aae6e1a503.mp4",
    "specs": {
      "layout": "Hero",
      "motion": "MP4 Preview + Interactive Prompt",
      "responsive": "390px / 768px / 1440px",
      "durationMs": 420,
      "easing": "cubic-bezier(0.22, 1, 0.36, 1)"
    },
    "tags": [
      "Hero",
      "hero"
    ],
    "promptText": "Build a password manager landing page hero section using React, TypeScript, Tailwind CSS, Framer Motion, and Lucide React icons. Here is every specification:\n\n---\n\n### Fonts\n\n- **Heading font:** \"Helvetica Now Display Bold\" -- load via this stylesheet in `index.html`:\n  ```\n  <link href=\"https://db.onlinewebfonts.com/c/04e6981992c0e2e7642af2074ebe3901?family=Helvetica+Now+Display+Bold\" rel=\"stylesheet\">\n  ```\n- **Body font:** \"Inter\" (weights 300-900) -- load via Google Fonts in `index.css`:\n  ```\n  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&di"
  },
  {
    "id": "ms-aethera-hero",
    "row": 0,
    "title": "Aethera Studio",
    "category": "Hero Section",
    "imageUrl": "https://motionsites.ai/assets/hero-aethera-preview-DknSlcTa.gif",
    "videoUrl": "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260328_083109_283f3553-e28f-428b-a723-d639c617eb2b.mp4",
    "specs": {
      "layout": "Hero Section",
      "motion": "MP4 Preview + Interactive Prompt",
      "responsive": "390px / 768px / 1440px",
      "durationMs": 420,
      "easing": "cubic-bezier(0.22, 1, 0.36, 1)"
    },
    "tags": [
      "Hero Section",
      "hero"
    ],
    "promptText": "Prompt: Cinematic Hero Section with Looping Video Background\n\nCreate a fullscreen single-page hero section using React + Vite + Tailwind CSS + TypeScript with the following specifications:\n\nFonts:\nDisplay text (headings, logo): Instrument Serif\nBody text (navigation, descriptions): Inter\nImport both fonts in /src/styles/fonts.css\n\nVideo Background:\n\nPosition: top: '300px' with inset: 'auto 0 0 0'\nImplement custom fade-in/fade-out loop logic using React useEffect and useRef:\nUse requestAnimationFrame to continuously monitor currentTime and duration\nFade in over 0.5s at the start (opacity 0 to 1"
  },
  {
    "id": "ms-aetheris-voyage-hero",
    "row": 1,
    "title": "Aetheris Voyage",
    "category": "Hero Section",
    "imageUrl": "https://motionsites.ai/assets/hero-aetheris-voyage-preview-BGJn1z4t.gif",
    "videoUrl": "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260418_080021_d598092b-c4c2-4e53-8e46-94cf9064cd50.mp4",
    "specs": {
      "layout": "Hero Section",
      "motion": "MP4 Preview + Interactive Prompt",
      "responsive": "390px / 768px / 1440px",
      "durationMs": 420,
      "easing": "cubic-bezier(0.22, 1, 0.36, 1)"
    },
    "tags": [
      "Hero Section",
      "hero"
    ],
    "promptText": "Build Prompt: Cinematic Space-Travel Landing Page\nBuild a single-page landing site with two full-height sections (Hero + Capabilities), both using looping background videos with custom JS crossfade, a shared liquid-glass design system, and Framer Motion entrance animations.\n\nTech stack (pinned, CDN-only)\n<script src=\"https://cdn.tailwindcss.com\"></script>\n<script src=\"https://unpkg.com/react@18.3.1/umd/react.development.js\" integrity=\"sha384-hD6/rw4ppMLGNu3tX5cjIb+uRZ7UkRJ6BPkLpg4hAu/6onKUg4lLsHAs9EBPT82L\" crossorigin=\"anonymous\"></script>\n<script src=\"https://unpkg.com/react-dom@18.3.1/umd/re"
  },
  {
    "id": "ms-asme-hero",
    "row": 2,
    "title": "Asme",
    "category": "Hero Section",
    "imageUrl": "https://motionsites.ai/assets/hero-asme-preview-B_nGDnTP.gif",
    "videoUrl": "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260328_115001_bcdaa3b4-03de-47e7-ad63-ae3e392c32d4.mp4",
    "specs": {
      "layout": "Hero Section",
      "motion": "MP4 Preview + Interactive Prompt",
      "responsive": "390px / 768px / 1440px",
      "durationMs": 420,
      "easing": "cubic-bezier(0.22, 1, 0.36, 1)"
    },
    "tags": [
      "Hero Section",
      "hero"
    ],
    "promptText": "Build a single-page hero section with a full-screen looping background video, liquid glass UI elements, and a dark cinematic aesthetic. Use React, TypeScript, Tailwind CSS, and Lucide React icons. Here are the exact specifications:\n\nBackground Video:\n\nFull-screen muted autoplaying video covering the entire viewport, positioned absolutely with object-cover\nVideo source URL: https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260328_115001_bcdaa3b4-03de-47e7-ad63-ae3e392c32d4.mp4\nThe video is shifted down by 17% (translate-y-[17%]) so the top portion of the video is croppe"
  },
  {
    "id": "ms-bloom-ai-hero",
    "row": 3,
    "title": "Bloom AI",
    "category": "Hero Section",
    "imageUrl": "https://motionsites.ai/assets/hero-bloom-ai-preview-g6RcYLTl.gif",
    "videoUrl": "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260315_073750_51473149-4350-4920-ae24-c8214286f323.mp4",
    "specs": {
      "layout": "Hero Section",
      "motion": "MP4 Preview + Interactive Prompt",
      "responsive": "390px / 768px / 1440px",
      "durationMs": 420,
      "easing": "cubic-bezier(0.22, 1, 0.36, 1)"
    },
    "tags": [
      "Hero Section",
      "hero"
    ],
    "promptText": "Create a full-screen hero landing page for \"Bloom\" — an AI-powered plant/floral design platform. The design uses a liquid glass morphism aesthetic over a looping video background.\n\nBackground\nFull-screen autoplaying, looping, muted video background: https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260315_073750_51473149-4350-4920-ae24-c8214286f323.mp4\nVideo covers entire viewport with object-cover, sits at z-0. All content floats above at z-10.\n\nFonts\nDisplay/Body: Poppins (Google Fonts) — used for headings and body text\nSerif accent: Source Serif 4 (Google Fonts) — u"
  },
  {
    "id": "ms-designpro-hero",
    "row": 0,
    "title": "DesignPro Academy",
    "category": "Hero Section",
    "imageUrl": "https://motionsites.ai/assets/hero-designpro-preview-D8c5_een.gif",
    "videoUrl": "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260328_105406_16f4600d-7a92-4292-b96e-b19156c7830a.mp4",
    "specs": {
      "layout": "Hero Section",
      "motion": "MP4 Preview + Interactive Prompt",
      "responsive": "390px / 768px / 1440px",
      "durationMs": 420,
      "easing": "cubic-bezier(0.22, 1, 0.36, 1)"
    },
    "tags": [
      "Hero Section",
      "hero"
    ],
    "promptText": "Create a full-screen hero section for a product design education platform called \"DesignPro\" with the following exact specifications:\n\nBackground:\n\nFull-screen looping video background using this exact CloudFront URL: https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260328_105406_16f4600d-7a92-4292-b96e-b19156c7830a.mp4\n\nVideo should autoplay, loop, be muted, and play inline\n\nBackground color: black (#000000)\n\nNavigation Bar:\n\nLogo: Circular design with a white border (2px), containing a smaller filled white circle inside, followed by \"DesignPro\" text\n\nNavigation link"
  },
  {
    "id": "ms-digital-epoch-hero",
    "row": 1,
    "title": "Digital Epoch",
    "category": "Hero Section",
    "imageUrl": "https://motionsites.ai/assets/hero-digital-epoch-preview-B85ezqXO.gif",
    "videoUrl": "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260505_101331_74f9b798-3f00-4e86-8a01-377aa16ffeaa.mp4",
    "specs": {
      "layout": "Hero Section",
      "motion": "MP4 Preview + Interactive Prompt",
      "responsive": "390px / 768px / 1440px",
      "durationMs": 420,
      "easing": "cubic-bezier(0.22, 1, 0.36, 1)"
    },
    "tags": [
      "Hero Section",
      "hero"
    ],
    "promptText": "Build a modern, high-performance landing page section using React, TypeScript, Tailwind CSS v4, and Motion. The application should match the following exact specifications:\n1. Dependencies & Setup\nLibraries: Install lucide-react, motion, clsx, and tailwind-merge.\nFonts & CSS: In index.css, import the Inter and Outfit fonts from Google Fonts: @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@400;500;600&display=swap');\nConfigure the Tailwind theme in your CSS to use Inter as --font-sans and Outfit as --font-display.\nThe global body background sh"
  },
  {
    "id": "ms-dot-hero",
    "row": 2,
    "title": "Dot",
    "category": "Hero Section",
    "imageUrl": "https://motionsites.ai/assets/dot-hero-Csf49OgS.gif",
    "videoUrl": "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260427_054418_a6d194f0-ac86-4df9-abe5-ded73e596d7c.mp4",
    "specs": {
      "layout": "Hero Section",
      "motion": "MP4 Preview + Interactive Prompt",
      "responsive": "390px / 768px / 1440px",
      "durationMs": 420,
      "easing": "cubic-bezier(0.22, 1, 0.36, 1)"
    },
    "tags": [
      "Hero Section",
      "hero"
    ],
    "promptText": "Build a React landing page exactly as specified below. Use React 19, Tailwind CSS v4, and motion/react for animations.\n1. Fonts & Global CSS Setup:\nIn index.html, import these Google Fonts:\nInstrument Serif (weights 400, italic 400)\nInter (weights 100 to 900)\nIn src/index.css, import this custom font for the Nokia text:\n@import url('https://db.onlinewebfonts.com/c/440b53b1a1c65037f944ff19259d8014?family=Nokia+Cellphone+FC+Small');\nConfigure the Tailwind theme variables in index.css:\n--font-instrument: \"Instrument Serif\", serif;\n--font-serif: \"Instrument Serif\", serif;\n--font-sans: \"Inter\", san"
  },
  {
    "id": "ms-power-ai-hero",
    "row": 3,
    "title": "Power AI",
    "category": "Hero Section",
    "imageUrl": "https://motionsites.ai/assets/hero-power-ai-preview-BqpSbx41.gif",
    "videoUrl": "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260328_065045_c44942da-53c6-4804-b734-f9e07fc22e08.mp4",
    "specs": {
      "layout": "Hero Section",
      "motion": "MP4 Preview + Interactive Prompt",
      "responsive": "390px / 768px / 1440px",
      "durationMs": 420,
      "easing": "cubic-bezier(0.22, 1, 0.36, 1)"
    },
    "tags": [
      "Hero Section",
      "hero"
    ],
    "promptText": "Create a full-screen dark hero section with a looping background video, navbar, headline, subtitle, CTA button, and a logo marquee at the bottom. Here are the exact specifications:\n\nTheme & Colors (index.css CSS variables):\nBackground: 260 87% 3% (deep dark blue-purple)\nForeground: 40 6% 95% (off-white)\nHero sub text: 40 6% 82%\nBody font: Geist Sans (via @fontsource/geist-sans)\nHeadline font: General Sans (loaded from Fontshare: https://api.fontshare.com/v2/css?f[]=general-sans@400,500,600,700&display=swap)\n\nBackground Video (Index page wrapper):\nVideo URL: https://d8j0ntlcm91z4.cloudfront.net"
  },
  {
    "id": "ms-rivr-hero",
    "row": 0,
    "title": "RIVR",
    "category": "Hero Section",
    "imageUrl": "https://motionsites.ai/assets/hero-rivr-preview-DcS3pjx4.gif",
    "videoUrl": "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260428_193507_4286c423-2fd9-4efd-92bd-91a939453fc1.mp4",
    "specs": {
      "layout": "Hero Section",
      "motion": "MP4 Preview + Interactive Prompt",
      "responsive": "390px / 768px / 1440px",
      "durationMs": 420,
      "easing": "cubic-bezier(0.22, 1, 0.36, 1)"
    },
    "tags": [
      "Hero Section",
      "hero"
    ],
    "promptText": "Build a Hero section for a DeFi dashboard named RIVR showcasing a sleek, glassmorphism aesthetic. Please mimic these exact specifications to ensure a premium UI.\n\nDependencies: \n- Use `lucide-react` for icons.\n- Use `motion` (imported from `'motion/react'`) for animations.\n\n1. Global Styles (`src/index.css`)\nImport the custom 'Helvetica Regular' font, set the Tailwind theme properly, and reset the body. Exact CSS to include:\n@import \"tailwindcss\";\n\n@font-face {\n    font-family: \"Helvetica Regular\";\n    src: url(\"https://db.onlinewebfonts.com/t/a64ff11d2c24584c767f6257e880dc65.eot\");\n    src: u"
  },
  {
    "id": "ms-stellar-ai-hero",
    "row": 1,
    "title": "Stellar AI",
    "category": "Hero Section",
    "imageUrl": "https://motionsites.ai/assets/hero-stellar-ai-preview-D3HL6bw1.gif",
    "videoUrl": "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260319_165750_358b1e72-c921-48b7-aaac-f200994f32fb.mp4",
    "specs": {
      "layout": "Hero Section",
      "motion": "MP4 Preview + Interactive Prompt",
      "responsive": "390px / 768px / 1440px",
      "durationMs": 420,
      "easing": "cubic-bezier(0.22, 1, 0.36, 1)"
    },
    "tags": [
      "Hero Section",
      "hero"
    ],
    "promptText": "Create a \"Stellar.ai\" landing page hero section using React, Tailwind CSS, and Lucide React icons. Use the Inter font (imported from Google Fonts). The page has a white background (bg-white), max-width max-w-7xl, and is centered with mx-auto.\n\nFont: Import Inter (weights 400, 500, 600, 700) from Google Fonts. Set font-family: 'Inter', sans-serif on the body.\n\nCustom CSS animations (in index.css):\n\n@keyframes fadeInUp -- from opacity: 0; transform: translateY(30px) to opacity: 1; transform: translateY(0). Class .animate-fade-in-up uses this with 0.6s ease-out forwards.\n@keyframes fadeInOverlay "
  },
  {
    "id": "ms-transform-data-hero",
    "row": 2,
    "title": "Transform Data",
    "category": "Hero Section",
    "imageUrl": "https://motionsites.ai/assets/hero-transform-data-preview-Cx5OU29N.gif",
    "videoUrl": "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260329_050842_be71947f-f16e-4a14-810c-06e83d23ddb5.mp4",
    "specs": {
      "layout": "Hero Section",
      "motion": "MP4 Preview + Interactive Prompt",
      "responsive": "390px / 768px / 1440px",
      "durationMs": 420,
      "easing": "cubic-bezier(0.22, 1, 0.36, 1)"
    },
    "tags": [
      "Hero Section",
      "hero"
    ],
    "promptText": "HERO SECTION CREATION PROMPT\n\nCreate a modern hero section with a looping video background and the following specifications:\n\nVideo Background:\n\nSize: 115% width and height\n\nPosition: Centered horizontally, anchored to top with object-top focal point\n\nCustom JavaScript fade system (NO CSS transitions):\n\n250ms requestAnimationFrame-based fade-in on load/loop start\n\n250ms fade-out when 0.55 seconds remain before video end\n\nfadingOutRef boolean prevents re-triggering fade-out from repeated timeUpdate events\n\nOn ended: opacity set to 0, 100ms delay, reset to currentTime = 0, play, fade back in\n\nEa"
  },
  {
    "id": "ms-vex-ventures-hero",
    "row": 3,
    "title": "VEX Ventures",
    "category": "Hero Section",
    "imageUrl": "https://motionsites.ai/assets/hero-vex-ventures-preview-BczMFIiw.gif",
    "videoUrl": "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260403_050628_c4e32401-fab4-4a27-b7a8-6e9291cd5959.mp4",
    "specs": {
      "layout": "Hero Section",
      "motion": "MP4 Preview + Interactive Prompt",
      "responsive": "390px / 768px / 1440px",
      "durationMs": 420,
      "easing": "cubic-bezier(0.22, 1, 0.36, 1)"
    },
    "tags": [
      "Hero Section",
      "hero"
    ],
    "promptText": "Recreate this hero section exactly. Here are the complete specifications:\n\nVideo Background:\n\nFull-screen background video, absolutely positioned, covering the entire viewport (object-cover)\nVideo URL: https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260403_050628_c4e32401-fab4-4a27-b7a8-6e9291cd5959.mp4\nAutoplay, loop, muted, playsInline\nNO dark overlay, NO gradient overlay, NO semi-transparent layer on top of the video. The video plays raw with no dimming whatsoever.\nTypography (CRITICAL - must be applied globally):\n\nImport the Google Font Inter via a <link> tag in "
  },
  {
    "id": "ms-innovation-landing",
    "row": 0,
    "title": "Innovation",
    "category": "Landing Page",
    "imageUrl": "https://motionsites.ai/assets/hero-innovation-preview-BerBJHh1.gif",
    "videoUrl": "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260405_074625_a81f018a-956b-43fb-9aee-4d1508e30e6a.mp4",
    "specs": {
      "layout": "Landing Page",
      "motion": "MP4 Preview + Interactive Prompt",
      "responsive": "390px / 768px / 1440px",
      "durationMs": 420,
      "easing": "cubic-bezier(0.22, 1, 0.36, 1)"
    },
    "tags": [
      "Landing Page",
      "hero"
    ],
    "promptText": "RECREATION PROMPT\n\nBuild a single-page landing site using React + TypeScript + Vite + Tailwind CSS + framer-motion + lucide-react. The entire page has a bg-black background. The font loaded via Google Fonts is Instrument Serif (italic and regular). Import it in index.css:\n\n@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap');\nLIQUID GLASS CSS (in index.css, inside @layer components)\nCreate a reusable .liquid-glass class used on every glass element:\n\n.liquid-glass {\n  background: rgba(255, 255, 255, 0.01);\n  background-blend-mode: luminosity;\n  backdrop"
  },
  {
    "id": "ms-mindloop-landing",
    "row": 1,
    "title": "Mindloop Landing",
    "category": "Landing Page",
    "imageUrl": "https://motionsites.ai/assets/hero-mindloop-landing-preview-Bqnstohr.gif",
    "videoUrl": "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260325_120549_0cd82c36-56b3-4dd9-b190-069cfc3a623f.mp4",
    "specs": {
      "layout": "Landing Page",
      "motion": "MP4 Preview + Interactive Prompt",
      "responsive": "390px / 768px / 1440px",
      "durationMs": 420,
      "easing": "cubic-bezier(0.22, 1, 0.36, 1)"
    },
    "tags": [
      "Landing Page",
      "hero"
    ],
    "promptText": "Build a dark monochrome landing page called Mindloop — a newsletter/content platform. Use React + Vite + TypeScript + Tailwind CSS + shadcn/ui + Framer Motion. Fonts: Inter (sans) and Instrument Serif (serif, used for italic accent words). The entire theme is pure black (#000) background with white foreground — no colors or gradients beyond monochrome. Install hls.js and framer-motion.\n\nDesign System (index.css)\nAll CSS variables in HSL (no hsl() wrapper in the variable, just the values):\n\n--background: 0 0% 0%\n--foreground: 0 0% 100%\n--card: 0 0% 5%\n--card-foreground: 0 0% 100%\n--primary: 0 0"
  },
  {
    "id": "ms-orbis-nft-landing",
    "row": 2,
    "title": "Orbis NFT",
    "category": "Landing Page",
    "imageUrl": "https://motionsites.ai/assets/hero-orbis-nft-preview-C3wvh77a.gif",
    "videoUrl": "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260331_045634_e1c98c76-1265-4f5c-882a-4276f2080894.mp4",
    "specs": {
      "layout": "Landing Page",
      "motion": "MP4 Preview + Interactive Prompt",
      "responsive": "390px / 768px / 1440px",
      "durationMs": 420,
      "easing": "cubic-bezier(0.22, 1, 0.36, 1)"
    },
    "tags": [
      "Landing Page",
      "hero",
      "3d-website",
      "landing-page"
    ],
    "promptText": "Create an NFT landing page called \"Orbis.Nft\" with 4 sections, using a dark space theme. The page uses video backgrounds served from CloudFront, a liquid glass UI effect, and a specific color/font system. Recreate it exactly as described below.\n\nFONTS (Google Fonts)\n\nAnton - Used for all headings and navigation text (aliased as font-grotesk in Tailwind)\n\nCondiment - A cursive script used for accent/overlay text (aliased as font-condiment in Tailwind)\n\nSystem monospace font (font-mono) - Used for body/description paragraphs\n\nLoad via Google Fonts in index.html:\n\nhttps://fonts.googleapis.com/css"
  },
  {
    "id": "ms-prisma-landing",
    "row": 3,
    "title": "Prisma Creative Studio",
    "category": "Landing Page",
    "imageUrl": "https://motionsites.ai/assets/hero-prisma-preview-D4QeI0Bn.gif",
    "videoUrl": "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260405_170732_8a9ccda6-5cff-4628-b164-059c500a2b41.mp4",
    "specs": {
      "layout": "Landing Page",
      "motion": "MP4 Preview + Interactive Prompt",
      "responsive": "390px / 768px / 1440px",
      "durationMs": 420,
      "easing": "cubic-bezier(0.22, 1, 0.36, 1)"
    },
    "tags": [
      "Landing Page",
      "hero"
    ],
    "promptText": "Create a React + Vite + TypeScript + Tailwind CSS landing page for a creative studio called \"Prisma\". The page has 3 sections: Hero, About, and Features. Use framer-motion for animations and lucide-react for icons. The design is dark, moody, and cinematic with a warm cream color palette.\n\nFONTS\n\nLoad two Google Fonts in index.html:\n\nAlmarai (weights: 300, 400, 700, 800) -- used as the global default font\nInstrument Serif (italic only) -- used for italic accent text in the About section\nIn index.css, set the global font family:\n\n* { font-family: 'Almarai', -apple-system, BlinkMacSystemFont, 'Se"
  },
  {
    "id": "ms-skyelite-hero",
    "row": 0,
    "title": "SkyElite Private Jets",
    "category": "Landing Page",
    "imageUrl": "https://motionsites.ai/assets/hero-skyelite-preview-DHaZIgUv.gif",
    "videoUrl": "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260328_091828_e240eb17-6edc-4129-ad9d-98678e3fd238.mp4",
    "specs": {
      "layout": "Landing Page",
      "motion": "MP4 Preview + Interactive Prompt",
      "responsive": "390px / 768px / 1440px",
      "durationMs": 420,
      "easing": "cubic-bezier(0.22, 1, 0.36, 1)"
    },
    "tags": [
      "Landing Page",
      "hero"
    ],
    "promptText": "Create a premium private jet landing page hero section with the following specifications:\n\nVideo Background:\nUse this exact CloudFront video URL: https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260328_091828_e240eb17-6edc-4129-ad9d-98678e3fd238.mp4\nVideo should autoplay, be muted, loop continuously, and include playsInline attribute\nVideo covers entire viewport (100vh) using object-cover\n\nNavigation Bar:\nBrand name \"SkyElite\" on the left (text-2xl, font-semibold, text-gray-900)\nDesktop menu items (hidden on mobile, visible md:flex): Start, Story, Rates, Benefits, FAQ"
  },
  {
    "id": "ms-halo-usd-landing",
    "row": 1,
    "title": "USD Halo",
    "category": "Landing Page",
    "imageUrl": "https://motionsites.ai/assets/halo-usd-hero-CtMXOklk.gif",
    "videoUrl": "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260423_161253_c72b1869-400f-45ed-ac0c-52f68c2ed5bd.mp4",
    "specs": {
      "layout": "Landing Page",
      "motion": "MP4 Preview + Interactive Prompt",
      "responsive": "390px / 768px / 1440px",
      "durationMs": 420,
      "easing": "cubic-bezier(0.22, 1, 0.36, 1)"
    },
    "tags": [
      "Landing Page",
      "hero"
    ],
    "promptText": "Build a premium, fintech-style landing page for a stablecoin product called \"Halo / USD Halo\" using React + TypeScript + Vite + Tailwind CSS, with lucide-react for icons. No other UI libraries. Background color of the page is #F5F5F5.\n\nGlobal Setup\nUse TT Norms Pro as the primary font, loaded via @font-face from /fonts/tt-norms-pro-regular.woff2 (weight 400) and /fonts/tt-norms-pro-semibold.woff2 (weight 600), with font-display: swap. Apply it to html, body, and inherit on *.\nTailwind base + components + utilities at the top of src/index.css.\nPage wrapper: flex flex-col bg-[#F5F5F5]. The first"
  },
  {
    "id": "ms-nival-cyberspace",
    "row": 2,
    "title": "ConSentinel",
    "category": "Motion",
    "imageUrl": "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260912_105822_bf7c2d53-9957-4521-bbbf-7c1ab7a70130.png",
    "videoUrl": "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260912_105953_21ad8049-9088-4a00-bad3-aee6b5575a2b.mp4",
    "specs": {
      "layout": "Motion",
      "motion": "MP4 Preview + Interactive Prompt",
      "responsive": "390px / 768px / 1440px",
      "durationMs": 420,
      "easing": "cubic-bezier(0.22, 1, 0.36, 1)"
    },
    "tags": [
      "Motion",
      "hero"
    ],
    "promptText": "Build a single self-contained `index.html` file — one full-viewport hero section for a\nsecurity product called \"ConSentinel\". No build step, no frameworks, no external JS.\nAll CSS in one `<style>` in `<head>`; all JS in `<script>` tags as described. Output the\ncomplete file, nothing else.\n\n════════════════════════════════════════════════════════════════════════\n1. CORE CONCEPT — THE DESIGN-UNIT SYSTEM (do not substitute rem/px)\n════════════════════════════════════════════════════════════════════════\nThe layout is a pixel-measured 1280×960 comp. Every size and offset is expressed in\n`--u`, one "
  },
  {
    "id": "ms-vinyl",
    "row": 3,
    "title": "Vinyl",
    "category": "Music",
    "imageUrl": "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260908_122011_59c97465-4d23-4fdc-ac40-f6832f573e28.png",
    "videoUrl": "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260908_125738_eb584080-9f98-489e-adb2-014760aa34da.mp4",
    "specs": {
      "layout": "Music",
      "motion": "MP4 Preview + Interactive Prompt",
      "responsive": "390px / 768px / 1440px",
      "durationMs": 420,
      "easing": "cubic-bezier(0.22, 1, 0.36, 1)"
    },
    "tags": [
      "Music",
      "hero"
    ],
    "promptText": "Build a single, self-contained `index.html` file — a full-viewport hero section for a\nvinyl/music-discovery site called \"Vinyl\". No build step, no frameworks, no local\nassets, no external JS libraries. All CSS in one `<style>` block in the head, all JS\nin one inline `<script>` before `</body>`. Plain HTML/CSS/vanilla JS only.\n\n═══════════════════════════════════════════════════════════════════\n1. ASSETS — use these exact remote URLs, do not substitute or localize\n═══════════════════════════════════════════════════════════════════\n\nBACKGROUND VIDEO (mp4, 1920x1080, 10s, silent, seamless loop):\n"
  },
  {
    "id": "ms-designer-portfolio",
    "row": 0,
    "title": "Designer Portfolio",
    "category": "Portfolio",
    "imageUrl": "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261107_011718_f1fd2b4c-d260-44ae-a0a2-8256134a4c35.png",
    "videoUrl": "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20261107_013821_69b8d7f5-48e9-43bb-8986-621494771aff.mp4",
    "specs": {
      "layout": "Portfolio",
      "motion": "MP4 Preview + Interactive Prompt",
      "responsive": "390px / 768px / 1440px",
      "durationMs": 420,
      "easing": "cubic-bezier(0.22, 1, 0.36, 1)"
    },
    "tags": [
      "Portfolio",
      "hero"
    ],
    "promptText": "# Recreate the \"Adrian Korvel\" portfolio hero exactly\n\nBuild a single-file, full-viewport portfolio hero for a fictional independent designer, Adrian Korvel. It is one screen, with no scrolling on desktop. The page is a deep burnt-terracotta scene. A giant, softly glowing condensed serif name sits behind an illustrated portrait of a young man with long curly hair that blows in the wind. Dark agave leaves sway in the bottom corners, and small sparkles twinkle. Around this sit small uppercase typewriter-style text blocks, a minimal nav and a strip of five badges along the bottom. Everything belo"
  },
  {
    "id": "ms-paper-craft",
    "row": 1,
    "title": "Paper Craft",
    "category": "Portfolio",
    "imageUrl": "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261111_220652_7971eee8-dbed-4c0c-88a9-cd5772b5afc9.png",
    "videoUrl": "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20261111_224117_b319aa12-0927-4642-99b2-12727753649b.mp4",
    "specs": {
      "layout": "Portfolio",
      "motion": "MP4 Preview + Interactive Prompt",
      "responsive": "390px / 768px / 1440px",
      "durationMs": 420,
      "easing": "cubic-bezier(0.22, 1, 0.36, 1)"
    },
    "tags": [
      "Portfolio",
      "hero"
    ],
    "promptText": "# Foldwild Studio: full recreation brief\n\nBuild this website exactly as described: a single-page, hash-routed site for a fictional paper-craft studio called **Foldwild Studio**. Everything is one `index.html` with inline CSS and JavaScript, plus GSAP 3.12.5 from `https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js`. There is no build step and no framework. All imagery and video are loaded from the URLs listed below. Do not substitute, re-host or crop them into new files. Several objects are shown from one sprite sheet using CSS `background-size` and `background-position`.\n\nThe site "
  },
  {
    "id": "ms-storybook",
    "row": 2,
    "title": "Storybook",
    "category": "Publishing",
    "imageUrl": "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20261108_042945_1a630b88-451d-4d93-9a7d-4151a6170e19.png",
    "videoUrl": "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20261108_051956_5f368146-b522-461d-9f5d-422f45255bd0.mp4",
    "specs": {
      "layout": "Publishing",
      "motion": "MP4 Preview + Interactive Prompt",
      "responsive": "390px / 768px / 1440px",
      "durationMs": 420,
      "easing": "cubic-bezier(0.22, 1, 0.36, 1)"
    },
    "tags": [
      "Publishing",
      "hero"
    ],
    "promptText": "# Little Lantern: recreation prompt\n\nGive me a single-file website called \"Little Lantern\" that recreates this page exactly: a real-time 3D children's board book lying on a dark wooden table. On load the book is first seen open, flips back through its pages, closes, swings round and settles onto the table. Scrolling (or a click on \"Open book\") lifts the book, zooms it in and swings the cover open, revealing two-page spreads. Only the right-hand page ever turns: a stiff board page that rises over the spine and lands on the left, showing the next spread. Each spread is a layered night illustrati"
  },
  {
    "id": "ms-crystal-koi",
    "row": 3,
    "title": "Crystal Koi",
    "category": "SaaS",
    "imageUrl": "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261104_151305_25ef1f45-0886-491c-a7a8-81e296402d5a.png",
    "videoUrl": "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20261104_160514_d8369d6e-d8ba-4532-9751-b32e0c8aaf75.mp4",
    "specs": {
      "layout": "SaaS",
      "motion": "MP4 Preview + Interactive Prompt",
      "responsive": "390px / 768px / 1440px",
      "durationMs": 420,
      "easing": "cubic-bezier(0.22, 1, 0.36, 1)"
    },
    "tags": [
      "SaaS",
      "hero"
    ],
    "promptText": "# Nectarline — exact recreation prompt\n\nBuild a single-file, five-section landing page called **Nectarline** (\"Supply Side Studio®\"), a fictional self-serve programmatic-media curation product. The page sits on top of a fixed, full-viewport scene: a looping dusk lotus-pond video in the hero (drawn through a WebGL hover-ripple lens), which crossfades to a deep violet gradient for the middle sections and to a night version of the pond behind the footer. A 3D crystal-glass koi fish (a real GLB model rendered with Three.js) swims through every section, its position, size and heading driven by scro"
  }
];
