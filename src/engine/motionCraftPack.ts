import type {
  BrandPersonality,
  MotionRecipeItem,
  OnboardingProfile,
} from '../types/workspaceV4';

export type CraftThemeMode = 'dark' | 'light';

export type SignatureMotionId =
  | 'blur-rise'
  | 'liquid-glass'
  | 'double-bezel'
  | 'scroll-reveal'
  | 'magnetic-cta'
  | 'grain-overlay';

export interface CraftPalette {
  bg: string;
  surface: string;
  surfaceHigh: string;
  fg: string;
  muted: string;
  faint: string;
  line: string;
  lineStrong: string;
  accent: string;
  accentFill: string;
  onAccent: string;
  accentSoft: string;
  secondary: string;
}

export interface BrandCraftConfig {
  id: BrandPersonality;
  label: string;
  dotColor: string;
  defaultTheme: CraftThemeMode;
  fontDisplay: string;
  fontBody: string;
  fontMono: string;
  radiusCard: string;
  radiusBtn: string;
  heroAnchor: 'split' | 'bottom' | 'editorial' | 'inset';
  defaultSignature: SignatureMotionId;
  dark: CraftPalette;
  light: CraftPalette;
}

export interface SignatureMotionSpec {
  id: SignatureMotionId;
  label: string;
  recipeRef: string;
  summary: string;
  supporting: string[];
}

export const CRAFT_NUMERIC_RULES = {
  scaleContrastRatio: 5.2,
  h1Size: 'clamp(2.25rem, 4.8vw, 4.6rem)',
  h2Size: 'clamp(1.55rem, 2.8vw, 2.45rem)',
  bodySize: 'clamp(0.95rem, 0.92rem + 0.18vw, 1.05rem)',
  labelSize: '0.75rem',
  h1LineHeight: 0.98,
  h1Tracking: '-0.032em',
  bodyLineHeight: 1.62,
  labelTracking: '0.14em',
  easeEntrance: 'cubic-bezier(0.22, 1, 0.36, 1)',
  easeState: 'cubic-bezier(0.4, 0, 0.2, 1)',
  easeSpring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  durHoverMs: 220,
  durEntranceMs: 760,
  staggerWordMs: 70,
  staggerCardMs: 110,
  gutterMobilePx: 20,
  gutterDesktopPx: 48,
  maxContentPx: 1180,
  subMaxWidthRem: 36,
} as const;

export const VIETNAMESE_GOOGLE_FONTS_LINK =
  'https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;1,9..144,400&family=IBM+Plex+Mono:wght@400;500&display=swap';

export const SIGNATURE_MOTIONS: Record<SignatureMotionId, SignatureMotionSpec> = {
  'blur-rise': {
    id: 'blur-rise',
    label: 'Blur-Rise Stagger',
    recipeRef: 'mt-18-staggered-blur-rise-load-choreography',
    summary: 'Tiêu đề hiện dần theo nhịp mờ-rõ 70ms kết hợp cuộn vào nhẹ.',
    supporting: ['scroll-reveal', 'grain-overlay'],
  },
  'liquid-glass': {
    id: 'liquid-glass',
    label: 'Liquid Glass Rim',
    recipeRef: 'mt-10-liquid-glass-surface',
    summary: 'Bề mặt kính mờ có đường sáng viền trên-dưới kiểu thấu kính.',
    supporting: ['scroll-reveal', 'magnetic-cta'],
  },
  'double-bezel': {
    id: 'double-bezel',
    label: 'Double-Bezel Craft',
    recipeRef: 'mt-12-premium-button-finishes-liquid-metal-halo-jewel',
    summary: 'Khối thẻ viền kép đồng tâm, phản hồi nhấn mềm theo đường cong spring.',
    supporting: ['scroll-reveal', 'grain-overlay'],
  },
  'scroll-reveal': {
    id: 'scroll-reveal',
    label: 'Scroll Story Rhythm',
    recipeRef: 'mt-39-viewport-triggered-staggered-reveal-corner-decor',
    summary: 'Nội dung mở lớp theo vị trí cuộn, không ẩn chữ nếu trình duyệt tắt JS.',
    supporting: ['blur-rise', 'grain-overlay'],
  },
  'magnetic-cta': {
    id: 'magnetic-cta',
    label: 'Magnetic Pill CTA',
    recipeRef: 'mt-32-magnetic-hover',
    summary: 'Nút hành động hút nhẹ theo con trỏ trên máy tính, tự tắt ở màn hình chạm.',
    supporting: ['scroll-reveal', 'double-bezel'],
  },
  'grain-overlay': {
    id: 'grain-overlay',
    label: 'Editorial Film Grain',
    recipeRef: 'mt-17-texture-overlays-grain-noise-type-halftone-dot-g',
    summary: 'Lớp hạt mịn 3% đồng nhất bề mặt, kèm chữ hiển thị có điểm nhấn nghiêng.',
    supporting: ['blur-rise', 'scroll-reveal'],
  },
};

