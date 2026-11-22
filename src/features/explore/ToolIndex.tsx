import React, { useEffect, useMemo, useState } from 'react';
import type { ResourceGroup, ResourceItem, VerificationStatus } from '../../types/index';
import { useAppStore } from '../../store/appStore';
import {
  GROUP_LABEL,
  GROUP_ORDER,
  formatDate,
  matchesQuery,
  resourceContext,
  sanitizeBrandText,
} from './catalog';
import { ReactionBar } from './SpecimenSheet';

interface ToolIndexProps {
  query: string;
  onClearQuery: () => void;
  savedOnly: boolean;
  onShowAll: () => void;
  onToggleSavedOnly: () => void;
}

type StatusFilter = 'all' | VerificationStatus;

function shortCategoryLabel(category: string): string {
  return category.split(/[\/&]/)[0].trim().split(/\s+/).slice(0, 2).join(' ');
}

const STATUS_BADGE: Record<VerificationStatus, string> = {
  verified_tested: 'Đã kiểm thử',
  verified_info: 'Thông tin xác thực',
  unverified: 'Chưa đối chiếu',
};

const STATUS_CLASS: Record<VerificationStatus, string> = {
  verified_tested: 'ex-badge-tested',
  verified_info: 'ex-badge-info',
  unverified: 'ex-badge-muted',
};

