import { MOTION_MARQUEE_ITEMS, type MotionMarqueeItem } from './motionShowcaseCatalog';

export type ReelmarkLibraryKind = 'PinUI' | 'Motion AI';

export interface ReelmarkExperienceCard {
  id: string;
  sourceId: string;
  library: ReelmarkLibraryKind;
  title: string;
  category: string;
  summaryVi: string;
  imageUrl: string;
  fallbackUrl: string;
  promptText: string;
  tileIndex: number;
}

export const REELMARK_POSTER_URL =
  'https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/b7ebb74a-8c8a-4f7e-8f80-55e2d74ecd05.webp';

export const REELMARK_VIDEO_URL =
  'https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/04fd3d5f-99d7-476e-98a4-46c08518ffb3.mp4';

const FALLBACK_PREVIEW =
  'https://raw.githubusercontent.com/broamstuck-cybr/SOURCEOFKNOWLEDGFORAI/main/assets/previews/codefronts-course-card.png';

export const PINUI_EXPERIENCE_POOL: Array<Omit<ReelmarkExperienceCard, 'tileIndex'>> = [
  {
    id: 'pinui-presence-cards',
    sourceId: 'presence-cards',
    library: 'PinUI',
    title: 'Presence Cards',
    category: 'Tương tác nhóm',
    summaryVi: 'Thẻ trạng thái thành viên trực tuyến với chuyển động lò xo mượt mà.',
    imageUrl: 'https://www.pinui.xyz/clips/thumb/presence-cards.webp',
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
    imageUrl: 'https://www.pinui.xyz/clips/thumb/theme-switch.webp',
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
    imageUrl: 'https://www.pinui.xyz/clips/thumb/reader-card.webp',
    fallbackUrl: FALLBACK_PREVIEW,
    promptText: 'Thiết kế thẻ đọc tài liệu với mục lục trượt, thanh tiến độ và hiệu ứng kính mờ.',
  },
  {
    id: 'pinui-desk-computer',
    sourceId: 'desk-computer',
    library: 'PinUI',
    title: 'Desk Computer',
    category: 'Mô phỏng phần cứng',
    summaryVi: 'Trạm máy tính cổ điển tương tác bàn phím, màn hình CRT và âm thanh cơ học.',
    imageUrl: 'https://www.pinui.xyz/clips/thumb/desk-computer.webp',
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
    imageUrl: 'https://www.pinui.xyz/clips/thumb/liquid-voice.webp',
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
    imageUrl: 'https://www.pinui.xyz/clips/thumb/file-box.webp',
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
    imageUrl: 'https://www.pinui.xyz/clips/thumb/copy-paste-pad.webp',
    fallbackUrl: FALLBACK_PREVIEW,
    promptText: 'Dựng bàn phím mini Copy Paste 3D với nắp phím phản hồi lực nhấn và đổi màu nền.',
  },
  {
    id: 'pinui-magnify',
    sourceId: 'magnify',
    library: 'PinUI',
    title: 'Magnify Lens',
    category: 'Thị giác & Soi chi tiết',
    summaryVi: 'Thấu kính phóng đại chi tiết giao diện theo vị trí con trỏ chuột.',
    imageUrl: 'https://www.pinui.xyz/clips/thumb/magnify.webp',
    fallbackUrl: FALLBACK_PREVIEW,
    promptText: 'Tạo thấu kính phóng đại trực tiếp vùng giao diện bên dưới con trỏ chuột.',
  },
  {
    id: 'pinui-prompt-composer',
    sourceId: 'prompt-composer',
    library: 'PinUI',
    title: 'Prompt Composer',
    category: 'Khung nhập liệu AI',
    summaryVi: 'Khung soạn thảo đa tác vụ với thẻ gợi ý và bộ chọn mô hình thông minh.',
    imageUrl: 'https://www.pinui.xyz/clips/thumb/prompt-composer.webp',
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
    imageUrl: 'https://www.pinui.xyz/clips/thumb/calendar-card.webp',
    fallbackUrl: FALLBACK_PREVIEW,
    promptText: 'Dựng thẻ lịch tương tác hỗ trợ chọn ngày, xem lịch hẹn và chuyển tháng mượt mà.',
  },
  {
    id: 'pinui-dynamic-drop-zone',
    sourceId: 'dynamic-drop-zone',
    library: 'PinUI',
    title: 'Dynamic Drop Zone',
    category: 'Tải tệp & Kéo thả',
    summaryVi: 'Vùng kéo thả tệp thông minh với hiệu ứng hút từ tính và tiến trình tải.',
    imageUrl: 'https://www.pinui.xyz/clips/thumb/dynamic-drop-zone.webp',
    fallbackUrl: FALLBACK_PREVIEW,
    promptText: 'Tạo vùng kéo thả tệp đa định dạng có hoạt ảnh mở rộng khi kéo tệp vào khung.',
  },
  {
    id: 'pinui-swap-card',
    sourceId: 'swap-card',
    library: 'PinUI',
    title: 'Swap Card',
    category: 'Tài chính & Quy đổi',
    summaryVi: 'Thẻ hoán đổi hai chiều với hiệu ứng xoay trục và tính tỷ giá tức thì.',
    imageUrl: 'https://www.pinui.xyz/clips/thumb/swap-card.webp',
    fallbackUrl: FALLBACK_PREVIEW,
    promptText: 'Thiết kế thẻ chuyển đổi hai chiều với nút đảo chiều xoay 180 độ và bảng chọn nhanh.',
  },
  {
    id: 'pinui-thermal-dial',
    sourceId: 'thermal-dial',
    library: 'PinUI',
    title: 'Thermal Dial',
    category: 'Điều khiển xoay',
    summaryVi: 'Núm xoay nhiệt độ xúc giác với vạch chia phát sáng theo góc quay.',
    imageUrl: 'https://www.pinui.xyz/clips/thumb/thermal-dial.webp',
    fallbackUrl: FALLBACK_PREVIEW,
    promptText: 'Dựng núm xoay điều chỉnh thông số hình tròn có vạch chia sáng dần theo thao tác kéo.',
  },
  {
    id: 'pinui-liquid-tabs',
    sourceId: 'liquid-tabs',
    library: 'PinUI',
    title: 'Liquid Tabs',
    category: 'Điều hướng mượt',
    summaryVi: 'Thanh chuyển tab với giọt chỉ báo đàn hồi theo vận tốc chuyển tab.',
    imageUrl: 'https://www.pinui.xyz/clips/thumb/liquid-tabs.webp',
    fallbackUrl: FALLBACK_PREVIEW,
    promptText: 'Tạo thanh tab điều hướng với viên nang nền co giãn mượt khi đổi giữa các mục.',
  },
  {
    id: 'pinui-orbit-hero',
    sourceId: 'orbit-hero',
    library: 'PinUI',
    title: 'Orbit Hero',
    category: 'Hero & Quỹ đạo',
    summaryVi: 'Khung mở đầu quỹ đạo quả địa cầu 3D tương tác trực tiếp trên trình duyệt.',
    imageUrl: 'https://www.pinui.xyz/blocx/thumbs/orbit-hero.webp',
    fallbackUrl: FALLBACK_PREVIEW,
    promptText: 'Dựng trang mở đầu với quả địa cầu điểm ảnh xoay mượt và cụm nút kêu gọi hành động.',
  },
];

