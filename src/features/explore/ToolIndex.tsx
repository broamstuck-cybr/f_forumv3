import React, { useMemo, useState } from 'react';
import type { ResourceGroup, ResourceItem, VerificationStatus } from '../../types/index';
import { useAppStore } from '../../store/appStore';
import { GROUP_LABEL, GROUP_ORDER, formatDate, matchesQuery, resourceContext } from './catalog';

interface ToolIndexProps {
  query: string;
  onClearQuery: () => void;
}

const STATUS_LABEL: Record<VerificationStatus, string> = {
  verified_tested: 'đã thử',
  verified_info: 'đã đối chiếu',
  unverified: 'chưa đối chiếu',
};

export const ToolIndex: React.FC<ToolIndexProps> = ({ query, onClearQuery }) => {
  const { resourceLibrary, savedItemIds, toggleSavedItem, openInWorkspace } = useAppStore();
  const [openGroup, setOpenGroup] = useState<ResourceGroup>(GROUP_ORDER[0]);

  const groups = useMemo(
    () =>
      GROUP_ORDER.map((group) => ({
        group,
        entries: resourceLibrary.filter(
          (item: ResourceItem) =>
            item.group === group &&
            matchesQuery(query, [item.title, item.description, item.category, item.group, ...item.tags])
        ),
      })),
    [resourceLibrary, query]
  );

  const total = groups.reduce((sum, entry) => sum + entry.entries.length, 0);
  const active =
    groups.find((entry) => entry.group === openGroup && entry.entries.length > 0) ??
    groups.find((entry) => entry.entries.length > 0) ??
    null;

  if (!active) {
    return (
      <div className="wrap-wide ex-empty">
        <p className="ex-empty-line">
          {query ? `Không có công cụ nào khớp “${query}”.` : 'Chưa có công cụ nào trong mục lục.'}
        </p>
        {query ? (
          <button type="button" className="ex-text" onClick={onClearQuery}>
            Xóa tìm
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
      <div className="ex-idx" style={{ '--ex-rows': `repeat(${groups.length}, auto) 1fr` } as React.CSSProperties}>
        {groups.map(({ group, entries }) => {
          const isOpen = active.group === group;
          return (
            <div className="ex-idx-group" key={group}>
              <h2 className="ex-idx-head">
                <button
                  type="button"
                  className="ex-idx-toggle"
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
                <ul id="ex-idx-panel" className="ex-idx-panel" aria-label={GROUP_LABEL[group]}>
                  {entries.map((item) => {
                    const saved = savedItemIds.includes(item.id);
                    return (
                      <li className="ex-row" key={item.id}>
                        <div className="ex-row-main">
                          <h3 className="ex-row-title">{item.title}</h3>
                          <p className="ex-row-line">{item.description}</p>
                          <dl className="ex-meta">
                            <div>
                              <dt>loại</dt>
                              <dd>{item.category}</dd>
                            </div>
                            <div>
                              <dt>giấy phép</dt>
                              <dd>{item.license}</dd>
                            </div>
                            <div>
                              <dt>{STATUS_LABEL[item.status]}</dt>
                              <dd>{formatDate(item.lastVerified)}</dd>
                            </div>
                          </dl>
                        </div>
                        <div className="ex-row-actions">
                          <a
                            className="ex-text"
                            href={item.officialUrl}
                            target="_blank"
                            rel="noreferrer noopener"
                          >
                            Mở nguồn
                          </a>
                          <button
                            type="button"
                            className="ex-text"
                            aria-pressed={saved}
                            onClick={() => toggleSavedItem(item.id)}
                          >
                            {saved ? 'Đã lưu' : 'Lưu'}
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
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
};
