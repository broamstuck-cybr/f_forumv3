export type ModerationReason = 'profanity' | 'spam' | 'repetition' | 'link-flood' | 'caps';

export interface ModerationResult {
  ok: boolean;
  reasons: ModerationReason[];
  message: string;
}

export interface ModerationLogEntry {
  at: string;
  surface: 'post' | 'comment' | 'chat';
  reasons: ModerationReason[];
  excerpt: string;
}

const LOG_KEY = 'fforum_v3_moderation_log_v1';
const MAX_LOG = 50;

const PROFANITY = [
  'dm', 'đm', 'dmm', 'đmm', 'vcl', 'vkl', 'cc', 'cl', 'cặc', 'lồn', 'đụ', 'địt', 'dit me', 'đéo',
  'đồ ngu', 'thằng ngu', 'con chó', 'óc chó', 'fuck', 'shit', 'bitch', 'asshole', 'bastard', 'idiot', 'stupid',
];
const SPAM_PHRASES = [
  'kiếm tiền online', 'việc nhẹ lương cao', 'cá độ', 'nhà cái', 'casino', 'bet88', 'vay tiền nhanh',
  'click vào link', 'inbox để nhận', 'free money', 'buy followers', 'mua follow', 'crypto giveaway',
  'telegram:', 'zalo:', 'earn money fast',
];

const REASON_TEXT: Record<ModerationReason, string> = {
  profanity: 'ngôn từ thô tục hoặc xúc phạm',
  spam: 'nội dung quảng cáo / spam',
  repetition: 'lặp ký tự hoặc từ quá nhiều',
  'link-flood': 'chèn quá nhiều liên kết',
  caps: 'viết hoa toàn bộ quá dài',
};

function normalize(text: string): string {
  return text.toLowerCase().normalize('NFC');
}

function hasWord(haystack: string, word: string): boolean {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^\\p{L}\\p{N}])${escaped}($|[^\\p{L}\\p{N}])`, 'u').test(haystack);
}

export function moderateText(raw: string): ModerationResult {
  const text = normalize(raw);
  const reasons: ModerationReason[] = [];

  if (PROFANITY.some((w) => hasWord(text, w))) reasons.push('profanity');
  if (SPAM_PHRASES.some((p) => text.includes(p))) reasons.push('spam');

  const links = text.match(/https?:\/\/|www\./g) ?? [];
  if (links.length > 2) reasons.push('link-flood');

  const words = text.split(/\s+/).filter(Boolean);
  const counts = new Map<string, number>();
  for (const w of words) counts.set(w, (counts.get(w) ?? 0) + 1);
  const maxRepeat = Math.max(0, ...counts.values());
  if (/(.)\1{7,}/u.test(text) || (words.length >= 6 && maxRepeat >= 5 && maxRepeat / words.length > 0.4)) {
    reasons.push('repetition');
  }

  const letters = raw.replace(/[^\p{L}]/gu, '');
  if (letters.length >= 24 && letters === letters.toUpperCase() && letters !== letters.toLowerCase()) {
    reasons.push('caps');
  }

  if (reasons.length === 0) return { ok: true, reasons, message: '' };
  return {
    ok: false,
    reasons,
    message: `Bộ lọc AI chặn nội dung: ${reasons.map((r) => REASON_TEXT[r]).join(', ')}. Vui lòng chỉnh sửa trước khi gửi.`,
  };
}

export function moderateFields(fields: string[], surface: ModerationLogEntry['surface']): ModerationResult {
  const result = moderateText(fields.join('\n'));
  if (!result.ok) logViolation(surface, result.reasons, fields.join(' '));
  return result;
}

export function readModerationLog(): ModerationLogEntry[] {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(LOG_KEY) || '[]');
    return Array.isArray(parsed) ? (parsed as ModerationLogEntry[]) : [];
  } catch {
    return [];
  }
}

function logViolation(surface: ModerationLogEntry['surface'], reasons: ModerationReason[], text: string): void {
  try {
    const entry: ModerationLogEntry = {
      at: new Date().toISOString(),
      surface,
      reasons,
      excerpt: text.slice(0, 60),
    };
    window.localStorage.setItem(LOG_KEY, JSON.stringify([entry, ...readModerationLog()].slice(0, MAX_LOG)));
  } catch {
    return;
  }
}
