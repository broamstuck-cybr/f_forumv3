import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useAppStore } from '../../store/appStore';
import {
  PromptComposer,
  type PromptComposerAction,
  type PromptComposerModel,
} from '../../components/pinui/PromptComposer';
import { DotMatrixHandsCanvas } from '../../components/launchpad/DotMatrixHandsCanvas';
import { ScrollStoryEngine } from '../../components/launchpad/ScrollStoryEngine';
import type { HomeMotionShowcaseItem } from '../../data/homeMotionShowcases';
import { Mark } from '../../ui/Mark';
import './home.css';

export interface HomeViewProps {
  onOpenNotice?: () => void;
}

const HOME_ACTIONS: PromptComposerAction[] = [
  {
    id: 'landing',
    label: 'Trang đích',
    placeholder: 'Mô tả sản phẩm, nhịp cuộn và điểm nhấn cho trang giới thiệu...',
    kind: 'image',
  },
  {
    id: 'dashboard',
    label: 'Dữ liệu',
    placeholder: 'Mô tả bảng chỉ số, bộ lọc và độ tương phản cần thiết...',
    kind: 'note',
  },
  {
    id: 'club-hub',
    label: 'Hội nhóm',
    placeholder: 'Mô tả không gian câu lạc bộ và hồ sơ bàn giao dự án...',
    kind: 'event',
  },
  {
    id: 'quiz-tools',
    label: 'Phản biện',
    placeholder: 'Mô tả công cụ luyện tập tư duy phản biện hoặc trắc nghiệm...',
    kind: 'voice',
  },
  {
    id: 'design-code',
    label: 'Mã nguồn',
    placeholder: 'Dán đặc tả giao diện cần chuyển sang HTML/CSS/JS sạch...',
    kind: 'docs',
  },
];

const HOME_MODELS: PromptComposerModel[] = [
  { id: 'auto', name: 'Định tuyến', note: 'Tự động chọn mô hình phù hợp' },
  { id: 'fast', name: 'Nhanh gọn', note: 'Phản hồi nhanh cho bản phác' },
  { id: 'architect', name: 'Chuyên sâu', note: 'Ưu tiên kiến trúc và kiểm định' },
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
    title: 'Trang đích',
    styles: ['Mực tối', 'Giấy ấm', 'Tương phản'],
    layouts: ['Bất đối', 'Cuộn kể', 'Trưng bày'],
    features: ['Live View', 'Gấp mở', 'So sánh'],
  },
  dashboard: {
    title: 'Dữ liệu',
    styles: ['Kỹ thuật', 'Biên tập', 'Nhịp gọn'],
    layouts: ['Thanh bên', 'Chia cột', 'Thẻ đổi'],
    features: ['Bảng lọc', 'Kiểm định', 'Xuất tệp'],
  },
  'club-hub': {
    title: 'Hội nhóm',
    styles: ['Học đường', 'Mực đêm', 'Giấy ấm'],
    layouts: ['Bàn giao', 'Dòng mốc', 'Hai cột'],
    features: ['Thành viên', 'Cột mốc', 'Đăng ký'],
  },
  'quiz-tools': {
    title: 'Phản biện',
    styles: ['Tĩnh tại', 'Xúc giác', 'Nghiên cứu'],
    layouts: ['Trung tâm', 'Ghi chú', 'Từng bước'],
    features: ['Đối chiếu', 'Đếm giờ', 'Phân tích'],
  },
  'design-code': {
    title: 'Mã nguồn',
    styles: ['Token CSS', 'Kiểm thử', 'In ấn'],
    layouts: ['Đa khung', 'Bất đối', 'Soi Diff'],
    features: ['HTML thuần', 'Focus A11y', 'Mực giấy'],
  },
};

function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Chào buổi sáng';
  if (hour < 18) return 'Chào buổi chiều';
  return 'Chào buổi tối';
}

function mapModelId(modelId: string): string {
  if (modelId === 'fast') return 'ag/gemini-3.8-flash-low';
  if (modelId === 'architect') return 'studio-heavy-route';
  return 'auto';
}

