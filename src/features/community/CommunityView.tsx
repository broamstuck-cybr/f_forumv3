import React, { useMemo, useState } from 'react';
import { ArrowUp, Bookmark, BookmarkCheck, Flag, X } from 'lucide-react';
import type {
  ClubHandoverDossier,
  CommunityAnswer,
  CommunityChannel,
  CommunityPost,
} from '../../types/index';
import { useAppStore } from '../../store/appStore';
import { ReaderCard } from '../../components/pinui';
import { Mark } from '../../ui/Mark';
import { Modal } from '../workspace/Modal';
import './community.css';

type SectionTab = 'critique' | 'clubs' | 'knowledge';
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

function escapeHtml(raw: string): string {
  return raw.replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function buildShowcasePreviewDoc(post: CommunityPost, theme: 'dark' | 'light'): string {
  const isDark = theme === 'dark';
  const bg = isDark ? '#121110' : '#f4f0e6';
  const fg = isDark ? '#efe9dd' : '#17150f';
  const surface = isDark ? '#1a1917' : '#fbf8f1';
  const border = isDark ? 'rgba(239,233,221,0.18)' : 'rgba(23,21,15,0.18)';
  const snippet = post.demoSnippet || {
    html: `<section style="padding:28px;border:1px solid ${border};background:${surface};max-width:460px"><h3 style="font-family:Georgia,serif;font-size:22px;margin-bottom:8px">${escapeHtml(post.title)}</h3><p style="font-size:14px;line-height:1.6;opacity:0.8">${escapeHtml(post.description || post.body || '')}</p></section>`,
    css: '',
  };
  return `<!DOCTYPE html><html lang="vi"><head><meta charset="utf-8" /><style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{min-height:100vh;display:grid;place-items:center;padding:24px;background:${bg};color:${fg};font-family:system-ui,sans-serif}
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

  const [sectionTab, setSectionTab] = useState<SectionTab>('critique');
  const [critiqueFilter, setCritiqueFilter] = useState<CritiqueFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
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

  const activeList =
    sectionTab === 'clubs' ? clubPosts : sectionTab === 'knowledge' ? dropPosts : critiquePosts;

  const leadPost = useMemo(
    () => activeList.find((item) => item.id === selectedId) || activeList[0] || null,
    [activeList, selectedId]
  );

  const leadAnswers = useMemo(() => (leadPost ? getAllAnswers(leadPost) : []), [leadPost]);

  const counts: Record<SectionTab, number> = {
    critique: communityChannels.qa.length + communityChannels.showcase.length,
    clubs: communityChannels.clubs.length,
    knowledge: communityChannels.drops.length,
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
        title: 'Gửi phản biện thất bại',
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
      title: 'Đã nạp từ Workspace',
      message: activeProject.name,
    });
  };

  const openComposer = () => {
    if (sectionTab === 'clubs') setComposeChannel('clubs');
    else if (sectionTab === 'knowledge') setComposeChannel('drops');
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
        setSectionTab('critique');
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
              '.demo-box{padding:24px;border:1px solid rgba(239,233,221,0.22);background:#1a1917;color:#efe9dd}',
          },
        });
        setSectionTab('critique');
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
        setSectionTab('knowledge');
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
        setSectionTab('clubs');
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

  const readerParagraphs = useMemo(() => {
    if (!leadPost) return [];
    const lines = [leadPost.body || leadPost.description || leadPost.title];
    if (leadPost.payload) lines.push(leadPost.payload);
    lines.push(`Chuyên mục ${leadPost.category}, đăng bởi ${leadPost.author.name} (@${leadPost.author.handle}).`);
    return lines;
  }, [leadPost]);

  const tabs: Array<{ id: SectionTab; label: string }> = [
    { id: 'critique', label: 'Phản biện' },
    { id: 'clubs', label: 'Hội nhóm' },
    { id: 'knowledge', label: 'Học liệu' },
  ];

  const canAcceptLead =
    Boolean(currentUser) &&
    Boolean(leadPost) &&
    (currentUser?.role === 'admin' || currentUser?.username === leadPost?.author.handle);

  return (
    <div className="cm">
      <header className="wrap-wide cm-head">
        <div>
          <p className="t-label">source of knowledge</p>
          <h1 className="t-display">
            <span className="t-script cm-cap">T</span>òa soạn
          </h1>
        </div>

        <div className="cm-aside">
          <p className="cm-lede">
            Một câu hỏi lớn ở trang nhất, phản biện ghi bên lề, lời giải đạt chuẩn gạch bằng bút đỏ.
          </p>
          <div className="cm-bar">
            <div className="cm-search">
              <label htmlFor="cm-search" className="t-label">
                Tìm
              </label>
              <input
                id="cm-search"
                type="search"
                className="cm-search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="chủ đề, mẫu, hội nhóm"
                autoComplete="off"
                spellCheck={false}
              />
              {searchQuery && (
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSearchQuery('')}>
                  Xóa
                </button>
              )}
            </div>
            <button type="button" className="btn btn-red" onClick={openComposer}>
              Đăng bài
            </button>
          </div>
        </div>
      </header>

      <div className="wrap-wide">
        <div className="cm-modes" role="tablist" aria-label="Chuyên mục tòa soạn">
          {tabs.map((tab) => {
            const active = sectionTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                className="cm-mode"
                aria-selected={active}
                onClick={() => {
                  setSectionTab(tab.id);
                  setSelectedId(null);
                }}
              >
                <span>
                  {active ? (
                    <Mark kind="underline" active>
                      {tab.label}
                    </Mark>
                  ) : (
                    tab.label
                  )}
                </span>
                <span className="t-label cm-mode-count">{counts[tab.id]}</span>
              </button>
            );
          })}
        </div>

        {sectionTab === 'critique' && (
          <div className="cm-subbar" role="group" aria-label="Lọc phản biện">
            {(
              [
                { id: 'all', label: 'Tất cả' },
                { id: 'qa', label: 'Hỏi đáp' },
                { id: 'showcase', label: 'Trình diễn' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                className="cm-filter"
                aria-pressed={critiqueFilter === opt.id}
                onClick={() => {
                  setCritiqueFilter(opt.id);
                  setSelectedId(null);
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}

        {activeList.length === 0 || !leadPost ? (
          <div className="cm-empty">
            <h2 className="t-title">Chưa có bài viết khớp từ khóa</h2>
            <p className="t-lead">Xóa bộ lọc hoặc đăng chủ đề mới lên trang nhất.</p>
            <div className="hm-actions">
              {searchQuery && (
                <button type="button" className="btn btn-line" onClick={() => setSearchQuery('')}>
                  Xóa lọc
                </button>
              )}
              <button type="button" className="btn btn-red" onClick={openComposer}>
                Đăng bài
              </button>
            </div>
          </div>
        ) : (
          <>
            <section aria-label="Bài tiêu điểm" className="cm-front">
              <article className="cm-lead">
                <div className="cm-lead-meta">
                  <span className="tag tag-red">{leadPost.category}</span>
                  <span className="t-label">
                    {leadPost.author.name}, @{leadPost.author.handle}
                  </span>
                </div>

                <h2 className="cm-lead-title">{leadPost.title}</h2>

                <p className="cm-lead-body">{leadPost.body || leadPost.description}</p>

                {leadPost.demoSnippet && (
                  <div className="cm-preview">
                    <iframe
                      title={`Xem trước ${leadPost.title}`}
                      sandbox="allow-scripts"
                      referrerPolicy="no-referrer"
                      srcDoc={buildShowcasePreviewDoc(leadPost, theme)}
                    />
                  </div>
                )}

                {leadPost.payload && <pre className="cm-code">{leadPost.payload}</pre>}

                {leadPost.channel === 'clubs' && leadPost.activeDossier && (
                  <div className="cm-dossier">
                    <div className="cm-margin-head">
                      <div>
                        <p className="t-label">hồ sơ chuyển giao</p>
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

                {sectionTab === 'knowledge' && (
                  <ReaderCard
                    title={leadPost.title}
                    subtitle={`${leadPost.category}, @${leadPost.author.handle}`}
                    paragraphs={readerParagraphs}
                    openLabel="Đọc sâu"
                    theme={theme}
                  />
                )}

                {leadPost.tags.length > 0 && (
                  <div className="cm-tags">
                    {leadPost.tags.slice(0, 6).map((tag) => (
                      <span key={tag} className="tag">
                        {tag}
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
                      aria-label={`Tán thành ${leadPost.title}`}
                    >
                      <ArrowUp size={18} aria-hidden="true" />
                    </button>
                    <span className="t-label">{leadPost.votes ?? leadPost.likes ?? 0}</span>
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
                      className="icon-btn"
                      onClick={() => toggleSavedItem(leadPost.id)}
                      aria-label={savedItemIds.includes(leadPost.id) ? 'Bỏ lưu' : 'Lưu bài'}
                      aria-pressed={savedItemIds.includes(leadPost.id)}
                    >
                      {savedItemIds.includes(leadPost.id) ? (
                        <BookmarkCheck size={18} aria-hidden="true" />
                      ) : (
                        <Bookmark size={18} aria-hidden="true" />
                      )}
                    </button>
                    <button
                      type="button"
                      className="icon-btn"
                      onClick={() => setReportTarget(leadPost)}
                      aria-label={`Báo cáo ${leadPost.title}`}
                    >
                      <Flag size={18} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </article>

              <aside aria-label="Ghi chú lề và phản biện" className="cm-margin">
                <div className="cm-margin-head">
                  <h3 className="t-title" style={{ fontSize: 'var(--text-xl)' }}>
                    Lề phản biện
                  </h3>
                  <span className="t-label">{leadAnswers.length} ghi chú</span>
                </div>

                {leadAnswers.length === 0 ? (
                  <p className="t-lead" style={{ fontSize: 'var(--text-sm)' }}>
                    Chưa có ghi chú lề. Hãy đặt phản biện hoặc đề xuất phương án kiểm chứng đầu tiên.
                  </p>
                ) : (
                  <ul className="cm-notes">
                    {leadAnswers.map((ans) => (
                      <li key={ans.id} className="cm-note" data-accepted={ans.isAccepted ? 'true' : undefined}>
                        <div className="cm-note-head">
                          <span className="t-label">
                            {ans.author.name}, @{ans.author.handle}
                          </span>
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
                        <p className="cm-note-text">{ans.content}</p>
                      </li>
                    ))}
                  </ul>
                )}

                <form className="cm-reply-form" onSubmit={(e) => void handleSubmitReply(e)}>
                  <label htmlFor="cm-reply" className="t-label">
                    viết ghi chú bên lề
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
                      {submittingReply ? 'Đang gửi' : 'Gửi lề'}
                    </button>
                  </div>
                </form>
              </aside>
            </section>

            <section aria-label="Mục lục số báo" className="cm-edition">
              <div className="cm-edition-head">
                <h2 className="t-title" style={{ fontSize: 'var(--text-2xl)' }}>
                  Mục lục số này
                </h2>
                <span className="t-label">{activeList.length} bài</span>
              </div>

              <ul className="cm-list">
                {activeList.map((post) => {
                  const active = leadPost.id === post.id;
                  const replyCount = getAllAnswers(post).length;
                  return (
                    <li
                      key={post.id}
                      className="cm-row"
                      data-active={active ? 'true' : undefined}
                      onClick={() => setSelectedId(post.id)}
                    >
                      <button
                        type="button"
                        className="cm-row-btn"
                        aria-current={active ? 'true' : undefined}
                        onClick={() => setSelectedId(post.id)}
                      >
                        <span className="t-label">
                          {post.category}, @{post.author.handle}
                        </span>
                        <span className="cm-row-title">{post.title}</span>
                        <span className="cm-row-excerpt">{post.body || post.description}</span>
                      </button>

                      <div className="cm-row-meta t-label">
                        <span>{post.votes ?? post.likes ?? 0} tán thành</span>
                        <span>{replyCount} lề</span>
                        {post.acceptedAnswer && <span className="tag tag-red">đạt chuẩn</span>}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          </>
        )}
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
              onChange={(e) => setComposeChannel(e.target.value as CommunityChannel)}
            >
              <option value="qa">Hỏi đáp phản biện</option>
              <option value="showcase">Trình diễn hộp cát</option>
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

          {composeChannel === 'showcase' && (
            <div>
              <button type="button" className="btn btn-line btn-sm" onClick={handlePrefillFromWorkspace}>
                Nạp Workspace
              </button>
            </div>
          )}

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

          {composeChannel === 'showcase' && (
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
                />
              </div>
            </>
          )}

          {(composeChannel === 'drops' || composeChannel === 'clubs') && (
            <div className="cm-field">
              <label htmlFor="cm-payload" className="t-label">
                {composeChannel === 'clubs' ? 'cột mốc tiếp theo (mỗi dòng một mục)' : 'nội dung tài liệu'}
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
              placeholder="accessibility, diff, pinui"
            />
          </div>

          <div className="cm-dialog-actions">
            <button type="button" className="btn btn-line" onClick={() => setComposerOpen(false)}>
              Hủy
            </button>
            <button type="submit" className="btn btn-red" disabled={submittingPost || !composeTitle.trim()}>
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
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>
          <p className="t-label">{reportTarget?.title}</p>
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
        label={previewPost?.title || 'Xem thử hộp cát'}
        className="cm-dialog-wide"
      >
        {previewPost && (
          <div className="cm-dialog-body">
            <div className="cm-dialog-head">
              <div>
                <p className="t-label">live view hộp cát</p>
                <h2 className="t-title" style={{ fontSize: 'var(--text-xl)' }}>
                  {previewPost.title}
                </h2>
              </div>
              <button
                type="button"
                className="icon-btn"
                onClick={() => setPreviewPost(null)}
                aria-label="Đóng"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>
            <div className="cm-preview" style={{ aspectRatio: '16 / 9' }}>
              <iframe
                title={`Hộp cát ${previewPost.title}`}
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