export const MOTION_AI_EXPERIENCE_POOL: Array<Omit<ReelmarkExperienceCard, 'tileIndex'>> =
  MOTION_MARQUEE_ITEMS.slice(0, 18).map((item: MotionMarqueeItem) => ({
    id: item.id,
    sourceId: item.id,
    library: 'Motion AI',
    title: item.title,
    category: item.category,
    summaryVi: item.summaryVi,
    imageUrl: item.imageUrl,
    fallbackUrl: item.fallbackUrl,
    promptText: item.starterPrompt || item.promptText,
  }));

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

export function buildRandomInterleaved25(seed = Date.now()): ReelmarkExperienceCard[] {
  const rng = mulberry32(seed);
  const pinShuffled = shuffleWithRng(PINUI_EXPERIENCE_POOL, rng);
  const motionShuffled = shuffleWithRng(MOTION_AI_EXPERIENCE_POOL, rng);
  const startWithPin = rng() >= 0.5;

  const result: ReelmarkExperienceCard[] = [];
  let pIdx = 0;
  let mIdx = 0;

  for (let i = 0; i < 25; i += 1) {
    const pickPin = startWithPin ? i % 2 === 0 : i % 2 === 1;
    if (pickPin) {
      const item = pinShuffled[pIdx % pinShuffled.length];
      pIdx += 1;
      result.push({ ...item, tileIndex: i % 10 });
    } else {
      const item = motionShuffled[mIdx % motionShuffled.length];
      mIdx += 1;
      result.push({ ...item, tileIndex: i % 10 });
    }
  }
  return result;
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
