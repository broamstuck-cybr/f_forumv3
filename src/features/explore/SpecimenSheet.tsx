import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import type { SourceCatalogItem } from '../../types/index';
import { previewFor } from '../../ui/Media';
import { useAppStore } from '../../store/appStore';
import {
  LIBRARY_LABEL,
  copyText,
  sanitizeBrandText,
  sanitizeSnippetCode,
  whiteLabelArchivePath,
  type PreviewTheme,
  type PreviewViewport,
} from './catalog';
import { SandboxPreview } from './SandboxPreview';
import { SpecimenMedia } from './SpecimenMedia';

interface SpecimenSheetProps {
  item: SourceCatalogItem | null;
  position: number;
  total: number;
  onClose: () => void;
  onStep: (delta: 1 | -1) => void;
  onExperience: (item: SourceCatalogItem) => void;
  onUse: (item: SourceCatalogItem) => void;
  onAttach: (item: SourceCatalogItem) => void;
}

type CodeTab = 'html' | 'css' | 'spec';

const VIEWPORTS: PreviewViewport[] = [390, 768, 1440];

interface ReactionBarProps {
  id: string;
  title: string;
  showLabel?: boolean;
  className?: string;
}

export const ReactionBar: React.FC<ReactionBarProps> = ({ id, title, showLabel = false, className }) => {
  const { savedItemIds, toggleSavedItem, toggleLikedItem, isItemLiked, getHeartCount } = useAppStore();
  const liked = isItemLiked(id);
  const saved = savedItemIds.includes(id);
  return (
    <span className={`ex-react${className ? ` ${className}` : ''}`}>
      <button
        type="button"
        className="ex-react-btn"
        aria-pressed={liked}
        aria-label={`${liked ? 'Bỏ tim' : 'Thả tim'} ${title}`}
        onClick={() => toggleLikedItem(id)}
      >
        <span className="ex-heart-dot" aria-hidden="true" />
        <span className="ex-react-num">{getHeartCount(id)}</span>
      </button>
      <button
        type="button"
        className="ex-react-btn"
        aria-pressed={saved}
        aria-label={`${saved ? 'Bỏ lưu' : 'Lưu'} ${title}`}
        onClick={() => toggleSavedItem(id)}
      >
        <span className="ex-mark-dot" aria-hidden="true" />
        {showLabel ? <span>{saved ? 'Đã lưu' : 'Lưu'}</span> : null}
      </button>
    </span>
  );
};

