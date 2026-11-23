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
    "id": "ms-nike-hover",
    "row": 0,
    "title": "Nike Hover",
    "category": "Features",
    "imageUrl": "/assets/motion-posters/nike-hover.jpg",
    "videoUrl": "",
    "specs": {
      "layout": "Features",
      "motion": "Live HTML + TSX + Full Prompt",
      "responsive": "390px / 768px / 1440px",
      "durationMs": 420,
      "easing": "cubic-bezier(0.22, 1, 0.36, 1)"
    },
    "tags": [
      "Features",
      "features"
    ],
    "promptText": "Create a single full-viewport (`h-[100dvh]`) Nike-branded section in React + Tailwind CSS + GSAP. It must be **fully mobile responsive**. The app requires `react-player` and `gsap` installed via npm.\n\n---\n\n### 1. Dependencies to Install\nInstall `react-player` and `gsap`.\n\n### 2. Globals & Configuration (`src/index.css`)\nReplace `index.css` with this exact Tailwind v4 and Google Fonts configuration:\n```css\n@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Manrope:wght@400;500;600;700&display=swap');\n@import \"tailwindcss\";\n\n@theme {\n  --font-sans: \"Manrope\", "
  },
  {
    "id": "ms-monolith-hero",
    "row": 1,
    "title": "Monolith Hero",
    "category": "Architecture",
    "imageUrl": "https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/b5f79c5a-2ebd-41ef-865e-24c660ac98bd.png",
    "videoUrl": "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260928_024808_abbfad57-4496-4906-9abc-49f0d153d287.mp4",
    "specs": {
      "layout": "Architecture",
      "motion": "Live HTML + MP4 Trailer + Full Prompt",
      "responsive": "390px / 768px / 1440px",
      "durationMs": 420,
      "easing": "cubic-bezier(0.22, 1, 0.36, 1)"
    },
    "tags": [
      "Architecture",
      "hero"
    ],
    "promptText": "# Prompt: recreate the Stratum hero page exactly\n\nRecreate this exact single-page real-estate hero site. This is a fidelity task, not a redesign. Implement the supplied content, assets, CSS, animations and interactions exactly as specified. Build only this one page. Keep it local; do not publish or deploy it. Do not add sections, headers, footers, cards, forms, extra buttons, extra links, extra animations or extra copy.\n\nThe complete `index.html` appended at the end of this prompt is the authoritative specification. Copy it byte-for-byte. Everything above it describes that file so you can chec"
  },
  {
    "id": "ms-pet-diagnostics",
    "row": 2,
    "title": "Pet Diagnostics",
    "category": "Healthcare",
    "imageUrl": "https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/193afe38-41fa-4454-9d48-ed154b66d17c.png",
    "videoUrl": "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260814_034538_de4032ce-5035-473d-a5b1-0e2224635a6a.mp4",
    "specs": {
      "layout": "Healthcare",
      "motion": "Live HTML + MP4 Trailer + Full Prompt",
      "responsive": "390px / 768px / 1440px",
      "durationMs": 420,
      "easing": "cubic-bezier(0.22, 1, 0.36, 1)"
    },
    "tags": [
      "Healthcare",
      "features"
    ],
    "promptText": "Build a **single self-contained `index.html`** file. No build step, no framework, no external\nJS, no local image files. All CSS in one `<style>` block in `<head>`; one small `<script>`\nbefore `</body>`. Match every number below exactly — the layout is measurement-driven, not\neyeballed.\n\n---\n\n## 1. Assets (remote only — use these exact URLs)\n\n**Hero video (desktop, autoplaying background) — 1928×1076, 8.04 s, H.264 MP4, silent:**\n```\nhttps://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260814_034538_de4032ce-5035-473d-a5b1-0e2224635a6a.mp4\n```\n\n**Hero still (desktop) — dou"
  },
  {
    "id": "ms-stillmind",
    "row": 3,
    "title": "Stillmind",
    "category": "Hero",
    "imageUrl": "/assets/motion-posters/halden-port-hero.jpg",
    "videoUrl": "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260702_081127_0992a171-d3c6-4978-8213-0ec5df8b6d63.mp4",
    "specs": {
      "layout": "Hero",
      "motion": "Live HTML + MP4 Trailer + Full Prompt",
      "responsive": "390px / 768px / 1440px",
      "durationMs": 420,
      "easing": "cubic-bezier(0.22, 1, 0.36, 1)"
    },
    "tags": [
      "Hero",
      "hero"
    ],
    "promptText": "Create a fullscreen cinematic hero section for a mindfulness/focus app called \"Lumora\" using React, Tailwind CSS, and Lucide React icons.\n\n## Font\n\nUse **Instrument Serif** (Google Fonts, italic for the logo). Load it in index.html:\n```\n<link rel=\"preconnect\" href=\"https://fonts.googleapis.com\">\n<link rel=\"preconnect\" href=\"https://fonts.gstatic.com\" crossorigin>\n<link href=\"https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap\" rel=\"stylesheet\">\n```\n\nSet `font-family: 'Instrument Serif', serif` on html/body. Use `system-ui, sans-serif` inline for body text (subtext, "
  },
  {
    "id": "ms-driftlab-hero",
    "row": 0,
    "title": "Jellyfish Scroll",
    "category": "Interactive",
    "imageUrl": "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261102_045255_3cb4b3c2-3cb5-4af9-93b4-bd88f2f883c3.png",
    "videoUrl": "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20261102_045327_a6584765-3154-43e6-b1c9-4e574f83a811.mp4",
    "specs": {
      "layout": "Interactive",
      "motion": "Live HTML + MP4 Trailer + Full Prompt",
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
    "id": "ms-macos-widget",
    "row": 1,
    "title": "macOS widget",
    "category": "SaaS",
    "imageUrl": "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20261014_121838_c97d0940-f430-4304-8573-4f47ee44f447.png",
    "videoUrl": "https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/4d01c727-d9c5-47c8-a778-35a451ffd39f.mp4",
    "specs": {
      "layout": "SaaS",
      "motion": "Live HTML + MP4 Trailer + Full Prompt",
      "responsive": "390px / 768px / 1440px",
      "durationMs": 420,
      "easing": "cubic-bezier(0.22, 1, 0.36, 1)"
    },
    "tags": [
      "SaaS",
      "hero"
    ],
    "promptText": "# Prompt: Recreate the Driftbar Meadow Footer (exact spec)\n\nCopy everything below the line into your AI coding tool.\n\n---\n\nBuild a single-file `index.html` (inline CSS, no frameworks, no build step) that recreates the **Driftbar** footer **exactly** as specified. It is one full-viewport footer:\n- a pale paper top holding a brand block and three link columns\n- a looping video of a blue-hour meadow (lavender mist, fireflies, first stars) filling the lower half and fading into the paper\n- a giant frosted-glass \"Driftbar\" wordmark sinking into lavender fog at the bottom\n\nFollow every value literal"
  },
  {
    "id": "ms-guardnet-benefits",
    "row": 2,
    "title": "Guardnet Benefits",
    "category": "Benefits",
    "imageUrl": "/assets/motion-posters/guardnet-benefits.jpg",
    "videoUrl": "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260421_072701_f6a01abb-eb30-4559-9d6e-774362defbc3.mp4",
    "specs": {
      "layout": "Benefits",
      "motion": "Live HTML + TSX + MP4 Trailer + Full Prompt",
      "responsive": "390px / 768px / 1440px",
      "durationMs": 420,
      "easing": "cubic-bezier(0.22, 1, 0.36, 1)"
    },
    "tags": [
      "Benefits",
      "features"
    ],
    "promptText": "Build a single React + TypeScript section using Tailwind CSS. No extra libraries. Fully mobile-responsive. Black background, white text.\n\n## Global Prerequisites\n\n- Font: `@import url(https://db.onlinewebfonts.com/c/e55e9079ee863276569c8a68d776ef04?family=Futura+Md+BT+Medium);`\n- Body: `font-family: 'Futura Md BT Medium', system-ui, -apple-system, sans-serif; background-color: #000; color: #fff; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;`\n- Section sits inside a `w-full max-w-[1400px]` wrapper on a black page.\n\n---\n\n## BenefitsSection\n\nContainer: `relative w-full "
  },
  {
    "id": "ms-aurex-finance",
    "row": 3,
    "title": "Aurex Finance",
    "category": "Fintech",
    "imageUrl": "/assets/motion-posters/aurex-finance.jpg",
    "videoUrl": "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260813_115057_94c3699b-0fd1-4124-bcf3-3626bb8c1f77.mp4",
    "specs": {
      "layout": "Fintech",
      "motion": "Live HTML + JSX + MP4 Trailer + Full Prompt",
      "responsive": "390px / 768px / 1440px",
      "durationMs": 420,
      "easing": "cubic-bezier(0.22, 1, 0.36, 1)"
    },
    "tags": [
      "Fintech",
      "hero"
    ],
    "promptText": "Build a **single full-screen hero section** for a DeFi / private-banking landing page called **LŪMEN // ÍNDEX**. Use **React 18 + TypeScript + Vite + Tailwind CSS**, with `lucide-react` for icons. The entire page is ONE component rendering ONE `<section>` that fills the viewport — no scrolling, no other sections.\n\n## 0. Project setup\n\nDependencies: `react@^18.3.1`, `react-dom@^18.3.1`, `lucide-react@^0.446.0`. Dev: `vite@^5.4.2`, `@vitejs/plugin-react`, `tailwindcss@^3.4.1`, `postcss`, `autoprefixer`, `typescript@^5.5.3`.\n\n`tailwind.config.js` — leave the theme completely unextended. Nearly ev"
  },
  {
    "id": "ms-gold-standard",
    "row": 0,
    "title": "Gold Standard",
    "category": "Portfolio",
    "imageUrl": "/assets/motion-posters/gold-standard.jpg",
    "videoUrl": "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260930_000857_e98f4291-826d-46eb-9a28-8022b5fb7e62.mp4",
    "specs": {
      "layout": "Portfolio",
      "motion": "Live HTML + JS + MP4 Trailer + Full Prompt",
      "responsive": "390px / 768px / 1440px",
      "durationMs": 420,
      "easing": "cubic-bezier(0.22, 1, 0.36, 1)"
    },
    "tags": [
      "Portfolio",
      "hero"
    ],
    "promptText": "# Prompt: recreate the SOSCALE hero landing page exactly\n\nBuild a single-file, zero-dependency static landing page (`index.html`, with inline `<style>` and two inline `<script>` blocks plus one tiny `<head>` script). The page is one full-viewport hero with no scrolling. Every size and position below is exact. Don't add or remove elements, rename classes or \"improve\" the design. Reproduce it one to one.\n\n---\n\n## 1. Assets\n\n| Asset | Source | Notes |\n|---|---|---|\n| Hero background video | `https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260930_000857_e98f4291-826d-46e"
  },
  {
    "id": "ms-vante-ribbon-hero",
    "row": 1,
    "title": "Video Ribbon",
    "category": "Portfolio",
    "imageUrl": "/assets/motion-posters/vante-ribbon-hero.jpg",
    "videoUrl": "https://pub-86dc5b5484314368ac5436a674b0d919.r2.dev/designs/roadster-3d-car-landing.mp4",
    "specs": {
      "layout": "Portfolio",
      "motion": "Live HTML + JS + MP4 Trailer + Full Prompt",
      "responsive": "390px / 768px / 1440px",
      "durationMs": 420,
      "easing": "cubic-bezier(0.22, 1, 0.36, 1)"
    },
    "tags": [
      "Portfolio",
      "hero"
    ],
    "promptText": "# Video Ribbon — Vante Scroll Portfolio Hero (exact recreation prompt)\n\nBuild a single-file, full-viewport, scroll-driven portfolio hero called **Vante**. On a near-black page, the two-part headline `CRAFT IN` / `MOTION` slides across the screen in opposite directions while a continuous ribbon of live video cards spirals around the viewer in 3D. It starts small along the bottom, swings close in a shallow curved arc, wraps around the left edge, runs away along the top and leaves top right. Then the cards land one by one in a calm 3×2 grid.\n\nPlain HTML, CSS and one vanilla ES module in one file."
  },
  {
    "id": "ms-planetary-pulse",
    "row": 2,
    "title": "Planetary Pulse",
    "category": "Science",
    "imageUrl": "/assets/motion-posters/planetary-pulse.jpg",
    "videoUrl": "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260816_125506_3a597378-ec85-4ebd-bd22-03b45508ac62.mp4",
    "specs": {
      "layout": "Science",
      "motion": "Live HTML + JS + MP4 Trailer + Full Prompt",
      "responsive": "390px / 768px / 1440px",
      "durationMs": 420,
      "easing": "cubic-bezier(0.22, 1, 0.36, 1)"
    },
    "tags": [
      "Science",
      "hero"
    ],
    "promptText": "Build a single-screen, non-scrolling hero landing page called **Terranova — Signals from the Deep Green**. It is a full-bleed looping background video with a real-time refractive \"liquid glass\" card floating over it, plus a slide-in fullscreen menu. Vanilla HTML/CSS/JS only — **no frameworks, no build step, no Three.js, no WebGL, no canvas 3D**. The glass effect is done entirely with an SVG filter plus a 2D canvas that re-draws the video every frame.\n\nProduce exactly five files: `index.html`, `styles.css`, `glass-card.js`, `ui.js`, `serve.mjs`.\n\n---\n\n## 1. Global setup\n\n### Fonts\nIn `<head>`, "
  },
  {
    "id": "ms-real-time-alerts",
    "row": 3,
    "title": "Real-Time Alerts",
    "category": "Sign in",
    "imageUrl": "/assets/motion-posters/real-time-alerts.jpg",
    "videoUrl": "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260813_052122_e77a27e6-17f1-4794-889b-3ceaa0e9e8cb.mp4",
    "specs": {
      "layout": "Sign in",
      "motion": "Live HTML + JS + MP4 Trailer + Full Prompt",
      "responsive": "390px / 768px / 1440px",
      "durationMs": 420,
      "easing": "cubic-bezier(0.22, 1, 0.36, 1)"
    },
    "tags": [
      "Sign in",
      "hero"
    ],
    "promptText": "Build a single, self-contained `index.html` file — no build step, no external requests except one video URL, no frameworks, no dependencies. Everything (CSS, JS, SVG) is inline. The file is a pixel-locked recreation of a designed login page, reconstructed from a 1464×949 reference frame. Follow every number exactly; the design is calibrated, not approximate.\n\n## 0. Global rules\n\n- `<!DOCTYPE html>`, `<html lang=\"en\">`.\n- `<meta name=\"viewport\" content=\"width=device-width, initial-scale=1, viewport-fit=cover\">`\n- `<title>Signal — Log in</title>`\n- `html,body{height:100%;background:var(--page)}`"
  },
  {
    "id": "ms-ai-runtime",
    "row": 0,
    "title": "AI Runtime",
    "category": "AI",
    "imageUrl": "/assets/motion-posters/ai-runtime.jpg",
    "videoUrl": "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260809_012548_ef22562c-c0ae-4816-ad9d-f8922af4e6a7.mp4",
    "specs": {
      "layout": "AI",
      "motion": "Live HTML + MP4 Trailer + Full Prompt",
      "responsive": "390px / 768px / 1440px",
      "durationMs": 420,
      "easing": "cubic-bezier(0.22, 1, 0.36, 1)"
    },
    "tags": [
      "AI",
      "hero"
    ],
    "promptText": "Rebuild this as a **single-viewport, full-bleed video-background landing page** using static **HTML + CSS + vanilla JS** (no framework). Match the current implementation exactly. File structure:\n\n```\nindex.html\nstyles.css\nmain.js\nassets/logo.webp\nfonts/GeistPixel-Circle.woff2\n```\n\nDocument title: `Intelligence Designed To Evolve`.  \nBody: black `#000`, `overflow: hidden`, height `100vh` / `100dvh`, Inter for UI, retro dot-matrix display font for headline + stat symbols. Antialiased text.\n\n---\n\n## Exact background video (required)\n\nFull-viewport cover video behind all UI (`position: absolute; i"
  },
  {
    "id": "ms-data-signal",
    "row": 1,
    "title": "Data Signal",
    "category": "Analytics",
    "imageUrl": "/assets/motion-posters/data-signal.jpg",
    "videoUrl": "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260808_064556_051587f1-74a1-4336-8c05-4dde3594ed05.mp4",
    "specs": {
      "layout": "Analytics",
      "motion": "Live HTML + MP4 Trailer + Full Prompt",
      "responsive": "390px / 768px / 1440px",
      "durationMs": 420,
      "easing": "cubic-bezier(0.22, 1, 0.36, 1)"
    },
    "tags": [
      "Analytics",
      "hero"
    ],
    "promptText": "Recreate this page **pixel-faithfully** as a single static `index.html` (inline CSS + JS, no framework). Match structure, copy, spacing tokens, glass, motion, fonts, and media exactly. Do not invent extra sections, stats, cards, or marketing blocks. Full-viewport dark landing only — no page scroll (`html, body { overflow: hidden; background: #000 }`).\n\n## Product / brand\n- Brand: **Vantage**\n- Document title: `Stop Digging Through Dashboards`\n- Theme color: `#000000`\n- `color-scheme: dark`\n- One composition: full-bleed cinematic background + left hero stack + bottom-right glass demo card. No i"
  },
  {
    "id": "ms-cyber-layer",
    "row": 2,
    "title": "Cyber Layer",
    "category": "Cybersecurity",
    "imageUrl": "/assets/motion-posters/cyber-layer.jpg",
    "videoUrl": "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260809_132544_b6ef0174-ed95-45ad-9a2f-ccb8acfbdce8.mp4",
    "specs": {
      "layout": "Cybersecurity",
      "motion": "Live HTML + MP4 Trailer + Full Prompt",
      "responsive": "390px / 768px / 1440px",
      "durationMs": 420,
      "easing": "cubic-bezier(0.22, 1, 0.36, 1)"
    },
    "tags": [
      "Cybersecurity",
      "hero"
    ],
    "promptText": "Build a **single self-contained `index.html`** that recreates this cybersecurity landing page **pixel-faithfully**. Fixed fullscreen black stage, left-locked typography, right-side looping video atmosphere, one-shot entrance choreography, and a mobile burger overlay. No frameworks. No scroll. No cards. No purple. No rounded pills.\n\n---\n\n## 1. Document shell\n\n```html\n<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n<meta charset=\"utf-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1, viewport-fit=cover\">\n<title>Security built into every system layer</title>\n```\n\n- `html, body { heig"
  },
  {
    "id": "ms-phoenix-ignis",
    "row": 3,
    "title": "Phoenix ignis",
    "category": "3D",
    "imageUrl": "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261031_020340_4815bb8d-68c3-48c4-ad05-6307d085e896.png",
    "videoUrl": "",
    "specs": {
      "layout": "3D",
      "motion": "Live HTML + JS + Full Prompt",
      "responsive": "390px / 768px / 1440px",
      "durationMs": 420,
      "easing": "cubic-bezier(0.22, 1, 0.36, 1)"
    },
    "tags": [
      "3D",
      "hero"
    ],
    "promptText": "# Myth Atlas ‚Äî Interactive 3D Creature Field Guide (exact recreation prompt)\n\nBuild a single-file, full-viewport web app called **Myth Atlas**: an interactive 3D field guide to creatures that never existed. It looks like a museum specimen plate on warm sandstone paper. A phoenix and a kraken sit in the centre as real textured 3D models you can drag, zoom and spin. A left sidebar, two specimen tabs, and a right catalogue card surround them. Clicking a tab flies one model out and springs the other in, while the card's copy swaps with a staggered rise. A sun button flips the whole page and the "
  },
  {
    "id": "ms-redline-mars-hero",
    "row": 0,
    "title": "Mars Trips",
    "category": "Travel",
    "imageUrl": "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261031_030432_a1948696-c1d5-4468-845e-7d1291f80943.png",
    "videoUrl": "",
    "specs": {
      "layout": "Travel",
      "motion": "Live HTML + JS + Full Prompt",
      "responsive": "390px / 768px / 1440px",
      "durationMs": 420,
      "easing": "cubic-bezier(0.22, 1, 0.36, 1)"
    },
    "tags": [
      "Travel",
      "hero"
    ],
    "promptText": "# Redline — Mars Trips Three-Step 3D Hero (exact recreation prompt)\n\nBuild a single-file, full-viewport landing hero for **Redline**, a space-travel brand selling seats to Mars. It is one continuous three-step experience with no page loads:\n\n1. **MARS:** a real 3D Mars swells from a speck in front of a giant white word, on a burnt-orange background.\n2. **THARSIS:** the planet slides left and turns, a region lights up crimson like a territory on a map, and a timeline of landing sites appears on the right with a hover photo card.\n3. **Landing:** the camera dives into the planet, whites out in a "
  },
  {
    "id": "ms-halden-port-hero",
    "row": 1,
    "title": "Halden AI Teammate Hero",
    "category": "AI",
    "imageUrl": "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261029_050506_a830ff21-4c71-4272-bc39-b61cacb54463.png",
    "videoUrl": "",
    "specs": {
      "layout": "AI",
      "motion": "Live HTML + Full Prompt",
      "responsive": "390px / 768px / 1440px",
      "durationMs": 420,
      "easing": "cubic-bezier(0.22, 1, 0.36, 1)"
    },
    "tags": [
      "AI",
      "hero"
    ],
    "promptText": "# Prompt: Halden, AI teammate for port operators (bowl-glow scroll hero)\n\nGive me the superdetailed exact prompt to recreate this page exactly as it is, including the correct asset URL, all elements, animations, and fonts. This is that prompt.\n\n## What it is\n\nBuild a B2B SaaS landing hero for a fictional maritime-logistics AI company, **Halden**, whose AI agent is called **Hal**. Use one HTML file with plain CSS and vanilla JavaScript: no framework, no build step, no libraries.\n\nThe page is three scenes stacked in one scroll:\n\n1. **Hero.** A white page with a soft, rounded, **bowl-shaped sky-c"
  },
  {
    "id": "ms-orbit-flora",
    "row": 2,
    "title": "Orbit Flora",
    "category": "AI",
    "imageUrl": "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260808_192942_e1086505-d7da-433b-a59b-8220f4e6c808.png",
    "videoUrl": "",
    "specs": {
      "layout": "AI",
      "motion": "Live HTML + Full Prompt",
      "responsive": "390px / 768px / 1440px",
      "durationMs": 420,
      "easing": "cubic-bezier(0.22, 1, 0.36, 1)"
    },
    "tags": [
      "AI",
      "hero"
    ],
    "promptText": "Build a **single-file** `index.html` full-viewport poster. No scroll. No frameworks. No redesign. Match layout, type, color, both image URLs, entrance choreography, mobile menu, and mouse morph-reveal **exactly**.\n\n---\n\n## 0. Document shell\n\n```html\n<!doctype html>\n<html lang=\"en\" class=\"anim\">\n<head>\n  <meta charset=\"utf-8\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1, viewport-fit=cover\">\n  <meta name=\"theme-color\" content=\"#161616\">\n  <title>Orbit — Secure system</title>\n```\n\n- Root `<html>` starts with class `anim`\n- `html, body`: `width/height 100%`, `margin: 0`, "
  },
  {
    "id": "ms-keylight",
    "row": 3,
    "title": "Keylight",
    "category": "Authentication",
    "imageUrl": "https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/d889cba6-535c-450f-9b74-7270c0e01e9a.webp",
    "videoUrl": "",
    "specs": {
      "layout": "Authentication",
      "motion": "Live HTML + Full Prompt",
      "responsive": "390px / 768px / 1440px",
      "durationMs": 420,
      "easing": "cubic-bezier(0.22, 1, 0.36, 1)"
    },
    "tags": [
      "Authentication",
      "hero"
    ],
    "promptText": "# Prompt: Recreate the Keylight sign-in page exactly\n\nCopy everything below the line into your AI coding tool.\n\n---\n\nRecreate the **Keylight** sign-in page: one self-contained `index.html` (inline CSS + vanilla JS, no framework, no build step). It must match **exactly**, so reproduce the source at the end byte for byte. Do not restyle, re-time or refactor anything.\n\n## What it is\n\n- **Split screen.**\n  - **Left:** a brand panel about 41% wide on a 1470√ó900 design frame. It holds:\n    - a still of a keyhole cut into a dark navy wall, with warm orange light pouring through it into blue haze\n   "
  },
  {
    "id": "ms-vell-lookbook",
    "row": 0,
    "title": "Runway Lookbook",
    "category": "Interactive",
    "imageUrl": "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261102_042056_1a704ff7-b0e5-4a9f-bbda-62392b819fb6.png",
    "videoUrl": "",
    "specs": {
      "layout": "Interactive",
      "motion": "Live HTML + Full Prompt",
      "responsive": "390px / 768px / 1440px",
      "durationMs": 420,
      "easing": "cubic-bezier(0.22, 1, 0.36, 1)"
    },
    "tags": [
      "Interactive",
      "hero"
    ],
    "promptText": "# Maison Vell — Runway Depth Lookbook (exact recreation prompt)\n\nGive me a single-file, full-viewport fashion page called **Maison Vell**. Six models stand in one line that recedes from the right of the screen into a blurred distance on the left. Dragging, scrolling or pressing the arrow keys walks the whole line forward: the front model grows and slides out behind the product column, everyone else takes the next place, and a new model arrives out of the haze at the back. The product column on the right scrolls in sync, and a big look number rolls over at bottom left. It loops forever.\n\nPlain "
  },
  {
    "id": "ms-lumen-roof-hero",
    "row": 1,
    "title": "Solar Fog",
    "category": "Interactive",
    "imageUrl": "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261102_040343_a73684b4-3f71-4613-a843-c8be80fb1211.png",
    "videoUrl": "",
    "specs": {
      "layout": "Interactive",
      "motion": "Live HTML + Full Prompt",
      "responsive": "390px / 768px / 1440px",
      "durationMs": 420,
      "easing": "cubic-bezier(0.22, 1, 0.36, 1)"
    },
    "tags": [
      "Interactive",
      "hero"
    ],
    "promptText": "# Lumen Roof — Morning / Night Fog Hero (exact recreation prompt)\n\nGive me a single-file, full-viewport solar company hero called **Lumen Roof**. A charcoal farmhouse with solar panels fills the screen under a big centred headline. A glass Morning / Night toggle sits at the bottom. Clicking it sinks the whole house about a quarter of the screen into rising fog, swaps the time of day while it is hidden, and floats the house back up in the new light, while the sky, fog colour, nav, headline and button change with it.\n\nPlain HTML, CSS and one vanilla script with raw WebGL2 in one file, with no li"
  },
  {
    "id": "ms-living-portrait-hero",
    "row": 2,
    "title": "Living Portrait",
    "category": "Portfolio",
    "imageUrl": "/assets/motion-posters/orbit-flora.jpg",
    "videoUrl": "",
    "specs": {
      "layout": "Portfolio",
      "motion": "Live HTML + Full Prompt",
      "responsive": "390px / 768px / 1440px",
      "durationMs": 420,
      "easing": "cubic-bezier(0.22, 1, 0.36, 1)"
    },
    "tags": [
      "Portfolio",
      "hero"
    ],
    "promptText": "Build a 3D Creator portfolio landing page with an interactive living portrait for \"Mina\" using React, TypeScript, Tailwind CSS, Framer Motion, and Lucide React. The page has a dark theme (#0C0C0C background) with the font Kanit (Google Fonts, weights 300-900). The page title is \"Mina -- 3D Creator\".\n\nFONT\nLoad exactly: https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;500;600;700;800;900&display=swap with preconnect to https://fonts.googleapis.com and https://fonts.gstatic.com (crossorigin).\n\nGLOBAL STYLES\nBackground: #0C0C0C on html, body, #root, and the main wrapper\nFont family: 'K"
  },
  {
    "id": "ms-price-calculator",
    "row": 3,
    "title": "Price Calculator",
    "category": "SaaS",
    "imageUrl": "/assets/motion-posters/price-calculator.jpg",
    "videoUrl": "",
    "specs": {
      "layout": "SaaS",
      "motion": "Live HTML + Full Prompt",
      "responsive": "390px / 768px / 1440px",
      "durationMs": 420,
      "easing": "cubic-bezier(0.22, 1, 0.36, 1)"
    },
    "tags": [
      "SaaS",
      "pricing"
    ],
    "promptText": "Recreate Project Estimation Calculator Section\n\nCreate a full-width dark calculator section with id calculator-section. Background: bg-background, padding py-16 md:py-28 px-4 md:px-16, max-width max-w-7xl centered.\n\nHeader: Centered. Small mono uppercase tracking-widest label \"Try project estimation calculator\" in text-muted-foreground. Below it, an h2: \"Get premium website within your budget\" — text-3xl md:text-4xl lg:text-5xl font-normal.\n\nLayout: 2-column grid (grid-cols-1 lg:grid-cols-2), rounded-2xl overflow-hidden, no gap.\n\nLEFT COLUMN (Calculator Form): Background #0D0D0D, padding p-8 l"
  },
  {
    "id": "ms-fernhollow",
    "row": 0,
    "title": "Flower Valley",
    "category": "3D",
    "imageUrl": "/assets/motion-posters/fernhollow.jpg",
    "videoUrl": "",
    "specs": {
      "layout": "3D",
      "motion": "Live HTML + JS + Full Prompt",
      "responsive": "390px / 768px / 1440px",
      "durationMs": 420,
      "easing": "cubic-bezier(0.22, 1, 0.36, 1)"
    },
    "tags": [
      "3D",
      "hero"
    ],
    "promptText": "# Fernhollow — Night Flower Valley Hero (exact recreation prompt)\n\nGive me a single-file, full-screen hero for a regenerative design studio called **Fernhollow**. It sits on top of an interactive 3D night valley of glowing flowers. A centred cream headline \"Grown, not built.\" in tall condensed type sits over the valley, with a short caption, a round arrow button, a top nav and a sound toggle.\n\nThe valley is the 3D flower valley from gladeye.com, used with permission. It is not rebuilt. The page runs the original compiled engine: their webpack runtime and chunks, including three.js r154, the va"
  },
  {
    "id": "ms-medusa-jellyfish-hero",
    "row": 1,
    "title": "Robot Jellyfish",
    "category": "3D",
    "imageUrl": "/assets/motion-posters/medusa-jellyfish-hero.jpg",
    "videoUrl": "",
    "specs": {
      "layout": "3D",
      "motion": "Live HTML + JS + Full Prompt",
      "responsive": "390px / 768px / 1440px",
      "durationMs": 420,
      "easing": "cubic-bezier(0.22, 1, 0.36, 1)"
    },
    "tags": [
      "3D",
      "hero",
      "dashboard"
    ],
    "promptText": "# Robot Jellyfish — Medusa JF-4 3D Field Simulator Hero (exact recreation prompt)\n\nBuild a single-file, full-viewport interactive page called **Medusa JF-4**. It is a live three.js field simulator of a robotic jellyfish that you can take apart piece by piece. A huge procedural 3D machine floats in the centre of a pale aqua-white instrument dashboard, and a 25-second looping tour opens each assembly in turn while every gauge on the page reacts.\n\nThere are no images, no video and no model files. Every petal, gear, link and rivet is three.js code. Plain HTML, CSS and one vanilla ES module in one "
  },
  {
    "id": "ms-lifeline-sun-hero",
    "row": 2,
    "title": "Sun Timeline",
    "category": "3D",
    "imageUrl": "/assets/motion-posters/lifeline-sun-hero.jpg",
    "videoUrl": "",
    "specs": {
      "layout": "3D",
      "motion": "Live HTML + JS + Full Prompt",
      "responsive": "390px / 768px / 1440px",
      "durationMs": 420,
      "easing": "cubic-bezier(0.22, 1, 0.36, 1)"
    },
    "tags": [
      "3D",
      "hero"
    ],
    "promptText": "# Sun Timeline — Life of the Sun Scrub Hero (exact recreation prompt)\n\nBuild a single-file, full-viewport interactive page called **The Life of the Sun**. It is extremely minimal: a pure black page, one glowing ball in the upper-middle, a soft pool of light under it, a two-line caption, and a thin timeline of fine ticks. Scrubbing moves through ten stages of the Sun's life, from solar nebula to white dwarf. Each scrub physically throws the ball: it whips round, its surface smears into horizontal bands, and the new surface lands within about a quarter of a second while the caption blurs across."
  },
  {
    "id": "ms-cybersecurity-hero",
    "row": 3,
    "title": "Cybersecurity Hero",
    "category": "Hero",
    "imageUrl": "/assets/motion-posters/cybersecurity-hero.jpg",
    "videoUrl": "",
    "specs": {
      "layout": "Hero",
      "motion": "Live HTML + Full Prompt",
      "responsive": "390px / 768px / 1440px",
      "durationMs": 420,
      "easing": "cubic-bezier(0.22, 1, 0.36, 1)"
    },
    "tags": [
      "Hero",
      "hero"
    ],
    "promptText": "Build a **single-page React + TypeScript (Vite)** landing hero for a product called **\"Xero\"** that recreates the following section exactly. Use the **Inter** Google Font (weights 300, 400, 500, 600, 700, 800). Do not use Tailwind utility classes for the hero — write plain CSS in a global stylesheet. No purple/indigo branding outside the specified pink-magenta gradient arc.\n\n## Layout & Structure\n\nRender three top-level blocks centered on a black page (`#0a0a0f`), each constrained to `max-width: 1600px`, in this vertical order:\n\n1. **`<nav>`** — sticky-style top bar (not actually sticky, just "
  },
  {
    "id": "ms-solace-faq",
    "row": 0,
    "title": "Halftone FAQ",
    "category": "SaaS",
    "imageUrl": "/assets/motion-posters/solace-faq.jpg",
    "videoUrl": "",
    "specs": {
      "layout": "SaaS",
      "motion": "Live HTML + Full Prompt",
      "responsive": "390px / 768px / 1440px",
      "durationMs": 420,
      "easing": "cubic-bezier(0.22, 1, 0.36, 1)"
    },
    "tags": [
      "SaaS",
      "hero"
    ],
    "promptText": "# Solace — Halftone Dot FAQ and Footer (exact recreation prompt)\n\nGive me a single-file closing section for an AI co-pilot product called **Solace**. The section runs a FAQ into the footer. Behind both sits a full-width live grid of round amber dots, sparse and ragged at the top and dense and pale lower down. Every dot swells and shrinks at its own pace, so the field ripples like an audio meter, and dots near the cursor swell. A centred heading and a dark amber glass FAQ accordion sit on top, with a full-width brown glass footer panel at the bottom.\n\nPlain HTML, CSS and one vanilla script with"
  },
  {
    "id": "ms-rocket-cta",
    "row": 1,
    "title": "Rocket CTA",
    "category": "CTA",
    "imageUrl": "/assets/motion-posters/rocket-cta.jpg",
    "videoUrl": "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260314_131748_f2ca2a28-fed7-44c8-b9a9-bd9acdd5ec31.mp4",
    "specs": {
      "layout": "CTA",
      "motion": "TSX + MP4 Trailer + Full Prompt",
      "responsive": "390px / 768px / 1440px",
      "durationMs": 420,
      "easing": "cubic-bezier(0.22, 1, 0.36, 1)"
    },
    "tags": [
      "CTA",
      "cta"
    ],
    "promptText": "Build a pixel-faithful recreation of the landing CTA section. Use React 18 + Vite + TypeScript, TailwindCSS, `framer-motion`, `clsx` + `tailwind-merge` as `cn()`. Dark theme background (`#000000`), Inter font, Material Symbols Outlined for icons. Use the white-alpha \"landing\" palette in `tailwind.config.ts`:\n\n```ts\nlanding: {\n  surface: \"rgba(255, 255, 255, 0.10)\",\n  \"surface-hover\": \"rgba(255, 255, 255, 0.16)\",\n  border: \"rgba(255, 255, 255, 0.10)\",\n  \"border-strong\": \"rgba(255, 255, 255, 0.20)\",\n  text: \"rgba(255, 255, 255, 0.80)\",\n  \"text-muted\": \"rgba(255, 255, 255, 0.60)\",\n}\n```\n\nAdd a gl"
  },
  {
    "id": "ms-daisy-wild",
    "row": 2,
    "title": "Daisy Wild",
    "category": "Product",
    "imageUrl": "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260511_151621_4fba6892-ed21-4c2e-8cb3-0bd2ec2abefa.png",
    "videoUrl": "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260511_151818_65bb22c5-33ae-4e23-85ea-0a3dd89957c2.mp4",
    "specs": {
      "layout": "Product",
      "motion": "JSX + MP4 Trailer + Full Prompt",
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
    "id": "ms-orbis-hello",
    "row": 3,
    "title": "Orbis Hello",
    "category": "About",
    "imageUrl": "/assets/motion-posters/orbis-hello.jpg",
    "videoUrl": "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260331_151551_992053d1-3d3e-4b8c-abac-45f22158f411.mp4",
    "specs": {
      "layout": "About",
      "motion": "JS + MP4 Trailer + Full Prompt",
      "responsive": "390px / 768px / 1440px",
      "durationMs": 420,
      "easing": "cubic-bezier(0.22, 1, 0.36, 1)"
    },
    "tags": [
      "About",
      "about"
    ],
    "promptText": "---\n\n> **Setup requirements before building the section:**\n>\n> **Google Fonts** -- Load these in `index.html` `<head>`:\n> ```html\n> <link rel=\"preconnect\" href=\"https://fonts.googleapis.com\" />\n> <link rel=\"preconnect\" href=\"https://fonts.gstatic.com\" crossorigin />\n> <link href=\"https://fonts.googleapis.com/css2?family=Anton&family=Condiment&display=swap\" rel=\"stylesheet\" />\n> ```\n>\n> **Tailwind config** -- Extend `theme` with these exact custom values:\n> ```js\n> fontFamily: {\n>   grotesk: ['Anton', 'sans-serif'],\n>   condiment: ['Condiment', 'cursive'],\n> },\n> colors: {\n>   cream: '#EFF4FF',"
  },
  {
    "id": "ms-playful-idea",
    "row": 0,
    "title": "Playful Idea",
    "category": "Creative Agency",
    "imageUrl": "/assets/motion-posters/playful-idea.jpg",
    "videoUrl": "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260908_073327_03643c0a-db33-417a-ae8f-4a39259c7f9c.mp4",
    "specs": {
      "layout": "Creative Agency",
      "motion": "TSX + MP4 Trailer + Full Prompt",
      "responsive": "390px / 768px / 1440px",
      "durationMs": 420,
      "easing": "cubic-bezier(0.22, 1, 0.36, 1)"
    },
    "tags": [
      "Creative Agency",
      "hero"
    ],
    "promptText": "Recreate this exact single-page creative studio footer. This is a fidelity task, not a redesign. Implement the supplied content, assets, CSS, and interactions exactly. Build only this footer page. Keep it local; do not publish or deploy it. Do not add a header, hero, cards, forms, sections, buttons, links, animations, or extra copy.\n\nThe source snapshots appended below are the authoritative specification. Copy them exactly, adapting only import paths or framework plumbing if necessary. Do not substitute approximate typography, another logo, stock video, or a generic eye-following effect.\n\n1. O"
  },
  {
    "id": "ms-quantum-core",
    "row": 1,
    "title": "Quantum Core",
    "category": "Data Intelligence",
    "imageUrl": "/assets/motion-posters/quantum-core.jpg",
    "videoUrl": "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260813_092641_de52eb87-daf2-41db-92cb-7a56eae012a5.mp4",
    "specs": {
      "layout": "Data Intelligence",
      "motion": "TSX + MP4 Trailer + Full Prompt",
      "responsive": "390px / 768px / 1440px",
      "durationMs": 420,
      "easing": "cubic-bezier(0.22, 1, 0.36, 1)"
    },
    "tags": [
      "Data Intelligence",
      "hero"
    ],
    "promptText": "# PROMPT — Recreate the \"Apogee\" Hero Section Exactly\n\nBuild a pixel-exact, fully mobile-responsive hero landing section called **\"Apogee\"**. Follow every specification below literally — exact hex values, exact pixel numbers, exact class names, exact animation delays, exact copy. Do not substitute, round, simplify, or \"improve\" any value. Where a bracketed Tailwind arbitrary value is given (e.g. `text-[15.5px]`), use that arbitrary value verbatim rather than the nearest Tailwind preset.\n\n---\n\n## 1. STACK & PROJECT SETUP\n\n- **Vite 5** + **React 18.3** + **TypeScript 5.5** + **Tailwind CSS 3.4**"
  },
  {
    "id": "ms-cognitra-feature",
    "row": 2,
    "title": "Cognitra Feature",
    "category": "Feature",
    "imageUrl": "/assets/motion-posters/cognitra-feature.jpg",
    "videoUrl": "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260514_135830_bb6491d1-9b66-4aec-9722-13b4dfe3fb46.mp4",
    "specs": {
      "layout": "Feature",
      "motion": "TSX + MP4 Trailer + Full Prompt",
      "responsive": "390px / 768px / 1440px",
      "durationMs": 420,
      "easing": "cubic-bezier(0.22, 1, 0.36, 1)"
    },
    "tags": [
      "Feature",
      "features"
    ],
    "promptText": "---\n\n**Prompt:**\n\nCreate a full-viewport section (100vh) that sits over a fixed background video. The section has no background color of its own -- it is fully transparent so the fixed video behind it shows through.\n\n**Background video (fixed, behind everything):**\nA `<video>` element fixed to the viewport (`position: fixed; top: 0; left: 0; width: 100%; height: 100vh; object-fit: cover; z-index: 0`), using this source:\n```\nhttps://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260514_135830_bb6491d1-9b66-4aec-9722-13b4dfe3fb46.mp4\n```\nIt should `autoPlay`, be `muted`, `loo"
  },
  {
    "id": "ms-ai-workflow",
    "row": 3,
    "title": "AI Workflow Hero",
    "category": "Hero",
    "imageUrl": "/assets/motion-posters/ai-workflow.jpg",
    "videoUrl": "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260511_131941_d136af49-e243-493a-be14-6ff3f24e09e6.mp4",
    "specs": {
      "layout": "Hero",
      "motion": "TSX + MP4 Trailer + Full Prompt",
      "responsive": "390px / 768px / 1440px",
      "durationMs": 420,
      "easing": "cubic-bezier(0.22, 1, 0.36, 1)"
    },
    "tags": [
      "Hero",
      "hero"
    ],
    "promptText": "### Stack\n\n- **Vite** + **React 18** + **TypeScript**\n- **Tailwind CSS 3.4**\n- **lucide-react** for icons (`LogIn`, `UserPlus`, `Play`, `Sparkles`, `Menu`, `X`)\n- No Framer Motion -- all animations are CSS `transition-*` classes\n\n---\n\n### Fonts (loaded in `index.html`)\n\n```html\n<link rel=\"preconnect\" href=\"https://fonts.googleapis.com\" />\n<link rel=\"preconnect\" href=\"https://fonts.gstatic.com\" crossorigin />\n<link href=\"https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap\" rel=\"stylesheet\" />\n<link href=\"https://db.onlinewebfonts.com/c/6e47ef470dd19698c911332a9b"
  },
  {
    "id": "ms-impact-ventures",
    "row": 0,
    "title": "Impact Ventures",
    "category": "Hero",
    "imageUrl": "/assets/motion-posters/impact-ventures.jpg",
    "videoUrl": "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260622_204103_f607742e-09da-4cf5-bb06-4e67b0a531de.mp4",
    "specs": {
      "layout": "Hero",
      "motion": "JS + MP4 Trailer + Full Prompt",
      "responsive": "390px / 768px / 1440px",
      "durationMs": 420,
      "easing": "cubic-bezier(0.22, 1, 0.36, 1)"
    },
    "tags": [
      "Hero",
      "hero"
    ],
    "promptText": "Create a fullscreen hero landing page section for a design agency called \"Atelier\" using React, Tailwind CSS, and Lucide React icons. The section must be fully mobile responsive with an animated hamburger mobile menu. Here are the exact specifications:\n\n**Fonts (Google Fonts):**\n- \"Instrument Serif\" (regular + italic) for headings and mobile menu links\n- \"Inter\" (weights 300, 400, 500, 600) as the sans-serif body font\n\nLoad them in index.html:\n```html\n<link rel=\"preconnect\" href=\"https://fonts.googleapis.com\" />\n<link rel=\"preconnect\" href=\"https://fonts.gstatic.com\" crossorigin />\n<link href="
  },
  {
    "id": "ms-vaultshield",
    "row": 1,
    "title": "VaultShield",
    "category": "Hero",
    "imageUrl": "/assets/motion-posters/vaultshield.jpg",
    "videoUrl": "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260518_003132_8b7edcb6-c64d-4a52-a9ca-879942e122ad.mp4",
    "specs": {
      "layout": "Hero",
      "motion": "JS + MP4 Trailer + Full Prompt",
      "responsive": "390px / 768px / 1440px",
      "durationMs": 420,
      "easing": "cubic-bezier(0.22, 1, 0.36, 1)"
    },
    "tags": [
      "Hero",
      "hero"
    ],
    "promptText": "Create a fullscreen hero section for a password manager app called \"VaultShield\" using React, TypeScript, Tailwind CSS, Framer Motion, and Lucide React icons.\n\n---\n\n## Fonts\n\n- **Heading font:** `Helvetica Now Display Bold` loaded from `https://db.onlinewebfonts.com/c/04e6981992c0e2e7642af2074ebe3901?family=Helvetica+Now+Display+Bold` (add as a `<link>` in `index.html`)\n- **Body font:** `Inter` (weights 300-900) loaded from Google Fonts: `https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap` (imported in CSS)\n\n## CSS Variables\n\n```css\n:root {\n  --font-he"
  },
  {
    "id": "ms-visual-hero",
    "row": 2,
    "title": "Visual Hero",
    "category": "Hero",
    "imageUrl": "/assets/motion-posters/visual-hero.jpg",
    "videoUrl": "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260511_080827_a9e5ad52-b6ee-4e79-b393-d936f179cfd7.mp4",
    "specs": {
      "layout": "Hero",
      "motion": "JS + MP4 Trailer + Full Prompt",
      "responsive": "390px / 768px / 1440px",
      "durationMs": 420,
      "easing": "cubic-bezier(0.22, 1, 0.36, 1)"
    },
    "tags": [
      "Hero",
      "hero"
    ],
    "promptText": "**Build a fullscreen hero section in a Vite + React + TypeScript + Tailwind CSS project. Use `gsap` and `lucide-react`. No other UI libraries.**\n\n### Fonts (in `src/index.css`)\nImport at the top of index.css BEFORE `\n@tailwind\n` directives:\n```css\n@import\n url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Barlow:wght@300;400;500;600&display=swap');\n\n@font\n-face {\n  font-family: 'Dirtyline';\n  src: url('https://fonts.cdnfonts.com/s/15011/Dirtyline36DaysofType.woff') format('woff');\n  font-weight: normal;\n  font-style: normal;\n  font-display: swap;\n}\n```\nBody font: `"
  },
  {
    "id": "ms-digital-experiences",
    "row": 3,
    "title": "Digital Experiences",
    "category": "Landing Page",
    "imageUrl": "/assets/motion-posters/digital-experiences.jpg",
    "videoUrl": "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260619_191346_9d19d66e-86a4-47f7-8dc6-712c1788c3b2.mp4",
    "specs": {
      "layout": "Landing Page",
      "motion": "JS + MP4 Trailer + Full Prompt",
      "responsive": "390px / 768px / 1440px",
      "durationMs": 420,
      "easing": "cubic-bezier(0.22, 1, 0.36, 1)"
    },
    "tags": [
      "Landing Page",
      "hero"
    ],
    "promptText": "## Prompt\n\nBuild a single-page React + Vite + TypeScript + Tailwind CSS site with exactly two full-screen sections (Hero and Capabilities). The page is a dark, cinematic web design agency landing page with \"liquid glass\" morphism UI elements and smooth blur/fade animations using Framer Motion.\n\n---\n\n### Fonts (Google Fonts)\n\nLoad via `<link>` in `index.html`:\n- **Instrument Serif** (italic) -- used for all headings (`font-heading`)\n- **Barlow** (weights 300, 400, 500, 600) -- used for body text (`font-body`)\n\nTailwind config extends `fontFamily`:\n```js\nheading: [\"'Instrument Serif'\", 'serif'],"
  },
  {
    "id": "ms-arceage-stats",
    "row": 0,
    "title": "Arceage Stats",
    "category": "Stats",
    "imageUrl": "/assets/motion-posters/arceage-stats.jpg",
    "videoUrl": "https://app-uploads.krea.ai/wan-videos/7f348c17-c3aa-40c9-9d5b-a2bed9a72c2e.mp4",
    "specs": {
      "layout": "Stats",
      "motion": "JS + MP4 Trailer + Full Prompt",
      "responsive": "390px / 768px / 1440px",
      "durationMs": 420,
      "easing": "cubic-bezier(0.22, 1, 0.36, 1)"
    },
    "tags": [
      "Stats",
      "stats"
    ],
    "promptText": "Create a React + Tailwind CSS v4 + Motion (framer-motion successor) stats section component. Use Vite as the bundler. The section should be fully mobile responsive.\n\n### Fonts\n\nImport from Google Fonts in your global CSS:\n```\n@import url('https://fonts.googleapis.com/css2?family=Barlow:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&family=Instrument+Serif:ital@0;1&display=swap');\n```\n\nDefine two Tailwind v4 theme fonts:\n- `--font-sans: \"Barlow\", ui-sans-serif, system-ui, sans-serif;` (used as the primary UI font via `font-s"
  },
  {
    "id": "ms-innovation-lab",
    "row": 1,
    "title": "Innovation Lab",
    "category": "Technology",
    "imageUrl": "/assets/motion-posters/innovation-lab.jpg",
    "videoUrl": "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260717_120352_eb988725-1351-43b3-8095-16e4a1005e3d.mp4",
    "specs": {
      "layout": "Technology",
      "motion": "JS + MP4 Trailer + Full Prompt",
      "responsive": "390px / 768px / 1440px",
      "durationMs": 420,
      "easing": "cubic-bezier(0.22, 1, 0.36, 1)"
    },
    "tags": [
      "Technology",
      "hero"
    ],
    "promptText": "Create a full-screen immersive landing page for a fictional creative-tech studio called \"VortxLab Creations\" (brand: \"V O R T X\"). The page features a looping background video, a glassmorphism-cut button aesthetic with octagonal clip-path shapes, and staggered fade-up entrance animations on every element.\n\n### Tech Stack\n- React + TypeScript + Vite\n- Tailwind CSS (configured with `fontFamily.inter: ['Inter', 'sans-serif']`)\n- `lucide-react` for icons (only `ArrowRight` used)\n- Google Fonts: **Inter** weights 300–900, loaded via `<link>` in index.html with preconnect to fonts.googleapis.com and"
  },
  {
    "id": "ms-halo-use-case",
    "row": 2,
    "title": "Halo Use Case",
    "category": "Use Case",
    "imageUrl": "/assets/motion-posters/halo-use-case.jpg",
    "videoUrl": "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260423_183428_ab5e672a-f608-4dcb-b319-f3e040f02e2d.mp4",
    "specs": {
      "layout": "Use Case",
      "motion": "TSX + MP4 Trailer + Full Prompt",
      "responsive": "390px / 768px / 1440px",
      "durationMs": 420,
      "easing": "cubic-bezier(0.22, 1, 0.36, 1)"
    },
    "tags": [
      "Use Case",
      "features"
    ],
    "promptText": "**Prompt:**\n\nBuild a \"Use Cases\" section for a fintech stablecoin landing page using **React + TypeScript + Tailwind CSS** with **lucide-react** for icons (use `ArrowRight`). Make it fully mobile responsive.\n\n---\n\n### Font Setup\n\nThe page uses **\"TT Norms Pro\"** loaded via a stylesheet link in `index.html`:\n\n```html\n<link href=\"https://db.onlinewebfonts.com/c/49bf5d043a27b890a040cf393277e2b2?family=TT+Norms+Pro+Regular\" rel=\"stylesheet\">\n```\n\nAdd this `<link>` inside the `<head>` of your `index.html`.\n\nThen in `index.css`, apply it globally:\n\n```css\n@tailwind base;\n@tailwind components;\n@tailw"
  },
  {
    "id": "ms-health-portal",
    "row": 3,
    "title": "Health Portal",
    "category": "Landing Page",
    "imageUrl": "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260624_113640_ccf3cf97-d447-425b-a134-d7b09fc743fc.png",
    "videoUrl": "",
    "specs": {
      "layout": "Landing Page",
      "motion": "TS + CSS + Full Prompt",
      "responsive": "390px / 768px / 1440px",
      "durationMs": 420,
      "easing": "cubic-bezier(0.22, 1, 0.36, 1)"
    },
    "tags": [
      "Landing Page",
      "hero"
    ],
    "promptText": "Create a single-page dental clinic landing page using **React + Vite + TypeScript + Tailwind CSS**. No external UI libraries, no icon libraries. Everything lives in one `App.tsx` file. The page has 3 full-screen sections, a splash screen, and a fixed navbar.\n\n---\n\n### SETUP\n\n**Font:** \"Open Sauce One\" loaded via these exact links in `index.html` `<head>`:\n```html\n<link href=\"https://db.onlinewebfonts.com/c/1cd1e7d71e048159076fd90b39846902?family=Open+Sauce+One\" rel=\"stylesheet\">\n<link href=\"https://db.onlinewebfonts.com/c/42acf9aa4a6dc2f2886a3f682e337ead?family=Open+Sauce+One+Bold\" rel=\"styles"
  },
  {
    "id": "ms-talent-collective",
    "row": 0,
    "title": "Talent Collective",
    "category": "Agency",
    "imageUrl": "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260727_225202_f9e684f3-dc19-469a-8142-eb391bfc601b.png",
    "videoUrl": "",
    "specs": {
      "layout": "Agency",
      "motion": "JS + Full Prompt",
      "responsive": "390px / 768px / 1440px",
      "durationMs": 420,
      "easing": "cubic-bezier(0.22, 1, 0.36, 1)"
    },
    "tags": [
      "Agency",
      "hero"
    ],
    "promptText": "Build a single full-viewport React + TypeScript + Tailwind CSS page for a creative studio called **Kollektiva**. The app renders only this one section (no nav, no other pages). Stack: Vite + React 18 + Tailwind 3. Font: **Geist** (Google Fonts weights 300, 400, 500). Title: `Kollektiva`.\n\n### Font setup\n\nIn `index.html`:\n```html\n<link rel=\"preconnect\" href=\"https://fonts.googleapis.com\" />\n<link rel=\"preconnect\" href=\"https://fonts.gstatic.com\" crossorigin />\n<link href=\"https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500&display=swap\" rel=\"stylesheet\" />\n```\n\nIn Tailwind config, e"
  },
  {
    "id": "ms-virtual-fitting",
    "row": 1,
    "title": "Virtual Fitting",
    "category": "Ecommerce",
    "imageUrl": "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261104_080623_c94c85a3-23d5-4a0c-afff-41be1b5b8191.png",
    "videoUrl": "",
    "specs": {
      "layout": "Ecommerce",
      "motion": "JS + Full Prompt",
      "responsive": "390px / 768px / 1440px",
      "durationMs": 420,
      "easing": "cubic-bezier(0.22, 1, 0.36, 1)"
    },
    "tags": [
      "Ecommerce",
      "hero"
    ],
    "promptText": "# VirtualFit: Spatial Try-On Arc (exact recreation prompt)\n\nBuild a single-screen, visionOS-style virtual try-on hero called **VirtualFit**.\n\n- **Scene:** a softly blurred bright living room fills the screen. A man stands in the centre, cut off at mid-thigh, in front of a huge ghosted `FIT` word.\n- **Garment arc:** frosted-glass garment cards curve around him in a 3D arc. They recede, shrink, tilt and blur toward the edges and bob gently. You can drag, flick, scroll, use the arrow keys or buttons, or click a card.\n- **Try-on:** when the arc settles on a garment, a glowing horizontal scan line "
  },
  {
    "id": "ms-saltwake-pirate-hero",
    "row": 2,
    "title": "Pirate Ship",
    "category": "Travel",
    "imageUrl": "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261031_024714_39df675e-5060-4528-87dc-9d0c274815aa.png",
    "videoUrl": "",
    "specs": {
      "layout": "Travel",
      "motion": "JS + CSS + Full Prompt",
      "responsive": "390px / 768px / 1440px",
      "durationMs": 420,
      "easing": "cubic-bezier(0.22, 1, 0.36, 1)"
    },
    "tags": [
      "Travel",
      "hero"
    ],
    "promptText": "# Saltwake — Pirate Ship Two-Scene Hero (exact recreation prompt)\n\nBuild a single-file, full-viewport landing hero for **Saltwake**, an illustrated pirate voyage brand. The page is a flat game-art scene on parchment inside a thick black rounded frame. A galleon rides black hand-drawn line-art waves that are animated live in code. One click (or a scroll) plays a long single-take transition: the sea rises over the headline, the ship shrinks away to the horizon, and a palm island with a pirate captain slides in from the left. Soft palm-frond shadows drift across everything, and a custom black rin"
  },
  {
    "id": "ms-nexacore-results",
    "row": 3,
    "title": "NexaCore Results",
    "category": "Features",
    "imageUrl": "https://cdn.prod.website-files.com/6720dd1ab6df0da205830ab1/6870f623cf3df417ce45df05_icon%20logo%20eternacloud.png",
    "videoUrl": "",
    "specs": {
      "layout": "Features",
      "motion": "TS + Full Prompt",
      "responsive": "390px / 768px / 1440px",
      "durationMs": 420,
      "easing": "cubic-bezier(0.22, 1, 0.36, 1)"
    },
    "tags": [
      "Features",
      "features"
    ],
    "promptText": "Build a single React + TypeScript + Tailwind CSS v3 component called `PrecisionSection`. No external icon libraries — all icons are inline SVG or `<img>` tags. No `useState`, no animations, no hover states. Two separate layouts: a desktop staircase (absolutely-positioned pillars) and a mobile alternating-flow layout. The `sm:` breakpoint controls visibility between them.\n\n---\n\n## Global font\n\nRegister **\"Mazzard H\"** in `index.css` and apply it globally:\n\n```css\n@font-face {\n  font-family: 'Mazzard H';\n  font-weight: 400;\n  font-style: normal;\n  src: url('https://db.onlinewebfonts.com/t/eb5b5e"
  }
];
