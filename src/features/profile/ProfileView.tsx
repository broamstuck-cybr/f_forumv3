import React, { useEffect, useMemo, useState } from 'react';
import { BROAMSTUCK_REPOS } from '../../data/realShowcaseData';
import {
  RANKED_REPOS,
  rankedRepoContext,
  rankedRepoSavedId,
  studioRepoContext,
} from '../explore/catalog';
import { useAppStore } from '../../store/appStore';
import type { AttachedContextItem, CommunityPost } from '../../types/index';
import { Media, previewFor } from '../../ui/Media';
import './profile.css';

type ProfileTab = 'saved' | 'projects' | 'posts' | 'activity';

interface SavedEntry {
  id: string;
  savedId: string;
  sourceLabel: string;
  title: string;
  subtitle: string;
  summary: string;
  previewId?: string;
  context?: AttachedContextItem;
  communityPost?: CommunityPost;
}

interface ActivityEntry {
  id: string;
  timestamp: string;
  kindLabel: string;
  title: string;
  detail: string;
  projectId?: string;
  communityPostId?: string;
}

const LIBRARY_LABELS: Record<string, string> = {
  pinui: 'Tương tác',
  threeui: 'Không gian 3D',
  motionsites: 'Chuyển động',
  lucianlabs: 'Hiệu ứng',
  codefronts: 'Bố cục',
};

const CHANNEL_LABELS: Record<string, string> = {
  qa: 'Hỏi đáp',
  showcase: 'Trưng bày',
  drops: 'Học liệu',
  clubs: 'Hội nhóm',
};

const PROFILE_TABS: Array<{ id: ProfileTab; label: string }> = [
  { id: 'saved', label: 'Đã lưu' },
  { id: 'projects', label: 'Dự án' },
  { id: 'posts', label: 'Bài đăng' },
  { id: 'activity', label: 'Hoạt động' },
];

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

function getInitials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('') || 'F'
  );
}

function formatDateTime(iso: string): string {
  const ts = Date.parse(iso);
  if (Number.isNaN(ts)) return iso.slice(0, 10);
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(ts));
}

function readLocalProfileField(key: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback;
  try {
    const val = window.localStorage.getItem(key);
    return val !== null ? val : fallback;
  } catch {
    return fallback;
  }
}

