import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Search, X } from 'lucide-react';
import { Chips, SearchCard, type ChipItem } from '../../components/pinui';
import type { ResourceGroup } from '../../types/index';
import { GROUP_LABEL } from './catalog';
import './resource-cabinet.css';

type CabinetTab = 'all' | ResourceGroup;

export interface CabinetResource {
  id: string;
  title: string;
  group: string;
  category: string;
  tags: string[];
  description: string;
}

export interface ResourceCabinetProps {
  open: boolean;
  resources: CabinetResource[];
  theme: 'dark' | 'light';
  onClose: () => void;
  onOpenResource?: (id: string) => void;
}

const MAX_TAGS = 6;

function groupLabelOf(group: string): string {
  return (GROUP_LABEL as Record<string, string>)[group] ?? group;
}

/**
 * Tủ hồ sơ tài nguyên — mỗi tài nguyên đúng một dòng, chỉ hiện tên.
 *
 * - Cột trái: nhóm tài nguyên (đếm theo nhóm).
 * - Thanh trên: bộ lọc thẻ riêng của tủ (Chips variant filter), cộng tìm kiếm nhanh.
 * - Mỗi dòng: một dòng duy nhất; tên quá dài bị rút gọn bằng ellipsis, phần
 *   mô tả chỉ hé ra khi rê chuột hoặc focus nên danh sách luôn phẳng.
 */
export const ResourceCabinet: React.FC<ResourceCabinetProps> = ({
  open,
  resources,
  theme,
  onClose,
  onOpenResource,
}) => {
  const reduced = Boolean(useReducedMotion());
  const [tab, setTab] = useState<CabinetTab>('all');
  const [tags, setTags] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const panelRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const groups = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of resources) counts.set(item.group, (counts.get(item.group) ?? 0) + 1);
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [resources]);

  const tagPool = useMemo(() => {
    const scope = tab === 'all' ? resources : resources.filter((item) => item.group === tab);
    const counts = new Map<string, number>();
    for (const item of scope) {
      for (const tag of item.tags) {
        if (/^(platform|tech|cost|level):/.test(tag)) continue;
        counts.set(tag, (counts.get(tag) ?? 0) + 1);
      }
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, MAX_TAGS)
      .map<ChipItem>(([tag, count]) => ({ id: tag, label: `${tag} · ${count}` }));
  }, [resources, tab]);

  useEffect(() => {
    setTags((prev) => prev.filter((tag) => tagPool.some((item) => item.id === tag)));
  }, [tagPool]);

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return resources.filter((item) => {
      if (tab !== 'all' && item.group !== tab) return false;
      if (tags.length && !tags.every((tag) => item.tags.includes(tag))) return false;
      if (!needle) return true;
      return `${item.title} ${item.category} ${item.description}`.toLowerCase().includes(needle);
    });
  }, [resources, tab, tags, query]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const focusTimer = window.setTimeout(() => searchRef.current?.focus(), reduced ? 0 : 240);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.clearTimeout(focusTimer);
    };
  }, [open, onClose, reduced]);

  if (!open) return null;

  return (
    <div className="cabinet-veil" data-theme={theme} onClick={onClose}>
      <motion.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Tủ hồ sơ tài nguyên"
        className="cabinet-panel"
        initial={reduced ? false : { opacity: 0, y: 24, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: reduced ? 0 : 0.28, ease: [0.22, 1, 0.36, 1] }}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="cabinet-head">
          <div className="cabinet-head-main">
            <h2 className="cabinet-title">Tủ hồ sơ tài nguyên</h2>
            <p className="cabinet-sub">
              Gom mọi thứ đang rải rác về một ngăn kéo: lọc theo nhóm, gắn thẻ cho vừa mắt, mỗi mục một dòng.
            </p>
          </div>
          <button type="button" className="cabinet-close" onClick={onClose} aria-label="Đóng tủ hồ sơ">
            <X size={16} aria-hidden="true" />
          </button>
        </header>

        <div className="cabinet-search">
          <Search size={15} aria-hidden="true" />
          <input
            ref={searchRef}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Gõ để lọc nhanh trong tủ…"
            aria-label="Tìm nhanh trong tủ hồ sơ"
          />
          {query ? (
            <button type="button" className="cabinet-clear" onClick={() => setQuery('')} aria-label="Xoá từ khoá">
              <X size={13} aria-hidden="true" />
            </button>
          ) : null}
        </div>

        <div className="cabinet-body">
          <nav className="cabinet-groups" aria-label="Nhóm tài nguyên">
            <button
              type="button"
              className="cabinet-group"
              aria-pressed={tab === 'all'}
              onClick={() => setTab('all')}
            >
              <span>Tất cả</span>
              <span className="cabinet-group-count">{resources.length}</span>
            </button>
            {groups.map(([group, count]) => (
              <button
                key={group}
                type="button"
                className="cabinet-group"
                aria-pressed={tab === group}
                onClick={() => setTab(group as CabinetTab)}
              >
                <span>{groupLabelOf(group)}</span>
                <span className="cabinet-group-count">{count}</span>
              </button>
            ))}
          </nav>

          <div className="cabinet-main">
            {tagPool.length ? (
              <div className="cabinet-tags">
                <Chips
                  items={tagPool}
                  selectedIds={tags}
                  onToggle={(id) =>
                    setTags((prev) => (prev.includes(id) ? prev.filter((tag) => tag !== id) : [...prev, id]))
                  }
                  multi
                  variant="filter"
                  theme={theme}
                  className="cabinet-pinui-chips"
                  aria-label="Lọc theo thẻ"
                />
                {tags.length ? (
                  <button type="button" className="cabinet-reset" onClick={() => setTags([])}>
                    Bỏ lọc thẻ
                  </button>
                ) : null}
              </div>
            ) : null}

            <div className="cabinet-rows" role="list">
              {rows.length ? (
                rows.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    role="listitem"
                    className="cabinet-row"
                    onClick={() => onOpenResource?.(item.id)}
                    title={item.description}
                  >
                    <span className="cabinet-row-name">{item.title}</span>
                    <span className="cabinet-row-meta">{groupLabelOf(item.group)}</span>
                  </button>
                ))
              ) : (
                <p className="cabinet-empty">
                  Không còn mục nào khớp thẻ đang chọn. Bỏ bớt một thẻ là danh sách giãn ra ngay.
                </p>
              )}
            </div>

            <footer className="cabinet-foot">
              <span>
                {rows.length} mục trong tủ · một dòng một mục, đúng như bạn cần
              </span>
            </footer>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ResourceCabinet;
