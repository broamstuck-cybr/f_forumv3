import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  ClubHandoverDossier,
  CommunityAnswer,
  CommunityChannel,
  CommunityPost,
  CommunityShowcaseSnippet,
} from '../../types/index';
import { useAppStore } from '../../store/appStore';
import {
  Chips,
  LiquidTabs,
  PresenceCards,
  ReaderCard,
  SearchCard,
  type ChipItem,
  type LiquidTabItem,
  type PresenceMember,
} from '../../components/pinui';
import { SandboxPreview } from '../explore/SandboxPreview';
import type { PreviewTheme, PreviewViewport } from '../explore/catalog';
import { copyText } from '../explore/catalog';
import { Modal } from '../workspace/Modal';
import './community.css';

type FeedTabId = 'all' | 'trending' | 'demos' | 'saved';
type SortMode = 'newest' | 'top' | 'discussed';
type CodeDisplayMode = 'collapsed' | 'live' | 'code';

const LOCAL_POSTS_STORAGE_KEY = 'fforum_v3_community_posts_v7';
const LOCAL_REPLIES_STORAGE_KEY = 'fforum_v3_community_replies_v7';
const LOCAL_ACCEPTED_STORAGE_KEY = 'fforum_v3_community_accepted_v7';
const LOCAL_RECENT_SEARCHES_KEY = 'fforum_v3_community_recent_searches_v7';

const DEFAULT_RECENT_SEARCHES = [
  'virtualization',
  'css-tokens',
  'glassmorphism',
  'agent-rules',
  'bento',
];

const TOPIC_CHIPS: ChipItem[] = [
  { id: 'all', label: 'Tất cả chủ đề' },
  { id: 'react', label: 'React & UI' },
  { id: 'css-tokens', label: 'CSS Tokens' },
  { id: 'motion', label: 'Motion & Glass' },
  { id: 'performance', label: 'Hiệu năng' },
  { id: 'agent-rules', label: 'Agent Rules' },
  { id: 'clubs', label: 'Hội nhóm' },
];

const QUICK_COMPOSE_TAGS = [
  'react',
  'css-tokens',
  'glassmorphism',
  'performance',
  'agent-rules',
  'bento',
];

const SAMPLE_SNIPPET: CommunityShowcaseSnippet = {
  html: '<div class="builder-demo-card">\n  <div class="builder-demo-head">\n    <span class="builder-badge">Sandbox Live</span>\n    <span id="demo-counter" class="builder-counter">0 lượt chạy</span>\n  </div>\n  <h3 class="builder-title">Khối kiểm định tương tác thời gian thực</h3>\n  <p class="builder-desc">Nhấn nút bên dưới để kiểm tra phản hồi sự kiện JS trong khung cô lập.</p>\n  <button type="button" id="demo-trigger" class="builder-btn">Kích hoạt xung kiểm thử</button>\n</div>',
  css: '.builder-demo-card { width: min(420px, 100%); padding: 20px; border-radius: 12px; border: 1px solid rgba(239, 233, 221, 0.22); background: #1a1917; color: #efe9dd; display: grid; gap: 12px; }\n.builder-demo-head { display: flex; justify-content: space-between; align-items: center; gap: 8px; }\n.builder-badge { font-family: monospace; font-size: 11px; padding: 3px 8px; border-radius: 999px; background: rgba(255, 100, 80, 0.16); color: #ff6450; }\n.builder-counter { font-family: monospace; font-size: 12px; color: #7fd69b; }\n.builder-title { font-size: 17px; font-weight: 600; line-height: 1.3; }\n.builder-desc { font-size: 13px; line-height: 1.5; color: #b5afa3; }\n.builder-btn { padding: 10px 16px; border-radius: 8px; border: 1px solid #ff6450; background: #d63a27; color: #fffaf5; font-weight: 600; cursor: pointer; }',
  js: '(function(){\n  var btn = document.getElementById("demo-trigger");\n  var out = document.getElementById("demo-counter");\n  var count = 0;\n  if (btn && out) {\n    btn.addEventListener("click", function() {\n      count += 1;\n      out.textContent = count + " lượt chạy";\n    });\n  }\n})();',
};

const ENRICHED_DEMOS: Record<string, CommunityShowcaseSnippet> = {
  'sc-01': {
    html: '<div class="lg-stage">\n  <button type="button" id="lg-btn" class="ux-liquid-btn">\n    <span class="ux-btn-label">Xác nhận giao dịch</span>\n  </button>\n  <p id="lg-status" class="lg-readout">Trạng thái: Sẵn sàng kích hoạt</p>\n</div>',
    css: '.lg-stage { display: grid; place-items: center; gap: 14px; padding: 24px; }\n.ux-liquid-btn { position: relative; padding: 12px 24px; border-radius: 999px; background: rgba(255, 100, 80, 0.16); border: 1px solid rgba(255, 100, 80, 0.45); color: #efe9dd; font-size: 14px; font-weight: 600; cursor: pointer; transition: transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1), background-color 0.2s ease; }\n.ux-liquid-btn:hover { transform: translateY(-2px); background: rgba(255, 100, 80, 0.28); }\n.lg-readout { font-family: monospace; font-size: 12px; color: #7fd69b; }',
    js: '(function(){\n  var btn = document.getElementById("lg-btn");\n  var status = document.getElementById("lg-status");\n  var step = 0;\n  if (btn && status) {\n    btn.addEventListener("click", function() {\n      step += 1;\n      status.textContent = "Đã xác nhận lệnh #" + step + " (Spring 220ms)";\n    });\n  }\n})();',
  },
  'sc-02': {
    html: '<div class="ff-spotlight-card">\n  <div class="ff-card-header">\n    <span class="ff-badge">Realtime Telemetry</span>\n    <button type="button" id="bento-ping" class="ff-ping-btn">Lấy mẫu CPU</button>\n  </div>\n  <h4 class="ff-card-title">Hiệu năng hệ thống Bento</h4>\n  <p id="bento-metric" class="ff-card-body">Tài nguyên CPU giữ mức ổn định 11.4% · Khung hình 60 FPS.</p>\n</div>',
    css: '.ff-spotlight-card { width: min(420px, 100%); padding: 22px; border-radius: 14px; background: #1a1917; border: 1px solid rgba(239, 233, 221, 0.18); color: #efe9dd; display: grid; gap: 10px; }\n.ff-card-header { display: flex; align-items: center; justify-content: space-between; gap: 8px; }\n.ff-badge { font-family: monospace; font-size: 11px; padding: 3px 9px; border-radius: 999px; background: rgba(127, 214, 155, 0.15); color: #7fd69b; }\n.ff-ping-btn { padding: 5px 10px; border-radius: 6px; border: 1px solid rgba(239, 233, 221, 0.25); background: #121110; color: #efe9dd; font-size: 11px; cursor: pointer; }\n.ff-card-title { font-size: 17px; font-weight: 600; }\n.ff-card-body { font-size: 13px; color: #b5afa3; line-height: 1.5; }',
    js: '(function(){\n  var btn = document.getElementById("bento-ping");\n  var metric = document.getElementById("bento-metric");\n  var samples = ["9.8% · 60 FPS", "10.6% · 60 FPS", "11.2% · 60 FPS", "8.9% · 60 FPS"];\n  var idx = 0;\n  if (btn && metric) {\n    btn.addEventListener("click", function() {\n      idx = (idx + 1) % samples.length;\n      metric.textContent = "Tài nguyên CPU giữ mức ổn định " + samples[idx];\n    });\n  }\n})();',
  },
  'qa-02': {
    html: '<div class="token-bridge-demo">\n  <div class="token-row">\n    <span class="token-name">--ux-surface-1</span>\n    <span id="token-val" class="token-chip">#1a1917 (Obsidian)</span>\n  </div>\n  <button type="button" id="token-swap" class="token-btn">Đổi cầu nối Token Sáng / Tối</button>\n</div>',
    css: '.token-bridge-demo { width: min(400px, 100%); padding: 20px; border-radius: 10px; border: 1px solid rgba(239, 233, 221, 0.22); background: var(--demo-surface, #1a1917); color: var(--demo-ink, #efe9dd); display: grid; gap: 12px; transition: background-color 0.2s ease, color 0.2s ease; }\n.token-row { display: flex; justify-content: space-between; align-items: center; font-family: monospace; font-size: 12px; }\n.token-chip { padding: 3px 8px; border-radius: 4px; background: rgba(255, 100, 80, 0.16); color: #ff6450; }\n.token-btn { padding: 9px 14px; border-radius: 6px; border: 1px solid currentColor; background: transparent; color: inherit; font-size: 12px; font-weight: 600; cursor: pointer; }',
    js: '(function(){\n  var box = document.querySelector(".token-bridge-demo");\n  var btn = document.getElementById("token-swap");\n  var val = document.getElementById("token-val");\n  var paper = false;\n  if (box && btn && val) {\n    btn.addEventListener("click", function() {\n      paper = !paper;\n      box.style.setProperty("--demo-surface", paper ? "#fbf8f1" : "#1a1917");\n      box.style.setProperty("--demo-ink", paper ? "#17150f" : "#efe9dd");\n      val.textContent = paper ? "#fbf8f1 (Editorial Stone)" : "#1a1917 (Obsidian)";\n    });\n  }\n})();',
  },
};

