import React, { useMemo, useState } from 'react';
import {
  Bookmark,
  BookmarkCheck,
  ExternalLink,
} from 'lucide-react';
import {
  BROAMSTUCK_REPOS,
  SHOPIFY_CHAPTER_TELEMETRY,
  SOURCE_KNOWLEDGE_BREAKDOWN,
  type BroamstuckRepoShowcase,
  type SourceKnowledgeCategoryStat,
} from '../../data/realShowcaseData';
import { useAppStore } from '../../store/appStore';
import { FileBox, Magnify } from '../../components/pinui';

function buildRepoSnippetDoc(repo: BroamstuckRepoShowcase, theme: 'dark' | 'light'): string {
  const isDark = theme === 'dark';
  const fallbackBg = isDark ? '#090a0d' : '#f7f5f0';
  const fallbackInk = isDark ? '#f4f1ea' : '#141413';
  const safeHtml = repo.interactiveSnippet.html;
  const safeCss = repo.interactiveSnippet.css;
  return `<!DOCTYPE html><html lang="vi"><head><meta charset="utf-8" /><style>
    *{box-sizing:border-box}
    body{margin:0;min-height:100vh;background:${fallbackBg};color:${fallbackInk};}
    ${safeCss}
  </style></head><body>${safeHtml}</body></html>`;
}

function formatNumber(n: number): string {
  return new Intl.NumberFormat('vi-VN').format(n);
}

export interface GitHubShowcaseProps {
  searchQuery?: string;
}

