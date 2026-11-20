import React, { useMemo, useState } from 'react';
import { useAppStore } from '../../store/appStore';
import {
  RANKED_REPOS,
  REPO_CATEGORIES,
  REPO_DATA,
  STUDIO_REPOS,
  TOP_STARS,
  copyText,
  formatCount,
  formatDate,
  matchesQuery,
  rankedRepoContext,
  rankedRepoSavedId,
  sanitizeBrandText,
  sanitizeSnippetCode,
  studioRepoContext,
  type PreviewTheme,
} from './catalog';
import { SandboxPreview } from './SandboxPreview';

interface RepoChartProps {
  query: string;
  onClearQuery: () => void;
}

type SnippetTab = 'html' | 'css';

export const RepoChart: React.FC<RepoChartProps> = ({ query, onClearQuery }) => {
  const { savedItemIds, toggleSavedItem, attachItemToWorkspace, openInWorkspace, activeProject, addToast, theme } =
    useAppStore();
  const [category, setCategory] = useState('all');
  const [openId, setOpenId] = useState<string | null>(null);
  const [activeHouseId, setActiveHouseId] = useState<string>(STUDIO_REPOS[0]?.id ?? '');
  const [snippetTheme, setSnippetTheme] = useState<PreviewTheme>(theme);
  const [snippetNonce, setSnippetNonce] = useState(0);
  const [snippetCodeOpen, setSnippetCodeOpen] = useState(false);
  const [snippetTab, setSnippetTab] = useState<SnippetTab>('html');

  const repos = useMemo(
    () =>
      RANKED_REPOS.filter(
        (repo) =>
          (category === 'all' || repo.category === category) &&
          matchesQuery(query, [
            repo.fullName,
            sanitizeBrandText(repo.description),
            sanitizeBrandText(repo.aiNote),
            repo.category,
            repo.language,
            ...repo.topics,
          ])
      ),
    [category, query]
  );

  const house = useMemo(
    () =>
      STUDIO_REPOS.filter((repo) =>
        matchesQuery(query, [
          repo.fullName,
          sanitizeBrandText(repo.summaryVi),
          repo.language,
          ...repo.keyPaths,
        ])
      ),
    [query]
  );

  const activeHouse =
    house.find((repo) => repo.id === activeHouseId) ?? house[0] ?? null;

  const podium = repos.length >= 3 ? repos.slice(0, 3) : [];
  const chartRepos = repos.length >= 3 ? repos.slice(3) : repos;
  const chartOffset = repos.length >= 3 ? 4 : 1;

  const agentCount = useMemo(
    () => RANKED_REPOS.filter((r) => r.category === 'AI Agents & CLI').length,
    []
  );

  const handleCopy = async (text: string, label: string) => {
    const ok = await copyText(text);
    addToast(
      ok
        ? { type: 'success', title: label, message: text.slice(0, 80) }
        : { type: 'error', title: 'Không chép được', message: text.slice(0, 80) }
    );
  };

  const handleAttachRanked = (repo: (typeof RANKED_REPOS)[number]) => {
    const id = rankedRepoSavedId(repo);
    if (activeProject.attachedItems.some((attached) => attached.id === id)) {
      addToast({ type: 'info', title: 'Đã đính kèm từ trước', message: repo.fullName });
      return;
    }
    attachItemToWorkspace(rankedRepoContext(repo));
  };

  const handleAttachHouse = (repo: (typeof STUDIO_REPOS)[number]) => {
    if (activeProject.attachedItems.some((attached) => attached.id === repo.id)) {
      addToast({ type: 'info', title: 'Đã đính kèm từ trước', message: repo.fullName });
      return;
    }
    attachItemToWorkspace(studioRepoContext(repo));
  };

  return (
    <>
      <div className="wrap-wide ex-controls">
        <div className="ex-filter" role="group" aria-label="Lọc theo nhóm kho mã">
          {REPO_CATEGORIES.map((option) => (
            <button
              key={option.id}
              type="button"
              className="ex-text"
              aria-pressed={category === option.id}
              onClick={() => setCategory(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>
        <p className="t-label ex-chart-note">
          {RANKED_REPOS.length} kho xác thực · {agentCount} tác tử AI & CLI · cập nhật{' '}
          {formatDate(REPO_DATA.generatedAt)}
        </p>
      </div>

      <p className="sr-only" role="status">
        {query ? `${repos.length + house.length} repo khớp` : ''}
      </p>

      {podium.length === 3 ? (
        <section className="wrap-wide ex-podium" aria-label="Ba kho mã dẫn đầu">
          {podium.map((repo, index) => {
            const savedId = rankedRepoSavedId(repo);
            const saved = savedItemIds.includes(savedId);
            const isOpen = openId === repo.id;
            const summary = sanitizeBrandText(repo.aiNote || repo.description);
            return (
              <article
                key={repo.id}
                className={`ex-podium-card ex-podium-${index + 1}`}
              >
                <div className="ex-podium-top">
                  <span className="ex-podium-rank">{String(index + 1).padStart(2, '0')}</span>
                  <span className="t-label">{repo.category}</span>
                </div>
                <h3 className="ex-podium-name">{repo.fullName}</h3>
                <p className="ex-podium-desc">{summary}</p>
                <dl className="ex-meta">
                  <div>
                    <dt>sao</dt>
                    <dd>{formatCount(repo.stars)}</dd>
                  </div>
                  <div>
                    <dt>fork</dt>
                    <dd>{formatCount(repo.forks)}</dd>
                  </div>
                  <div>
                    <dt>ngôn ngữ</dt>
                    <dd>{repo.language || 'đa ngữ'}</dd>
                  </div>
                </dl>
                {isOpen ? (
                  <p className="ex-podium-extra">{sanitizeBrandText(repo.description)}</p>
                ) : null}
                <div className="ex-row-actions">
                  <button
                    type="button"
                    className="ex-text"
                    onClick={() => openInWorkspace(rankedRepoContext(repo))}
                  >
                    Dùng ngay
                  </button>
                  <button
                    type="button"
                    className="ex-text"
                    onClick={() => handleAttachRanked(repo)}
                  >
                    Đính kèm
                  </button>
                  <button
                    type="button"
                    className="ex-text"
                    aria-pressed={saved}
                    onClick={() => toggleSavedItem(savedId)}
                  >
                    {saved ? 'Đã lưu' : 'Lưu'}
                  </button>
                  <button
                    type="button"
                    className="ex-text"
                    aria-expanded={isOpen}
                    onClick={() => setOpenId(isOpen ? null : repo.id)}
                  >
                    {isOpen ? 'Thu gọn' : 'Chi tiết'}
                  </button>
                  <a
                    className="ex-text"
                    href={repo.htmlUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    Mở nguồn
                  </a>
                </div>
              </article>
            );
          })}
        </section>
      ) : null}

      {chartRepos.length > 0 ? (
        <ol
          className="wrap-wide ex-chart"
          start={chartOffset}
          aria-label="Bảng xếp hạng kho mã nguồn theo số sao"
        >
          {chartRepos.map((repo, index) => {
            const rank = chartOffset + index;
            const isOpen = openId === repo.id;
            const savedId = rankedRepoSavedId(repo);
            const saved = savedItemIds.includes(savedId);
            const width = TOP_STARS > 0 ? Math.sqrt(repo.stars / TOP_STARS) : 0;
            const cleanDesc = sanitizeBrandText(repo.description);
            const cleanNote = sanitizeBrandText(repo.aiNote);
            return (
              <li
                key={repo.id}
                className="ex-chart-row"
                style={{ '--w': width.toFixed(4), '--i': index } as React.CSSProperties}
              >
                <button
                  type="button"
                  className="ex-bar"
                  aria-expanded={isOpen}
                  aria-controls={isOpen ? `ex-detail-${repo.id}` : undefined}
                  onClick={() => setOpenId(isOpen ? null : repo.id)}
                >
                  <span className="t-label ex-bar-rank">{rank}</span>
                  <span className="ex-bar-track">
                    <span className="ex-bar-fill" aria-hidden="true" />
                    <span className="ex-bar-name">{repo.fullName}</span>
                    <span className="t-label ex-bar-stars">
                      {formatCount(repo.stars)}
                      <span className="sr-only"> sao</span>
                    </span>
                  </span>
                </button>
                {isOpen ? (
                  <div id={`ex-detail-${repo.id}`} className="ex-detail">
                    <p className="ex-row-line">{cleanDesc}</p>
                    {cleanNote && cleanNote !== cleanDesc ? (
                      <p className="t-note ex-detail-note">{cleanNote}</p>
                    ) : null}
                    <dl className="ex-meta">
                      <div>
                        <dt>nhóm</dt>
                        <dd>{repo.category}</dd>
                      </div>
                      <div>
                        <dt>ngôn ngữ</dt>
                        <dd>{repo.language || 'không ghi'}</dd>
                      </div>
                      <div>
                        <dt>giấy phép</dt>
                        <dd>{repo.license || 'không ghi'}</dd>
                      </div>
                      <div>
                        <dt>cập nhật</dt>
                        <dd>{formatDate(repo.pushedAt)}</dd>
                      </div>
                      <div>
                        <dt>fork</dt>
                        <dd>{formatCount(repo.forks)}</dd>
                      </div>
                    </dl>
                    <div className="ex-row-actions">
                      <button
                        type="button"
                        className="ex-text"
                        onClick={() => openInWorkspace(rankedRepoContext(repo))}
                      >
                        Dùng ngay
                      </button>
                      <button
                        type="button"
                        className="ex-text"
                        onClick={() => handleAttachRanked(repo)}
                      >
                        Đính kèm
                      </button>
                      <button
                        type="button"
                        className="ex-text"
                        aria-pressed={saved}
                        onClick={() => toggleSavedItem(savedId)}
                      >
                        {saved ? 'Đã lưu' : 'Lưu'}
                      </button>
                      <button
                        type="button"
                        className="ex-text"
                        onClick={() => void handleCopy(repo.htmlUrl, 'Đã chép liên kết')}
                      >
                        Chép link
                      </button>
                      <a
                        className="ex-text"
                        href={repo.htmlUrl}
                        target="_blank"
                        rel="noreferrer noopener"
                      >
                        Mở nguồn
                      </a>
                    </div>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ol>
      ) : null}

      {house.length > 0 ? (
        <section className="wrap-wide ex-house" aria-labelledby="ex-house-title">
          <header className="ex-house-head">
            <h2 id="ex-house-title" className="t-title">
              Kho nhà
            </h2>
            <span className="t-label">{house.length} dự án nội bộ</span>
          </header>

          <div className="ex-house-grid">
            <ul className="ex-idx-panel ex-house-list">
              {house.map((repo) => {
                const saved = savedItemIds.includes(repo.id);
                const selected = activeHouse?.id === repo.id;
                return (
                  <li
                    className={`ex-row${selected ? ' ex-row-active' : ''}`}
                    key={repo.id}
                  >
                    <div className="ex-row-main">
                      <div className="ex-row-top">
                        <h3 className="ex-row-title">{repo.name}</h3>
                        <span className="t-label">{repo.language}</span>
                      </div>
                      <p className="ex-row-line">{sanitizeBrandText(repo.summaryVi)}</p>
                      <dl className="ex-meta">
                        <div>
                          <dt>giấy phép</dt>
                          <dd>{repo.license}</dd>
                        </div>
                        <div>
                          <dt>cập nhật</dt>
                          <dd>{formatDate(repo.pushedAt)}</dd>
                        </div>
                        {repo.metrics.slice(0, 3).map((metric) => (
                          <div key={metric.label}>
                            <dt>{sanitizeBrandText(metric.label).toLowerCase()}</dt>
                            <dd>{metric.value}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                    <div className="ex-row-actions">
                      <button
                        type="button"
                        className="ex-text"
                        aria-pressed={selected}
                        onClick={() => {
                          setActiveHouseId(repo.id);
                          setSnippetNonce((n) => n + 1);
                        }}
                      >
                        Chạy thử
                      </button>
                      <button
                        type="button"
                        className="ex-text"
                        onClick={() => openInWorkspace(studioRepoContext(repo))}
                      >
                        Dùng ngay
                      </button>
                      <button
                        type="button"
                        className="ex-text"
                        onClick={() => handleAttachHouse(repo)}
                      >
                        Đính kèm
                      </button>
                      <button
                        type="button"
                        className="ex-text"
                        aria-pressed={saved}
                        onClick={() => toggleSavedItem(repo.id)}
                      >
                        {saved ? 'Đã lưu' : 'Lưu'}
                      </button>
                      <a
                        className="ex-text"
                        href={repo.htmlUrl}
                        target="_blank"
                        rel="noreferrer noopener"
                      >
                        Mở nguồn
                      </a>
                    </div>
                  </li>
                );
              })}
            </ul>

            {activeHouse ? (
              <aside className="ex-house-stage" aria-label="Bản chạy thử dự án kho nhà">
                <div className="ex-bench-bar">
                  <div className="ex-bench-id">
                    <span className="t-label">{activeHouse.name}</span>
                    <span className="t-note">
                      {sanitizeBrandText(activeHouse.interactiveSnippet.label)}
                    </span>
                  </div>
                  <div className="ex-stage-controls">
                    <button
                      type="button"
                      className="ex-text"
                      aria-pressed={snippetTheme === 'dark'}
                      onClick={() => setSnippetTheme('dark')}
                    >
                      Mực
                    </button>
                    <button
                      type="button"
                      className="ex-text"
                      aria-pressed={snippetTheme === 'light'}
                      onClick={() => setSnippetTheme('light')}
                    >
                      Giấy
                    </button>
                    <button
                      type="button"
                      className="ex-text"
                      onClick={() => setSnippetNonce((n) => n + 1)}
                    >
                      Chạy lại
                    </button>
                    <button
                      type="button"
                      className="ex-text"
                      aria-expanded={snippetCodeOpen}
                      onClick={() => setSnippetCodeOpen((prev) => !prev)}
                    >
                      {snippetCodeOpen ? 'Ẩn mã' : 'Xem mã'}
                    </button>
                  </div>
                </div>
                <div className={`ex-house-frame${snippetTheme === 'light' ? ' ex-stage-paper' : ''}`}>
                  <SandboxPreview
                    title={activeHouse.name}
                    html={activeHouse.interactiveSnippet.html}
                    css={activeHouse.interactiveSnippet.css}
                    theme={snippetTheme}
                    viewport={1440}
                    nonce={snippetNonce}
                  />
                </div>
                {snippetCodeOpen ? (
                  <div className="ex-code-drawer">
                    <div className="ex-code-tabs">
                      <div className="ex-filter" role="tablist" aria-label="Mã trích đoạn">
                        <button
                          type="button"
                          role="tab"
                          aria-selected={snippetTab === 'html'}
                          className="ex-text"
                          aria-pressed={snippetTab === 'html'}
                          onClick={() => setSnippetTab('html')}
                        >
                          HTML
                        </button>
                        <button
                          type="button"
                          role="tab"
                          aria-selected={snippetTab === 'css'}
                          className="ex-text"
                          aria-pressed={snippetTab === 'css'}
                          onClick={() => setSnippetTab('css')}
                        >
                          CSS
                        </button>
                      </div>
                      <button
                        type="button"
                        className="ex-text"
                        onClick={() =>
                          void handleCopy(
                            sanitizeSnippetCode(
                              snippetTab === 'html'
                                ? activeHouse.interactiveSnippet.html
                                : activeHouse.interactiveSnippet.css
                            ),
                            'Đã chép mã'
                          )
                        }
                      >
                        Chép mã
                      </button>
                    </div>
                    <pre className="ex-code-pre">
                      <code>
                        {sanitizeSnippetCode(
                          snippetTab === 'html'
                            ? activeHouse.interactiveSnippet.html
                            : activeHouse.interactiveSnippet.css
                        )}
                      </code>
                    </pre>
                  </div>
                ) : null}
              </aside>
            ) : null}
          </div>
        </section>
      ) : null}

      {repos.length === 0 && house.length === 0 ? (
        <div className="wrap-wide ex-empty">
          <p className="ex-empty-line">Không có repo nào khớp “{query}”.</p>
          <button type="button" className="ex-text" onClick={onClearQuery}>
            Xóa tìm
          </button>
        </div>
      ) : null}
    </>
  );
};
