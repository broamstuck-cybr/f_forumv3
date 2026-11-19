import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowUp,
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  Code2,
  Eye,
  Flag,
  GitFork,
  LogIn,
  MessageSquare,
  Plus,
  Send,
  Users,
  X,
} from 'lucide-react';
import type {
  ClubHandoverDossier,
  CommunityAnswer,
  CommunityChannel,
  CommunityPost,
} from '../../types/index';
import { useAppStore } from '../../store/appStore';
import { Chips, LiquidTabs, PresenceCards, SearchCard } from '../../components/pinui';

const QA_CORE_TAGS = ['Bug Fix', 'Prompt Engineering', 'UI/UX Critique'];

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

function buildShowcasePreviewDoc(post: CommunityPost, theme: 'dark' | 'light'): string {
  const isDark = theme === 'dark';
  const bg = isDark ? '#06080d' : '#f5f3ec';
  const ink = isDark ? '#f1efe9' : '#0f141e';
  const snippet = post.demoSnippet || {
    html: `<section style="padding:24px;border-radius:16px;border:1px solid rgba(255,255,255,0.14)"><h3>${post.title.replace(/</g, '&lt;')}</h3><p style="margin-top:8px;opacity:0.75">${(post.description || post.body || '').replace(/</g, '&lt;')}</p></section>`,
    css: '',
  };
  return `<!DOCTYPE html><html lang="vi"><head><meta charset="utf-8" /><style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{min-height:100vh;display:grid;place-items:center;padding:24px;background:${bg};color:${ink};font-family:system-ui,-apple-system,sans-serif}
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

  const [channel, setChannel] = useState<CommunityChannel>('qa');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedQaTags, setSelectedQaTags] = useState<string[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  const [previewPost, setPreviewPost] = useState<CommunityPost | null>(null);

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

  const [composeTitle, setComposeTitle] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [composeCategory, setComposeCategory] = useState('Bug Fix');
  const [composeTagsInput, setComposeTagsInput] = useState('');
  const [composePayload, setComposePayload] = useState('');
  const [composeHtml, setComposeHtml] = useState('');
  const [composeCss, setComposeCss] = useState('');
  const [submittingPost, setSubmittingPost] = useState(false);

  const channelPosts = useMemo(() => {
    const raw = communityChannels[channel] || [];
    const q = searchQuery.trim().toLowerCase();
    return raw.filter((post) => {
      if (post.hidden) return false;
      if (channel === 'qa' && selectedQaTags.length > 0) {
        const hay = `${post.category} ${post.tags.join(' ')} ${post.title} ${post.body || ''}`.toLowerCase();
        const matches = selectedQaTags.some((tag) => {
          const t = tag.toLowerCase();
          if (t === 'bug fix') {
            return hay.includes('bug') || hay.includes('re-render') || hay.includes('performance') || hay.includes('fix');
          }
          if (t === 'prompt engineering') {
            return hay.includes('prompt') || hay.includes('agent') || hay.includes('llm');
          }
          if (t === 'ui/ux critique') {
            return hay.includes('ui') || hay.includes('ux') || hay.includes('token') || hay.includes('css');
          }
          return hay.includes(t);
        });
        if (!matches) return false;
      }
      if (!q) return true;
      return (
        post.title.toLowerCase().includes(q) ||
        (post.body || '').toLowerCase().includes(q) ||
        (post.description || '').toLowerCase().includes(q) ||
        post.category.toLowerCase().includes(q) ||
        post.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [communityChannels, channel, searchQuery, selectedQaTags]);

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

  const qaChipItems = useMemo(() => {
    const extraTags = Array.from(
      new Set(communityChannels.qa.flatMap((p) => p.tags).slice(0, 6))
    ).filter((t) => !QA_CORE_TAGS.some((core) => core.toLowerCase() === t.toLowerCase()));
    return [
      ...QA_CORE_TAGS.map((label) => ({ id: label, label })),
      ...extraTags.map((tag) => ({ id: tag, label: tag })),
    ];
  }, [communityChannels.qa]);

  const requireSignedIn = (): boolean => {
    if (currentUser) return true;
    addToast({
      type: 'info',
      title: 'Cần đăng nhập để thực hiện thao tác này',
      message: 'Mở cửa sổ đăng nhập để đăng bài, trả lời hoặc cập nhật hồ sơ CLB.',
    });
    setAuthModalOpen(true);
    return false;
  };

  const handleToggleQaTag = (id: string) => {
    setSelectedQaTags((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
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
        title: 'Không thể đánh dấu Accepted Solution',
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
      projectTitle: club.title,
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
        title: 'Cập nhật Dossier thất bại',
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
      title: 'Đã nạp dự án từ Work space hiện tại',
      message: activeProject.name,
    });
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
      if (channel === 'qa') {
        await createPost({
          channel: 'qa',
          title: composeTitle.trim(),
          body: composeBody.trim(),
          category: composeCategory,
          tags: parsedTags.length > 0 ? parsedTags : [composeCategory],
        });
      } else if (channel === 'showcase') {
        await createPost({
          channel: 'showcase',
          title: composeTitle.trim(),
          body: composeBody.trim(),
          category: 'Workspace Showcase',
          tags: parsedTags.length > 0 ? parsedTags : ['showcase', 'sandbox'],
          demoSnippet: {
            html:
              composeHtml.trim() ||
              `<div class="demo-box"><h3>${composeTitle.trim()}</h3><p>${composeBody.trim()}</p></div>`,
            css:
              composeCss.trim() ||
              '.demo-box{padding:24px;border-radius:16px;border:1px solid rgba(255,255,255,0.16);background:#121722;color:#f1efe9}',
          },
        });
      } else if (channel === 'drops') {
        await createPost({
          channel: 'drops',
          title: composeTitle.trim(),
          body: composeBody.trim(),
          category: composeCategory || 'Prompt Blueprint',
          tags: parsedTags.length > 0 ? parsedTags : ['blueprint', 'rules'],
          fileType: 'markdown',
          payload: composePayload.trim() || composeBody.trim(),
        });
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
      }
      setComposeTitle('');
      setComposeBody('');
      setComposeTagsInput('');
      setComposePayload('');
      setComposeHtml('');
      setComposeCss('');
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

  const leadPost = channelPosts[0] || null;
  const streamPosts = channelPosts.slice(1);

  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 pt-6 pb-20 sm:px-6 lg:px-8">
      <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1
            className="text-2xl font-semibold tracking-tight sm:text-3xl"
            style={{ color: 'var(--ink-primary)' }}
          >
            Source of Knowledge
          </h1>
          <p className="mt-1.5 max-w-[68ch] text-sm" style={{ color: 'var(--ink-secondary)' }}>
            Hỏi đáp kỹ thuật, trưng bày sản phẩm Work space có sandbox trực tiếp, chia sẻ Prompt/Rule Drops và bàn giao hồ sơ dự án CLB.
          </p>
        </div>

        <div className="w-full lg:w-[340px]">
          <SearchCard
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Tìm câu hỏi, showcase, prompt drop, CLB..."
            compact
          />
        </div>
      </header>

      <div
        className="mb-6 flex flex-col gap-3 rounded-[20px] border p-3 sm:flex-row sm:items-center sm:justify-between"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        <div className="overflow-x-auto pb-1 sm:pb-0">
          <LiquidTabs
            tabs={[
              { id: 'qa', label: 'Dev Q&A', count: communityChannels.qa.filter((p) => !p.hidden).length },
              { id: 'showcase', label: 'Project Showcase', count: communityChannels.showcase.filter((p) => !p.hidden).length },
              { id: 'drops', label: 'Community Drops', count: communityChannels.drops.filter((p) => !p.hidden).length },
              { id: 'clubs', label: 'Club Hub', count: communityChannels.clubs.filter((p) => !p.hidden).length },
            ]}
            activeId={channel}
            onChange={(id) => {
              setChannel(id as CommunityChannel);
              setActiveThreadId(null);
            }}
          />
        </div>

        {channel === 'qa' ? (
          <div className="min-w-0">
            <Chips
              items={qaChipItems}
              selectedIds={selectedQaTags}
              onToggle={handleToggleQaTag}
              multi
            />
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
        <main className="space-y-5">
          {channelPosts.length === 0 ? (
            <div
              className="rounded-[22px] border p-10 text-center"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <p className="text-sm font-semibold" style={{ color: 'var(--ink-primary)' }}>
                Chưa có nội dung khớp bộ lọc trong kênh này
              </p>
              <p className="mt-1 text-xs" style={{ color: 'var(--ink-secondary)' }}>
                Bạn có thể tạo bài mới ở cột bên phải hoặc xóa từ khóa tìm kiếm.
              </p>
            </div>
          ) : channel === 'clubs' ? (
            <div className="space-y-5">
              {channelPosts.map((club) => {
                const dossier = club.activeDossier;
                return (
                  <article
                    key={club.id}
                    className="overflow-hidden rounded-[22px] border p-5 sm:p-6"
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      borderColor: 'var(--border-subtle)',
                    }}
                  >
                    <PresenceCards
                      title={club.name || club.title}
                      subtitle={`${club.category} / ${club.membersCount || 6} thành viên đang hoạt động`}
                      members={[
                        {
                          name: club.lead || club.author.name,
                          role: 'Maintainer',
                          status: 'Active',
                        },
                        {
                          name: dossier?.ownerHandle ? `@${dossier.ownerHandle}` : `@${club.author.handle}`,
                          role: 'Handover Lead',
                          status: 'Syncing',
                        },
                      ]}
                      actionLabel="Cập nhật Dossier"
                      onAction={() => openEditDossier(club)}
                    >
                      <div className="mt-4 space-y-3">
                        <p className="text-sm leading-relaxed" style={{ color: 'var(--ink-secondary)' }}>
                          {club.description || club.body}
                        </p>

                        {dossier ? (
                          <div
                            className="rounded-[16px] border p-4"
                            style={{
                              backgroundColor: 'var(--bg-panel)',
                              borderColor: 'var(--border-subtle)',
                            }}
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span
                                className="font-mono text-xs font-semibold"
                                style={{ color: 'var(--accent-primary)' }}
                              >
                                Project Continuity Handover Dossier
                              </span>
                              <span
                                className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                                style={{
                                  backgroundColor: 'color-mix(in srgb, var(--accent-jade) 14%, transparent)',
                                  color: 'var(--accent-jade)',
                                }}
                              >
                                Đang bàn giao
                              </span>
                            </div>

                            <h4 className="mt-2 text-sm font-semibold" style={{ color: 'var(--ink-primary)' }}>
                              Mục tiêu: {dossier.projectTitle}
                            </h4>
                            <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--ink-secondary)' }}>
                              Ghi chú kỹ thuật: {dossier.handoverNotes}
                            </p>

                            {dossier.nextMilestones && dossier.nextMilestones.length > 0 ? (
                              <div className="mt-3">
                                <p className="text-[11px] font-semibold" style={{ color: 'var(--ink-muted)' }}>
                                  Mốc tiếp theo & Vấn đề cần xử lý:
                                </p>
                                <ul className="mt-1.5 space-y-1 text-xs" style={{ color: 'var(--ink-secondary)' }}>
                                  {dossier.nextMilestones.map((ms, idx) => (
                                    <li key={`${club.id}-ms-${idx}`} className="flex items-start gap-2">
                                      <span
                                        className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                                        style={{ backgroundColor: 'var(--accent-verdigris)' }}
                                      />
                                      <span>{ms}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    </PresenceCards>

                    <div
                      className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t pt-3.5 text-xs"
                      style={{ borderColor: 'var(--border-subtle)' }}
                    >
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleUpvote(club.id)}
                          className="inline-flex h-8 items-center gap-1.5 rounded-full border px-3 font-medium"
                          style={{
                            backgroundColor: 'var(--bg-panel)',
                            borderColor: 'var(--border-subtle)',
                            color: 'var(--ink-primary)',
                          }}
                        >
                          <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>{club.votes}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveThreadId(activeThreadId === club.id ? null : club.id)}
                          className="inline-flex h-8 items-center gap-1.5 rounded-full border px-3 font-medium"
                          style={{
                            backgroundColor: 'var(--bg-panel)',
                            borderColor: 'var(--border-subtle)',
                            color: 'var(--ink-secondary)',
                          }}
                        >
                          <Users className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Ứng tuyển / Trao đổi ({getAllAnswers(club).length})</span>
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => setReportTarget(club)}
                        className="inline-flex h-8 items-center gap-1.5 rounded-full px-3 font-medium hover:underline"
                        style={{ color: 'var(--ink-muted)' }}
                      >
                        <Flag className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Báo cáo</span>
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <>
              {leadPost ? (
                <article
                  className="overflow-hidden rounded-[24px] border p-6"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--border-strong)',
                  }}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                        style={{
                          backgroundColor: 'color-mix(in srgb, var(--accent-primary) 16%, transparent)',
                          color: 'var(--accent-primary)',
                        }}
                      >
                        {leadPost.category}
                      </span>
                      {leadPost.isAccepted ? (
                        <span
                          className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold"
                          style={{
                            backgroundColor: 'color-mix(in srgb, var(--accent-jade) 16%, transparent)',
                            color: 'var(--accent-jade)',
                          }}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Accepted Solution</span>
                        </span>
                      ) : null}
                    </div>
                    <span className="font-mono text-xs" style={{ color: 'var(--ink-muted)' }}>
                      @{leadPost.author.handle} ({new Date(leadPost.createdAt).toLocaleDateString('vi-VN')})
                    </span>
                  </div>

                  <h2 className="mt-3 text-xl font-semibold" style={{ color: 'var(--ink-primary)' }}>
                    {leadPost.title}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--ink-secondary)' }}>
                    {leadPost.body || leadPost.description}
                  </p>

                  {channel === 'drops' && leadPost.payload ? (
                    <pre
                      className="mt-4 overflow-x-auto rounded-[14px] border p-4 font-mono text-xs leading-relaxed"
                      style={{
                        backgroundColor: 'var(--bg-panel)',
                        borderColor: 'var(--border-subtle)',
                        color: 'var(--ink-primary)',
                      }}
                    >
                      <code>{leadPost.payload}</code>
                    </pre>
                  ) : null}

                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {leadPost.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border px-2.5 py-0.5 font-mono text-[11px]"
                        style={{
                          backgroundColor: 'var(--bg-panel)',
                          borderColor: 'var(--border-subtle)',
                          color: 'var(--ink-muted)',
                        }}
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>

                  <div
                    className="mt-5 flex flex-wrap items-center gap-2 border-t pt-4"
                    style={{ borderColor: 'var(--border-subtle)' }}
                  >
                    <button
                      type="button"
                      onClick={() => handleUpvote(leadPost.id)}
                      className="inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-xs font-semibold"
                      style={{
                        backgroundColor: 'var(--bg-panel)',
                        borderColor: 'var(--border-subtle)',
                        color: 'var(--ink-primary)',
                      }}
                    >
                      <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>{leadPost.votes}</span>
                    </button>

                    {channel === 'showcase' ? (
                      <button
                        type="button"
                        onClick={() => setPreviewPost(leadPost)}
                        className="inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-xs font-semibold"
                        style={{
                          backgroundColor: 'var(--accent-primary)',
                          color: '#06080d',
                        }}
                      >
                        <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Sandboxed Live Preview</span>
                      </button>
                    ) : null}

                    {channel === 'drops' ? (
                      <>
                        <button
                          type="button"
                          onClick={() => forkPostToWorkspace(leadPost)}
                          className="inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-xs font-semibold"
                          style={{
                            backgroundColor: 'var(--accent-primary)',
                            color: '#06080d',
                          }}
                        >
                          <GitFork className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Fork vào Work space ({leadPost.forks || 0})</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleSavedItem(leadPost.id)}
                          className="inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-xs font-medium"
                          style={{
                            backgroundColor: 'var(--bg-panel)',
                            borderColor: savedItemIds.includes(leadPost.id)
                              ? 'var(--accent-jade)'
                              : 'var(--border-subtle)',
                            color: savedItemIds.includes(leadPost.id)
                              ? 'var(--accent-jade)'
                              : 'var(--ink-primary)',
                          }}
                        >
                          {savedItemIds.includes(leadPost.id) ? (
                            <BookmarkCheck className="h-3.5 w-3.5" aria-hidden="true" />
                          ) : (
                            <Bookmark className="h-3.5 w-3.5" aria-hidden="true" />
                          )}
                          <span>{savedItemIds.includes(leadPost.id) ? 'Đã lưu' : 'Lưu'}</span>
                        </button>
                      </>
                    ) : null}

                    <button
                      type="button"
                      onClick={() => setActiveThreadId(activeThreadId === leadPost.id ? null : leadPost.id)}
                      className="inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-xs font-medium"
                      style={{
                        backgroundColor:
                          activeThreadId === leadPost.id
                            ? 'color-mix(in srgb, var(--accent-verdigris) 14%, transparent)'
                            : 'var(--bg-panel)',
                        borderColor:
                          activeThreadId === leadPost.id ? 'var(--accent-verdigris)' : 'var(--border-subtle)',
                        color:
                          activeThreadId === leadPost.id ? 'var(--accent-verdigris)' : 'var(--ink-secondary)',
                      }}
                    >
                      <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>
                        {channel === 'showcase' ? 'Nhận xét' : 'Trả lời'} ({getAllAnswers(leadPost).length})
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setReportTarget(leadPost)}
                      className="ml-auto inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-xs font-medium hover:underline"
                      style={{ color: 'var(--ink-muted)' }}
                    >
                      <Flag className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Báo cáo</span>
                    </button>
                  </div>
                </article>
              ) : null}

              {streamPosts.length > 0 ? (
                <div
                  className="overflow-hidden rounded-[22px] border divide-y"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--border-subtle)',
                  }}
                >
                  {streamPosts.map((post) => {
                    const isSaved = savedItemIds.includes(post.id);
                    const isExpanded = activeThreadId === post.id;
                    return (
                      <article
                        key={post.id}
                        className="p-5"
                        style={{ borderColor: 'var(--border-subtle)' }}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className="rounded-full px-2.5 py-0.5 font-medium"
                              style={{
                                backgroundColor: 'var(--bg-panel)',
                                color: 'var(--ink-secondary)',
                              }}
                            >
                              {post.category}
                            </span>
                            {post.isAccepted ? (
                              <span
                                className="inline-flex items-center gap-1 font-semibold"
                                style={{ color: 'var(--accent-jade)' }}
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                                <span>Accepted</span>
                              </span>
                            ) : null}
                          </div>
                          <span className="font-mono" style={{ color: 'var(--ink-muted)' }}>
                            @{post.author.handle}
                          </span>
                        </div>

                        <h3 className="mt-2 text-base font-semibold" style={{ color: 'var(--ink-primary)' }}>
                          {post.title}
                        </h3>
                        <p className="mt-1 text-sm leading-relaxed" style={{ color: 'var(--ink-secondary)' }}>
                          {post.body || post.description}
                        </p>

                        {channel === 'drops' && post.payload ? (
                          <pre
                            className="mt-3 overflow-x-auto rounded-[12px] border p-3 font-mono text-xs"
                            style={{
                              backgroundColor: 'var(--bg-panel)',
                              borderColor: 'var(--border-subtle)',
                              color: 'var(--ink-secondary)',
                            }}
                          >
                            <code>{post.payload}</code>
                          </pre>
                        ) : null}

                        <div className="mt-4 flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleUpvote(post.id)}
                            className="inline-flex h-8 items-center gap-1 rounded-full border px-3 text-xs font-semibold"
                            style={{
                              backgroundColor: 'var(--bg-panel)',
                              borderColor: 'var(--border-subtle)',
                              color: 'var(--ink-primary)',
                            }}
                          >
                            <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>{post.votes}</span>
                          </button>

                          {channel === 'showcase' ? (
                            <button
                              type="button"
                              onClick={() => setPreviewPost(post)}
                              className="inline-flex h-8 items-center gap-1.5 rounded-full px-3.5 text-xs font-semibold"
                              style={{
                                backgroundColor: 'var(--accent-primary)',
                                color: '#06080d',
                              }}
                            >
                              <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                              <span>Live Preview</span>
                            </button>
                          ) : null}

                          {channel === 'drops' ? (
                            <>
                              <button
                                type="button"
                                onClick={() => forkPostToWorkspace(post)}
                                className="inline-flex h-8 items-center gap-1.5 rounded-full px-3.5 text-xs font-semibold"
                                style={{
                                  backgroundColor: 'var(--accent-primary)',
                                  color: '#06080d',
                                }}
                              >
                                <GitFork className="h-3.5 w-3.5" aria-hidden="true" />
                                <span>Fork vào Work space ({post.forks || 0})</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => toggleSavedItem(post.id)}
                                className="inline-flex h-8 items-center gap-1 rounded-full border px-3 text-xs font-medium"
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
                                <span>{isSaved ? 'Đã lưu' : 'Lưu'}</span>
                              </button>
                            </>
                          ) : null}

                          <button
                            type="button"
                            onClick={() => setActiveThreadId(isExpanded ? null : post.id)}
                            className="inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-medium"
                            style={{
                              backgroundColor: isExpanded
                                ? 'color-mix(in srgb, var(--accent-verdigris) 14%, transparent)'
                                : 'var(--bg-panel)',
                              borderColor: isExpanded ? 'var(--accent-verdigris)' : 'var(--border-subtle)',
                              color: isExpanded ? 'var(--accent-verdigris)' : 'var(--ink-secondary)',
                            }}
                          >
                            <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>Trao đổi ({getAllAnswers(post).length})</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setReportTarget(post)}
                            className="ml-auto inline-flex h-8 items-center gap-1 px-2 text-xs font-medium hover:underline"
                            style={{ color: 'var(--ink-muted)' }}
                          >
                            <Flag className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>Báo cáo</span>
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : null}
            </>
          )}

          {activeThreadPost ? (
            <section
              aria-label="Luồng thảo luận chi tiết"
              className="overflow-hidden rounded-[22px] border p-5 sm:p-6"
              style={{
                backgroundColor: 'var(--bg-panel)',
                borderColor: 'var(--accent-verdigris)',
              }}
            >
              <div className="flex items-start justify-between gap-3 border-b pb-3.5" style={{ borderColor: 'var(--border-subtle)' }}>
                <div>
                  <span className="font-mono text-[11px] font-semibold" style={{ color: 'var(--accent-verdigris)' }}>
                    LUỒNG TRẢ LỜI & PHẢN BIỆN
                  </span>
                  <h3 className="mt-1 text-base font-semibold" style={{ color: 'var(--ink-primary)' }}>
                    {activeThreadPost.title}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveThreadId(null)}
                  aria-label="Đóng luồng trả lời"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--ink-secondary)',
                  }}
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>

              <div className="mt-4 space-y-3">
                {getAllAnswers(activeThreadPost).length === 0 ? (
                  <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>
                    Chưa có phản hồi kỹ thuật nào. Hãy gửi câu trả lời đầu tiên bên dưới.
                  </p>
                ) : (
                  getAllAnswers(activeThreadPost).map((ans) => (
                    <div
                      key={ans.id}
                      className="rounded-[16px] border p-4"
                      style={{
                        backgroundColor: 'var(--bg-surface)',
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
                            <span
                              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold"
                              style={{
                                backgroundColor: 'color-mix(in srgb, var(--accent-jade) 16%, transparent)',
                                color: 'var(--accent-jade)',
                              }}
                            >
                              <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                              <span>Accepted Solution</span>
                            </span>
                          ) : null}
                        </div>

                        {activeThreadPost.channel === 'qa' && !ans.isAccepted ? (
                          <button
                            type="button"
                            onClick={() => handleAcceptSolution(activeThreadPost.id, ans.id)}
                            className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold"
                            style={{
                              borderColor: 'var(--accent-jade)',
                              color: 'var(--accent-jade)',
                            }}
                          >
                            <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                            <span>Chọn Accepted Solution</span>
                          </button>
                        ) : null}
                      </div>
                      <p className="mt-2 whitespace-pre-line text-sm leading-relaxed" style={{ color: 'var(--ink-secondary)' }}>
                        {ans.content}
                      </p>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleSubmitReply} className="mt-4 space-y-2.5">
                <textarea
                  rows={3}
                  value={replyText}
                  onChange={(event) => setReplyText(event.target.value)}
                  placeholder="Nhập giải pháp kỹ thuật hoặc góp ý chi tiết..."
                  className="w-full rounded-[14px] border p-3 text-sm outline-none focus-visible:outline-2"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--border-strong)',
                    color: 'var(--ink-primary)',
                  }}
                />
                <div className="flex items-center justify-between gap-2">
                  {!currentUser ? (
                    <button
                      type="button"
                      onClick={() => setAuthModalOpen(true)}
                      className="inline-flex items-center gap-1.5 text-xs font-medium hover:underline"
                      style={{ color: 'var(--accent-primary)' }}
                    >
                      <LogIn className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Đăng nhập để gửi câu trả lời</span>
                    </button>
                  ) : (
                    <span className="text-xs" style={{ color: 'var(--ink-muted)' }}>
                      Trả lời với tư cách {currentUser.name}
                    </span>
                  )}
                  <button
                    type="submit"
                    disabled={submittingReply || !replyText.trim()}
                    className="inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-xs font-semibold disabled:opacity-50"
                    style={{
                      backgroundColor: 'var(--accent-primary)',
                      color: '#06080d',
                    }}
                  >
                    <Send className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{submittingReply ? 'Đang gửi...' : 'Gửi phản hồi'}</span>
                  </button>
                </div>
              </form>
            </section>
          ) : null}
        </main>

        <aside className="space-y-5 lg:sticky lg:top-24">
          <section
            className="overflow-hidden rounded-[22px] border p-5 sm:p-6"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-strong)',
            }}
          >
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-semibold" style={{ color: 'var(--ink-primary)' }}>
                {channel === 'qa'
                  ? 'Đặt câu hỏi kỹ thuật'
                  : channel === 'showcase'
                    ? 'Chia sẻ Project Showcase'
                    : channel === 'drops'
                      ? 'Đăng Community Drop'
                      : 'Đăng tin CLB & Handover'}
              </h2>
              {channel === 'showcase' ? (
                <button
                  type="button"
                  onClick={handlePrefillFromWorkspace}
                  className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold"
                  style={{
                    backgroundColor: 'var(--bg-panel)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--accent-verdigris)',
                  }}
                >
                  <Code2 className="h-3 w-3" aria-hidden="true" />
                  <span>Lấy từ Work space</span>
                </button>
              ) : null}
            </div>

            {!currentUser ? (
              <div
                className="mt-4 rounded-[16px] border p-4 text-xs"
                style={{
                  backgroundColor: 'var(--bg-panel)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--ink-secondary)',
                }}
              >
                <p className="leading-relaxed">
                  Bạn đang xem ở chế độ Khách. Đăng nhập để đăng câu hỏi, chia sẻ dự án Work space hoặc cập nhật Dossier CLB.
                </p>
                <button
                  type="button"
                  onClick={() => setAuthModalOpen(true)}
                  className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-xs font-semibold"
                  style={{
                    backgroundColor: 'var(--accent-primary)',
                    color: '#06080d',
                  }}
                >
                  <LogIn className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Đăng nhập ngay</span>
                </button>
              </div>
            ) : null}

            <form onSubmit={handleCreatePost} className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--ink-secondary)' }}>
                  Tiêu đề
                </label>
                <input
                  type="text"
                  value={composeTitle}
                  onChange={(event) => setComposeTitle(event.target.value)}
                  placeholder={
                    channel === 'qa'
                      ? 'Ví dụ: Cách tránh layout shift khi load font...'
                      : channel === 'showcase'
                        ? 'Tên giao diện hoặc ứng dụng của bạn'
                        : channel === 'drops'
                          ? 'Tên Prompt Blueprint hoặc Rule'
                          : 'Tên CLB hoặc vị trí tuyển thành viên'
                  }
                  className="h-10 w-full rounded-[12px] border px-3 text-sm outline-none focus-visible:outline-2"
                  style={{
                    backgroundColor: 'var(--bg-panel)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--ink-primary)',
                  }}
                />
              </div>

              {channel === 'qa' ? (
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
                    {QA_CORE_TAGS.map((tag) => (
                      <option key={tag} value={tag}>
                        {tag}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

              <div>
                <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--ink-secondary)' }}>
                  {channel === 'clubs' ? 'Mô tả & Ghi chú bàn giao' : 'Nội dung chi tiết'}
                </label>
                <textarea
                  rows={3}
                  value={composeBody}
                  onChange={(event) => setComposeBody(event.target.value)}
                  placeholder="Mô tả bối cảnh kỹ thuật, đầu vào và kết quả mong đợi..."
                  className="w-full rounded-[12px] border p-3 text-sm outline-none focus-visible:outline-2"
                  style={{
                    backgroundColor: 'var(--bg-panel)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--ink-primary)',
                  }}
                />
              </div>

              {channel === 'drops' || channel === 'clubs' ? (
                <div>
                  <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--ink-secondary)' }}>
                    {channel === 'drops' ? 'Mã Prompt / Rule Payload' : 'Mốc tiếp theo (mỗi dòng 1 mục)'}
                  </label>
                  <textarea
                    rows={3}
                    value={composePayload}
                    onChange={(event) => setComposePayload(event.target.value)}
                    placeholder={
                      channel === 'drops'
                        ? '# System Rule\n- Không dùng inline comment...'
                        : 'Hoàn thiện kiểm thử 3 viewports\nĐồng bộ API gateway'
                    }
                    className="w-full rounded-[12px] border p-3 font-mono text-xs outline-none"
                    style={{
                      backgroundColor: 'var(--bg-panel)',
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--ink-primary)',
                    }}
                  />
                </div>
              ) : null}

              {channel === 'showcase' ? (
                <div className="space-y-2">
                  <textarea
                    rows={2}
                    value={composeHtml}
                    onChange={(event) => setComposeHtml(event.target.value)}
                    placeholder="HTML snippet cho Sandboxed Live Preview..."
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
                    placeholder="CSS snippet..."
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
                  Tags (phân cách bằng dấu phẩy)
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

              <button
                type="submit"
                disabled={submittingPost || !composeTitle.trim()}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-full px-4 text-xs font-semibold disabled:opacity-50"
                style={{
                  backgroundColor: 'var(--accent-primary)',
                  color: '#06080d',
                }}
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                <span>{submittingPost ? 'Đang đăng...' : 'Đăng lên Source of Knowledge'}</span>
              </button>
            </form>
          </section>
        </aside>
      </div>

      <AnimatePresence>
        {previewPost ? (
          <motion.div
            key="ff-showcase-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPreviewPost(null)}
            role="dialog"
            aria-modal="true"
            aria-label={`Sandboxed Live Preview ${previewPost.title}`}
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
                <div>
                  <h3 className="text-sm font-semibold" style={{ color: 'var(--ink-primary)' }}>
                    {previewPost.title}
                  </h3>
                  <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>
                    Sandboxed iframe preview (allow-scripts) / @{previewPost.author.handle}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      forkPostToWorkspace(previewPost);
                      setPreviewPost(null);
                    }}
                    className="inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-xs font-semibold"
                    style={{
                      backgroundColor: 'var(--accent-primary)',
                      color: '#06080d',
                    }}
                  >
                    <GitFork className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Fork vào Work space</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewPost(null)}
                    aria-label="Đóng bản xem trước"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border"
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
                sandbox="allow-scripts"
                referrerPolicy="no-referrer"
                srcDoc={buildShowcasePreviewDoc(previewPost, theme)}
                className="min-h-0 flex-1 w-full border-0"
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
            aria-label="Báo cáo nội dung vi phạm"
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
              className="w-full max-w-[440px] overflow-hidden rounded-[22px] border p-6"
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
                    Mục tiêu: {reportTarget.title}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setReportTarget(null)}
                  aria-label="Đóng hộp báo cáo"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full"
                  style={{ color: 'var(--ink-muted)' }}
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>

              <div className="mt-4 space-y-2">
                <label className="block text-xs font-medium" style={{ color: 'var(--ink-secondary)' }}>
                  Lý do chuyển lên Admin Moderation Queue
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

              <div className="mt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReportTarget(null)}
                  className="h-9 rounded-full border px-4 text-xs font-medium"
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
                  className="h-9 rounded-full px-4 text-xs font-semibold disabled:opacity-50"
                  style={{
                    backgroundColor: 'var(--accent-copper)',
                    color: '#ffffff',
                  }}
                >
                  {submittingReport ? 'Đang gửi...' : 'Gửi báo cáo'}
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
            aria-label="Cập nhật Project Continuity Handover Dossier"
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
              className="w-full max-w-[520px] overflow-hidden rounded-[22px] border p-6"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-strong)',
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-base font-semibold" style={{ color: 'var(--ink-primary)' }}>
                    Cập nhật Handover Dossier
                  </h3>
                  <p className="mt-1 text-xs" style={{ color: 'var(--ink-secondary)' }}>
                    {dossierClub.name || dossierClub.title}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setDossierClub(null)}
                  aria-label="Đóng trình sửa Dossier"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full"
                  style={{ color: 'var(--ink-muted)' }}
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>

              <div className="mt-4 space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--ink-secondary)' }}>
                    Tên dự án / Mục tiêu bàn giao
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
                    Ghi chú kỹ thuật & Trạng thái hiện tại
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
                    Known bugs & Next milestones (mỗi dòng 1 mục)
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

              <div className="mt-5 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDossierClub(null)}
                  className="h-9 rounded-full border px-4 text-xs font-medium"
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
                  className="h-9 rounded-full px-4 text-xs font-semibold disabled:opacity-50"
                  style={{
                    backgroundColor: 'var(--accent-primary)',
                    color: '#06080d',
                  }}
                >
                  {savingDossier ? 'Đang lưu...' : 'Lưu Dossier'}
                </button>
              </div>
            </motion.form>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
};
