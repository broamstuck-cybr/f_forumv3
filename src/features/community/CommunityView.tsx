import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowBigUp,
  ArrowUpRight,
  BarChart3,
  Bell,
  Bookmark,
  BookOpen,
  Check,
  Code2,
  Copy,
  EyeOff,
  Flag,
  Hash,
  HelpCircle,
  Image as ImageIcon,
  MessageSquare,
  Monitor,
  Moon,
  MoreHorizontal,
  Plus,
  RotateCw,
  Share2,
  ShieldBan,
  Smartphone,
  Sun,
  Tablet,
  Trash2,
  VolumeX,
  X,
} from 'lucide-react';
import { moderateFields } from './moderationFilter';
import { computeFeedScore } from './feedRanking';
import { CommunityChatRoom } from './CommunityChatRoom';
import type {
  ClubHandoverDossier,
  CommunityAnswer,
  CommunityChannel,
  CommunityPoll,
  CommunityPost,
  CommunityPostImage,
  CommunityShowcaseSnippet,
} from '../../types/index';
import communitySeedJson from '../../data/communitySeed.json';
import { formatUserDisplayName, useAppStore } from '../../store/appStore';
import {
  ChatRoom,
  Chips,
  FileBox,
  LiquidTabs,
  PresenceCards,
  ReaderCard,
  SearchCard,
  type ChatRoomPerson,
  type ChipItem,
  type FileBoxTab,
  type LiquidTabItem,
  type PresenceMember,
} from '../../components/pinui';
import { SandboxPreview } from '../explore/SandboxPreview';
import type { PreviewTheme, PreviewViewport } from '../explore/catalog';
import { copyText } from '../explore/catalog';
import { Modal } from '../workspace/Modal';
import { CommunityPollCard } from './CommunityPollCard';
import { CommunityOnboardingCard } from './CommunityOnboardingCard';
import {
  CommunityNotificationsModal,
  type CommunityNotificationItem,
} from './CommunityNotificationsModal';
import './community.css';

type FeedTabId = 'all' | 'following' | 'newest' | 'trending' | 'demos' | 'saved';
const FOLLOWING_STORAGE_KEY = 'fforum_v3_following_handles';
type ChannelFilterId = 'all' | CommunityChannel | 'saved' | 'exams';
type SortMode = 'newest' | 'top' | 'discussed';
type CodeDisplayMode = 'collapsed' | 'live' | 'code';

const CHANNEL_ITEMS: Array<{ id: ChannelFilterId; label: string }> = [
  { id: 'all', label: 'tất-cả' },
  { id: 'qa', label: 'hỏi-đáp' },
  { id: 'showcase', label: 'trưng-bày' },
  { id: 'drops', label: 'rules-prompt' },
  { id: 'clubs', label: 'clb-dự-án' },
  { id: 'exams', label: 'kho-đề-thi' },
  { id: 'saved', label: 'đã-lưu' },
];

const LOCAL_POSTS_STORAGE_KEY = 'fforum_v3_community_posts_v7';
const LOCAL_REPLIES_STORAGE_KEY = 'fforum_v3_community_replies_v7';
const LOCAL_ACCEPTED_STORAGE_KEY = 'fforum_v3_community_accepted_v7';
const LOCAL_RECENT_SEARCHES_KEY = 'fforum_v3_community_recent_searches_v7';
const LOCAL_POLL_VOTES_KEY = 'fforum_v3_community_poll_votes_v1';
const LOCAL_MODERATION_KEY = 'fforum_v3_community_moderation_v1';
const LOCAL_NOTIF_READ_KEY = 'fforum_v3_community_notif_read_v1';
const LOCAL_ONBOARDING_KEY = 'fforum_v3_community_onboarding_v1';
const LOCAL_DRAFT_KEY = 'fforum_v3_community_draft_v1';
const UNREAD_NOTIF_STORAGE_KEY = 'fforum_v3_unread_notifications';

const MAX_COMPOSE_IMAGES = 4;

interface ModerationPrefs {
  hiddenPostIds: string[];
  mutedHandles: string[];
  blockedHandles: string[];
}

interface ComposeDraft {
  title: string;
  body: string;
  tags: string;
}

const DEFAULT_SEED_POLL: CommunityPoll = {
  question: 'Chủ đề bạn muốn cộng đồng tổng hợp mẫu chuẩn trong tuần này?',
  closesLabel: 'Còn 3 ngày',
  options: [
    { id: 'opt-tokens', label: 'Hệ thống CSS Tokens sáng / tối', votes: 34 },
    { id: 'opt-forms', label: 'Biểu mẫu & kiểm tra nhập liệu', votes: 21 },
    { id: 'opt-mobile', label: 'Điều hướng di động 390px', votes: 29 },
    { id: 'opt-3d', label: 'Cảnh 3D WebGL nhẹ dưới 60fps', votes: 14 },
  ],
};

function compressImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Không đọc được tệp ảnh.'));
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      if (!dataUrl) {
        reject(new Error('Tệp ảnh trống.'));
        return;
      }
      const img = new Image();
      img.onload = () => {
        const maxSide = 720;
        const scale = Math.min(1, maxSide / Math.max(img.width || 1, img.height || 1));
        const w = Math.max(1, Math.round((img.width || maxSide) * scale));
        const h = Math.max(1, Math.round((img.height || maxSide) * scale));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        try {
          resolve(canvas.toDataURL('image/jpeg', 0.76));
        } catch {
          resolve(dataUrl);
        }
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}

const VIEWPORT_CYCLE: PreviewViewport[] = [1440, 768, 390];

const DEFAULT_RECENT_SEARCHES = [
  'virtualization',
  'css-tokens',
  'glassmorphism',
  'agent-rules',
  'bento',
];

