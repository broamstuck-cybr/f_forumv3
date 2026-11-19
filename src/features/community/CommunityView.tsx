import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowUp,
  Bookmark,
  BookmarkCheck,
  Flag,
  X,
} from 'lucide-react';
import type {
  ClubHandoverDossier,
  CommunityAnswer,
  CommunityChannel,
  CommunityPost,
} from '../../types/index';
import { useAppStore } from '../../store/appStore';
import {
  CHAT_ROOM_PEOPLE,
  ChatRoom,
  FileBox,
  LiquidTabs,
  Magnify,
  PresenceCards,
  ReaderCard,
  SearchCard,
} from '../../components/pinui';

type SalonTab = 'critique' | 'clubs' | 'knowledge';
type CritiqueFilter = 'all' | 'qa' | 'showcase';

const QA_CATEGORIES = ['Bug Fix', 'Prompt Engineering', 'UI/UX Critique'];

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

function splitOrnate(raw: string): { cap: string; rest: string } {
  const text = raw.trim();
  if (!text) return { cap: '', rest: '' };
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    const seg = new Intl.Segmenter('vi', { granularity: 'grapheme' });
    const first = seg.segment(text)[Symbol.iterator]().next().value;
    const cap = first ? first.segment : text.slice(0, 1);
    return { cap, rest: text.slice(cap.length) };
  }
  return { cap: text.slice(0, 1), rest: text.slice(1) };
}

