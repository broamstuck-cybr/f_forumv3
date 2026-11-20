import React, { useState } from 'react';
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
  studioRepoContext,
} from './catalog';

interface RepoChartProps {
  query: string;
  onClearQuery: () => void;
}

export const RepoChart: React.FC<RepoChartProps> = ({ query, onClearQuery }) => {
  const { savedItemIds, toggleSavedItem, openInWorkspace, addToast } = useAppStore();
  const [category, setCategory] = useState('all');
  const [openId, setOpenId] = useState<string | null>(null);

  const repos = RANKED_REPOS.filter(
    (repo) =>
      (category === 'all' || repo.category === category) &&
      matchesQuery(query, [
        repo.fullName,
        repo.description,
        repo.category,
        repo.language,
        ...repo.topics,
      ])
  );

  const house = STUDIO_REPOS.filter((repo) =>
    matchesQuery(query, [repo.fullName, repo.summaryVi, repo.language, ...repo.keyPaths])
  );

  const handleCopy = async (url: string) => {
    const ok = await copyText(url);
    addToast(
      ok
        ? { type: 'success', title: 'Đã chép liên kết', message: url }
        : { type: 'error', title: 'Không chép được', message: url }
    );
  };

  return (
    <>
      <div className="wrap-wide ex-controls">
        <div className="ex-filter" role="group" aria-label="Lọc theo nhóm">
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
          Số liệu GitHub ngày {formatDate(REPO_DATA.generatedAt)}. Thanh vẽ theo căn bậc hai số sao.
        </p>
      </div>

      <p className="sr-only" role="status">
        {query ? `${repos.length + house.length} repo khớp` : ''}
      </p>

      {repos.length > 0 ? (
        <ol className="wrap-wide ex-chart" aria-label="Xếp hạng repo theo số sao">
          {repos.map((repo, index) => {
            const isOpen = openId === repo.id;
            const savedId = rankedRepoSavedId(repo);
            const saved = savedItemIds.includes(savedId);
            const width = TOP_STARS > 0 ? Math.sqrt(repo.stars / TOP_STARS) : 0;
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
                  <span className="t-label ex-bar-rank">{index + 1}</span>
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
                    <p className="ex-row-line">{repo.description}</p>
                    <dl className="ex-meta">
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
                        aria-pressed={saved}
                        onClick={() => toggleSavedItem(savedId)}
                      >
                        {saved ? 'Đã lưu' : 'Lưu'}
                      </button>
                      <button
                        type="button"
                        className="ex-text"
                        onClick={() => void handleCopy(repo.htmlUrl)}
                      >
                        Chép liên kết
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
            <span className="t-label">{house.length}</span>
          </header>
          <ul className="ex-idx-panel">
            {house.map((repo) => {
              const saved = savedItemIds.includes(repo.id);
              return (
                <li className="ex-row" key={repo.id}>
                  <div className="ex-row-main">
                    <h3 className="ex-row-title">{repo.name}</h3>
                    <p className="ex-row-line">{repo.summaryVi}</p>
                    <dl className="ex-meta">
                      <div>
                        <dt>ngôn ngữ</dt>
                        <dd>{repo.language}</dd>
                      </div>
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
                          <dt>{metric.label.toLowerCase()}</dt>
                          <dd>{metric.value}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                  <div className="ex-row-actions">
                    <a
                      className="ex-text"
                      href={repo.htmlUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                    >
                      Mở nguồn
                    </a>
                    <button
                      type="button"
                      className="ex-text"
                      aria-pressed={saved}
                      onClick={() => toggleSavedItem(repo.id)}
                    >
                      {saved ? 'Đã lưu' : 'Lưu'}
                    </button>
                    <button
                      type="button"
                      className="ex-text"
                      onClick={() => openInWorkspace(studioRepoContext(repo))}
                    >
                      Dùng ngay
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
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
