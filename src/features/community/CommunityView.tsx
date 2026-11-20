import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowUp, Flag, X } from 'lucide-react';
import type {
  ClubHandoverDossier,
  CommunityAnswer,
  CommunityChannel,
  CommunityPost,
} from '../../types/index';
import { useAppStore } from '../../store/appStore';
import { ReaderCard } from '../../components/pinui/ReaderCard';
import { Mark } from '../../ui/Mark';
import { Modal } from '../workspace/Modal';
import './community.css';

type RailChannel = 'qa' | 'showcase' | 'critique' | 'clubs' | 'drops';
type SortMode = 'newest' | 'top' | 'unsolved';

const QA_CATEGORIES = ['Bug Fix', 'Prompt Engineering', 'UI/UX Critique'];

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

function getAllAnswers(post: CommunityPost): CommunityAnswer[] {
  const list: CommunityAnswer[] = [];
  if (post.acceptedAnswer) {
    list.push({ ...post.acceptedAnswer, isAccepted: true });
  }
  if (Array.isArray(post.answers)) {
    for (const ans of post.answers) {
      if (!list.some((existing) => existing.id === ans.id)) {
        list.push(ans);
      }
    }
  }
  return list;
}

function escapeHtml(raw: string): string {
  return raw.replace(/</g, '&lt;').replace(/>/g, '&gt;');
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

function postScore(post: CommunityPost): number {
  return post.votes ?? post.likes ?? 0;
}

function buildShowcasePreviewDoc(post: CommunityPost, theme: 'dark' | 'light'): string {
  const isDark = theme === 'dark';
  const bg = isDark ? '#121110' : '#f4f0e6';
  const fg = isDark ? '#efe9dd' : '#17150f';
  const surface = isDark ? '#1a1917' : '#fbf8f1';
  const border = isDark ? 'rgba(239,233,221,0.18)' : 'rgba(23,21,15,0.18)';
  const safeTitle = escapeHtml(whiteLabelText(post.title));
  const safeBody = escapeHtml(whiteLabelText(post.description || post.body || ''));
  const snippet = post.demoSnippet || {
    html: `<section style="padding:24px;border:1px solid ${border};background:${surface};max-width:460px"><h3 style="font-family:Georgia,serif;font-size:20px;margin-bottom:8px">${safeTitle}</h3><p style="font-size:14px;line-height:1.6;opacity:0.8">${safeBody}</p></section>`,
    css: '',
  };
  return `<!DOCTYPE html><html lang="vi"><head><meta charset="utf-8" /><style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{min-height:100vh;display:grid;place-items:center;padding:24px;background:${bg};color:${fg};font-family:system-ui,sans-serif}
    ${snippet.css || ''}
  </style></head><body>${snippet.html || ''}${snippet.js ? `<script>${snippet.js}</script>` : ''}</body></html>`;
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

const RAIL_CHANNELS: Array<{ id: RailChannel; label: string; subtitle: string }> = [
  { id: 'qa', label: 'Hỏi đáp', subtitle: 'Câu hỏi kỹ thuật và lời giải đã kiểm chứng' },
  { id: 'showcase', label: 'Trưng bày', subtitle: 'Thành phần giao diện chạy trực tiếp trong hộp cát' },
  { id: 'critique', label: 'Phản biện', subtitle: 'Toàn bộ luồng hỏi đáp và trình diễn đang thảo luận' },
  { id: 'clubs', label: 'Hội nhóm', subtitle: 'Hồ sơ chuyển giao và nhịp dự án câu lạc bộ' },
  { id: 'drops', label: 'Học liệu', subtitle: 'Quy chuẩn viết mã, prompt và tài liệu thực hành' },
];

const SORT_OPTIONS: Array<{ id: SortMode; label: string }> = [
  { id: 'newest', label: 'Mới nhất' },
  { id: 'top', label: 'Nổi bật' },
  { id: 'unsolved', label: 'Chưa giải' },
];

export const CommunityView: React.FC = () => {
  const {
    communityChannels,
    communityPosts,
    currentUser,
    setAuthModalOpen,
    savedItemIds,
    toggleSavedItem,
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

  const leadSectionRef = useRef<HTMLElement>(null);
  const [channel, setChannel] = useState<RailChannel>('qa');
  const [sortMode, setSortMode] = useState<SortMode>('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [expandedDemoIds, setExpandedDemoIds] = useState<Record<string, boolean>>({});
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  const [previewPost, setPreviewPost] = useState<CommunityPost | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [composeChannel, setComposeChannel] = useState<CommunityChannel>('qa');
  const [composeTitle, setComposeTitle] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [composeCategory, setComposeCategory] = useState('Bug Fix');
  const [composeTagsInput, setComposeTagsInput] = useState('');
  const [composePayload, setComposePayload] = useState('');
  const [composeIncludeDemo, setComposeIncludeDemo] = useState(false);
  const [composeHtml, setComposeHtml] = useState('');
  const [composeCss, setComposeCss] = useState('');
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

  const counts = useMemo<Record<RailChannel, number>>(() => {
    const qaCount = communityChannels.qa.filter((p) => !p.hidden).length;
    const showcaseCount = communityChannels.showcase.filter((p) => !p.hidden).length;
    const clubsCount = communityChannels.clubs.filter((p) => !p.hidden).length;
    const dropsCount = communityChannels.drops.filter((p) => !p.hidden).length;
    return {
      qa: qaCount,
      showcase: showcaseCount,
      critique: qaCount + showcaseCount,
      clubs: clubsCount,
      drops: dropsCount,
    };
  }, [communityChannels]);

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

    for (const post of communityPosts) {
      if (post.hidden) continue;
      const postEntry = ensureEntry(post.author);
      postEntry.postsCount += 1;
      postEntry.votesTotal += postScore(post);

      for (const ans of getAllAnswers(post)) {
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
  }, [communityPosts]);

  const activeList = useMemo(() => {
    const rawPool =
      channel === 'qa'
        ? communityChannels.qa
        : channel === 'showcase'
          ? communityChannels.showcase
          : channel === 'clubs'
            ? communityChannels.clubs
            : channel === 'drops'
              ? communityChannels.drops
              : [...communityChannels.qa, ...communityChannels.showcase];

    const q = searchQuery.trim().toLowerCase();
    const filtered = rawPool.filter((post) => {
      if (post.hidden) return false;
      if (sortMode === 'unsolved' && (post.isAccepted || Boolean(post.acceptedAnswer))) {
        return false;
      }
      if (!q) return true;
      return (
        whiteLabelText(post.title).toLowerCase().includes(q) ||
        whiteLabelText(post.body || '').toLowerCase().includes(q) ||
        whiteLabelText(post.description || '').toLowerCase().includes(q) ||
        whiteLabelText(post.category).toLowerCase().includes(q) ||
        post.author.name.toLowerCase().includes(q) ||
        post.author.handle.toLowerCase().includes(q) ||
        post.tags.some((t) => whiteLabelText(t).toLowerCase().includes(q))
      );
    });

    return [...filtered].sort((a, b) => {
      if (sortMode === 'top') {
        return postScore(b) - postScore(a);
      }
      return Date.parse(b.createdAt) - Date.parse(a.createdAt);
    });
  }, [communityChannels, channel, searchQuery, sortMode]);

  const leadPost = useMemo(
    () => activeList.find((item) => item.id === selectedId) || activeList[0] || null,
    [activeList, selectedId]
  );

  const leadAnswers = useMemo(() => (leadPost ? getAllAnswers(leadPost) : []), [leadPost]);

  const focusPostById = useCallback(
    (postId: string | null) => {
      if (!postId) return;
      if (communityChannels.clubs.some((p) => p.id === postId && !p.hidden)) {
        setChannel('clubs');
        setSelectedId(postId);
        return;
      }
      if (communityChannels.drops.some((p) => p.id === postId && !p.hidden)) {
        setChannel('drops');
        setSelectedId(postId);
        return;
      }
      if (communityChannels.qa.some((p) => p.id === postId && !p.hidden)) {
        setChannel('qa');
        setSelectedId(postId);
        return;
      }
      if (communityChannels.showcase.some((p) => p.id === postId && !p.hidden)) {
        setChannel('showcase');
        setSelectedId(postId);
      }
    },
    [communityChannels]
  );

  useEffect(() => {
    try {
      const pending = window.sessionStorage.getItem('ff_community_post_id');
      if (pending) {
        focusPostById(pending);
        window.sessionStorage.removeItem('ff_community_post_id');
      }
    } catch {
      void 0;
    }
    const onPostEvent = (event: Event) => {
      const detail = (event as CustomEvent<string>).detail;
      if (typeof detail === 'string') focusPostById(detail);
    };
    window.addEventListener('ff:community-post', onPostEvent);
    return () => window.removeEventListener('ff:community-post', onPostEvent);
  }, [focusPostById]);

  const selectThreadPost = (postId: string) => {
    setSelectedId(postId);
    window.requestAnimationFrame(() => {
      leadSectionRef.current?.scrollIntoView({
        behavior: reducedMotion ? 'auto' : 'smooth',
        block: 'start',
      });
    });
  };

  const toggleInlineDemo = (postId: string) => {
    setExpandedDemoIds((prev) => ({ ...prev, [postId]: !prev[postId] }));
  };

  const requireSignedIn = (): boolean => {
    if (currentUser) return true;
    addToast({
      type: 'info',
      title: 'Cần đăng nhập',
      message: 'Đăng nhập để đăng bài, phản biện hoặc cập nhật hồ sơ.',
    });
    setAuthModalOpen(true);
    return false;
  };

  const handleUpvote = async (postId: string) => {
    try {
      await upvotePost(postId);
    } catch (err) {
      addToast({
        type: 'warning',
        title: 'Không thể cập nhật bình chọn',
        message: err instanceof Error ? err.message : undefined,
      });
    }
  };

  const handleSubmitReply = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!leadPost || !replyText.trim()) return;
    if (!requireSignedIn()) return;
    setSubmittingReply(true);
    try {
      await answerPost(leadPost.id, replyText.trim());
      setReplyText('');
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Gửi phản hồi thất bại',
        message: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleAcceptSolution = async (postId: string, answerId: string) => {
    if (!requireSignedIn()) return;
    try {
      await acceptAnswer(postId, answerId);
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Không thể đánh dấu lời giải',
        message: err instanceof Error ? err.message : undefined,
      });
    }
  };

  const handleSubmitReport = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!reportTarget || !reportReason.trim()) return;
    setSubmittingReport(true);
    try {
      await reportPost(reportTarget.id, reportReason.trim());
      setReportTarget(null);
      setReportReason('Thông tin sai lệch kỹ thuật hoặc spam');
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Gửi báo cáo thất bại',
        message: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setSubmittingReport(false);
    }
  };

  const openEditDossier = (club: CommunityPost) => {
    if (!requireSignedIn()) return;
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
    try {
      await updateDossier(dossierClub.id, {
        ...dossierDraft,
        nextMilestones: milestonesText
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean),
        updatedAt: new Date().toISOString(),
      });
      setDossierClub(null);
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Cập nhật hồ sơ thất bại',
        message: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setSavingDossier(false);
    }
  };

  const handlePrefillFromWorkspace = () => {
    const htmlFile = activeProject.files.find((f) => f.path.endsWith('.html'));
    const cssFile = activeProject.files.find((f) => f.path.endsWith('.css'));
    if (!composeTitle.trim()) setComposeTitle(activeProject.name);
    if (!composeBody.trim()) setComposeBody(activeProject.description);
    setComposeIncludeDemo(true);
    setComposeHtml(htmlFile?.content || '');
    setComposeCss(cssFile?.content || '');
    addToast({
      type: 'info',
      title: 'Đã nạp từ Workspace',
      message: activeProject.name,
    });
  };

  const openComposer = () => {
    if (channel === 'clubs') {
      setComposeChannel('clubs');
      setComposeIncludeDemo(false);
    } else if (channel === 'drops') {
      setComposeChannel('drops');
      setComposeIncludeDemo(false);
    } else if (channel === 'showcase') {
      setComposeChannel('showcase');
      setComposeIncludeDemo(true);
    } else {
      setComposeChannel('qa');
      setComposeIncludeDemo(false);
    }
    setComposerOpen(true);
  };

  const handleCreatePost = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!composeTitle.trim()) return;
    if (!requireSignedIn()) return;
    setSubmittingPost(true);
    const parsedTags = composeTagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const hasCustomDemo = composeIncludeDemo && (composeHtml.trim() || composeCss.trim());
    const optionalSnippet = hasCustomDemo
      ? {
          html:
            composeHtml.trim() ||
            `<div class="demo-box"><h3>${escapeHtml(composeTitle.trim())}</h3><p>${escapeHtml(composeBody.trim())}</p></div>`,
          css:
            composeCss.trim() ||
            '.demo-box{padding:24px;border:1px solid rgba(239,233,221,0.22);background:#1a1917;color:#efe9dd}',
        }
      : undefined;

    try {
      if (composeChannel === 'qa') {
        const created = await createPost({
          channel: 'qa',
          title: composeTitle.trim(),
          body: composeBody.trim(),
          category: composeCategory,
          tags: parsedTags.length > 0 ? parsedTags : [composeCategory],
          demoSnippet: optionalSnippet,
        });
        setChannel('qa');
        setSelectedId(created.id);
      } else if (composeChannel === 'showcase') {
        const created = await createPost({
          channel: 'showcase',
          title: composeTitle.trim(),
          body: composeBody.trim(),
          category: 'Hộp cát giao diện',
          tags: parsedTags.length > 0 ? parsedTags : ['showcase', 'sandbox'],
          demoSnippet: optionalSnippet || {
            html: `<div class="demo-box"><h3>${escapeHtml(composeTitle.trim())}</h3><p>${escapeHtml(composeBody.trim())}</p></div>`,
            css: '.demo-box{padding:24px;border:1px solid rgba(239,233,221,0.22);background:#1a1917;color:#efe9dd}',
          },
        });
        setChannel('showcase');
        setSelectedId(created.id);
      } else if (composeChannel === 'drops') {
        const created = await createPost({
          channel: 'drops',
          title: composeTitle.trim(),
          body: composeBody.trim(),
          category: composeCategory || 'Học liệu chuẩn hóa',
          tags: parsedTags.length > 0 ? parsedTags : ['blueprint', 'rules'],
          fileType: 'markdown',
          payload: composePayload.trim() || composeBody.trim(),
          demoSnippet: optionalSnippet,
        });
        setChannel('drops');
        setSelectedId(created.id);
      } else {
        const created = await createPost({
          channel: 'clubs',
          title: composeTitle.trim(),
          body: composeBody.trim(),
          category: 'Hội nhóm',
          tags: parsedTags.length > 0 ? parsedTags : ['club', 'handover'],
          activeDossier: {
            projectTitle: composeTitle.trim(),
            handoverNotes: composeBody.trim(),
            nextMilestones: composePayload
              .split('\n')
              .map((s) => s.trim())
              .filter(Boolean),
            ownerHandle: currentUser?.username || 'maintainer',
            updatedAt: new Date().toISOString(),
          },
        });
        setChannel('clubs');
        setSelectedId(created.id);
      }
      setComposeTitle('');
      setComposeBody('');
      setComposeTagsInput('');
      setComposePayload('');
      setComposeHtml('');
      setComposeCss('');
      setComposeIncludeDemo(false);
      setComposerOpen(false);
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Không thể tạo bài viết',
        message: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setSubmittingPost(false);
    }
  };

  const activeChannelMeta = RAIL_CHANNELS.find((item) => item.id === channel) || RAIL_CHANNELS[0];

  const readerParagraphs = useMemo(() => {
    if (!leadPost) return [];
    const lines = [whiteLabelText(leadPost.body || leadPost.description || leadPost.title)];
    if (leadPost.payload) lines.push(whiteLabelText(leadPost.payload));
    lines.push(
      `Chuyên mục ${whiteLabelText(leadPost.category)}, đăng bởi ${leadPost.author.name} (@${leadPost.author.handle}).`
    );
    return lines;
  }, [leadPost]);

  const canAcceptLead =
    Boolean(currentUser) &&
    Boolean(leadPost) &&
    (currentUser?.role === 'admin' || currentUser?.username === leadPost?.author.handle);

  return (
    <div className="cm">
      <div className="wrap-wide cm-shell">
        <aside className="cm-rail" aria-label="Kênh thảo luận">
          <div className="cm-rail-head">
            <p className="t-label">diễn đàn kỹ thuật</p>
            <h1 className="cm-rail-title">
              <span className="t-script cm-cap">T</span>ri thức
            </h1>
          </div>

          <div className="cm-rail-search">
            <label htmlFor="cm-search" className="sr-only">
              Tìm bài viết
            </label>
            <input
              id="cm-search"
              type="search"
              className="field cm-search-field"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm chủ đề, thẻ, tác giả"
              autoComplete="off"
              spellCheck={false}
            />
            {searchQuery && (
              <button
                type="button"
                className="icon-btn"
                aria-label="Xóa tìm kiếm"
                title="Xóa tìm kiếm"
                onClick={() => setSearchQuery('')}
              >
                <X size={16} aria-hidden="true" />
              </button>
            )}
          </div>

          <nav className="cm-channels" aria-label="Danh sách kênh">
            <p className="t-label cm-rail-label">Kênh thảo luận</p>
            <ul className="cm-ch-list">
              {RAIL_CHANNELS.map((item) => {
                const active = channel === item.id;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      className="cm-ch-btn"
                      aria-current={active ? 'true' : undefined}
                      onClick={() => {
                        setChannel(item.id);
                        setSelectedId(null);
                      }}
                    >
                      <span className="cm-ch-name">{item.label}</span>
                      <span className="cm-ch-count">{counts[item.id]}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          <section className="cm-leaders" aria-label="Top đóng góp">
            <p className="t-label cm-rail-label">Top đóng góp</p>
            {topContributors.length === 0 ? (
              <p className="t-label">Chưa có dữ liệu.</p>
            ) : (
              <ul className="cm-leader-list">
                {topContributors.map((person, index) => (
                  <li key={person.handle} className="cm-leader-row">
                    <span className="cm-leader-rank">{index + 1}</span>
                    <div className="cm-leader-info">
                      <span className="cm-leader-name">{person.name}</span>
                      <span className="t-label">
                        @{person.handle} · {person.postsCount} bài
                        {person.acceptedCount > 0
                          ? ` · ${person.acceptedCount} chuẩn`
                          : person.repliesCount > 0
                            ? ` · ${person.repliesCount} góp ý`
                            : ''}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>

        <main className="cm-main">
          <header className="cm-toolbar">
            <div className="cm-toolbar-copy">
              <div className="cm-toolbar-title-row">
                <h2 className="t-title cm-channel-heading">{activeChannelMeta.label}</h2>
                <span className="t-label">{activeList.length} bài</span>
              </div>
              <p className="cm-toolbar-sub">{activeChannelMeta.subtitle}</p>
            </div>

            <div className="cm-toolbar-actions">
              <div className="cm-sort-group" role="group" aria-label="Sắp xếp bài viết">
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    className="cm-sort-btn"
                    aria-pressed={sortMode === opt.id}
                    onClick={() => setSortMode(opt.id)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <button type="button" className="btn btn-red" onClick={openComposer}>
                Đăng bài
              </button>
            </div>
          </header>

          {activeList.length === 0 || !leadPost ? (
            <div className="cm-empty">
              <h3 className="t-title">Chưa có chủ đề khớp bộ lọc</h3>
              <p className="t-lead">Thử đổi kênh, xóa từ khóa tìm kiếm hoặc mở chủ đề mới.</p>
              <div className="cm-empty-actions">
                {(searchQuery || sortMode === 'unsolved') && (
                  <button
                    type="button"
                    className="btn btn-line"
                    onClick={() => {
                      setSearchQuery('');
                      setSortMode('newest');
                    }}
                  >
                    Xóa lọc
                  </button>
                )}
                <button type="button" className="btn btn-red" onClick={openComposer}>
                  Đăng bài
                </button>
              </div>
            </div>
          ) : (
            <div className="cm-workspace">
              <section aria-label="Mục lục" className="cm-feed">
                <ul className="cm-feed-list">
                  {activeList.map((post) => {
                    const active = leadPost.id === post.id;
                    const replyCount = getAllAnswers(post).length;
                    const isSaved = savedItemIds.includes(post.id);
                    const demoExpanded = Boolean(expandedDemoIds[post.id]);
                    const solved = Boolean(post.isAccepted || post.acceptedAnswer);

                    return (
                      <li
                        key={post.id}
                        className="cm-card"
                        data-active={active ? 'true' : undefined}
                      >
                        <div className="cm-card-vote">
                          <button
                            type="button"
                            className="icon-btn cm-vote-btn"
                            onClick={() => void handleUpvote(post.id)}
                            aria-label={`Tán thành ${whiteLabelText(post.title)}`}
                            title="Tán thành"
                          >
                            <ArrowUp size={17} aria-hidden="true" />
                          </button>
                          <span className="cm-vote-count">{postScore(post)}</span>
                        </div>

                        <div className="cm-card-body">
                          <div className="cm-card-meta">
                            <span className="cm-avatar-chip" aria-hidden="true">
                              {authorInitials(post.author.name)}
                            </span>
                            <span className="cm-author-name">{post.author.name}</span>
                            <span className="t-label">@{post.author.handle}</span>
                            <span className="tag">{post.author.role}</span>
                            <span className="tag tag-red">{whiteLabelText(post.category)}</span>
                            {solved && <span className="tag tag-green">Đạt chuẩn</span>}
                            <time className="t-label cm-card-date" dateTime={post.createdAt}>
                              {formatPostDate(post.createdAt)}
                            </time>
                          </div>

                          <button
                            type="button"
                            className="cm-card-title-btn"
                            aria-current={active ? 'true' : undefined}
                            onClick={() => selectThreadPost(post.id)}
                          >
                            {whiteLabelText(post.title)}
                          </button>

                          <p className="cm-card-excerpt">
                            {whiteLabelText(post.body || post.description || post.payload || '')}
                          </p>

                          {post.tags.length > 0 && (
                            <div className="cm-tags">
                              {post.tags.slice(0, 4).map((tag) => (
                                <span key={tag} className="tag">
                                  #{whiteLabelText(tag)}
                                </span>
                              ))}
                            </div>
                          )}

                          {post.demoSnippet && demoExpanded && (
                            <div className="cm-preview cm-preview-inline">
                              <iframe
                                title={`Demo ${whiteLabelText(post.title)}`}
                                sandbox="allow-scripts"
                                referrerPolicy="no-referrer"
                                srcDoc={buildShowcasePreviewDoc(post, theme)}
                              />
                            </div>
                          )}

                          <div className="cm-card-foot">
                            <span className="t-label">{replyCount} phản hồi</span>
                            {typeof post.views === 'number' && (
                              <span className="t-label">{post.views} lượt xem</span>
                            )}
                            {typeof post.forks === 'number' && post.forks > 0 && (
                              <span className="t-label">{post.forks} nhánh</span>
                            )}

                            <div className="cm-card-actions">
                              {post.demoSnippet && (
                                <button
                                  type="button"
                                  className="btn btn-line btn-sm"
                                  aria-expanded={demoExpanded}
                                  onClick={() => toggleInlineDemo(post.id)}
                                >
                                  {demoExpanded ? 'Thu gọn' : 'Demo'}
                                </button>
                              )}
                              <button
                                type="button"
                                className="btn btn-ghost btn-sm"
                                onClick={() => selectThreadPost(post.id)}
                              >
                                Thảo luận
                              </button>
                              <button
                                type="button"
                                className="btn btn-line btn-sm"
                                onClick={() => toggleSavedItem(post.id)}
                              >
                                {isSaved ? 'Bỏ lưu' : 'Lưu bài'}
                              </button>
                              <button
                                type="button"
                                className="btn btn-solid btn-sm"
                                onClick={() => forkPostToWorkspace(post)}
                              >
                                Workspace
                              </button>
                            </div>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>

              <section
                ref={leadSectionRef}
                aria-label="Thảo luận chi tiết"
                className="cm-reader"
              >
                <article className="cm-lead">
                  <div className="cm-lead-meta">
                    <span className="tag tag-red">{whiteLabelText(leadPost.category)}</span>
                    <span className="t-label">
                      {leadPost.author.name} (@{leadPost.author.handle}) · {leadPost.author.role}
                    </span>
                    <time className="t-label" dateTime={leadPost.createdAt}>
                      {formatPostDate(leadPost.createdAt)}
                    </time>
                  </div>

                  <h2 className="cm-lead-title">{whiteLabelText(leadPost.title)}</h2>

                  <p className="cm-lead-body">
                    {whiteLabelText(leadPost.body || leadPost.description || '')}
                  </p>

                  {leadPost.demoSnippet && (
                    <div className="cm-preview">
                      <iframe
                        title={`Xem trước ${whiteLabelText(leadPost.title)}`}
                        sandbox="allow-scripts"
                        referrerPolicy="no-referrer"
                        srcDoc={buildShowcasePreviewDoc(leadPost, theme)}
                      />
                    </div>
                  )}

                  {leadPost.payload && (
                    <pre className="cm-code">{whiteLabelText(leadPost.payload)}</pre>
                  )}

                  {leadPost.channel === 'clubs' && leadPost.activeDossier && (
                    <div className="cm-dossier">
                      <div className="cm-margin-head">
                        <div>
                          <p className="t-label">hồ sơ câu lạc bộ</p>
                          <h3 className="t-title" style={{ fontSize: 'var(--text-xl)' }}>
                            {leadPost.activeDossier.projectTitle}
                          </h3>
                        </div>
                        <button
                          type="button"
                          className="btn btn-line btn-sm"
                          onClick={() => openEditDossier(leadPost)}
                        >
                          Cập nhật
                        </button>
                      </div>
                      <p className="cm-lead-body">{leadPost.activeDossier.handoverNotes}</p>
                      {leadPost.activeDossier.nextMilestones?.length ? (
                        <ol className="cm-dossier-list">
                          {leadPost.activeDossier.nextMilestones.map((step) => (
                            <li key={step}>{step}</li>
                          ))}
                        </ol>
                      ) : null}
                    </div>
                  )}

                  {leadPost.channel === 'drops' && (
                    <ReaderCard
                      title={whiteLabelText(leadPost.title)}
                      subtitle={`${whiteLabelText(leadPost.category)}, @${leadPost.author.handle}`}
                      paragraphs={readerParagraphs}
                      openLabel="Đọc sâu"
                      theme={theme}
                    />
                  )}

                  {leadPost.tags.length > 0 && (
                    <div className="cm-tags">
                      {leadPost.tags.slice(0, 6).map((tag) => (
                        <span key={tag} className="tag">
                          #{whiteLabelText(tag)}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="cm-lead-actions">
                    <div className="cm-votes">
                      <button
                        type="button"
                        className="icon-btn"
                        onClick={() => void handleUpvote(leadPost.id)}
                        aria-label={`Tán thành ${whiteLabelText(leadPost.title)}`}
                        title="Tán thành"
                      >
                        <ArrowUp size={18} aria-hidden="true" />
                      </button>
                      <span className="t-label">{postScore(leadPost)}</span>
                    </div>

                    <button
                      type="button"
                      className="btn btn-solid btn-sm"
                      onClick={() => forkPostToWorkspace(leadPost)}
                    >
                      Workspace
                    </button>

                    {(leadPost.channel === 'showcase' || leadPost.demoSnippet) && (
                      <button
                        type="button"
                        className="btn btn-red btn-sm"
                        onClick={() => setPreviewPost(leadPost)}
                      >
                        Xem thử
                      </button>
                    )}

                    {leadPost.channel === 'clubs' && (
                      <button
                        type="button"
                        className="btn btn-line btn-sm"
                        onClick={() => openEditDossier(leadPost)}
                      >
                        Hồ sơ
                      </button>
                    )}

                    <div className="cm-lead-right">
                      <button
                        type="button"
                        className="btn btn-line btn-sm"
                        onClick={() => toggleSavedItem(leadPost.id)}
                      >
                        {savedItemIds.includes(leadPost.id) ? 'Bỏ lưu' : 'Lưu bài'}
                      </button>
                      <button
                        type="button"
                        className="icon-btn"
                        onClick={() => setReportTarget(leadPost)}
                        aria-label={`Báo cáo ${whiteLabelText(leadPost.title)}`}
                        title="Báo cáo"
                      >
                        <Flag size={18} aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </article>

                <aside aria-label="Thảo luận chi tiết" className="cm-margin">
                  <div className="cm-margin-head">
                    <h3 className="t-title" style={{ fontSize: 'var(--text-xl)' }}>
                      Thảo luận chi tiết
                    </h3>
                    <span className="t-label">{leadAnswers.length} phản hồi</span>
                  </div>

                  {leadAnswers.length === 0 ? (
                    <p className="t-lead" style={{ fontSize: 'var(--text-sm)' }}>
                      Chưa có phản hồi nào. Hãy đóng góp góc nhìn kỹ thuật hoặc đề xuất kiểm chứng đầu tiên.
                    </p>
                  ) : (
                    <ul className="cm-notes">
                      {leadAnswers.map((ans) => (
                        <li
                          key={ans.id}
                          className="cm-note"
                          data-accepted={ans.isAccepted ? 'true' : undefined}
                        >
                          <div className="cm-note-head">
                            <div className="cm-note-author">
                              <span className="cm-avatar-chip" aria-hidden="true">
                                {authorInitials(ans.author.name)}
                              </span>
                              <span className="t-label">
                                {ans.author.name} (@{ans.author.handle})
                              </span>
                            </div>
                            {ans.isAccepted ? (
                              <span className="t-note">
                                <Mark kind="box" active>
                                  đạt chuẩn
                                </Mark>
                              </span>
                            ) : canAcceptLead ? (
                              <button
                                type="button"
                                className="btn btn-ghost btn-sm"
                                onClick={() => void handleAcceptSolution(leadPost.id, ans.id)}
                              >
                                Chấp nhận
                              </button>
                            ) : null}
                          </div>
                          <p className="cm-note-text">{whiteLabelText(ans.content)}</p>
                        </li>
                      ))}
                    </ul>
                  )}

                  <form className="cm-reply-form" onSubmit={(e) => void handleSubmitReply(e)}>
                    <label htmlFor="cm-reply" className="t-label">
                      gửi phản hồi
                    </label>
                    <textarea
                      id="cm-reply"
                      rows={3}
                      className="field"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Nêu luận điểm, đoạn mã đối chiếu hoặc lỗi cần kiểm tra..."
                    />
                    <div>
                      <button
                        type="submit"
                        className="btn btn-red btn-sm"
                        disabled={submittingReply || !replyText.trim()}
                      >
                        {submittingReply ? 'Đang gửi' : 'Gửi'}
                      </button>
                    </div>
                  </form>
                </aside>
              </section>
            </div>
          )}
        </main>
      </div>

      <Modal
        open={composerOpen}
        onClose={() => setComposerOpen(false)}
        label="Đăng bài mới"
        className="cm-dialog"
      >
        <form className="cm-dialog-body" onSubmit={(e) => void handleCreatePost(e)}>
          <div className="cm-dialog-head">
            <h2 className="t-title" style={{ fontSize: 'var(--text-xl)' }}>
              Đăng bài mới
            </h2>
            <button
              type="button"
              className="icon-btn"
              onClick={() => setComposerOpen(false)}
              aria-label="Đóng"
              title="Đóng"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>

          <div className="cm-field">
            <label htmlFor="cm-ch" className="t-label">
              chuyên mục
            </label>
            <select
              id="cm-ch"
              className="field"
              value={composeChannel}
              onChange={(e) => {
                const next = e.target.value as CommunityChannel;
                setComposeChannel(next);
                if (next === 'showcase') setComposeIncludeDemo(true);
              }}
            >
              <option value="qa">Hỏi đáp phản biện</option>
              <option value="showcase">Trưng bày hộp cát</option>
              <option value="drops">Học liệu chuẩn hóa</option>
              <option value="clubs">Hội nhóm &amp; bàn giao</option>
            </select>
          </div>

          {composeChannel === 'qa' && (
            <div className="cm-field">
              <label htmlFor="cm-cat" className="t-label">
                nhóm câu hỏi
              </label>
              <select
                id="cm-cat"
                className="field"
                value={composeCategory}
                onChange={(e) => setComposeCategory(e.target.value)}
              >
                {QA_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="cm-dialog-tools">
            <button type="button" className="btn btn-line btn-sm" onClick={handlePrefillFromWorkspace}>
              Nạp Workspace
            </button>
            {composeChannel !== 'showcase' && composeChannel !== 'clubs' && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                aria-pressed={composeIncludeDemo}
                onClick={() => setComposeIncludeDemo((val) => !val)}
              >
                {composeIncludeDemo ? 'Ẩn Demo' : 'Kèm Demo'}
              </button>
            )}
          </div>

          <div className="cm-field">
            <label htmlFor="cm-title" className="t-label">
              tiêu đề
            </label>
            <input
              id="cm-title"
              type="text"
              className="field"
              required
              value={composeTitle}
              onChange={(e) => setComposeTitle(e.target.value)}
              placeholder="Đặt câu hỏi cụ thể hoặc tên nguyên mẫu"
            />
          </div>

          <div className="cm-field">
            <label htmlFor="cm-body" className="t-label">
              nội dung
            </label>
            <textarea
              id="cm-body"
              rows={4}
              className="field"
              value={composeBody}
              onChange={(e) => setComposeBody(e.target.value)}
              placeholder="Mô tả bối cảnh, giả định và điều cần kiểm chứng"
            />
          </div>

          {(composeChannel === 'showcase' || composeIncludeDemo) && (
            <>
              <div className="cm-field">
                <label htmlFor="cm-html" className="t-label">
                  HTML mẫu
                </label>
                <textarea
                  id="cm-html"
                  rows={3}
                  className="field"
                  value={composeHtml}
                  onChange={(e) => setComposeHtml(e.target.value)}
                  placeholder="<section class='card'>...</section>"
                />
              </div>
              <div className="cm-field">
                <label htmlFor="cm-css" className="t-label">
                  CSS mẫu
                </label>
                <textarea
                  id="cm-css"
                  rows={3}
                  className="field"
                  value={composeCss}
                  onChange={(e) => setComposeCss(e.target.value)}
                  placeholder=".card { padding: 20px; border: 1px solid currentColor; }"
                />
              </div>
            </>
          )}

          {(composeChannel === 'drops' || composeChannel === 'clubs') && (
            <div className="cm-field">
              <label htmlFor="cm-payload" className="t-label">
                {composeChannel === 'clubs'
                  ? 'cột mốc tiếp theo (mỗi dòng một mục)'
                  : 'nội dung tài liệu'}
              </label>
              <textarea
                id="cm-payload"
                rows={4}
                className="field"
                value={composePayload}
                onChange={(e) => setComposePayload(e.target.value)}
              />
            </div>
          )}

          <div className="cm-field">
            <label htmlFor="cm-tags" className="t-label">
              thẻ (phân tách bằng dấu phẩy)
            </label>
            <input
              id="cm-tags"
              type="text"
              className="field"
              value={composeTagsInput}
              onChange={(e) => setComposeTagsInput(e.target.value)}
              placeholder="accessibility, diff, tokens"
            />
          </div>

          <div className="cm-dialog-actions">
            <button type="button" className="btn btn-line" onClick={() => setComposerOpen(false)}>
              Hủy
            </button>
            <button
              type="submit"
              className="btn btn-red"
              disabled={submittingPost || !composeTitle.trim()}
            >
              {submittingPost ? 'Đang đăng' : 'Đăng bài'}
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
            <h2 className="t-title" style={{ fontSize: 'var(--text-xl)' }}>
              Báo cáo bài viết
            </h2>
            <button
              type="button"
              className="icon-btn"
              onClick={() => setReportTarget(null)}
              aria-label="Đóng"
              title="Đóng"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>
          <p className="t-label">{reportTarget ? whiteLabelText(reportTarget.title) : ''}</p>
          <div className="cm-field">
            <label htmlFor="cm-reason" className="t-label">
              lý do
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
              className="icon-btn"
              onClick={() => setDossierClub(null)}
              aria-label="Đóng"
              title="Đóng"
            >
              <X size={18} aria-hidden="true" />
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

      <Modal
        open={previewPost !== null}
        onClose={() => setPreviewPost(null)}
        label={previewPost ? whiteLabelText(previewPost.title) : 'Xem thử hộp cát'}
        className="cm-dialog-wide"
      >
        {previewPost && (
          <div className="cm-dialog-body">
            <div className="cm-dialog-head">
              <div>
                <p className="t-label">live view hộp cát</p>
                <h2 className="t-title" style={{ fontSize: 'var(--text-xl)' }}>
                  {whiteLabelText(previewPost.title)}
                </h2>
              </div>
              <button
                type="button"
                className="icon-btn"
                onClick={() => setPreviewPost(null)}
                aria-label="Đóng"
                title="Đóng"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>
            <div className="cm-preview" style={{ aspectRatio: '16 / 9' }}>
              <iframe
                title={`Hộp cát ${whiteLabelText(previewPost.title)}`}
                sandbox="allow-scripts"
                referrerPolicy="no-referrer"
                srcDoc={buildShowcasePreviewDoc(previewPost, theme)}
              />
            </div>
            <div className="cm-dialog-actions">
              <button type="button" className="btn btn-line" onClick={() => setPreviewPost(null)}>
                Đóng
              </button>
              <button
                type="button"
                className="btn btn-red"
                onClick={() => {
                  forkPostToWorkspace(previewPost);
                  setPreviewPost(null);
                }}
              >
                Workspace
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CommunityView;
