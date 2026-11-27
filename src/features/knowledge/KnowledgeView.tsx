import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { IconCheck, IconCode2, IconCopy, IconSearch, IconX } from '../../ui/icons';
import type { MotionRecipeItem } from '../../types/workspaceV4';
import { useAppStore } from '../../store/appStore';
import { copyText } from '../explore/catalog';
import { fetchMotionRecipes, getCachedMotionRecipes } from '../explore/vaultLoader';
import './knowledge.css';

type KnowledgeTab = 'techniques' | 'craft';
type CostFilter = 'all' | 'light' | 'medium' | 'heavy';

const COST_LABELS: Record<MotionRecipeItem['cost'], string> = {
  light: 'Nhẹ',
  medium: 'Vừa',
  heavy: 'Nặng',
};

const SHORT_CATEGORY_LABELS: Record<string, string> = {
  'Video & Nền chuyển động': 'Video & Nền',
  'Bề mặt & Nút tương tác': 'Bề mặt & Nút',
  'Chữ & Chuyển động chữ': 'Chữ động',
  'Chiều sâu & Tương tác chuột': 'Chiều sâu',
  'Cuộn trang kể chuyện': 'Cuộn trang',
  'Bố cục & Điều hướng': 'Bố cục',
  '3D & WebGL': '3D & WebGL',
};

interface CraftRuleGroup {
  id: string;
  num: string;
  title: string;
  points: string[];
  avoid: string;
}

const CRAFT_RULES: CraftRuleGroup[] = [
  {
    id: 'type',
    num: '01 / KIỂU CHỮ',
    title: 'Phân cấp chữ rõ ràng, đủ dấu tiếng Việt',
    points: [
      'Khóa tối đa 2 họ font (hiển thị + giao diện), thêm 1 font mono riêng cho mã và số liệu.',
      'Chữ thân bài tối thiểu 16px, khoảng rộng dòng 45–75 ký tự, đặt text-wrap: balance cho tiêu đề.',
      'Dùng font-variant-numeric: tabular-nums cho mọi bảng đếm, giá tiền và mốc thời gian.',
    ],
    avoid: 'Tránh nhồi 4–5 kiểu chữ hoặc viết hoa toàn bộ đoạn nội dung dài.',
  },
  {
    id: 'color',
    num: '02 / MÀU SẮC',
    title: 'Một màu nhấn chủ đạo, tương phản chuẩn AA',
    points: [
      'Tối đa 2–3 màu trung tính cho nền/bề mặt và 1 màu nhấn chiếm dưới 5% khung nhìn.',
      'Chữ nội dung đạt tương phản tối thiểu 4.5:1; nút, viền ô nhập và icon đạt từ 3:1 trở lên.',
      'Khai báo toàn bộ màu bằng biến :root để chuyển mượt giữa nền tối và nền sáng.',
    ],
    avoid: 'Cấm gradient tím-xanh kiểu AI mặc định và bóng phát sáng loang lổ trên nền tối.',
  },
  {
    id: 'surface',
    num: '03 / BỀ MẶT & BO GÓC',
    title: 'Bo góc đồng tâm và cấu trúc phẳng gọn',
    points: [
      'Giữ nhịp khoảng trắng theo bội số 8px (4, 8, 12, 16, 24, 32, 48, 64px).',
      'Thẻ lồng nhau tuân theo công thức outer_radius = inner_radius + padding để góc cong đều.',
      'Bọc vùng bo góc bằng overflow: hidden và giữ mặt phân cấp sạch, không hở viền thừa.',
    ],
    avoid: 'Không lồng thẻ có viền nằm trong một thẻ có viền khác, không lạm dụng blur trên mọi khung.',
  },
  {
    id: 'motion',
    num: '04 / CHUYỂN ĐỘNG',
    title: 'Mượt 60fps và tôn trọng giảm chuyển động',
    points: [
      'Chỉ animate thuộc tính GPU gồm transform, opacity và clip-path; không dùng transition: all.',
      'Giữ nhịp thời lượng ngắn gọn: 120ms cho nhấn nút, 220ms cho hover, 420ms cho hộp thoại.',
      'Mọi chuyển động bắt buộc có nhánh @media (prefers-reduced-motion: reduce) giữ đủ nội dung.',
    ],
    avoid: 'Không đặt chấm tròn nhấp nháy vô hạn hay vòng lặp chạy nền không có nút dừng.',
  },
  {
    id: 'controls',
    num: '05 / ĐIỀU KHIỂN & COPY',
    title: 'Nút ngắn gọn, văn phong trực diện',
    points: [
      'Tác vụ phổ thông (tìm kiếm, đóng, chép, đổi giao diện) dùng icon SVG + aria-label.',
      'Nút có chữ dài tối đa 1–3 từ bằng động từ trực tiếp; mỗi hành động chỉ nằm ở 1 vị trí.',
      'Mọi màn hình có dữ liệu đều cài đủ 4 trạng thái: Đang tải, Trống, Lỗi có nút thử lại, Có dữ liệu.',
    ],
    avoid: 'Cấm văn phong khoa trương, cấm chữ giả Latinh, số liệu bịa hoặc emoji thay cho icon.',
  },
  {
    id: 'responsive',
    num: '06 / ĐA MÀN HÌNH',
    title: 'Chạy gọn trên 390px, 768px và 1440px',
    points: [
      'Đặt overflow-x: clip ở cấp trang và min-width: 0 cho phần tử con bên trong Grid/Flex.',
      'Mọi nút bấm và liên kết đảm bảo vùng chạm tối thiểu 44×44px để bấm thoải mái trên điện thoại.',
      'Bảng dữ liệu và khối mã cuộn ngang độc lập trong khung riêng, không đẩy vỡ toàn trang.',
    ],
    avoid: 'Không bóp nhỏ giao diện desktop xuống điện thoại hoặc dùng 100vh cứng gây kẹt thanh cuộn.',
  },
];

