import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import type { SourceCatalogItem } from '../../types/index';
import { Media, previewFor } from '../../ui/Media';
import { LIBRARY_LABEL } from './catalog';

interface SpecimenSheetProps {
  item: SourceCatalogItem | null;
  position: number;
  total: number;
  saved: boolean;
  onClose: () => void;
  onStep: (delta: 1 | -1) => void;
  onToggleSave: (item: SourceCatalogItem) => void;
  onUse: (item: SourceCatalogItem) => void;
  onAttach: (item: SourceCatalogItem) => void;
  onCopyPath: (item: SourceCatalogItem) => void;
}

export const SpecimenSheet: React.FC<SpecimenSheetProps> = ({
  item,
  position,
  total,
  saved,
  onClose,
  onStep,
  onToggleSave,
  onUse,
  onAttach,
  onCopyPath,
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const isOpen = item !== null;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const root = document.documentElement;
    const gap = window.innerWidth - root.clientWidth;
    const previousOverflow = root.style.overflowY;
    const previousPadding = root.style.paddingRight;
    root.style.overflowY = 'hidden';
    if (gap > 0) root.style.paddingRight = `${gap}px`;
    return () => {
      root.style.overflowY = previousOverflow;
      root.style.paddingRight = previousPadding;
    };
  }, [isOpen]);

  const handleBackdrop = (event: React.MouseEvent<HTMLDialogElement>) => {
    if (event.target === event.currentTarget) event.currentTarget.close();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDialogElement>) => {
    if (event.key === 'ArrowRight' && position < total) {
      event.preventDefault();
      onStep(1);
    }
    if (event.key === 'ArrowLeft' && position > 1) {
      event.preventDefault();
      onStep(-1);
    }
  };

  const preview = item ? previewFor(item.id) : null;

  return (
    <dialog
      ref={dialogRef}
      className="ex-spec"
      aria-labelledby="ex-spec-title"
      onClose={onClose}
      onClick={handleBackdrop}
      onKeyDown={handleKeyDown}
    >
      {item ? (
        <div className="ex-spec-body">
          <div className="ex-spec-bar">
            <span className="t-label">{LIBRARY_LABEL[item.sourceLibrary]}</span>
            <span className="t-label">
              {position} / {total}
            </span>
            <button
              type="button"
              className="icon-btn"
              aria-label="Đóng"
              onClick={() => dialogRef.current?.close()}
            >
              <X size={20} aria-hidden="true" />
            </button>
          </div>
          <div className="ex-spec-stage">
            {preview ? (
              <Media key={item.id} preview={preview} title={item.title} fit="contain" />
            ) : (
              <div className="ex-spec-type">
                <span className="ex-spec-word">{item.title}</span>
                <span className="t-label">Mẫu này chưa có ảnh xem trước.</span>
              </div>
            )}
          </div>
          <div className="ex-spec-text">
            <h2 id="ex-spec-title" className="t-title ex-spec-title">
              {item.title}
            </h2>
            <p className="ex-spec-line">{item.description}</p>
            <dl className="ex-meta ex-meta-stack">
              <div>
                <dt>runtime</dt>
                <dd>{item.runtime}</dd>
              </div>
              <div>
                <dt>giấy phép</dt>
                <dd>{item.license}</dd>
              </div>
              <div>
                <dt>đường dẫn</dt>
                <dd>{item.archivePath}</dd>
              </div>
            </dl>
            <div className="ex-spec-actions">
              <button type="button" className="btn btn-solid" onClick={() => onUse(item)}>
                Dùng ngay
              </button>
              <button type="button" className="btn btn-line" onClick={() => onAttach(item)}>
                Đính kèm
              </button>
              <button
                type="button"
                className="btn btn-line"
                aria-pressed={saved}
                onClick={() => onToggleSave(item)}
              >
                {saved ? 'Đã lưu' : 'Lưu'}
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => onCopyPath(item)}>
                Chép đường dẫn
              </button>
              <a
                className="btn btn-ghost"
                href={item.officialUrl}
                target="_blank"
                rel="noreferrer noopener"
              >
                Mở nguồn
              </a>
            </div>
            <div className="ex-spec-step">
              <button
                type="button"
                className="ex-text"
                disabled={position <= 1}
                onClick={() => onStep(-1)}
              >
                Trước
              </button>
              <button
                type="button"
                className="ex-text"
                disabled={position >= total}
                onClick={() => onStep(1)}
              >
                Sau
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </dialog>
  );
};