export const BRAND_PALETTES: Record<BrandPersonality, BrandCraftConfig> = {
  modern: {
    id: 'modern',
    label: 'Hiện đại, công nghệ',
    dotColor: '#38c99a',
    defaultTheme: 'dark',
    fontDisplay: "'Be Vietnam Pro', system-ui, sans-serif",
    fontBody: "'Be Vietnam Pro', system-ui, sans-serif",
    fontMono: "'IBM Plex Mono', ui-monospace, monospace",
    radiusCard: '20px',
    radiusBtn: '9999px',
    heroAnchor: 'split',
    defaultSignature: 'liquid-glass',
    dark: {
      bg: '#0b0e10',
      surface: '#121619',
      surfaceHigh: '#1a2024',
      fg: '#f3f5f6',
      muted: '#b7c0c7',
      faint: '#8c98a1',
      line: 'rgba(243, 245, 246, 0.11)',
      lineStrong: 'rgba(243, 245, 246, 0.22)',
      accent: '#38c99a',
      accentFill: '#0d825f',
      onAccent: '#ffffff',
      accentSoft: 'rgba(56, 201, 154, 0.14)',
      secondary: '#8cbcc8',
    },
    light: {
      bg: '#f6f7f5',
      surface: '#ffffff',
      surfaceHigh: '#eef2ef',
      fg: '#101514',
      muted: '#3a4542',
      faint: '#52605c',
      line: 'rgba(16, 21, 20, 0.11)',
      lineStrong: 'rgba(16, 21, 20, 0.22)',
      accent: '#0a6e50',
      accentFill: '#0a6e50',
      onAccent: '#ffffff',
      accentSoft: 'rgba(10, 110, 80, 0.1)',
      secondary: '#1f5568',
    },
  },
  professional: {
    id: 'professional',
    label: 'Chuyên nghiệp',
    dotColor: '#7bb8c9',
    defaultTheme: 'light',
    fontDisplay: "'Fraunces', Georgia, serif",
    fontBody: "'Be Vietnam Pro', system-ui, sans-serif",
    fontMono: "'IBM Plex Mono', ui-monospace, monospace",
    radiusCard: '16px',
    radiusBtn: '9999px',
    heroAnchor: 'editorial',
    defaultSignature: 'double-bezel',
    dark: {
      bg: '#0c1217',
      surface: '#131c23',
      surfaceHigh: '#1b2730',
      fg: '#f1f5f8',
      muted: '#b5c3cd',
      faint: '#8c9da8',
      line: 'rgba(241, 245, 248, 0.11)',
      lineStrong: 'rgba(241, 245, 248, 0.22)',
      accent: '#7cc0d1',
      accentFill: '#176073',
      onAccent: '#ffffff',
      accentSoft: 'rgba(124, 192, 209, 0.15)',
      secondary: '#e6b385',
    },
    light: {
      bg: '#f4f7f8',
      surface: '#ffffff',
      surfaceHigh: '#e9eff1',
      fg: '#101920',
      muted: '#3c4b55',
      faint: '#546570',
      line: 'rgba(16, 25, 32, 0.11)',
      lineStrong: 'rgba(16, 25, 32, 0.22)',
      accent: '#17596b',
      accentFill: '#17596b',
      onAccent: '#ffffff',
      accentSoft: 'rgba(23, 89, 107, 0.1)',
      secondary: '#8c4b1e',
    },
  },
  friendly: {
    id: 'friendly',
    label: 'Thân thiện',
    dotColor: '#e6b385',
    defaultTheme: 'light',
    fontDisplay: "'Fraunces', Georgia, serif",
    fontBody: "'Be Vietnam Pro', system-ui, sans-serif",
    fontMono: "'IBM Plex Mono', ui-monospace, monospace",
    radiusCard: '24px',
    radiusBtn: '9999px',
    heroAnchor: 'inset',
    defaultSignature: 'blur-rise',
    dark: {
      bg: '#14110f',
      surface: '#1d1815',
      surfaceHigh: '#27211c',
      fg: '#f6f1eb',
      muted: '#c5b8ac',
      faint: '#9c8f83',
      line: 'rgba(246, 241, 235, 0.11)',
      lineStrong: 'rgba(246, 241, 235, 0.22)',
      accent: '#e6b385',
      accentFill: '#9a4b1c',
      onAccent: '#ffffff',
      accentSoft: 'rgba(230, 179, 133, 0.15)',
      secondary: '#76c2a8',
    },
    light: {
      bg: '#f9f6f1',
      surface: '#ffffff',
      surfaceHigh: '#f0e9df',
      fg: '#1c1612',
      muted: '#4b3f36',
      faint: '#62554b',
      line: 'rgba(28, 22, 18, 0.11)',
      lineStrong: 'rgba(28, 22, 18, 0.22)',
      accent: '#8c3f14',
      accentFill: '#8c3f14',
      onAccent: '#ffffff',
      accentSoft: 'rgba(140, 63, 20, 0.1)',
      secondary: '#0f6a4f',
    },
  },
  minimal: {
    id: 'minimal',
    label: 'Tinh tế, tối giản',
    dotColor: '#c4d4c8',
    defaultTheme: 'light',
    fontDisplay: "'Fraunces', Georgia, serif",
    fontBody: "'Be Vietnam Pro', system-ui, sans-serif",
    fontMono: "'IBM Plex Mono', ui-monospace, monospace",
    radiusCard: '16px',
    radiusBtn: '9999px',
    heroAnchor: 'bottom',
    defaultSignature: 'grain-overlay',
    dark: {
      bg: '#0e0f0e',
      surface: '#161816',
      surfaceHigh: '#1f221f',
      fg: '#f2f2ee',
      muted: '#b5b8b2',
      faint: '#8f938c',
      line: 'rgba(242, 242, 238, 0.11)',
      lineStrong: 'rgba(242, 242, 238, 0.22)',
      accent: '#c4d4c8',
      accentFill: '#f2f2ee',
      onAccent: '#0e0f0e',
      accentSoft: 'rgba(196, 212, 200, 0.13)',
      secondary: '#e0c09c',
    },
    light: {
      bg: '#f6f5f1',
      surface: '#ffffff',
      surfaceHigh: '#eceae3',
      fg: '#141413',
      muted: '#454541',
      faint: '#5e5e59',
      line: 'rgba(20, 20, 19, 0.11)',
      lineStrong: 'rgba(20, 20, 19, 0.22)',
      accent: '#21382c',
      accentFill: '#141413',
      onAccent: '#f6f5f1',
      accentSoft: 'rgba(33, 56, 44, 0.09)',
      secondary: '#6e5235',
    },
  },
  playful: {
    id: 'playful',
    label: 'Năng động, trẻ trung',
    dotColor: '#9ad96c',
    defaultTheme: 'dark',
    fontDisplay: "'Be Vietnam Pro', system-ui, sans-serif",
    fontBody: "'Be Vietnam Pro', system-ui, sans-serif",
    fontMono: "'IBM Plex Mono', ui-monospace, monospace",
    radiusCard: '24px',
    radiusBtn: '9999px',
    heroAnchor: 'split',
    defaultSignature: 'magnetic-cta',
    dark: {
      bg: '#10130f',
      surface: '#181d16',
      surfaceHigh: '#21281e',
      fg: '#f4f6ef',
      muted: '#b8c1b1',
      faint: '#919c89',
      line: 'rgba(244, 246, 239, 0.11)',
      lineStrong: 'rgba(244, 246, 239, 0.22)',
      accent: '#9ad96c',
      accentFill: '#2d6e1d',
      onAccent: '#ffffff',
      accentSoft: 'rgba(154, 217, 108, 0.15)',
      secondary: '#e6b385',
    },
    light: {
      bg: '#f8faf3',
      surface: '#ffffff',
      surfaceHigh: '#ecf1e2',
      fg: '#141911',
      muted: '#3e4a38',
      faint: '#55634e',
      line: 'rgba(20, 25, 17, 0.11)',
      lineStrong: 'rgba(20, 25, 17, 0.22)',
      accent: '#2b661a',
      accentFill: '#2b661a',
      onAccent: '#ffffff',
      accentSoft: 'rgba(43, 102, 26, 0.1)',
      secondary: '#914d18',
    },
  },
  bold: {
    id: 'bold',
    label: 'Mạnh mẽ, cá tính',
    dotColor: '#f29066',
    defaultTheme: 'dark',
    fontDisplay: "'Be Vietnam Pro', system-ui, sans-serif",
    fontBody: "'Be Vietnam Pro', system-ui, sans-serif",
    fontMono: "'IBM Plex Mono', ui-monospace, monospace",
    radiusCard: '14px',
    radiusBtn: '9999px',
    heroAnchor: 'editorial',
    defaultSignature: 'scroll-reveal',
    dark: {
      bg: '#0d0b0b',
      surface: '#161313',
      surfaceHigh: '#211c1c',
      fg: '#f7f3ef',
      muted: '#c4b9b2',
      faint: '#9a8e87',
      line: 'rgba(247, 243, 239, 0.12)',
      lineStrong: 'rgba(247, 243, 239, 0.24)',
      accent: '#f29066',
      accentFill: '#ad3815',
      onAccent: '#ffffff',
      accentSoft: 'rgba(242, 144, 102, 0.16)',
      secondary: '#8cbcc8',
    },
    light: {
      bg: '#f8f5f1',
      surface: '#ffffff',
      surfaceHigh: '#efe9e2',
      fg: '#151110',
      muted: '#4a3f3b',
      faint: '#635651',
      line: 'rgba(21, 17, 16, 0.12)',
      lineStrong: 'rgba(21, 17, 16, 0.24)',
      accent: '#a33312',
      accentFill: '#a33312',
      onAccent: '#ffffff',
      accentSoft: 'rgba(163, 51, 18, 0.1)',
      secondary: '#1d5669',
    },
  },
};