export const HomeView: React.FC<HomeViewProps> = () => {
  const {
    currentUser,
    projects,
    activeProjectId,
    communityPosts,
    theme,
    navigate,
    createProject,
    selectProject,
    addWorkspaceFiles,
    launchPromptToWorkspace,
  } = useAppStore();

  const reduced = Boolean(useReducedMotion());
  const [promptText, setPromptText] = useState('');
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState(HOME_MODELS[0].id ?? 'auto');
  const [bpStyleIdx, setBpStyleIdx] = useState(0);
  const [bpLayoutIdx, setBpLayoutIdx] = useState(0);
  const [bpFeatureIdx, setBpFeatureIdx] = useState(0);

  const pendingShowcaseRef = useRef<{
    projectId: string;
    files: Array<{ path: string; content: string; summary: string }>;
  } | null>(null);

  useEffect(() => {
    const pending = pendingShowcaseRef.current;
    if (!pending || activeProjectId !== pending.projectId) return;
    pendingShowcaseRef.current = null;
    addWorkspaceFiles(pending.files);
    navigate('workspace');
  }, [activeProjectId, addWorkspaceFiles, navigate]);

  const greeting = useMemo(() => {
    const prefix = getTimeGreeting();
    const who = currentUser?.name ? currentUser.name : 'bạn';
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
      `Xây dựng ${bp.title} theo phong cách ${style}, bố cục ${layout}, tích hợp ${feature}, tương thích 390px, 768px và 1440px.`
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

  const handleLaunch = (text: string, meta?: { action: string | null; model: string }) => {
    const chosenModel = meta?.model || selectedModel;
    void launchPromptToWorkspace(text, [], { model: mapModelId(chosenModel) });
  };

  const handleOpenShowcaseInWorkspace = (item: HomeMotionShowcaseItem) => {
    const existing = projects.find(
      (p) => !p.archived && p.attachedItems.some((attached) => attached.id === item.id)
    );
    if (existing) {
      selectProject(existing.id);
      navigate('workspace');
      return;
    }

    const created = createProject(item.title, item.summaryVi, [
      {
        id: item.id,
        kind: 'template',
        title: item.title,
        summary: item.summaryVi,
        tags: [item.category, item.motionConfig.pattern],
      },
    ]);

    pendingShowcaseRef.current = {
      projectId: created.id,
      files: item.files.map((file) => ({
        path: file.path,
        content: file.content,
        summary: `${item.title} (${file.path})`,
      })),
    };
  };

  const openCommunityPost = (postId: string) => {
    try {
      window.sessionStorage.setItem('ff_community_post_id', postId);
    } catch {
      void 0;
    }
    window.dispatchEvent(new CustomEvent('ff:community-post', { detail: postId }));
    navigate('community');
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

  const recentHighlights = useMemo(() => communityPosts.slice(0, 4), [communityPosts]);

  return (
    <div className="hm">
      <section aria-label="Xưởng khởi chạy chuyển động" className="hm-desk">
        <DotMatrixHandsCanvas />
        <div className="wrap-wide hm-desk-inner">
          <header className="hm-masthead">
            <div className="hm-masthead-copy">
              <p className="t-label hm-greeting">{greeting} · xưởng thiết kế chuyển động</p>
              <h1 className="hm-title">
                <span className="hm-title-quiet">Hi, how are you today?</span>
                <span className="hm-title-ink">
                  Hôm nay bạn muốn{' '}
                  <Mark kind="underline" active>
                    dựng giao diện
                  </Mark>{' '}
                  gì?
                </span>
              </h1>
              <p className="hm-lead">
                Chọn một thẻ cấu trúc hoặc gõ thẳng yêu cầu vào thanh lệnh; mọi bản phác đều mở trực tiếp vào Workspace
                kèm khung kiểm chứng 390 · 768 · 1440px.
              </p>
            </div>
          </header>

          <div className="hm-composer">
            <PromptComposer
              layoutId="ff-prompt-composer"
              theme={theme}
              value={promptText}
              onChange={setPromptText}
              selectedAction={selectedAction}
              onSelectAction={handleActionSelect}
              selectedModel={selectedModel}
              onSelectModel={setSelectedModel}
              actions={HOME_ACTIONS}
              models={HOME_MODELS}
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
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="hm-blueprint"
              >
                <div className="hm-blueprint-head">
                  <span className="t-label">cấu trúc 0 lượt · {activeBlueprint.title}</span>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => handleActionSelect(null)}
                  >
                    Thu gọn
                  </button>
                </div>

                <div className="hm-blueprint-grid">
                  <div>
                    <p className="t-label">phong cách</p>
                    <div className="hm-chips">
                      {activeBlueprint.styles.map((opt, idx) => (
                        <button
                          key={opt}
                          type="button"
                          className="hm-chip"
                          aria-pressed={bpStyleIdx === idx}
                          onClick={() => {
                            setBpStyleIdx(idx);
                            assembleBlueprint(selectedAction, idx, bpLayoutIdx, bpFeatureIdx);
                          }}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="t-label">bố cục</p>
                    <div className="hm-chips">
                      {activeBlueprint.layouts.map((opt, idx) => (
                        <button
                          key={opt}
                          type="button"
                          className="hm-chip"
                          aria-pressed={bpLayoutIdx === idx}
                          onClick={() => {
                            setBpLayoutIdx(idx);
                            assembleBlueprint(selectedAction, bpStyleIdx, idx, bpFeatureIdx);
                          }}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="t-label">tính năng</p>
                    <div className="hm-chips">
                      {activeBlueprint.features.map((opt, idx) => (
                        <button
                          key={opt}
                          type="button"
                          className="hm-chip"
                          aria-pressed={bpFeatureIdx === idx}
                          onClick={() => {
                            setBpFeatureIdx(idx);
                            assembleBlueprint(selectedAction, bpStyleIdx, bpLayoutIdx, idx);
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
      </section>

      <ScrollStoryEngine
        onNavigate={navigate}
        onLaunchPrompt={(prompt) => launchPromptToWorkspace(prompt, [], { model: mapModelId(selectedModel) })}
        onOpenShowcase={handleOpenShowcaseInWorkspace}
        onOpenLeaderboard={openExploreLeaderboard}
      />

      <section aria-label="Tòa soạn phản biện" className="hm-band">
        <div className="wrap-wide">
          <div className="hm-band-head">
            <div>
              <p className="t-label">bài viết chọn lọc</p>
              <h2 className="t-title">Tòa soạn phản biện</h2>
            </div>
            <button type="button" className="btn btn-line" onClick={() => navigate('community')}>
              Tri thức
            </button>
          </div>

          <ul className="hm-index">
            {recentHighlights.map((post) => (
              <li key={post.id} className="hm-row">
                <div className="hm-row-main">
                  <div className="hm-row-meta t-label">
                    <span className="tag">{post.category}</span>
                    <span>@{post.author.handle}</span>
                  </div>
                  <h3 className="hm-row-title">{post.title}</h3>
                </div>
                <div className="hm-row-side">
                  <span className="t-label">{post.votes ?? post.likes ?? 0} tán thành</span>
                  <button
                    type="button"
                    className="btn btn-line btn-sm"
                    onClick={() => openCommunityPost(post.id)}
                  >
                    Đọc tiếp
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
};

export default HomeView;
