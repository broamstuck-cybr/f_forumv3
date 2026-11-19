import React, { useMemo, useState } from 'react';
import {
  Bookmark,
  BookmarkCheck,
  Check,
  Clock,
  Copy,
  ExternalLink,
  GitFork,
  RotateCcw,
  ShieldCheck,
  Star,
  Terminal,
  Trophy,
} from 'lucide-react';
import repoLeaderboardJson from '../../data/repoLeaderboard.json';
import type { ResourceItem } from '../../types/index';
import { useAppStore } from '../../store/appStore';
import { Chips } from '../../components/pinui';

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
}

type LeaderboardSort = 'stars' | 'forks' | 'recent';

const LEADERBOARD_DATA = repoLeaderboardJson as RepoLeaderboardDataset;

const CATEGORY_OPTIONS = [
  { id: 'all', label: 'Tất cả' },
  { id: 'Skills, Rules & Prompts', label: 'Skills, Rules & Prompts' },
  { id: 'AI Agents & CLI', label: 'AI Agents & CLI' },
  { id: 'UI/UX & Motion', label: 'UI/UX & Motion' },
  { id: 'Local LLM & DevTools', label: 'Local LLM & DevTools' },
];

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
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
      `platform:GitHub`,
      `tech:${repo.language || 'OpenSource'}`,
      `cost:Free`,
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

  const handleCategoryToggle = (id: string) => {
    setSelectedCategory(id);
  };

  const handleCopyUrl = async (repo: RepoLeaderboardItem) => {
    try {
      await navigator.clipboard.writeText(repo.htmlUrl);
      setCopiedId(repo.id);
      addToast({
        type: 'success',
        title: 'Đã sao chép Repo URL',
        message: repo.fullName,
      });
      window.setTimeout(() => {
        setCopiedId((prev) => (prev === repo.id ? null : prev));
      }, 1800);
    } catch {
      addToast({
        type: 'warning',
        title: 'Không thể sao chép tự động',
        message: repo.htmlUrl,
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
  const ledgerRepos = filteredRepos.slice(3);

  return (
    <section aria-label="Bảng Xếp Hạng Repo và Skills" className="space-y-6">
      <div
        className="flex flex-col gap-3 overflow-hidden rounded-[20px] border px-5 py-4 lg:flex-row lg:items-center lg:justify-between"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-strong)',
        }}
      >
        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-semibold"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--accent-jade) 15%, transparent)',
              color: 'var(--accent-jade)',
            }}
          >
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Open-source community index / Verified via GitHub API</span>
          </span>
          <span
            className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono"
            style={{
              backgroundColor: 'var(--bg-panel)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--ink-secondary)',
            }}
          >
            <Clock className="h-3 w-3" aria-hidden="true" />
            <span>Cập nhật: {formatDateIso(LEADERBOARD_DATA.generatedAt)}</span>
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span
            className="rounded-full border px-3 py-1 font-mono font-semibold"
            style={{
              backgroundColor: 'var(--bg-panel)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--accent-primary)',
            }}
          >
            {LEADERBOARD_DATA.items.length} repo đã xác minh
          </span>
          <span className="font-mono" style={{ color: 'var(--ink-muted)' }}>
            Hiển thị {filteredRepos.length} kết quả
          </span>
        </div>
      </div>

      <div
        className="flex flex-col gap-3 rounded-[20px] border p-4 xl:flex-row xl:items-center xl:justify-between"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        <div className="min-w-0 flex-1">
          <Chips
            items={CATEGORY_OPTIONS}
            selectedIds={[selectedCategory]}
            onToggle={handleCategoryToggle}
            multi={false}
          />
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <span className="text-xs font-medium" style={{ color: 'var(--ink-muted)' }}>
            Xếp theo:
          </span>
          {(
            [
              { id: 'stars', label: 'Real Stars' },
              { id: 'forks', label: 'Forks' },
              { id: 'recent', label: 'Mới cập nhật' },
            ] as const
          ).map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setSortBy(opt.id)}
              className="rounded-full border px-3.5 py-1.5 text-xs font-semibold focus-visible:outline-2 focus-visible:outline-offset-2"
              style={{
                backgroundColor:
                  sortBy === opt.id
                    ? 'color-mix(in srgb, var(--accent-verdigris) 16%, transparent)'
                    : 'var(--bg-panel)',
                borderColor: sortBy === opt.id ? 'var(--accent-verdigris)' : 'var(--border-subtle)',
                color: sortBy === opt.id ? 'var(--accent-verdigris)' : 'var(--ink-secondary)',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {filteredRepos.length === 0 ? (
        <div
          className="rounded-[24px] border p-12 text-center"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <p className="text-base font-semibold" style={{ color: 'var(--ink-primary)' }}>
            Không tìm thấy repository nào khớp điều kiện lọc
          </p>
          <p className="mt-1 text-sm" style={{ color: 'var(--ink-secondary)' }}>
            Thử chuyển danh mục hoặc đặt lại từ khóa tìm kiếm trong thanh lệnh.
          </p>
          <button
            type="button"
            onClick={handleResetAll}
            className="mt-4 inline-flex h-10 items-center gap-2 rounded-full px-5 text-xs font-semibold"
            style={{
              backgroundColor: 'var(--accent-primary)',
              color: '#06080d',
            }}
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Xem toàn bộ {LEADERBOARD_DATA.items.length} repo</span>
          </button>
        </div>
      ) : (
        <>
          {topOne ? (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.38fr)_minmax(0,1fr)]">
              <article
                className="flex flex-col justify-between gap-6 overflow-hidden rounded-[24px] border p-6 sm:p-7"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--accent-primary)',
                  boxShadow: '0 22px 52px -32px rgba(0, 0, 0, 0.65)',
                }}
              >
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-xs font-bold"
                        style={{
                          backgroundColor: 'var(--accent-primary)',
                          color: '#06080d',
                        }}
                      >
                        <Trophy className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>#01</span>
                      </span>
                      <span
                        className="rounded-full px-2.5 py-1 text-xs font-medium"
                        style={{
                          backgroundColor: 'var(--bg-panel)',
                          color: 'var(--ink-secondary)',
                        }}
                      >
                        {topOne.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 font-mono text-xs font-semibold">
                      <span className="inline-flex items-center gap-1" style={{ color: 'var(--accent-primary)' }}>
                        <Star className="h-3.5 w-3.5" aria-hidden="true" />
                        {formatNumber(topOne.stars)}
                      </span>
                      <span className="inline-flex items-center gap-1" style={{ color: 'var(--ink-secondary)' }}>
                        <GitFork className="h-3.5 w-3.5" aria-hidden="true" />
                        {formatNumber(topOne.forks)}
                      </span>
                    </div>
                  </div>

                  <h2
                    className="mt-4 break-words font-mono text-xl font-semibold tracking-tight sm:text-2xl"
                    style={{ color: 'var(--ink-primary)' }}
                  >
                    {topOne.fullName}
                  </h2>

                  <p className="mt-2.5 text-sm leading-relaxed" style={{ color: 'var(--ink-secondary)' }}>
                    {topOne.description}
                  </p>

                  <div
                    className="mt-4 rounded-[16px] border p-3.5 text-xs leading-relaxed"
                    style={{
                      backgroundColor: 'var(--bg-panel)',
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--ink-primary)',
                    }}
                  >
                    <span className="font-mono text-[11px] font-semibold" style={{ color: 'var(--accent-verdigris)' }}>
                      Engineering Note:
                    </span>{' '}
                    {topOne.aiNote}
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-1.5">
                    <span
                      className="rounded-full border px-2.5 py-0.5 font-mono text-[11px] font-medium"
                      style={{
                        backgroundColor: 'var(--bg-panel)',
                        borderColor: 'var(--border-subtle)',
                        color: 'var(--ink-primary)',
                      }}
                    >
                      {topOne.language}
                    </span>
                    <span
                      className="rounded-full border px-2.5 py-0.5 font-mono text-[11px]"
                      style={{
                        borderColor: 'var(--border-subtle)',
                        color: 'var(--ink-muted)',
                      }}
                    >
                      {topOne.license}
                    </span>
                    <span
                      className="rounded-full border px-2.5 py-0.5 font-mono text-[11px]"
                      style={{
                        borderColor: 'var(--border-subtle)',
                        color: 'var(--ink-muted)',
                      }}
                    >
                      Push: {formatDateIso(topOne.pushedAt)}
                    </span>
                    {topOne.topics.slice(0, 5).map((topic) => (
                      <span
                        key={topic}
                        className="rounded-full border px-2 py-0.5 font-mono text-[11px]"
                        style={{
                          borderColor: 'var(--border-subtle)',
                          color: 'var(--ink-secondary)',
                        }}
                      >
                        #{topic}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-auto space-y-4">
                  <div
                    className="rounded-[18px] border p-4"
                    style={{
                      backgroundColor: 'var(--bg-panel)',
                      borderColor: 'var(--border-subtle)',
                    }}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="font-mono text-[11px] font-semibold" style={{ color: 'var(--ink-secondary)' }}>
                        TELEMETRY & SIGNAL RATIO
                      </span>
                      <span className="font-mono text-xs font-semibold" style={{ color: 'var(--accent-jade)' }}>
                        Tỷ lệ Stars / Forks: {Math.max(1, Math.round(topOne.stars / Math.max(1, topOne.forks)))}:1
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2.5">
                      <div
                        className="min-w-[110px] flex-[1.2_1_110px] rounded-[12px] border px-3 py-2"
                        style={{
                          backgroundColor: 'var(--bg-surface)',
                          borderColor: 'var(--border-subtle)',
                        }}
                      >
                        <span className="block text-[11px]" style={{ color: 'var(--ink-muted)' }}>
                          Real Stars
                        </span>
                        <strong className="mt-0.5 block font-mono text-sm" style={{ color: 'var(--accent-primary)' }}>
                          {formatNumber(topOne.stars)}
                        </strong>
                      </div>
                      <div
                        className="min-w-[100px] flex-[1_1_100px] rounded-[12px] border px-3 py-2"
                        style={{
                          backgroundColor: 'var(--bg-surface)',
                          borderColor: 'var(--border-subtle)',
                        }}
                      >
                        <span className="block text-[11px]" style={{ color: 'var(--ink-muted)' }}>
                          Active Forks
                        </span>
                        <strong className="mt-0.5 block font-mono text-sm" style={{ color: 'var(--ink-primary)' }}>
                          {formatNumber(topOne.forks)}
                        </strong>
                      </div>
                      <div
                        className="min-w-[110px] flex-[1.1_1_110px] rounded-[12px] border px-3 py-2"
                        style={{
                          backgroundColor: 'var(--bg-surface)',
                          borderColor: 'var(--border-subtle)',
                        }}
                      >
                        <span className="block text-[11px]" style={{ color: 'var(--ink-muted)' }}>
                          Ngôn ngữ chính
                        </span>
                        <strong className="mt-0.5 block truncate font-mono text-sm" style={{ color: 'var(--accent-verdigris)' }}>
                          {topOne.language}
                        </strong>
                      </div>
                      <div
                        className="min-w-[100px] flex-[1_1_100px] rounded-[12px] border px-3 py-2"
                        style={{
                          backgroundColor: 'var(--bg-surface)',
                          borderColor: 'var(--border-subtle)',
                        }}
                      >
                        <span className="block text-[11px]" style={{ color: 'var(--ink-muted)' }}>
                          Giấy phép
                        </span>
                        <strong className="mt-0.5 block truncate font-mono text-sm" style={{ color: 'var(--ink-primary)' }}>
                          {topOne.license}
                        </strong>
                      </div>
                    </div>

                    <div className="mt-3 space-y-1.5">
                      <div className="flex items-center justify-between font-mono text-[11px]" style={{ color: 'var(--ink-muted)' }}>
                        <span>Chỉ số dẫn đầu danh mục ({topOne.category})</span>
                        <span style={{ color: 'var(--ink-primary)' }}>100% Verified Benchmark</span>
                      </div>
                      <div
                        className="h-2 w-full overflow-hidden rounded-full"
                        style={{ backgroundColor: 'var(--bg-surface)' }}
                      >
                        <div
                          className="h-full w-full rounded-full"
                          style={{
                            background: 'linear-gradient(90deg, var(--accent-primary), var(--accent-verdigris))',
                            transform: 'scaleX(0.94)',
                            transformOrigin: 'left center',
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 border-t pt-4" style={{ borderColor: 'var(--border-subtle)' }}>
                    <button
                      type="button"
                      onClick={() => handleUseInProject(topOne)}
                      className="inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-xs font-semibold focus-visible:outline-2 focus-visible:outline-offset-2"
                      style={{
                        backgroundColor: 'var(--accent-primary)',
                        color: '#06080d',
                      }}
                    >
                      <Terminal className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Use in Project</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleSavedItem(`repo-${topOne.id}`)}
                      className="inline-flex h-10 items-center gap-1.5 rounded-full border px-3.5 text-xs font-semibold focus-visible:outline-2 focus-visible:outline-offset-2"
                      style={{
                        backgroundColor: 'var(--bg-panel)',
                        borderColor: savedItemIds.includes(`repo-${topOne.id}`)
                          ? 'var(--accent-jade)'
                          : 'var(--border-subtle)',
                        color: savedItemIds.includes(`repo-${topOne.id}`)
                          ? 'var(--accent-jade)'
                          : 'var(--ink-primary)',
                      }}
                    >
                      {savedItemIds.includes(`repo-${topOne.id}`) ? (
                        <BookmarkCheck className="h-3.5 w-3.5" aria-hidden="true" />
                      ) : (
                        <Bookmark className="h-3.5 w-3.5" aria-hidden="true" />
                      )}
                      <span>{savedItemIds.includes(`repo-${topOne.id}`) ? 'Đã lưu' : 'Save'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => void handleCopyUrl(topOne)}
                      className="inline-flex h-10 items-center gap-1.5 rounded-full border px-3.5 text-xs font-medium focus-visible:outline-2 focus-visible:outline-offset-2"
                      style={{
                        backgroundColor: 'var(--bg-panel)',
                        borderColor: 'var(--border-subtle)',
                        color: 'var(--ink-secondary)',
                      }}
                    >
                      {copiedId === topOne.id ? (
                        <Check className="h-3.5 w-3.5" style={{ color: 'var(--accent-jade)' }} aria-hidden="true" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                      )}
                      <span>{copiedId === topOne.id ? 'Đã copy' : 'Copy Repo URL'}</span>
                    </button>

                    <a
                      href={topOne.htmlUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-auto inline-flex h-10 items-center gap-1 text-xs font-semibold hover:underline"
                      style={{ color: 'var(--accent-verdigris)' }}
                    >
                      <span>GitHub</span>
                      <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                    </a>
                  </div>
                </div>
              </article>

              <div className="flex flex-col gap-4">
                {podiumRunners.map((repo, idx) => {
                  const rankNum = idx + 2;
                  const savedKey = `repo-${repo.id}`;
                  const isSaved = savedItemIds.includes(savedKey);
                  return (
                    <article
                      key={repo.id}
                      className="flex flex-1 flex-col justify-between gap-4 overflow-hidden rounded-[22px] border p-5"
                      style={{
                        backgroundColor: 'var(--bg-surface)',
                        borderColor: 'var(--border-strong)',
                      }}
                    >
                      <div>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span
                              className="rounded-full px-2.5 py-0.5 font-mono text-xs font-bold"
                              style={{
                                backgroundColor:
                                  rankNum === 2
                                    ? 'color-mix(in srgb, var(--accent-verdigris) 18%, transparent)'
                                    : 'color-mix(in srgb, var(--accent-copper) 18%, transparent)',
                                color: rankNum === 2 ? 'var(--accent-verdigris)' : 'var(--accent-copper)',
                              }}
                            >
                              #0{rankNum}
                            </span>
                            <span className="text-xs" style={{ color: 'var(--ink-muted)' }}>
                              {repo.category}
                            </span>
                          </div>

                          <div className="flex items-center gap-2.5 font-mono text-xs font-semibold">
                            <span className="inline-flex items-center gap-1" style={{ color: 'var(--accent-primary)' }}>
                              <Star className="h-3 w-3" aria-hidden="true" />
                              {formatNumber(repo.stars)}
                            </span>
                            <span className="inline-flex items-center gap-1" style={{ color: 'var(--ink-muted)' }}>
                              <GitFork className="h-3 w-3" aria-hidden="true" />
                              {formatNumber(repo.forks)}
                            </span>
                          </div>
                        </div>

                        <h3
                          className="mt-2.5 break-words font-mono text-base font-semibold"
                          style={{ color: 'var(--ink-primary)' }}
                        >
                          {repo.fullName}
                        </h3>
                        <p className="mt-1 line-clamp-2 text-xs leading-relaxed" style={{ color: 'var(--ink-secondary)' }}>
                          {repo.description}
                        </p>
                        <p className="mt-1.5 line-clamp-2 text-xs" style={{ color: 'var(--ink-muted)' }}>
                          {repo.aiNote}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-1.5 text-[11px] font-mono">
                          <span
                            className="rounded-full px-2 py-0.5"
                            style={{
                              backgroundColor: 'var(--bg-panel)',
                              color: 'var(--ink-primary)',
                            }}
                          >
                            {repo.language}
                          </span>
                          <span
                            className="rounded-full border px-2 py-0.5"
                            style={{
                              borderColor: 'var(--border-subtle)',
                              color: 'var(--ink-muted)',
                            }}
                          >
                            {repo.license}
                          </span>
                          {repo.topics.slice(0, 3).map((topic) => (
                            <span
                              key={topic}
                              className="rounded-full border px-2 py-0.5"
                              style={{
                                borderColor: 'var(--border-subtle)',
                                color: 'var(--ink-secondary)',
                              }}
                            >
                              #{topic}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 border-t pt-3" style={{ borderColor: 'var(--border-subtle)' }}>
                        <button
                          type="button"
                          onClick={() => handleUseInProject(repo)}
                          className="inline-flex h-8 items-center gap-1.5 rounded-full px-3.5 text-xs font-semibold"
                          style={{
                            backgroundColor: 'var(--accent-primary)',
                            color: '#06080d',
                          }}
                        >
                          <Terminal className="h-3 w-3" aria-hidden="true" />
                          <span>Use in Project</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleSavedItem(savedKey)}
                          className="inline-flex h-8 items-center gap-1 rounded-full border px-3 text-xs font-medium"
                          style={{
                            backgroundColor: 'var(--bg-panel)',
                            borderColor: isSaved ? 'var(--accent-jade)' : 'var(--border-subtle)',
                            color: isSaved ? 'var(--accent-jade)' : 'var(--ink-secondary)',
                          }}
                        >
                          {isSaved ? (
                            <BookmarkCheck className="h-3 w-3" aria-hidden="true" />
                          ) : (
                            <Bookmark className="h-3 w-3" aria-hidden="true" />
                          )}
                          <span>{isSaved ? 'Đã lưu' : 'Save'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleCopyUrl(repo)}
                          aria-label={`Sao chép URL ${repo.fullName}`}
                          className="inline-flex h-8 items-center gap-1 rounded-full border px-2.5 text-xs"
                          style={{
                            backgroundColor: 'var(--bg-panel)',
                            borderColor: 'var(--border-subtle)',
                            color: 'var(--ink-secondary)',
                          }}
                        >
                          {copiedId === repo.id ? (
                            <Check className="h-3 w-3" style={{ color: 'var(--accent-jade)' }} aria-hidden="true" />
                          ) : (
                            <Copy className="h-3 w-3" aria-hidden="true" />
                          )}
                        </button>
                        <a
                          href={repo.htmlUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-auto inline-flex h-8 items-center gap-1 text-xs font-medium hover:underline"
                          style={{ color: 'var(--accent-verdigris)' }}
                        >
                          <span>GitHub</span>
                          <ExternalLink className="h-3 w-3" aria-hidden="true" />
                        </a>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          ) : null}

          {ledgerRepos.length > 0 ? (
            <div
              className="overflow-hidden rounded-[22px] border"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <div
                className="flex flex-wrap items-center justify-between gap-2 border-b px-5 py-3.5 text-xs font-semibold"
                style={{
                  backgroundColor: 'var(--bg-panel)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--ink-secondary)',
                }}
              >
                <span>Bảng xếp hạng chi tiết (Hạng #04 trở đi)</span>
                <span className="font-mono">{ledgerRepos.length} repositories</span>
              </div>

              <div className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
                {ledgerRepos.map((repo, idx) => {
                  const rank = idx + 4;
                  const rankLabel = `#${String(rank).padStart(2, '0')}`;
                  const savedKey = `repo-${repo.id}`;
                  const isSaved = savedItemIds.includes(savedKey);
                  return (
                    <article
                      key={repo.id}
                      className="flex flex-col gap-4 px-5 py-4 xl:flex-row xl:items-center xl:justify-between"
                      style={{ borderColor: 'var(--border-subtle)' }}
                    >
                      <div className="flex min-w-0 flex-1 items-start gap-4">
                        <span
                          className="mt-0.5 inline-flex h-8 w-11 shrink-0 items-center justify-center rounded-[10px] border font-mono text-xs font-bold"
                          style={{
                            backgroundColor: 'var(--bg-panel)',
                            borderColor: 'var(--border-subtle)',
                            color: 'var(--ink-secondary)',
                          }}
                        >
                          {rankLabel}
                        </span>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <a
                              href={repo.htmlUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="break-all font-mono text-sm font-semibold hover:underline"
                              style={{ color: 'var(--ink-primary)' }}
                            >
                              {repo.fullName}
                            </a>
                            <span
                              className="rounded-full px-2 py-0.5 text-[11px] font-medium"
                              style={{
                                backgroundColor: 'var(--bg-panel)',
                                color: 'var(--ink-secondary)',
                              }}
                            >
                              {repo.category}
                            </span>
                            <span
                              className="rounded-full border px-2 py-0.5 font-mono text-[11px]"
                              style={{
                                borderColor: 'var(--border-subtle)',
                                color: 'var(--accent-verdigris)',
                              }}
                            >
                              {repo.language}
                            </span>
                            <span
                              className="rounded-full border px-2 py-0.5 font-mono text-[11px]"
                              style={{
                                borderColor: 'var(--border-subtle)',
                                color: 'var(--ink-muted)',
                              }}
                            >
                              {repo.license}
                            </span>
                          </div>

                          <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--ink-secondary)' }}>
                            {repo.description}
                          </p>
                          <p className="mt-1 text-xs" style={{ color: 'var(--ink-muted)' }}>
                            {repo.aiNote}
                          </p>

                          <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
                            <span className="inline-flex items-center gap-1 font-mono font-semibold" style={{ color: 'var(--accent-primary)' }}>
                              <Star className="h-3 w-3" aria-hidden="true" />
                              {formatNumber(repo.stars)}
                            </span>
                            <span className="inline-flex items-center gap-1 font-mono" style={{ color: 'var(--ink-secondary)' }}>
                              <GitFork className="h-3 w-3" aria-hidden="true" />
                              {formatNumber(repo.forks)}
                            </span>
                            <span className="font-mono" style={{ color: 'var(--ink-muted)' }}>
                              Push: {formatDateIso(repo.pushedAt)}
                            </span>
                            {repo.topics.slice(0, 4).map((topic) => (
                              <span
                                key={topic}
                                className="rounded-full border px-2 py-0.5 font-mono text-[10px]"
                                style={{
                                  borderColor: 'var(--border-subtle)',
                                  color: 'var(--ink-muted)',
                                }}
                              >
                                #{topic}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-wrap items-center gap-2 pl-0 xl:pl-4">
                        <button
                          type="button"
                          onClick={() => void handleCopyUrl(repo)}
                          className="inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-medium"
                          style={{
                            backgroundColor: 'var(--bg-panel)',
                            borderColor: 'var(--border-subtle)',
                            color: 'var(--ink-secondary)',
                          }}
                        >
                          {copiedId === repo.id ? (
                            <Check className="h-3 w-3" style={{ color: 'var(--accent-jade)' }} aria-hidden="true" />
                          ) : (
                            <Copy className="h-3 w-3" aria-hidden="true" />
                          )}
                          <span>{copiedId === repo.id ? 'Copied' : 'Copy Repo URL'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleSavedItem(savedKey)}
                          className="inline-flex h-8 items-center gap-1 rounded-full border px-3 text-xs font-medium"
                          style={{
                            backgroundColor: 'var(--bg-panel)',
                            borderColor: isSaved ? 'var(--accent-jade)' : 'var(--border-subtle)',
                            color: isSaved ? 'var(--accent-jade)' : 'var(--ink-secondary)',
                          }}
                        >
                          {isSaved ? (
                            <BookmarkCheck className="h-3 w-3" aria-hidden="true" />
                          ) : (
                            <Bookmark className="h-3 w-3" aria-hidden="true" />
                          )}
                          <span>{isSaved ? 'Đã lưu' : 'Save'}</span>
                        </button>

                        <a
                          href={repo.htmlUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Mở ${repo.fullName} trên GitHub`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full border"
                          style={{
                            backgroundColor: 'var(--bg-panel)',
                            borderColor: 'var(--border-subtle)',
                            color: 'var(--accent-verdigris)',
                          }}
                        >
                          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                        </a>

                        <button
                          type="button"
                          onClick={() => handleUseInProject(repo)}
                          className="inline-flex h-8 items-center gap-1.5 rounded-full px-3.5 text-xs font-semibold"
                          style={{
                            backgroundColor: 'var(--accent-primary)',
                            color: '#06080d',
                          }}
                        >
                          <Terminal className="h-3 w-3" aria-hidden="true" />
                          <span>Use in Project</span>
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
};