function cleanRecipeSummary(raw: string): string {
  return raw
    .replace(/\*\*What\s*\/\s*when:\*\*/gi, '')
    .replace(/\*\*Premium parameters(?:\s*\/\s*variants)?:\*\*/gi, '')
    .replace(/\*\*Premium parameters(?:\s*\/\s*variants)?\*\*/gi, '')
    .replace(/\*\*/g, '')
    .replace(/`/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export const KnowledgeView: React.FC = () => {
  const { openInWorkspace, recordSignal, addToast } = useAppStore();
  const [tab, setTab] = useState<KnowledgeTab>('techniques');
  const [recipes, setRecipes] = useState<MotionRecipeItem[]>(() => getCachedMotionRecipes() ?? []);
  const [loading, setLoading] = useState(() => !getCachedMotionRecipes());
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<string>('all');
  const [cost, setCost] = useState<CostFilter>('all');
  const [search, setSearch] = useState('');
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadRecipes = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchMotionRecipes()
      .then((list) => {
        setRecipes(list);
        setLoading(false);
      })
      .catch(() => {
        setError('Không tải được danh sách 58 kỹ thuật chuyển động.');
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (recipes.length > 0) {
      setLoading(false);
      return;
    }
    loadRecipes();
  }, [loadRecipes, recipes.length]);

  const categories = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of recipes) {
      map.set(item.category, (map.get(item.category) ?? 0) + 1);
    }
    return Array.from(map.entries()).map(([name, count]) => ({ name, count }));
  }, [recipes]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return recipes.filter((item) => {
      if (category !== 'all' && item.category !== category) return false;
      if (cost !== 'all' && item.cost !== cost) return false;
      if (!q) return true;
      const hay = `${item.title} ${item.category} ${item.useWhen} ${item.summary} ${item.file}`.toLowerCase();
      return hay.includes(q);
    });
  }, [recipes, category, cost, search]);

  const handleCopyCode = async (item: MotionRecipeItem) => {
    const ok = await copyText(item.code);
    if (ok) {
      setCopiedId(item.id);
      window.setTimeout(() => {
        setCopiedId((prev) => (prev === item.id ? null : prev));
      }, 1800);
      addToast({ type: 'success', title: 'Đã chép đoạn mã', message: item.title });
    } else {
      addToast({ type: 'error', title: 'Không chép được đoạn mã' });
    }
  };

  const handleApplyToWorkspace = (item: MotionRecipeItem) => {
    recordSignal(item.id, 'use', 'motionsites');
    openInWorkspace({
      kind: 'motion-recipe',
      id: item.id,
      title: item.title,
      sourceLibrary: `Kỹ thuật · ${item.category}`,
      prompt: `Áp dụng kỹ thuật "${item.title}" (${item.category}, mức tải ${COST_LABELS[item.cost]}) vào trang web hiện tại. Khi dùng: ${item.useWhen}. Giữ mượt 60fps và có nhánh prefers-reduced-motion.`,
      sourceCode: item.code,
    });
  };

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <section className="kn" aria-label="Sổ tay Tri thức và Kỹ thuật chuyển động">
      <div className="kn-bar">
        <div className="kn-subtabs" role="tablist" aria-label="Mục tri thức">
          <button
            type="button"
            role="tab"
            className="kn-subtab"
            aria-selected={tab === 'techniques'}
            onClick={() => setTab('techniques')}
          >
            58 kỹ thuật
          </button>
          <button
            type="button"
            role="tab"
            className="kn-subtab"
            aria-selected={tab === 'craft'}
            onClick={() => setTab('craft')}
          >
            Quy chuẩn UI
          </button>
        </div>

        {tab === 'techniques' ? (
          <div className="kn-controls">
            <label className="kn-search">
              <IconSearch size={16} aria-hidden="true" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm kỹ thuật, cuộn trang, nút, video..."
                aria-label="Tìm kỹ thuật chuyển động"
              />
              {search ? (
                <button
                  type="button"
                  className="icon-btn"
                  style={{ width: 28, height: 28, minWidth: 28, minHeight: 28 }}
                  aria-label="Xóa từ khóa"
                  title="Xóa"
                  onClick={() => setSearch('')}
                >
                  <IconX size={14} aria-hidden="true" />
                </button>
              ) : null}
            </label>

            <div className="kn-cost-group" role="group" aria-label="Lọc theo mức tải">
              {(['all', 'light', 'medium', 'heavy'] as CostFilter[]).map((level) => (
                <button
                  key={level}
                  type="button"
                  className="kn-cost-btn"
                  aria-pressed={cost === level}
                  onClick={() => setCost(level)}
                >
                  {level === 'all' ? 'Mọi mức' : COST_LABELS[level]}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {tab === 'techniques' ? (
        <>
          <div className="kn-cats" role="group" aria-label="Nhóm kỹ thuật">
            <button
              type="button"
              className="kn-cat-pill"
              aria-pressed={category === 'all'}
              onClick={() => setCategory('all')}
            >
              <span>Tất cả</span>
              <span className="kn-cat-count">{recipes.length}</span>
            </button>
            {categories.map((cat) => (
              <button
                key={cat.name}
                type="button"
                className="kn-cat-pill"
                aria-pressed={category === cat.name}
                onClick={() => setCategory(cat.name)}
              >
                <span>{SHORT_CATEGORY_LABELS[cat.name] ?? cat.name}</span>
                <span className="kn-cat-count">{cat.count}</span>
              </button>
            ))}
          </div>

          {loading ? (
            <div className="kn-grid" aria-busy="true" aria-label="Đang tải kỹ thuật">
              {Array.from({ length: 6 }, (_, idx) => (
                <div key={idx} className="kn-skeleton-card" />
              ))}
            </div>
          ) : error ? (
            <div className="kn-state" role="alert">
              <p className="t-lead">{error}</p>
              <button type="button" className="btn btn-line" onClick={loadRecipes}>
                Thử lại
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="kn-state">
              <p className="t-lead">Không có kỹ thuật nào khớp từ khóa hoặc bộ lọc hiện tại.</p>
              <button
                type="button"
                className="btn btn-line"
                onClick={() => {
                  setCategory('all');
                  setCost('all');
                  setSearch('');
                }}
              >
                Đặt lại bộ lọc
              </button>
            </div>
          ) : (
            <div className="kn-grid">
              {filtered.map((item) => {
                const showCode = Boolean(expandedIds[item.id]);
                const copied = copiedId === item.id;
                const summary = cleanRecipeSummary(item.summary);

                return (
                  <article key={item.id} className="kn-card">
                    <div className="flex flex-col gap-2.5 min-w-0">
                      <div className="kn-card-top">
                        <span className="kn-card-cat">{item.category}</span>
                        <span className="kn-cost-tag" data-cost={item.cost}>
                          {COST_LABELS[item.cost]}
                        </span>
                      </div>
                      <h3 className="kn-card-title">{item.title}</h3>
                      {item.useWhen ? <p className="kn-card-when">Khi dùng: {item.useWhen}</p> : null}
                      {summary ? <p className="kn-card-summary">{summary}</p> : null}

                      {showCode && item.code ? (
                        <figure className="kn-code">
                          <figcaption className="kn-code-bar">
                            <span className="kn-code-badge">{item.lang || 'code'}</span>
                            <span className="kn-code-file">{item.file}</span>
                            <button
                              type="button"
                              className="kn-code-copy"
                              data-copied={copied ? 'true' : undefined}
                              aria-label={copied ? 'Đã chép mã' : `Chép mã ${item.title}`}
                              title={copied ? 'Đã chép' : 'Chép mã'}
                              onClick={() => void handleCopyCode(item)}
                            >
                              {copied ? (
                                <IconCheck size={15} aria-hidden="true" />
                              ) : (
                                <IconCopy size={15} aria-hidden="true" />
                              )}
                            </button>
                          </figcaption>
                          <pre className="kn-code-pre">
                            <code>{item.code}</code>
                          </pre>
                        </figure>
                      ) : null}
                    </div>

                    <div className="kn-card-foot">
                      <button
                        type="button"
                        className="kn-toggle-code"
                        aria-expanded={showCode}
                        onClick={() => toggleExpand(item.id)}
                      >
                        <IconCode2 size={15} aria-hidden="true" />
                        <span>{showCode ? 'Ẩn mã' : 'Xem mã'}</span>
                      </button>

                      <button
                        type="button"
                        className="kn-apply-btn"
                        onClick={() => handleApplyToWorkspace(item)}
                      >
                        Áp dụng
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </>
      ) : (
        <div className="kn-rules-grid">
          {CRAFT_RULES.map((rule) => (
            <article key={rule.id} className="kn-rule-card">
              <span className="kn-rule-num">{rule.num}</span>
              <h3 className="kn-rule-title">{rule.title}</h3>
              <ul className="kn-rule-list">
                {rule.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
              <p className="kn-rule-avoid">
                <strong>Cần tránh:</strong> {rule.avoid}
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};

export default KnowledgeView;
