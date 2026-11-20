import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useAppStore } from '../../store/appStore';
import {
  PromptComposer,
  type PromptComposerAction,
  type PromptComposerModel,
} from '../../components/pinui/PromptComposer';
import { ScrollStoryEngine } from '../../components/launchpad/ScrollStoryEngine';
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
    styles: ['Mực tối giản', 'Giấy biên tập', 'Tương phản cao'],
    layouts: ['Bất đối xứng', 'Kể chuyện cuộn', 'Trưng bày mẫu'],
    features: ['Live View cô lập', 'Hỏi đáp gấp mở', 'So sánh minh bạch'],
  },
  dashboard: {
    title: 'Dữ liệu',
    styles: ['Bảng kỹ thuật', 'Báo cáo biên tập', 'Nhịp đo gọn'],
    layouts: ['Thanh bên', 'Chia 60/40', 'Thẻ chuyển đổi'],
    features: ['Bảng lọc thật', 'Kiểm định tự động', 'Xuất tệp sạch'],
  },
  'club-hub': {
    title: 'Hội nhóm',
    styles: ['Học đường', 'Mực đêm', 'Giấy ấm'],
    layouts: ['Hồ sơ bàn giao', 'Dòng thời gian', 'Hai cột'],
    features: ['Thành viên', 'Cột mốc', 'Đăng ký'],
  },
  'quiz-tools': {
    title: 'Phản biện',
    styles: ['Tĩnh tại', 'Xúc giác', 'Nghiên cứu'],
    layouts: ['Trung tâm', 'Câu hỏi + ghi chú', 'Từng bước'],
    features: ['Đối chiếu đáp án', 'Đếm thời gian', 'Phân tích'],
  },
  'design-code': {
    title: 'Mã nguồn',
    styles: ['Token CSS', 'Bút đỏ', 'In ấn sắc nét'],
    layouts: ['390/768/1440', 'Bất đối xứng', 'Soi Diff'],
    features: ['HTML/CSS thuần', 'Focus A11y', 'Mực và Giấy'],
  },
};

function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Buổi sáng tốt lành';
  if (hour < 18) return 'Buổi chiều tĩnh tại';
  return 'Buổi tối tập trung';
}

export const HomeView: React.FC<HomeViewProps> = () => {
  const {
    currentUser,
    projects,
    communityPosts,
    theme,
    navigate,
    selectProject,
    launchPromptToWorkspace,
  } = useAppStore();

  const reduced = Boolean(useReducedMotion());
  const [promptText, setPromptText] = useState('');
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState(HOME_MODELS[0].id ?? 'auto');
  const [bpStyleIdx, setBpStyleIdx] = useState(0);
  const [bpLayoutIdx, setBpLayoutIdx] = useState(0);
  const [bpFeatureIdx, setBpFeatureIdx] = useState(0);

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
      `Xây dựng ${bp.title} theo phong cách ${style}, bố cục ${layout}, tích hợp ${feature}, tương thích 390px/768px/1440px.`
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
    const mappedModel =
      selectedModel === 'fast'
        ? 'ag/gemini-3.8-flash-low'
        : selectedModel === 'architect'
          ? 'studio-heavy-route'
          : 'auto';
    void launchPromptToWorkspace(text, [], { model: mappedModel });
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
      <section aria-label="Bàn khởi tạo F-Forum" className="hm-desk">
        <div className="wrap hm-desk-inner">
          <p className="t-label">{greeting}</p>

          <h1 className="hm-title">
            <span className="t-script hm-cap">B</span>ạn muốn{' '}
            <Mark kind="underline" active>
              kiểm chứng
            </Mark>{' '}
            ý tưởng nào hôm nay?
          </h1>

          <p className="hm-lead">
            Chọn một thẻ tác vụ PinUI để dựng đặc tả không tốn lượt, hoặc mô tả trực tiếp để mở vào Workspace với Live
            View và Diff &amp; Check.
          </p>

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
                  <span className="t-label">cấu trúc 0 lượt, {activeBlueprint.title}</span>
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
        onLaunchPrompt={launchPromptToWorkspace}
        onOpenLeaderboard={openExploreLeaderboard}
      />

      <section aria-label="Dự án gần đây" className="hm-band">
        <div className="wrap-wide">
          <div className="hm-band-head">
            <div>
              <p className="t-label">workspace cục bộ</p>
              <h2 className="t-title">Dự án đang mở</h2>
            </div>
            <button type="button" className="btn btn-line" onClick={() => navigate('workspace')}>
              Workspace
            </button>
          </div>

          <ul className="hm-index">
            {projects.slice(0, 5).map((proj) => {
              const passCount = proj.checksReport?.passCount ?? 0;
              const totalChecks = proj.checksReport?.results.length ?? 0;
              return (
                <li key={proj.id} className="hm-row">
                  <div className="hm-row-main">
                    <div className="hm-row-meta t-label">
                      <span>{proj.files.length} tệp</span>
                      <span>{new Date(proj.updatedAt).toLocaleDateString('vi-VN')}</span>
                    </div>
                    <h3 className="hm-row-title">{proj.name}</h3>
                    <p className="hm-row-desc">{proj.description}</p>
                  </div>
                  <div className="hm-row-side">
                    <span className="tag tag-green">
                      {totalChecks > 0 ? `${passCount}/${totalChecks} đạt` : 'sẵn sàng'}
                    </span>
                    <button
                      type="button"
                      className="btn btn-solid btn-sm"
                      onClick={() => {
                        selectProject(proj.id);
                        navigate('workspace');
                      }}
                    >
                      Mở lại
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <section aria-label="Tòa soạn Source of Knowledge" className="hm-band">
        <div className="wrap-wide">
          <div className="hm-band-head">
            <div>
              <p className="t-label">source of knowledge</p>
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