export const ToolIndex: React.FC<ToolIndexProps> = ({ query, onClearQuery, savedOnly, onShowAll, onToggleSavedOnly }) => {
  const {
    resourceLibrary,
    savedItemIds,
    attachItemToWorkspace,
    openInWorkspace,
    activeProject,
    addToast,
  } = useAppStore();
  const [openGroup, setOpenGroup] = useState<ResourceGroup>(GROUP_ORDER[0]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [catFilter, setCatFilter] = useState<string>('all');

  useEffect(() => {
    setCatFilter('all');
  }, [openGroup]);

  const savedToolCount = useMemo(
    () => resourceLibrary.filter((item) => savedItemIds.includes(item.id)).length,
    [resourceLibrary, savedItemIds]
  );

  const groups = useMemo(
    () =>
      GROUP_ORDER.map((group) => ({
        group,
        entries: resourceLibrary.filter(
          (item: ResourceItem) =>
            item.group === group &&
            (!savedOnly || savedItemIds.includes(item.id)) &&
            matchesQuery(query, [
              sanitizeBrandText(item.title),
              sanitizeBrandText(item.description),
              item.category,
              item.group,
              ...item.tags,
            ])
        ),
      })),
    [resourceLibrary, query, savedOnly, savedItemIds]
  );

  const total = groups.reduce((sum, entry) => sum + entry.entries.length, 0);
  const active =
    groups.find((entry) => entry.group === openGroup && entry.entries.length > 0) ??
    groups.find((entry) => entry.entries.length > 0) ??
    null;

  const subCategories = useMemo(() => {
    if (!active) return [];
    const seen = new Set<string>();
    for (const item of active.entries) {
      if (item.category) seen.add(item.category);
    }
    return Array.from(seen).slice(0, 6);
  }, [active]);

  const filteredEntries = useMemo(() => {
    if (!active) return [];
    return active.entries.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (catFilter !== 'all' && item.category !== catFilter) return false;
      return true;
    });
  }, [active, statusFilter, catFilter]);

  const handleAttach = (item: ResourceItem) => {
    const title = sanitizeBrandText(item.title);
    if (activeProject.attachedItems.some((attached) => attached.id === item.id)) {
      addToast({ type: 'info', title: 'Đã đính kèm từ trước', message: title });
      return;
    }
    attachItemToWorkspace(resourceContext(item));
  };

  if (!active) {
    return (
      <div className="wrap-wide ex-empty">
        <p className="ex-empty-line">
          {savedOnly
            ? 'Chưa có công cụ nào được lưu.'
            : query
              ? `Không có công cụ nào khớp “${query}”.`
              : 'Chưa có công cụ nào trong mục lục.'}
        </p>
        {query || savedOnly ? (
          <button
            type="button"
            className="ex-text"
            onClick={() => {
              onClearQuery();
              onShowAll();
            }}
          >
            Xem tất cả
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="wrap-wide">
      <p className="sr-only" role="status">
        {query ? `${total} công cụ khớp` : ''}
      </p>

      <div className="ex-tool-lead">
        <div className="ex-filter" role="group" aria-label="Lọc trạng thái kiểm chứng">
          <button
            type="button"
            className="ex-text"
            aria-pressed={statusFilter === 'all'}
            onClick={() => setStatusFilter('all')}
          >
            Tất cả
          </button>
          <button
            type="button"
            className="ex-text"
            aria-pressed={statusFilter === 'verified_tested'}
            onClick={() => setStatusFilter('verified_tested')}
          >
            Đã thử
          </button>
          <button
            type="button"
            className="ex-text"
            aria-pressed={statusFilter === 'verified_info'}
            onClick={() => setStatusFilter('verified_info')}
          >
            Xác thực
          </button>
          <button
            type="button"
            className="ex-text"
            aria-pressed={savedOnly}
            onClick={onToggleSavedOnly}
          >
            Đã lưu ({savedToolCount})
          </button>
        </div>
        <p className="t-label">
          {total} tài nguyên đã rà soát · {groups[0].entries.length} công cụ AI nổi bật
        </p>
      </div>

      <div
        className="ex-idx"
        style={{ '--ex-rows': `repeat(${groups.length}, auto) 1fr` } as React.CSSProperties}
      >
        {groups.map(({ group, entries }) => {
          const isOpen = active.group === group;
          const isHeroGroup = group === 'AI Tools';
          return (
            <div className="ex-idx-group" key={group}>
              <h2 className="ex-idx-head">
                <button
                  type="button"
                  className={`ex-idx-toggle${isHeroGroup ? ' ex-idx-toggle-lead' : ''}`}
                  aria-expanded={isOpen}
                  aria-controls={isOpen ? 'ex-idx-panel' : undefined}
                  disabled={entries.length === 0}
                  onClick={() => setOpenGroup(group)}
                >
                  <span className="ex-idx-word">{GROUP_LABEL[group]}</span>
                  <span className="t-label">{entries.length}</span>
                </button>
              </h2>
              {isOpen ? (
                <div id="ex-idx-panel" className="ex-idx-panel">
                  {subCategories.length > 1 ? (
                    <div className="ex-subfilter" role="group" aria-label="Lọc theo phân loại">
                      <button
                        type="button"
                        className="ex-pill"
                        aria-pressed={catFilter === 'all'}
                        onClick={() => setCatFilter('all')}
                      >
                        Tất cả
                      </button>
                      {subCategories.map((category) => (
                        <button
                          key={category}
                          type="button"
                          className="ex-pill"
                          aria-pressed={catFilter === category}
                          onClick={() => setCatFilter(category)}
                        >
                          {shortCategoryLabel(category)}
                        </button>
                      ))}
                    </div>
                  ) : null}

                  {filteredEntries.length > 0 ? (
                    <ul className="ex-idx-list" aria-label={GROUP_LABEL[group]}>
                      {filteredEntries.map((item) => {
                        const title = sanitizeBrandText(item.title);
                        const description = sanitizeBrandText(item.description);
                        const snippet = sanitizeBrandText(item.snippet);
                        return (
                          <li className="ex-row" key={item.id}>
                            <div className="ex-row-main">
                              <div className="ex-row-top">
                                <h3 className="ex-row-title">{title}</h3>
                                <span className={`ex-badge ${STATUS_CLASS[item.status]}`}>
                                  {STATUS_BADGE[item.status]}
                                </span>
                              </div>
                              <p className="ex-row-line">{description}</p>
                              {snippet ? (
                                <pre className="ex-snippet-mini">
                                  <code>{snippet}</code>
                                </pre>
                              ) : null}
                              <dl className="ex-meta">
                                <div>
                                  <dt>loại</dt>
                                  <dd>{item.category}</dd>
                                </div>
                                <div>
                                  <dt>tương thích</dt>
                                  <dd>{item.compatibility}</dd>
                                </div>
                                <div>
                                  <dt>kiểm tra</dt>
                                  <dd>{formatDate(item.lastVerified)}</dd>
                                </div>
                              </dl>
                            </div>
                            <div className="ex-row-actions">
                              <ReactionBar id={item.id} title={title} showLabel />
                              <button
                                type="button"
                                className="ex-text"
                                onClick={() => handleAttach(item)}
                              >
                                Đính kèm
                              </button>
                              <button
                                type="button"
                                className="ex-text"
                                onClick={() => openInWorkspace(resourceContext(item))}
                              >
                                Dùng ngay
                              </button>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <div className="ex-empty">
                      <p className="ex-empty-line">Không có mục nào khớp bộ lọc hiện tại.</p>
                      <button
                        type="button"
                        className="ex-text"
                        onClick={() => {
                          setStatusFilter('all');
                          setCatFilter('all');
                        }}
                      >
                        Đặt lại
                      </button>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
};
