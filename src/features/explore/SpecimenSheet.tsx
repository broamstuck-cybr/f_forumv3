import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  IconMonitor,
  IconMoon,
  IconRotateCw,
  IconSmartphone,
  IconSun,
  IconTablet,
  IconX,
  IconZoomIn,
  IconZoomOut,
} from '../../ui/icons';
import { previewFor } from '../../ui/Media';
import { useAppStore } from '../../store/appStore';
import { PinHeartButton, PinUIPlayground } from '../../components/pinui';
import { ThreeUIPreview } from './ThreeUIPreview';
import {
  LIBRARY_LABEL,
  copyText,
  fetchMotionSitesFullMap,
  fetchPinUISourceMap,
  getCachedMotionSitesFullMap,
  getCachedPinUISourceMap,
  resolveMotionSiteEntry,
  resolvePinUISource,
  sanitizeBrandText,
  sanitizeSnippetCode,
  type ExplorePlateItem,
  type MotionSiteFullEntry,
  type PinUISourceEntry,
  type PreviewTheme,
  type PreviewViewport,
} from './catalog';
import { VAULT_LIBRARY_LABELS } from './vaultLoader';
import { SandboxPreview } from './SandboxPreview';
import { SpecimenMedia } from './SpecimenMedia';

interface SpecimenSheetProps {
  item: ExplorePlateItem | null;
  position: number;
  total: number;
  onClose: () => void;
  onStep: (delta: 1 | -1) => void;
  onExperience: (item: ExplorePlateItem) => void;
  onUse: (item: ExplorePlateItem) => void;
  onAttach: (item: ExplorePlateItem) => void;
}

type CodeTab = 'html' | 'css' | 'code' | 'spec';

interface ReactionBarProps {
  id: string;
  title: string;
  library?: string;
  showLabel?: boolean;
  className?: string;
}