const RE_PIN = new RegExp('pin\\s*ui', 'gi');
const RE_THREE = new RegExp('three\\s*ui', 'gi');
const RE_MOTION = new RegExp('motion\\s*sites', 'gi');
const RE_LUCIAN = new RegExp('lucian\\s*labs', 'gi');
const RE_CODEFRONTS = new RegExp('code\\s*fronts', 'gi');

function whiteLabelText(raw: string): string {
  if (!raw) return '';
  return raw
    .replace(RE_PIN, 'Tương tác')
    .replace(RE_THREE, 'Không gian 3D')
    .replace(RE_MOTION, 'Chuyển động')
    .replace(RE_LUCIAN, 'Hiệu ứng')
    .replace(RE_CODEFRONTS, 'Bố cục');
}

function authorInitials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('') || 'F'
  );
}

function formatPostDate(iso: string): string {
  const parsed = Date.parse(iso);
  if (Number.isNaN(parsed)) return iso.slice(0, 10);
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(parsed));
}

function basePostVotes(post: CommunityPost): number {
  return post.votes ?? post.likes ?? 0;
}

function compileHtmlWithJs(snippet: CommunityShowcaseSnippet): string {
  const html = snippet.html || '';
  const js = snippet.js?.trim();
  if (!js) return html;
  return `${html}\n<script>${js}</script>`;
}

function buildClipboardSnippet(post: CommunityPost): string {
  if (post.demoSnippet) {
    const parts = [post.demoSnippet.html.trim()];
    if (post.demoSnippet.css.trim()) {
      parts.push(`<style>\n${post.demoSnippet.css.trim()}\n</style>`);
    }
    if (post.demoSnippet.js?.trim()) {
      parts.push(`<script>\n${post.demoSnippet.js.trim()}\n</script>`);
    }
    return parts.join('\n\n');
  }
  return post.payload || post.body || post.description || post.title;
}

function loadJsonFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

interface ContributorStat {
  handle: string;
  name: string;
  role: string;
  postsCount: number;
  acceptedCount: number;
  repliesCount: number;
  votesTotal: number;
  score: number;
}