export interface AccentOverride {
  name: string;
  darkAccent: string;
  darkFill: string;
  darkSoft: string;
  lightAccent: string;
  lightFill: string;
  lightSoft: string;
}

export const VERIFIED_ACCENT_OVERRIDES: Record<string, AccentOverride> = {
  emerald: {
    name: 'Xanh ngọc',
    darkAccent: '#38c99a',
    darkFill: '#0d825f',
    darkSoft: 'rgba(56, 201, 154, 0.15)',
    lightAccent: '#0a6e50',
    lightFill: '#0a6e50',
    lightSoft: 'rgba(10, 110, 80, 0.1)',
  },
  peach: {
    name: 'Cam đào',
    darkAccent: '#e6b385',
    darkFill: '#9a4b1c',
    darkSoft: 'rgba(230, 179, 133, 0.16)',
    lightAccent: '#8c3f14',
    lightFill: '#8c3f14',
    lightSoft: 'rgba(140, 63, 20, 0.1)',
  },
  ocean: {
    name: 'Xanh biển',
    darkAccent: '#7cc0d1',
    darkFill: '#176073',
    darkSoft: 'rgba(124, 192, 209, 0.16)',
    lightAccent: '#17596b',
    lightFill: '#17596b',
    lightSoft: 'rgba(23, 89, 107, 0.1)',
  },
  coral: {
    name: 'Đỏ san hô',
    darkAccent: '#f29066',
    darkFill: '#ad3815',
    darkSoft: 'rgba(242, 144, 102, 0.16)',
    lightAccent: '#a33312',
    lightFill: '#a33312',
    lightSoft: 'rgba(163, 51, 18, 0.1)',
  },
  lime: {
    name: 'Xanh lá sáng',
    darkAccent: '#9ad96c',
    darkFill: '#2d6e1d',
    darkSoft: 'rgba(154, 217, 108, 0.15)',
    lightAccent: '#2b661a',
    lightFill: '#2b661a',
    lightSoft: 'rgba(43, 102, 26, 0.1)',
  },
};