const TOPIC_CHIPS: ChipItem[] = [
  { id: 'all', label: 'Tất cả' },
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

const CHAT_HUES = ['#ff6450', '#7fd69b', '#7da3bb', '#e9b44c', '#b0aec6'];

const SAMPLE_SNIPPET: CommunityShowcaseSnippet = {
  html: '<div class="builder-demo-card">\n  <div class="builder-demo-head">\n    <span class="builder-badge">Sandbox Live</span>\n    <span id="demo-counter" class="builder-counter">0 lượt chạy</span>\n  </div>\n  <h3 class="builder-title">Khối kiểm định tương tác thời gian thực</h3>\n  <p class="builder-desc">Nhấn nút bên dưới để kiểm tra phản hồi sự kiện JS trong khung cô lập.</p>\n  <button type="button" id="demo-trigger" class="builder-btn">Kích hoạt xung kiểm thử</button>\n</div>',
  css: '.builder-demo-card { width: min(380px, 100%); box-sizing: border-box; padding: 18px; border-radius: 12px; border: 1px solid rgba(239, 233, 221, 0.22); background: #1a1917; color: #efe9dd; display: grid; gap: 10px; }\n[data-theme="light"] .builder-demo-card { background: #fbf8f1; color: #17150f; border-color: rgba(23, 21, 15, 0.2); }\n.builder-demo-head { display: flex; justify-content: space-between; align-items: center; gap: 8px; }\n.builder-badge { font-family: monospace; font-size: 11px; padding: 3px 8px; border-radius: 999px; background: rgba(255, 100, 80, 0.16); color: #ff6450; }\n.builder-counter { font-family: monospace; font-size: 12px; color: #7fd69b; }\n[data-theme="light"] .builder-counter { color: #1c7440; }\n.builder-title { margin: 0; font-size: 16px; font-weight: 600; line-height: 1.3; }\n.builder-desc { margin: 0; font-size: 13px; line-height: 1.5; color: #b5afa3; }\n[data-theme="light"] .builder-desc { color: #524d45; }\n.builder-btn { padding: 9px 14px; border-radius: 8px; border: 1px solid #ff6450; background: #d63a27; color: #fffaf5; font-weight: 600; cursor: pointer; }',
  js: '(function(){\n  var btn = document.getElementById("demo-trigger");\n  var out = document.getElementById("demo-counter");\n  var count = 0;\n  if (btn && out) {\n    btn.addEventListener("click", function() {\n      count += 1;\n      out.textContent = count + " lượt chạy";\n    });\n  }\n})();',
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

function nextViewportValue(current: PreviewViewport): PreviewViewport {
  const idx = VIEWPORT_CYCLE.indexOf(current);
  return VIEWPORT_CYCLE[(idx + 1) % VIEWPORT_CYCLE.length];
}

function viewportTooltip(current: PreviewViewport): string {
  const next = nextViewportValue(current);
  return `Khung nhìn ${current}px · Nhấn để chuyển ${next}px`;
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
    openUserProfile,
  } = useAppStore();

  const postRefs = useRef<Record<string, HTMLLIElement | null>>({});

  const [feedTab, setFeedTab] = useState<FeedTabId>('all');
  const [activeChannel, setActiveChannel] = useState<ChannelFilterId>('all');
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
  const [openCommentDrawers, setOpenCommentDrawers] = useState<Record<string, boolean>>({});
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [replyTargets, setReplyTargets] = useState<Record<string, { answerId: string; authorName: string } | null>>({});
  const [followingHandles, setFollowingHandles] = useState<string[]>(() =>
    loadJsonFromStorage<string[]>(FOLLOWING_STORAGE_KEY, ['minh_dev', 'linh_ux'])
  );
  const [submittingReplyId, setSubmittingReplyId] = useState<string | null>(null);

  const [codeModes, setCodeModes] = useState<Record<string, CodeDisplayMode>>({});
  const [activeCodeFiles, setActiveCodeFiles] = useState<Record<string, string>>({});
  const [sandboxViewports, setSandboxViewports] = useState<Record<string, PreviewViewport>>({});
  const [sandboxThemes, setSandboxThemes] = useState<Record<string, PreviewTheme>>({});
  const [sandboxNonces, setSandboxNonces] = useState<Record<string, number>>({});

  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [copiedShareId, setCopiedShareId] = useState<string | null>(null);

  const [composerOpen, setComposerOpen] = useState(false);
  const [composeChannel, setComposeChannel] = useState<CommunityChannel>('showcase');
  const [initialDraft] = useState<ComposeDraft>(() =>
    loadJsonFromStorage<ComposeDraft>(LOCAL_DRAFT_KEY, {
      title: '',
      body: '',
      tags: 'react, css-tokens',
    })
  );
  const [composeTitle, setComposeTitle] = useState(initialDraft.title);
  const [composeBody, setComposeBody] = useState(initialDraft.body);
  const [composeCategory, setComposeCategory] = useState('React / Frontend');
  const [composeTagsInput, setComposeTagsInput] = useState(initialDraft.tags || 'react, css-tokens');
  const [composeIncludeCode, setComposeIncludeCode] = useState(false);
  const [composeHtml, setComposeHtml] = useState('');
  const [composeCss, setComposeCss] = useState('');
  const [composeJs, setComposeJs] = useState('');
  const [composePreviewLive, setComposePreviewLive] = useState(false);
  const [composeIncludeImages, setComposeIncludeImages] = useState(false);
  const [composeImages, setComposeImages] = useState<CommunityPostImage[]>([]);
  const [composeImageUrl, setComposeImageUrl] = useState('');
  const [composeIncludePoll, setComposeIncludePoll] = useState(false);
  const [composePollQuestion, setComposePollQuestion] = useState('');
  const [composePollOptions, setComposePollOptions] = useState<string[]>(['', '']);
  const [submittingPost, setSubmittingPost] = useState(false);

  const [pollVotes, setPollVotes] = useState<Record<string, string>>(() =>
    loadJsonFromStorage<Record<string, string>>(LOCAL_POLL_VOTES_KEY, {})
  );
  const [moderation, setModeration] = useState<ModerationPrefs>(() =>
    loadJsonFromStorage<ModerationPrefs>(LOCAL_MODERATION_KEY, {
      hiddenPostIds: [],
      mutedHandles: [],
      blockedHandles: [],
    })
  );
  const [openMenuPostId, setOpenMenuPostId] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<CommunityPostImage | null>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [readNotifIds, setReadNotifIds] = useState<string[]>(() =>
    loadJsonFromStorage<string[]>(LOCAL_NOTIF_READ_KEY, [])
  );
  const [onboardingDismissed, setOnboardingDismissed] = useState<boolean>(() =>
    loadJsonFromStorage<boolean>(LOCAL_ONBOARDING_KEY, false)
  );

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

  useEffect(() => {
    try {
      window.localStorage.setItem(LOCAL_POLL_VOTES_KEY, JSON.stringify(pollVotes));
    } catch {
      return;
    }
  }, [pollVotes]);

  useEffect(() => {
    try {
      window.localStorage.setItem(LOCAL_MODERATION_KEY, JSON.stringify(moderation));
    } catch {
      return;
    }
  }, [moderation]);

  useEffect(() => {
    try {
      window.localStorage.setItem(LOCAL_NOTIF_READ_KEY, JSON.stringify(readNotifIds));
    } catch {
      return;
    }
  }, [readNotifIds]);

  useEffect(() => {
    try {
      window.localStorage.setItem(LOCAL_ONBOARDING_KEY, JSON.stringify(onboardingDismissed));
    } catch {
      return;
    }
  }, [onboardingDismissed]);

  useEffect(() => {
    try {
      const draft: ComposeDraft = {
        title: composeTitle,
        body: composeBody,
        tags: composeTagsInput,
      };
      window.localStorage.setItem(LOCAL_DRAFT_KEY, JSON.stringify(draft));
    } catch {
      return;
    }
  }, [composeTitle, composeBody, composeTagsInput]);

  const seedFallbackById = useMemo(() => {
    const map = new Map<
      string,
      { demoSnippet?: CommunityShowcaseSnippet; answers: CommunityAnswer[] }
    >();
    const rawChannels =
      (communitySeedJson as { channels?: Record<string, Array<Record<string, unknown>>> })
        .channels || {};
    for (const list of Object.values(rawChannels)) {
      for (const item of list || []) {
        const id = String(item.id || '');
        if (!id) continue;
        const answers: CommunityAnswer[] = [];
        if (item.acceptedAnswer && typeof item.acceptedAnswer === 'object') {
          answers.push(item.acceptedAnswer as CommunityAnswer);
        }
        if (Array.isArray(item.answers)) {
          for (const ans of item.answers as CommunityAnswer[]) {
            if (!answers.some((existing) => existing.id === ans.id)) {
              answers.push(ans);
            }
          }
        }
        map.set(id, {
          demoSnippet: item.demoSnippet as CommunityShowcaseSnippet | undefined,
          answers,
        });
      }
    }
    return map;
  }, []);

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
        const seedMeta = seedFallbackById.get(sp.id);
        const mergedAnswers: CommunityAnswer[] = Array.isArray(sp.answers) ? [...sp.answers] : [];
        if (seedMeta?.answers) {
          for (const sa of seedMeta.answers) {
            if (!mergedAnswers.some((existing) => existing.id === sa.id)) {
              mergedAnswers.push(sa);
            }
          }
        }
        map.set(sp.id, {
          ...sp,
          demoSnippet: sp.demoSnippet || seedMeta?.demoSnippet,
          answers: mergedAnswers,
        });
      }
    }
    const list = Array.from(map.values());
    // Attach default community poll to the first Q&A post if no post defines a poll yet
    if (list.length > 0 && !list.some((p) => Boolean(p.poll))) {
      const targetIdx = list.findIndex((p) => p.channel === 'qa');
      const idx = targetIdx >= 0 ? targetIdx : 0;
      list[idx] = { ...list[idx], poll: DEFAULT_SEED_POLL };
    }
    return list;
  }, [communityPosts, localPosts, seedFallbackById]);

  const moderatedPosts = useMemo<CommunityPost[]>(() => {
    const hiddenSet = new Set(moderation.hiddenPostIds);
    const mutedSet = new Set(moderation.mutedHandles.map((h) => h.toLowerCase()));
    const blockedSet = new Set(moderation.blockedHandles.map((h) => h.toLowerCase()));
    return allPosts.filter((p) => {
      if (hiddenSet.has(p.id)) return false;
      const h = p.author.handle.toLowerCase();
      if (mutedSet.has(h) || blockedSet.has(h)) return false;
      return true;
    });
  }, [allPosts, moderation]);

  const hiddenByModerationCount = allPosts.length - moderatedPosts.length;

  const getPostAnswers = useCallback(
    (post: CommunityPost): CommunityAnswer[] => {
      const blockedSet = new Set(moderation.blockedHandles.map((h) => h.toLowerCase()));
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
      return list.filter((ans) => !blockedSet.has(ans.author.handle.toLowerCase()));
    },
    [localReplies, localAcceptedMap, moderation.blockedHandles]
  );

  const getPostScore = useCallback(
    (post: CommunityPost): number => {
      return basePostVotes(post) + (isItemLiked(post.id) ? 1 : 0);
    },
    [isItemLiked]
  );

  const demoPosts = useMemo(() => allPosts.filter((p) => Boolean(p.demoSnippet)), [allPosts]);

  const savedCommunityPosts = useMemo(
    () => allPosts.filter((p) => savedItemIds.includes(p.id)),
    [allPosts, savedItemIds]
  );

  const totalCommentsCount = useMemo(
    () => allPosts.reduce((acc, post) => acc + getPostAnswers(post).length, 0),
    [allPosts, getPostAnswers]
  );

  const channelCounts = useMemo<Record<ChannelFilterId, number>>(() => {
    const counts: Record<ChannelFilterId, number> = {
      all: allPosts.length,
      qa: 0,
      showcase: 0,
      drops: 0,
      clubs: 0,
      exams: allPosts.filter((p) =>
        p.tags.some((t) => ['de-thi', 'hoc-lieu', 'exam'].includes(t.toLowerCase()))
      ).length,
      saved: savedCommunityPosts.length,
    };
    for (const post of allPosts) {
      if (post.channel === 'qa' || post.channel === 'showcase' || post.channel === 'drops' || post.channel === 'clubs') {
        counts[post.channel] += 1;
      }
    }
    return counts;
  }, [allPosts, savedCommunityPosts.length]);

  const handleSelectChannel = useCallback((channelId: ChannelFilterId) => {
    setActiveChannel(channelId);
    if (channelId === 'saved') {
      setFeedTab('saved');
    } else {
      setFeedTab((prev) => (prev === 'saved' ? 'all' : prev));
    }
  }, []);

  const handleSelectFeedTab = useCallback((tabId: FeedTabId) => {
    setFeedTab(tabId);
    if (tabId === 'saved') {
      setActiveChannel('saved');
    } else {
      setActiveChannel((prev) => (prev === 'saved' ? 'all' : prev));
    }
  }, []);

  const toggleFollowHandle = useCallback((handle: string) => {
    const clean = handle.trim().toLowerCase().replace(/^@/, '');
    if (!clean) return;
    setFollowingHandles((prev) => {
      const exists = prev.some((h) => h.toLowerCase() === clean);
      const next = exists ? prev.filter((h) => h.toLowerCase() !== clean) : [...prev, clean];
      try {
        window.localStorage.setItem(FOLLOWING_STORAGE_KEY, JSON.stringify(next));
      } catch {
        void 0;
      }
      return next;
    });
  }, []);

  const feedTabItems = useMemo<LiquidTabItem[]>(
    () => [
      { id: 'all', label: 'Dành cho bạn', count: allPosts.length },
      { id: 'following', label: 'Đang theo dõi' },
      { id: 'newest', label: 'Mới nhất' },
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

  const chatRoomPeople = useMemo<ChatRoomPerson[]>(
    () =>
      topContributors.slice(0, 4).map((c, idx) => ({
        id: `cm-cr-${c.handle}`,
        name: c.name,
        role: c.role || 'Thành viên',
        initials: authorInitials(c.name),
        hue: CHAT_HUES[idx % CHAT_HUES.length],
        speaking: idx < 2,
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
      return (
        haystack.includes('react') ||
        haystack.includes('frontend') ||
        haystack.includes('component')
      );
    }
    if (topic === 'css-tokens') {
      return (
        haystack.includes('token') ||
        haystack.includes('css') ||
        haystack.includes('tailwind') ||
        haystack.includes('design')
      );
    }
    if (topic === 'motion') {
      return (
        haystack.includes('motion') ||
        haystack.includes('glass') ||
        haystack.includes('3d') ||
        haystack.includes('spotlight')
      );
    }
    if (topic === 'performance') {
      return (
        haystack.includes('performance') ||
        haystack.includes('virtual') ||
        haystack.includes('fps') ||
        haystack.includes('cpu')
      );
    }
    if (topic === 'agent-rules') {
      return (
        haystack.includes('agent') ||
        haystack.includes('rule') ||
        haystack.includes('prompt') ||
        haystack.includes('clean')
      );
    }
    if (topic === 'clubs') {
      return (
        post.channel === 'clubs' || haystack.includes('club') || haystack.includes('dossier')
      );
    }
    return haystack.includes(topic.toLowerCase());
  }, []);

  const visiblePosts = useMemo<CommunityPost[]>(() => {
    let pool = moderatedPosts;

    if (activeChannel === 'saved' || feedTab === 'saved') {
      pool = pool.filter((p) => savedItemIds.includes(p.id));
    } else if (activeChannel === 'exams') {
      pool = pool.filter((p) =>
        p.tags.some((t) => ['de-thi', 'hoc-lieu', 'exam'].includes(t.toLowerCase()))
      );
    } else if (activeChannel !== 'all') {
      pool = pool.filter((p) => p.channel === activeChannel);
    }

    if (feedTab === 'demos') {
      pool = pool.filter((p) => Boolean(p.demoSnippet));
    }

    if (feedTab === 'following') {
      const followedSet = new Set(followingHandles.map((h) => h.toLowerCase()));
      pool = pool.filter((p) => followedSet.has(p.author.handle.toLowerCase()));
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

    const interestTags = Array.from(
      new Set(
        allPosts
          .filter((p) => savedItemIds.includes(p.id))
          .flatMap((p) => p.tags.map((t) => t.toLowerCase()))
      )
    );
    const personalization = { followedHandles: followingHandles, interestTags };
    const rank = (post: CommunityPost) =>
      computeFeedScore(
        {
          createdAt: post.createdAt,
          votes: getPostScore(post),
          comments: getPostAnswers(post).length,
          hasAccepted: getPostAnswers(post).some((a) => a.isAccepted),
          bookmarks: savedItemIds.includes(post.id) ? 1 : 0,
          authorHandle: post.author.handle,
          tags: post.tags,
        },
        personalization
      );
    return [...pool].sort((a, b) => {
      if (feedTab === 'trending' || sortMode === 'top') {
        const diff = rank(b) - rank(a);
        if (diff !== 0) return diff;
      }
      if (sortMode === 'discussed') {
        const diff = getPostAnswers(b).length - getPostAnswers(a).length;
        if (diff !== 0) return diff;
      }
      return Date.parse(b.createdAt) - Date.parse(a.createdAt);
    });
  }, [
    moderatedPosts,
    allPosts,
    activeChannel,
    feedTab,
    followingHandles,
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

  const notifications = useMemo<CommunityNotificationItem[]>(() => {
    const readSet = new Set(readNotifIds);
    const items: CommunityNotificationItem[] = [];
    const firstQa = moderatedPosts.find((p) => p.channel === 'qa') || moderatedPosts[0];
    const firstDemo = moderatedPosts.find((p) => Boolean(p.demoSnippet)) || moderatedPosts[0];
    const pollPost = moderatedPosts.find((p) => Boolean(p.poll)) || moderatedPosts[0];

    if (firstQa) {
      const replies = getPostAnswers(firstQa);
      const latest = replies[replies.length - 1];
      items.push({
        id: `notif-reply-${firstQa.id}-${replies.length}`,
        group: 'replies',
        postId: firstQa.id,
        title: latest
          ? `${latest.author.name} vừa phản hồi trong chủ đề`
          : 'Chủ đề hỏi đáp có thảo luận mới',
        detail: whiteLabelText(firstQa.title),
        timeLabel: '2 giờ trước',
        read: readSet.has(`notif-reply-${firstQa.id}-${replies.length}`),
      });
    }

    if (firstDemo) {
      items.push({
        id: `notif-vote-${firstDemo.id}`,
        group: 'votes',
        postId: firstDemo.id,
        title: `${getPostScore(firstDemo)} thành viên đã tán thành mã chạy thử`,
        detail: whiteLabelText(firstDemo.title),
        timeLabel: '4 giờ trước',
        read: readSet.has(`notif-vote-${firstDemo.id}`),
      });
    }

    if (pollPost && pollPost.poll) {
      items.push({
        id: `notif-poll-${pollPost.id}`,
        group: 'community',
        postId: pollPost.id,
        title: 'Thăm dò cộng đồng đang mở bình chọn',
        detail: pollPost.poll.question,
        timeLabel: 'Hôm nay',
        read: readSet.has(`notif-poll-${pollPost.id}`),
      });
    }

    if (savedCommunityPosts[0]) {
      items.push({
        id: `notif-saved-${savedCommunityPosts[0].id}`,
        group: 'votes',
        postId: savedCommunityPosts[0].id,
        title: 'Bài viết đã lưu có cập nhật mới',
        detail: whiteLabelText(savedCommunityPosts[0].title),
        timeLabel: 'Hôm qua',
        read: readSet.has(`notif-saved-${savedCommunityPosts[0].id}`),
      });
    }

    return items;
  }, [moderatedPosts, readNotifIds, getPostAnswers, getPostScore, savedCommunityPosts]);

  const unreadNotifCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  useEffect(() => {
    try {
      window.localStorage.setItem(UNREAD_NOTIF_STORAGE_KEY, String(unreadNotifCount));
      window.dispatchEvent(new CustomEvent('ff:community-unread', { detail: unreadNotifCount }));
    } catch {
      void 0;
    }
  }, [unreadNotifCount]);

  useEffect(() => {
    const handleAction = (action: string | null) => {
      if (action === 'compose') {
        setComposerOpen(true);
      } else if (action === 'notifications') {
        setNotificationsOpen(true);
      }
    };
    try {
      const pending = window.sessionStorage.getItem('ff_community_post_id');
      if (pending) {
        setSelectedPostId(pending);
        setOpenCommentDrawers((prev) => ({ ...prev, [pending]: true }));
        window.sessionStorage.removeItem('ff_community_post_id');
      }
      const pendingAction = window.sessionStorage.getItem('ff_community_action');
      if (pendingAction) {
        window.sessionStorage.removeItem('ff_community_action');
        handleAction(pendingAction);
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
    const onActionEvent = (event: Event) => {
      const detail = (event as CustomEvent<string>).detail;
      if (typeof detail === 'string') {
        handleAction(detail);
      }
    };
    window.addEventListener('ff:community-post', onPostEvent);
    window.addEventListener('ff:community-action', onActionEvent);
    return () => {
      window.removeEventListener('ff:community-post', onPostEvent);
      window.removeEventListener('ff:community-action', onActionEvent);
    };
  }, []);

  useEffect(() => {
    if (!openMenuPostId) return;
    const onDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target?.closest('.cm-mod-menu-wrap')) {
        setOpenMenuPostId(null);
      }
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [openMenuPostId]);

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

  const handleVotePoll = useCallback(
    (postId: string, optionId: string) => {
      setPollVotes((prev) => ({
        ...prev,
        [postId]: prev[postId] === optionId ? '' : optionId,
      }));
    },
    []
  );

  const handleHidePost = useCallback(
    (post: CommunityPost) => {
      setOpenMenuPostId(null);
      setModeration((prev) => ({
        ...prev,
        hiddenPostIds: prev.hiddenPostIds.includes(post.id)
          ? prev.hiddenPostIds
          : [...prev.hiddenPostIds, post.id],
      }));
      addToast({
        type: 'info',
        title: 'Đã ẩn bài viết',
        message: whiteLabelText(post.title),
      });
    },
    [addToast]
  );

  const handleMuteAuthor = useCallback(
    (handle: string, name: string) => {
      const clean = handle.toLowerCase();
      setOpenMenuPostId(null);
      setModeration((prev) => ({
        ...prev,
        mutedHandles: prev.mutedHandles.includes(clean)
          ? prev.mutedHandles
          : [...prev.mutedHandles, clean],
      }));
      addToast({
        type: 'info',
        title: `Đã tắt tiếng @${handle}`,
        message: `Bài viết của ${name} được ẩn khỏi bảng tin.`,
      });
    },
    [addToast]
  );

  const handleBlockAuthor = useCallback(
    (handle: string, name: string) => {
      const clean = handle.toLowerCase();
      setOpenMenuPostId(null);
      setModeration((prev) => ({
        ...prev,
        blockedHandles: prev.blockedHandles.includes(clean)
          ? prev.blockedHandles
          : [...prev.blockedHandles, clean],
      }));
      addToast({
        type: 'warning',
        title: `Đã chặn @${handle}`,
        message: `Bài viết và bình luận của ${name} đã bị ẩn.`,
      });
    },
    [addToast]
  );

  const handleResetModeration = useCallback(() => {
    setModeration({ hiddenPostIds: [], mutedHandles: [], blockedHandles: [] });
    addToast({
      type: 'success',
      title: 'Đã khôi phục nội dung đã ẩn',
    });
  }, [addToast]);

  const handleMarkAllNotifRead = useCallback(() => {
    setReadNotifIds((prev) => Array.from(new Set([...prev, ...notifications.map((n) => n.id)])));
  }, [notifications]);

  const handleSelectNotification = useCallback(
    (item: CommunityNotificationItem) => {
      setReadNotifIds((prev) => (prev.includes(item.id) ? prev : [...prev, item.id]));
      setNotificationsOpen(false);
      focusAndScrollToPost(item.postId, item.group === 'replies');
    },
    [focusAndScrollToPost]
  );

  const handleComposeImageFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      const slotsLeft = Math.max(0, MAX_COMPOSE_IMAGES - composeImages.length);
      if (slotsLeft === 0) {
        addToast({ type: 'warning', title: 'Tối đa 4 ảnh cho mỗi bài viết' });
        return;
      }
      const picked = Array.from(files)
        .filter((f) => f.type.startsWith('image/'))
        .slice(0, slotsLeft);
      if (picked.length === 0) return;
      try {
        const encoded = await Promise.all(
          picked.map(async (file, idx) => ({
            id: `img-${Date.now()}-${idx}`,
            url: await compressImageFile(file),
            alt: file.name.replace(/\.[^.]+$/, '') || `Ảnh đính kèm ${idx + 1}`,
          }))
        );
        setComposeImages((prev) => [...prev, ...encoded].slice(0, MAX_COMPOSE_IMAGES));
      } catch {
        addToast({ type: 'error', title: 'Không thể xử lý tệp ảnh vừa chọn' });
      }
    },
    [composeImages.length, addToast]
  );

  const handleAddComposeImageUrl = useCallback(() => {
    const clean = composeImageUrl.trim();
    if (!clean) return;
    if (!/^https?:\/\/\S+$/i.test(clean)) {
      addToast({ type: 'warning', title: 'Nhập liên kết ảnh bắt đầu bằng https://' });
      return;
    }
    if (composeImages.length >= MAX_COMPOSE_IMAGES) {
      addToast({ type: 'warning', title: 'Tối đa 4 ảnh cho mỗi bài viết' });
      return;
    }
    setComposeImages((prev) => [
      ...prev,
      {
        id: `img-url-${Date.now()}`,
        url: clean,
        alt: `Ảnh minh họa ${prev.length + 1}`,
      },
    ]);
    setComposeImageUrl('');
  }, [composeImageUrl, composeImages.length, addToast]);

  const handleRemoveComposeImage = useCallback((id: string) => {
    setComposeImages((prev) => prev.filter((img) => img.id !== id));
  }, []);

  const handleUpdatePollOption = useCallback((index: number, value: string) => {
    setComposePollOptions((prev) => prev.map((opt, i) => (i === index ? value : opt)));
  }, []);

  const handleAddPollOption = useCallback(() => {
    setComposePollOptions((prev) => (prev.length >= 4 ? prev : [...prev, '']));
  }, []);

  const handleRemovePollOption = useCallback((index: number) => {
    setComposePollOptions((prev) => (prev.length <= 2 ? prev : prev.filter((_, i) => i !== index)));
  }, []);

  const handlePublishGreeting = useCallback(
    (payload: { title: string; body: string; tags: string[] }) => {
      const greetingPost: CommunityPost = {
        id: `post-hello-${Date.now()}`,
        channel: 'qa',
        title: payload.title,
        body: payload.body,
        description: payload.body,
        category: 'Giới thiệu thành viên',
        tags: payload.tags,
        createdAt: new Date().toISOString(),
        votes: 1,
        likes: 1,
        views: 1,
        author: {
          id: currentUser?.id || 'guest-builder',
          name: formatUserDisplayName(currentUser?.name, 'Thành viên mới'),
          handle: currentUser?.username || 'builder_vn',
          role: currentUser?.role === 'admin' ? 'Điều hành' : 'Thành viên',
        },
        answers: [],
      };
      setLocalPosts((prev) => [greetingPost, ...prev]);
      setSelectedPostId(greetingPost.id);
      addToast({
        type: 'success',
        title: 'Đã đăng bài chào hỏi đầu tiên',
        message: greetingPost.title,
      });
    },
    [currentUser, addToast]
  );

  const openQuickComposer = useCallback(
    (mode: 'default' | 'showcase' | 'qa' | 'workspace' | 'poll' | 'images') => {
      if (mode === 'showcase') {
        setComposeChannel('showcase');
        setComposeCategory('Components');
        setComposeIncludeCode(true);
        setComposePreviewLive(true);
      } else if (mode === 'qa') {
        setComposeChannel('qa');
        setComposeCategory('React / Frontend');
        setComposeIncludeCode(false);
        setComposePreviewLive(false);
      } else if (mode === 'workspace') {
        setComposeChannel('showcase');
        setComposeCategory('Components');
        handlePrefillFromWorkspace();
      } else if (mode === 'poll') {
        setComposeChannel('qa');
        setComposeCategory('React / Frontend');
        setComposeIncludePoll(true);
      } else if (mode === 'images') {
        setComposeChannel('showcase');
        setComposeCategory('UI/UX & Tokens');
        setComposeIncludeImages(true);
      } else if (activeChannel === 'qa') {
        setComposeChannel('qa');
        setComposeCategory('React / Frontend');
        setComposeIncludeCode(false);
      } else if (activeChannel === 'showcase') {
        setComposeChannel('showcase');
        setComposeCategory('Components');
        setComposeIncludeCode(true);
      } else if (activeChannel === 'drops') {
        setComposeChannel('drops');
        setComposeCategory('Agent Rules');
        setComposeIncludeCode(false);
      } else if (activeChannel === 'clubs') {
        setComposeChannel('clubs');
        setComposeCategory('Hội nhóm');
        setComposeIncludeCode(false);
      }
      setComposerOpen(true);
    },
    [activeChannel, handlePrefillFromWorkspace]
  );

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

    const verdict = moderateFields([titleTrimmed, composeBody, composeTagsInput], 'post');
    if (!verdict.ok) {
      addToast({ type: 'error', title: 'Bài viết bị chặn', message: verdict.message });
      return;
    }

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

    const validPollOptions = composePollOptions
      .map((opt) => opt.trim())
      .filter(Boolean)
      .slice(0, 4);
    const poll: CommunityPoll | undefined =
      composeIncludePoll && validPollOptions.length >= 2
        ? {
            question: composePollQuestion.trim() || titleTrimmed,
            closesLabel: 'Đang mở',
            options: validPollOptions.map((label, idx) => ({
              id: `opt-${Date.now()}-${idx}`,
              label,
              votes: 0,
            })),
          }
        : undefined;

    const images: CommunityPostImage[] | undefined =
      composeImages.length > 0 ? composeImages.slice(0, MAX_COMPOSE_IMAGES) : undefined;

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
        name: formatUserDisplayName(currentUser?.name, 'Thành viên'),
        handle: currentUser?.username || 'builder_vn',
        role: currentUser?.role === 'admin' ? 'Điều hành' : 'Thành viên',
      },
      demoSnippet,
      images,
      poll,
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
            images: localNewPost.images,
            poll: localNewPost.poll,
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
      if (
        activeChannel === 'saved' ||
        (activeChannel !== 'all' && activeChannel !== finalPost.channel)
      ) {
        setActiveChannel(finalPost.channel);
      }
      setComposeTitle('');
      setComposeBody('');
      setComposeHtml('');
      setComposeCss('');
      setComposeJs('');
      setComposeIncludeCode(false);
      setComposePreviewLive(false);
      setComposeIncludeImages(false);
      setComposeImages([]);
      setComposeImageUrl('');
      setComposeIncludePoll(false);
      setComposePollQuestion('');
      setComposePollOptions(['', '']);
      setComposerOpen(false);
      try {
        window.localStorage.removeItem(LOCAL_DRAFT_KEY);
      } catch {
        void 0;
      }

      addToast({
        type: 'success',
        title: 'Đã đăng bài chia sẻ',
        message: finalPost.title,
      });
    } finally {
      setSubmittingPost(false);
    }
  };

  const handleSubmitComment = async (event: React.FormEvent<HTMLFormElement>, post: CommunityPost) => {
    event.preventDefault();
    const formEl = event.currentTarget;
    const draft = (replyDrafts[post.id] || '').trim();
    if (!draft) return;

    const verdict = moderateFields([draft], 'comment');
    if (!verdict.ok) {
      addToast({ type: 'error', title: 'Bình luận bị chặn', message: verdict.message });
      return;
    }

    setSubmittingReplyId(post.id);
    const replyTarget = replyTargets[post.id];
    const finalContent = replyTarget ? `@${replyTarget.authorName} ${draft}` : draft;
    const now = new Date().toISOString();
    const newAnswer: CommunityAnswer = {
      id: `ans-local-${Date.now()}`,
      author: {
        id: currentUser?.id || 'guest-builder',
        name: formatUserDisplayName(currentUser?.name, 'Thành viên'),
        handle: currentUser?.username || 'builder_vn',
        role: currentUser?.role === 'admin' ? 'Điều hành' : 'Thành viên',
      },
      createdAt: now,
      votes: 1,
      content: finalContent,
      ...(replyTarget ? { parentId: replyTarget.answerId } : {}),
    } as CommunityAnswer;

    try {
      setLocalReplies((prev) => ({
        ...prev,
        [post.id]: [...(prev[post.id] || []), newAnswer],
      }));
      setReplyDrafts((prev) => ({ ...prev, [post.id]: '' }));
      setReplyTargets((prev) => ({ ...prev, [post.id]: null }));
      setOpenCommentDrawers((prev) => ({ ...prev, [post.id]: true }));
      const textareaEl = formEl.querySelector('textarea');
      if (textareaEl) {
        textareaEl.style.height = '';
      }

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
    setActiveChannel('all');
    setSelectedTopic('all');
    setAuthorFilter(null);
    setSearchQuery('');
    setSortMode('newest');
  }, []);

  const hasActiveFilter =
    feedTab !== 'all' ||
    activeChannel !== 'all' ||
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

  const [mode, setMode] = useState<'feed' | 'chat'>('feed');

  if (mode === 'chat') {
    return (
      <div className="cm">
        <div className="wrap-wide">
          <div className="cm-mode-switch" role="tablist" aria-label="Chế độ Tri thức">
            <button type="button" role="tab" aria-selected={false} onClick={() => setMode('feed')}>Bảng tin</button>
            <button type="button" role="tab" aria-selected onClick={() => setMode('chat')}>Phòng chat</button>
          </div>
          <CommunityChatRoom
            currentHandle={currentUser?.username || 'builder_vn'}
            currentName={formatUserDisplayName(currentUser?.name, 'Thành viên')}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="cm">
      <div className="wrap-wide cm-mode-wrap">
        <div className="cm-mode-switch" role="tablist" aria-label="Chế độ Tri thức">
          <button type="button" role="tab" aria-selected onClick={() => setMode('feed')}>Bảng tin</button>
          <button type="button" role="tab" aria-selected={false} onClick={() => setMode('chat')}>Phòng chat</button>
        </div>
      </div>
      <div className="wrap-wide cm-shell">
        <aside className="cm-rail-left" aria-label="Danh sách kênh Tri thức">
          <div className="cm-channels-panel">
            <span className="t-caps cm-channels-heading">Kênh Tri thức</span>
            <nav className="cm-channels-nav" aria-label="Chọn kênh">
              {CHANNEL_ITEMS.map((channel) => {
                const active = activeChannel === channel.id;
                return (
                  <button
                    key={channel.id}
                    type="button"
                    className="cm-channel-btn"
                    aria-current={active ? 'page' : undefined}
                    data-active={active ? 'true' : undefined}
                    onClick={() => handleSelectChannel(channel.id)}
                  >
                    <span className="cm-channel-label">
                      <Hash size={14} className="cm-channel-hash" aria-hidden="true" />
                      <span>{channel.label}</span>
                    </span>
                    <span className="cm-channel-count">{channelCounts[channel.id]}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        <main className="cm-main" aria-label="Luồng bài viết Tri thức">
          <header className="cm-hero-bar">
            <div className="cm-hero-top">
              <div className="cm-hero-title-group">
                <h1 className="cm-page-title">Tri thức</h1>
                <span className="cm-count">{visiblePosts.length} bài</span>
              </div>
              <div className="cm-hero-actions">
                <button
                  type="button"
                  className="cm-icon-btn cm-bell-btn"
                  aria-label={
                    unreadNotifCount > 0
                      ? `Thông báo (${unreadNotifCount} chưa đọc)`
                      : 'Thông báo'
                  }
                  title="Thông báo cộng đồng"
                  onClick={() => setNotificationsOpen(true)}
                >
                  <Bell size={17} aria-hidden="true" />
                  {unreadNotifCount > 0 && (
                    <span className="cm-bell-dot" aria-hidden="true" />
                  )}
                </button>
                <button
                  type="button"
                  className="btn btn-red btn-sm cm-write-btn"
                  onClick={() => openQuickComposer('default')}
                >
                  Viết bài
                </button>
              </div>
            </div>

            <div className="cm-search-row">
              <div className="cm-search-box">
                <SearchCard
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Tìm bài viết, mã mẫu, thẻ hoặc @tác_giả..."
                  recentSearches={recentSearches}
                  onSelectRecent={(q) => {
                    setSearchQuery(q);
                    recordRecentSearch(q);
                  }}
                />
              </div>

              <div className="cm-sort-group" role="group" aria-label="Sắp xếp bài viết">
                <button
                  type="button"
                  className="cm-sort-btn"
                  aria-pressed={sortMode === 'newest'}
                  onClick={() => setSortMode('newest')}
                >
                  Mới
                </button>
                <button
                  type="button"
                  className="cm-sort-btn"
                  aria-pressed={sortMode === 'top'}
                  onClick={() => setSortMode('top')}
                >
                  Nổi bật / Đề xuất
                </button>
                <button
                  type="button"
                  className="cm-sort-btn"
                  aria-pressed={sortMode === 'discussed'}
                  onClick={() => setSortMode('discussed')}
                >
                  Thảo luận sôi nổi
                </button>
              </div>
            </div>

            <div className="cm-nav-strip">
              <div className="cm-feed-tabs">
                <LiquidTabs
                  tabs={feedTabItems}
                  activeId={feedTab}
                  onChange={(id) => handleSelectFeedTab(id as FeedTabId)}
                  ariaLabel="Kênh bảng tin"
                />
              </div>
            </div>

            <div className="cm-topics-strip">
              <Chips
                items={TOPIC_CHIPS}
                selectedIds={[selectedTopic]}
                onToggle={handleToggleTopic}
                multi={false}
                variant="filter"
                theme={theme}
              />
            </div>

            {hasActiveFilter && (
              <div className="cm-active-filters">
                {activeChannel !== 'all' && activeChannel !== 'saved' && (
                  <span className="cm-filter-pill">
                    #{CHANNEL_ITEMS.find((c) => c.id === activeChannel)?.label || activeChannel}
                  </span>
                )}
                {feedTab !== 'all' && (
                  <span className="cm-filter-pill">
                    {feedTabItems.find((t) => t.id === feedTab)?.label}
                  </span>
                )}
                {selectedTopic !== 'all' && (
                  <span className="cm-filter-pill">
                    {TOPIC_CHIPS.find((c) => c.id === selectedTopic)?.label || selectedTopic}
                  </span>
                )}
                {authorFilter && <span className="cm-filter-pill">@{authorFilter}</span>}
                {searchQuery.trim() && (
                  <span className="cm-filter-pill">“{searchQuery.trim()}”</span>
                )}
                <button
                  type="button"
                  className="cm-clear-btn"
                  onClick={clearAllFilters}
                >
                  Đặt lại
                </button>
              </div>
            )}
          </header>

          {!onboardingDismissed && (
            <CommunityOnboardingCard
              followingHandles={followingHandles}
              onToggleFollow={toggleFollowHandle}
              onSelectInterestTopic={setSelectedTopic}
              onSelectChannel={(ch) => handleSelectChannel(ch)}
              onPublishGreeting={handlePublishGreeting}
              onDismiss={() => setOnboardingDismissed(true)}
            />
          )}

          {hiddenByModerationCount > 0 && (
            <div className="cm-mod-banner" role="status">
              <span className="cm-mod-banner-text">
                Đang lọc kiểm duyệt: {moderation.hiddenPostIds.length} bài ẩn
                {moderation.mutedHandles.length > 0
                  ? ` · ${moderation.mutedHandles.length} tắt tiếng`
                  : ''}
                {moderation.blockedHandles.length > 0
                  ? ` · ${moderation.blockedHandles.length} đã chặn`
                  : ''}
              </span>
              <button
                type="button"
                className="cm-clear-btn"
                onClick={handleResetModeration}
              >
                Khôi phục tất cả
              </button>
            </div>
          )}

          <section className="cm-quick-composer" aria-label="Tạo bài viết nhanh">
            <div className="cm-quick-composer-top">
              <span className="cm-avatar-chip" aria-hidden="true">
                {authorInitials(formatUserDisplayName(currentUser?.name, 'Thành viên'))}
              </span>
              <button
                type="button"
                className="cm-quick-prompt-btn"
                onClick={() => openQuickComposer('default')}
              >
                Bạn vừa dựng gì hay muốn mổ xẻ lỗi nào?
              </button>
            </div>
            <div className="cm-quick-composer-actions">
              <button
                type="button"
                className="cm-quick-action-btn"
                onClick={() => openQuickComposer('showcase')}
              >
                <Code2 size={15} aria-hidden="true" />
                <span>Chia sẻ demo</span>
              </button>
              <button
                type="button"
                className="cm-quick-action-btn"
                onClick={() => openQuickComposer('images')}
              >
                <ImageIcon size={15} aria-hidden="true" />
                <span>Ảnh (tối đa 4)</span>
              </button>
              <button
                type="button"
                className="cm-quick-action-btn"
                onClick={() => openQuickComposer('poll')}
              >
                <BarChart3 size={15} aria-hidden="true" />
                <span>Thăm dò</span>
              </button>
              <button
                type="button"
                className="cm-quick-action-btn"
                onClick={() => openQuickComposer('qa')}
              >
                <HelpCircle size={15} aria-hidden="true" />
                <span>Hỏi kỹ thuật</span>
              </button>
              <button
                type="button"
                className="cm-quick-action-btn"
                onClick={() => openQuickComposer('workspace')}
              >
                <ArrowUpRight size={15} aria-hidden="true" />
                <span>Nạp từ Workspace</span>
              </button>
            </div>
          </section>

          {visiblePosts.length === 0 ? (
            <div className="cm-empty">
              <h2 className="cm-empty-title">Không tìm thấy bài viết phù hợp</h2>
              <p className="cm-post-body">
                Thử đổi kênh, xóa từ khóa lọc hoặc đăng bài chia sẻ mới.
              </p>
              <div className="cm-empty-actions">
                <button type="button" className="btn btn-line btn-sm" onClick={clearAllFilters}>
                  Xóa bộ lọc
                </button>
                <button
                  type="button"
                  className="btn btn-red btn-sm"
                  onClick={() => setComposerOpen(true)}
                >
                  Viết bài mới
                </button>
              </div>
            </div>
          ) : (
            <>
            <ul className="cm-stream">
              {visiblePosts.map((post) => {
                const isSelected = activeReaderPost?.id === post.id;
                const answers = getPostAnswers(post);
                const score = getPostScore(post);
                const isLiked = isItemLiked(post.id);
                const isSaved = savedItemIds.includes(post.id);
                const isCommentsOpen = Boolean(openCommentDrawers[post.id]);
                const hasCodeOrPayload = Boolean(post.demoSnippet || post.payload);
                const defaultCodeMode: CodeDisplayMode =
                  post.demoSnippet && post.channel === 'showcase' ? 'live' : 'collapsed';
                const currentCodeMode: CodeDisplayMode = codeModes[post.id] ?? defaultCodeMode;
                const currentViewport: PreviewViewport = sandboxViewports[post.id] ?? 1440;
                const currentPreviewTheme: PreviewTheme = sandboxThemes[post.id] ?? theme;
                const currentNonce = sandboxNonces[post.id] ?? 0;
                const solved =
                  Boolean(post.isAccepted || post.acceptedAnswer) ||
                  answers.some((a) => a.isAccepted);
                const topAnswer = answers.find((a) => a.isAccepted) || answers[0] || null;

                const codeFileTabs: FileBoxTab[] = post.demoSnippet
                  ? [
                      {
                        id: 'html',
                        label: 'index.html',
                        meta: `${post.demoSnippet.html.split(/\r?\n/).length} dòng`,
                      },
                      ...(post.demoSnippet.css
                        ? [
                            {
                              id: 'css',
                              label: 'styles.css',
                              meta: `${post.demoSnippet.css.split(/\r?\n/).length} dòng`,
                            },
                          ]
                        : []),
                      ...(post.demoSnippet.js
                        ? [
                            {
                              id: 'js',
                              label: 'app.js',
                              meta: `${post.demoSnippet.js.split(/\r?\n/).length} dòng`,
                            },
                          ]
                        : []),
                    ]
                  : post.payload
                    ? [
                        {
                          id: 'payload',
                          label: post.fileType ? `snippet.${post.fileType}` : 'notes.md',
                          meta: `${post.payload.split(/\r?\n/).length} dòng`,
                        },
                      ]
                    : [];

                const activeCodeKey = activeCodeFiles[post.id] || codeFileTabs[0]?.id || 'html';
                const activeCodeContent = post.demoSnippet
                  ? activeCodeKey === 'css'
                    ? post.demoSnippet.css
                    : activeCodeKey === 'js'
                      ? post.demoSnippet.js || ''
                      : post.demoSnippet.html
                  : whiteLabelText(post.payload || '');

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
                        onClick={() => openUserProfile(post.author)}
                        title={`Xem trang cá nhân của ${post.author.name} (@${post.author.handle})`}
                      >
                        <span className="cm-avatar-chip" aria-hidden="true">
                          {authorInitials(post.author.name)}
                        </span>
                        <span className="cm-author-meta">
                          <span className="cm-author-name">{post.author.name}</span>
                          <span className="t-label">
                            @{post.author.handle} · {formatPostDate(post.createdAt)}
                          </span>
                        </span>
                      </button>

                      <div className="cm-post-meta-right">
                        <button
                          type="button"
                          className="cm-follow-pill"
                          aria-pressed={followingHandles.some(
                            (h) => h.toLowerCase() === post.author.handle.toLowerCase()
                          )}
                          onClick={() => toggleFollowHandle(post.author.handle)}
                        >
                          {followingHandles.some(
                            (h) => h.toLowerCase() === post.author.handle.toLowerCase()
                          )
                            ? 'Đang theo dõi'
                            : 'Theo dõi'}
                        </button>
                        <span className="cm-cat-label">{whiteLabelText(post.category)}</span>
                        {solved && <span className="cm-solved-dot">Đạt chuẩn</span>}
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

                    {post.images && post.images.length > 0 && (
                      <div
                        className="cm-gallery"
                        data-count={Math.min(4, post.images.length)}
                        aria-label={`Bộ ${post.images.length} ảnh đính kèm`}
                      >
                        {post.images.slice(0, 4).map((img) => (
                          <button
                            key={img.id}
                            type="button"
                            className="cm-gallery-item"
                            onClick={() => setLightboxImage(img)}
                            aria-label={`Phóng to ảnh ${img.alt}`}
                          >
                            <img
                              src={img.url}
                              alt={img.alt}
                              loading="lazy"
                              decoding="async"
                              referrerPolicy="no-referrer"
                            />
                          </button>
                        ))}
                      </div>
                    )}

                    {post.poll && (
                      <CommunityPollCard
                        postId={post.id}
                        poll={post.poll}
                        selectedOptionId={pollVotes[post.id] || null}
                        onVote={handleVotePoll}
                      />
                    )}

                    {post.channel === 'clubs' && post.activeDossier && (
                      <div className="cm-dossier">
                        <div className="cm-section-head">
                          <h3 className="cm-dossier-title">
                            {post.activeDossier.projectTitle}
                          </h3>
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
                        {post.tags.slice(0, 4).map((tag) => {
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
                                className="cm-pill-toggle"
                                aria-pressed={currentCodeMode === 'live'}
                                onClick={() =>
                                  setCodeModes((prev) => ({
                                    ...prev,
                                    [post.id]:
                                      currentCodeMode === 'live' ? 'collapsed' : 'live',
                                  }))
                                }
                              >
                                {currentCodeMode === 'live' ? 'Ẩn' : 'Chạy thử'}
                              </button>
                            )}
                            <button
                              type="button"
                              className="cm-pill-toggle"
                              aria-pressed={currentCodeMode === 'code'}
                              onClick={() =>
                                setCodeModes((prev) => ({
                                  ...prev,
                                  [post.id]: currentCodeMode === 'code' ? 'collapsed' : 'code',
                                }))
                              }
                            >
                              {currentCodeMode === 'code' ? 'Ẩn mã' : 'Mã nguồn'}
                            </button>
                          </div>

                          <div className="cm-sandbox-actions">
                            {currentCodeMode === 'live' && post.demoSnippet && (
                              <>
                                <button
                                  type="button"
                                  className="cm-icon-btn"
                                  aria-label={viewportTooltip(currentViewport)}
                                  title={viewportTooltip(currentViewport)}
                                  onClick={() =>
                                    setSandboxViewports((prev) => ({
                                      ...prev,
                                      [post.id]: nextViewportValue(currentViewport),
                                    }))
                                  }
                                >
                                  {currentViewport === 1440 ? (
                                    <Monitor size={15} aria-hidden="true" />
                                  ) : currentViewport === 768 ? (
                                    <Tablet size={15} aria-hidden="true" />
                                  ) : (
                                    <Smartphone size={15} aria-hidden="true" />
                                  )}
                                </button>
                                <button
                                  type="button"
                                  className="cm-icon-btn"
                                  aria-label={
                                    currentPreviewTheme === 'dark'
                                      ? 'Chuyển hộp cát sang nền sáng'
                                      : 'Chuyển hộp cát sang nền tối'
                                  }
                                  title={
                                    currentPreviewTheme === 'dark'
                                      ? 'Đổi sang nền sáng'
                                      : 'Đổi sang nền tối'
                                  }
                                  onClick={() =>
                                    setSandboxThemes((prev) => ({
                                      ...prev,
                                      [post.id]:
                                        (prev[post.id] ?? theme) === 'dark' ? 'light' : 'dark',
                                    }))
                                  }
                                >
                                  {currentPreviewTheme === 'dark' ? (
                                    <Sun size={15} aria-hidden="true" />
                                  ) : (
                                    <Moon size={15} aria-hidden="true" />
                                  )}
                                </button>
                                <button
                                  type="button"
                                  className="cm-icon-btn"
                                  aria-label="Chạy lại hộp cát"
                                  title="Chạy lại"
                                  onClick={() =>
                                    setSandboxNonces((prev) => ({
                                      ...prev,
                                      [post.id]: (prev[post.id] ?? 0) + 1,
                                    }))
                                  }
                                >
                                  <RotateCw size={15} aria-hidden="true" />
                                </button>
                              </>
                            )}

                            <button
                              type="button"
                              className="cm-icon-btn"
                              aria-label="Chép mã nguồn"
                              title={copiedCodeId === post.id ? 'Đã chép mã' : 'Chép mã'}
                              data-active={copiedCodeId === post.id ? 'true' : undefined}
                              onClick={() => void handleCopyCode(post)}
                            >
                              {copiedCodeId === post.id ? (
                                <Check size={15} aria-hidden="true" />
                              ) : (
                                <Copy size={15} aria-hidden="true" />
                              )}
                            </button>

                            <button
                              type="button"
                              className="cm-icon-btn"
                              aria-label="Mở mã nguồn trong Workspace"
                              title="Mở trong Workspace"
                              onClick={() => forkPostToWorkspace(post)}
                            >
                              <ArrowUpRight size={15} aria-hidden="true" />
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
                          <div className="cm-code-layout">
                            <div className="cm-code-filebox">
                              <FileBox
                                title="Tệp mã"
                                tabs={codeFileTabs}
                                activeId={activeCodeKey}
                                onSelect={(id) =>
                                  setActiveCodeFiles((prev) => ({
                                    ...prev,
                                    [post.id]: id,
                                  }))
                                }
                              />
                            </div>
                            <pre className="cm-code-block">{activeCodeContent}</pre>
                          </div>
                        )}
                      </div>
                    )}

                    <footer className="cm-post-foot">
                      <div className="cm-post-reactions">
                        <div className="cm-action-pair">
                          <button
                            type="button"
                            className="cm-icon-btn"
                            aria-pressed={isLiked}
                            aria-label={isLiked ? 'Bỏ tán thành' : 'Tán thành bài viết'}
                            title={isLiked ? 'Đã tán thành' : 'Tán thành'}
                            onClick={() => handleToggleVote(post)}
                          >
                            <ArrowBigUp size={18} aria-hidden="true" />
                          </button>
                          <span className="cm-count">{score}</span>
                        </div>

                        <div className="cm-action-pair">
                          <button
                            type="button"
                            className="cm-icon-btn"
                            aria-expanded={isCommentsOpen}
                            data-active={isCommentsOpen ? 'true' : undefined}
                            aria-label="Mở bình luận"
                            title="Bình luận"
                            onClick={() =>
                              setOpenCommentDrawers((prev) => ({
                                ...prev,
                                [post.id]: !prev[post.id],
                              }))
                            }
                          >
                            <MessageSquare size={16} aria-hidden="true" />
                          </button>
                          <span className="cm-count">{answers.length}</span>
                        </div>
                      </div>

                      <div className="cm-post-utilities">
                        <button
                          type="button"
                          className="cm-icon-btn"
                          aria-pressed={isSaved}
                          aria-label={isSaved ? 'Bỏ lưu bài viết' : 'Lưu bài viết'}
                          title={isSaved ? 'Đã lưu' : 'Lưu bài'}
                          onClick={() => toggleSavedItem(post.id)}
                        >
                          <Bookmark size={16} aria-hidden="true" />
                        </button>

                        <button
                          type="button"
                          className="cm-icon-btn"
                          aria-label="Chia sẻ liên kết bài viết"
                          title={copiedShareId === post.id ? 'Đã chép liên kết' : 'Chia sẻ'}
                          data-active={copiedShareId === post.id ? 'true' : undefined}
                          onClick={() => void handleSharePost(post)}
                        >
                          {copiedShareId === post.id ? (
                            <Check size={16} aria-hidden="true" />
                          ) : (
                            <Share2 size={16} aria-hidden="true" />
                          )}
                        </button>

                        <button
                          type="button"
                          className="cm-icon-btn"
                          data-active={isSelected ? 'true' : undefined}
                          aria-label="Chọn bài để Đọc sâu"
                          title={isSelected ? 'Đang mở trong Trình đọc' : 'Đọc sâu'}
                          onClick={() => setSelectedPostId(post.id)}
                        >
                          <BookOpen size={16} aria-hidden="true" />
                        </button>

                        <button
                          type="button"
                          className="cm-icon-btn"
                          aria-label="Mở trong Workspace"
                          title="Mở trong Workspace"
                          onClick={() => forkPostToWorkspace(post)}
                        >
                          <ArrowUpRight size={16} aria-hidden="true" />
                        </button>

                        <div className="cm-mod-menu-wrap">
                          <button
                            type="button"
                            className="cm-icon-btn cm-icon-btn--muted"
                            aria-haspopup="menu"
                            aria-expanded={openMenuPostId === post.id}
                            aria-label="Kiểm duyệt bài viết (Ẩn, tắt tiếng, chặn, báo cáo)"
                            title="Kiểm duyệt bài viết"
                            onClick={() =>
                              setOpenMenuPostId((prev) => (prev === post.id ? null : post.id))
                            }
                          >
                            <MoreHorizontal size={16} aria-hidden="true" />
                          </button>

                          {openMenuPostId === post.id && (
                            <div className="cm-mod-menu" role="menu" aria-label="Tác vụ kiểm duyệt">
                              <button
                                type="button"
                                role="menuitem"
                                className="cm-mod-menu-item"
                                onClick={() => handleHidePost(post)}
                              >
                                <EyeOff size={14} aria-hidden="true" />
                                <span>Ẩn bài viết</span>
                              </button>
                              <button
                                type="button"
                                role="menuitem"
                                className="cm-mod-menu-item"
                                onClick={() =>
                                  handleMuteAuthor(post.author.handle, post.author.name)
                                }
                              >
                                <VolumeX size={14} aria-hidden="true" />
                                <span>Tắt tiếng @{post.author.handle}</span>
                              </button>
                              <button
                                type="button"
                                role="menuitem"
                                className="cm-mod-menu-item cm-mod-menu-item--danger"
                                onClick={() =>
                                  handleBlockAuthor(post.author.handle, post.author.name)
                                }
                              >
                                <ShieldBan size={14} aria-hidden="true" />
                                <span>Chặn @{post.author.handle}</span>
                              </button>
                              <button
                                type="button"
                                role="menuitem"
                                className="cm-mod-menu-item cm-mod-menu-item--danger"
                                onClick={() => {
                                  setOpenMenuPostId(null);
                                  setReportTarget(post);
                                }}
                              >
                                <Flag size={14} aria-hidden="true" />
                                <span>Báo cáo bài viết</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </footer>

                    {answers.length > 0 && topAnswer && (
                      <div className="cm-thread-preview">
                        <div className="cm-thread-rail">
                          <span className="cm-thread-spine" aria-hidden="true" />
                          <button
                            type="button"
                            className="cm-avatar-chip cm-avatar-chip--sm"
                            onClick={() => openUserProfile(topAnswer.author)}
                            title={`Xem hồ sơ của ${topAnswer.author.name} (@${topAnswer.author.handle})`}
                          >
                            {authorInitials(topAnswer.author.name)}
                          </button>
                        </div>
                        <div className="cm-thread-content">
                          <div className="cm-thread-head">
                            <button
                              type="button"
                              className="cm-author-link"
                              onClick={() => openUserProfile(topAnswer.author)}
                              title={`Xem hồ sơ của ${topAnswer.author.name} (@${topAnswer.author.handle})`}
                            >
                              <span className="cm-author-name">{topAnswer.author.name}</span>
                              <span className="t-label">@{topAnswer.author.handle}</span>
                            </button>
                            {topAnswer.isAccepted && (
                              <span className="cm-solved-dot">Lời giải chuẩn</span>
                            )}
                          </div>
                          <p className="cm-thread-excerpt">{whiteLabelText(topAnswer.content)}</p>
                          <button
                            type="button"
                            className="cm-thread-more-btn"
                            aria-expanded={isCommentsOpen}
                            onClick={() =>
                              setOpenCommentDrawers((prev) => ({
                                ...prev,
                                [post.id]: !prev[post.id],
                              }))
                            }
                          >
                            {isCommentsOpen
                              ? 'Thu gọn phản hồi'
                              : `Xem toàn bộ ${answers.length} phản hồi`}
                          </button>
                        </div>
                      </div>
                    )}

                    {isCommentsOpen && (
                      <div
                        className="cm-comments-drawer"
                        aria-label={`Luồng bình luận của ${whiteLabelText(post.title)}`}
                      >
                        {answers.length === 0 ? (
                          <p className="t-label">
                            Chưa có phản hồi. Hãy để lại bình luận đầu tiên.
                          </p>
                        ) : (
                          <ul className="cm-comments-list">
                            {answers.map((ans) => {
                              const withParent = ans as CommunityAnswer & { parentId?: string };
                              let depth = 0;
                              let cur = withParent.parentId;
                              while (cur && depth < 3) {
                                depth += 1;
                                const p = answers.find((x) => x.id === cur) as
                                  | (CommunityAnswer & { parentId?: string })
                                  | undefined;
                                cur = p?.parentId;
                              }
                              return (
                                <li
                                  key={ans.id}
                                  className="cm-comment-item"
                                  data-depth={depth}
                                  data-accepted={ans.isAccepted ? 'true' : undefined}
                                >
                                  <div className="cm-comment-head">
                                    <button
                                      type="button"
                                      className="cm-author-link"
                                      onClick={() => openUserProfile(ans.author)}
                                      title={`Xem hồ sơ của ${ans.author.name} (@${ans.author.handle})`}
                                    >
                                      <span className="cm-avatar-chip cm-avatar-chip--sm" aria-hidden="true">
                                        {authorInitials(ans.author.name)}
                                      </span>
                                      <span className="cm-author-name">{ans.author.name}</span>
                                      <time className="t-label" dateTime={ans.createdAt}>
                                        {formatPostDate(ans.createdAt)}
                                      </time>
                                    </button>

                                    <div className="cm-comment-actions">
                                      <button
                                        type="button"
                                        className="cm-clear-btn"
                                        onClick={() =>
                                          setReplyTargets((prev) => ({
                                            ...prev,
                                            [post.id]: {
                                              answerId: ans.id,
                                              authorName: ans.author.handle,
                                            },
                                          }))
                                        }
                                      >
                                        Trả lời
                                      </button>
                                      {ans.isAccepted ? (
                                        <span className="cm-solved-dot">Lời giải chuẩn</span>
                                      ) : (
                                        <button
                                          type="button"
                                          className="cm-clear-btn"
                                          onClick={() => void handleAcceptSolution(post, ans.id)}
                                        >
                                          Đánh dấu chuẩn
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                  <p className="cm-comment-text">{whiteLabelText(ans.content)}</p>
                                </li>
                              );
                            })}
                          </ul>
                        )}

                        <form
                          className="cm-comment-form"
                          onSubmit={(e) => void handleSubmitComment(e, post)}
                        >
                          {replyTargets[post.id] && (
                            <div className="cm-reply-target-bar">
                              <span>
                                Đang trả lời <strong>@{replyTargets[post.id]!.authorName}</strong>
                              </span>
                              <button
                                type="button"
                                className="cm-clear-btn"
                                onClick={() =>
                                  setReplyTargets((prev) => ({ ...prev, [post.id]: null }))
                                }
                              >
                                Hủy
                              </button>
                            </div>
                          )}
                          <label htmlFor={`cm-reply-${post.id}`} className="sr-only">
                            Viết bình luận
                          </label>
                          <textarea
                            id={`cm-reply-${post.id}`}
                            rows={2}
                            className="field cm-textarea cm-reply-autogrow"
                            value={replyDrafts[post.id] || ''}
                            onChange={(e) => {
                              const el = e.currentTarget;
                              const nextValue = el.value;
                              if (!nextValue) {
                                el.style.height = '';
                              } else {
                                el.style.height = 'auto';
                                el.style.height = `${Math.min(el.scrollHeight, 220)}px`;
                              }
                              setReplyDrafts((prev) => ({
                                ...prev,
                                [post.id]: nextValue,
                              }));
                            }}
                            placeholder="Viết phản hồi kỹ thuật..."
                          />
                          <div className="cm-comment-form-row">
                            <span className="t-label">
                              @{currentUser?.username || 'builder_vn'}
                            </span>
                            <button
                              type="submit"
                              className="btn btn-red btn-sm"
                              disabled={
                                submittingReplyId === post.id ||
                                !(replyDrafts[post.id] || '').trim()
                              }
                            >
                              {submittingReplyId === post.id ? 'Đang gửi...' : 'Gửi'}
                            </button>
                          </div>
                        </form>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
            <div className="cm-end-feed" role="status">
              <span>Bạn đã xem hết bài mới</span>
            </div>
            </>
          )}
        </main>

        <aside className="cm-rail-right" aria-label="Trình đọc và tác giả nổi bật">
          <div className="cm-metrics-bar" role="group" aria-label="Chỉ số nhanh">
            <button
              type="button"
              className="cm-metric-item"
              data-active={feedTab === 'all' ? 'true' : undefined}
              onClick={() => handleSelectFeedTab('all')}
            >
              <strong>{allPosts.length}</strong>
              <span>Bài</span>
            </button>
            <button
              type="button"
              className="cm-metric-item"
              data-active={feedTab === 'demos' ? 'true' : undefined}
              onClick={() => handleSelectFeedTab('demos')}
            >
              <strong>{demoPosts.length}</strong>
              <span>Mã</span>
            </button>
            <button
              type="button"
              className="cm-metric-item"
              data-active={feedTab === 'trending' ? 'true' : undefined}
              onClick={() => handleSelectFeedTab('trending')}
            >
              <strong>{totalCommentsCount}</strong>
              <span>Bình luận</span>
            </button>
            <button
              type="button"
              className="cm-metric-item"
              data-active={feedTab === 'saved' ? 'true' : undefined}
              onClick={() => handleSelectFeedTab('saved')}
            >
              <strong>{savedCommunityPosts.length}</strong>
              <span>Đã lưu</span>
            </button>
          </div>

          {activeReaderPost && (
            <section className="cm-reader-wrap" aria-label="Trình đọc chi tiết">
              <div className="cm-reader-author-bar">
                <button
                  type="button"
                  className="cm-author-btn"
                  onClick={() => openUserProfile(activeReaderPost.author)}
                  title={`Xem trang cá nhân của ${activeReaderPost.author.name} (@${activeReaderPost.author.handle})`}
                >
                  <span className="cm-avatar-chip cm-avatar-chip--sm" aria-hidden="true">
                    {authorInitials(activeReaderPost.author.name)}
                  </span>
                  <span className="cm-author-meta">
                    <span className="cm-author-name">{activeReaderPost.author.name}</span>
                    <span className="t-label">
                      @{activeReaderPost.author.handle} · Tác giả bài viết
                    </span>
                  </span>
                </button>
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

          <PresenceCards
            className="cm-presence-card"
            title="Tác giả nổi bật"
            subtitle="Chọn để lọc theo tác giả"
            members={presenceMembers}
            actionLabel={authorFilter ? 'Bỏ lọc' : 'Tất cả'}
            onAction={() => setAuthorFilter(null)}
          >
            <ul className="cm-contrib-list">
              {topContributors.map((person) => {
                const isSelected =
                  authorFilter !== null &&
                  authorFilter.toLowerCase() === person.handle.toLowerCase();
                return (
                  <li key={person.handle} className="cm-contrib-item">
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
                      title={`Lọc bài viết của @${person.handle}`}
                    >
                      <span className="cm-contrib-info">
                        <span className="cm-contrib-name">{person.name}</span>
                        <span className="cm-contrib-meta">@{person.handle}</span>
                      </span>
                      <span className="cm-contrib-score">{person.score}đ</span>
                    </button>
                    <button
                      type="button"
                      className="cm-contrib-view-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        openUserProfile({
                          id: person.handle,
                          name: person.name,
                          handle: person.handle,
                          role: person.role,
                        });
                      }}
                      title={`Xem trang cá nhân của ${person.name}`}
                    >
                      Hồ sơ
                    </button>
                  </li>
                );
              })}
            </ul>
          </PresenceCards>

          <section className="cm-panel" aria-label="Đã lưu nhanh">
            <div className="cm-section-head">
              <span className="cm-section-title">Đã lưu nhanh</span>
              <span className="cm-count">{savedCommunityPosts.length}</span>
            </div>

            {savedCommunityPosts.length === 0 ? (
              <p className="cm-rail-sub">
                Nhấn biểu tượng lưu trên bất kỳ bài viết nào để giữ lại đọc sau.
              </p>
            ) : (
              <ul className="cm-saved-list">
                {savedCommunityPosts.slice(0, 4).map((savedPost) => (
                  <li key={savedPost.id} className="cm-saved-item">
                    <button
                      type="button"
                      className="cm-saved-link"
                      onClick={() => focusAndScrollToPost(savedPost.id, false)}
                    >
                      {whiteLabelText(savedPost.title)}
                    </button>
                    <div className="cm-saved-icons">
                      <button
                        type="button"
                        className="cm-icon-btn cm-icon-btn--sm"
                        aria-label={`Mở ${whiteLabelText(savedPost.title)} trong Workspace`}
                        title="Mở Workspace"
                        onClick={() => forkPostToWorkspace(savedPost)}
                      >
                        <ArrowUpRight size={14} aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        className="cm-icon-btn cm-icon-btn--sm"
                        aria-label={`Bỏ lưu ${whiteLabelText(savedPost.title)}`}
                        title="Bỏ lưu"
                        onClick={() => toggleSavedItem(savedPost.id)}
                      >
                        <X size={14} aria-hidden="true" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <div className="cm-chatroom-wrap">
            <ChatRoom
              title="Phòng thảo luận"
              people={chatRoomPeople.length > 0 ? chatRoomPeople : undefined}
              sound={false}
              defaultOpen={false}
            />
          </div>
        </aside>
      </div>

      <Modal
        open={composerOpen}
        onClose={() => setComposerOpen(false)}
        label="Viết bài chia sẻ mới"
        className="cm-dialog cm-dialog--composer"
      >
        <form className="cm-dialog-body" onSubmit={(e) => void handleCreatePost(e)}>
          <div className="cm-dialog-head">
            <h2 className="cm-dialog-title">Viết bài chia sẻ</h2>
            <button
              type="button"
              className="cm-icon-btn"
              aria-label="Đóng cửa sổ viết bài"
              title="Đóng"
              onClick={() => setComposerOpen(false)}
            >
              <X size={16} aria-hidden="true" />
            </button>
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
              {composeIncludeCode ? 'Ẩn hộp mã' : 'Đính kèm mã chạy thử'}
            </button>
            <button
              type="button"
              className="btn btn-line btn-sm"
              aria-pressed={composeIncludeImages}
              onClick={() => setComposeIncludeImages((prev) => !prev)}
            >
              <ImageIcon size={14} aria-hidden="true" />
              <span>
                {composeImages.length > 0
                  ? `Ảnh (${composeImages.length}/${MAX_COMPOSE_IMAGES})`
                  : 'Đính kèm ảnh'}
              </span>
            </button>
            <button
              type="button"
              className="btn btn-line btn-sm"
              aria-pressed={composeIncludePoll}
              onClick={() => setComposeIncludePoll((prev) => !prev)}
            >
              <BarChart3 size={14} aria-hidden="true" />
              <span>{composeIncludePoll ? 'Ẩn thăm dò' : 'Thăm dò ý kiến'}</span>
            </button>
          </div>

          <div className="cm-composer-row">
            <div className="cm-field">
              <label htmlFor="cm-post-title" className="t-label">
                Tiêu đề
              </label>
              <input
                id="cm-post-title"
                type="text"
                className="field"
                required
                value={composeTitle}
                onChange={(e) => setComposeTitle(e.target.value)}
                placeholder="Tối ưu token giao diện hoặc mẫu thành phần..."
              />
            </div>

            <div className="cm-field">
              <label htmlFor="cm-post-category" className="t-label">
                Chuyên mục
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
                <option value="Components">Components</option>
                <option value="Layouts">Layouts</option>
                <option value="Agent Rules">Agent Rules</option>
                <option value="Hội nhóm">Hội nhóm</option>
              </select>
            </div>
          </div>

          <div className="cm-field">
            <label htmlFor="cm-post-body" className="t-label">
              Nội dung
            </label>
            <textarea
              id="cm-post-body"
              rows={3}
              className="field cm-textarea"
              value={composeBody}
              onChange={(e) => setComposeBody(e.target.value)}
              placeholder="Chia sẻ giải pháp, kinh nghiệm hoặc câu hỏi kỹ thuật..."
            />
          </div>

          <div className="cm-field">
            <label htmlFor="cm-post-tags" className="t-label">
              Thẻ chủ đề
            </label>
            <input
              id="cm-post-tags"
              type="text"
              className="field"
              value={composeTagsInput}
              onChange={(e) => setComposeTagsInput(e.target.value)}
              placeholder="react, css-tokens"
            />
            <div className="cm-quick-tags" role="group" aria-label="Chọn nhanh thẻ">
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
                <span className="t-label">Hộp cát HTML / CSS / JS</span>
                <div className="cm-composer-tools">
                  <button
                    type="button"
                    className="btn btn-line btn-sm"
                    onClick={handleLoadSampleSnippet}
                  >
                    Chèn mẫu
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    aria-pressed={composePreviewLive}
                    onClick={() => setComposePreviewLive((p) => !p)}
                  >
                    {composePreviewLive ? 'Ẩn xem thử' : 'Xem thử'}
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
                    rows={3}
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
                    rows={3}
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
                    rows={3}
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
                    title={composeTitle.trim() || 'Bản nháp'}
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

          {composeIncludeImages && (
            <div className="cm-code-composer" aria-label="Đính kèm tối đa 4 ảnh">
              <div className="cm-code-composer-bar">
                <span className="t-label">
                  Ảnh minh họa ({composeImages.length}/{MAX_COMPOSE_IMAGES})
                </span>
                <label className="btn btn-line btn-sm cm-file-label">
                  <ImageIcon size={14} aria-hidden="true" />
                  <span>Chọn ảnh từ máy</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    disabled={composeImages.length >= MAX_COMPOSE_IMAGES}
                    onChange={(e) => {
                      void handleComposeImageFiles(e.target.files);
                      e.target.value = '';
                    }}
                    className="sr-only"
                  />
                </label>
              </div>

              <div className="cm-img-url-row">
                <label htmlFor="cm-img-url" className="sr-only">
                  Dán liên kết ảnh
                </label>
                <input
                  id="cm-img-url"
                  type="url"
                  className="field"
                  value={composeImageUrl}
                  onChange={(e) => setComposeImageUrl(e.target.value)}
                  placeholder="Hoặc dán liên kết ảnh https://..."
                  disabled={composeImages.length >= MAX_COMPOSE_IMAGES}
                />
                <button
                  type="button"
                  className="btn btn-line btn-sm"
                  disabled={!composeImageUrl.trim() || composeImages.length >= MAX_COMPOSE_IMAGES}
                  onClick={handleAddComposeImageUrl}
                >
                  Thêm ảnh
                </button>
              </div>

              {composeImages.length > 0 && (
                <div className="cm-compose-thumbs">
                  {composeImages.map((img) => (
                    <div key={img.id} className="cm-compose-thumb">
                      <img src={img.url} alt={img.alt} />
                      <button
                        type="button"
                        className="cm-compose-thumb-del"
                        aria-label={`Gỡ ảnh ${img.alt}`}
                        onClick={() => handleRemoveComposeImage(img.id)}
                      >
                        <X size={13} aria-hidden="true" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {composeIncludePoll && (
            <div className="cm-code-composer" aria-label="Tạo thăm dò ý kiến">
              <div className="cm-code-composer-bar">
                <span className="t-label">Thăm dò ý kiến (2–4 lựa chọn)</span>
                {composePollOptions.length < 4 && (
                  <button
                    type="button"
                    className="btn btn-line btn-sm"
                    onClick={handleAddPollOption}
                  >
                    <Plus size={13} aria-hidden="true" />
                    <span>Thêm lựa chọn</span>
                  </button>
                )}
              </div>

              <div className="cm-field">
                <label htmlFor="cm-poll-q" className="t-label">
                  Câu hỏi thăm dò
                </label>
                <input
                  id="cm-poll-q"
                  type="text"
                  className="field"
                  value={composePollQuestion}
                  onChange={(e) => setComposePollQuestion(e.target.value)}
                  placeholder="Ví dụ: Bạn ưu tiên thư viện tạo hiệu ứng nào?"
                />
              </div>

              <div className="cm-poll-builder-list">
                {composePollOptions.map((opt, idx) => (
                  <div key={idx} className="cm-poll-builder-row">
                    <label htmlFor={`cm-poll-opt-${idx}`} className="sr-only">
                      Lựa chọn {idx + 1}
                    </label>
                    <input
                      id={`cm-poll-opt-${idx}`}
                      type="text"
                      className="field"
                      value={opt}
                      onChange={(e) => handleUpdatePollOption(idx, e.target.value)}
                      placeholder={`Lựa chọn ${idx + 1}`}
                    />
                    {composePollOptions.length > 2 && (
                      <button
                        type="button"
                        className="cm-icon-btn cm-icon-btn--sm"
                        aria-label={`Xóa lựa chọn ${idx + 1}`}
                        onClick={() => handleRemovePollOption(idx)}
                      >
                        <Trash2 size={14} aria-hidden="true" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="cm-dialog-actions">
            {(composeTitle.trim() || composeBody.trim()) && (
              <span className="t-label cm-draft-note">Đã tự lưu bản nháp</span>
            )}
            <button
              type="button"
              className="btn btn-line btn-sm"
              onClick={() => setComposerOpen(false)}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="btn btn-red btn-sm"
              disabled={submittingPost || !composeTitle.trim()}
            >
              {submittingPost ? 'Đang đăng...' : 'Đăng bài'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={reportTarget !== null}
        onClose={() => setReportTarget(null)}
        label="Báo cáo bài viết"
        className="cm-dialog"
      >
        <form className="cm-dialog-body" onSubmit={(e) => void handleSubmitReport(e)}>
          <div className="cm-dialog-head">
            <h2 className="cm-dialog-title">Báo cáo bài viết</h2>
            <button
              type="button"
              className="cm-icon-btn"
              aria-label="Đóng hộp thoại báo cáo"
              title="Đóng"
              onClick={() => setReportTarget(null)}
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>
          <p className="t-label">{reportTarget ? whiteLabelText(reportTarget.title) : ''}</p>
          <div className="cm-field">
            <label htmlFor="cm-reason" className="t-label">
              Lý do
            </label>
            <textarea
              id="cm-reason"
              rows={3}
              className="field cm-textarea"
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
            />
          </div>
          <div className="cm-dialog-actions">
            <button
              type="button"
              className="btn btn-line btn-sm"
              onClick={() => setReportTarget(null)}
            >
              Hủy
            </button>
            <button type="submit" className="btn btn-red btn-sm" disabled={submittingReport}>
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
            <h2 className="cm-dialog-title">Hồ sơ chuyển giao</h2>
            <button
              type="button"
              className="cm-icon-btn"
              aria-label="Đóng hộp thoại hồ sơ"
              title="Đóng"
              onClick={() => setDossierClub(null)}
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>

          <div className="cm-field">
            <label htmlFor="cm-d-title" className="t-label">
              Tên dự án
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
              Ghi chú bàn giao
            </label>
            <textarea
              id="cm-d-notes"
              rows={4}
              className="field cm-textarea"
              value={dossierDraft.handoverNotes}
              onChange={(e) => setDossierDraft((d) => ({ ...d, handoverNotes: e.target.value }))}
            />
          </div>

          <div className="cm-field">
            <label htmlFor="cm-d-ms" className="t-label">
              Cột mốc tiếp theo
            </label>
            <textarea
              id="cm-d-ms"
              rows={3}
              className="field cm-textarea"
              value={milestonesText}
              onChange={(e) => setMilestonesText(e.target.value)}
            />
          </div>

          <div className="cm-dialog-actions">
            <button
              type="button"
              className="btn btn-line btn-sm"
              onClick={() => setDossierClub(null)}
            >
              Hủy
            </button>
            <button type="submit" className="btn btn-red btn-sm" disabled={savingDossier}>
              {savingDossier ? 'Đang lưu' : 'Lưu hồ sơ'}
            </button>
          </div>
        </form>
      </Modal>

      <CommunityNotificationsModal
        open={notificationsOpen}
        notifications={notifications}
        onClose={() => setNotificationsOpen(false)}
        onMarkAllRead={handleMarkAllNotifRead}
        onSelectNotification={handleSelectNotification}
      />

      <Modal
        open={lightboxImage !== null}
        onClose={() => setLightboxImage(null)}
        label={lightboxImage?.alt || 'Xem ảnh phóng to'}
        className="cm-dialog cm-dialog--lightbox"
      >
        {lightboxImage && (
          <div className="cm-lightbox-body">
            <div className="cm-dialog-head">
              <span className="t-label">{lightboxImage.alt}</span>
              <button
                type="button"
                className="cm-icon-btn"
                aria-label="Đóng xem ảnh"
                onClick={() => setLightboxImage(null)}
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>
            <img
              src={lightboxImage.url}
              alt={lightboxImage.alt}
              className="cm-lightbox-img"
              referrerPolicy="no-referrer"
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CommunityView;
