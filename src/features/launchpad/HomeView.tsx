import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  ArrowRight,
  ArrowUpRight,
  Clock,
  FolderGit2,
  GitBranch,
  SlidersHorizontal,
  Sparkles,
  Trophy,
} from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { PromptComposer, SynaisFooter, type PromptComposerAction } from '../../components/pinui';
import { AmbientGlyphCanvas } from '../../components/launchpad/AmbientGlyphCanvas';
import { SvgGlassFilter } from '../../components/launchpad/SvgGlassFilter';
import { ScrollStoryEngine } from '../../components/launchpad/ScrollStoryEngine';

export interface HomeViewProps {
  onOpenNotice?: () => void;
  onOpenCommandPalette?: () => void;
}

const HOME_ACTIONS: PromptComposerAction[] = [
  {
    id: 'landing',
    label: 'Landing Page',
    placeholder: 'Mô tả sản phẩm, tông màu và CTA chính cho trang Landing...',
    accent: 'var(--accent-primary)',
  },
  {
    id: 'dashboard',
    label: 'Dashboard',
    placeholder: 'Mô tả hệ thống chỉ số, biểu đồ và bộ lọc cho Dashboard...',
    accent: 'var(--accent-verdigris)',
  },
  {
    id: 'club-hub',
    label: 'Club Hub',
    placeholder: 'Mô tả không gian CLB, lịch sự kiện và Hồ sơ chuyển giao...',
    accent: 'var(--accent-jade)',
  },
  {
    id: 'quiz-tools',
    label: 'Quiz & Tools',
    placeholder: 'Mô tả công cụ luyện tập, quiz hoặc bộ đếm học tập...',
    accent: 'var(--accent-copper)',
  },
  {
    id: 'design-code',
    label: 'Design to Code',
    placeholder: 'Dán bố cục hoặc mô tả giao diện cần chuyển sang HTML/CSS/JS...',
    accent: 'var(--accent-primary)',
  },
];

const BLUEPRINT_OPTIONS: Record<
  string,
  {
    title: string;
    styles: string[];
    layouts: string[];
    features: string[];
  }
> = {
  landing: {
    title: 'Landing Page Blueprint',
    styles: ['Obsidian Foundry Dark', 'Editorial Stone Light', 'High-Contrast Print'],
    layouts: ['Asymmetric Split Hero', 'Scroll Narrative', 'Stage & Proof'],
    features: ['Interactive Preview Stage', 'Pricing Comparison', 'Accordion FAQ'],
  },
  dashboard: {
    title: 'Dashboard Blueprint',
    styles: ['Technical Slate', 'Editorial Stone', 'Compact Telemetry'],
    layouts: ['Sidebar + KPI Rail', 'Split 60/40 Workbench', 'Tabbed Matrix'],
    features: ['Filterable Data Ledger', 'Status Checks Panel', 'Export Summary'],
  },
  'club-hub': {
    title: 'Club Hub Blueprint',
    styles: ['Editorial Campus', 'Obsidian Dark', 'Warm Paper'],
    layouts: ['Handover Dossier + Feed', 'Timeline Showcase', 'Dual Column Roster'],
    features: ['Member Presence Roster', 'Milestone Checklist', 'Recruitment Form'],
  },
  'quiz-tools': {
    title: 'Quiz & Tools Blueprint',
    styles: ['Focus Minimal', 'Tactile Cards', 'Obsidian Study'],
    layouts: ['Centered Stage', 'Split Question + Notes', 'Step Wizard'],
    features: ['Instant Answer Review', 'Countdown Timer', 'Score Breakdown'],
  },
  'design-code': {
    title: 'Design to Code Blueprint',
    styles: ['Semantic CSS Tokens', 'Liquid Glass Surface', 'Clean Brutalist'],
    layouts: ['Responsive 390/768/1440', 'Asymmetric Bento', 'Split Inspector'],
    features: ['Zero-Dependency HTML/CSS/JS', 'Accessible Focus States', 'Dark/Light Tokens'],
  },
};

function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Chào buổi sáng';
  if (hour < 18) return 'Chào buổi chiều';
  return 'Chào buổi tối';
}