function escapeHtml(raw: string): string {
  return raw.replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function buildShowcasePreviewDoc(post: CommunityPost, theme: 'dark' | 'light'): string {
  const isDark = theme === 'dark';
  const bg = isDark ? '#090a0d' : '#f7f5f0';
  const ink = isDark ? '#f4f1ea' : '#141413';
  const surface = isDark ? '#0f1117' : '#fbfbfa';
  const border = isDark ? 'rgba(244,241,234,0.14)' : 'rgba(20,20,19,0.14)';
  const snippet = post.demoSnippet || {
    html: `<section style="padding:28px;border-radius:18px;border:1px solid ${border};background:${surface};max-width:460px"><h3 style="font-family:Georgia,serif;font-size:22px;margin-bottom:8px">${escapeHtml(post.title)}</h3><p style="font-size:14px;line-height:1.6;opacity:0.8">${escapeHtml(post.description || post.body || '')}</p></section>`,
    css: '',
  };
  return `<!DOCTYPE html><html lang="vi"><head><meta charset="utf-8" /><style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{min-height:100vh;display:grid;place-items:center;padding:24px;background:${bg};color:${ink};font-family:'Be Vietnam Pro',system-ui,sans-serif}
    ${snippet.css || ''}
  </style></head><body>${snippet.html || ''}${snippet.js ? `<script>${snippet.js}</script>` : ''}</body></html>`;
}

export const CommunityView: React.FC = () => {
  const {
    communityChannels,
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
  } = useAppStore();

  const [salonTab, setSalonTab] = useState<SalonTab>('critique');
  const [critiqueFilter, setCritiqueFilter] = useState<CritiqueFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedCritiqueId, setSelectedCritiqueId] = useState<string | null>(null);
  const [selectedClubId, setSelectedClubId] = useState<string | null>(null);
  const [selectedDropId, setSelectedDropId] = useState<string | null>(null);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);

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

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (previewPost) setPreviewPost(null);
      else if (composerOpen) setComposerOpen(false);
      else if (reportTarget) setReportTarget(null);
      else if (dossierClub) setDossierClub(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [previewPost, composerOpen, reportTarget, dossierClub]);

  const filterBySearch = (posts: CommunityPost[]) => {
    const q = searchQuery.trim().toLowerCase();
    return posts.filter((post) => {
      if (post.hidden) return false;
      if (!q) return true;
      return (
        post.title.toLowerCase().includes(q) ||
        (post.name || '').toLowerCase().includes(q) ||
        (post.body || '').toLowerCase().includes(q) ||
        (post.description || '').toLowerCase().includes(q) ||
        post.category.toLowerCase().includes(q) ||
        post.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  };

  const critiquePosts = useMemo(() => {
    const qaList = critiqueFilter === 'showcase' ? [] : communityChannels.qa;
    const showcaseList = critiqueFilter === 'qa' ? [] : communityChannels.showcase;
    return filterBySearch([...qaList, ...showcaseList]);
  }, [communityChannels.qa, communityChannels.showcase, critiqueFilter, searchQuery]);

  const clubPosts = useMemo(
    () => filterBySearch(communityChannels.clubs),
    [communityChannels.clubs, searchQuery]
  );

  const dropPosts = useMemo(
    () => filterBySearch(communityChannels.drops),
    [communityChannels.drops, searchQuery]
  );

  const activeCritique = useMemo(() => {
    return (
      critiquePosts.find((p) => p.id === selectedCritiqueId) ||
      critiquePosts[0] ||
      null
    );
  }, [critiquePosts, selectedCritiqueId]);

  const activeClub = useMemo(() => {
    return clubPosts.find((p) => p.id === selectedClubId) || clubPosts[0] || null;
  }, [clubPosts, selectedClubId]);

  const activeDrop = useMemo(() => {
    return dropPosts.find((p) => p.id === selectedDropId) || dropPosts[0] || null;
  }, [dropPosts, selectedDropId]);

  const activeThreadPost = useMemo(() => {
    if (!activeThreadId) return null;
    const all = [
      ...communityChannels.qa,
      ...communityChannels.showcase,
      ...communityChannels.drops,
      ...communityChannels.clubs,
    ];
    return all.find((p) => p.id === activeThreadId) || null;
  }, [activeThreadId, communityChannels]);

  const requireSignedIn = (): boolean => {
    if (currentUser) return true;
    addToast({
      type: 'info',
      title: 'Cần đăng nhập để thực hiện thao tác này',
      message: 'Mở cửa sổ đăng nhập để đăng bài, phản biện hoặc cập nhật hồ sơ.',
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
    if (!activeThreadPost || !replyText.trim()) return;
    if (!requireSignedIn()) return;
    setSubmittingReply(true);
    try {
      await answerPost(activeThreadPost.id, replyText.trim());
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
    setComposeTitle(activeProject.name);
    setComposeBody(activeProject.description);
    setComposeHtml(htmlFile?.content || '');
    setComposeCss(cssFile?.content || '');
    addToast({
      type: 'info',
      title: 'Đã nạp dự án từ Workspace',
      message: activeProject.name,
    });
  };

  const openComposerForTab = () => {
    if (salonTab === 'clubs') setComposeChannel('clubs');
    else if (salonTab === 'knowledge') setComposeChannel('drops');
    else setComposeChannel(critiqueFilter === 'showcase' ? 'showcase' : 'qa');
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

    try {
      if (composeChannel === 'qa') {
        await createPost({
          channel: 'qa',
          title: composeTitle.trim(),
          body: composeBody.trim(),
          category: composeCategory,
          tags: parsedTags.length > 0 ? parsedTags : [composeCategory],
        });
        setSalonTab('critique');
      } else if (composeChannel === 'showcase') {
        await createPost({
          channel: 'showcase',
          title: composeTitle.trim(),
          body: composeBody.trim(),
          category: 'Workspace Showcase',
          tags: parsedTags.length > 0 ? parsedTags : ['showcase', 'sandbox'],
          demoSnippet: {
            html:
              composeHtml.trim() ||
              `<div class="demo-box"><h3>${escapeHtml(composeTitle.trim())}</h3><p>${escapeHtml(composeBody.trim())}</p></div>`,
            css:
              composeCss.trim() ||
              '.demo-box{padding:24px;border-radius:16px;border:1px solid rgba(200,155,84,0.35);background:#0f1117;color:#f4f1ea}',
          },
        });
        setSalonTab('critique');
      } else if (composeChannel === 'drops') {
        await createPost({
          channel: 'drops',
          title: composeTitle.trim(),
          body: composeBody.trim(),
          category: composeCategory || 'Prompt Blueprint',
          tags: parsedTags.length > 0 ? parsedTags : ['blueprint', 'rules'],
          fileType: 'markdown',
          payload: composePayload.trim() || composeBody.trim(),
        });
        setSalonTab('knowledge');
      } else {
        await createPost({
          channel: 'clubs',
          title: composeTitle.trim(),
          body: composeBody.trim(),
          category: 'Club Recruitment',
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
        setSalonTab('clubs');
      }
      setComposeTitle('');
      setComposeBody('');
      setComposeTagsInput('');
      setComposePayload('');
      setComposeHtml('');
      setComposeCss('');
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

  const headingSplit = splitOrnate('Source of Knowledge');

  const critiqueParagraphs = useMemo(() => {
    if (!activeCritique) return undefined;
    const answers = getAllAnswers(activeCritique);
    const list = [
      activeCritique.body || activeCritique.description || activeCritique.title,
      `Chuyên mục ${activeCritique.category} · Khởi xướng bởi ${activeCritique.author.name} (@${activeCritique.author.handle}).`,
    ];
    if (answers.length > 0) {
      list.push(
        `Phản biện nổi bật (@${answers[0].author.handle}): ${answers[0].content}`
      );
    } else {
      list.push(
        'Chủ đề đang mở đón nhận phản biện kiến trúc, kiểm chứng số liệu và đề xuất phương án tối giản.'
      );
    }
    return list;
  }, [activeCritique]);

  const dropParagraphs = useMemo(() => {
    if (!activeDrop) return undefined;
    return [
      activeDrop.payload || activeDrop.body || activeDrop.description || activeDrop.title,
      `Tài liệu ${activeDrop.category} do ${activeDrop.author.name} (@${activeDrop.author.handle}) biên soạn.`,
      `Có thể nhân bản trực tiếp sang Workspace để đối chiếu qua Diff & Check.`,
    ];
  }, [activeDrop]);

  return (
    <div className="ff-container pt-8 pb-24 space-y-10">
      <header
        className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between border-b pb-8"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        <div className="max-w-2xl space-y-3">
          <p className="font-mono text-[11px] tracking-[0.22em]" style={{ color: 'var(--accent-primary)' }}>
            F-FORUM · SALON PHẢN BIỆN &amp; HỌC LIỆU
          </p>
          <h1
            className="m-0 font-semibold tracking-tight leading-[1.05]"
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(2.2rem, 4.4vw, 3.5rem)',
              color: 'var(--ink-primary)',
            }}
          >
            <span className="ornate-cap">{headingSplit.cap}</span>
            {headingSplit.rest}
          </h1>
          <p className="m-0 text-[15px] leading-relaxed" style={{ color: 'var(--ink-secondary)' }}>
            Không gian đối thoại Socratic, soi xét nguyên mẫu trực tiếp trong hộp cát và lưu giữ hồ sơ chuyển giao giữa các thế hệ kỹ sư.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center lg:w-[460px]">
          <div className="min-w-0 flex-1">
            <SearchCard
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Tìm phản biện, nguyên mẫu, hội nhóm..."
              compact
            />
          </div>
          <button
            type="button"
            onClick={openComposerForTab}
            className="h-10 shrink-0 rounded-full px-5 text-xs font-semibold cursor-pointer"
            style={{
              backgroundColor: 'var(--accent-primary)',
              color: 'var(--ink-inverse)',
            }}
          >
            Đăng bài
          </button>
        </div>
      </header>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <LiquidTabs
          tabs={[
            { id: 'critique', label: 'Phản biện' },
            { id: 'clubs', label: 'Hội nhóm' },
            { id: 'knowledge', label: 'Học liệu' },
          ]}
          activeId={salonTab}
          onChange={(id) => {
            setSalonTab(id as SalonTab);
            setActiveThreadId(null);
          }}
          ariaLabel="Phân khu tri thức"
        />

        {salonTab === 'critique' ? (
          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                { id: 'all', label: 'Tất cả' },
                { id: 'qa', label: 'Hỏi đáp' },
                { id: 'showcase', label: 'Trình diễn' },
              ] as const
            ).map((opt) => {
              const active = critiqueFilter === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setCritiqueFilter(opt.id)}
                  className="rounded-full border px-4 py-1.5 text-xs font-medium cursor-pointer transition-colors"
                  style={{
                    backgroundColor: active ? 'var(--accent-soft)' : 'var(--bg-surface)',
                    borderColor: active ? 'var(--border-accent)' : 'var(--border-subtle)',
                    color: active ? 'var(--accent-primary)' : 'var(--ink-secondary)',
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      {salonTab === 'critique' ? (
        <section aria-label="Salon Phản biện" className="space-y-12">
          {critiquePosts.length === 0 ? (
            <div
              className="rounded-[24px] border p-12 text-center space-y-3"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <p className="text-lg font-semibold" style={{ fontFamily: 'var(--font-serif)', color: 'var(--ink-primary)' }}>
                Chưa có chủ đề phù hợp
              </p>
              <button
                type="button"
                onClick={openComposerForTab}
                className="h-9 rounded-full px-5 text-xs font-semibold cursor-pointer"
                style={{
                  backgroundColor: 'var(--accent-primary)',
                  color: 'var(--ink-inverse)',
                }}
              >
                Đăng bài
              </button>
            </div>
          ) : (
            <>
              {activeCritique ? (
                <div className="grid grid-cols-1 lg:grid-cols-[1.35fr_0.65fr] gap-6 items-stretch">
                  <div className="min-w-0 flex flex-col justify-between gap-4">
                    <ReaderCard
                      title={activeCritique.title}
                      subtitle={`${activeCritique.category} · @${activeCritique.author.handle}`}
                      paragraphs={critiqueParagraphs}
                      openLabel="Đọc sâu"
                      theme={theme}
                      className="w-full flex-1"
                    />

                    <div
                      className="flex flex-wrap items-center gap-2.5 rounded-[20px] border px-4 py-3"
                      style={{
                        backgroundColor: 'var(--bg-surface)',
                        borderColor: 'var(--border-subtle)',
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => void handleUpvote(activeCritique.id)}
                        aria-label={`Bình chọn ${activeCritique.title}`}
                        title="Bình chọn"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border cursor-pointer"
                        style={{
                          backgroundColor: 'var(--bg-panel)',
                          borderColor: 'var(--border-subtle)',
                          color: 'var(--accent-primary)',
                        }}
                      >
                        <ArrowUp className="h-4 w-4" aria-hidden="true" />
                      </button>
                      <span className="font-mono text-xs font-semibold pr-2" style={{ color: 'var(--ink-primary)' }}>
                        {activeCritique.votes ?? activeCritique.likes ?? 0}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          setActiveThreadId(activeThreadId === activeCritique.id ? null : activeCritique.id)
                        }
                        className="h-9 rounded-full border px-4 text-xs font-medium cursor-pointer"
                        style={{
                          backgroundColor:
                            activeThreadId === activeCritique.id ? 'var(--accent-verdigris-soft)' : 'var(--bg-panel)',
                          borderColor:
                            activeThreadId === activeCritique.id ? 'var(--accent-verdigris)' : 'var(--border-subtle)',
                          color:
                            activeThreadId === activeCritique.id ? 'var(--accent-verdigris)' : 'var(--ink-primary)',
                        }}
                      >
                        Trả lời
                      </button>

                      {activeCritique.channel === 'showcase' || activeCritique.demoSnippet ? (
                        <button
                          type="button"
                          onClick={() => setPreviewPost(activeCritique)}
                          className="h-9 rounded-full px-4 text-xs font-semibold cursor-pointer"
                          style={{
                            backgroundColor: 'var(--accent-primary)',
                            color: 'var(--ink-inverse)',
                          }}
                        >
                          Xem thử
                        </button>
                      ) : null}

                      <button
                        type="button"
                        onClick={() => forkPostToWorkspace(activeCritique)}
                        className="h-9 rounded-full border px-4 text-xs font-medium cursor-pointer"
                        style={{
                          backgroundColor: 'var(--bg-panel)',
                          borderColor: 'var(--border-accent)',
                          color: 'var(--accent-primary)',
                        }}
                      >
                        Workspace
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleSavedItem(activeCritique.id)}
                        aria-label={savedItemIds.includes(activeCritique.id) ? 'Bỏ lưu' : 'Lưu bài'}
                        title={savedItemIds.includes(activeCritique.id) ? 'Bỏ lưu' : 'Lưu bài'}
                        className="ml-auto inline-flex h-9 w-9 items-center justify-center rounded-full border cursor-pointer"
                        style={{
                          backgroundColor: 'var(--bg-panel)',
                          borderColor: savedItemIds.includes(activeCritique.id)
                            ? 'var(--accent-jade)'
                            : 'var(--border-subtle)',
                          color: savedItemIds.includes(activeCritique.id)
                            ? 'var(--accent-jade)'
                            : 'var(--ink-secondary)',
                        }}
                      >
                        {savedItemIds.includes(activeCritique.id) ? (
                          <BookmarkCheck className="h-4 w-4" aria-hidden="true" />
                        ) : (
                          <Bookmark className="h-4 w-4" aria-hidden="true" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setReportTarget(activeCritique)}
                        aria-label={`Báo cáo ${activeCritique.title}`}
                        title="Báo cáo"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border cursor-pointer"
                        style={{
                          backgroundColor: 'var(--bg-panel)',
                          borderColor: 'var(--border-subtle)',
                          color: 'var(--ink-muted)',
                        }}
                      >
                        <Flag className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-center">
                    <Magnify
                      glyph={activeCritique.title.trim().slice(0, 1).toUpperCase() || 'S'}
                      microText={`${activeCritique.category.toUpperCase()} · @${activeCritique.author.handle.toUpperCase()} · ${activeCritique.tags.join(' · ').toUpperCase()} · `}
                      hintText="Di chuyển kính soi nguyên mẫu · Chạm để phóng đại"
                      theme={theme}
                      size={340}
                    />
                  </div>
                </div>
              ) : null}

              <div className="space-y-4">
                <div className="flex items-end justify-between gap-4 border-b pb-3" style={{ borderColor: 'var(--border-subtle)' }}>
                  <h2
                    className="text-xl font-semibold"
                    style={{ fontFamily: 'var(--font-serif)', color: 'var(--ink-primary)' }}
                  >
                    Chuỗi Phản biện &amp; Nguyên mẫu
                  </h2>
                  <span className="font-mono text-xs" style={{ color: 'var(--ink-muted)' }}>
                    {critiquePosts.length} chủ đề
                  </span>
                </div>

                <div className="flex gap-5 overflow-x-auto pb-4 snap-x ff-scrollbar">
                  {critiquePosts.map((post) => {
                    const active = activeCritique?.id === post.id;
                    const isSaved = savedItemIds.includes(post.id);
                    const replyCount = getAllAnswers(post).length;
                    return (
                      <article
                        key={post.id}
                        className="min-w-[300px] max-w-[345px] shrink-0 snap-start rounded-[22px] border p-5 flex flex-col justify-between gap-4"
                        style={{
                          backgroundColor: active ? 'var(--bg-elevated)' : 'var(--bg-surface)',
                          borderColor: active ? 'var(--accent-primary)' : 'var(--border-subtle)',
                        }}
                      >
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between gap-2 font-mono text-[11px]">
                            <span style={{ color: 'var(--accent-primary)' }}>{post.category}</span>
                            <span style={{ color: 'var(--ink-muted)' }}>@{post.author.handle}</span>
                          </div>
                          <h3
                            className="line-clamp-2 text-lg font-semibold leading-snug"
                            style={{ fontFamily: 'var(--font-serif)', color: 'var(--ink-primary)' }}
                          >
                            {post.title}
                          </h3>
                          <p className="line-clamp-2 text-[13px] leading-relaxed" style={{ color: 'var(--ink-secondary)' }}>
                            {post.body || post.description}
                          </p>
                          <div className="flex items-center gap-3 font-mono text-[11px]" style={{ color: 'var(--ink-muted)' }}>
                            <span>{post.votes ?? post.likes ?? 0} bình chọn</span>
                            <span>{replyCount} phản hồi</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 border-t pt-3" style={{ borderColor: 'var(--border-subtle)' }}>
                          <button
                            type="button"
                            onClick={() => setSelectedCritiqueId(post.id)}
                            className="h-8 rounded-full border px-3.5 text-xs font-medium cursor-pointer"
                            style={{
                              backgroundColor: active ? 'var(--accent-primary)' : 'var(--bg-panel)',
                              borderColor: active ? 'var(--accent-primary)' : 'var(--border-subtle)',
                              color: active ? 'var(--ink-inverse)' : 'var(--ink-primary)',
                            }}
                          >
                            Xem bài
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCritiqueId(post.id);
                              setActiveThreadId(post.id);
                            }}
                            className="h-8 rounded-full border px-3.5 text-xs font-medium cursor-pointer"
                            style={{
                              backgroundColor: 'var(--bg-panel)',
                              borderColor: 'var(--border-subtle)',
                              color: 'var(--ink-secondary)',
                            }}
                          >
                            Trả lời
                          </button>
                          {post.channel === 'showcase' || post.demoSnippet ? (
                            <button
                              type="button"
                              onClick={() => setPreviewPost(post)}
                              className="h-8 rounded-full px-3.5 text-xs font-semibold cursor-pointer"
                              style={{
                                backgroundColor: 'var(--accent-primary)',
                                color: 'var(--ink-inverse)',
                              }}
                            >
                              Xem thử
                            </button>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => toggleSavedItem(post.id)}
                            aria-label={isSaved ? `Bỏ lưu ${post.title}` : `Lưu ${post.title}`}
                            title={isSaved ? 'Bỏ lưu' : 'Lưu'}
                            className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-full border cursor-pointer"
                            style={{
                              backgroundColor: 'var(--bg-panel)',
                              borderColor: isSaved ? 'var(--accent-jade)' : 'var(--border-subtle)',
                              color: isSaved ? 'var(--accent-jade)' : 'var(--ink-secondary)',
                            }}
                          >
                            {isSaved ? (
                              <BookmarkCheck className="h-3.5 w-3.5" aria-hidden="true" />
                            ) : (
                              <Bookmark className="h-3.5 w-3.5" aria-hidden="true" />
                            )}
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </section>
      ) : salonTab === 'clubs' ? (
        <section aria-label="Hội nhóm và Hồ sơ bàn giao" className="space-y-10">
          {clubPosts.length === 0 ? (
            <div
              className="rounded-[24px] border p-12 text-center space-y-3"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <p className="text-lg font-semibold" style={{ fontFamily: 'var(--font-serif)', color: 'var(--ink-primary)' }}>
                Chưa có hội nhóm khớp tìm kiếm
              </p>
            </div>
          ) : (
            <>
              {activeClub ? (
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] items-start">
                  <div className="space-y-4">
                    <PresenceCards
                      title={activeClub.name || activeClub.title}
                      subtitle={`${activeClub.category} · ${activeClub.membersCount || 6} thành viên`}
                      members={[
                        {
                          name: activeClub.lead || activeClub.author.name,
                          role: 'Chủ trì',
                          status: 'Sẵn sàng',
                        },
                        {
                          name: activeClub.activeDossier?.ownerHandle
                            ? `@${activeClub.activeDossier.ownerHandle}`
                            : `@${activeClub.author.handle}`,
                          role: 'Bàn giao',
                          status: 'Đang nối',
                        },
                      ]}
                      actionLabel="Cập nhật"
                      onAction={() => openEditDossier(activeClub)}
                    >
                      <div className="space-y-4">
                        <p className="text-[14px] leading-relaxed" style={{ color: 'var(--ink-secondary)' }}>
                          {activeClub.description || activeClub.body}
                        </p>

                        {activeClub.activeDossier ? (
                          <div
                            className="rounded-[16px] border p-4 space-y-2.5"
                            style={{
                              backgroundColor: 'var(--bg-panel)',
                              borderColor: 'var(--border-subtle)',
                            }}
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="font-mono text-[11px]" style={{ color: 'var(--accent-primary)' }}>
                                HỒ SƠ CHUYỂN GIAO
                              </span>
                              <span className="font-mono text-[11px]" style={{ color: 'var(--accent-jade)' }}>
                                Đang bàn giao
                              </span>
                            </div>
                            <h4 className="text-base font-semibold" style={{ fontFamily: 'var(--font-serif)', color: 'var(--ink-primary)' }}>
                              {activeClub.activeDossier.projectTitle}
                            </h4>
                            <p className="text-xs leading-relaxed" style={{ color: 'var(--ink-secondary)' }}>
                              {activeClub.activeDossier.handoverNotes}
                            </p>
                            {activeClub.activeDossier.nextMilestones?.length ? (
                              <ul className="space-y-1.5 pt-2 border-t text-xs" style={{ borderColor: 'var(--border-subtle)', color: 'var(--ink-secondary)' }}>
                                {activeClub.activeDossier.nextMilestones.map((ms, idx) => (
                                  <li key={`${activeClub.id}-ms-${idx}`} className="flex items-start gap-2">
                                    <span
                                      className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                                      style={{ backgroundColor: 'var(--accent-verdigris)' }}
                                    />
                                    <span>{ms}</span>
                                  </li>
                                ))}
                              </ul>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    </PresenceCards>

                    <div
                      className="flex flex-wrap items-center gap-2.5 rounded-[20px] border px-4 py-3"
                      style={{
                        backgroundColor: 'var(--bg-surface)',
                        borderColor: 'var(--border-subtle)',
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => void handleUpvote(activeClub.id)}
                        aria-label={`Bình chọn ${activeClub.name || activeClub.title}`}
                        title="Bình chọn"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border cursor-pointer"
                        style={{
                          backgroundColor: 'var(--bg-panel)',
                          borderColor: 'var(--border-subtle)',
                          color: 'var(--accent-primary)',
                        }}
                      >
                        <ArrowUp className="h-4 w-4" aria-hidden="true" />
                      </button>
                      <span className="font-mono text-xs font-semibold pr-2" style={{ color: 'var(--ink-primary)' }}>
                        {activeClub.votes ?? 0}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          setActiveThreadId(activeThreadId === activeClub.id ? null : activeClub.id)
                        }
                        className="h-9 rounded-full border px-4 text-xs font-medium cursor-pointer"
                        style={{
                          backgroundColor:
                            activeThreadId === activeClub.id ? 'var(--accent-verdigris-soft)' : 'var(--bg-panel)',
                          borderColor:
                            activeThreadId === activeClub.id ? 'var(--accent-verdigris)' : 'var(--border-subtle)',
                          color:
                            activeThreadId === activeClub.id ? 'var(--accent-verdigris)' : 'var(--ink-primary)',
                        }}
                      >
                        Trả lời
                      </button>

                      <button
                        type="button"
                        onClick={() => setReportTarget(activeClub)}
                        aria-label={`Báo cáo ${activeClub.name || activeClub.title}`}
                        title="Báo cáo"
                        className="ml-auto inline-flex h-9 w-9 items-center justify-center rounded-full border cursor-pointer"
                        style={{
                          backgroundColor: 'var(--bg-panel)',
                          borderColor: 'var(--border-subtle)',
                          color: 'var(--ink-muted)',
                        }}
                      >
                        <Flag className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <ChatRoom
                      title="Phòng họp"
                      people={CHAT_ROOM_PEOPLE}
                      defaultOpen
                    />
                    <FileBox
                      title="Hồ sơ bàn giao"
                      activeId={activeClub.id}
                      onSelect={(id) => setSelectedClubId(id)}
                      tabs={clubPosts.map((club) => ({
                        id: club.id,
                        label: club.activeDossier?.projectTitle || club.name || club.title,
                        meta: `@${club.activeDossier?.ownerHandle || club.author.handle}`,
                        onOpen: () => openEditDossier(club),
                      }))}
                    />
                  </div>
                </div>
              ) : null}

              <div className="space-y-4">
                <div className="flex items-end justify-between gap-4 border-b pb-3" style={{ borderColor: 'var(--border-subtle)' }}>
                  <h2
                    className="text-xl font-semibold"
                    style={{ fontFamily: 'var(--font-serif)', color: 'var(--ink-primary)' }}
                  >
                    Danh mục Hội nhóm
                  </h2>
                  <span className="font-mono text-xs" style={{ color: 'var(--ink-muted)' }}>
                    {clubPosts.length} nhóm
                  </span>
                </div>

                <div className="flex gap-5 overflow-x-auto pb-4 snap-x ff-scrollbar">
                  {clubPosts.map((club) => {
                    const active = activeClub?.id === club.id;
                    return (
                      <article
                        key={club.id}
                        className="min-w-[295px] max-w-[340px] shrink-0 snap-start rounded-[22px] border p-5 flex flex-col justify-between gap-4"
                        style={{
                          backgroundColor: active ? 'var(--bg-elevated)' : 'var(--bg-surface)',
                          borderColor: active ? 'var(--accent-primary)' : 'var(--border-subtle)',
                        }}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2 font-mono text-[11px]">
                            <span style={{ color: 'var(--accent-primary)' }}>{club.membersCount || 6} thành viên</span>
                            <span style={{ color: 'var(--ink-muted)' }}>{club.lead || club.author.name}</span>
                          </div>
                          <h3
                            className="text-lg font-semibold"
                            style={{ fontFamily: 'var(--font-serif)', color: 'var(--ink-primary)' }}
                          >
                            {club.name || club.title}
                          </h3>
                          <p className="line-clamp-2 text-[13px] leading-relaxed" style={{ color: 'var(--ink-secondary)' }}>
                            {club.description || club.body}
                          </p>
                        </div>

                        <div className="flex items-center justify-between gap-2 border-t pt-3" style={{ borderColor: 'var(--border-subtle)' }}>
                          <button
                            type="button"
                            onClick={() => setSelectedClubId(club.id)}
                            className="h-8 rounded-full border px-3.5 text-xs font-medium cursor-pointer"
                            style={{
                              backgroundColor: active ? 'var(--accent-primary)' : 'var(--bg-panel)',
                              borderColor: active ? 'var(--accent-primary)' : 'var(--border-subtle)',
                              color: active ? 'var(--ink-inverse)' : 'var(--ink-primary)',
                            }}
                          >
                            Chọn nhóm
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditDossier(club)}
                            className="h-8 rounded-full border px-3.5 text-xs font-medium cursor-pointer"
                            style={{
                              backgroundColor: 'var(--bg-panel)',
                              borderColor: 'var(--border-accent)',
                              color: 'var(--accent-primary)',
                            }}
                          >
                            Cập nhật
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </section>
      ) : (
        <section aria-label="Kho Học liệu và Quy tắc" className="space-y-12">
          {dropPosts.length === 0 ? (
            <div
              className="rounded-[24px] border p-12 text-center space-y-3"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <p className="text-lg font-semibold" style={{ fontFamily: 'var(--font-serif)', color: 'var(--ink-primary)' }}>
                Chưa có học liệu phù hợp
              </p>
            </div>
          ) : (
            <>
              {activeDrop ? (
                <div className="grid grid-cols-1 lg:grid-cols-[1.35fr_0.65fr] gap-6 items-stretch">
                  <div className="min-w-0 flex flex-col justify-between gap-6">
                    <ReaderCard
                      title={activeDrop.title}
                      subtitle={`${activeDrop.category} · @${activeDrop.author.handle}`}
                      paragraphs={dropParagraphs}
                      openLabel="Đọc sâu"
                      theme={theme}
                      className="w-full"
                    />

                    <FileBox
                      title="Kho Học liệu"
                      activeId={activeDrop.id}
                      onSelect={(id) => setSelectedDropId(id)}
                      tabs={dropPosts.map((drop) => ({
                        id: drop.id,
                        label: drop.title,
                        meta: `${drop.category} · ${drop.forks || 0} bản sao`,
                        onOpen: () => forkPostToWorkspace(drop),
                      }))}
                    />
                  </div>

                  <div className="space-y-5">
                    <div className="flex justify-center">
                      <Magnify
                        glyph={activeDrop.title.trim().slice(0, 1).toUpperCase() || 'K'}
                        microText={`${activeDrop.category.toUpperCase()} · ${activeDrop.tags.join(' · ').toUpperCase()} · `}
                        hintText="Di chuyển kính soi đặc tả · Chạm để phóng đại"
                        theme={theme}
                        size={340}
                      />
                    </div>

                    {activeDrop.payload ? (
                      <pre
                        className="overflow-x-auto rounded-[18px] border p-4 font-mono text-xs leading-relaxed ff-scrollbar"
                        style={{
                          backgroundColor: 'var(--bg-panel)',
                          borderColor: 'var(--border-subtle)',
                          color: 'var(--ink-primary)',
                        }}
                      >
                        <code>{activeDrop.payload}</code>
                      </pre>
                    ) : null}

                    <div
                      className="flex flex-wrap items-center gap-2.5 rounded-[20px] border px-4 py-3"
                      style={{
                        backgroundColor: 'var(--bg-surface)',
                        borderColor: 'var(--border-subtle)',
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => void handleUpvote(activeDrop.id)}
                        aria-label={`Bình chọn ${activeDrop.title}`}
                        title="Bình chọn"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border cursor-pointer"
                        style={{
                          backgroundColor: 'var(--bg-panel)',
                          borderColor: 'var(--border-subtle)',
                          color: 'var(--accent-primary)',
                        }}
                      >
                        <ArrowUp className="h-4 w-4" aria-hidden="true" />
                      </button>
                      <span className="font-mono text-xs font-semibold pr-2" style={{ color: 'var(--ink-primary)' }}>
                        {activeDrop.votes ?? activeDrop.forks ?? 0}
                      </span>

                      <button
                        type="button"
                        onClick={() => forkPostToWorkspace(activeDrop)}
                        className="h-9 rounded-full px-5 text-xs font-semibold cursor-pointer"
                        style={{
                          backgroundColor: 'var(--accent-primary)',
                          color: 'var(--ink-inverse)',
                        }}
                      >
                        Workspace
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setActiveThreadId(activeThreadId === activeDrop.id ? null : activeDrop.id)
                        }
                        className="h-9 rounded-full border px-4 text-xs font-medium cursor-pointer"
                        style={{
                          backgroundColor: 'var(--bg-panel)',
                          borderColor: 'var(--border-subtle)',
                          color: 'var(--ink-primary)',
                        }}
                      >
                        Trả lời
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleSavedItem(activeDrop.id)}
                        aria-label={savedItemIds.includes(activeDrop.id) ? 'Bỏ lưu' : 'Lưu học liệu'}
                        title={savedItemIds.includes(activeDrop.id) ? 'Bỏ lưu' : 'Lưu học liệu'}
                        className="ml-auto inline-flex h-9 w-9 items-center justify-center rounded-full border cursor-pointer"
                        style={{
                          backgroundColor: 'var(--bg-panel)',
                          borderColor: savedItemIds.includes(activeDrop.id)
                            ? 'var(--accent-jade)'
                            : 'var(--border-subtle)',
                          color: savedItemIds.includes(activeDrop.id)
                            ? 'var(--accent-jade)'
                            : 'var(--ink-secondary)',
                        }}
                      >
                        {savedItemIds.includes(activeDrop.id) ? (
                          <BookmarkCheck className="h-4 w-4" aria-hidden="true" />
                        ) : (
                          <Bookmark className="h-4 w-4" aria-hidden="true" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setReportTarget(activeDrop)}
                        aria-label={`Báo cáo ${activeDrop.title}`}
                        title="Báo cáo"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border cursor-pointer"
                        style={{
                          backgroundColor: 'var(--bg-panel)',
                          borderColor: 'var(--border-subtle)',
                          color: 'var(--ink-muted)',
                        }}
                      >
                        <Flag className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="space-y-4">
                <div className="flex items-end justify-between gap-4 border-b pb-3" style={{ borderColor: 'var(--border-subtle)' }}>
                  <h2
                    className="text-xl font-semibold"
                    style={{ fontFamily: 'var(--font-serif)', color: 'var(--ink-primary)' }}
                  >
                    Tất cả Học liệu
                  </h2>
                  <span className="font-mono text-xs" style={{ color: 'var(--ink-muted)' }}>
                    {dropPosts.length} tài liệu
                  </span>
                </div>

                <div className="flex gap-5 overflow-x-auto pb-4 snap-x ff-scrollbar">
                  {dropPosts.map((drop) => {
                    const active = activeDrop?.id === drop.id;
                    return (
                      <article
                        key={drop.id}
                        className="min-w-[295px] max-w-[340px] shrink-0 snap-start rounded-[22px] border p-5 flex flex-col justify-between gap-4"
                        style={{
                          backgroundColor: active ? 'var(--bg-elevated)' : 'var(--bg-surface)',
                          borderColor: active ? 'var(--accent-primary)' : 'var(--border-subtle)',
                        }}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2 font-mono text-[11px]">
                            <span style={{ color: 'var(--accent-primary)' }}>{drop.category}</span>
                            <span style={{ color: 'var(--ink-muted)' }}>{drop.forks || 0} bản sao</span>
                          </div>
                          <h3
                            className="line-clamp-2 text-lg font-semibold"
                            style={{ fontFamily: 'var(--font-serif)', color: 'var(--ink-primary)' }}
                          >
                            {drop.title}
                          </h3>
                          <p className="line-clamp-2 text-[13px] leading-relaxed" style={{ color: 'var(--ink-secondary)' }}>
                            {drop.payload || drop.body || drop.description}
                          </p>
                        </div>

                        <div className="flex items-center justify-between gap-2 border-t pt-3" style={{ borderColor: 'var(--border-subtle)' }}>
                          <button
                            type="button"
                            onClick={() => setSelectedDropId(drop.id)}
                            className="h-8 rounded-full border px-3.5 text-xs font-medium cursor-pointer"
                            style={{
                              backgroundColor: active ? 'var(--accent-primary)' : 'var(--bg-panel)',
                              borderColor: active ? 'var(--accent-primary)' : 'var(--border-subtle)',
                              color: active ? 'var(--ink-inverse)' : 'var(--ink-primary)',
                            }}
                          >
                            Xem bài
                          </button>
                          <button
                            type="button"
                            onClick={() => forkPostToWorkspace(drop)}
                            className="h-8 rounded-full px-4 text-xs font-semibold cursor-pointer"
                            style={{
                              backgroundColor: 'var(--accent-primary)',
                              color: 'var(--ink-inverse)',
                            }}
                          >
                            Workspace
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </section>
      )}

      {activeThreadPost ? (
        <section
          aria-label="Luồng phản biện chi tiết"
          className="rounded-[24px] border p-6 sm:p-8 space-y-5"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-accent)',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          <div className="flex items-start justify-between gap-4 border-b pb-4" style={{ borderColor: 'var(--border-subtle)' }}>
            <div className="space-y-1">
              <span className="font-mono text-[11px]" style={{ color: 'var(--accent-verdigris)' }}>
                LUỒNG PHẢN BIỆN
              </span>
              <h3 className="text-xl font-semibold" style={{ fontFamily: 'var(--font-serif)', color: 'var(--ink-primary)' }}>
                {activeThreadPost.title}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setActiveThreadId(null)}
              aria-label="Đóng luồng phản biện"
              title="Đóng"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border cursor-pointer"
              style={{
                backgroundColor: 'var(--bg-panel)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--ink-secondary)',
              }}
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <div className="space-y-3">
            {getAllAnswers(activeThreadPost).length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--ink-muted)' }}>
                Chưa có phản hồi kỹ thuật. Hãy mở đầu cuộc đối thoại bên dưới.
              </p>
            ) : (
              getAllAnswers(activeThreadPost).map((ans) => (
                <div
                  key={ans.id}
                  className="rounded-[18px] border p-4 space-y-2"
                  style={{
                    backgroundColor: 'var(--bg-panel)',
                    borderColor: ans.isAccepted ? 'var(--accent-jade)' : 'var(--border-subtle)',
                  }}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold" style={{ color: 'var(--ink-primary)' }}>
                        {ans.author.name}
                      </span>
                      <span className="font-mono" style={{ color: 'var(--ink-muted)' }}>
                        @{ans.author.handle}
                      </span>
                      {ans.isAccepted ? (
                        <span className="font-mono text-[11px] font-semibold" style={{ color: 'var(--accent-jade)' }}>
                          Đã chấp nhận
                        </span>
                      ) : null}
                    </div>

                    {activeThreadPost.channel === 'qa' && !ans.isAccepted ? (
                      <button
                        type="button"
                        onClick={() => void handleAcceptSolution(activeThreadPost.id, ans.id)}
                        className="rounded-full border px-3 py-1 text-[11px] font-semibold cursor-pointer"
                        style={{
                          borderColor: 'var(--accent-jade)',
                          color: 'var(--accent-jade)',
                        }}
                      >
                        Chấp nhận
                      </button>
                    ) : null}
                  </div>
                  <p className="whitespace-pre-line text-sm leading-relaxed" style={{ color: 'var(--ink-secondary)' }}>
                    {ans.content}
                  </p>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleSubmitReply} className="space-y-3">
            <textarea
              rows={3}
              value={replyText}
              onChange={(event) => setReplyText(event.target.value)}
              placeholder="Viết lập luận phản biện hoặc giải pháp kỹ thuật..."
              className="w-full rounded-[16px] border p-3.5 text-sm outline-none"
              style={{
                backgroundColor: 'var(--bg-panel)',
                borderColor: 'var(--border-strong)',
                color: 'var(--ink-primary)',
              }}
            />
            <div className="flex items-center justify-between gap-3">
              {!currentUser ? (
                <button
                  type="button"
                  onClick={() => setAuthModalOpen(true)}
                  className="rounded-full border px-4 py-2 text-xs font-medium cursor-pointer"
                  style={{
                    borderColor: 'var(--border-accent)',
                    color: 'var(--accent-primary)',
                  }}
                >
                  Đăng nhập
                </button>
              ) : (
                <span className="text-xs font-mono" style={{ color: 'var(--ink-muted)' }}>
                  @{currentUser.username}
                </span>
              )}
              <button
                type="submit"
                disabled={submittingReply || !replyText.trim()}
                className="h-9 rounded-full px-5 text-xs font-semibold cursor-pointer disabled:opacity-50"
                style={{
                  backgroundColor: 'var(--accent-primary)',
                  color: 'var(--ink-inverse)',
                }}
              >
                Gửi
              </button>
            </div>
          </form>
        </section>
      ) : null}

      <AnimatePresence>
        {composerOpen ? (
          <motion.div
            key="ff-composer-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setComposerOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-label="Khởi tạo bài viết mới"
            className="fixed inset-0 z-[85] flex items-center justify-center p-4"
            style={{
              backgroundColor: 'rgba(6, 8, 13, 0.72)',
              backdropFilter: 'blur(12px)',
            }}
          >
            <motion.form
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 8 }}
              onClick={(event) => event.stopPropagation()}
              onSubmit={handleCreatePost}
              className="w-full max-w-[560px] max-h-[90vh] overflow-y-auto rounded-[24px] border p-6 sm:p-7 space-y-4 ff-scrollbar"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-strong)',
                boxShadow: 'var(--shadow-lg)',
              }}
            >
              <div className="flex items-start justify-between gap-3 border-b pb-3" style={{ borderColor: 'var(--border-subtle)' }}>
                <div>
                  <span className="font-mono text-[11px]" style={{ color: 'var(--accent-primary)' }}>
                    BIÊN SOẠN MỚI
                  </span>
                  <h3 className="mt-0.5 text-xl font-semibold" style={{ fontFamily: 'var(--font-serif)', color: 'var(--ink-primary)' }}>
                    Đăng lên Source of Knowledge
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setComposerOpen(false)}
                  aria-label="Đóng hộp soạn thảo"
                  title="Đóng"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border cursor-pointer"
                  style={{
                    backgroundColor: 'var(--bg-panel)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--ink-secondary)',
                  }}
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {(
                  [
                    { id: 'qa', label: 'Hỏi đáp' },
                    { id: 'showcase', label: 'Trình diễn' },
                    { id: 'drops', label: 'Học liệu' },
                    { id: 'clubs', label: 'Hội nhóm' },
                  ] as const
                ).map((item) => {
                  const active = composeChannel === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setComposeChannel(item.id)}
                      className="rounded-full border px-3.5 py-1.5 text-xs font-medium cursor-pointer"
                      style={{
                        backgroundColor: active ? 'var(--accent-primary)' : 'var(--bg-panel)',
                        borderColor: active ? 'var(--accent-primary)' : 'var(--border-subtle)',
                        color: active ? 'var(--ink-inverse)' : 'var(--ink-secondary)',
                      }}
                    >
                      {item.label}
                    </button>
                  );
                })}
                {composeChannel === 'showcase' ? (
                  <button
                    type="button"
                    onClick={handlePrefillFromWorkspace}
                    className="ml-auto rounded-full border px-3.5 py-1.5 text-xs font-medium cursor-pointer"
                    style={{
                      backgroundColor: 'var(--bg-panel)',
                      borderColor: 'var(--border-accent)',
                      color: 'var(--accent-verdigris)',
                    }}
                  >
                    Nạp mẫu
                  </button>
                ) : null}
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--ink-secondary)' }}>
                  Tiêu đề
                </label>
                <input
                  type="text"
                  value={composeTitle}
                  onChange={(event) => setComposeTitle(event.target.value)}
                  placeholder="Nhập tiêu đề súc tích..."
                  className="h-10 w-full rounded-[12px] border px-3 text-sm outline-none"
                  style={{
                    backgroundColor: 'var(--bg-panel)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--ink-primary)',
                  }}
                />
              </div>

              {composeChannel === 'qa' ? (
                <div>
                  <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--ink-secondary)' }}>
                    Nhóm vấn đề
                  </label>
                  <select
                    value={composeCategory}
                    onChange={(event) => setComposeCategory(event.target.value)}
                    className="h-10 w-full rounded-[12px] border px-3 text-sm outline-none"
                    style={{
                      backgroundColor: 'var(--bg-panel)',
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--ink-primary)',
                    }}
                  >
                    {QA_CATEGORIES.map((tag) => (
                      <option key={tag} value={tag}>
                        {tag}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

              <div>
                <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--ink-secondary)' }}>
                  Nội dung
                </label>
                <textarea
                  rows={3}
                  value={composeBody}
                  onChange={(event) => setComposeBody(event.target.value)}
                  placeholder="Mô tả bối cảnh kỹ thuật, giả định và kết quả..."
                  className="w-full rounded-[12px] border p-3 text-sm outline-none"
                  style={{
                    backgroundColor: 'var(--bg-panel)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--ink-primary)',
                  }}
                />
              </div>

              {composeChannel === 'drops' || composeChannel === 'clubs' ? (
                <div>
                  <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--ink-secondary)' }}>
                    {composeChannel === 'drops' ? 'Đặc tả / Mã nguồn' : 'Mốc tiếp theo (mỗi dòng 1 mục)'}
                  </label>
                  <textarea
                    rows={3}
                    value={composePayload}
                    onChange={(event) => setComposePayload(event.target.value)}
                    className="w-full rounded-[12px] border p-3 font-mono text-xs outline-none"
                    style={{
                      backgroundColor: 'var(--bg-panel)',
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--ink-primary)',
                    }}
                  />
                </div>
              ) : null}

              {composeChannel === 'showcase' ? (
                <div className="space-y-2">
                  <textarea
                    rows={2}
                    value={composeHtml}
                    onChange={(event) => setComposeHtml(event.target.value)}
                    placeholder="HTML cho hộp cát..."
                    className="w-full rounded-[12px] border p-2.5 font-mono text-xs outline-none"
                    style={{
                      backgroundColor: 'var(--bg-panel)',
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--ink-primary)',
                    }}
                  />
                  <textarea
                    rows={2}
                    value={composeCss}
                    onChange={(event) => setComposeCss(event.target.value)}
                    placeholder="CSS cho hộp cát..."
                    className="w-full rounded-[12px] border p-2.5 font-mono text-xs outline-none"
                    style={{
                      backgroundColor: 'var(--bg-panel)',
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--ink-primary)',
                    }}
                  />
                </div>
              ) : null}

              <div>
                <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--ink-secondary)' }}>
                  Thẻ phân loại (phân cách bằng dấu phẩy)
                </label>
                <input
                  type="text"
                  value={composeTagsInput}
                  onChange={(event) => setComposeTagsInput(event.target.value)}
                  placeholder="react, tailwind, liquid-glass"
                  className="h-10 w-full rounded-[12px] border px-3 text-xs outline-none"
                  style={{
                    backgroundColor: 'var(--bg-panel)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--ink-primary)',
                  }}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setComposerOpen(false)}
                  className="h-9 rounded-full border px-4 text-xs font-medium cursor-pointer"
                  style={{
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--ink-secondary)',
                  }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submittingPost || !composeTitle.trim()}
                  className="h-9 rounded-full px-5 text-xs font-semibold cursor-pointer disabled:opacity-50"
                  style={{
                    backgroundColor: 'var(--accent-primary)',
                    color: 'var(--ink-inverse)',
                  }}
                >
                  Đăng bài
                </button>
              </div>
            </motion.form>
          </motion.div>
        ) : null}

        {previewPost ? (
          <motion.div
            key="ff-showcase-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPreviewPost(null)}
            role="dialog"
            aria-modal="true"
            aria-label={`Live View ${previewPost.title}`}
            className="fixed inset-0 z-[85] flex items-center justify-center p-4"
            style={{
              backgroundColor: 'rgba(6, 8, 13, 0.76)',
              backdropFilter: 'blur(12px)',
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 8 }}
              onClick={(event) => event.stopPropagation()}
              className="flex h-[78vh] w-full max-w-[920px] flex-col overflow-hidden rounded-[24px] border"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-strong)',
              }}
            >
              <div
                className="flex items-center justify-between gap-3 border-b px-5 py-3.5"
                style={{
                  backgroundColor: 'var(--bg-panel)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                <div className="min-w-0">
                  <h3 className="truncate text-base font-semibold" style={{ fontFamily: 'var(--font-serif)', color: 'var(--ink-primary)' }}>
                    {previewPost.title}
                  </h3>
                  <p className="font-mono text-xs" style={{ color: 'var(--ink-muted)' }}>
                    Live View · @{previewPost.author.handle}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      forkPostToWorkspace(previewPost);
                      setPreviewPost(null);
                    }}
                    className="h-9 rounded-full px-4 text-xs font-semibold cursor-pointer"
                    style={{
                      backgroundColor: 'var(--accent-primary)',
                      color: 'var(--ink-inverse)',
                    }}
                  >
                    Workspace
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewPost(null)}
                    aria-label="Đóng bản xem trước"
                    title="Đóng"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border cursor-pointer"
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--ink-secondary)',
                    }}
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
              <iframe
                title={previewPost.title}
                loading="eager"
                sandbox="allow-scripts"
                referrerPolicy="no-referrer"
                srcDoc={buildShowcasePreviewDoc(previewPost, theme)}
                className="min-h-0 flex-1 w-full border-0"
                style={{ backgroundColor: 'var(--bg-canvas)' }}
              />
            </motion.div>
          </motion.div>
        ) : null}

        {reportTarget ? (
          <motion.div
            key="ff-report-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setReportTarget(null)}
            role="dialog"
            aria-modal="true"
            aria-label="Báo cáo nội dung"
            className="fixed inset-0 z-[85] flex items-center justify-center p-4"
            style={{
              backgroundColor: 'rgba(6, 8, 13, 0.72)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <motion.form
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              onClick={(event) => event.stopPropagation()}
              onSubmit={handleSubmitReport}
              className="w-full max-w-[440px] overflow-hidden rounded-[22px] border p-6 space-y-4"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-strong)',
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-base font-semibold" style={{ color: 'var(--ink-primary)' }}>
                    Báo cáo nội dung
                  </h3>
                  <p className="mt-1 text-xs" style={{ color: 'var(--ink-secondary)' }}>
                    {reportTarget.title}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setReportTarget(null)}
                  aria-label="Đóng hộp báo cáo"
                  title="Đóng"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full cursor-pointer"
                  style={{ color: 'var(--ink-muted)' }}
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-medium" style={{ color: 'var(--ink-secondary)' }}>
                  Lý do kiểm duyệt
                </label>
                <textarea
                  rows={3}
                  value={reportReason}
                  onChange={(event) => setReportReason(event.target.value)}
                  className="w-full rounded-[12px] border p-3 text-sm outline-none"
                  style={{
                    backgroundColor: 'var(--bg-panel)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--ink-primary)',
                  }}
                />
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReportTarget(null)}
                  className="h-9 rounded-full border px-4 text-xs font-medium cursor-pointer"
                  style={{
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--ink-secondary)',
                  }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submittingReport || !reportReason.trim()}
                  className="h-9 rounded-full px-5 text-xs font-semibold cursor-pointer disabled:opacity-50"
                  style={{
                    backgroundColor: 'var(--accent-copper)',
                    color: '#ffffff',
                  }}
                >
                  Gửi
                </button>
              </div>
            </motion.form>
          </motion.div>
        ) : null}

        {dossierClub ? (
          <motion.div
            key="ff-dossier-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setDossierClub(null)}
            role="dialog"
            aria-modal="true"
            aria-label="Cập nhật hồ sơ chuyển giao"
            className="fixed inset-0 z-[85] flex items-center justify-center p-4"
            style={{
              backgroundColor: 'rgba(6, 8, 13, 0.72)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <motion.form
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              onClick={(event) => event.stopPropagation()}
              onSubmit={handleSaveDossier}
              className="w-full max-w-[520px] overflow-hidden rounded-[22px] border p-6 space-y-4"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-strong)',
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-base font-semibold" style={{ color: 'var(--ink-primary)' }}>
                    Cập nhật Hồ sơ chuyển giao
                  </h3>
                  <p className="mt-1 text-xs" style={{ color: 'var(--ink-secondary)' }}>
                    {dossierClub.name || dossierClub.title}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setDossierClub(null)}
                  aria-label="Đóng trình sửa hồ sơ"
                  title="Đóng"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full cursor-pointer"
                  style={{ color: 'var(--ink-muted)' }}
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--ink-secondary)' }}>
                    Mục tiêu dự án
                  </label>
                  <input
                    type="text"
                    value={dossierDraft.projectTitle}
                    onChange={(event) =>
                      setDossierDraft((prev) => ({ ...prev, projectTitle: event.target.value }))
                    }
                    className="h-10 w-full rounded-[12px] border px-3 text-sm outline-none"
                    style={{
                      backgroundColor: 'var(--bg-panel)',
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--ink-primary)',
                    }}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--ink-secondary)' }}>
                    Ghi chú kỹ thuật
                  </label>
                  <textarea
                    rows={3}
                    value={dossierDraft.handoverNotes}
                    onChange={(event) =>
                      setDossierDraft((prev) => ({ ...prev, handoverNotes: event.target.value }))
                    }
                    className="w-full rounded-[12px] border p-3 text-sm outline-none"
                    style={{
                      backgroundColor: 'var(--bg-panel)',
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--ink-primary)',
                    }}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--ink-secondary)' }}>
                    Mốc tiếp theo (mỗi dòng 1 mục)
                  </label>
                  <textarea
                    rows={3}
                    value={milestonesText}
                    onChange={(event) => setMilestonesText(event.target.value)}
                    className="w-full rounded-[12px] border p-3 font-mono text-xs outline-none"
                    style={{
                      backgroundColor: 'var(--bg-panel)',
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--ink-primary)',
                    }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDossierClub(null)}
                  className="h-9 rounded-full border px-4 text-xs font-medium cursor-pointer"
                  style={{
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--ink-secondary)',
                  }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={savingDossier}
                  className="h-9 rounded-full px-5 text-xs font-semibold cursor-pointer disabled:opacity-50"
                  style={{
                    backgroundColor: 'var(--accent-primary)',
                    color: 'var(--ink-inverse)',
                  }}
                >
                  Lưu
                </button>
              </div>
            </motion.form>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
};

export default CommunityView;
