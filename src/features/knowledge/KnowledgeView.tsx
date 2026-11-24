import React, { useDeferredValue, useEffect, useMemo, useState } from 'react';
import {
  ArrowUpRight,
  BookOpen,
  Code2,
  Database,
  ExternalLink,
  Film,
  Layers,
  RotateCw,
} from 'lucide-react';
import { SearchCard } from '../../components/pinui';
import { useAppStore } from '../../store/appStore';
import {
  fetchVaultIndex,
  getCachedVaultIndex,
  resolveOriginalLiveUrl,
  VAULT_LIBRARY_LABELS,
  type VaultIndexItem,
  type VaultLibraryKey,
} from '../explore/vaultLoader';
import { isRunnableKnowledge, rankKnowledge } from './knowledgeRanking';
import './knowledge.css';

type KnowledgeMode = 'knowledge' | 'feed' | 'chat';

interface KnowledgeViewProps {
  onOpenFeed: () => void;
  onOpenChat: () => void;
}

interface LibraryMeta {
  name: string;
  short: string;
  repo: string;
  note: string;
}

const PAGE_STEP = 24;

const LIBRARY_META: Record<VaultLibraryKey, LibraryMeta> = {
  codefronts: {
    name: 'CodeFronts',
    short: 'CodeFronts',
    repo: 'sources/codefronts',
    note: '5.047 prompt + HTML/CSS/JS chạy được',
  },
  lucianlabs: {
    name: 'LucianLabs',
    short: 'LucianLabs',
    repo: 'sources/lucianlabs',
    note: '480 prompt + 480 demo MIT',
  },
  pinui: {
    name: 'PinUI',
    short: 'PinUI',
    repo: 'sources/pinui',
    note: '42 registry component MIT',
  },
  threeui: {
    name: 'ThreeUI',
    short: 'ThreeUI',
    repo: 'sources/threeui',
    note: '43 source MIT + 961 route đã lập chỉ mục',
  },
  motionsites: {
    name: 'MotionSites',
    short: 'MotionSites',
    repo: 'sources/motionsites',
    note: '826 mẫu chuyển động, 528 trailer',
  },
  glacier: {
    name: 'GetLayers',
    short: 'GetLayers',
    repo: 'sources/getlayers',
    note: '966 nền 3D, 861 preview đã xác minh',
  },
};

const SOURCE_ORDER: VaultLibraryKey[] = [
  'codefronts',
  'lucianlabs',
  'pinui',
  'threeui',
  'motionsites',
  'glacier',
];

const COMMON_QUERIES = ['hero', 'glass', 'dashboard', '3d', 'pricing', 'button', 'background'];

const MODE_ITEMS: Array<{ id: KnowledgeMode; label: string }> = [
  { id: 'knowledge', label: 'Tra cứu' },
  { id: 'feed', label: 'Bảng tin' },
  { id: 'chat', label: 'Phòng chat' },
];

function formatCount(value: number): string {
  return new Intl.NumberFormat('vi-VN').format(value);
}

function sourceSearchUrl(library: VaultLibraryKey): string {
  return `https://github.com/broamstuck-cybr/SOURCEOFKNOWLEDGFORAI/tree/main/${LIBRARY_META[library].repo}`;
}

function formatLabel(item: VaultIndexItem): string {
  if (isRunnableKnowledge(item)) return 'Mã chạy';
  if (item.l === 'motionsites') return 'Trailer + prompt';
  if (item.l === 'glacier') return 'Nền video';
  return 'Demo gốc';
}

function FormatIcon({ item }: { item: VaultIndexItem }) {
  if (isRunnableKnowledge(item)) return <Code2 size={12} aria-hidden="true" />;
  if (item.l === 'motionsites') return <Film size={12} aria-hidden="true" />;
  if (item.l === 'glacier') return <Layers size={12} aria-hidden="true" />;
  return <ExternalLink size={12} aria-hidden="true" />;
}