export const SpecimenSheet: React.FC<SpecimenSheetProps> = ({
  item,
  position,
  total,
  onClose,
  onStep,
  onExperience,
  onUse,
  onAttach,
}) => {
  const { theme, addToast } = useAppStore();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [viewport, setViewport] = useState<PreviewViewport>(1440);
  const [stageTheme, setStageTheme] = useState<PreviewTheme>(theme);
  const [nonce, setNonce] = useState(0);
  const [codeOpen, setCodeOpen] = useState(false);
  const [codeTab, setCodeTab] = useState<CodeTab>('html');

  const isOpen = item !== null;

  useEffect(() => {
    setStageTheme(theme);
  }, [theme]);

  useEffect(() => {
    if (!item) return;
    setNonce((n) => n + 1);
    setCodeTab(item.previewHtml ? 'html' : 'spec');
  }, [item?.id]);

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
  const hasLiveCode = Boolean(item?.previewHtml);
  const safeTitle = item ? sanitizeBrandText(item.title) : '';
  const safeDesc = item ? sanitizeBrandText(item.description) : '';
  const safeHtml = item ? sanitizeSnippetCode(item.previewHtml) : '';
  const safeCss = item ? sanitizeSnippetCode(item.previewCss) : '';
  const safeSpec = item
    ? sanitizeBrandText(item.promptSpec) ||
      `${safeTitle}\nNhóm: ${LIBRARY_LABEL[item.sourceLibrary]}\nRuntime: ${item.runtime}\nPhong cách: ${item.style}\n\n${safeDesc}`
    : '';
  const activeCode = codeTab === 'html' ? safeHtml : codeTab === 'css' ? safeCss : safeSpec;

  const handleCopyCode = async () => {
    if (!activeCode) return;
    const ok = await copyText(activeCode);
    addToast(
      ok
        ? { type: 'success', title: 'Đã chép mã', message: safeTitle }
        : { type: 'error', title: 'Không chép được', message: safeTitle }
    );
  };

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
            {hasLiveCode ? (
              <div className="ex-stage-controls" role="group" aria-label="Khung chạy thử">
                {VIEWPORTS.map((vp) => (
                  <button
                    key={vp}
                    type="button"
                    className="ex-text"
                    aria-pressed={viewport === vp}
                    onClick={() => setViewport(vp)}
                  >
                    {vp}
                  </button>
                ))}
                <button
                  type="button"
                  className="ex-text"
                  aria-pressed={stageTheme === 'dark'}
                  onClick={() => setStageTheme('dark')}
                >
                  Mực
                </button>
                <button
                  type="button"
                  className="ex-text"
                  aria-pressed={stageTheme === 'light'}
                  onClick={() => setStageTheme('light')}
                >
                  Giấy
                </button>
                <button
                  type="button"
                  className="ex-text"
                  onClick={() => setNonce((n) => n + 1)}
                >
                  Chạy lại
                </button>
              </div>
            ) : null}
            <button
              type="button"
              className="icon-btn"
              aria-label="Đóng"
              onClick={() => dialogRef.current?.close()}
            >
              <X size={20} aria-hidden="true" />
            </button>
          </div>
          <div className={`ex-spec-stage${stageTheme === 'light' ? ' ex-stage-paper' : ''}`}>
            {hasLiveCode ? (
              <SandboxPreview
                title={safeTitle}
                html={item.previewHtml ?? ''}
                css={item.previewCss ?? ''}
                theme={stageTheme}
                viewport={viewport}
                nonce={nonce}
              />
            ) : preview ? (
              <SpecimenMedia
                key={item.id}
                preview={preview}
                title={safeTitle}
                fallbackLabel={LIBRARY_LABEL[item.sourceLibrary]}
                fit="contain"
                activePlay
              />
            ) : (
              <div className="ex-spec-type">
                <span className="ex-spec-word">{safeTitle}</span>
                <span className="t-label">{LIBRARY_LABEL[item.sourceLibrary]}</span>
              </div>
            )}
          </div>
          <div className="ex-spec-text">
            <h2 id="ex-spec-title" className="t-title ex-spec-title">
              {safeTitle}
            </h2>
            <p className="ex-spec-line">{safeDesc}</p>
            <dl className="ex-meta ex-meta-stack">
              <div>
                <dt>runtime</dt>
                <dd>{item.runtime}</dd>
              </div>
              <div>
                <dt>phong cách</dt>
                <dd>{item.style}</dd>
              </div>
              <div>
                <dt>giấy phép</dt>
                <dd>{sanitizeBrandText(item.license)}</dd>
              </div>
              <div>
                <dt>mã mẫu</dt>
                <dd>{whiteLabelArchivePath(item)}</dd>
              </div>
            </dl>
            <div className="ex-spec-actions">
              <button type="button" className="btn btn-solid" onClick={() => onExperience(item)}>
                Trải nghiệm
              </button>
              <button type="button" className="btn btn-line" onClick={() => onUse(item)}>
                Dùng ngay
              </button>
              <button type="button" className="btn btn-line" onClick={() => onAttach(item)}>
                Đính kèm
              </button>
              <ReactionBar id={item.id} title={safeTitle} showLabel />
              <button
                type="button"
                className="btn btn-ghost"
                aria-expanded={codeOpen}
                onClick={() => setCodeOpen((prev) => !prev)}
              >
                {codeOpen ? 'Ẩn mã' : 'Xem mã'}
              </button>
            </div>
            {codeOpen ? (
              <div className="ex-code-drawer">
                <div className="ex-code-tabs">
                  <div className="ex-filter" role="tablist" aria-label="Loại mã">
                    {safeHtml ? (
                      <button
                        type="button"
                        role="tab"
                        aria-selected={codeTab === 'html'}
                        className="ex-text"
                        aria-pressed={codeTab === 'html'}
                        onClick={() => setCodeTab('html')}
                      >
                        HTML
                      </button>
                    ) : null}
                    {safeCss ? (
                      <button
                        type="button"
                        role="tab"
                        aria-selected={codeTab === 'css'}
                        className="ex-text"
                        aria-pressed={codeTab === 'css'}
                        onClick={() => setCodeTab('css')}
                      >
                        CSS
                      </button>
                    ) : null}
                    <button
                      type="button"
                      role="tab"
                      aria-selected={codeTab === 'spec'}
                      className="ex-text"
                      aria-pressed={codeTab === 'spec'}
                      onClick={() => setCodeTab('spec')}
                    >
                      Đặc tả
                    </button>
                  </div>
                  <button
                    type="button"
                    className="ex-text"
                    onClick={() => void handleCopyCode()}
                  >
                    Chép mã
                  </button>
                </div>
                <pre className="ex-code-pre">
                  <code>{activeCode}</code>
                </pre>
              </div>
            ) : null}
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