export const CommunityView: React.FC = () => {
  const {
    communityPosts,
    currentUser,
    savedItemIds,
    toggleSavedItem,
    isItemLiked,
    toggleLikedItem,
    activeProject,
    createPost,
    upvotePost,
    answerPost,
    acceptAnswer,
    forkPostToWorkspace,
    updateDossier,
    reportPost,
    addToast,
    theme,
    reducedMotion,
  } = useAppStore();

  const postRefs = useRef<Record<string, HTMLLIElement | null>>({});

  const [feedTab, setFeedTab] = useState<FeedTabId>('all');
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [authorFilter, setAuthorFilter] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>(() =>
    loadJsonFromStorage<string[]>(LOCAL_RECENT_SEARCHES_KEY, DEFAULT_RECENT_SEARCHES)
  );

  const [localPosts, setLocalPosts] = useState<CommunityPost[]>(() =>
    loadJsonFromStorage<CommunityPost[]>(LOCAL_POSTS_STORAGE_KEY, [])
  );
  const [localReplies, setLocalReplies] = useState<Record<string, CommunityAnswer[]>>(() =>
    loadJsonFromStorage<Record<string, CommunityAnswer[]>>(LOCAL_REPLIES_STORAGE_KEY, {})
  );
  const [localAcceptedMap, setLocalAcceptedMap] = useState<Record<string, string>>(() =>
    loadJsonFromStorage<Record<string, string>>(LOCAL_ACCEPTED_STORAGE_KEY, {})
  );

  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [openCommentDrawers, setOpenCommentDrawers] = useState<Record<string, boolean>>({
    'qa-01': true,
  });
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [submittingReplyId, setSubmittingReplyId] = useState<string | null>(null);

  const [codeModes, setCodeModes] = useState<Record<string, CodeDisplayMode>>({
    'sc-01': 'live',
  });
  const [sandboxViewports, setSandboxViewports] = useState<Record<string, PreviewViewport>>({});
  const [sandboxThemes, setSandboxThemes] = useState<Record<string, PreviewTheme>>({});
  const [sandboxNonces, setSandboxNonces] = useState<Record<string, number>>({});

  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [copiedShareId, setCopiedShareId] = useState<string | null>(null);

  const [composeChannel, setComposeChannel] = useState<CommunityChannel>('showcase');
  const [composeTitle, setComposeTitle] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [composeCategory, setComposeCategory] = useState('React / Frontend');
  const [composeTagsInput, setComposeTagsInput] = useState('react, css-tokens');
  const [composeIncludeCode, setComposeIncludeCode] = useState(false);
  const [composeHtml, setComposeHtml] = useState('');
  const [composeCss, setComposeCss] = useState('');
  const [composeJs, setComposeJs] = useState('');
  const [composePreviewLive, setComposePreviewLive] = useState(false);
  const [submittingPost, setSubmittingPost] = useState(false);

  const [reportTarget, setReportTarget] = useState<CommunityPost | null>(null);
  const [reportReason, setReportReason] = useState('Thông tin sai lệch kỹ thuật hoặc spam');
  const [submittingReport, setSubmittingReport] = useState(false);

  const [dossierClub, setDossierClub] = useState<CommunityPost | null>(null);
  const [dossierDraft, setDossierDraft] = useState<ClubHandoverDossier>({
    projectTitle: '',
    handoverNotes: '',
    nextMilestones: [],
    architectureSummary: '',
    ownerHandle: '',
  });
  const [milestonesText, setMilestonesText] = useState('');
  const [savingDossier, setSavingDossier] = useState(false);

  useEffect(() => {
    try {
      window.localStorage.setItem(LOCAL_POSTS_STORAGE_KEY, JSON.stringify(localPosts));
    } catch {
      return;
    }
  }, [localPosts]);

  useEffect(() => {
    try {
      window.localStorage.setItem(LOCAL_REPLIES_STORAGE_KEY, JSON.stringify(localReplies));
    } catch {
      return;
    }
  }, [localReplies]);

  useEffect(() => {
    try {
      window.localStorage.setItem(LOCAL_ACCEPTED_STORAGE_KEY, JSON.stringify(localAcceptedMap));
    } catch {
      return;
    }
  }, [localAcceptedMap]);

  useEffect(() => {
    try {
      window.localStorage.setItem(LOCAL_RECENT_SEARCHES_KEY, JSON.stringify(recentSearches));
    } catch {
      return;
    }
  }, [recentSearches]);

  const allPosts = useMemo<CommunityPost[]>(() => {
    const map = new Map<string, CommunityPost>();
    for (const lp of localPosts) {
      if (!lp.hidden) {
        map.set(lp.id, lp);
      }
    }
    for (const sp of communityPosts) {
      if (sp.hidden) continue;
      if (!map.has(sp.id)) {
        const enrichedDemo = sp.demoSnippet
          ? {
              ...sp.demoSnippet,
              ...(ENRICHED_DEMOS[sp.id] ? { js: ENRICHED_DEMOS[sp.id].js, html: ENRICHED_DEMOS[sp.id].html, css: ENRICHED_DEMOS[sp.id].css } : {}),
            }
          : ENRICHED_DEMOS[sp.id];
        map.set(sp.id, {
          ...sp,
          demoSnippet: enrichedDemo,
        });
      }
    }
    return Array.from(map.values());
  }, [communityPosts, localPosts]);

  const getPostAnswers = useCallback(
    (post: CommunityPost): CommunityAnswer[] => {
      const list: CommunityAnswer[] = [];
      const acceptedOverrideId = localAcceptedMap[post.id];
      if (post.acceptedAnswer) {
        list.push({
          ...post.acceptedAnswer,
          isAccepted: acceptedOverrideId
            ? post.acceptedAnswer.id === acceptedOverrideId
            : true,
        });
      }
      if (Array.isArray(post.answers)) {
        for (const ans of post.answers) {
          if (!list.some((existing) => existing.id === ans.id)) {
            list.push({
              ...ans,
              isAccepted: acceptedOverrideId ? ans.id === acceptedOverrideId : ans.isAccepted,
            });
          }
        }
      }
      const extras = localReplies[post.id] || [];
      for (const extra of extras) {
        if (!list.some((existing) => existing.id === extra.id)) {
          list.push({
            ...extra,
            isAccepted: acceptedOverrideId ? extra.id === acceptedOverrideId : extra.isAccepted,
          });
        }
      }
      return list;
    },
    [localReplies, localAcceptedMap]
  );

  const getPostScore = useCallback(
    (post: CommunityPost): number => {
      return basePostVotes(post) + (isItemLiked(post.id) ? 1 : 0);
    },
    [isItemLiked]
  );

  const demoPosts = useMemo(
    () => allPosts.filter((p) => Boolean(p.demoSnippet)),
    [allPosts]
  );

  const savedCommunityPosts = useMemo(
    () => allPosts.filter((p) => savedItemIds.includes(p.id)),
    [allPosts, savedItemIds]
  );

  const totalCommentsCount = useMemo(
    () => allPosts.reduce((acc, post) => acc + getPostAnswers(post).length, 0),
    [allPosts, getPostAnswers]
  );

  const feedTabItems = useMemo<LiquidTabItem[]>(
    () => [
      { id: 'all', label: 'Tất cả', count: allPosts.length },
      { id: 'trending', label: 'Thịnh hành', count: allPosts.length },
      { id: 'demos', label: 'Mã chạy thử', count: demoPosts.length },
      { id: 'saved', label: 'Đã lưu', count: savedCommunityPosts.length },
    ],
    [allPosts.length, demoPosts.length, savedCommunityPosts.length]
  );

  const topContributors = useMemo<ContributorStat[]>(() => {
    const map = new Map<string, ContributorStat>();

    const ensureEntry = (author: CommunityPost['author']): ContributorStat => {
      const key = author.handle || author.id || author.name;
      const existing = map.get(key);
      if (existing) return existing;
      const created: ContributorStat = {
        handle: author.handle,
        name: author.name,
        role: author.role,
        postsCount: 0,
        acceptedCount: 0,
        repliesCount: 0,
        votesTotal: 0,
        score: 0,
      };
      map.set(key, created);
      return created;
    };

    for (const post of allPosts) {
      const postEntry = ensureEntry(post.author);
      postEntry.postsCount += 1;
      postEntry.votesTotal += getPostScore(post);

      for (const ans of getPostAnswers(post)) {
        const ansEntry = ensureEntry(ans.author);
        ansEntry.repliesCount += 1;
        ansEntry.votesTotal += ans.votes || 0;
        if (ans.isAccepted) {
          ansEntry.acceptedCount += 1;
        }
      }
    }

    return Array.from(map.values())
      .map((entry) => ({
        ...entry,
        score:
          entry.acceptedCount * 5 +
          entry.postsCount * 3 +
          entry.repliesCount * 2 +
          entry.votesTotal,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }, [allPosts, getPostAnswers, getPostScore]);

  const presenceMembers = useMemo<PresenceMember[]>(
    () =>
      topContributors.slice(0, 4).map((c) => ({
        name: c.name,
        role: `@${c.handle}`,
        status: `${c.postsCount} bài`,
      })),
    [topContributors]
  );

  const matchesTopicFilter = useCallback((post: CommunityPost, topic: string): boolean => {
    if (topic === 'all') return true;
    const haystack = [
      post.category,
      post.channel,
      ...post.tags,
      post.title,
      post.body || '',
      post.description || '',
    ]
      .join(' ')
      .toLowerCase();

    if (topic === 'react') {
      return haystack.includes('react') || haystack.includes('frontend') || haystack.includes('component');
    }
    if (topic === 'css-tokens') {
      return haystack.includes('token') || haystack.includes('css') || haystack.includes('tailwind') || haystack.includes('design');
    }
    if (topic === 'motion') {
      return haystack.includes('motion') || haystack.includes('glass') || haystack.includes('3d') || haystack.includes('spotlight');
    }
    if (topic === 'performance') {
      return haystack.includes('performance') || haystack.includes('virtual') || haystack.includes('fps') || haystack.includes('cpu');
    }
    if (topic === 'agent-rules') {
      return haystack.includes('agent') || haystack.includes('rule') || haystack.includes('prompt') || haystack.includes('clean');
    }
    if (topic === 'clubs') {
      return post.channel === 'clubs' || haystack.includes('club') || haystack.includes('dossier');
    }
    return haystack.includes(topic.toLowerCase());
  }, []);

  const visiblePosts = useMemo<CommunityPost[]>(() => {
    let pool = allPosts;

    if (feedTab === 'demos') {
      pool = pool.filter((p) => Boolean(p.demoSnippet));
    } else if (feedTab === 'saved') {
      pool = pool.filter((p) => savedItemIds.includes(p.id));
    }

    if (selectedTopic !== 'all') {
      pool = pool.filter((p) => matchesTopicFilter(p, selectedTopic));
    }

    if (authorFilter) {
      pool = pool.filter(
        (p) => p.author.handle.toLowerCase() === authorFilter.toLowerCase()
      );
    }

    const q = searchQuery.trim().toLowerCase();
    if (q) {
      pool = pool.filter(
        (post) =>
          whiteLabelText(post.title).toLowerCase().includes(q) ||
          whiteLabelText(post.body || '').toLowerCase().includes(q) ||
          whiteLabelText(post.description || '').toLowerCase().includes(q) ||
          whiteLabelText(post.payload || '').toLowerCase().includes(q) ||
          whiteLabelText(post.category).toLowerCase().includes(q) ||
          post.author.name.toLowerCase().includes(q) ||
          post.author.handle.toLowerCase().includes(q) ||
          post.tags.some((t) => whiteLabelText(t).toLowerCase().includes(q))
      );
    }

    return [...pool].sort((a, b) => {
      if (feedTab === 'trending' || sortMode === 'top') {
        const scoreA = getPostScore(a) * 2 + getPostAnswers(a).length * 3;
        const scoreB = getPostScore(b) * 2 + getPostAnswers(b).length * 3;
        if (scoreB !== scoreA) return scoreB - scoreA;
      }
      if (sortMode === 'discussed') {
        const diff = getPostAnswers(b).length - getPostAnswers(a).length;
        if (diff !== 0) return diff;
      }
      return Date.parse(b.createdAt) - Date.parse(a.createdAt);
    });
  }, [
    allPosts,
    feedTab,
    savedItemIds,
    selectedTopic,
    matchesTopicFilter,
    authorFilter,
    searchQuery,
    sortMode,
    getPostScore,
    getPostAnswers,
  ]);

  const activeReaderPost = useMemo<CommunityPost | null>(
    () =>
      allPosts.find((p) => p.id === selectedPostId) ||
      visiblePosts[0] ||
      allPosts[0] ||
      null,
    [allPosts, selectedPostId, visiblePosts]
  );

  const activeDiscussionThreads = useMemo<CommunityPost[]>(() => {
    return [...allPosts]
      .sort((a, b) => {
        const repliesDiff = getPostAnswers(b).length - getPostAnswers(a).length;
        if (repliesDiff !== 0) return repliesDiff;
        return getPostScore(b) - getPostScore(a);
      })
      .slice(0, 4);
  }, [allPosts, getPostAnswers, getPostScore]);

  const readerParagraphs = useMemo<string[]>(() => {
    if (!activeReaderPost) return [];
    const blocks: string[] = [];
    const mainBody = whiteLabelText(
      activeReaderPost.body || activeReaderPost.description || activeReaderPost.title
    );
    if (mainBody) blocks.push(mainBody);
    if (activeReaderPost.payload) {
      blocks.push(whiteLabelText(activeReaderPost.payload));
    }
    if (activeReaderPost.activeDossier) {
      blocks.push(
        `Hồ sơ bàn giao: ${activeReaderPost.activeDossier.projectTitle}. ${activeReaderPost.activeDossier.handoverNotes}`
      );
    }
    const answers = getPostAnswers(activeReaderPost);
    for (const ans of answers.slice(0, 3)) {
      blocks.push(
        `Phản hồi từ ${ans.author.name} (@${ans.author.handle}): ${whiteLabelText(ans.content)}`
      );
    }
    blocks.push(
      `Chuyên mục ${whiteLabelText(activeReaderPost.category)} · Tác giả ${activeReaderPost.author.name} (@${activeReaderPost.author.handle}).`
    );
    return blocks;
  }, [activeReaderPost, getPostAnswers]);

  const focusAndScrollToPost = useCallback(
    (postId: string, openComments = false) => {
      setSelectedPostId(postId);
      if (openComments) {
        setOpenCommentDrawers((prev) => ({ ...prev, [postId]: true }));
      }
      window.requestAnimationFrame(() => {
        const el = postRefs.current[postId];
        if (el) {
          el.scrollIntoView({
            behavior: reducedMotion ? 'auto' : 'smooth',
            block: 'nearest',
          });
        }
      });
    },
    [reducedMotion]
  );

  useEffect(() => {
    try {
      const pending = window.sessionStorage.getItem('ff_community_post_id');
      if (pending) {
        setSelectedPostId(pending);
        setOpenCommentDrawers((prev) => ({ ...prev, [pending]: true }));
        window.sessionStorage.removeItem('ff_community_post_id');
      }
      const params = new URLSearchParams(window.location.search);
      const fromUrl = params.get('post');
      if (fromUrl) {
        setSelectedPostId(fromUrl);
        setOpenCommentDrawers((prev) => ({ ...prev, [fromUrl]: true }));
      }
    } catch {
      void 0;
    }
    const onPostEvent = (event: Event) => {
      const detail = (event as CustomEvent<string>).detail;
      if (typeof detail === 'string') {
        setSelectedPostId(detail);
        setOpenCommentDrawers((prev) => ({ ...prev, [detail]: true }));
      }
    };
    window.addEventListener('ff:community-post', onPostEvent);
    return () => window.removeEventListener('ff:community-post', onPostEvent);
  }, []);

  const recordRecentSearch = useCallback((term: string) => {
    const clean = term.trim();
    if (!clean || clean.length < 2) return;
    setRecentSearches((prev) => [clean, ...prev.filter((x) => x !== clean)].slice(0, 6));
  }, []);

  const handleToggleTopic = useCallback((topicId: string) => {
    setSelectedTopic((prev) => (prev === topicId ? 'all' : topicId));
  }, []);

  const handleToggleVote = useCallback(
    (post: CommunityPost) => {
      toggleLikedItem(post.id);
      void upvotePost(post.id).catch(() => undefined);
    },
    [toggleLikedItem, upvotePost]
  );

  const handleCopyCode = useCallback(
    async (post: CommunityPost) => {
      const text = buildClipboardSnippet(post);
      const ok = await copyText(text);
      if (ok) {
        setCopiedCodeId(post.id);
        window.setTimeout(() => {
          setCopiedCodeId((prev) => (prev === post.id ? null : prev));
        }, 2000);
        addToast({
          type: 'success',
          title: 'Đã chép mã nguồn',
          message: whiteLabelText(post.title),
        });
      }
    },
    [addToast]
  );

  const handleSharePost = useCallback(
    async (post: CommunityPost) => {
      const shareUrl =
        typeof window !== 'undefined'
          ? `${window.location.origin}/community?post=${encodeURIComponent(post.id)}`
          : `/community?post=${encodeURIComponent(post.id)}`;
      const ok = await copyText(shareUrl);
      setCopiedShareId(post.id);
      window.setTimeout(() => {
        setCopiedShareId((prev) => (prev === post.id ? null : prev));
      }, 2000);
      addToast({
        type: ok ? 'success' : 'info',
        title: 'Đã chép liên kết chia sẻ',
        message: whiteLabelText(post.title),
      });
    },
    [addToast]
  );

  const handlePrefillFromWorkspace = useCallback(() => {
    const htmlFile = activeProject.files.find((f) => f.path.endsWith('.html'));
    const cssFile = activeProject.files.find((f) => f.path.endsWith('.css'));
    const jsFile = activeProject.files.find((f) => f.path.endsWith('.js'));
    if (!composeTitle.trim()) setComposeTitle(activeProject.name);
    if (!composeBody.trim()) setComposeBody(activeProject.description);
    setComposeIncludeCode(true);
    setComposeHtml(htmlFile?.content || SAMPLE_SNIPPET.html);
    setComposeCss(cssFile?.content || SAMPLE_SNIPPET.css);
    setComposeJs(jsFile?.content || '');
    setComposePreviewLive(true);
    addToast({
      type: 'info',
      title: 'Đã nạp mã từ Workspace',
      message: activeProject.name,
    });
  }, [activeProject, composeTitle, composeBody, addToast]);

  const handleLoadSampleSnippet = useCallback(() => {
    setComposeIncludeCode(true);
    setComposeHtml(SAMPLE_SNIPPET.html);
    setComposeCss(SAMPLE_SNIPPET.css);
    setComposeJs(SAMPLE_SNIPPET.js || '');
    setComposePreviewLive(true);
  }, []);

  const handleToggleQuickComposeTag = useCallback((tag: string) => {
    setComposeTagsInput((prev) => {
      const current = prev
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      const exists = current.includes(tag);
      const next = exists ? current.filter((t) => t !== tag) : [...current, tag];
      return next.join(', ');
    });
  }, []);

  const handleCreatePost = async (event: React.FormEvent) => {
    event.preventDefault();
    const titleTrimmed = composeTitle.trim();
    if (!titleTrimmed) return;

    setSubmittingPost(true);
    const parsedTags = composeTagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const hasCode =
      composeIncludeCode &&
      Boolean(composeHtml.trim() || composeCss.trim() || composeJs.trim());

    const demoSnippet: CommunityShowcaseSnippet | undefined = hasCode
      ? {
          html:
            composeHtml.trim() ||
            `<div class="demo-box"><h3>${titleTrimmed}</h3><p>${composeBody.trim()}</p></div>`,
          css:
            composeCss.trim() ||
            '.demo-box { padding: 20px; border-radius: 10px; border: 1px solid rgba(239,233,221,0.22); background: #1a1917; color: #efe9dd; }',
          js: composeJs.trim() || undefined,
        }
      : undefined;

    const now = new Date().toISOString();
    const localNewPost: CommunityPost = {
      id: `post-local-${Date.now()}`,
      channel: hasCode ? 'showcase' : composeChannel,
      title: titleTrimmed,
      body: composeBody.trim() || titleTrimmed,
      description: composeBody.trim() || titleTrimmed,
      category: composeCategory || 'Kiến trúc & Giao diện',
      tags: parsedTags.length > 0 ? parsedTags : ['builder', 'ui'],
      createdAt: now,
      votes: 1,
      likes: 1,
      views: 1,
      author: {
        id: currentUser?.id || 'guest-builder',
        name: currentUser?.name || 'Builder Cộng đồng',
        handle: currentUser?.username || 'builder_vn',
        role: currentUser?.role === 'admin' ? 'Điều hành' : 'Thành viên',
      },
      demoSnippet,
      answers: [],
    };

    try {
      let finalPost = localNewPost;
      if (currentUser) {
        try {
          const created = await createPost({
            channel: localNewPost.channel,
            title: localNewPost.title,
            body: localNewPost.body,
            category: localNewPost.category,
            tags: localNewPost.tags,
            demoSnippet: localNewPost.demoSnippet,
          });
          finalPost = {
            ...created,
            demoSnippet: localNewPost.demoSnippet || created.demoSnippet,
          };
        } catch {
          finalPost = localNewPost;
        }
      }

      setLocalPosts((prev) => [finalPost, ...prev.filter((p) => p.id !== finalPost.id)]);
      setSelectedPostId(finalPost.id);
      if (finalPost.demoSnippet) {
        setCodeModes((prev) => ({ ...prev, [finalPost.id]: 'live' }));
      }
      if (feedTab === 'saved') {
        setFeedTab('all');
      }
      setComposeTitle('');
      setComposeBody('');
      setComposeHtml('');
      setComposeCss('');
      setComposeJs('');
      setComposeIncludeCode(false);
      setComposePreviewLive(false);

      addToast({
        type: 'success',
        title: 'Đã đăng bài chia sẻ',
        message: finalPost.title,
      });
    } finally {
      setSubmittingPost(false);
    }
  };

  const handleSubmitComment = async (event: React.FormEvent, post: CommunityPost) => {
    event.preventDefault();
    const draft = (replyDrafts[post.id] || '').trim();
    if (!draft) return;

    setSubmittingReplyId(post.id);
    const now = new Date().toISOString();
    const newAnswer: CommunityAnswer = {
      id: `ans-local-${Date.now()}`,
      author: {
        id: currentUser?.id || 'guest-builder',
        name: currentUser?.name || 'Builder Cộng đồng',
        handle: currentUser?.username || 'builder_vn',
        role: currentUser?.role === 'admin' ? 'Điều hành' : 'Thành viên',
      },
      createdAt: now,
      votes: 1,
      content: draft,
    };

    try {
      setLocalReplies((prev) => ({
        ...prev,
        [post.id]: [...(prev[post.id] || []), newAnswer],
      }));
      setReplyDrafts((prev) => ({ ...prev, [post.id]: '' }));
      setOpenCommentDrawers((prev) => ({ ...prev, [post.id]: true }));

      if (currentUser) {
        void answerPost(post.id, draft).catch(() => undefined);
      } else {
        addToast({
          type: 'success',
          title: 'Đã đăng bình luận',
          message: whiteLabelText(post.title),
        });
      }
    } finally {
      setSubmittingReplyId(null);
    }
  };

  const handleAcceptSolution = async (post: CommunityPost, answerId: string) => {
    setLocalAcceptedMap((prev) => ({ ...prev, [post.id]: answerId }));
    if (currentUser) {
      void acceptAnswer(post.id, answerId).catch(() => undefined);
    } else {
      addToast({
        type: 'success',
        title: 'Đã đánh dấu lời giải đạt chuẩn',
      });
    }
  };

  const openEditDossier = (club: CommunityPost) => {
    const current = club.activeDossier || {
      projectTitle: club.title || club.name || '',
      handoverNotes: club.description || '',
      nextMilestones: [],
      architectureSummary: '',
      ownerHandle: club.author.handle,
    };
    setDossierClub(club);
    setDossierDraft(current);
    setMilestonesText((current.nextMilestones || []).join('\n'));
  };

  const handleSaveDossier = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!dossierClub) return;
    setSavingDossier(true);
    const updatedDossier: ClubHandoverDossier = {
      ...dossierDraft,
      nextMilestones: milestonesText
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean),
      updatedAt: new Date().toISOString(),
    };
    try {
      setLocalPosts((prev) => {
        const exists = prev.some((p) => p.id === dossierClub.id);
        if (exists) {
          return prev.map((p) =>
            p.id === dossierClub.id ? { ...p, activeDossier: updatedDossier } : p
          );
        }
        return [{ ...dossierClub, activeDossier: updatedDossier }, ...prev];
      });
      if (currentUser) {
        await updateDossier(dossierClub.id, updatedDossier).catch(() => undefined);
      } else {
        addToast({
          type: 'success',
          title: 'Đã cập nhật hồ sơ bàn giao',
        });
      }
      setDossierClub(null);
    } finally {
      setSavingDossier(false);
    }
  };

  const handleSubmitReport = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!reportTarget || !reportReason.trim()) return;
    setSubmittingReport(true);
    try {
      await reportPost(reportTarget.id, reportReason.trim()).catch(() => undefined);
      addToast({
        type: 'info',
        title: 'Đã ghi nhận báo cáo bài viết',
      });
      setReportTarget(null);
      setReportReason('Thông tin sai lệch kỹ thuật hoặc spam');
    } finally {
      setSubmittingReport(false);
    }
  };

  const clearAllFilters = useCallback(() => {
    setFeedTab('all');
    setSelectedTopic('all');
    setAuthorFilter(null);
    setSearchQuery('');
    setSortMode('newest');
  }, []);

  const hasActiveFilter =
    feedTab !== 'all' ||
    selectedTopic !== 'all' ||
    authorFilter !== null ||
    Boolean(searchQuery.trim());

  const activeComposeTags = useMemo(
    () =>
      composeTagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    [composeTagsInput]
  );

  return (
    <div className="cm">
      <div className="wrap-wide cm-shell">
        <aside className="cm-rail-left" aria-label="Điều hướng cộng đồng">
          <div className="cm-panel">
            <div className="cm-rail-head">
              <p className="t-label">mạng xã hội kỹ thuật</p>
              <h1 className="cm-rail-title">
                <span className="t-script cm-cap">T</span>ri thức
              </h1>
              <p className="cm-rail-sub">
                Chia sẻ kiến trúc giao diện, chạy thử mã HTML/CSS/JS trực tiếp và phản biện kỹ thuật.
              </p>
            </div>

            <div className="cm-section-head">
              <span className="cm-section-title">Luồng bảng tin</span>
              <span className="t-label">{visiblePosts.length} hiển thị</span>
            </div>

            <div className="cm-rail-tabs">
              <LiquidTabs
                tabs={feedTabItems}
                activeId={feedTab}
                onChange={(id) => setFeedTab(id as FeedTabId)}
                ariaLabel="Chuyển kênh bảng tin"
              />
            </div>
          </div>

          <div className="cm-panel">
            <div className="cm-section-head">
              <span className="cm-section-title">Chủ đề kỹ thuật</span>
              {selectedTopic !== 'all' && (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setSelectedTopic('all')}
                >
                  Đặt lại
                </button>
              )}
            </div>

            <div className="cm-topics-wrap">
              <Chips
                items={TOPIC_CHIPS}
                selectedIds={[selectedTopic]}
                onToggle={handleToggleTopic}
                multi={false}
                variant="filter"
                theme={theme}
              />
            </div>
          </div>

          <PresenceCards
            title="Thành viên đóng góp"
            subtitle="Nhấn vào tác giả để lọc bài viết"
            members={presenceMembers}
            actionLabel={authorFilter ? 'Bỏ lọc' : 'Tất cả'}
            onAction={() => setAuthorFilter(null)}
          >
            <ul className="cm-contrib-list">
              {topContributors.map((person, index) => {
                const isSelected =
                  authorFilter !== null &&
                  authorFilter.toLowerCase() === person.handle.toLowerCase();
                return (
                  <li key={person.handle}>
                    <button
                      type="button"
                      className="cm-contrib-btn"
                      data-active={isSelected ? 'true' : undefined}
                      onClick={() =>
                        setAuthorFilter((prev) =>
                          prev && prev.toLowerCase() === person.handle.toLowerCase()
                            ? null
                            : person.handle
                        )
                      }
                    >
                      <span className="cm-contrib-rank">{index + 1}</span>
                      <span className="cm-contrib-info">
                        <span className="cm-contrib-name">{person.name}</span>
                        <span className="cm-contrib-meta">
                          @{person.handle} · {person.postsCount} bài · {person.repliesCount} phản hồi
                        </span>
                      </span>
                      <span className="cm-contrib-score">{person.score}đ</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </PresenceCards>
        </aside>

        <main className="cm-center" aria-label="Luồng bài viết cộng đồng">
          <section className="cm-top-bar" aria-label="Tìm kiếm và sắp xếp">
            <SearchCard
              value={searchQuery}
              onChange={(val) => {
                setSearchQuery(val);
              }}
              placeholder="Tìm bài viết, mã mẫu HTML/CSS, thẻ chủ đề hoặc @tác_giả..."
              recentSearches={recentSearches}
              onSelectRecent={(q) => {
                setSearchQuery(q);
                recordRecentSearch(q);
              }}
            />

            <div className="cm-top-controls">
              <div className="cm-sort-group" role="group" aria-label="Sắp xếp luồng bài">
                <button
                  type="button"
                  className="cm-sort-btn"
                  aria-pressed={sortMode === 'newest'}
                  onClick={() => setSortMode('newest')}
                >
                  Mới nhất
                </button>
                <button
                  type="button"
                  className="cm-sort-btn"
                  aria-pressed={sortMode === 'top'}
                  onClick={() => setSortMode('top')}
                >
                  Nổi bật
                </button>
                <button
                  type="button"
                  className="cm-sort-btn"
                  aria-pressed={sortMode === 'discussed'}
                  onClick={() => setSortMode('discussed')}
                >
                  Nhiều thảo luận
                </button>
              </div>

              <span className="t-label">
                {visiblePosts.length} / {allPosts.length} bài viết
              </span>
            </div>

            {hasActiveFilter && (
              <div className="cm-active-filters">
                <span className="t-label">Đang lọc:</span>
                {feedTab !== 'all' && (
                  <span className="tag tag-red">
                    Kênh: {feedTabItems.find((t) => t.id === feedTab)?.label}
                  </span>
                )}
                {selectedTopic !== 'all' && (
                  <span className="tag tag-red">
                    Chủ đề: {TOPIC_CHIPS.find((c) => c.id === selectedTopic)?.label || selectedTopic}
                  </span>
                )}
                {authorFilter && <span className="tag tag-red">Tác giả: @{authorFilter}</span>}
                {searchQuery.trim() && (
                  <span className="tag tag-red">Từ khóa: {searchQuery.trim()}</span>
                )}
                <button
                  type="button"
                  className="btn btn-line btn-sm"
                  onClick={clearAllFilters}
                >
                  Xóa bộ lọc
                </button>
              </div>
            )}
          </section>

          <section className="cm-composer" aria-label="Đăng bài chia sẻ">
            <form className="cm-composer-grid" onSubmit={(e) => void handleCreatePost(e)}>
              <div className="cm-composer-head">
                <div className="cm-composer-title-wrap">
                  <span className="cm-avatar-chip" aria-hidden="true">
                    {authorInitials(currentUser?.name || 'Builder VN')}
                  </span>
                  <h2 className="cm-composer-title">Đăng bài chia sẻ</h2>
                </div>

                <div className="cm-composer-tools">
                  <button
                    type="button"
                    className="btn btn-line btn-sm"
                    onClick={handlePrefillFromWorkspace}
                  >
                    Nạp từ Workspace
                  </button>
                  <button
                    type="button"
                    className="btn btn-line btn-sm"
                    aria-pressed={composeIncludeCode}
                    onClick={() => setComposeIncludeCode((prev) => !prev)}
                  >
                    {composeIncludeCode ? 'Ẩn khung mã HTML/CSS/JS' : 'Đính kèm mã HTML/CSS/JS'}
                  </button>
                </div>
              </div>

              <div className="cm-composer-row">
                <div className="cm-field">
                  <label htmlFor="cm-post-title" className="t-label">
                    tiêu đề bài viết
                  </label>
                  <input
                    id="cm-post-title"
                    type="text"
                    className="field"
                    required
                    value={composeTitle}
                    onChange={(e) => setComposeTitle(e.target.value)}
                    placeholder="Ví dụ: Tối ưu Liquid Glass Button hoặc kiến trúc Token..."
                  />
                </div>

                <div className="cm-field">
                  <label htmlFor="cm-post-category" className="t-label">
                    chuyên mục
                  </label>
                  <select
                    id="cm-post-category"
                    className="field"
                    value={composeCategory}
                    onChange={(e) => {
                      const val = e.target.value;
                      setComposeCategory(val);
                      if (val === 'Components' || val === 'Layouts') {
                        setComposeChannel('showcase');
                      } else if (val === 'Agent Rules' || val === 'Prompts') {
                        setComposeChannel('drops');
                      } else if (val === 'Hội nhóm') {
                        setComposeChannel('clubs');
                      } else {
                        setComposeChannel('qa');
                      }
                    }}
                  >
                    <option value="React / Frontend">React / Frontend</option>
                    <option value="UI/UX & Tokens">UI/UX &amp; Tokens</option>
                    <option value="Components">Components (Hộp cát)</option>
                    <option value="Layouts">Layouts (Bố cục)</option>
                    <option value="Agent Rules">Agent Rules</option>
                    <option value="Hội nhóm">Hội nhóm dự án</option>
                  </select>
                </div>
              </div>

              <div className="cm-field">
                <label htmlFor="cm-post-body" className="t-label">
                  nội dung chia sẻ
                </label>
                <textarea
                  id="cm-post-body"
                  rows={2}
                  className="field"
                  value={composeBody}
                  onChange={(e) => setComposeBody(e.target.value)}
                  placeholder="Trình bày giải pháp, thông số kỹ thuật, hoặc câu hỏi cần cộng đồng phản biện..."
                />
              </div>

              <div className="cm-field">
                <label htmlFor="cm-post-tags" className="t-label">
                  thẻ chủ đề (phân tách bằng dấu phẩy)
                </label>
                <input
                  id="cm-post-tags"
                  type="text"
                  className="field"
                  value={composeTagsInput}
                  onChange={(e) => setComposeTagsInput(e.target.value)}
                  placeholder="react, css-tokens, glassmorphism"
                />
                <div className="cm-quick-tags" role="group" aria-label="Chọn nhanh thẻ chủ đề">
                  {QUICK_COMPOSE_TAGS.map((tag) => {
                    const active = activeComposeTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        className="cm-quick-tag-btn"
                        data-active={active ? 'true' : undefined}
                        onClick={() => handleToggleQuickComposeTag(tag)}
                      >
                        #{tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {composeIncludeCode && (
                <div className="cm-code-composer">
                  <div className="cm-code-composer-bar">
                    <span className="t-label">Mã chạy thử trực tiếp (HTML / CSS / JS cô lập)</span>
                    <div className="cm-composer-tools">
                      <button
                        type="button"
                        className="btn btn-line btn-sm"
                        onClick={handleLoadSampleSnippet}
                      >
                        Chèn mẫu chạy thử
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        aria-pressed={composePreviewLive}
                        onClick={() => setComposePreviewLive((p) => !p)}
                      >
                        {composePreviewLive ? 'Ẩn bản xem thử' : 'Chạy thử ngay'}
                      </button>
                    </div>
                  </div>

                  <div className="cm-code-editors">
                    <div className="cm-field">
                      <label htmlFor="cm-code-html" className="t-label">
                        HTML
                      </label>
                      <textarea
                        id="cm-code-html"
                        rows={4}
                        className="field cm-code-input"
                        value={composeHtml}
                        onChange={(e) => setComposeHtml(e.target.value)}
                        placeholder="<div class='demo-card'>...</div>"
                      />
                    </div>

                    <div className="cm-field">
                      <label htmlFor="cm-code-css" className="t-label">
                        CSS
                      </label>
                      <textarea
                        id="cm-code-css"
                        rows={4}
                        className="field cm-code-input"
                        value={composeCss}
                        onChange={(e) => setComposeCss(e.target.value)}
                        placeholder=".demo-card { padding: 20px; }"
                      />
                    </div>

                    <div className="cm-field">
                      <label htmlFor="cm-code-js" className="t-label">
                        JavaScript
                      </label>
                      <textarea
                        id="cm-code-js"
                        rows={4}
                        className="field cm-code-input"
                        value={composeJs}
                        onChange={(e) => setComposeJs(e.target.value)}
                        placeholder="document.querySelector('.demo-card')..."
                      />
                    </div>
                  </div>

                  {composePreviewLive && (
                    <div className="cm-sandbox-stage">
                      <SandboxPreview
                        title={composeTitle.trim() || 'Bản nháp bài viết'}
                        html={compileHtmlWithJs({
                          html: composeHtml || SAMPLE_SNIPPET.html,
                          css: composeCss || SAMPLE_SNIPPET.css,
                          js: composeJs,
                        })}
                        css={composeCss || SAMPLE_SNIPPET.css}
                        theme={theme}
                        viewport={1440}
                        nonce={0}
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="cm-composer-foot">
                <span className="t-label">
                  {composeIncludeCode
                    ? 'Đã bật đính kèm hộp cát SandboxPreview an toàn'
                    : 'Có thể đính kèm mã HTML/CSS/JS để người đọc chạy thử trực tiếp'}
                </span>
                <button
                  type="submit"
                  className="btn btn-red btn-sm"
                  disabled={submittingPost || !composeTitle.trim()}
                >
                  {submittingPost ? 'Đang đăng...' : 'Đăng bài chia sẻ'}
                </button>
              </div>
            </form>
          </section>

          {visiblePosts.length === 0 ? (
            <div className="cm-empty">
              <h3 className="t-title" style={{ fontSize: 'var(--text-xl)' }}>
                Không tìm thấy bài viết khớp bộ lọc
              </h3>
              <p className="cm-post-body">
                Thử chuyển kênh bảng tin, xóa từ khóa tìm kiếm hoặc đăng một bài chia sẻ mới.
              </p>
              <div className="cm-empty-actions">
                <button type="button" className="btn btn-line btn-sm" onClick={clearAllFilters}>
                  Xóa toàn bộ bộ lọc
                </button>
              </div>
            </div>
          ) : (
            <ul className="cm-stream">
              {visiblePosts.map((post) => {
                const isSelected = activeReaderPost?.id === post.id;
                const answers = getPostAnswers(post);
                const score = getPostScore(post);
                const isLiked = isItemLiked(post.id);
                const isSaved = savedItemIds.includes(post.id);
                const isCommentsOpen = Boolean(openCommentDrawers[post.id]);
                const hasRunnableCode = Boolean(post.demoSnippet);
                const hasCodeOrPayload = Boolean(post.demoSnippet || post.payload);
                const currentCodeMode: CodeDisplayMode =
                  codeModes[post.id] ?? 'collapsed';
                const currentViewport: PreviewViewport =
                  sandboxViewports[post.id] ?? 1440;
                const currentPreviewTheme: PreviewTheme =
                  sandboxThemes[post.id] ?? theme;
                const currentNonce = sandboxNonces[post.id] ?? 0;
                const solved =
                  Boolean(post.isAccepted || post.acceptedAnswer) ||
                  answers.some((a) => a.isAccepted);

                return (
                  <li
                    key={post.id}
                    ref={(el) => {
                      postRefs.current[post.id] = el;
                    }}
                    className="cm-post"
                    data-selected={isSelected ? 'true' : undefined}
                  >
                    <div className="cm-post-head">
                      <button
                        type="button"
                        className="cm-author-btn"
                        onClick={() =>
                          setAuthorFilter((prev) =>
                            prev && prev.toLowerCase() === post.author.handle.toLowerCase()
                              ? null
                              : post.author.handle
                          )
                        }
                        title={`Lọc bài viết của @${post.author.handle}`}
                      >
                        <span className="cm-avatar-chip" aria-hidden="true">
                          {authorInitials(post.author.name)}
                        </span>
                        <span className="cm-author-name">{post.author.name}</span>
                        <span className="t-label">@{post.author.handle}</span>
                        <span className="tag">{post.author.role}</span>
                      </button>

                      <div className="cm-post-badges">
                        <span className="tag tag-red">{whiteLabelText(post.category)}</span>
                        {hasRunnableCode && (
                          <span className="tag tag-green">Mã chạy thử</span>
                        )}
                        {solved && <span className="tag tag-green">Đạt chuẩn</span>}
                        <time className="t-label" dateTime={post.createdAt}>
                          {formatPostDate(post.createdAt)}
                        </time>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="cm-post-title-btn"
                      onClick={() => setSelectedPostId(post.id)}
                    >
                      {whiteLabelText(post.title)}
                    </button>

                    <p className="cm-post-body">
                      {whiteLabelText(post.body || post.description || '')}
                    </p>

                    {post.channel === 'clubs' && post.activeDossier && (
                      <div className="cm-dossier">
                        <div className="cm-section-head">
                          <div>
                            <p className="t-label">hồ sơ bàn giao câu lạc bộ</p>
                            <h3 className="cm-composer-title">
                              {post.activeDossier.projectTitle}
                            </h3>
                          </div>
                          <button
                            type="button"
                            className="btn btn-line btn-sm"
                            onClick={() => openEditDossier(post)}
                          >
                            Cập nhật hồ sơ
                          </button>
                        </div>
                        <p className="cm-post-body">{post.activeDossier.handoverNotes}</p>
                        {post.activeDossier.nextMilestones.length > 0 && (
                          <ol className="cm-dossier-list">
                            {post.activeDossier.nextMilestones.map((step) => (
                              <li key={step}>{step}</li>
                            ))}
                          </ol>
                        )}
                      </div>
                    )}

                    {post.tags.length > 0 && (
                      <div className="cm-tags">
                        {post.tags.slice(0, 6).map((tag) => {
                          const cleanTag = whiteLabelText(tag);
                          const isTagActive =
                            selectedTopic.toLowerCase() === cleanTag.toLowerCase() ||
                            searchQuery.trim().toLowerCase() === cleanTag.toLowerCase();
                          return (
                            <button
                              key={tag}
                              type="button"
                              className="cm-tag-btn"
                              data-active={isTagActive ? 'true' : undefined}
                              onClick={() => {
                                const matchingChip = TOPIC_CHIPS.find(
                                  (c) => c.id.toLowerCase() === cleanTag.toLowerCase()
                                );
                                if (matchingChip) {
                                  handleToggleTopic(matchingChip.id);
                                } else {
                                  setSearchQuery((prev) =>
                                    prev.trim().toLowerCase() === cleanTag.toLowerCase()
                                      ? ''
                                      : cleanTag
                                  );
                                }
                              }}
                            >
                              #{cleanTag}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {hasCodeOrPayload && (
                      <div className="cm-sandbox-box">
                        <div className="cm-sandbox-bar">
                          <div className="cm-sandbox-modes">
                            {post.demoSnippet && (
                              <button
                                type="button"
                                className="btn btn-line btn-sm"
                                aria-pressed={currentCodeMode === 'live'}
                                onClick={() =>
                                  setCodeModes((prev) => ({
                                    ...prev,
                                    [post.id]:
                                      prev[post.id] === 'live' ? 'collapsed' : 'live',
                                  }))
                                }
                              >
                                {currentCodeMode === 'live'
                                  ? 'Đang chạy trực tiếp'
                                  : 'Chạy thử trực tiếp'}
                              </button>
                            )}
                            <button
                              type="button"
                              className="btn btn-line btn-sm"
                              aria-pressed={currentCodeMode === 'code'}
                              onClick={() =>
                                setCodeModes((prev) => ({
                                  ...prev,
                                  [post.id]:
                                    prev[post.id] === 'code' ? 'collapsed' : 'code',
                                }))
                              }
                            >
                              {currentCodeMode === 'code' ? 'Ẩn mã nguồn' : 'Xem mã'}
                            </button>

                            {currentCodeMode === 'live' && post.demoSnippet && (
                              <>
                                <button
                                  type="button"
                                  className="btn btn-ghost btn-sm"
                                  aria-pressed={currentViewport === 1440}
                                  onClick={() =>
                                    setSandboxViewports((prev) => ({
                                      ...prev,
                                      [post.id]: 1440,
                                    }))
                                  }
                                >
                                  1440px
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-ghost btn-sm"
                                  aria-pressed={currentViewport === 768}
                                  onClick={() =>
                                    setSandboxViewports((prev) => ({
                                      ...prev,
                                      [post.id]: 768,
                                    }))
                                  }
                                >
                                  768px
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-ghost btn-sm"
                                  aria-pressed={currentViewport === 390}
                                  onClick={() =>
                                    setSandboxViewports((prev) => ({
                                      ...prev,
                                      [post.id]: 390,
                                    }))
                                  }
                                >
                                  390px
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-ghost btn-sm"
                                  onClick={() =>
                                    setSandboxThemes((prev) => ({
                                      ...prev,
                                      [post.id]:
                                        (prev[post.id] ?? theme) === 'dark'
                                          ? 'light'
                                          : 'dark',
                                    }))
                                  }
                                >
                                  {currentPreviewTheme === 'dark' ? 'Nền tối' : 'Nền sáng'}
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-ghost btn-sm"
                                  onClick={() =>
                                    setSandboxNonces((prev) => ({
                                      ...prev,
                                      [post.id]: (prev[post.id] ?? 0) + 1,
                                    }))
                                  }
                                >
                                  Chạy lại
                                </button>
                              </>
                            )}
                          </div>

                          <div className="cm-sandbox-actions">
                            <button
                              type="button"
                              className="btn btn-line btn-sm"
                              onClick={() => void handleCopyCode(post)}
                            >
                              {copiedCodeId === post.id ? 'Đã chép mã' : 'Chép mã'}
                            </button>
                            <button
                              type="button"
                              className="btn btn-solid btn-sm"
                              onClick={() => forkPostToWorkspace(post)}
                            >
                              Mở trong Workspace
                            </button>
                          </div>
                        </div>

                        {currentCodeMode === 'live' && post.demoSnippet && (
                          <div className="cm-sandbox-stage">
                            <SandboxPreview
                              title={whiteLabelText(post.title)}
                              html={compileHtmlWithJs(post.demoSnippet)}
                              css={post.demoSnippet.css}
                              theme={currentPreviewTheme}
                              viewport={currentViewport}
                              nonce={currentNonce}
                            />
                          </div>
                        )}

                        {currentCodeMode === 'code' && (
                          <div className="cm-code-view">
                            {post.demoSnippet ? (
                              <>
                                <div>
                                  <span className="t-label">HTML</span>
                                  <pre className="cm-code-block">{post.demoSnippet.html}</pre>
                                </div>
                                {post.demoSnippet.css && (
                                  <div>
                                    <span className="t-label">CSS</span>
                                    <pre className="cm-code-block">{post.demoSnippet.css}</pre>
                                  </div>
                                )}
                                {post.demoSnippet.js && (
                                  <div>
                                    <span className="t-label">JavaScript</span>
                                    <pre className="cm-code-block">{post.demoSnippet.js}</pre>
                                  </div>
                                )}
                              </>
                            ) : (
                              <pre className="cm-code-block">
                                {whiteLabelText(post.payload || '')}
                              </pre>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="cm-post-foot">
                      <div className="cm-post-reactions">
                        <button
                          type="button"
                          className="cm-action-pill"
                          aria-pressed={isLiked}
                          onClick={() => handleToggleVote(post)}
                        >
                          {isLiked ? `Đã tán thành · ${score}` : `Tán thành · ${score}`}
                        </button>

                        <button
                          type="button"
                          className="cm-action-pill"
                          aria-expanded={isCommentsOpen}
                          data-active={isCommentsOpen ? 'true' : undefined}
                          onClick={() =>
                            setOpenCommentDrawers((prev) => ({
                              ...prev,
                              [post.id]: !prev[post.id],
                            }))
                          }
                        >
                          {`Bình luận · ${answers.length}`}
                        </button>

                        <button
                          type="button"
                          className="cm-action-pill"
                          aria-pressed={isSaved}
                          onClick={() => toggleSavedItem(post.id)}
                        >
                          {isSaved ? 'Đã lưu' : 'Lưu bài'}
                        </button>
                      </div>

                      <div className="cm-post-utilities">
                        <button
                          type="button"
                          className="cm-action-pill"
                          onClick={() => void handleSharePost(post)}
                        >
                          {copiedShareId === post.id ? 'Đã chép liên kết' : 'Chia sẻ'}
                        </button>

                        <button
                          type="button"
                          className="cm-action-pill"
                          data-active={isSelected ? 'true' : undefined}
                          onClick={() => setSelectedPostId(post.id)}
                        >
                          {isSelected ? 'Đang chọn Đọc sâu' : 'Đọc sâu'}
                        </button>

                        {!hasCodeOrPayload && (
                          <button
                            type="button"
                            className="cm-action-pill"
                            onClick={() => forkPostToWorkspace(post)}
                          >
                            Mở trong Workspace
                          </button>
                        )}

                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => setReportTarget(post)}
                        >
                          Báo cáo
                        </button>
                      </div>
                    </div>

                    {isCommentsOpen && (
                      <div
                        className="cm-comments-drawer"
                        aria-label={`Luồng bình luận của ${whiteLabelText(post.title)}`}
                      >
                        <div className="cm-section-head">
                          <span className="cm-section-title">
                            Thảo luận trực tiếp ({answers.length})
                          </span>
                          <span className="t-label">Lưu tự động</span>
                        </div>

                        {answers.length === 0 ? (
                          <p className="t-label">
                            Chưa có phản hồi. Hãy để lại bình luận hoặc đoạn mã đối chiếu đầu tiên.
                          </p>
                        ) : (
                          <ul className="cm-comments-list">
                            {answers.map((ans) => (
                              <li
                                key={ans.id}
                                className="cm-comment-item"
                                data-accepted={ans.isAccepted ? 'true' : undefined}
                              >
                                <div className="cm-comment-head">
                                  <div className="cm-comment-author">
                                    <span className="cm-avatar-chip" aria-hidden="true">
                                      {authorInitials(ans.author.name)}
                                    </span>
                                    <span className="cm-author-name">{ans.author.name}</span>
                                    <span className="t-label">@{ans.author.handle}</span>
                                    <time className="t-label" dateTime={ans.createdAt}>
                                      {formatPostDate(ans.createdAt)}
                                    </time>
                                  </div>

                                  {ans.isAccepted ? (
                                    <span className="tag tag-green">Lời giải chuẩn</span>
                                  ) : (
                                    <button
                                      type="button"
                                      className="btn btn-ghost btn-sm"
                                      onClick={() => void handleAcceptSolution(post, ans.id)}
                                    >
                                      Đánh dấu chuẩn
                                    </button>
                                  )}
                                </div>
                                <p className="cm-comment-text">{whiteLabelText(ans.content)}</p>
                              </li>
                            ))}
                          </ul>
                        )}

                        <form
                          className="cm-comment-form"
                          onSubmit={(e) => void handleSubmitComment(e, post)}
                        >
                          <label htmlFor={`cm-reply-${post.id}`} className="sr-only">
                            Viết bình luận
                          </label>
                          <textarea
                            id={`cm-reply-${post.id}`}
                            rows={2}
                            className="field"
                            value={replyDrafts[post.id] || ''}
                            onChange={(e) =>
                              setReplyDrafts((prev) => ({
                                ...prev,
                                [post.id]: e.target.value,
                              }))
                            }
                            placeholder="Viết bình luận, phản biện kỹ thuật hoặc giải pháp bổ sung..."
                          />
                          <div className="cm-comment-form-row">
                            <span className="t-label">
                              Đăng dưới tên @{currentUser?.username || 'builder_vn'}
                            </span>
                            <button
                              type="submit"
                              className="btn btn-red btn-sm"
                              disabled={
                                submittingReplyId === post.id ||
                                !(replyDrafts[post.id] || '').trim()
                              }
                            >
                              {submittingReplyId === post.id
                                ? 'Đang gửi...'
                                : 'Gửi bình luận'}
                            </button>
                          </div>
                        </form>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </main>

        <aside className="cm-rail-right" aria-label="Thống kê và luồng thảo luận">
          <section className="cm-panel" aria-label="Thống kê thực tế">
            <div className="cm-section-head">
              <span className="cm-section-title">Chỉ số cộng đồng</span>
              <span className="t-label">Thời gian thực</span>
            </div>

            <div className="cm-stats-grid">
              <button
                type="button"
                className="cm-stat-card"
                data-active={feedTab === 'all' ? 'true' : undefined}
                onClick={() => setFeedTab('all')}
              >
                <strong className="cm-stat-val">{allPosts.length}</strong>
                <span className="cm-stat-label">Tổng bài viết</span>
              </button>

              <button
                type="button"
                className="cm-stat-card"
                data-active={feedTab === 'demos' ? 'true' : undefined}
                onClick={() => setFeedTab('demos')}
              >
                <strong className="cm-stat-val">{demoPosts.length}</strong>
                <span className="cm-stat-label">Mã chạy thử</span>
              </button>

              <button
                type="button"
                className="cm-stat-card"
                data-active={feedTab === 'trending' ? 'true' : undefined}
                onClick={() => setFeedTab('trending')}
              >
                <strong className="cm-stat-val">{totalCommentsCount}</strong>
                <span className="cm-stat-label">Phản hồi</span>
              </button>

              <button
                type="button"
                className="cm-stat-card"
                data-active={feedTab === 'saved' ? 'true' : undefined}
                onClick={() => setFeedTab('saved')}
              >
                <strong className="cm-stat-val">{savedCommunityPosts.length}</strong>
                <span className="cm-stat-label">Đã lưu</span>
              </button>
            </div>
          </section>

          {activeReaderPost && (
            <section className="cm-panel cm-reader-wrap" aria-label="Trình đọc chi tiết">
              <div className="cm-section-head">
                <span className="cm-section-title">Trình đọc chi tiết</span>
                <span className="t-label">@{activeReaderPost.author.handle}</span>
              </div>
              <ReaderCard
                title={whiteLabelText(activeReaderPost.title)}
                subtitle={`${whiteLabelText(activeReaderPost.category)} · @${activeReaderPost.author.handle}`}
                paragraphs={readerParagraphs}
                openLabel="Đọc sâu"
                theme={theme}
              />
            </section>
          )}

          <section className="cm-panel" aria-label="Luồng thảo luận sôi nổi">
            <div className="cm-section-head">
              <span className="cm-section-title">Thảo luận đang mở</span>
              <span className="t-label">{activeDiscussionThreads.length} chủ đề</span>
            </div>

            <ul className="cm-thread-list">
              {activeDiscussionThreads.map((thread) => {
                const repliesCount = getPostAnswers(thread).length;
                const score = getPostScore(thread);
                const active = activeReaderPost?.id === thread.id;
                return (
                  <li key={thread.id}>
                    <button
                      type="button"
                      className="cm-thread-btn"
                      data-active={active ? 'true' : undefined}
                      onClick={() => {
                        if (feedTab === 'saved' && !savedItemIds.includes(thread.id)) {
                          setFeedTab('all');
                        }
                        focusAndScrollToPost(thread.id, true);
                      }}
                    >
                      <span className="cm-thread-title">{whiteLabelText(thread.title)}</span>
                      <span className="cm-thread-meta">
                        <span>@{thread.author.handle}</span>
                        <span>
                          {repliesCount} bình luận · {score} tán thành
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="cm-panel" aria-label="Bài viết đã lưu nhanh">
            <div className="cm-section-head">
              <span className="cm-section-title">Đã lưu nhanh</span>
              <span className="t-label">{savedCommunityPosts.length} mục</span>
            </div>

            {savedCommunityPosts.length === 0 ? (
              <div className="cm-saved-item">
                <p className="cm-rail-sub">
                  Chưa có bài viết đã lưu. Nhấn Lưu bài trên thẻ bất kỳ để đồng bộ với tab Đã lưu và trang Hồ sơ.
                </p>
                {allPosts[0] && (
                  <div className="cm-saved-actions">
                    <button
                      type="button"
                      className="btn btn-line btn-sm"
                      onClick={() => toggleSavedItem(allPosts[0].id)}
                    >
                      Lưu bài tiêu điểm
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <ul className="cm-saved-list">
                {savedCommunityPosts.map((savedPost) => (
                  <li key={savedPost.id} className="cm-saved-item">
                    <span className="cm-thread-title">{whiteLabelText(savedPost.title)}</span>
                    <span className="t-label">
                      @{savedPost.author.handle} · {whiteLabelText(savedPost.category)}
                    </span>
                    <div className="cm-saved-actions">
                      <button
                        type="button"
                        className="btn btn-line btn-sm"
                        onClick={() => focusAndScrollToPost(savedPost.id, false)}
                      >
                        Xem bài
                      </button>
                      <button
                        type="button"
                        className="btn btn-solid btn-sm"
                        onClick={() => forkPostToWorkspace(savedPost)}
                      >
                        Workspace
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => toggleSavedItem(savedPost.id)}
                      >
                        Bỏ lưu
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>

      <Modal
        open={reportTarget !== null}
        onClose={() => setReportTarget(null)}
        label="Báo cáo bài viết"
        className="cm-dialog"
      >
        <form className="cm-dialog-body" onSubmit={(e) => void handleSubmitReport(e)}>
          <div className="cm-dialog-head">
            <h2 className="t-title" style={{ fontSize: 'var(--text-xl)' }}>
              Báo cáo bài viết
            </h2>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setReportTarget(null)}
            >
              Đóng
            </button>
          </div>
          <p className="t-label">{reportTarget ? whiteLabelText(reportTarget.title) : ''}</p>
          <div className="cm-field">
            <label htmlFor="cm-reason" className="t-label">
              lý do báo cáo
            </label>
            <textarea
              id="cm-reason"
              rows={3}
              className="field"
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
            />
          </div>
          <div className="cm-dialog-actions">
            <button type="button" className="btn btn-line" onClick={() => setReportTarget(null)}>
              Hủy
            </button>
            <button type="submit" className="btn btn-red" disabled={submittingReport}>
              {submittingReport ? 'Đang gửi' : 'Gửi báo cáo'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={dossierClub !== null}
        onClose={() => setDossierClub(null)}
        label="Cập nhật hồ sơ chuyển giao"
        className="cm-dialog"
      >
        <form className="cm-dialog-body" onSubmit={(e) => void handleSaveDossier(e)}>
          <div className="cm-dialog-head">
            <h2 className="t-title" style={{ fontSize: 'var(--text-xl)' }}>
              Hồ sơ chuyển giao
            </h2>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setDossierClub(null)}
            >
              Đóng
            </button>
          </div>

          <div className="cm-field">
            <label htmlFor="cm-d-title" className="t-label">
              tên dự án
            </label>
            <input
              id="cm-d-title"
              type="text"
              className="field"
              value={dossierDraft.projectTitle}
              onChange={(e) => setDossierDraft((d) => ({ ...d, projectTitle: e.target.value }))}
            />
          </div>

          <div className="cm-field">
            <label htmlFor="cm-d-notes" className="t-label">
              ghi chú bàn giao
            </label>
            <textarea
              id="cm-d-notes"
              rows={4}
              className="field"
              value={dossierDraft.handoverNotes}
              onChange={(e) => setDossierDraft((d) => ({ ...d, handoverNotes: e.target.value }))}
            />
          </div>

          <div className="cm-field">
            <label htmlFor="cm-d-ms" className="t-label">
              cột mốc tiếp theo (mỗi dòng một mục)
            </label>
            <textarea
              id="cm-d-ms"
              rows={3}
              className="field"
              value={milestonesText}
              onChange={(e) => setMilestonesText(e.target.value)}
            />
          </div>

          <div className="cm-dialog-actions">
            <button type="button" className="btn btn-line" onClick={() => setDossierClub(null)}>
              Hủy
            </button>
            <button type="submit" className="btn btn-red" disabled={savingDossier}>
              {savingDossier ? 'Đang lưu' : 'Lưu hồ sơ'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CommunityView;
