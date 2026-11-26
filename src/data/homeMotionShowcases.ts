export interface HomeMotionShowcaseFile {
  path: string;
  language: 'html' | 'css' | 'javascript';
  content: string;
}

export interface HomeMotionConfig {
  easing: string;
  durationMs: number;
  pattern: string;
  reducedFallback: string;
}

export interface HomeMotionShowcaseItem {
  id: string;
  slug: string;
  title: string;
  category: string;
  source: 'motionsites' | 'sourceofknowledge';
  gifUrl: string;
  videoUrl?: string;
  fallbackUrl: string;
  liveUrl: string;
  summaryVi: string;
  motionConfig: HomeMotionConfig;
  files: HomeMotionShowcaseFile[];
}

export const HOME_MOTION_SHOWCASES: HomeMotionShowcaseItem[] = [
  {
    id: 'ms-fernhollow',
    slug: 'fernhollow',
    title: 'Flower Valley',
    category: '3D',
    source: 'motionsites',
    gifUrl:
      'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261103_061637_11907771-15ce-494b-81a4-9051861d6ce5.png&w=1280&q=85',
    videoUrl: 'https://pub-86dc5b5484314368ac5436a674b0d919.r2.dev/aaaf/fernhollow.mp4',
    fallbackUrl:
      'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261103_061637_11907771-15ce-494b-81a4-9051861d6ce5.png&w=1280&q=85',
    liveUrl: 'https://motionsites.ai/sections#fernhollow',
    summaryVi:
      'Mẫu trang gốc từ MotionSites.ai kèm mã HTML đầy đủ, video trailer và đặc tả prompt chạy trực tiếp trong Workspace.',
    motionConfig: {
      easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
      durationMs: 680,
      pattern: 'Live HTML + MP4',
      reducedFallback: 'Giữ khung hình tĩnh ở trạng thái cân bằng',
    },
    files: [],
  },
  {
    id: 'ms-monolith-hero',
    slug: 'monolith-hero',
    title: 'Monolith Hero',
    category: 'Architecture',
    source: 'motionsites',
    gifUrl:
      'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260929_080114_067e2a77-6596-4635-906e-b00a55a20f4a.png&w=1920&q=85',
    videoUrl: 'https://pub-86dc5b5484314368ac5436a674b0d919.r2.dev/aaaf/ibCJ6vtSfiGj1Pto5Xn3ug.mp4',
    fallbackUrl:
      'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260929_080114_067e2a77-6596-4635-906e-b00a55a20f4a.png&w=1920&q=85',
    liveUrl: 'https://motionsites.ai/sections#monolith-hero',
    summaryVi:
      'Mẫu kiến trúc Stratum gốc từ MotionSites.ai với toàn bộ tài liệu HTML độc lập và trailer chuyển động thực tế.',
    motionConfig: {
      easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
      durationMs: 520,
      pattern: 'Live HTML + MP4',
      reducedFallback: 'Tắt chuyển động mở màn khi bật reduced-motion',
    },
    files: [],
  },
  {
    id: 'ms-keylight',
    slug: 'keylight',
    title: 'Keylight',
    category: 'Authentication',
    source: 'motionsites',
    gifUrl:
      'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261020_060411_d45ca6a3-f601-486c-9f38-76c758d007e7.png&w=1280&q=85',
    videoUrl: 'https://pub-86dc5b5484314368ac5436a674b0d919.r2.dev/aaaf/keylight-signin.mp4',
    fallbackUrl:
      'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261020_060411_d45ca6a3-f601-486c-9f38-76c758d007e7.png&w=1280&q=85',
    liveUrl: 'https://motionsites.ai/sections#keylight',
    summaryVi:
      'Mẫu giao diện xác thực Keylight gốc từ MotionSites.ai kèm toàn bộ mã nguồn HTML độc lập chạy thẳng trong sandbox.',
    motionConfig: {
      easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
      durationMs: 420,
      pattern: 'Live HTML + MP4',
      reducedFallback: 'Giữ trạng thái hiển thị tĩnh không hoạt ảnh',
    },
    files: [],
  },
  {
    id: 'ms-driftlab-hero',
    slug: 'driftlab-hero',
    title: 'Jellyfish Scroll',
    category: 'Interactive',
    source: 'motionsites',
    gifUrl:
      'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261102_053925_7184163c-7d4f-4bc9-94ef-a11bfadb6a35.png&w=1280&q=85',
    videoUrl: 'https://pub-86dc5b5484314368ac5436a674b0d919.r2.dev/aaaf/driftlab-hero.mp4',
    fallbackUrl:
      'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261102_053925_7184163c-7d4f-4bc9-94ef-a11bfadb6a35.png&w=1280&q=85',
    liveUrl: 'https://motionsites.ai/sections#driftlab-hero',
    summaryVi:
      'Mẫu tương tác cuộn Driftlab gốc từ MotionSites.ai kèm tài liệu HTML độc lập và trailer MP4.',
    motionConfig: {
      easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
      durationMs: 420,
      pattern: 'Live HTML + MP4',
      reducedFallback: 'Giữ nguyên bố cục tĩnh khi bật reduced-motion',
    },
    files: [],
  },
  {
    id: 'ms-vell-lookbook',
    slug: 'vell-lookbook',
    title: 'Runway Lookbook',
    category: 'Interactive',
    source: 'motionsites',
    gifUrl:
      'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261102_044911_1ad79156-a8dc-475a-8891-8408a9b61320.png&w=1280&q=85',
    videoUrl: 'https://pub-86dc5b5484314368ac5436a674b0d919.r2.dev/aaaf/vell-lookbook.mp4',
    fallbackUrl:
      'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261102_044911_1ad79156-a8dc-475a-8891-8408a9b61320.png&w=1280&q=85',
    liveUrl: 'https://motionsites.ai/sections#vell-lookbook',
    summaryVi:
      'Mẫu bộ sưu tập Vell Lookbook gốc từ MotionSites.ai với toàn văn HTML chạy thử trực tiếp.',
    motionConfig: {
      easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
      durationMs: 420,
      pattern: 'Live HTML + MP4',
      reducedFallback: 'Tắt chuyển cảnh khi bật reduced-motion',
    },
    files: [],
  },
  {
    id: 'ms-lumen-roof-hero',
    slug: 'lumen-roof-hero',
    title: 'Solar Fog',
    category: 'Interactive',
    source: 'motionsites',
    gifUrl:
      'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261102_041507_8e9c2d22-8be2-4652-8bbe-1f4556ea463a.png&w=1280&q=85',
    videoUrl: 'https://pub-86dc5b5484314368ac5436a674b0d919.r2.dev/aaaf/lumen-roof-hero.mp4',
    fallbackUrl:
      'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261102_041507_8e9c2d22-8be2-4652-8bbe-1f4556ea463a.png&w=1280&q=85',
    liveUrl: 'https://motionsites.ai/sections#lumen-roof-hero',
    summaryVi:
      'Mẫu Solar Fog gốc từ MotionSites.ai kèm toàn bộ HTML độc lập và trailer chuyển động.',
    motionConfig: {
      easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
      durationMs: 420,
      pattern: 'Live HTML + MP4',
      reducedFallback: 'Giữ nền tĩnh khi bật reduced-motion',
    },
    files: [],
  },
  {
    id: 'ms-solace-faq',
    slug: 'solace-faq',
    title: 'Halftone FAQ',
    category: 'SaaS',
    source: 'motionsites',
    gifUrl:
      'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261103_075712_12a2721b-8989-4660-9a34-bf0707db7779.png&w=1280&q=85',
    videoUrl: 'https://pub-86dc5b5484314368ac5436a674b0d919.r2.dev/aaaf/solace-faq.mp4',
    fallbackUrl:
      'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261103_075712_12a2721b-8989-4660-9a34-bf0707db7779.png&w=1280&q=85',
    liveUrl: 'https://motionsites.ai/sections#solace-faq',
    summaryVi:
      'Mẫu Solace Halftone FAQ gốc từ MotionSites.ai với toàn bộ tài liệu HTML độc lập.',
    motionConfig: {
      easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
      durationMs: 380,
      pattern: 'Live HTML + MP4',
      reducedFallback: 'Mở đóng tức thì không trễ chuyển động',
    },
    files: [],
  },
];