export const GitHubShowcase: React.FC<GitHubShowcaseProps> = ({ searchQuery = '' }) => {
  const {
    theme,
    savedItemIds,
    toggleSavedItem,
    openInWorkspace,
    createProject,
  } = useAppStore();

  const filteredRepos = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return BROAMSTUCK_REPOS;
    return BROAMSTUCK_REPOS.filter(
      (repo) =>
        repo.name.toLowerCase().includes(q) ||
        repo.fullName.toLowerCase().includes(q) ||
        repo.summaryVi.toLowerCase().includes(q) ||
        repo.language.toLowerCase().includes(q) ||
        repo.keyPaths.some((p) => p.toLowerCase().includes(q))
    );
  }, [searchQuery]);

  const [selectedRepoId, setSelectedRepoId] = useState<string>(BROAMSTUCK_REPOS[0]?.id ?? '');
  const [selectedLibraryId, setSelectedLibraryId] = useState<SourceKnowledgeCategoryStat['library']>(
    SOURCE_KNOWLEDGE_BREAKDOWN.libraries[0]?.library ?? 'codefronts'
  );
  const [selectedChapterId, setSelectedChapterId] = useState<string>(
    SHOPIFY_CHAPTER_TELEMETRY.chapters[0]?.id ?? 'sidekick'
  );

  const selectedRepo = useMemo(() => {
    return (
      filteredRepos.find((r) => r.id === selectedRepoId) ||
      filteredRepos[0] ||
      BROAMSTUCK_REPOS[0]
    );
  }, [filteredRepos, selectedRepoId]);

  const selectedLibrary = useMemo(() => {
    return (
      SOURCE_KNOWLEDGE_BREAKDOWN.libraries.find((l) => l.library === selectedLibraryId) ||
      SOURCE_KNOWLEDGE_BREAKDOWN.libraries[0]
    );
  }, [selectedLibraryId]);

  const selectedChapter = useMemo(() => {
    return (
      SHOPIFY_CHAPTER_TELEMETRY.chapters.find((c) => c.id === selectedChapterId) ||
      SHOPIFY_CHAPTER_TELEMETRY.chapters[0]
    );
  }, [selectedChapterId]);

  const handleLaunchRepo = (repo: BroamstuckRepoShowcase) => {
    createProject(repo.name, repo.summaryVi);
    openInWorkspace({
      id: repo.id,
      kind: 'blueprint',
      title: repo.fullName,
      summary: repo.summaryVi,
      payload: [
        `Repository: ${repo.htmlUrl}`,
        `Language: ${repo.language}`,
        `Key Paths: ${repo.keyPaths.join(', ')}`,
        `Snippet HTML:\n${repo.interactiveSnippet.html}`,
        `Snippet CSS:\n${repo.interactiveSnippet.css}`,
      ].join('\n\n'),
      tags: [repo.language, 'broamstuck-cybr', 'github'],
    });
  };

  const handleLaunchLibrary = (lib: SourceKnowledgeCategoryStat) => {
    openInWorkspace({
      id: `sok-lib-${lib.library}`,
      kind: 'blueprint',
      title: `${lib.label} · SOURCEOFKNOWLEDGFORAI`,
      sourceLibrary: lib.library,
      summary: `${formatNumber(lib.count)} thành phần · ${lib.extraLabel || lib.license}`,
      payload: `Source: ${SOURCE_KNOWLEDGE_BREAKDOWN.repoUrl}\nPath: ${lib.repoPath}\nOfficial: ${lib.officialUrl}\nItems: ${lib.count}`,
      tags: [lib.library, 'SOURCEOFKNOWLEDGFORAI'],
    });
  };

  const handleLaunchChapter = () => {
    openInWorkspace({
      id: `shopify-ch-${selectedChapter.id}`,
      kind: 'blueprint',
      title: `shoptify-winter-reverser-engine · ${selectedChapter.title}`,
      summary: `${selectedChapter.featureCount} cập nhật · ${formatNumber(selectedChapter.heightPx)} px · ${selectedChapter.highlightFeature}`,
      payload: [
        `Repository: ${SHOPIFY_CHAPTER_TELEMETRY.repoUrl}`,
        `Chapter: ${selectedChapter.title}`,
        `Updates: ${selectedChapter.featureCount}`,
        `Height: ${selectedChapter.heightPx}px`,
        `Highlight: ${selectedChapter.highlightFeature}`,
      ].join('\n'),
      tags: ['shopify-winter', selectedChapter.id],
    });
  };

  const repoSaved = savedItemIds.includes(selectedRepo.id);

  return (
    <section aria-label="Kho mã nguồn broamstuck-cybr" className="space-y-12">
      <div className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b pb-4" style={{ borderColor: 'var(--border-subtle)' }}>
          <div>
            <p className="text-[11px] font-mono tracking-[0.2em]" style={{ color: 'var(--accent-primary)' }}>
              BROAMSTUCK-CYBR · KHO LƯU TRỮ MỞ
            </p>
            <h2
              className="mt-1.5 text-2xl font-semibold tracking-tight sm:text-3xl"
              style={{ fontFamily: 'var(--font-serif)', color: 'var(--ink-primary)' }}
            >
              Hệ sinh thái Kho lưu trữ Thực chiến
            </h2>
          </div>
          <span className="font-mono text-xs" style={{ color: 'var(--ink-muted)' }}>
            {filteredRepos.length} / {BROAMSTUCK_REPOS.length} kho lưu trữ
          </span>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-3 snap-x ff-scrollbar">
          {filteredRepos.map((repo, idx) => {
            const active = repo.id === selectedRepo.id;
            return (
              <article
                key={repo.id}
                className="min-w-[270px] max-w-[300px] shrink-0 snap-start rounded-[20px] border p-5 flex flex-col justify-between gap-4 transition-colors"
                style={{
                  backgroundColor: active ? 'var(--bg-elevated)' : 'var(--bg-surface)',
                  borderColor: active ? 'var(--accent-primary)' : 'var(--border-subtle)',
                }}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 text-[11px] font-mono" style={{ color: 'var(--ink-muted)' }}>
                    <span>{String(idx + 1).padStart(2, '0')}</span>
                    <span>{repo.language}</span>
                  </div>
                  <h3
                    className="mt-2 truncate text-base font-semibold"
                    style={{ fontFamily: 'var(--font-display)', color: 'var(--ink-primary)' }}
                  >
                    {repo.name}
                  </h3>
                  <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed" style={{ color: 'var(--ink-secondary)' }}>
                    {repo.summaryVi}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-2 border-t pt-3" style={{ borderColor: 'var(--border-subtle)' }}>
                  <span className="font-mono text-[11px]" style={{ color: 'var(--accent-primary)' }}>
                    {repo.stars} sao
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedRepoId(repo.id)}
                    className="rounded-full border px-3.5 py-1.5 text-xs font-medium cursor-pointer transition-colors"
                    style={{
                      backgroundColor: active ? 'var(--accent-primary)' : 'var(--bg-panel)',
                      borderColor: active ? 'var(--accent-primary)' : 'var(--border-subtle)',
                      color: active ? 'var(--ink-inverse)' : 'var(--ink-primary)',
                    }}
                  >
                    {active ? 'Đang xem' : 'Chọn kho'}
                  </button>
                </div>
              </article>
            );
          })}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] items-start">
          <div
            className="rounded-[24px] border p-6 sm:p-8 space-y-6"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-strong)',
              boxShadow: 'var(--shadow-md)',
            }}
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="font-mono text-xs" style={{ color: 'var(--accent-primary)' }}>
                  {selectedRepo.fullName}
                </p>
                <h3
                  className="mt-1.5 text-2xl font-semibold tracking-tight break-words"
                  style={{ fontFamily: 'var(--font-serif)', color: 'var(--ink-primary)' }}
                >
                  {selectedRepo.name}
                </h3>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => toggleSavedItem(selectedRepo.id)}
                  aria-label={repoSaved ? `Bỏ lưu ${selectedRepo.name}` : `Lưu ${selectedRepo.name}`}
                  title={repoSaved ? 'Bỏ lưu' : 'Lưu kho'}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border cursor-pointer"
                  style={{
                    backgroundColor: 'var(--bg-panel)',
                    borderColor: repoSaved ? 'var(--accent-jade)' : 'var(--border-subtle)',
                    color: repoSaved ? 'var(--accent-jade)' : 'var(--ink-secondary)',
                  }}
                >
                  {repoSaved ? (
                    <BookmarkCheck className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Bookmark className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
                <a
                  href={selectedRepo.htmlUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Mở GitHub ${selectedRepo.fullName}`}
                  title="Mở trên GitHub"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border"
                  style={{
                    backgroundColor: 'var(--bg-panel)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--ink-primary)',
                  }}
                >
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                </a>
                <button
                  type="button"
                  onClick={() => handleLaunchRepo(selectedRepo)}
                  className="h-10 rounded-full px-5 text-xs font-semibold cursor-pointer"
                  style={{
                    backgroundColor: 'var(--accent-primary)',
                    color: 'var(--ink-inverse)',
                  }}
                >
                  Workspace
                </button>
              </div>
            </div>

            <p className="text-[15px] leading-relaxed" style={{ color: 'var(--ink-secondary)' }}>
              {selectedRepo.summaryVi}
            </p>

            <div className="flex flex-wrap gap-6 border-y py-4" style={{ borderColor: 'var(--border-subtle)' }}>
              {selectedRepo.metrics.map((metric) => (
                <div key={metric.label}>
                  <span className="block text-[11px] font-mono" style={{ color: 'var(--ink-muted)' }}>
                    {metric.label}
                  </span>
                  <strong className="mt-0.5 block font-mono text-lg font-semibold" style={{ color: 'var(--ink-primary)' }}>
                    {metric.value}
                  </strong>
                </div>
              ))}
            </div>

            <FileBox
              title="Đường dẫn trọng tâm"
              tabs={selectedRepo.keyPaths.map((path, index) => ({
                id: `${selectedRepo.id}-path-${index}`,
                label: path,
                meta: selectedRepo.language,
                onOpen: () => handleLaunchRepo(selectedRepo),
              }))}
            />
          </div>

          <div
            className="rounded-[24px] border overflow-hidden lg:sticky lg:top-24"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-strong)',
              boxShadow: 'var(--shadow-md)',
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
                <span className="block font-mono text-[11px]" style={{ color: 'var(--accent-primary)' }}>
                  LIVE VIEW · SANDBOX
                </span>
                <span className="block truncate text-sm font-semibold" style={{ color: 'var(--ink-primary)' }}>
                  {selectedRepo.interactiveSnippet.label}
                </span>
              </div>
              {selectedRepo.homepage ? (
                <a
                  href={selectedRepo.homepage}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Truy cập trang trực tuyến ${selectedRepo.name}`}
                  title="Trang trực tuyến"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border shrink-0"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--accent-verdigris)',
                  }}
                >
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              ) : null}
            </div>
            <iframe
              title={`Xem trực tiếp ${selectedRepo.interactiveSnippet.label}`}
              loading="eager"
              sandbox="allow-scripts"
              referrerPolicy="no-referrer"
              srcDoc={buildRepoSnippetDoc(selectedRepo, theme)}
              className="h-[340px] w-full border-0 block"
              style={{ backgroundColor: 'var(--bg-canvas)' }}
            />
          </div>
        </div>
      </div>

      <div
        className="rounded-[26px] border p-6 sm:p-8 space-y-6"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-strong)',
        }}
      >
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] tracking-[0.18em]" style={{ color: 'var(--accent-primary)' }}>
              SOURCEOFKNOWLEDGFORAI
            </p>
            <h3
              className="mt-1 text-2xl font-semibold tracking-tight"
              style={{ fontFamily: 'var(--font-serif)', color: 'var(--ink-primary)' }}
            >
              6.770 Mẫu Giao diện qua 5 Thư viện Gốc
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={SOURCE_KNOWLEDGE_BREAKDOWN.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Mở kho SOURCEOFKNOWLEDGFORAI trên GitHub"
              title="Mở GitHub"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border"
              style={{
                backgroundColor: 'var(--bg-panel)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--ink-primary)',
              }}
            >
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </a>
            <button
              type="button"
              onClick={() => handleLaunchLibrary(selectedLibrary)}
              className="h-9 rounded-full px-4 text-xs font-semibold cursor-pointer"
              style={{
                backgroundColor: 'var(--accent-primary)',
                color: 'var(--ink-inverse)',
              }}
            >
              Workspace
            </button>
          </div>
        </div>

        <div className="flex h-2.5 w-full overflow-hidden rounded-full" style={{ backgroundColor: 'var(--bg-panel)' }}>
          {SOURCE_KNOWLEDGE_BREAKDOWN.libraries.map((lib, idx) => {
            const pct = (lib.count / SOURCE_KNOWLEDGE_BREAKDOWN.totalItems) * 100;
            const tones = [
              'var(--accent-primary)',
              'var(--accent-verdigris)',
              'var(--accent-jade)',
              'var(--accent-copper)',
              'var(--ink-secondary)',
            ];
            return (
              <div
                key={lib.library}
                style={{
                  width: `${Math.max(pct, 2.5)}%`,
                  backgroundColor: tones[idx % tones.length],
                  opacity: lib.library === selectedLibrary.library ? 1 : 0.45,
                }}
                title={`${lib.label}: ${formatNumber(lib.count)}`}
              />
            );
          })}
        </div>

        <div className="flex gap-4 overflow-x-auto pb-2 snap-x ff-scrollbar">
          {SOURCE_KNOWLEDGE_BREAKDOWN.libraries.map((lib) => {
            const active = lib.library === selectedLibrary.library;
            return (
              <article
                key={lib.library}
                className="min-w-[230px] shrink-0 snap-start rounded-[18px] border p-4 flex flex-col justify-between gap-3"
                style={{
                  backgroundColor: active ? 'var(--bg-elevated)' : 'var(--bg-panel)',
                  borderColor: active ? 'var(--accent-primary)' : 'var(--border-subtle)',
                }}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold" style={{ color: 'var(--ink-primary)' }}>
                      {lib.label}
                    </span>
                    <span className="font-mono text-xs font-semibold" style={{ color: 'var(--accent-primary)' }}>
                      {formatNumber(lib.count)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs" style={{ color: 'var(--ink-secondary)' }}>
                    {lib.extraLabel}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                  <span className="font-mono text-[11px]" style={{ color: 'var(--ink-muted)' }}>
                    {lib.license}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedLibraryId(lib.library)}
                    className="rounded-full border px-3 py-1 text-[11px] font-medium cursor-pointer"
                    style={{
                      backgroundColor: active ? 'var(--accent-primary)' : 'var(--bg-surface)',
                      borderColor: active ? 'var(--accent-primary)' : 'var(--border-subtle)',
                      color: active ? 'var(--ink-inverse)' : 'var(--ink-primary)',
                    }}
                  >
                    Soi mẫu
                  </button>
                </div>
              </article>
            );
          })}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] items-center pt-2">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-xs" style={{ color: 'var(--accent-verdigris)' }}>
                {selectedLibrary.repoPath}
              </span>
              <a
                href={selectedLibrary.officialUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Trang chính thức ${selectedLibrary.label}`}
                title="Trang chính thức"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border"
                style={{
                  backgroundColor: 'var(--bg-panel)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--ink-primary)',
                }}
              >
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            </div>
            <h4
              className="text-xl font-semibold"
              style={{ fontFamily: 'var(--font-serif)', color: 'var(--ink-primary)' }}
            >
              {selectedLibrary.label} · {formatNumber(selectedLibrary.count)} thành phần
            </h4>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--ink-secondary)' }}>
              {selectedLibrary.extraLabel} — chuẩn hóa sẵn để đưa vào Live View và đối chiếu Diff &amp; Check.
            </p>
            <div className="overflow-hidden rounded-[18px] border" style={{ borderColor: 'var(--border-subtle)' }}>
              <img
                src={selectedLibrary.previewUrl}
                alt={`Minh họa ${selectedLibrary.label}`}
                loading="lazy"
                className="h-52 w-full object-cover block"
              />
            </div>
          </div>

          <div className="flex justify-center">
            <Magnify
              glyph={selectedLibrary.label.slice(0, 1).toUpperCase()}
              microText={`${selectedLibrary.label.toUpperCase()} · ${selectedLibrary.count} ITEMS · ${selectedLibrary.repoPath} · `}
              hintText="Di chuyển kính lúp · Chạm để phóng đại"
              theme={theme}
              size={340}
            />
          </div>
        </div>
      </div>

      <div
        className="rounded-[26px] border p-6 sm:p-8 space-y-6"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-strong)',
        }}
      >
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] tracking-[0.18em]" style={{ color: 'var(--accent-primary)' }}>
              SHOPTIFY-WINTER-REVERSER-ENGINE
            </p>
            <h3
              className="mt-1 text-2xl font-semibold tracking-tight"
              style={{ fontFamily: 'var(--font-serif)', color: 'var(--ink-primary)' }}
            >
              Giải phẫu 12 Chương Shopify Winter
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={SHOPIFY_CHAPTER_TELEMETRY.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Mở shoptify-winter-reverser-engine trên GitHub"
              title="Mở GitHub"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border"
              style={{
                backgroundColor: 'var(--bg-panel)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--ink-primary)',
              }}
            >
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </a>
            <button
              type="button"
              onClick={handleLaunchChapter}
              className="h-9 rounded-full px-4 text-xs font-semibold cursor-pointer"
              style={{
                backgroundColor: 'var(--accent-primary)',
                color: 'var(--ink-inverse)',
              }}
            >
              Workspace
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-6 border-y py-4" style={{ borderColor: 'var(--border-subtle)' }}>
          <div>
            <span className="block text-[11px] font-mono" style={{ color: 'var(--ink-muted)' }}>
              Chương
            </span>
            <strong className="font-mono text-lg" style={{ color: 'var(--ink-primary)' }}>
              {SHOPIFY_CHAPTER_TELEMETRY.totalChapters}
            </strong>
          </div>
          <div>
            <span className="block text-[11px] font-mono" style={{ color: 'var(--ink-muted)' }}>
              Cập nhật
            </span>
            <strong className="font-mono text-lg" style={{ color: 'var(--accent-primary)' }}>
              {SHOPIFY_CHAPTER_TELEMETRY.totalUpdates}
            </strong>
          </div>
          <div>
            <span className="block text-[11px] font-mono" style={{ color: 'var(--ink-muted)' }}>
              Tài nguyên
            </span>
            <strong className="font-mono text-lg" style={{ color: 'var(--ink-primary)' }}>
              {SHOPIFY_CHAPTER_TELEMETRY.totalAssets}
            </strong>
          </div>
          <div>
            <span className="block text-[11px] font-mono" style={{ color: 'var(--ink-muted)' }}>
              Dung lượng
            </span>
            <strong className="font-mono text-lg" style={{ color: 'var(--ink-primary)' }}>
              {SHOPIFY_CHAPTER_TELEMETRY.bundleSizeMb} MB
            </strong>
          </div>
          <div>
            <span className="block text-[11px] font-mono" style={{ color: 'var(--ink-muted)' }}>
              Chiều sâu cuộn
            </span>
            <strong className="font-mono text-lg" style={{ color: 'var(--accent-verdigris)' }}>
              {formatNumber(SHOPIFY_CHAPTER_TELEMETRY.pageHeightPx)} px
            </strong>
          </div>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2 snap-x ff-scrollbar">
          {SHOPIFY_CHAPTER_TELEMETRY.chapters.map((chapter, idx) => {
            const active = chapter.id === selectedChapter.id;
            return (
              <button
                key={chapter.id}
                type="button"
                onClick={() => setSelectedChapterId(chapter.id)}
                title={`${String(idx + 1).padStart(2, '0')} · ${chapter.title}`}
                className="shrink-0 snap-start rounded-full border px-4 py-2 text-xs font-medium cursor-pointer transition-colors"
                style={{
                  backgroundColor: active ? 'var(--accent-primary)' : 'var(--bg-panel)',
                  borderColor: active ? 'var(--accent-primary)' : 'var(--border-subtle)',
                  color: active ? 'var(--ink-inverse)' : 'var(--ink-primary)',
                }}
              >
                {chapter.title}
              </button>
            );
          })}
        </div>

        <div
          className="rounded-[20px] border p-5 sm:p-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
          style={{
            backgroundColor: 'var(--bg-panel)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <div className="space-y-1.5 min-w-0">
            <span className="font-mono text-xs" style={{ color: 'var(--accent-primary)' }}>
              {selectedChapter.title.toUpperCase()} · {selectedChapter.featureCount} CẬP NHẬT
            </span>
            <h4 className="text-xl font-semibold" style={{ fontFamily: 'var(--font-serif)', color: 'var(--ink-primary)' }}>
              {selectedChapter.highlightFeature}
            </h4>
            <p className="text-xs font-mono" style={{ color: 'var(--ink-muted)' }}>
              Độ sâu chương: {formatNumber(selectedChapter.heightPx)} px / {formatNumber(SHOPIFY_CHAPTER_TELEMETRY.pageHeightPx)} px
            </p>
          </div>

          <div className="w-full lg:w-[280px] shrink-0 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono" style={{ color: 'var(--ink-secondary)' }}>
              <span>Tỷ trọng cuộn</span>
              <span>{Math.round((selectedChapter.heightPx / SHOPIFY_CHAPTER_TELEMETRY.pageHeightPx) * 100)}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full" style={{ backgroundColor: 'var(--bg-surface)' }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.max(4, Math.round((selectedChapter.heightPx / SHOPIFY_CHAPTER_TELEMETRY.pageHeightPx) * 100))}%`,
                  backgroundColor: 'var(--accent-verdigris)',
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default GitHubShowcase;