export function resolveCraftPalette(
  personality: BrandPersonality,
  mode: CraftThemeMode,
  accentKey?: string
): CraftPalette {
  const base = { ...BRAND_PALETTES[personality][mode] };
  if (accentKey && VERIFIED_ACCENT_OVERRIDES[accentKey]) {
    const ov = VERIFIED_ACCENT_OVERRIDES[accentKey];
    if (mode === 'dark') {
      base.accent = ov.darkAccent;
      base.accentFill = ov.darkFill;
      base.onAccent = '#ffffff';
      base.accentSoft = ov.darkSoft;
    } else {
      base.accent = ov.lightAccent;
      base.accentFill = ov.lightFill;
      base.onAccent = '#ffffff';
      base.accentSoft = ov.lightSoft;
    }
  }
  return base;
}

export function pickMotionSignature(
  profile: OnboardingProfile,
  prompt = '',
  variationIndex = 0
): SignatureMotionSpec {
  const q = prompt.toLowerCase();
  const ordered: SignatureMotionId[] = [
    BRAND_PALETTES[profile.personality].defaultSignature,
    'blur-rise',
    'liquid-glass',
    'double-bezel',
    'scroll-reveal',
    'magnetic-cta',
    'grain-overlay',
  ];
  if (variationIndex === 0) {
    if (/kính|glass|trong suốt|3d|shader/.test(q)) return SIGNATURE_MOTIONS['liquid-glass'];
    if (/cuộn|scroll|kể chuyện|lịch sử|hành trình/.test(q)) return SIGNATURE_MOTIONS['scroll-reveal'];
    if (/mờ|blur|thơ|triển lãm|nghệ thuật|ảnh/.test(q)) return SIGNATURE_MOTIONS['blur-rise'];
    if (/tối giản|gốm|báo chí|tạp chí|minimal/.test(q)) return SIGNATURE_MOTIONS['grain-overlay'];
    if (/sự kiện|đêm nhạc|workshop|clb|robotics/.test(q)) return SIGNATURE_MOTIONS['magnetic-cta'];
    return SIGNATURE_MOTIONS[ordered[0]];
  }
  const unique = Array.from(new Set(ordered));
  return SIGNATURE_MOTIONS[unique[variationIndex % unique.length]];
}

