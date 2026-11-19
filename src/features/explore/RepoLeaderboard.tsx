import React, { useMemo, useState } from 'react';
import {
  Bookmark,
  BookmarkCheck,
  Check,
  Copy,
  ExternalLink,
} from 'lucide-react';
import repoLeaderboardJson from '../../data/repoLeaderboard.json';
import { BROAMSTUCK_REPOS } from '../../data/realShowcaseData';
import type { ResourceItem } from '../../types/index';
import { useAppStore } from '../../store/appStore';

export interface RepoLeaderboardItem {
  id: string;
  fullName: string;
  name: string;
  owner: string;
  category: string;
  htmlUrl: string;
  description: string;
  stars: number;
  forks: number;
  language: string;
  license: string;
  pushedAt: string;
  topics: string[];
  aiNote: string;
}

export interface RepoLeaderboardDataset {
  generatedAt: string;
  source: string;
  items: RepoLeaderboardItem[];
}

interface RepoLeaderboardProps {
  searchQuery: string;
  onResetSearch?: () => void;
  onOpenGitHubShowcase?: () => void;
}

type LeaderboardSort = 'stars' | 'forks' | 'recent';

const LEADERBOARD_DATA = repoLeaderboardJson as RepoLeaderboardDataset;

const CATEGORY_OPTIONS = [
  { id: 'all', label: 'Tất cả' },
  { id: 'Skills, Rules & Prompts', label: 'Skills' },
  { id: 'AI Agents & CLI', label: 'Agents' },
  { id: 'UI/UX & Motion', label: 'UI/UX' },
  { id: 'Local LLM & DevTools', label: 'Local LLM' },
];

const CATEGORY_ORDER = [
  'Skills, Rules & Prompts',
  'AI Agents & CLI',
  'UI/UX & Motion',
  'Local LLM & DevTools',
];

function formatNumber(value: number): string {
  return new Intl.NumberFormat('vi-VN').format(value);
}

function formatDateIso(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return iso.slice(0, 10);
  return parsed.toISOString().slice(0, 10);
}

function adaptRepoToResource(repo: RepoLeaderboardItem): ResourceItem {
  const normalizedGroup =
    repo.category === 'UI/UX & Motion'
      ? 'UI/UX'
      : repo.category === 'Skills, Rules & Prompts'
        ? 'Skills & Rules'
        : repo.category === 'AI Agents & CLI'
          ? 'AI Tools'
          : 'GitHub Repositories';

  return {
    id: `repo-${repo.id}`,
    title: repo.fullName,
    group: normalizedGroup,
    category: repo.category,
    tags: [
      'platform:GitHub',
      `tech:${repo.language || 'OpenSource'}`,
      'cost:Free',
      ...repo.topics.slice(0, 4),
    ],
    officialUrl: repo.htmlUrl,
    license: repo.license || 'Open Source',
    compatibility: repo.language || 'Cross-platform',
    lastVerified: formatDateIso(LEADERBOARD_DATA.generatedAt),
    status: 'verified_tested',
    description: `${repo.description} ${repo.aiNote}`.trim(),
    snippet: `GitHub Repository: ${repo.fullName}\nURL: ${repo.htmlUrl}\nStars: ${repo.stars} | Forks: ${repo.forks} | License: ${repo.license}\nSummary: ${repo.description}\nEngineering Note: ${repo.aiNote}`,
  };
}