export const ProfileView: React.FC = () => {
  const {
    currentUser,
    setAuthModalOpen,
    logout,
    projects,
    activeProject,
    selectProject,
    savedItemIds,
    toggleSavedItem,
    openInWorkspace,
    forkPostToWorkspace,
    sourceCatalog,
    resourceLibrary,
    communityPosts,
    quota,
    navigate,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<ProfileTab>('saved');
  const userKey = currentUser?.id || 'guest';
  const bioStorageKey = `fforum_v3_profile_bio_${userKey}`;
  const statusStorageKey = `fforum_v3_profile_status_${userKey}`;

  const defaultBio =
    currentUser?.bio?.trim() ||
    'Thiết kế giao diện, kiểm thử hộp cát và lưu trữ các thành phần web chuẩn hóa.';
  const defaultStatus = currentUser ? 'Đang hoạt động' : 'Phiên cục bộ';

  const [bio, setBio] = useState<string>(() => readLocalProfileField(bioStorageKey, defaultBio));
  const [statusNote, setStatusNote] = useState<string>(() =>
    readLocalProfileField(statusStorageKey, defaultStatus)
  );
  const [editingProfile, setEditingProfile] = useState(false);
  const [bioDraft, setBioDraft] = useState(bio);
  const [statusDraft, setStatusDraft] = useState(statusNote);

  useEffect(() => {
    const nextBio = readLocalProfileField(bioStorageKey, defaultBio);
    const nextStatus = readLocalProfileField(statusStorageKey, defaultStatus);
    setBio(nextBio);
    setStatusNote(nextStatus);
    setBioDraft(nextBio);
    setStatusDraft(nextStatus);
  }, [bioStorageKey, statusStorageKey, defaultBio, defaultStatus]);

  const displayName = currentUser?.name?.trim() || 'Thành viên cục bộ';
  const handle = currentUser?.username ? `@${currentUser.username}` : '@local_maker';
  const roleLabel =
    currentUser?.role === 'admin'
      ? 'Quản trị'
      : currentUser
        ? 'Thành viên'
        : 'Khách';

  const totalFilesCount = useMemo(
    () => projects.reduce((sum, proj) => sum + proj.files.length, 0),
    [projects]
  );

  const savedEntries = useMemo<SavedEntry[]>(() => {
    const entries: SavedEntry[] = [];

    for (const savedId of savedItemIds) {
      const tpl = sourceCatalog.find((item) => item.id === savedId);
      if (tpl) {
        const libName = LIBRARY_LABELS[tpl.sourceLibrary] || 'Thư viện mẫu';
        entries.push({
          id: `saved-${tpl.id}`,
          savedId: tpl.id,
          sourceLabel: libName,
          title: whiteLabelText(tpl.title),
          subtitle: whiteLabelText(tpl.category),
          summary: whiteLabelText(tpl.description),
          previewId: tpl.id,
          context: {
            id: tpl.id,
            kind: 'template',
            title: whiteLabelText(tpl.title),
            sourceLibrary: tpl.sourceLibrary,
            summary: whiteLabelText(tpl.description),
            payload:
              tpl.promptSpec ||
              `${tpl.archivePath}\nRuntime: ${tpl.runtime}\nStyle: ${tpl.style}`,
            tags: tpl.tags,
          },
        });
        continue;
      }

      const res = resourceLibrary.find((item) => item.id === savedId);
      if (res) {
        entries.push({
          id: `saved-${res.id}`,
          savedId: res.id,
          sourceLabel: res.group,
          title: whiteLabelText(res.title),
          subtitle: whiteLabelText(res.category),
          summary: whiteLabelText(res.description),
          context: {
            id: res.id,
            kind: 'resource',
            title: whiteLabelText(res.title),
            summary: whiteLabelText(res.description),
            payload: res.snippet || `${res.title} (${res.officialUrl})`,
            tags: res.tags,
          },
        });
        continue;
      }

      const ranked = RANKED_REPOS.find((repo) => rankedRepoSavedId(repo) === savedId);
      if (ranked) {
        entries.push({
          id: `saved-${savedId}`,
          savedId,
          sourceLabel: ranked.language || 'GitHub',
          title: ranked.fullName,
          subtitle: `${ranked.stars.toLocaleString('vi-VN')} sao`,
          summary: whiteLabelText(ranked.description),
          context: rankedRepoContext(ranked),
        });
        continue;
      }

      const house = BROAMSTUCK_REPOS.find((repo) => repo.id === savedId);
      if (house) {
        entries.push({
          id: `saved-${house.id}`,
          savedId: house.id,
          sourceLabel: house.language,
          title: house.name,
          subtitle: house.fullName,
          summary: whiteLabelText(house.summaryVi),
          context: studioRepoContext(house),
        });
        continue;
      }

      const post = communityPosts.find((item) => item.id === savedId && !item.hidden);
      if (post) {
        entries.push({
          id: `saved-${post.id}`,
          savedId: post.id,
          sourceLabel: CHANNEL_LABELS[post.channel] || post.category,
          title: whiteLabelText(post.title),
          subtitle: `@${post.author.handle}`,
          summary: whiteLabelText(post.body || post.description || post.title),
          communityPost: post,
        });
      }
    }

    return entries;
  }, [savedItemIds, sourceCatalog, resourceLibrary, communityPosts]);

  const userPosts = useMemo<CommunityPost[]>(() => {
    if (!currentUser) return [];
    const uid = currentUser.id;
    const uname = currentUser.username;
    return communityPosts
      .filter((post) => {
        if (post.hidden) return false;
        if (post.author.id === uid || post.author.handle === uname) return true;
        if (post.upvotedBy?.includes(uid)) return true;
        if (post.acceptedAnswer?.author.id === uid || post.acceptedAnswer?.author.handle === uname) {
          return true;
        }
        return Boolean(
          post.answers?.some((ans) => ans.author.id === uid || ans.author.handle === uname)
        );
      })
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  }, [communityPosts, currentUser]);

  const activityFeed = useMemo<ActivityEntry[]>(() => {
    const items: ActivityEntry[] = [];

    for (const proj of projects) {
      items.push({
        id: `act-proj-${proj.id}`,
        timestamp: proj.updatedAt,
        kindLabel: 'Dự án',
        title: proj.name,
        detail: `${proj.files.length} tệp mã nguồn`,
        projectId: proj.id,
      });

      for (const snap of proj.snapshots.slice(0, 4)) {
        items.push({
          id: `act-snap-${proj.id}-${snap.id}`,
          timestamp: snap.createdAt,
          kindLabel: 'Mốc lưu',
          title: snap.label,
          detail: proj.name,
          projectId: proj.id,
        });
      }
    }

    for (const post of userPosts) {
      items.push({
        id: `act-post-${post.id}`,
        timestamp: post.createdAt,
        kindLabel: CHANNEL_LABELS[post.channel] || 'Tri thức',
        title: whiteLabelText(post.title),
        detail: `${post.votes ?? post.likes ?? 0} tán thành`,
        communityPostId: post.id,
      });
    }

    return items.sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp));
  }, [projects, userPosts]);

  const openCommunityThread = (postId: string) => {
    try {
      window.sessionStorage.setItem('ff_community_post_id', postId);
    } catch {
      void 0;
    }
    window.dispatchEvent(new CustomEvent('ff:community-post', { detail: postId }));
    navigate('community');
  };

  const handleSaveBio = (event: React.FormEvent) => {
    event.preventDefault();
    const nextBio = bioDraft.trim() || defaultBio;
    const nextStatus = statusDraft.trim() || defaultStatus;
    setBio(nextBio);
    setStatusNote(nextStatus);
    try {
      window.localStorage.setItem(bioStorageKey, nextBio);
      window.localStorage.setItem(statusStorageKey, nextStatus);
    } catch {
      void 0;
    }
    setEditingProfile(false);
  };

  const quotaStatValue = quota.unlimited
    ? 'Không giới hạn'
    : `${quota.remaining ?? 0}/${quota.limit ?? 15}`;

  return (
    <div className="pf">
      <div className="pf-banner" aria-hidden="true" />

      <header className="wrap-wide pf-header">
        <div className="pf-identity">
          <div className="pf-avatar" aria-hidden="true">
            {getInitials(displayName)}
          </div>

          <div className="pf-id-main">
            <div className="pf-id-badges">
              <span className="tag tag-red">{roleLabel}</span>
              <span className="t-label">{handle}</span>
              <span className="tag">{statusNote}</span>
            </div>
            <h1 className="pf-name">{displayName}</h1>
            <p className="pf-bio">{bio}</p>
          </div>

          <div className="pf-actions">
            <button
              type="button"
              className="btn btn-line btn-sm"
              onClick={() => {
                setBioDraft(bio);
                setStatusDraft(statusNote);
                setEditingProfile((val) => !val);
              }}
            >
              {editingProfile ? 'Đóng' : 'Sửa hồ sơ'}
            </button>
            <button type="button" className="btn btn-red btn-sm" onClick={() => navigate('workspace')}>
              Workspace
            </button>
            <button type="button" className="btn btn-line btn-sm" onClick={() => navigate('settings')}>
              Cài đặt
            </button>
            {currentUser ? (
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => void logout()}>
                Đăng xuất
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setAuthModalOpen(true)}
              >
                Đăng nhập
              </button>
            )}
          </div>
        </div>

        {editingProfile && (
          <form className="pf-edit-form" onSubmit={handleSaveBio}>
            <div className="pf-edit-grid">
              <div className="pf-field">
                <label htmlFor="pf-status" className="t-label">
                  trạng thái
                </label>
                <input
                  id="pf-status"
                  type="text"
                  className="field"
                  value={statusDraft}
                  onChange={(e) => setStatusDraft(e.target.value)}
                  maxLength={40}
                />
              </div>
              <div className="pf-field pf-field-wide">
                <label htmlFor="pf-bio" className="t-label">
                  giới thiệu ngắn
                </label>
                <input
                  id="pf-bio"
                  type="text"
                  className="field"
                  value={bioDraft}
                  onChange={(e) => setBioDraft(e.target.value)}
                  maxLength={180}
                />
              </div>
            </div>
            <div className="pf-edit-actions">
              <button
                type="button"
                className="btn btn-line btn-sm"
                onClick={() => setEditingProfile(false)}
              >
                Hủy
              </button>
              <button type="submit" className="btn btn-red btn-sm">
                Lưu
              </button>
            </div>
          </form>
        )}

        <dl className="pf-stats" aria-label="Số liệu thực">
          <div className="pf-stat">
            <dt className="t-label">Dự án</dt>
            <dd>{projects.length}</dd>
          </div>
          <div className="pf-stat">
            <dt className="t-label">Tệp mã</dt>
            <dd>{totalFilesCount}</dd>
          </div>
          <div className="pf-stat">
            <dt className="t-label">Bài viết</dt>
            <dd>{userPosts.length}</dd>
          </div>
          <div className="pf-stat">
            <dt className="t-label">Đã lưu</dt>
            <dd className="pf-stat-accent">{savedItemIds.length}</dd>
          </div>
          <div className="pf-stat">
            <dt className="t-label">Lượt AI</dt>
            <dd>{quotaStatValue}</dd>
          </div>
        </dl>
      </header>

      <section className="wrap-wide pf-body" aria-label="Nội dung hồ sơ">
        <div className="pf-tabs" role="tablist" aria-label="Mục hồ sơ">
          {PROFILE_TABS.map((tab) => {
            const selected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                className="pf-tab"
                aria-selected={selected}
                onClick={() => setActiveTab(tab.id)}
              >
                <span>{tab.label}</span>
                <span className="pf-tab-count">
                  {tab.id === 'saved'
                    ? savedEntries.length
                    : tab.id === 'projects'
                      ? projects.length
                      : tab.id === 'posts'
                        ? userPosts.length
                        : activityFeed.length}
                </span>
              </button>
            );
          })}
        </div>

        {activeTab === 'saved' && (
          <div role="tabpanel" className="pf-panel">
            {savedEntries.length === 0 ? (
              <div className="pf-empty">
                <h2 className="t-title" style={{ fontSize: 'var(--text-xl)' }}>
                  Chưa có mục đã lưu
                </h2>
                <p className="t-lead" style={{ fontSize: 'var(--text-sm)' }}>
                  Lưu mẫu giao diện từ Khám phá, kho mã nguồn hoặc bài thảo luận từ Tri thức để mở nhanh tại đây.
                </p>
                <div className="pf-empty-actions">
                  <button type="button" className="btn btn-red btn-sm" onClick={() => navigate('explore')}>
                    Khám phá
                  </button>
                  <button type="button" className="btn btn-line btn-sm" onClick={() => navigate('community')}>
                    Tri thức
                  </button>
                </div>
              </div>
            ) : (
              <ul className="pf-grid">
                {savedEntries.map((item) => {
                  const preview = item.previewId ? previewFor(item.previewId) : null;
                  return (
                    <li key={item.id} className="pf-item-card">
                      {preview && (
                        <div className="pf-item-media">
                          <Media preview={preview} title={item.title} />
                        </div>
                      )}
                      <div className="pf-item-head">
                        <span className="tag">{item.sourceLabel}</span>
                        <span className="t-label">{item.subtitle}</span>
                      </div>
                      <h3 className="pf-item-title">{item.title}</h3>
                      <p className="pf-item-desc">{item.summary}</p>
                      <div className="pf-item-actions">
                        {item.communityPost && (
                          <button
                            type="button"
                            className="btn btn-red btn-sm"
                            onClick={() => openCommunityThread(item.communityPost!.id)}
                          >
                            Mở bài
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn btn-solid btn-sm"
                          onClick={() => {
                            if (item.communityPost) {
                              forkPostToWorkspace(item.communityPost);
                            } else if (item.context) {
                              openInWorkspace(item.context);
                            }
                          }}
                        >
                          Workspace
                        </button>
                        <button
                          type="button"
                          className="btn btn-line btn-sm"
                          onClick={() => toggleSavedItem(item.savedId)}
                        >
                          Bỏ lưu
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}

        {activeTab === 'projects' && (
          <div role="tabpanel" className="pf-panel">
            <ul className="pf-grid">
              {projects.map((proj) => {
                const isActive = proj.id === activeProject.id;
                const diffTotals = proj.diffs.reduce(
                  (acc, entry) => ({
                    added: acc.added + entry.additions,
                    removed: acc.removed + entry.deletions,
                  }),
                  { added: 0, removed: 0 }
                );
                return (
                  <li key={proj.id} className="pf-item-card" data-active={isActive ? 'true' : undefined}>
                    <div className="pf-item-head">
                      {isActive && <span className="tag tag-red">Đang mở</span>}
                      {proj.pinned && <span className="tag">Ghim</span>}
                      {proj.archived && <span className="tag">Lưu trữ</span>}
                      <time className="t-label pf-item-time" dateTime={proj.updatedAt}>
                        {formatDateTime(proj.updatedAt)}
                      </time>
                    </div>
                    <h3 className="pf-item-title">{proj.name}</h3>
                    <p className="pf-item-desc">{proj.description}</p>
                    <div className="pf-proj-metrics t-label">
                      <span>{proj.files.length} tệp</span>
                      <span>
                        +{diffTotals.added} −{diffTotals.removed}
                      </span>
                      <span>{proj.snapshots.length} mốc lưu</span>
                    </div>
                    <div className="pf-item-actions">
                      <button
                        type="button"
                        className="btn btn-solid btn-sm"
                        onClick={() => {
                          selectProject(proj.id);
                          navigate('workspace');
                        }}
                      >
                        Workspace
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {activeTab === 'posts' && (
          <div role="tabpanel" className="pf-panel">
            {userPosts.length === 0 ? (
              <div className="pf-empty">
                <h2 className="t-title" style={{ fontSize: 'var(--text-xl)' }}>
                  Chưa có bài đăng hoặc tương tác
                </h2>
                <p className="t-lead" style={{ fontSize: 'var(--text-sm)' }}>
                  {currentUser
                    ? 'Tham gia đặt câu hỏi, trình diễn hộp cát hoặc phản hồi tại mục Tri thức.'
                    : 'Đăng nhập để đồng bộ bài đăng và lịch sử phản hồi của bạn tại Tri thức.'}
                </p>
                <div className="pf-empty-actions">
                  {!currentUser && (
                    <button
                      type="button"
                      className="btn btn-red btn-sm"
                      onClick={() => setAuthModalOpen(true)}
                    >
                      Đăng nhập
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn btn-line btn-sm"
                    onClick={() => navigate('community')}
                  >
                    Tri thức
                  </button>
                </div>
              </div>
            ) : (
              <ul className="pf-list">
                {userPosts.map((post) => {
                  const replies =
                    (post.acceptedAnswer ? 1 : 0) + (post.answers?.length || post.answersCount || 0);
                  return (
                    <li key={post.id} className="pf-row-card">
                      <div className="pf-row-main">
                        <div className="pf-item-head">
                          <span className="tag">{CHANNEL_LABELS[post.channel] || post.channel}</span>
                          <span className="tag tag-red">{whiteLabelText(post.category)}</span>
                          {(post.isAccepted || post.acceptedAnswer) && (
                            <span className="tag tag-green">Đạt chuẩn</span>
                          )}
                          <time className="t-label" dateTime={post.createdAt}>
                            {formatDateTime(post.createdAt)}
                          </time>
                        </div>
                        <h3 className="pf-item-title">{whiteLabelText(post.title)}</h3>
                        <p className="t-label">
                          {post.votes ?? post.likes ?? 0} tán thành · {replies} phản hồi
                        </p>
                      </div>
                      <button
                        type="button"
                        className="btn btn-line btn-sm"
                        onClick={() => openCommunityThread(post.id)}
                      >
                        Mở bài
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}

        {activeTab === 'activity' && (
          <div role="tabpanel" className="pf-panel">
            {activityFeed.length === 0 ? (
              <div className="pf-empty">
                <p className="t-lead" style={{ fontSize: 'var(--text-sm)' }}>
                  Chưa ghi nhận hoạt động nào trong phiên này.
                </p>
              </div>
            ) : (
              <ol className="pf-timeline">
                {activityFeed.map((act) => (
                  <li key={act.id} className="pf-tl-item">
                    <span className="tag">{act.kindLabel}</span>
                    <div className="pf-tl-body">
                      <span className="pf-tl-title">{act.title}</span>
                      <span className="t-label">{act.detail}</span>
                    </div>
                    <time className="t-label pf-tl-time" dateTime={act.timestamp}>
                      {formatDateTime(act.timestamp)}
                    </time>
                    {act.projectId && (
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => {
                          selectProject(act.projectId!);
                          navigate('workspace');
                        }}
                      >
                        Workspace
                      </button>
                    )}
                    {act.communityPostId && (
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => openCommunityThread(act.communityPostId!)}
                      >
                        Mở bài
                      </button>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </div>
        )}
      </section>
    </div>
  );
};

export default ProfileView;