let cachedRecipes: MotionRecipeItem[] | null = null;
let inflightRecipes: Promise<MotionRecipeItem[]> | null = null;

export function fetchMotionRecipes(): Promise<MotionRecipeItem[]> {
  if (cachedRecipes) return Promise.resolve(cachedRecipes);
  if (!inflightRecipes) {
    inflightRecipes = fetch('/data/motion-recipes.json')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<{ recipes?: MotionRecipeItem[] }>;
      })
      .then((data) => {
        cachedRecipes = Array.isArray(data?.recipes) ? data.recipes : [];
        return cachedRecipes;
      })
      .catch(() => {
        inflightRecipes = null;
        return [];
      });
  }
  return inflightRecipes;
}

export function buildCraftStylesheet(
  personality: BrandPersonality,
  mode: CraftThemeMode,
  signature: SignatureMotionId,
  accentKey?: string
): string {
  const cfg = BRAND_PALETTES[personality];
  const p = resolveCraftPalette(personality, mode, accentKey);
  const darkP = resolveCraftPalette(personality, 'dark', accentKey);
  const lightP = resolveCraftPalette(personality, 'light', accentKey);

  const signatureCss =
    signature === 'liquid-glass'
      ? `.craft-surface {
  position: relative;
  background: color-mix(in srgb, var(--surface) 78%, transparent);
  -webkit-backdrop-filter: blur(14px);
  backdrop-filter: blur(14px);
  border: 1px solid var(--line);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.08);
}`
      : signature === 'double-bezel'
        ? `.craft-surface {
  position: relative;
  background: var(--surface);
  border: 1px solid var(--line);
  box-shadow: inset 0 0 0 1px rgba(255,255,255,0.03), 0 10px 28px -18px rgba(0,0,0,0.45);
}`
        : `.craft-surface {
  position: relative;
  background: var(--surface);
  border: 1px solid var(--line);
}`;

  return `html, body {
  background: ${p.bg};
  color: ${p.fg};
  margin: 0;
  padding: 0;
  overflow-x: clip;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  scroll-behavior: smooth;
}
:root {
  --bg: ${p.bg};
  --surface: ${p.surface};
  --surface-high: ${p.surfaceHigh};
  --fg: ${p.fg};
  --muted: ${p.muted};
  --faint: ${p.faint};
  --line: ${p.line};
  --line-strong: ${p.lineStrong};
  --accent: ${p.accent};
  --accent-fill: ${p.accentFill};
  --on-accent: ${p.onAccent};
  --accent-soft: ${p.accentSoft};
  --secondary: ${p.secondary};
  --font-display: ${cfg.fontDisplay};
  --font-body: ${cfg.fontBody};
  --font-mono: ${cfg.fontMono};
  --radius-card: ${cfg.radiusCard};
  --radius-btn: ${cfg.radiusBtn};
  --ease-out: ${CRAFT_NUMERIC_RULES.easeEntrance};
  --ease-spring: ${CRAFT_NUMERIC_RULES.easeSpring};
}
html[data-page-theme="dark"] {
  --bg: ${darkP.bg};
  --surface: ${darkP.surface};
  --surface-high: ${darkP.surfaceHigh};
  --fg: ${darkP.fg};
  --muted: ${darkP.muted};
  --faint: ${darkP.faint};
  --line: ${darkP.line};
  --line-strong: ${darkP.lineStrong};
  --accent: ${darkP.accent};
  --accent-fill: ${darkP.accentFill};
  --on-accent: ${darkP.onAccent};
  --accent-soft: ${darkP.accentSoft};
  --secondary: ${darkP.secondary};
}
html[data-page-theme="light"] {
  --bg: ${lightP.bg};
  --surface: ${lightP.surface};
  --surface-high: ${lightP.surfaceHigh};
  --fg: ${lightP.fg};
  --muted: ${lightP.muted};
  --faint: ${lightP.faint};
  --line: ${lightP.line};
  --line-strong: ${lightP.lineStrong};
  --accent: ${lightP.accent};
  --accent-fill: ${lightP.accentFill};
  --on-accent: ${lightP.onAccent};
  --accent-soft: ${lightP.accentSoft};
  --secondary: ${lightP.secondary};
}
*, *::before, *::after { box-sizing: border-box; }
body {
  background: var(--bg);
  color: var(--fg);
  font-family: var(--font-body);
  font-size: ${CRAFT_NUMERIC_RULES.bodySize};
  line-height: ${CRAFT_NUMERIC_RULES.bodyLineHeight};
  min-height: 100dvh;
}
::selection { background: var(--accent-soft); color: var(--fg); }
.craft-grain {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 90;
  opacity: 0.032;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 160 160' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
}
.wrap {
  width: 100%;
  max-width: ${CRAFT_NUMERIC_RULES.maxContentPx}px;
  margin: 0 auto;
  padding: 0 ${CRAFT_NUMERIC_RULES.gutterMobilePx}px;
}
@media (min-width: 900px) {
  .wrap { padding: 0 ${CRAFT_NUMERIC_RULES.gutterDesktopPx}px; }
}
${signatureCss}
.site-nav {
  position: sticky;
  top: 0;
  z-index: 40;
  background: color-mix(in srgb, var(--bg) 86%, transparent);
  -webkit-backdrop-filter: blur(12px);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--line);
}
.site-nav__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 64px;
}
.brand-mark {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  max-width: 58%;
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 1.08rem;
  letter-spacing: -0.02em;
  color: var(--fg);
  text-decoration: none;
  white-space: nowrap;
  overflow: hidden;
}
.brand-mark span:last-child {
  overflow: hidden;
  text-overflow: ellipsis;
}
.brand-dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: var(--accent);
  flex-shrink: 0;
}
.nav-links {
  display: none;
  align-items: center;
  gap: 24px;
}
@media (min-width: 760px) {
  .nav-links { display: flex; }
}
.nav-links a {
  color: var(--muted);
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
  transition: color 180ms ease;
}
.nav-links a:hover, .nav-links a:focus-visible { color: var(--fg); }
.nav-actions { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 44px;
  padding: 0 22px;
  border-radius: var(--radius-btn);
  font-family: var(--font-body);
  font-size: 0.92rem;
  font-weight: 600;
  text-decoration: none;
  white-space: nowrap;
  flex-shrink: 0;
  cursor: pointer;
  border: 1px solid transparent;
  transition: transform 200ms var(--ease-out), background-color 200ms ease, border-color 200ms ease, color 200ms ease;
}
@media (max-width: 540px) {
  .site-nav__inner { gap: 10px; }
  .site-nav .btn { padding: 0 14px; font-size: 0.82rem; min-height: 38px; }
  .site-nav .icon-toggle { width: 38px; height: 38px; }
}
.btn:active { transform: scale(0.97); }
.btn--primary {
  background: var(--accent-fill);
  color: var(--on-accent);
}
.btn--primary:hover { transform: translateY(-1px); filter: brightness(1.06); }
.btn--ghost {
  background: transparent;
  color: var(--fg);
  border-color: var(--line-strong);
}
.btn--ghost:hover { border-color: var(--accent); color: var(--accent); }
.icon-toggle {
  width: 44px;
  height: 44px;
  display: inline-grid;
  place-items: center;
  border-radius: 999px;
  border: 1px solid var(--line);
  background: transparent;
  color: var(--fg);
  cursor: pointer;
  transition: border-color 180ms ease, background-color 180ms ease;
}
.icon-toggle:hover { border-color: var(--line-strong); background: var(--surface); }
.hero {
  position: relative;
  padding: clamp(56px, 8vw, 104px) 0 clamp(48px, 6vw, 84px);
  overflow: hidden;
}
.hero__grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: clamp(28px, 4vw, 56px);
  align-items: center;
}
@media (min-width: 900px) {
  .hero__grid--split { grid-template-columns: minmax(0, 1.12fr) minmax(0, 0.88fr); }
}
.eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-family: var(--font-mono);
  font-size: ${CRAFT_NUMERIC_RULES.labelSize};
  letter-spacing: ${CRAFT_NUMERIC_RULES.labelTracking};
  text-transform: uppercase;
  color: var(--accent);
  margin: 0 0 18px;
}
.eyebrow::before {
  content: "";
  width: 24px;
  height: 1.5px;
  background: var(--accent);
}
.hero h1 {
  font-family: var(--font-display);
  font-size: ${CRAFT_NUMERIC_RULES.h1Size};
  line-height: ${CRAFT_NUMERIC_RULES.h1LineHeight};
  letter-spacing: ${CRAFT_NUMERIC_RULES.h1Tracking};
  font-weight: 600;
  margin: 0 0 20px;
  max-width: 18ch;
  text-wrap: balance;
}
.hero h1 em {
  font-style: italic;
  font-weight: 400;
  color: var(--accent);
}
.hero__sub {
  font-size: clamp(1rem, 0.96rem + 0.35vw, 1.18rem);
  color: var(--muted);
  max-width: ${CRAFT_NUMERIC_RULES.subMaxWidthRem}rem;
  margin: 0 0 28px;
}
.hero__cta { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; }
.hero__visual {
  border-radius: var(--radius-card);
  overflow: hidden;
  padding: 20px;
  min-width: 0;
}
.hero__visual svg, .hero__visual canvas {
  display: block;
  width: 100%;
  height: auto;
  border-radius: calc(var(--radius-card) - 8px);
}
.section {
  padding: clamp(52px, 7vw, 96px) 0;
  border-top: 1px solid var(--line);
}
.section__head {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: flex-end;
  gap: 16px;
  margin-bottom: clamp(28px, 4vw, 44px);
}
.section__num {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  letter-spacing: 0.14em;
  color: var(--faint);
  display: block;
  margin-bottom: 8px;
}
.section h2 {
  font-family: var(--font-display);
  font-size: ${CRAFT_NUMERIC_RULES.h2Size};
  line-height: 1.12;
  letter-spacing: -0.025em;
  margin: 0;
}
.section__lead {
  color: var(--muted);
  max-width: 44ch;
  margin: 0;
}
.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}
@media (min-width: 760px) {
  .stats-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
}
.stat-card {
  padding: 24px;
  border-radius: var(--radius-card);
  min-width: 0;
}
.stat-card__val {
  font-family: var(--font-display);
  font-size: clamp(1.9rem, 3.2vw, 2.9rem);
  font-weight: 600;
  letter-spacing: -0.03em;
  font-variant-numeric: tabular-nums;
  line-height: 1.05;
  color: var(--fg);
}
.stat-card__label {
  margin-top: 8px;
  font-size: 0.88rem;
  color: var(--muted);
}
.cards-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 18px;
}
@media (min-width: 760px) {
  .cards-grid--3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .cards-grid--2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
.feature-card {
  padding: 26px;
  border-radius: var(--radius-card);
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
  transition: transform 240ms var(--ease-out), border-color 220ms ease;
}
.feature-card:hover { transform: translateY(-3px); border-color: var(--line-strong); }
.feature-card__tag {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--accent);
}
.feature-card h3 {
  margin: 0;
  font-size: 1.15rem;
  letter-spacing: -0.015em;
  line-height: 1.3;
}
.feature-card p { margin: 0; color: var(--muted); font-size: 0.94rem; }
.timeline {
  display: grid;
  gap: 14px;
}
.timeline__item {
  display: grid;
  grid-template-columns: 96px minmax(0, 1fr);
  gap: 18px;
  padding: 20px 24px;
  border-radius: var(--radius-card);
  align-items: start;
}
@media (max-width: 520px) {
  .timeline__item { grid-template-columns: minmax(0, 1fr); gap: 8px; }
}
.timeline__time {
  font-family: var(--font-mono);
  font-size: 0.82rem;
  color: var(--accent);
  font-weight: 500;
  padding-top: 2px;
}
.timeline__body h3 { margin: 0 0 6px; font-size: 1.06rem; }
.timeline__body p { margin: 0; color: var(--muted); font-size: 0.94rem; }
.countdown-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 24px 28px;
  border-radius: var(--radius-card);
}
.countdown-units {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
.countdown-unit {
  min-width: 72px;
  padding: 12px 14px;
  border-radius: 14px;
  background: var(--surface-high);
  text-align: center;
  border: 1px solid var(--line);
}
.countdown-unit strong {
  display: block;
  font-family: var(--font-mono);
  font-size: 1.45rem;
  font-variant-numeric: tabular-nums;
  line-height: 1.1;
}
.countdown-unit span { font-size: 0.74rem; color: var(--muted); }
.quiz-box {
  padding: 28px;
  border-radius: var(--radius-card);
}
.quiz-tabs {
  display: inline-flex;
  gap: 8px;
  margin-bottom: 20px;
  padding: 4px;
  border-radius: 999px;
  background: var(--surface-high);
  border: 1px solid var(--line);
}
.quiz-tab {
  min-height: 36px;
  padding: 0 16px;
  border-radius: 999px;
  border: 0;
  background: transparent;
  color: var(--muted);
  font: inherit;
  font-size: 0.86rem;
  font-weight: 600;
  cursor: pointer;
}
.quiz-tab.is-active { background: var(--accent-fill); color: var(--on-accent); }
.flashcard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
  gap: 16px;
}
.flashcard {
  position: relative;
  min-height: 176px;
  padding: 22px;
  border-radius: calc(var(--radius-card) - 4px);
  border: 1px solid var(--line);
  background: var(--surface-high);
  text-align: left;
  color: var(--fg);
  font: inherit;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  transition: transform 220ms var(--ease-out), border-color 180ms ease;
}
.flashcard:hover { transform: translateY(-2px); border-color: var(--accent); }
.flashcard[data-flipped="true"] { border-color: var(--accent); background: var(--accent-soft); }
.flashcard__tag {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  color: var(--accent);
  text-transform: uppercase;
}
.flashcard__text { font-size: 0.98rem; font-weight: 500; margin: 12px 0; }
.flashcard__hint { font-size: 0.78rem; color: var(--muted); }
.quiz-q { font-size: 1.08rem; font-weight: 600; margin: 0 0 16px; }
.quiz-opts { display: grid; gap: 10px; }
.quiz-opt {
  min-height: 46px;
  padding: 10px 16px;
  border-radius: 12px;
  border: 1px solid var(--line);
  background: var(--surface-high);
  color: var(--fg);
  font: inherit;
  font-size: 0.94rem;
  text-align: left;
  cursor: pointer;
  transition: border-color 160ms ease, background-color 160ms ease;
}
.quiz-opt:hover { border-color: var(--accent); }
.quiz-opt.is-right { border-color: var(--accent); background: var(--accent-soft); }
.quiz-opt.is-wrong { border-color: #d9534f; background: rgba(217, 83, 79, 0.14); }
.quiz-foot {
  margin-top: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  font-size: 0.9rem;
  color: var(--muted);
}
.pricing-toggle {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 4px;
  border-radius: 999px;
  background: var(--surface);
  border: 1px solid var(--line);
}
.pricing-toggle button {
  min-height: 36px;
  padding: 0 16px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: var(--muted);
  font: inherit;
  font-size: 0.86rem;
  font-weight: 600;
  cursor: pointer;
}
.pricing-toggle button.is-active { background: var(--accent-fill); color: var(--on-accent); }
.price-card {
  padding: 28px;
  border-radius: var(--radius-card);
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.price-card--featured { border-color: var(--accent); box-shadow: inset 0 0 0 1px var(--accent); }
.price-card__val {
  font-family: var(--font-display);
  font-size: 2.1rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
.price-card ul {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 8px;
  color: var(--muted);
  font-size: 0.92rem;
}
.price-card li { display: flex; align-items: center; gap: 8px; }
.price-card li::before {
  content: "";
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: var(--accent);
  flex-shrink: 0;
}
.reg-form {
  display: grid;
  gap: 14px;
  max-width: 560px;
  padding: 28px;
  border-radius: var(--radius-card);
}
.reg-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 14px;
}
@media (min-width: 620px) {
  .reg-row { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
.field { display: grid; gap: 6px; }
.field label { font-size: 0.84rem; color: var(--muted); font-weight: 500; }
.field input, .field textarea {
  width: 100%;
  min-height: 46px;
  padding: 10px 14px;
  border-radius: 12px;
  border: 1px solid var(--line-strong);
  background: var(--surface-high);
  color: var(--fg);
  font: inherit;
  font-size: 0.94rem;
}
.field input:focus-visible, .field textarea:focus-visible, button:focus-visible, a:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}
.form-status {
  font-size: 0.9rem;
  color: var(--accent);
  min-height: 1.4em;
  margin: 0;
}
.team-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
}
.team-card {
  padding: 22px;
  border-radius: var(--radius-card);
  display: flex;
  align-items: center;
  gap: 14px;
}
.team-avatar {
  width: 48px;
  height: 48px;
  border-radius: 999px;
  background: var(--accent-soft);
  color: var(--accent);
  border: 1px solid var(--line-strong);
  display: grid;
  place-items: center;
  font-family: var(--font-mono);
  font-weight: 600;
  font-size: 0.9rem;
  flex-shrink: 0;
}
.team-card h3 { margin: 0 0 4px; font-size: 0.98rem; }
.team-card p { margin: 0; font-size: 0.85rem; color: var(--muted); }
.site-footer {
  border-top: 1px solid var(--line);
  padding: 36px 0 max(36px, env(safe-area-inset-bottom));
  font-size: 0.86rem;
  color: var(--muted);
}
.site-footer__row {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}
.reveal {
  opacity: 1;
  transform: none;
  transition: opacity ${CRAFT_NUMERIC_RULES.durEntranceMs}ms var(--ease-out), transform ${CRAFT_NUMERIC_RULES.durEntranceMs}ms var(--ease-out), filter ${CRAFT_NUMERIC_RULES.durEntranceMs}ms var(--ease-out);
}
.js-ready .reveal:not(.is-in) {
  opacity: 0;
  transform: translateY(20px);
  ${signature === 'blur-rise' ? 'filter: blur(6px);' : ''}
}
.js-ready .reveal.is-in {
  opacity: 1;
  transform: translateY(0);
  filter: none;
}
@media (prefers-reduced-motion: reduce) {
  html, body { scroll-behavior: auto; }
  .reveal, .js-ready .reveal:not(.is-in), .feature-card, .btn, .flashcard {
    opacity: 1 !important;
    transform: none !important;
    filter: none !important;
    transition: none !important;
    animation: none !important;
  }
}`;
}