export const KnowledgeView: React.FC<KnowledgeViewProps> = ({
  onOpenFeed,
  onOpenChat,
}) => {
  const { openExperience } = useAppStore();
  const cached = getCachedVaultIndex();
  const [items, setItems] = useState<VaultIndexItem[]>(cached?.items ?? []);
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState<string | null>(null);
  const [retryTick, setRetryTick] = useState(0);
  const [query, setQuery] = useState('');
  const [source, setSource] = useState<VaultLibraryKey | 'all'>('all');
  const [category, setCategory] = useState('all');
  const [runnableOnly, setRunnableOnly] = useState(false);
  const [visibleLimit, setVisibleLimit] = useState(PAGE_STEP);
  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchVaultIndex()
      .then((data) => {
        if (cancelled) return;
        setItems(data.items);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setError('Không tải được chỉ mục tri thức. Kiểm tra kết nối rồi thử lại.');
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [retryTick]);

  useEffect(() => {
    setVisibleLimit(PAGE_STEP);
  }, [deferredQuery, source, category, runnableOnly]);

  const counts = useMemo(() => {
    const bySource = {} as Record<VaultLibraryKey, number>;
    for (const library of SOURCE_ORDER) bySource[library] = 0;
    let runnable = 0;
    let trailers = 0;
    for (const item of items) {
      bySource[item.l] += 1;
      if (isRunnableKnowledge(item)) runnable += 1;
      if (item.l === 'motionsites' || item.l === 'glacier') trailers += 1;
    }
    return { bySource, runnable, trailers };
  }, [items]);

  const categoryOptions = useMemo(() => {
    const frequency = new Map<string, number>();
    for (const item of items) {
      if (source !== 'all' && item.l !== source) continue;
      frequency.set(item.c, (frequency.get(item.c) ?? 0) + 1);
    }
    return [...frequency.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'vi'))
      .slice(0, 10);
  }, [items, source]);

  const ranked = useMemo(() => {
    const pool = category === 'all'
      ? items
      : items.filter((item) => item.c === category);
    return rankKnowledge(pool, deferredQuery, {
      source,
      runnableOnly,
      limit: Number.MAX_SAFE_INTEGER,
    });
  }, [items, deferredQuery, source, category, runnableOnly]);

  const visible = ranked.results.slice(0, visibleLimit);
  const activeFilterCount =
    Number(Boolean(query.trim())) +
    Number(source !== 'all') +
    Number(category !== 'all') +
    Number(runnableOnly);

  const resetFilters = () => {
    setQuery('');
    setSource('all');
    setCategory('all');
    setRunnableOnly(false);
  };

  return (
    <div className="kn">
      <div className="wrap-wide kn-topline">
        <nav className="kn-modes" aria-label="Chế độ Tri thức">
          {MODE_ITEMS.map((entry) => (
            <button
              key={entry.id}
              type="button"
              aria-current={entry.id === 'knowledge' ? 'page' : undefined}
              className="kn-mode"
              onClick={() => {
                if (entry.id === 'feed') onOpenFeed();
                if (entry.id === 'chat') onOpenChat();
              }}
            >
              {entry.label}
            </button>
          ))}
        </nav>
        <a
          className="kn-repo-link"
          href="https://github.com/broamstuck-cybr/SOURCEOFKNOWLEDGFORAI"
          target="_blank"
          rel="noreferrer"
        >
          <Database size={13} aria-hidden="true" />
          SOURCEOFKNOWLEDGFORAI
          <ArrowUpRight size={12} aria-hidden="true" />
        </a>
      </div>

      <header className="wrap-wide kn-hero">
        <div className="kn-hero-copy">
          <span className="t-caps kn-kicker">Source of Knowledge · 6 nguồn</span>
          <h1 className="kn-title">
            Tìm mẫu thật.
            <br />
            <em>Chạy thử trước khi dùng.</em>
          </h1>
          <p className="kn-sub">
            Chỉ mục 8.322 bản ghi từ SOURCEOFKNOWLEDGFORAI, xếp hạng theo tiêu đề,
            thẻ, khả năng chạy và độ tin cậy của nguồn. Mở một kết quả là vào thẳng
            sân khấu trải nghiệm, không dừng ở ảnh xem trước.
          </p>
          <SearchCard
            value={query}
            onChange={setQuery}
            placeholder="Tìm hero glass, pricing table, shader, 3D scene..."
            recentSearches={COMMON_QUERIES}
            onSelectRecent={setQuery}
            className="kn-search"
          />
          <div className="kn-query-row" aria-label="Truy vấn nhanh">
            <span className="t-label">Thử:</span>
            {COMMON_QUERIES.slice(0, 5).map((term) => (
              <button
                key={term}
                type="button"
                className="kn-query"
                onClick={() => setQuery(term)}
              >
                {term}
              </button>
            ))}
          </div>
        </div>

        <dl className="kn-stats" aria-label="Thống kê kho tri thức">
          <div>
            <dt>Bản ghi</dt>
            <dd>{formatCount(items.length || 8322)}</dd>
          </div>
          <div>
            <dt>Mã chạy được</dt>
            <dd>{formatCount(counts.runnable)}</dd>
          </div>
          <div>
            <dt>Trailer / nền</dt>
            <dd>{formatCount(counts.trailers)}</dd>
          </div>
        </dl>
      </header>

      <div className="wrap-wide kn-workbench">
        <aside className="kn-rail" aria-label="Bộ lọc tri thức">
          <section className="kn-rail-block">
            <div className="kn-rail-head">
              <span className="t-caps">Nguồn</span>
              <span className="kn-rail-count">6</span>
            </div>
            <div className="kn-source-list">
              <button
                type="button"
                className="kn-source"
                aria-pressed={source === 'all'}
                onClick={() => {
                  setSource('all');
                  setCategory('all');
                }}
              >
                <span>Tất cả nguồn</span>
                <strong>{formatCount(items.length)}</strong>
              </button>
              {SOURCE_ORDER.map((library) => (
                <button
                  key={library}
                  type="button"
                  className="kn-source"
                  aria-pressed={source === library}
                  title={LIBRARY_META[library].note}
                  onClick={() => {
                    setSource(library);
                    setCategory('all');
                  }}
                >
                  <span>
                    {LIBRARY_META[library].name}
                    <small>{VAULT_LIBRARY_LABELS[library]}</small>
                  </span>
                  <strong>{formatCount(counts.bySource[library] ?? 0)}</strong>
                </button>
              ))}
            </div>
          </section>

          <section className="kn-rail-block">
            <div className="kn-rail-head">
              <span className="t-caps">Danh mục</span>
              {category !== 'all' && (
                <button
                  type="button"
                  className="kn-text-btn"
                  onClick={() => setCategory('all')}
                >
                  Bỏ chọn
                </button>
              )}
            </div>
            <div className="kn-category-list">
              {categoryOptions.map(([name, count]) => (
                <button
                  key={name}
                  type="button"
                  className="kn-category"
                  aria-pressed={category === name}
                  onClick={() => setCategory((prev) => (prev === name ? 'all' : name))}
                >
                  <span>{name}</span>
                  <strong>{count}</strong>
                </button>
              ))}
            </div>
          </section>

          <section className="kn-rail-block kn-rail-block--compact">
            <label className="kn-check">
              <input
                type="checkbox"
                checked={runnableOnly}
                onChange={(event) => setRunnableOnly(event.target.checked)}
              />
              <span>
                Chỉ mẫu có mã chạy
                <small>CodeFronts · LucianLabs · PinUI</small>
              </span>
            </label>
          </section>

          <section className="kn-rail-block kn-mechanism">
            <div className="kn-rail-head">
              <span className="t-caps">Cơ chế xếp hạng</span>
              <BookOpen size={14} aria-hidden="true" />
            </div>
            <ol>
              <li>Khớp cụm tiêu đề, sau đó mới đến thẻ và danh mục.</li>
              <li>Cộng điểm cho mẫu có mã chạy và nguồn đã kiểm định.</li>
              <li>Chỉ tải shard mã nguồn khi bạn mở một mẫu.</li>
            </ol>
            <p>
              Điểm 100 là kết quả khớp nhất trong truy vấn hiện tại, không phải
              điểm chất lượng tuyệt đối của mẫu.
            </p>
          </section>
        </aside>

        <main className="kn-main" aria-label="Kết quả tri thức">
          <div className="kn-results-head">
            <div>
              <span className="t-caps">Kết quả</span>
              <p className="kn-results-count">
                {formatCount(ranked.total)} bản ghi
                {query.trim() ? ` cho “${query.trim()}”` : ' trong chỉ mục'}
              </p>
            </div>
            <div className="kn-results-actions">
              {activeFilterCount > 0 && (
                <button type="button" className="kn-text-btn" onClick={resetFilters}>
                  Đặt lại {activeFilterCount} bộ lọc
                </button>
              )}
              <span className="kn-sort">Sắp theo độ khớp</span>
            </div>
          </div>

          {loading ? (
            <div className="kn-grid" aria-busy="true" aria-label="Đang tải chỉ mục">
              {Array.from({ length: 6 }).map((_, index) => (
                <div className="kn-skeleton" key={index}>
                  <span />
                  <span />
                  <span />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="kn-state" role="alert">
              <RotateCw size={22} aria-hidden="true" />
              <h2>Chưa mở được chỉ mục</h2>
              <p>{error}</p>
              <button
                type="button"
                className="btn btn-line btn-sm"
                onClick={() => setRetryTick((tick) => tick + 1)}
              >
                Thử lại
              </button>
            </div>
          ) : ranked.total === 0 ? (
            <div className="kn-state">
              <h2>Không có bản ghi khớp</h2>
              <p>Thử từ khóa ngắn hơn hoặc bỏ bộ lọc nguồn / danh mục.</p>
              <button type="button" className="btn btn-line btn-sm" onClick={resetFilters}>
                Xóa bộ lọc
              </button>
            </div>
          ) : (
            <>
              <div className="kn-grid">
                {visible.map(({ item, relevance, reasons }) => {
                  const sourceUrl = resolveOriginalLiveUrl(item.l, item.i);
                  return (
                    <article
                      key={`${item.l}-${item.i}`}
                      className="kn-card"
                      data-source={item.l}
                    >
                      <div className="kn-card-meta">
                        <span className="kn-card-source">
                          {LIBRARY_META[item.l].short}
                        </span>
                        <span
                          className="kn-score"
                          title={`Điểm khớp tương đối: ${relevance}/100`}
                        >
                          {relevance}
                        </span>
                      </div>

                      <button
                        type="button"
                        className="kn-card-hit"
                        onClick={() => openExperience(item.i)}
                        title={`Mở trải nghiệm ${item.t}`}
                      >
                        <h2>{item.t}</h2>
                        <p>{item.c}</p>
                      </button>

                      <div className="kn-tags">
                        {item.tg.slice(0, 3).map((tag) => (
                          <span key={tag}>#{tag}</span>
                        ))}
                      </div>

                      <div className="kn-card-foot">
                        <span className="kn-format">
                          <FormatIcon item={item} />
                          {formatLabel(item)}
                        </span>
                        <span className="kn-reason">{reasons[0]}</span>
                        <div className="kn-card-actions">
                          <a
                            href={sourceUrl || sourceSearchUrl(item.l)}
                            target="_blank"
                            rel="noreferrer"
                            className="kn-source-link"
                            aria-label={`Mở nguồn gốc của ${item.t}`}
                            title="Mở bản gốc"
                          >
                            <ExternalLink size={13} aria-hidden="true" />
                          </a>
                          <button
                            type="button"
                            className="kn-run"
                            onClick={() => openExperience(item.i)}
                          >
                            Chạy thử
                            <ArrowUpRight size={13} aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>

              {visible.length < ranked.total && (
                <div className="kn-more">
                  <button
                    type="button"
                    className="btn btn-line btn-sm"
                    onClick={() => setVisibleLimit((limit) => limit + PAGE_STEP)}
                  >
                    Tải thêm {Math.min(PAGE_STEP, ranked.total - visible.length)} bản ghi
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default KnowledgeView;