export const RepoLeaderboard: React.FC<RepoLeaderboardProps> = ({
  searchQuery,
  onResetSearch,
  onOpenGitHubShowcase,
}) => {
  const { savedItemIds, toggleSavedItem, attachItemToWorkspace, addToast } = useAppStore();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<LeaderboardSort>('stars');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredRepos = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const matched = LEADERBOARD_DATA.items.filter((repo) => {
      if (selectedCategory !== 'all' && repo.category !== selectedCategory) return false;
      if (!q) return true;
      return (
        repo.fullName.toLowerCase().includes(q) ||
        repo.description.toLowerCase().includes(q) ||
        repo.aiNote.toLowerCase().includes(q) ||
        repo.category.toLowerCase().includes(q) ||
        repo.language.toLowerCase().includes(q) ||
        repo.topics.some((topic) => topic.toLowerCase().includes(q))
      );
    });

    const sorted = [...matched];
    if (sortBy === 'forks') {
      sorted.sort((a, b) => b.forks - a.forks);
    } else if (sortBy === 'recent') {
      sorted.sort((a, b) => new Date(b.pushedAt).getTime() - new Date(a.pushedAt).getTime());
    } else {
      sorted.sort((a, b) => b.stars - a.stars);
    }
    return sorted;
  }, [selectedCategory, sortBy, searchQuery]);

  const handleCopyUrl = async (id: string, fullName: string, htmlUrl: string) => {
    try {
      await navigator.clipboard.writeText(htmlUrl);
      setCopiedId(id);
      addToast({
        type: 'success',
        title: 'Đã sao chép liên kết',
        message: fullName,
      });
      window.setTimeout(() => {
        setCopiedId((prev) => (prev === id ? null : prev));
      }, 1800);
    } catch {
      addToast({
        type: 'warning',
        title: 'Không thể sao chép tự động',
        message: htmlUrl,
      });
    }
  };

  const handleUseInProject = (repo: RepoLeaderboardItem) => {
    const resource = adaptRepoToResource(repo);
    attachItemToWorkspace(
      {
        id: resource.id,
        kind: 'resource',
        title: resource.title,
        summary: resource.description,
        payload: resource.snippet,
        tags: resource.tags,
      },
      true
    );
  };

  const handleResetAll = () => {
    setSelectedCategory('all');
    setSortBy('stars');
    if (onResetSearch) onResetSearch();
  };

  const topOne = filteredRepos[0] || null;
  const podiumRunners = filteredRepos.slice(1, 3);
  const rankMap = useMemo(() => {
    const map = new Map<string, number>();
    filteredRepos.forEach((item, index) => map.set(item.id, index + 1));
    return map;
  }, [filteredRepos]);

  const categoryRibbons = useMemo(() => {
    const remaining = filteredRepos.slice(3);
    const categories = selectedCategory === 'all' ? CATEGORY_ORDER : [selectedCategory];
    return categories
      .map((cat) => ({
        category: cat,
        items: remaining.filter((item) => item.category === cat),
      }))
      .filter((group) => group.items.length > 0);
  }, [filteredRepos, selectedCategory]);

  return (
    <section aria-label="Bảng xếp hạng Kho lưu trữ" className="space-y-10">
      <div
        className="flex flex-col gap-4 rounded-[22px] border p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        <div className="flex flex-wrap items-center gap-2">
          {CATEGORY_OPTIONS.map((opt) => {
            const active = selectedCategory === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setSelectedCategory(opt.id)}
                className="rounded-full border px-3.5 py-1.5 text-xs font-medium cursor-pointer transition-colors"
                style={{
                  backgroundColor: active ? 'var(--accent-primary)' : 'var(--bg-panel)',
                  borderColor: active ? 'var(--accent-primary)' : 'var(--border-subtle)',
                  color: active ? 'var(--ink-inverse)' : 'var(--ink-secondary)',
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[11px]" style={{ color: 'var(--ink-muted)' }}>
            {filteredRepos.length} / {LEADERBOARD_DATA.items.length} kho · {formatDateIso(LEADERBOARD_DATA.generatedAt)}
          </span>
          {(
            [
              { id: 'stars', label: 'Số sao' },
              { id: 'forks', label: 'Nhánh' },
              { id: 'recent', label: 'Mới nhất' },
            ] as const
          ).map((opt) => {
            const active = sortBy === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setSortBy(opt.id)}
                className="rounded-full border px-3.5 py-1.5 text-xs font-medium cursor-pointer transition-colors"
                style={{
                  backgroundColor: active ? 'var(--accent-verdigris-soft)' : 'var(--bg-panel)',
                  borderColor: active ? 'var(--accent-verdigris)' : 'var(--border-subtle)',
                  color: active ? 'var(--accent-verdigris)' : 'var(--ink-secondary)',
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {filteredRepos.length === 0 ? (
        <div
          className="rounded-[24px] border p-12 text-center space-y-3"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <p className="text-lg font-semibold" style={{ fontFamily: 'var(--font-serif)', color: 'var(--ink-primary)' }}>
            Không tìm thấy kho lưu trữ phù hợp
          </p>
          <p className="text-sm" style={{ color: 'var(--ink-secondary)' }}>
            Điều chỉnh danh mục hoặc xóa từ khóa tìm kiếm để khôi phục bảng xếp hạng.
          </p>
          <button
            type="button"
            onClick={handleResetAll}
            className="h-10 rounded-full px-5 text-xs font-semibold cursor-pointer"
            style={{
              backgroundColor: 'var(--accent-primary)',
              color: 'var(--ink-inverse)',
            }}
          >
            Đặt lại
          </button>
        </div>
      ) : (
        <>
          {topOne ? (
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
              <article
                className="lg:col-span-7 flex flex-col justify-between gap-6 rounded-[26px] border p-6 sm:p-8"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-accent)',
                  boxShadow: 'var(--shadow-md)',
                }}
              >
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span
                        className="text-3xl font-semibold leading-none"
                        style={{ fontFamily: 'var(--font-serif)', color: 'var(--accent-primary)' }}
                      >
                        #01
                      </span>
                      <span className="font-mono text-xs" style={{ color: 'var(--ink-muted)' }}>
                        {topOne.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 font-mono text-xs">
                      <span style={{ color: 'var(--accent-primary)' }}>{formatNumber(topOne.stars)} sao</span>
                      <span style={{ color: 'var(--ink-secondary)' }}>{formatNumber(topOne.forks)} nhánh</span>
                    </div>
                  </div>

                  <h3
                    className="text-2xl font-semibold tracking-tight break-words sm:text-3xl"
                    style={{ fontFamily: 'var(--font-serif)', color: 'var(--ink-primary)' }}
                  >
                    {topOne.fullName}
                  </h3>

                  <p className="text-[15px] leading-relaxed" style={{ color: 'var(--ink-secondary)' }}>
                    {topOne.description}
                  </p>

                  <div
                    className="rounded-[16px] border p-4 text-xs leading-relaxed"
                    style={{
                      backgroundColor: 'var(--bg-panel)',
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--ink-primary)',
                    }}
                  >
                    {topOne.aiNote}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-3 font-mono text-[11px]" style={{ color: 'var(--ink-muted)' }}>
                    <span>{topOne.language}</span>
                    <span>{topOne.license}</span>
                    <span>{formatDateIso(topOne.pushedAt)}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 border-t pt-4" style={{ borderColor: 'var(--border-subtle)' }}>
                    <button
                      type="button"
                      onClick={() => handleUseInProject(topOne)}
                      className="h-10 rounded-full px-5 text-xs font-semibold cursor-pointer"
                      style={{
                        backgroundColor: 'var(--accent-primary)',
                        color: 'var(--ink-inverse)',
                      }}
                    >
                      Workspace
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleSavedItem(`repo-${topOne.id}`)}
                      aria-label={savedItemIds.includes(`repo-${topOne.id}`) ? `Bỏ lưu ${topOne.fullName}` : `Lưu ${topOne.fullName}`}
                      title={savedItemIds.includes(`repo-${topOne.id}`) ? 'Bỏ lưu' : 'Lưu'}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border cursor-pointer"
                      style={{
                        backgroundColor: 'var(--bg-panel)',
                        borderColor: savedItemIds.includes(`repo-${topOne.id}`) ? 'var(--accent-jade)' : 'var(--border-subtle)',
                        color: savedItemIds.includes(`repo-${topOne.id}`) ? 'var(--accent-jade)' : 'var(--ink-secondary)',
                      }}
                    >
                      {savedItemIds.includes(`repo-${topOne.id}`) ? (
                        <BookmarkCheck className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        <Bookmark className="h-4 w-4" aria-hidden="true" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => void handleCopyUrl(topOne.id, topOne.fullName, topOne.htmlUrl)}
                      aria-label={`Sao chép liên kết ${topOne.fullName}`}
                      title="Sao chép liên kết"
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border cursor-pointer"
                      style={{
                        backgroundColor: 'var(--bg-panel)',
                        borderColor: 'var(--border-subtle)',
                        color: copiedId === topOne.id ? 'var(--accent-jade)' : 'var(--ink-secondary)',
                      }}
                    >
                      {copiedId === topOne.id ? (
                        <Check className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        <Copy className="h-4 w-4" aria-hidden="true" />
                      )}
                    </button>

                    <a
                      href={topOne.htmlUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Mở ${topOne.fullName} trên GitHub`}
                      title="Mở trên GitHub"
                      className="ml-auto inline-flex h-10 w-10 items-center justify-center rounded-full border"
                      style={{
                        backgroundColor: 'var(--bg-panel)',
                        borderColor: 'var(--border-subtle)',
                        color: 'var(--accent-verdigris)',
                      }}
                    >
                      <ExternalLink className="h-4 w-4" aria-hidden="true" />
                    </a>
                  </div>
                </div>
              </article>

              <div className="lg:col-span-5 flex flex-col gap-5">
                {podiumRunners.map((repo, idx) => {
                  const rankNum = idx + 2;
                  const savedKey = `repo-${repo.id}`;
                  const isSaved = savedItemIds.includes(savedKey);
                  return (
                    <article
                      key={repo.id}
                      className="flex flex-1 flex-col justify-between gap-4 rounded-[24px] border p-5 sm:p-6"
                      style={{
                        backgroundColor: 'var(--bg-surface)',
                        borderColor: 'var(--border-strong)',
                      }}
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <span
                              className="text-xl font-semibold leading-none"
                              style={{
                                fontFamily: 'var(--font-serif)',
                                color: rankNum === 2 ? 'var(--accent-verdigris)' : 'var(--accent-copper)',
                              }}
                            >
                              #0{rankNum}
                            </span>
                            <span className="font-mono text-[11px]" style={{ color: 'var(--ink-muted)' }}>
                              {repo.language}
                            </span>
                          </div>
                          <span className="font-mono text-xs" style={{ color: 'var(--accent-primary)' }}>
                            {formatNumber(repo.stars)} sao
                          </span>
                        </div>

                        <h4
                          className="break-words text-lg font-semibold"
                          style={{ fontFamily: 'var(--font-display)', color: 'var(--ink-primary)' }}
                        >
                          {repo.fullName}
                        </h4>
                        <p className="line-clamp-2 text-[13px] leading-relaxed" style={{ color: 'var(--ink-secondary)' }}>
                          {repo.description}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 border-t pt-3" style={{ borderColor: 'var(--border-subtle)' }}>
                        <button
                          type="button"
                          onClick={() => handleUseInProject(repo)}
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
                          onClick={() => toggleSavedItem(savedKey)}
                          aria-label={isSaved ? `Bỏ lưu ${repo.fullName}` : `Lưu ${repo.fullName}`}
                          title={isSaved ? 'Bỏ lưu' : 'Lưu'}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full border cursor-pointer"
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
                        <button
                          type="button"
                          onClick={() => void handleCopyUrl(repo.id, repo.fullName, repo.htmlUrl)}
                          aria-label={`Sao chép liên kết ${repo.fullName}`}
                          title="Sao chép liên kết"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full border cursor-pointer"
                          style={{
                            backgroundColor: 'var(--bg-panel)',
                            borderColor: 'var(--border-subtle)',
                            color: copiedId === repo.id ? 'var(--accent-jade)' : 'var(--ink-secondary)',
                          }}
                        >
                          {copiedId === repo.id ? (
                            <Check className="h-3.5 w-3.5" aria-hidden="true" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                          )}
                        </button>
                        <a
                          href={repo.htmlUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Mở ${repo.fullName} trên GitHub`}
                          title="Mở trên GitHub"
                          className="ml-auto inline-flex h-9 w-9 items-center justify-center rounded-full border"
                          style={{
                            backgroundColor: 'var(--bg-panel)',
                            borderColor: 'var(--border-subtle)',
                            color: 'var(--accent-verdigris)',
                          }}
                        >
                          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                        </a>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          ) : null}

          <div className="space-y-4">
            <div className="flex items-end justify-between gap-4 border-b pb-3" style={{ borderColor: 'var(--border-subtle)' }}>
              <div>
                <span className="font-mono text-[11px]" style={{ color: 'var(--accent-primary)' }}>
                  TÂM ĐIỂM BROAMSTUCK-CYBR
                </span>
                <h3
                  className="mt-0.5 text-xl font-semibold"
                  style={{ fontFamily: 'var(--font-serif)', color: 'var(--ink-primary)' }}
                >
                  Kho lưu trữ Nền tảng F-Forum
                </h3>
              </div>
              {onOpenGitHubShowcase ? (
                <button
                  type="button"
                  onClick={onOpenGitHubShowcase}
                  className="rounded-full border px-4 py-1.5 text-xs font-medium cursor-pointer"
                  style={{
                    backgroundColor: 'var(--bg-panel)',
                    borderColor: 'var(--border-accent)',
                    color: 'var(--accent-primary)',
                  }}
                >
                  Mở GitHub
                </button>
              ) : null}
            </div>

            <div className="flex gap-5 overflow-x-auto pb-4 snap-x ff-scrollbar">
              {BROAMSTUCK_REPOS.map((repo) => {
                const isSaved = savedItemIds.includes(repo.id);
                return (
                  <article
                    key={repo.id}
                    className="min-w-[300px] max-w-[330px] shrink-0 snap-start rounded-[22px] border p-5 flex flex-col justify-between gap-4"
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      borderColor: 'var(--border-subtle)',
                    }}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2 font-mono text-[11px]">
                        <span style={{ color: 'var(--accent-primary)' }}>{repo.language}</span>
                        <span style={{ color: 'var(--ink-muted)' }}>{repo.stars} sao</span>
                      </div>
                      <h4 className="truncate text-base font-semibold" style={{ color: 'var(--ink-primary)' }}>
                        {repo.name}
                      </h4>
                      <p className="line-clamp-2 text-[13px] leading-relaxed" style={{ color: 'var(--ink-secondary)' }}>
                        {repo.summaryVi}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 border-t pt-3" style={{ borderColor: 'var(--border-subtle)' }}>
                      <button
                        type="button"
                        onClick={() =>
                          attachItemToWorkspace(
                            {
                              id: repo.id,
                              kind: 'blueprint',
                              title: repo.fullName,
                              summary: repo.summaryVi,
                              payload: `${repo.htmlUrl}\n${repo.keyPaths.join(', ')}`,
                              tags: [repo.language, 'broamstuck-cybr'],
                            },
                            true
                          )
                        }
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
                        onClick={() => toggleSavedItem(repo.id)}
                        aria-label={isSaved ? `Bỏ lưu ${repo.name}` : `Lưu ${repo.name}`}
                        title={isSaved ? 'Bỏ lưu' : 'Lưu'}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border cursor-pointer"
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
                      <a
                        href={repo.htmlUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Mở ${repo.fullName} trên GitHub`}
                        title="Mở trên GitHub"
                        className="ml-auto inline-flex h-9 w-9 items-center justify-center rounded-full border"
                        style={{
                          backgroundColor: 'var(--bg-panel)',
                          borderColor: 'var(--border-subtle)',
                          color: 'var(--accent-verdigris)',
                        }}
                      >
                        <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                      </a>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

          {categoryRibbons.map((group) => (
            <div key={group.category} className="space-y-4">
              <div className="flex items-end justify-between gap-4 border-b pb-3" style={{ borderColor: 'var(--border-subtle)' }}>
                <h3
                  className="text-xl font-semibold"
                  style={{ fontFamily: 'var(--font-serif)', color: 'var(--ink-primary)' }}
                >
                  {group.category}
                </h3>
                <span className="font-mono text-xs" style={{ color: 'var(--ink-muted)' }}>
                  {group.items.length} kho
                </span>
              </div>

              <div className="flex gap-5 overflow-x-auto pb-4 snap-x ff-scrollbar">
                {group.items.map((repo) => {
                  const rank = rankMap.get(repo.id) ?? 4;
                  const rankLabel = `#${String(rank).padStart(2, '0')}`;
                  const savedKey = `repo-${repo.id}`;
                  const isSaved = savedItemIds.includes(savedKey);
                  return (
                    <article
                      key={repo.id}
                      className="min-w-[310px] max-w-[345px] shrink-0 snap-start rounded-[22px] border p-5 flex flex-col justify-between gap-4"
                      style={{
                        backgroundColor: 'var(--bg-surface)',
                        borderColor: 'var(--border-subtle)',
                      }}
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between gap-2 font-mono text-xs">
                          <span style={{ color: 'var(--accent-primary)' }}>{rankLabel}</span>
                          <span style={{ color: 'var(--ink-secondary)' }}>
                            {formatNumber(repo.stars)} sao · {repo.language}
                          </span>
                        </div>
                        <h4
                          className="truncate text-base font-semibold"
                          style={{ fontFamily: 'var(--font-display)', color: 'var(--ink-primary)' }}
                        >
                          {repo.fullName}
                        </h4>
                        <p className="line-clamp-2 text-[13px] leading-relaxed" style={{ color: 'var(--ink-secondary)' }}>
                          {repo.description}
                        </p>
                        <p className="line-clamp-2 text-xs" style={{ color: 'var(--ink-muted)' }}>
                          {repo.aiNote}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 border-t pt-3" style={{ borderColor: 'var(--border-subtle)' }}>
                        <button
                          type="button"
                          onClick={() => handleUseInProject(repo)}
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
                          onClick={() => toggleSavedItem(savedKey)}
                          aria-label={isSaved ? `Bỏ lưu ${repo.fullName}` : `Lưu ${repo.fullName}`}
                          title={isSaved ? 'Bỏ lưu' : 'Lưu'}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full border cursor-pointer"
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
                        <button
                          type="button"
                          onClick={() => void handleCopyUrl(repo.id, repo.fullName, repo.htmlUrl)}
                          aria-label={`Sao chép liên kết ${repo.fullName}`}
                          title="Sao chép liên kết"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full border cursor-pointer"
                          style={{
                            backgroundColor: 'var(--bg-panel)',
                            borderColor: 'var(--border-subtle)',
                            color: copiedId === repo.id ? 'var(--accent-jade)' : 'var(--ink-secondary)',
                          }}
                        >
                          {copiedId === repo.id ? (
                            <Check className="h-3.5 w-3.5" aria-hidden="true" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                          )}
                        </button>
                        <a
                          href={repo.htmlUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Mở ${repo.fullName} trên GitHub`}
                          title="Mở trên GitHub"
                          className="ml-auto inline-flex h-9 w-9 items-center justify-center rounded-full border"
                          style={{
                            backgroundColor: 'var(--bg-panel)',
                            borderColor: 'var(--border-subtle)',
                            color: 'var(--accent-verdigris)',
                          }}
                        >
                          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                        </a>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          ))}
        </>
      )}
    </section>
  );
};

export default RepoLeaderboard;
