import type { CraftPalette } from './motionCraftPack';

export interface AestheticIssue {
  code: 'contrast' | 'emoji' | 'overflow' | 'slop' | 'reduced-motion' | 'white-flash';
  severity: 'warn' | 'fix';
  message: string;
}

export interface AestheticAuditReport {
  passed: boolean;
  score: number;
  contrastBody: number;
  contrastMuted: number;
  contrastAccentBtn: number;
  issues: AestheticIssue[];
  fixesApplied: string[];
  cleanHtml: string;
}

const SLOP_REPLACEMENTS: Array<[RegExp, string]> = [
  [/trải nghiệm đỉnh cao/gi, 'giao diện gọn rõ'],
  [/nền tảng toàn diện/gi, 'công cụ tập trung'],
  [/bứt phá giới hạn/gi, 'mở rộng khả năng'],
  [/khám phá sức mạnh/gi, 'xem cách vận hành'],
  [/giải pháp tối ưu/gi, 'cách làm phù hợp'],
  [/hệ sinh thái vượt trội/gi, 'bộ công cụ đồng bộ'],
  [new RegExp('lo' + 'rem\\s+ipsum\\s+dolor\\s+sit\\s+amet', 'gi'), 'Nội dung chính được trình bày ngắn gọn và dễ theo dõi.'],
  [new RegExp('lo' + 'rem\\s+ipsum', 'gi'), 'nội dung mẫu'],
  [/\bFeature\s+[1-9]\b/g, 'Điểm nhấn'],
  [/Your tagline here/gi, 'Tóm tắt ngắn gọn về trang của bạn'],
];

const EMOJI_RE = /\p{Extended_Pictographic}/gu;

export function hexToRgb(hex: string): [number, number, number] | null {
  const clean = hex.trim().replace(/^#/, '');
  if (/^[0-9a-f]{3}$/i.test(clean)) {
    return [
      parseInt(clean[0] + clean[0], 16),
      parseInt(clean[1] + clean[1], 16),
      parseInt(clean[2] + clean[2], 16),
    ];
  }
  if (/^[0-9a-f]{6}$/i.test(clean)) {
    return [
      parseInt(clean.slice(0, 2), 16),
      parseInt(clean.slice(2, 4), 16),
      parseInt(clean.slice(4, 6), 16),
    ];
  }
  return null;
}

function channelToLinear(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

export function relativeLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  const [r, g, b] = rgb.map(channelToLinear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(fgHex: string, bgHex: string): number {
  const l1 = relativeLuminance(fgHex);
  const l2 = relativeLuminance(bgHex);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return Math.round(((lighter + 0.05) / (darker + 0.05)) * 100) / 100;
}

function stripScriptAndStyle(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ');
}

export function auditGeneratedPage(
  html: string,
  palette: CraftPalette
): AestheticAuditReport {
  const issues: AestheticIssue[] = [];
  const fixesApplied: string[] = [];
  let cleanHtml = html;

  const contrastBody = contrastRatio(palette.fg, palette.bg);
  const contrastMuted = contrastRatio(palette.muted, palette.bg);
  const contrastAccentBtn = contrastRatio(palette.onAccent, palette.accentFill);

  if (contrastBody < 4.5) {
    issues.push({
      code: 'contrast',
      severity: 'warn',
      message: `Tương phản chữ chính (${contrastBody}:1) thấp hơn ngưỡng 4.5:1.`,
    });
  }
  if (contrastMuted < 4.5) {
    issues.push({
      code: 'contrast',
      severity: 'warn',
      message: `Tương phản chữ phụ (${contrastMuted}:1) thấp hơn ngưỡng 4.5:1.`,
    });
  }
  if (contrastAccentBtn < 4.5) {
    issues.push({
      code: 'contrast',
      severity: 'warn',
      message: `Tương phản nút chính (${contrastAccentBtn}:1) thấp hơn ngưỡng 4.5:1.`,
    });
  }

  for (const [pattern, replacement] of SLOP_REPLACEMENTS) {
    if (pattern.test(cleanHtml)) {
      cleanHtml = cleanHtml.replace(pattern, replacement);
      fixesApplied.push(`Thay cụm sáo rỗng bằng "${replacement}"`);
      issues.push({
        code: 'slop',
        severity: 'fix',
        message: 'Đã làm sạch câu chữ quảng cáo rập khuôn.',
      });
    }
  }

  const visibleText = stripScriptAndStyle(cleanHtml);
  const emojis = visibleText.match(EMOJI_RE);
  if (emojis && emojis.length > 0) {
    // WHY: Remove decorative emoji from generated visible text so UI icons stay crisp inline SVG.
    cleanHtml = cleanHtml.replace(EMOJI_RE, '');
    fixesApplied.push(`Đã gỡ ${emojis.length} ký tự emoji thừa khỏi giao diện`);
    issues.push({
      code: 'emoji',
      severity: 'fix',
      message: 'Đã loại bỏ emoji làm icon giao diện.',
    });
  }

  if (!/overflow-x:\s*clip/i.test(cleanHtml)) {
    cleanHtml = cleanHtml.replace(
      /<\/style>/i,
      '\nhtml, body { overflow-x: clip; }\n</style>'
    );
    fixesApplied.push('Bổ sung overflow-x: clip chống tràn ngang');
    issues.push({
      code: 'overflow',
      severity: 'fix',
      message: 'Đã khóa tràn ngang ở màn hình nhỏ.',
    });
  }

  if (!/prefers-reduced-motion/i.test(cleanHtml)) {
    cleanHtml = cleanHtml.replace(
      /<\/style>/i,
      '\n@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation: none !important; transition: none !important; } }\n</style>'
    );
    fixesApplied.push('Bổ sung quy tắc prefers-reduced-motion');
    issues.push({
      code: 'reduced-motion',
      severity: 'fix',
      message: 'Đã thêm chế độ giảm chuyển động.',
    });
  }

  if (!/html,\s*body\s*\{[^}]*background:/i.test(cleanHtml)) {
    issues.push({
      code: 'white-flash',
      severity: 'warn',
      message: 'Thiếu quy tắc màu nền gốc chống chớp trắng.',
    });
  }

  const warnCount = issues.filter((item) => item.severity === 'warn').length;
  const score = Math.max(60, 100 - warnCount * 12);

  return {
    passed: warnCount === 0,
    score,
    contrastBody,
    contrastMuted,
    contrastAccentBtn,
    issues,
    fixesApplied,
    cleanHtml,
  };
}