export const ReactionBar: React.FC<ReactionBarProps> = ({
  id,
  title,
  library,
  showLabel = false,
  className,
}) => {
  const { savedItemIds, toggleSavedItem, toggleLikedItem, isItemLiked, getHeartCount } = useAppStore();
  const liked = isItemLiked(id);
  const saved = savedItemIds.includes(id);
  return (
    <span className={`ex-react${className ? ` ${className}` : ''}`}>
      <PinHeartButton
        compact
        liked={liked}
        count={getHeartCount(id)}
        ariaLabel={`${liked ? 'Bỏ tim' : 'Thả tim'} ${title}`}
        onToggle={() => toggleLikedItem(id, library)}
      />
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
  const [stageZoomed, setStageZoomed] = useState(false);
  const [stageTheme, setStageTheme] = useState<PreviewTheme>(theme);
  const [nonce, setNonce] = useState(0);
  const [codeOpen, setCodeOpen] = useState(false);
  const [codeTab, setCodeTab] = useState<CodeTab>('html');
  const [copied, setCopied] = useState(false);
  const [pinuiMap, setPinuiMap] = useState<Record<string, PinUISourceEntry> | null>(
    () => getCachedPinUISourceMap()
  );
  const [motionMap, setMotionMap] = useState<Record<string, MotionSiteFullEntry> | null>(
    () => getCachedMotionSitesFullMap()
  );

  const isOpen = item !== null;

  useEffect(() => {
    setStageTheme(theme);
  }, [theme]);

  useEffect(() => {
    if (!item) return;
    if (item.sourceLibrary === 'pinui' && !pinuiMap) {
      void fetchPinUISourceMap().then((loaded) => setPinuiMap(loaded));
    }
    if (item.sourceLibrary === 'motionsites' && !motionMap) {
      void fetchMotionSitesFullMap().then((loaded) => setMotionMap(loaded));
    }
  }, [item?.id, item?.sourceLibrary, pinuiMap, motionMap]);

  useEffect(() => {
    if (!item) return;
    setNonce((n) => n + 1);
    setCodeTab('html');
    setCopied(false);
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
  const safeTitle = item ? sanitizeBrandText(item.title) : '';
  const safeDesc = item ? sanitizeBrandText(item.description) : '';
  const vaultLib = item?.vaultLibrary ?? item?.sourceLibrary ?? 'codefronts';
  const libLabel = VAULT_LIBRARY_LABELS[vaultLib] || (item ? LIBRARY_LABEL[item.sourceLibrary] : '');
  const isPinUI = vaultLib === 'pinui';
  const isThreeUI = vaultLib === 'threeui';
  const isMotion = vaultLib === 'motionsites';

  const pinuiSource = useMemo(
    () => (item && isPinUI ? resolvePinUISource(pinuiMap, item.id) : null),
    [item, isPinUI, pinuiMap]
  );

  const motionEntry = useMemo(
    () => (item && isMotion ? resolveMotionSiteEntry(motionMap, item.id) : null),
    [item, isMotion, motionMap]
  );

  const originalVideo =
    item?.previewVideo || (isMotion ? motionEntry?.previewVideo || '' : '');
  const originalImage =
    item?.previewImage ||
    (isMotion ? motionEntry?.previewImage || '' : '') ||
    (preview?.kind === 'image' ? preview.src : '');

  const safeHtml = useMemo(() => {
    if (!item) return '';
    if (isPinUI) return pinuiSource?.tsx ?? '';
    if (isMotion && motionEntry?.liveHtml && motionEntry.liveHtml.length > (item.previewHtml?.length ?? 0)) {
      return sanitizeSnippetCode(motionEntry.liveHtml);
    }
    return sanitizeSnippetCode(item.previewHtml);
  }, [item, isPinUI, isMotion, pinuiSource, motionEntry]);

  const safeCss = useMemo(() => {
    if (!item) return '';
    if (isPinUI) return pinuiSource?.css ?? '';
    if (isMotion && motionEntry?.css && !item.previewCss) {
      return sanitizeSnippetCode(motionEntry.css);
    }
    return sanitizeSnippetCode(item.previewCss);
  }, [item, isPinUI, isMotion, pinuiSource, motionEntry]);

  const safeCode = useMemo(() => {
    if (!item || !isMotion) return '';
    return motionEntry?.code ? sanitizeSnippetCode(motionEntry.code) : '';
  }, [item, isMotion, motionEntry]);

  const safeCodeLabel = (motionEntry?.codeLang || 'TSX').toUpperCase();

  const safeSpec = useMemo(() => {
    if (!item) return '';
    if (isPinUI && pinuiSource?.prompt) return pinuiSource.prompt;
    if (isMotion && motionEntry?.promptText) return motionEntry.promptText;
    return (
      sanitizeBrandText(item.promptSpec) ||
      `${safeTitle}\nNhóm: ${libLabel}\nRuntime: ${item.runtime}\nPhong cách: ${item.style}\n\n${safeDesc}`
    );
  }, [item, isPinUI, isMotion, pinuiSource, motionEntry, safeTitle, safeDesc, libLabel]);

  const snippetCssWithTheme = useMemo(() => {
    if (!item || isPinUI) return '';
    return item.previewCss ?? '';
  }, [item, isPinUI]);

  const resolvedCodeTab: CodeTab = useMemo(() => {
    if (codeTab === 'html' && safeHtml) return 'html';
    if (codeTab === 'css' && safeCss) return 'css';
    if (codeTab === 'code' && safeCode) return 'code';
    if (codeTab === 'spec') return 'spec';
    if (safeHtml) return 'html';
    if (safeCss) return 'css';
    if (safeCode) return 'code';
    return 'spec';
  }, [codeTab, safeHtml, safeCss, safeCode]);

  const activeCode =
    resolvedCodeTab === 'html'
      ? safeHtml || safeSpec
      : resolvedCodeTab === 'css'
        ? safeCss || safeSpec
        : resolvedCodeTab === 'code'
          ? safeCode || safeSpec
          : safeSpec;

  const handleCopyCode = async () => {
    if (!activeCode) return;
    const ok = await copyText(activeCode);
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    }
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
            <span className="t-label">{libLabel}</span>
            <span className="t-label">
              {position} / {total}
            </span>
            <div className="ex-stage-controls" role="group" aria-label="Khung chạy thử">
              <button
                type="button"
                className="ex-stage-icon-btn"
                aria-label={`Khung nhìn ${viewport}px`}
                title={`Khung ${viewport}px`}
                onClick={() =>
                  setViewport((prev) => (prev === 1440 ? 768 : prev === 768 ? 390 : 1440))
                }
              >
                {viewport === 1440 ? (
                  <IconMonitor size={16} aria-hidden="true" />
                ) : viewport === 768 ? (
                  <IconTablet size={16} aria-hidden="true" />
                ) : (
                  <IconSmartphone size={16} aria-hidden="true" />
                )}
              </button>
              <button
                type="button"
                className="ex-stage-icon-btn"
                aria-pressed={stageZoomed}
                aria-label={stageZoomed ? 'Thu nhỏ sân khấu' : 'Phóng to sân khấu'}
                title={stageZoomed ? 'Thu nhỏ' : 'Phóng to'}
                onClick={() => setStageZoomed((z) => !z)}
              >
                {stageZoomed ? (
                  <IconZoomOut size={16} aria-hidden="true" />
                ) : (
                  <IconZoomIn size={16} aria-hidden="true" />
                )}
              </button>
              <button
                type="button"
                className="ex-stage-icon-btn"
                aria-label={stageTheme === 'dark' ? 'Đổi sân khấu sáng' : 'Đổi sân khấu tối'}
                title={stageTheme === 'dark' ? 'Nền sáng' : 'Nền tối'}
                onClick={() => setStageTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
              >
                {stageTheme === 'dark' ? (
                  <IconMoon size={16} aria-hidden="true" />
                ) : (
                  <IconSun size={16} aria-hidden="true" />
                )}
              </button>
              <button
                type="button"
                className="ex-stage-icon-btn"
                aria-label="Tải lại sân khấu"
                title="Đặt lại"
                onClick={() => setNonce((n) => n + 1)}
              >
                <IconRotateCw size={16} aria-hidden="true" />
              </button>
            </div>
            <button
              type="button"
              className="icon-btn"
              aria-label="Đóng"
              title="Đóng"
              onClick={() => dialogRef.current?.close()}
            >
              <IconX size={20} aria-hidden="true" />
            </button>
          </div>
          <div
            className={`ex-spec-stage${stageTheme === 'light' ? ' ex-stage-paper' : ''}`}
            data-playground={isPinUI ? 'true' : 'false'}
          >
            <div
              className="ex-bench-stage-frame"
              data-viewport={viewport}
              data-zoomed={stageZoomed ? 'true' : 'false'}
            >
              {isPinUI ? (
                <PinUIPlayground
                  key={`${item.id}-${nonce}`}
                  itemId={item.id}
                  theme={stageTheme}
                  compact
                />
              ) : isThreeUI ? (
                <ThreeUIPreview
                  key={`${item.id}-3ui-${nonce}`}
                  itemId={item.id}
                  title={safeTitle}
                  image={originalImage || undefined}
                  videoUrl={originalVideo || undefined}
                />
              ) : safeHtml ? (
                <SandboxPreview
                  title={safeTitle}
                  html={safeHtml}
                  css={snippetCssWithTheme}
                  theme={stageTheme}
                  viewport={viewport}
                  nonce={nonce}
                />
              ) : originalVideo ? (
                <SpecimenMedia
                  key={`${item.id}-vid`}
                  preview={{
                    kind: 'video',
                    src: originalVideo,
                    poster: originalImage || undefined,
                    credit: 'motionsites.ai',
                  }}
                  title={safeTitle}
                  fallbackLabel={libLabel}
                  fit="contain"
                  activePlay
                />
              ) : originalImage ? (
                <SpecimenMedia
                  key={`${item.id}-img`}
                  preview={{
                    kind: 'image',
                    src: originalImage,
                    credit: isThreeUI ? '3D WebGL' : 'MotionSites',
                  }}
                  title={safeTitle}
                  fallbackLabel={libLabel}
                  fit="contain"
                />
              ) : preview ? (
                <SpecimenMedia
                  key={item.id}
                  preview={preview}
                  title={safeTitle}
                  fallbackLabel={libLabel}
                  fit="contain"
                  activePlay
                />
              ) : (
                <div className="ex-spec-type">
                  <span className="ex-spec-word">{safeTitle}</span>
                  <span className="t-label">{libLabel}</span>
                </div>
              )}
            </div>
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
            </dl>
            <div className="ex-spec-actions">
              <button type="button" className="btn btn-solid" onClick={() => onUse(item)}>
                Dùng mẫu này
              </button>
              <button type="button" className="btn btn-line" onClick={() => onExperience(item)}>
                Trải nghiệm
              </button>
              <button type="button" className="btn btn-line" onClick={() => onAttach(item)}>
                Đính kèm
              </button>
              <ReactionBar id={item.id} title={safeTitle} library={vaultLib} showLabel />
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
                        aria-selected={resolvedCodeTab === 'html'}
                        className="ex-text"
                        aria-pressed={resolvedCodeTab === 'html'}
                        onClick={() => setCodeTab('html')}
                      >
                        {isPinUI ? 'TSX' : 'HTML'}
                      </button>
                    ) : null}
                    {safeCss ? (
                      <button
                        type="button"
                        role="tab"
                        aria-selected={resolvedCodeTab === 'css'}
                        className="ex-text"
                        aria-pressed={resolvedCodeTab === 'css'}
                        onClick={() => setCodeTab('css')}
                      >
                        CSS
                      </button>
                    ) : null}
                    {safeCode ? (
                      <button
                        type="button"
                        role="tab"
                        aria-selected={resolvedCodeTab === 'code'}
                        className="ex-text"
                        aria-pressed={resolvedCodeTab === 'code'}
                        onClick={() => setCodeTab('code')}
                      >
                        {safeCodeLabel}
                      </button>
                    ) : null}
                    <button
                      type="button"
                      role="tab"
                      aria-selected={resolvedCodeTab === 'spec'}
                      className="ex-text"
                      aria-pressed={resolvedCodeTab === 'spec'}
                      onClick={() => setCodeTab('spec')}
                    >
                      Prompt
                    </button>
                  </div>
                  <button
                    type="button"
                    className="ex-text"
                    onClick={() => void handleCopyCode()}
                  >
                    {copied ? 'Đã chép' : 'Chép mã'}
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