export const HomeView: React.FC<HomeViewProps> = ({
  onOpenNotice,
  onOpenCommandPalette,
}) => {
  const {
    currentUser,
    projects,
    resourceLibrary,
    communityPosts,
    navigate,
    selectProject,
    launchPromptToWorkspace,
    attachItemToWorkspace,
  } = useAppStore();

  const reduced = Boolean(useReducedMotion());
  const [promptText, setPromptText] = useState('');
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState('Auto Router');
  const [bpStyleIdx, setBpStyleIdx] = useState(0);
  const [bpLayoutIdx, setBpLayoutIdx] = useState(0);
  const [bpFeatureIdx, setBpFeatureIdx] = useState(0);

  const greeting = useMemo(() => {
    const prefix = getTimeGreeting();
    const who = currentUser?.name ? currentUser.name : 'Maker';
    return `${prefix}, ${who}`;
  }, [currentUser?.name]);

  const activeBlueprint = selectedAction ? BLUEPRINT_OPTIONS[selectedAction] ?? null : null;

  const assembleBlueprint = (actionId: string, sIdx: number, lIdx: number, fIdx: number) => {
    const bp = BLUEPRINT_OPTIONS[actionId];
    if (!bp) return;
    const style = bp.styles[sIdx] ?? bp.styles[0];
    const layout = bp.layouts[lIdx] ?? bp.layouts[0];
    const feature = bp.features[fIdx] ?? bp.features[0];
    setPromptText(
      `Xây dựng ${bp.title.replace(' Blueprint', '')} theo phong cách ${style}, bố cục ${layout}, tích hợp ${feature} và tương thích 390px/768px/1440px.`
    );
  };

  const handleActionSelect = (id: string | null) => {
    setSelectedAction(id);
    setBpStyleIdx(0);
    setBpLayoutIdx(0);
    setBpFeatureIdx(0);
    if (id) {
      assembleBlueprint(id, 0, 0, 0);
    }
  };

  const handleLaunch = (text: string) => {
    void launchPromptToWorkspace(text);
  };

  const openExploreLeaderboard = () => {
    try {
      window.sessionStorage.setItem('ff_explore_mode', 'leaderboard');
    } catch {
      void 0;
    }
    window.dispatchEvent(new CustomEvent('ff:explore-mode', { detail: 'leaderboard' }));
    navigate('explore');
  };

  const verifiedRepoTeasers = useMemo(() => {
    const preferred = resourceLibrary.filter(
      (item) =>
        item.group === 'GitHub Repositories' ||
        item.group === 'Skills & Rules' ||
        item.group === 'AI Tools'
    );
    return (preferred.length >= 4 ? preferred : resourceLibrary).slice(0, 4);
  }, [resourceLibrary]);

  const recentHighlights = useMemo(() => communityPosts.slice(0, 4), [communityPosts]);

  const triggerNotice = () => {
    if (onOpenNotice) {
      onOpenNotice();
      return;
    }
    window.dispatchEvent(new CustomEvent('fforum:open-notice'));
  };

  const triggerCommand = () => {
    if (onOpenCommandPalette) {
      onOpenCommandPalette();
      return;
    }
    window.dispatchEvent(new CustomEvent('fforum:open-command-palette'));
  };

  return (
    <div className="relative w-full">
      <SvgGlassFilter />

      <section
        aria-label="Home Launchpad"
        className="relative w-full overflow-hidden border-b"
        style={{
          minHeight: 'calc(100svh - var(--navbar-h))',
          borderColor: 'var(--border-subtle)',
        }}
      >
        <AmbientGlyphCanvas />

        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 68% 48% at 50% 18%, var(--accent-soft), transparent 72%), radial-gradient(ellipse 46% 38% at 84% 78%, var(--accent-verdigris-soft), transparent 74%)',
          }}
          aria-hidden="true"
        />

        <div className="ff-container relative z-10 flex min-h-[calc(100svh-var(--navbar-h))] flex-col items-center justify-center py-8 md:py-10">
          <motion.div
            initial={reduced ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-[820px] flex flex-col items-center text-center"
          >
            <div
              className="ff-liquid-surface w-full rounded-[28px] px-4 py-6 sm:px-9 sm:py-9"
              style={{ borderColor: 'var(--border-strong)' }}
            >
              <div className="relative z-10 flex flex-col items-center">
                <span
                  className="inline-flex items-center gap-2 rounded-full border px-3.5 py-1 text-[12px] font-medium"
                  style={{
                    background: 'var(--bg-panel)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--ink-secondary)',
                  }}
                >
                  <Sparkles className="h-3.5 w-3.5" style={{ color: 'var(--accent-primary)' }} aria-hidden="true" />
                  <span>{greeting}</span>
                </span>

                <h1
                  className="mt-4 font-bold tracking-tight text-balance"
                  style={{
                    fontSize: 'clamp(1.85rem, 1.35rem + 2vw, 3.1rem)',
                    lineHeight: 1.08,
                    color: 'var(--ink-primary)',
                  }}
                >
                  Bạn muốn kiến tạo giao diện nào hôm nay?
                </h1>

                <p
                  className="mt-3 max-w-xl text-[14.5px] sm:text-[15.5px]"
                  style={{ color: 'var(--ink-secondary)' }}
                >
                  Chọn 1 trong 5 thẻ tác vụ để lập Prompt Blueprint 0-token, hoặc nhập ý tưởng để mở thẳng vào Work space.
                </p>

                <div className="mt-5 w-full">
                  <PromptComposer
                    layoutId="ff-prompt-composer"
                    value={promptText}
                    onChange={setPromptText}
                    selectedAction={selectedAction}
                    onSelectAction={handleActionSelect}
                    selectedModel={selectedModel}
                    onSelectModel={setSelectedModel}
                    actions={HOME_ACTIONS}
                    onSend={handleLaunch}
                    onAttachClick={() => navigate('explore')}
                  />
                </div>

                <AnimatePresence initial={false}>
                  {activeBlueprint && selectedAction && (
                    <motion.div
                      key={selectedAction}
                      initial={reduced ? { opacity: 0 } : { opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={reduced ? { opacity: 0 } : { opacity: 0, y: -6 }}
                      transition={{ type: 'spring', visualDuration: 0.34, bounce: 0.14 }}
                      className="mt-4 w-full rounded-2xl border p-4 text-left overflow-hidden"
                      style={{
                        background: 'var(--bg-panel)',
                        borderColor: 'var(--border-accent)',
                      }}
                    >
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="inline-flex items-center gap-2 text-[12.5px] font-semibold" style={{ color: 'var(--ink-primary)' }}>
                          <SlidersHorizontal className="h-3.5 w-3.5" style={{ color: 'var(--accent-primary)' }} aria-hidden="true" />
                          <span>{activeBlueprint.title} · 0-token Builder</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleActionSelect(null)}
                          className="text-[11.5px] font-mono bg-transparent border-0 cursor-pointer"
                          style={{ color: 'var(--ink-muted)' }}
                        >
                          Thu gọn
                        </button>
                      </div>

                      <div className="grid gap-3 md:grid-cols-3">
                        <div>
                          <div className="text-[11.5px] font-medium mb-1.5" style={{ color: 'var(--ink-muted)' }}>
                            Phong cách
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {activeBlueprint.styles.map((opt, idx) => (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => {
                                  setBpStyleIdx(idx);
                                  assembleBlueprint(selectedAction, idx, bpLayoutIdx, bpFeatureIdx);
                                }}
                                className="rounded-lg border px-2.5 py-1.5 text-[11.5px] cursor-pointer transition-colors"
                                style={{
                                  background: bpStyleIdx === idx ? 'var(--accent-soft)' : 'var(--bg-surface)',
                                  borderColor: bpStyleIdx === idx ? 'var(--border-accent)' : 'var(--border-subtle)',
                                  color: bpStyleIdx === idx ? 'var(--accent-primary)' : 'var(--ink-secondary)',
                                }}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <div className="text-[11.5px] font-medium mb-1.5" style={{ color: 'var(--ink-muted)' }}>
                            Bố cục
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {activeBlueprint.layouts.map((opt, idx) => (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => {
                                  setBpLayoutIdx(idx);
                                  assembleBlueprint(selectedAction, bpStyleIdx, idx, bpFeatureIdx);
                                }}
                                className="rounded-lg border px-2.5 py-1.5 text-[11.5px] cursor-pointer transition-colors"
                                style={{
                                  background: bpLayoutIdx === idx ? 'var(--accent-verdigris-soft)' : 'var(--bg-surface)',
                                  borderColor: bpLayoutIdx === idx ? 'var(--accent-verdigris)' : 'var(--border-subtle)',
                                  color: bpLayoutIdx === idx ? 'var(--accent-verdigris)' : 'var(--ink-secondary)',
                                }}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <div className="text-[11.5px] font-medium mb-1.5" style={{ color: 'var(--ink-muted)' }}>
                            Tính năng lõi
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {activeBlueprint.features.map((opt, idx) => (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => {
                                  setBpFeatureIdx(idx);
                                  assembleBlueprint(selectedAction, bpStyleIdx, bpLayoutIdx, idx);
                                }}
                                className="rounded-lg border px-2.5 py-1.5 text-[11.5px] cursor-pointer transition-colors"
                                style={{
                                  background: bpFeatureIdx === idx ? 'var(--accent-jade-soft)' : 'var(--bg-surface)',
                                  borderColor: bpFeatureIdx === idx ? 'var(--accent-jade)' : 'var(--border-subtle)',
                                  color: bpFeatureIdx === idx ? 'var(--accent-jade)' : 'var(--ink-secondary)',
                                }}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <ScrollStoryEngine
        onNavigate={navigate}
        onLaunchPrompt={launchPromptToWorkspace}
        onOpenLeaderboard={openExploreLeaderboard}
      />

      <section aria-label="Dự án Work space gần đây" className="py-14 sm:py-16 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="ff-container">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
            <div>
              <h2 className="text-[22px] sm:text-[26px] font-bold tracking-tight">
                Timeline dự án Work space gần đây
              </h2>
              <p className="mt-1 text-[14px]" style={{ color: 'var(--ink-secondary)' }}>
                Khôi phục toàn bộ tệp, diff và lịch sử hội thoại chỉ với 1 cú bấm.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('workspace')}
              className="inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-[13px] font-medium cursor-pointer"
              style={{
                background: 'var(--bg-surface)',
                borderColor: 'var(--border-strong)',
                color: 'var(--ink-primary)',
              }}
            >
              <span>Mở Work space</span>
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-3 ff-scrollbar snap-x">
            {projects.map((proj) => {
              const passCount = proj.checksReport?.passCount ?? 0;
              const totalChecks = proj.checksReport?.results.length ?? 0;
              return (
                <article
                  key={proj.id}
                  className="snap-start shrink-0 w-[300px] sm:w-[340px] rounded-[20px] border p-5 flex flex-col justify-between gap-4 overflow-hidden"
                  style={{
                    background: 'var(--bg-surface)',
                    borderColor: 'var(--border-subtle)',
                  }}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 text-[11.5px] font-mono" style={{ color: 'var(--ink-muted)' }}>
                      <span className="inline-flex items-center gap-1.5">
                        <FolderGit2 className="h-3.5 w-3.5" style={{ color: 'var(--accent-primary)' }} aria-hidden="true" />
                        <span>{proj.files.length} tệp</span>
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" aria-hidden="true" />
                        <span>{new Date(proj.updatedAt).toLocaleDateString('vi-VN')}</span>
                      </span>
                    </div>

                    <h3 className="mt-3 text-[16px] font-semibold truncate" style={{ color: 'var(--ink-primary)' }}>
                      {proj.name}
                    </h3>
                    <p className="mt-1 text-[13px] line-clamp-2" style={{ color: 'var(--ink-secondary)' }}>
                      {proj.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-3 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                    <span className="text-[11.5px] font-mono" style={{ color: 'var(--accent-jade)' }}>
                      {totalChecks > 0 ? `${passCount}/${totalChecks} checks` : 'Sẵn sàng'}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        selectProject(proj.id);
                        navigate('workspace');
                      }}
                      className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[12px] font-semibold border cursor-pointer"
                      style={{
                        background: 'var(--accent-soft)',
                        borderColor: 'var(--border-accent)',
                        color: 'var(--accent-primary)',
                      }}
                    >
                      <span>Khôi phục</span>
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section aria-label="Top Verified Repos & Skills" className="py-14 sm:py-16 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="ff-container">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
            <div>
              <h2 className="text-[22px] sm:text-[26px] font-bold tracking-tight">
                Top Verified Repos &amp; Skills
              </h2>
              <p className="mt-1 text-[14px]" style={{ color: 'var(--ink-secondary)' }}>
                Các kho mã nguồn mở, agent skills và bộ rules được xác thực trực tiếp qua GitHub API.
              </p>
            </div>
            <button
              type="button"
              onClick={openExploreLeaderboard}
              className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-semibold border-0 cursor-pointer"
              style={{
                background: 'var(--accent-gradient)',
                color: 'var(--ink-inverse)',
              }}
            >
              <Trophy className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Mở Bảng Xếp Hạng</span>
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
            {verifiedRepoTeasers[0] && (
              <article
                className="rounded-[22px] border p-6 flex flex-col justify-between gap-5 overflow-hidden"
                style={{
                  background: 'var(--bg-surface)',
                  borderColor: 'var(--border-strong)',
                }}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 text-[12px] font-mono">
                    <span
                      className="rounded-full px-2.5 py-0.5"
                      style={{ background: 'var(--accent-jade-soft)', color: 'var(--accent-jade)' }}
                    >
                      {verifiedRepoTeasers[0].group}
                    </span>
                    <span style={{ color: 'var(--ink-muted)' }}>{verifiedRepoTeasers[0].license}</span>
                  </div>
                  <h3 className="mt-3.5 text-[20px] font-bold tracking-tight" style={{ color: 'var(--ink-primary)' }}>
                    {verifiedRepoTeasers[0].title}
                  </h3>
                  <p className="mt-2 text-[14px] leading-relaxed" style={{ color: 'var(--ink-secondary)' }}>
                    {verifiedRepoTeasers[0].description}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                  <button
                    type="button"
                    onClick={() =>
                      attachItemToWorkspace(
                        {
                          id: verifiedRepoTeasers[0].id,
                          kind: 'resource',
                          title: verifiedRepoTeasers[0].title,
                          summary: verifiedRepoTeasers[0].description,
                          payload: verifiedRepoTeasers[0].snippet || verifiedRepoTeasers[0].officialUrl,
                          tags: verifiedRepoTeasers[0].tags,
                        },
                        true
                      )
                    }
                    className="inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[12.5px] font-semibold cursor-pointer"
                    style={{
                      background: 'var(--accent-soft)',
                      borderColor: 'var(--border-accent)',
                      color: 'var(--accent-primary)',
                    }}
                  >
                    <GitBranch className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Dùng trong Work space</span>
                  </button>
                  <button
                    type="button"
                    onClick={openExploreLeaderboard}
                    className="inline-flex items-center gap-1 text-[12.5px] font-medium bg-transparent border-0 cursor-pointer"
                    style={{ color: 'var(--accent-verdigris)' }}
                  >
                    <span>Xem bảng xếp hạng</span>
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              </article>
            )}

            <div className="space-y-2.5">
              {verifiedRepoTeasers.slice(1, 4).map((item) => (
                <article
                  key={item.id}
                  className="rounded-2xl border px-4 py-3.5 flex items-center justify-between gap-4 overflow-hidden"
                  style={{
                    background: 'var(--bg-surface)',
                    borderColor: 'var(--border-subtle)',
                  }}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-[11px] font-mono" style={{ color: 'var(--ink-muted)' }}>
                      <span style={{ color: 'var(--accent-verdigris)' }}>{item.group}</span>
                      <span>{item.license}</span>
                    </div>
                    <h4 className="mt-0.5 text-[14.5px] font-semibold truncate" style={{ color: 'var(--ink-primary)' }}>
                      {item.title}
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={openExploreLeaderboard}
                    aria-label={`Xem ${item.title} trong Bảng Xếp Hạng`}
                    className="inline-grid place-items-center h-9 w-9 shrink-0 rounded-xl border cursor-pointer"
                    style={{
                      background: 'var(--bg-panel)',
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--ink-primary)',
                    }}
                  >
                    <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section aria-label="Nhịp đập Source of Knowledge" className="py-16">
        <div className="ff-container">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
            <div>
              <h2 className="text-[22px] sm:text-[26px] font-bold tracking-tight">
                Nhịp đập Source of Knowledge
              </h2>
              <p className="mt-1 text-[14px]" style={{ color: 'var(--ink-secondary)' }}>
                Thảo luận kỹ thuật, Showcase và Drops nổi bật được chọn lọc từ cộng đồng.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('community')}
              className="inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-[13px] font-medium cursor-pointer"
              style={{
                background: 'var(--bg-surface)',
                borderColor: 'var(--border-strong)',
                color: 'var(--ink-primary)',
              }}
            >
              <span>Vào Source of Knowledge</span>
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>

          <div className="divide-y rounded-[22px] border overflow-hidden" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
            {recentHighlights.map((post) => (
              <div
                key={post.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4"
                style={{ borderColor: 'var(--border-subtle)' }}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-[11.5px] font-mono">
                    <span
                      className="rounded-md px-2 py-0.5"
                      style={{ background: 'var(--bg-panel)', color: 'var(--accent-primary)' }}
                    >
                      {post.channel}
                    </span>
                    <span style={{ color: 'var(--ink-muted)' }}>{post.author.name}</span>
                  </div>
                  <h3 className="mt-1 text-[15px] font-semibold truncate" style={{ color: 'var(--ink-primary)' }}>
                    {post.title}
                  </h3>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[12px] font-mono" style={{ color: 'var(--ink-muted)' }}>
                    {post.votes} votes
                  </span>
                  <button
                    type="button"
                    onClick={() => navigate('community')}
                    className="inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-[12px] font-medium cursor-pointer"
                    style={{
                      background: 'var(--bg-panel)',
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--ink-primary)',
                    }}
                  >
                    <span>Mở</span>
                    <ArrowRight className="h-3 w-3" aria-hidden="true" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <SynaisFooter
        onNavigate={navigate}
        onOpenNotice={triggerNotice}
        onOpenCommandPalette={triggerCommand}
      />
    </div>
  );
};

export default HomeView;
