import React, {
  memo,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  IconBookOpen,
  IconBookmark,
  IconCheck,
  IconChevronLeft,
  IconChevronRight,
  IconCopy,
  IconHeart,
  IconMoon,
  IconRotateCw,
  IconSun,
  IconX,
} from '../../ui/icons';
import {
  GLACIER_BOOKS,
  type GlacierBookMotif,
  type GlacierBookSpec,
} from '../../data/glacierBooksData';
import { useAppStore } from '../../store/appStore';
import type { AppRoute, SourceCatalogItem } from '../../types';
import { PinUIPlayground } from '../pinui';
import { previewFor } from '../../ui/Media';
import { SandboxPreview } from '../../features/explore/SandboxPreview';
import { SpecimenMedia } from '../../features/explore/SpecimenMedia';
import {
  LIBRARY_LABEL,
  fetchMotionSitesFullMap,
  fetchPinUISourceMap,
  getCachedMotionSitesFullMap,
  getCachedPinUISourceMap,
  resolveMotionSiteEntry,
  resolvePinUISource,
  sanitizeBrandText,
  sanitizeSnippetCode,
  shortTitle,
  templateContext,
  type MotionSiteFullEntry,
  type PinUISourceEntry,
  type PreviewTheme,
} from '../../features/explore/catalog';
import './glacier-shelf.css';

export interface GlacierBookShelfProps {
  onNavigate?: (route: AppRoute) => void;
  onLaunchPrompt?: (prompt: string) => void;
}

interface RectPx {
  l: number;
  t: number;
  w: number;
  h: number;
}

interface DialogState {
  idx: number;
  rect: RectPx;
}

interface DragState {
  x: number;
  T0: number;
  moved: boolean;
}

interface Engine {
  s: number;
  T: number;
  active: number;
  hover: number;
  lift: number[];
  tiltX: number;
  tiltY: number;
  mx: number;
  my: number;
  inside: boolean;
  modal: boolean;
  reduced: boolean;
  drag: DragState | null;
  suppress: boolean;
  wheelAcc: number;
  wheelAt: number;
  H: number;
  ws: number;
  d: number;
  gap: number;
  last: number;
  raf: number;
  ringScale: number;
  lastTransform: string[];
  lastShadeS: number[];
  lastShadeC: number[];
  lastHidden: boolean[];
}

const COUNT = GLACIER_BOOKS.length;
const TOTAL = COUNT * 3;
const EASE = 'cubic-bezier(.2,.8,.2,1)';
const EASE_SHEET = 'cubic-bezier(.76,0,.18,1)';
const START_INDEX = 5;

const mod = (n: number, m: number): number => ((n % m) + m) % m;
const relIndex = (v: number, s: number): number => ((((v - s) % TOTAL) + 54) % TOTAL) - 18;
const smooth = (x: number): number => x * x * (3 - 2 * x);
const clamp01 = (x: number): number => Math.min(1, Math.max(0, x));

const shelfBlend = (r: number): number =>
  Math.abs(r) < 1 ? (r + Math.sin(Math.PI * r) / Math.PI) / 2 : Math.sign(r) * 0.5;

const prefersReduced = (): boolean =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const insetFor = (rect: RectPx): string => {
  const vw = document.documentElement.clientWidth;
  const vh = window.innerHeight;
  return `inset(${rect.t}px ${Math.max(0, vw - rect.l - rect.w)}px ${Math.max(0, vh - rect.t - rect.h)}px ${rect.l}px round 3px)`;
};

const copyText = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.top = '-1000px';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  }
};

function MotifShapes({ kind }: { kind: GlacierBookMotif }): React.JSX.Element {
  switch (kind) {
    case 'grid':
      return (
        <>
          {[0, 1, 2].flatMap((i) =>
            [0, 1, 2].map((j) => (
              <rect
                key={`${i}${j}`}
                x={14 + i * 34}
                y={14 + j * 34}
                width={28}
                height={28}
                rx={5}
                className={(i + j) % 2 === 0 ? 'gb-mt' : 'gb-ms'}
              />
            ))
          )}
          <rect x={48} y={48} width={28} height={28} rx={5} className="gb-mf" />
        </>
      );
    case 'orbit':
      return (
        <>
          <ellipse cx={60} cy={60} rx={50} ry={18} transform="rotate(-25 60 60)" className="gb-ms" />
          <ellipse cx={60} cy={60} rx={50} ry={18} transform="rotate(35 60 60)" className="gb-ms" />
          <ellipse cx={60} cy={60} rx={50} ry={18} transform="rotate(95 60 60)" className="gb-ms" />
          <circle cx={60} cy={60} r={10} className="gb-mf" />
          <circle cx={102} cy={40} r={6} className="gb-mt" />
          <circle cx={20} cy={82} r={5} className="gb-mf" />
        </>
      );
    case 'prism':
      return (
        <>
          <polygon points="60,16 100,88 20,88" className="gb-mt" />
          <line x1={60} y1={16} x2={60} y2={88} className="gb-ms" />
          <line x1={2} y1={58} x2={40} y2={58} className="gb-ms" />
          <line x1={80} y1={58} x2={118} y2={36} className="gb-ms" />
          <line x1={84} y1={66} x2={118} y2={66} className="gb-ms" />
          <line x1={80} y1={74} x2={118} y2={96} className="gb-ms" />
        </>
      );
    case 'wave':
      return (
        <>
          {[0, 1, 2, 3].map((i) => (
            <path
              key={i}
              d={`M6 ${30 + i * 20} Q 33 ${8 + i * 20} 60 ${30 + i * 20} T 114 ${30 + i * 20}`}
              className="gb-ms"
            />
          ))}
          <circle cx={92} cy={22} r={9} className="gb-mf" />
        </>
      );
    case 'glass':
      return (
        <>
          <rect x={14} y={28} width={72} height={72} rx={14} className="gb-mt" />
          <circle cx={82} cy={44} r={28} className="gb-ms" />
          <circle cx={82} cy={44} r={12} className="gb-mf" />
          <rect x={28} y={80} width={40} height={6} rx={3} className="gb-mf" />
        </>
      );
    case 'type':
      return (
        <>
          <text x={60} y={76} textAnchor="middle" fontSize={72} className="gb-mtext">
            Aa
          </text>
          <line x1={16} y1={92} x2={104} y2={92} className="gb-ms" />
          <line x1={16} y1={102} x2={78} y2={102} className="gb-ms" />
        </>
      );
    case 'layers':
      return (
        <>
          {[0, 1, 2].map((i) => (
            <polygon
              key={i}
              points="60,16 108,38 60,60 12,38"
              transform={`translate(0 ${i * 20})`}
              className={i === 1 ? 'gb-mf' : 'gb-mt'}
            />
          ))}
        </>
      );
    case 'rings':
      return (
        <>
          <circle cx={60} cy={60} r={52} className="gb-mt" />
          <circle cx={60} cy={60} r={40} className="gb-ms" />
          <circle cx={60} cy={60} r={28} className="gb-mt" />
          <circle cx={60} cy={60} r={16} className="gb-ms" />
          <circle cx={60} cy={60} r={6} className="gb-mf" />
        </>
      );
    case 'shader':
      return (
        <>
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <rect
              key={i}
              x={12}
              y={14 + i * 14}
              width={96 - i * 11}
              height={8}
              rx={4}
              className={i % 2 === 0 ? 'gb-mf' : 'gb-mt'}
            />
          ))}
          <circle cx={88} cy={34} r={16} className="gb-mt" />
        </>
      );
    case 'frame':
      return (
        <>
          <rect x={8} y={22} width={84} height={58} rx={5} className="gb-mt" />
          <line x1={8} y1={36} x2={92} y2={36} className="gb-ms" />
          <rect x={72} y={50} width={36} height={58} rx={7} className="gb-mf" />
          <rect x={77} y={58} width={26} height={38} rx={3} className="gb-mt" />
        </>
      );
    case 'matrix':
      return (
        <>
          {[0, 1, 2, 3, 4].flatMap((i) =>
            [0, 1, 2, 3, 4].map((j) => (
              <circle
                key={`${i}${j}`}
                cx={16 + i * 22}
                cy={16 + j * 22}
                r={3 + ((i * 2 + j * 3) % 5) * 1.6}
                className={(i + j) % 2 === 0 ? 'gb-mf' : 'gb-mt'}
              />
            ))
          )}
        </>
      );
    case 'lens':
    default:
      return (
        <>
          <circle cx={54} cy={54} r={36} className="gb-mt" />
          <circle cx={54} cy={54} r={20} className="gb-ms" />
          <line x1={54} y1={12} x2={54} y2={96} className="gb-ms" />
          <line x1={12} y1={54} x2={96} y2={54} className="gb-ms" />
          <line x1={80} y1={80} x2={110} y2={110} className="gb-ms gb-mthick" />
        </>
      );
  }
}

function Motif({ kind }: { kind: GlacierBookMotif }): React.JSX.Element {
  return (
    <svg viewBox="0 0 120 120" className="gb-motif" aria-hidden="true" focusable="false">
      <MotifShapes kind={kind} />
    </svg>
  );
}

function BookSpine({ book }: { book: GlacierBookSpec }): React.JSX.Element {
  return (
    <div className="gb-sp-in" data-group={book.group}>
      <span className="gb-sp-headband" aria-hidden="true" />
      <span className="gb-sp-rib gb-sp-rib--top" aria-hidden="true" />
      <div className="gb-sp-art">
        <Motif kind={book.motif} />
      </div>
      <span className="gb-sp-rib gb-sp-rib--upper" aria-hidden="true" />
      <div className="gb-sp-title">{book.title}</div>
      <span className="gb-sp-rib gb-sp-rib--lower" aria-hidden="true" />
      <div className="gb-sp-foot">
        <span className="gb-sp-code">{book.code}</span>
        <span className="gb-sp-count">{book.editionTag}</span>
      </div>
      <span className="gb-sp-rib gb-sp-rib--bot" aria-hidden="true" />
      <span className="gb-sp-tailband" aria-hidden="true" />
    </div>
  );
}

function BookCover({ book }: { book: GlacierBookSpec }): React.JSX.Element {
  return (
    <div className="gb-cv-in" data-group={book.group}>
      <span className="gb-cv-hinge" aria-hidden="true" />
      <span className="gb-cv-foreedge" aria-hidden="true" />
      <div className="gb-cv-frame">
        <div className="gb-cv-top">
          <span className="gb-cv-ed">{book.editionTag}</span>
          <span className="gb-cv-grp">{book.groupLabel}</span>
        </div>
        <div className="gb-cv-head">
          <h3 className="gb-cv-title">{book.title}</h3>
          <span className="gb-cv-sub">{book.subtitleEn}</span>
        </div>
        <div className="gb-cv-art" data-group={book.group}>
          <div className="gb-cv-art-inner">
            <Motif kind={book.motif} />
          </div>
        </div>
        <div className="gb-cv-bot">
          <span className="gb-cv-code">{book.code}</span>
          <span className="gb-cv-badge">{book.countLabel}</span>
        </div>
      </div>
    </div>
  );
}

interface TapeProps {
  v: number;
  setRef: (v: number, el: HTMLDivElement | null) => void;
  onEnter: (v: number) => void;
  onLeave: (v: number) => void;
}

const Tape = memo(function Tape({ v, setRef, onEnter, onLeave }: TapeProps): React.JSX.Element {
  const book = GLACIER_BOOKS[v % COUNT];
  return (
    <div
      ref={(el) => setRef(v, el)}
      className="gb-tape"
      data-v={v}
      data-group={book.group}
      aria-hidden="true"
      style={
        {
          '--ac': book.accent,
          '--sc': book.secondary,
        } as React.CSSProperties
      }
      onPointerEnter={() => onEnter(v)}
      onPointerLeave={() => onLeave(v)}
    >
      <div className="gb-sp" data-group={book.group}>
        <BookSpine book={book} />
      </div>
      <div className="gb-cv" data-group={book.group}>
        <BookCover book={book} />
      </div>
    </div>
  );
});

function Rise({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <div className="gb-rise">
      <div className="gb-rise-i" data-rise="">
        {children}
      </div>
    </div>
  );
}

interface DialogProps {
  book: GlacierBookSpec;
  bookIndex: number;
  totalBooks: number;
  rect: RectPx;
  onStepBook: (delta: -1 | 1) => void;
  onSelectBook: (idx: number) => void;
  onClosed: () => void;
  onNavigate?: (route: AppRoute) => void;
  onLaunchPrompt?: (prompt: string) => void;
}

function BookDialog({
  book,
  bookIndex,
  totalBooks,
  rect,
  onStepBook,
  onSelectBook,
  onClosed,
  onNavigate,
  onLaunchPrompt,
}: DialogProps): React.JSX.Element {
  const {
    sourceCatalog,
    theme,
    getHeartCount,
    isItemLiked,
    toggleLikedItem,
    savedItemIds,
    toggleSavedItem,
    openExperience,
    openInWorkspace,
    addToast,
  } = useAppStore();

  const [copied, setCopied] = useState('');
  const [demoKey, setDemoKey] = useState(0);
  const [stageTheme, setStageTheme] = useState<PreviewTheme>(theme);
  const [codeTab, setCodeTab] = useState<'code' | 'css' | 'prompt'>('code');
  const [pinuiMap, setPinuiMap] = useState<Record<string, PinUISourceEntry> | null>(
    () => getCachedPinUISourceMap()
  );
  const [motionMap, setMotionMap] = useState<Record<string, MotionSiteFullEntry> | null>(
    () => getCachedMotionSitesFullMap()
  );

  const bookItems = useMemo(() => {
    const byId = new Map<string, SourceCatalogItem>();
    for (const item of sourceCatalog) {
      byId.set(item.id, item);
    }
    const picked: SourceCatalogItem[] = [];
    for (const id of book.featuredItemIds) {
      const found = byId.get(id);
      if (found && !picked.some((p) => p.id === found.id)) {
        picked.push(found);
      }
    }
    if (picked.length < 6) {
      for (const item of sourceCatalog) {
        if (item.sourceLibrary === book.catalogLibrary && !picked.some((p) => p.id === item.id)) {
          picked.push(item);
          if (picked.length >= 6) break;
        }
      }
    }
    return picked;
  }, [sourceCatalog, book]);

  const [selectedItemId, setSelectedItemId] = useState<string>(() => bookItems[0]?.id ?? '');
  const listRowRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    setSelectedItemId(bookItems[0]?.id ?? '');
    setDemoKey((k) => k + 1);
  }, [book.id, bookItems]);

  useEffect(() => {
    setStageTheme(theme);
  }, [theme]);

  useEffect(() => {
    if (!pinuiMap) {
      void fetchPinUISourceMap().then((loaded) => setPinuiMap(loaded));
    }
    if (!motionMap) {
      void fetchMotionSitesFullMap().then((loaded) => setMotionMap(loaded));
    }
  }, [pinuiMap, motionMap]);

  const selectedItem = useMemo(
    () => bookItems.find((it) => it.id === selectedItemId) ?? bookItems[0] ?? null,
    [bookItems, selectedItemId]
  );

  const selectedLib = selectedItem?.sourceLibrary;
  const isPinUI = selectedLib === 'pinui';
  const isThreeUI = selectedLib === 'threeui';
  const isMotion = selectedLib === 'motionsites';

  const pinuiSource = useMemo(
    () => (selectedItem && isPinUI ? resolvePinUISource(pinuiMap, selectedItem.id) : null),
    [selectedItem, isPinUI, pinuiMap]
  );

  const motionEntry = useMemo(
    () => (selectedItem && isMotion ? resolveMotionSiteEntry(motionMap, selectedItem.id) : null),
    [selectedItem, isMotion, motionMap]
  );

  const selectedTitle = selectedItem ? sanitizeBrandText(selectedItem.title) : book.title;
  const selectedDesc = selectedItem ? sanitizeBrandText(selectedItem.description) : book.synopsisVi;
  const selectedPreview = selectedItem ? previewFor(selectedItem.id) : null;

  const selectedHtml = useMemo(() => {
    if (!selectedItem) return '';
    if (isPinUI) return pinuiSource?.tsx ?? '';
    if (isMotion) return motionEntry?.code ?? motionEntry?.liveHtml ?? '';
    if (isThreeUI) return '';
    return sanitizeSnippetCode(selectedItem.previewHtml);
  }, [selectedItem, isPinUI, isThreeUI, isMotion, pinuiSource, motionEntry]);

  const selectedCss = useMemo(() => {
    if (!selectedItem) return '';
    if (isPinUI) return pinuiSource?.css ?? '';
    if (isMotion) return motionEntry?.css ?? '';
    if (isThreeUI) return '';
    return sanitizeSnippetCode(selectedItem.previewCss);
  }, [selectedItem, isPinUI, isThreeUI, isMotion, pinuiSource, motionEntry]);

  const selectedPrompt = useMemo(() => {
    if (!selectedItem) return book.promptTemplate;
    if (isPinUI && pinuiSource?.prompt) return pinuiSource.prompt;
    if (isMotion && motionEntry?.promptText) return motionEntry.promptText;
    return (
      sanitizeBrandText(selectedItem.promptSpec) ||
      `${selectedTitle}\nNhóm: ${LIBRARY_LABEL[selectedItem.sourceLibrary]}\nRuntime: ${selectedItem.runtime}\nPhong cách: ${selectedItem.style}\n\n${selectedDesc}`
    );
  }, [selectedItem, isPinUI, isMotion, pinuiSource, motionEntry, selectedTitle, selectedDesc, book.promptTemplate]);

  const selectedCssWithTheme = useMemo(() => {
    if (!selectedItem || isPinUI || isThreeUI || isMotion) return '';
    return selectedItem.previewCss ?? '';
  }, [selectedItem, isPinUI, isThreeUI, isMotion]);

  useEffect(() => {
    if (selectedHtml) {
      setCodeTab('code');
    } else if (selectedCss) {
      setCodeTab('css');
    } else {
      setCodeTab('prompt');
    }
  }, [selectedItem?.id, selectedHtml, selectedCss]);

  const sheetRef = useRef<HTMLDivElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const closingRef = useRef(false);
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const titleId = `gb-dlg-${uid}-t`;

  const bookLiked = isItemLiked(book.id);
  const bookSaved = savedItemIds.includes(book.id);
  const itemSaved = selectedItem ? savedItemIds.includes(selectedItem.id) : false;

  const handleSelectResource = useCallback((id: string) => {
    setSelectedItemId(id);
    setDemoKey((k) => k + 1);
  }, []);

  const handleResourceKeyDown = useCallback(
    (idx: number, ev: React.KeyboardEvent<HTMLButtonElement>) => {
      if (!bookItems.length) return;
      if (ev.key === 'ArrowDown') {
        ev.preventDefault();
        const next = (idx + 1) % bookItems.length;
        listRowRefs.current[next]?.focus();
        handleSelectResource(bookItems[next].id);
      } else if (ev.key === 'ArrowUp') {
        ev.preventDefault();
        const prev = (idx - 1 + bookItems.length) % bookItems.length;
        listRowRefs.current[prev]?.focus();
        handleSelectResource(bookItems[prev].id);
      } else if (ev.key === 'Home') {
        ev.preventDefault();
        listRowRefs.current[0]?.focus();
        handleSelectResource(bookItems[0].id);
      } else if (ev.key === 'End') {
        ev.preventDefault();
        const last = bookItems.length - 1;
        listRowRefs.current[last]?.focus();
        handleSelectResource(bookItems[last].id);
      }
    },
    [bookItems, handleSelectResource]
  );

  useLayoutEffect(() => {
    const sheet = sheetRef.current;
    if (!sheet) return;
    const reduced = prefersReduced();
    sheet.style.transformOrigin = `${rect.l + rect.w / 2}px ${rect.t + rect.h / 2}px`;
    sheet.animate(
      [
        { clipPath: insetFor(rect), transform: 'rotate(-4.5deg)' },
        { clipPath: 'inset(0px round 0px)', transform: 'rotate(0deg)' },
      ],
      { duration: reduced ? 1 : 520, easing: EASE_SHEET, fill: 'both' }
    );
    if (!reduced) {
      sheet.querySelectorAll<HTMLElement>('[data-rise]').forEach((el, i) => {
        el.animate(
          [{ transform: 'translateY(110%)' }, { transform: 'translateY(0%)' }],
          { duration: 420, delay: 140 + i * 30, easing: EASE, fill: 'both' }
        );
      });
    }
    closeRef.current?.focus({ preventScroll: true });
  }, [rect]);

  const close = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    const sheet = sheetRef.current;
    if (!sheet) {
      onClosed();
      return;
    }
    const cs = getComputedStyle(sheet);
    const anim = sheet.animate(
      [
        { clipPath: cs.clipPath, transform: cs.transform },
        { clipPath: insetFor(rect), transform: 'rotate(-4.5deg)' },
      ],
      { duration: prefersReduced() ? 1 : 480, easing: EASE_SHEET, fill: 'both' }
    );
    anim.onfinish = onClosed;
  }, [onClosed, rect]);

  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') {
        ev.preventDefault();
        close();
        return;
      }
      const activeEl = document.activeElement as HTMLElement | null;
      const inControl =
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.tagName === 'SELECT' ||
          activeEl.getAttribute('role') === 'option');
      if (!inControl && ev.key === 'ArrowLeft') {
        ev.preventDefault();
        onStepBook(-1);
        return;
      }
      if (!inControl && ev.key === 'ArrowRight') {
        ev.preventDefault();
        onStepBook(1);
        return;
      }
      if (ev.key !== 'Tab' || !sheetRef.current) return;
      const items = Array.from(
        sheetRef.current.querySelectorAll<HTMLElement>(
          'button, input, a[href], [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => !el.hasAttribute('disabled'));
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (ev.shiftKey && document.activeElement === first) {
        ev.preventDefault();
        last.focus();
      } else if (!ev.shiftKey && document.activeElement === last) {
        ev.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [close, onStepBook]);

  useEffect(() => {
    if (!copied) return undefined;
    const id = window.setTimeout(() => setCopied(''), 1800);
    return () => window.clearTimeout(id);
  }, [copied]);

  const doCopyResource = async (kind: 'code' | 'prompt') => {
    const textToCopy =
      kind === 'prompt'
        ? selectedPrompt
        : codeTab === 'css'
          ? selectedCss || selectedHtml || selectedPrompt
          : selectedHtml || selectedCss || selectedPrompt;
    const ok = await copyText(textToCopy);
    const msg = ok ? (kind === 'code' ? 'Đã chép mã' : 'Đã chép Prompt') : 'Không chép được';
    setCopied(msg);
    addToast({
      type: ok ? 'success' : 'error',
      title: msg,
      message: selectedTitle,
    });
  };

  const handleOpenWorkspace = () => {
    if (selectedItem) {
      openInWorkspace(templateContext(selectedItem, selectedPrompt || undefined));
    } else if (onLaunchPrompt) {
      onLaunchPrompt(book.promptTemplate);
    } else {
      onNavigate?.('workspace');
    }
    close();
  };

  const handleOpenExplore = () => {
    if (selectedItem) {
      openExperience(selectedItem.id);
    } else {
      onNavigate?.('explore');
    }
    close();
  };

  const handleOpenExploreCatalog = () => {
    if (onNavigate) {
      onNavigate('explore');
      close();
    } else {
      handleOpenExplore();
    }
  };

  const shownResourceCode =
    codeTab === 'code'
      ? selectedHtml || selectedPrompt
      : codeTab === 'css'
        ? selectedCss || selectedPrompt
        : selectedPrompt;

  const style = {
    '--ac': book.accent,
    '--sc': book.secondary,
  } as React.CSSProperties;

  return (
    <div className="gb-modal-host" style={style}>
      <div
        ref={sheetRef}
        className="gb-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="gb-sheet-bar">
          <button
            ref={closeRef}
            type="button"
            className="gb-icon-btn"
            aria-label="Đóng"
            title="Đóng"
            onClick={close}
          >
            <IconX size={16} aria-hidden="true" />
          </button>
          <div className="gb-sheet-nav">
            <button
              type="button"
              className="gb-icon-btn"
              aria-label="Cuốn sách trước"
              title="Sách trước"
              onClick={() => onStepBook(-1)}
            >
              <IconChevronLeft size={18} aria-hidden="true" />
            </button>
            <span className="gb-lbl gb-sheet-nav-lbl">
              {book.editionTag} · {book.title} ({String(bookIndex + 1).padStart(2, '0')} /{' '}
              {String(totalBooks).padStart(2, '0')})
            </span>
            <button
              type="button"
              className="gb-icon-btn"
              aria-label="Cuốn sách tiếp theo"
              title="Sách tiếp"
              onClick={() => onStepBook(1)}
            >
              <IconChevronRight size={18} aria-hidden="true" />
            </button>
          </div>
          <div className="gb-bar-r-group">
            <span className="gb-lbl gb-bar-r">
              {book.groupLabel} · {book.countLabel}
            </span>
            {onNavigate ? (
              <button
                type="button"
                className="gb-txt-btn gb-bar-explore"
                onClick={handleOpenExploreCatalog}
              >
                Khám phá
              </button>
            ) : null}
          </div>
        </div>

        <nav className="gb-vol-rail" aria-label="Chuyển nhanh 12 tập sách">
          {GLACIER_BOOKS.map((vol, idx) => {
            const active = idx === bookIndex;
            return (
              <button
                key={vol.id}
                type="button"
                className={`gb-vol-pill${active ? ' is-active' : ''}`}
                aria-current={active ? 'page' : undefined}
                aria-label={`${vol.editionTag}: ${vol.title}`}
                title={`${vol.editionTag} · ${vol.title}`}
                style={{ '--vol-ac': vol.accent } as React.CSSProperties}
                onClick={() => onSelectBook(idx)}
              >
                <span className="gb-vol-swatch" aria-hidden="true" />
                <span className="gb-vol-num">{String(idx + 1).padStart(2, '0')}</span>
                {active ? <span className="gb-vol-name">{vol.title}</span> : null}
              </button>
            );
          })}
        </nav>

        <div className="gb-sheet-grid">
          <aside className="gb-left">
            <div className="gb-book-summary">
              <div className="gb-book-summary-top">
                <span className="gb-lbl gb-d-meta">
                  {book.code} · {book.editionTag} · {book.year}
                </span>
                <div className="gb-book-summary-react">
                  <div className="gb-heart">
                    <button
                      type="button"
                      className="gb-icon-btn"
                      aria-label={bookLiked ? 'Bỏ thích sách này' : 'Thích sách này'}
                      title={bookLiked ? 'Bỏ thích sách này' : 'Thích sách này'}
                      aria-pressed={bookLiked}
                      data-on={bookLiked ? 'true' : 'false'}
                      onClick={() => toggleLikedItem(book.id)}
                    >
                      <IconHeart size={15} aria-hidden="true" />
                    </button>
                    <span className="gb-count">{getHeartCount(book.id)}</span>
                  </div>
                  <button
                    type="button"
                    className="gb-icon-btn"
                    aria-label={bookSaved ? 'Bỏ lưu sách này' : 'Lưu sách này'}
                    title={bookSaved ? 'Bỏ lưu sách này' : 'Lưu sách này'}
                    aria-pressed={bookSaved}
                    data-on={bookSaved ? 'true' : 'false'}
                    onClick={() => toggleSavedItem(book.id)}
                  >
                    <IconBookmark size={15} aria-hidden="true" />
                  </button>
                </div>
              </div>

              <h2 id={titleId} className="gb-d-title">
                {book.title}
              </h2>
              <span className="gb-d-sub">{book.subtitleEn}</span>
              <p className="gb-d-syn">{book.synopsisVi}</p>
            </div>

            <div className="gb-catalog-panel">
              <div className="gb-catalog-head">
                <h3 className="gb-h3">Mục tài nguyên ({bookItems.length})</h3>
                <span className="gb-lbl">{LIBRARY_LABEL[book.catalogLibrary]}</span>
              </div>

              <div
                className="gb-res-list"
                role="listbox"
                aria-label={`Danh sách mục tài nguyên trong ${book.title}`}
              >
                {bookItems.map((item, idx) => {
                  const active = item.id === selectedItem?.id;
                  return (
                    <button
                      key={item.id}
                      ref={(el) => {
                        listRowRefs.current[idx] = el;
                      }}
                      type="button"
                      role="option"
                      aria-selected={active}
                      className={`gb-res-item${active ? ' is-active' : ''}`}
                      onClick={() => handleSelectResource(item.id)}
                      onKeyDown={(ev) => handleResourceKeyDown(idx, ev)}
                    >
                      <span className="gb-res-item-idx" aria-hidden="true">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <span className="gb-res-item-body">
                        <span className="gb-res-item-title">{shortTitle(item)}</span>
                        <span className="gb-res-item-meta">
                          {LIBRARY_LABEL[item.sourceLibrary]} · {item.runtime}
                        </span>
                      </span>
                      <span className="gb-res-item-dot" aria-hidden="true" />
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>

          <div className="gb-right">
            {selectedItem ? (
              <>
                <Rise>
                  <div className="gb-res-hero">
                    <div className="gb-res-hero-info">
                      <span className="gb-lbl gb-d-meta">
                        MẪU THỰC TẾ · {LIBRARY_LABEL[selectedItem.sourceLibrary]} ·{' '}
                        {selectedItem.category} · {selectedItem.runtime}
                      </span>
                      <h3 className="gb-res-hero-title">{selectedTitle}</h3>
                      <p className="gb-res-hero-desc">{selectedDesc}</p>
                    </div>
                  </div>
                </Rise>

                <Rise>
                  <div className="gb-actions">
                    <button
                      type="button"
                      className="gb-txt-btn gb-solid"
                      onClick={handleOpenWorkspace}
                    >
                      Mở Workspace
                    </button>
                    <button
                      type="button"
                      className="gb-txt-btn"
                      onClick={handleOpenExplore}
                    >
                      Khám phá
                    </button>
                    <button
                      type="button"
                      className="gb-icon-btn"
                      aria-label="Chép mã"
                      title="Chép mã"
                      onClick={() => void doCopyResource('code')}
                    >
                      {copied === 'Đã chép mã' ? (
                        <IconCheck size={15} aria-hidden="true" />
                      ) : (
                        <IconCopy size={15} aria-hidden="true" />
                      )}
                    </button>
                    <button
                      type="button"
                      className="gb-icon-btn"
                      aria-label="Chép Prompt"
                      title="Chép Prompt"
                      onClick={() => void doCopyResource('prompt')}
                    >
                      {copied === 'Đã chép Prompt' ? (
                        <IconCheck size={15} aria-hidden="true" />
                      ) : (
                        <IconCopy size={15} aria-hidden="true" />
                      )}
                    </button>
                    <div className="gb-actions-utils">
                      <button
                        type="button"
                        className="gb-icon-btn"
                        aria-label={itemSaved ? 'Bỏ lưu mẫu tài nguyên này' : 'Lưu Bookmark mẫu tài nguyên này'}
                        title={itemSaved ? 'Đã lưu' : 'Lưu mẫu'}
                        aria-pressed={itemSaved}
                        data-on={itemSaved ? 'true' : 'false'}
                        onClick={() => toggleSavedItem(selectedItem.id)}
                      >
                        <IconBookmark size={16} aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        className="gb-icon-btn"
                        aria-label={
                          stageTheme === 'dark'
                            ? 'Chuyển sân khấu sang nền sáng'
                            : 'Chuyển sân khấu sang nền tối'
                        }
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
                        className="gb-icon-btn"
                        aria-label="Tải lại"
                        title="Tải lại"
                        onClick={() => setDemoKey((k) => k + 1)}
                      >
                        <IconRotateCw size={16} aria-hidden="true" />
                      </button>
                    </div>
                    <span className="gb-toast" role="status" aria-live="polite">
                      {copied}
                    </span>
                  </div>
                </Rise>

                <Rise>
                  <div className="gb-live">
                    <div
                      className="gb-live-stage"
                      data-theme={stageTheme}
                      data-playground={isPinUI ? 'true' : 'false'}
                    >
                      {isPinUI ? (
                        <PinUIPlayground
                          key={`${selectedItem.id}-${demoKey}`}
                          itemId={selectedItem.id}
                          theme={stageTheme}
                          compact
                        />
                      ) : !isThreeUI && !isMotion && selectedItem.previewHtml ? (
                        <SandboxPreview
                          title={selectedTitle}
                          html={selectedItem.previewHtml}
                          css={selectedCssWithTheme}
                          theme={stageTheme}
                          viewport={1440}
                          nonce={demoKey}
                        />
                      ) : selectedPreview ? (
                        <SpecimenMedia
                          key={selectedItem.id}
                          preview={selectedPreview}
                          title={selectedTitle}
                          fallbackLabel={LIBRARY_LABEL[selectedItem.sourceLibrary]}
                          fit="contain"
                          activePlay
                        />
                      ) : selectedItem.previewImage ? (
                        <img
                          src={selectedItem.previewImage}
                          alt={selectedTitle}
                          referrerPolicy="no-referrer"
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                            display: 'block',
                          }}
                        />
                      ) : (
                        <div className="gb-live-fallback">
                          <span>{selectedTitle}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Rise>

                <Rise>
                  <div className="gb-bench">
                    <div className="gb-bench-head">
                      <div className="gb-code-tab-group" role="tablist" aria-label="Mã nguồn mẫu">
                        {selectedHtml ? (
                          <button
                            type="button"
                            role="tab"
                            aria-selected={codeTab === 'code'}
                            className={`gb-txt-btn${codeTab === 'code' ? ' gb-solid' : ''}`}
                            onClick={() => setCodeTab('code')}
                          >
                            {isPinUI ? 'TSX' : isMotion ? 'CODE' : 'HTML'}
                          </button>
                        ) : null}
                        {selectedCss ? (
                          <button
                            type="button"
                            role="tab"
                            aria-selected={codeTab === 'css'}
                            className={`gb-txt-btn${codeTab === 'css' ? ' gb-solid' : ''}`}
                            onClick={() => setCodeTab('css')}
                          >
                            CSS
                          </button>
                        ) : null}
                        <button
                          type="button"
                          role="tab"
                          aria-selected={codeTab === 'prompt'}
                          className={`gb-txt-btn${codeTab === 'prompt' ? ' gb-solid' : ''}`}
                          onClick={() => setCodeTab('prompt')}
                        >
                          Prompt
                        </button>
                      </div>
                      <button
                        type="button"
                        className="gb-icon-btn"
                        aria-label={codeTab === 'prompt' ? 'Chép Prompt' : 'Chép mã'}
                        title={codeTab === 'prompt' ? 'Chép Prompt' : 'Chép mã'}
                        onClick={() =>
                          void doCopyResource(codeTab === 'prompt' ? 'prompt' : 'code')
                        }
                      >
                        <IconCopy size={15} aria-hidden="true" />
                      </button>
                    </div>
                    <pre className="gb-code" tabIndex={0} aria-label="Mã nguồn và Prompt mẫu đang chọn">
                      {shownResourceCode}
                    </pre>
                  </div>
                </Rise>
              </>
            ) : (
              <div className="gb-empty-state">
                <span className="gb-lbl gb-d-meta">
                  {book.editionTag} · {LIBRARY_LABEL[book.catalogLibrary]}
                </span>
                <h3 className="gb-res-hero-title">Chưa nạp mục tài nguyên cho tập này</h3>
                <p className="gb-res-hero-desc">
                  Mở thư viện Khám phá để xem toàn bộ tài nguyên gốc trong kho lưu trữ.
                </p>
                <div className="gb-actions">
                  <button
                    type="button"
                    className="gb-txt-btn gb-solid"
                    onClick={handleOpenExploreCatalog}
                  >
                    Khám phá
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function GlacierBookShelf({ onNavigate, onLaunchPrompt }: GlacierBookShelfProps): React.JSX.Element {
  const rootRef = useRef<HTMLElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const probeRef = useRef<HTMLDivElement | null>(null);
  const ringRef = useRef<HTMLButtonElement | null>(null);
  const tapeEls = useRef<Array<HTMLDivElement | null>>([]);
  const capEls = useRef<Array<HTMLDivElement | null>>([]);
  const filterId = `gb-grain-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const [activeIdx, setActiveIdx] = useState(START_INDEX);
  const [dialog, setDialog] = useState<DialogState | null>(null);

  const eng = useRef<Engine>({
    s: START_INDEX + COUNT,
    T: START_INDEX + COUNT,
    active: START_INDEX,
    hover: -1,
    lift: Array.from({ length: TOTAL }, () => 0),
    tiltX: 0,
    tiltY: 0,
    mx: 0,
    my: 0,
    inside: false,
    modal: false,
    reduced: false,
    drag: null,
    suppress: false,
    wheelAcc: 0,
    wheelAt: 0,
    H: 400,
    ws: 68,
    d: 211,
    gap: 12,
    last: 0,
    raf: 0,
    ringScale: 0,
    lastTransform: Array.from({ length: TOTAL }, () => ''),
    lastShadeS: Array.from({ length: TOTAL }, () => -1),
    lastShadeC: Array.from({ length: TOTAL }, () => -1),
    lastHidden: Array.from({ length: TOTAL }, () => false),
  });

  const activeBook = GLACIER_BOOKS[activeIdx];

  const setTapeRef = useCallback((v: number, el: HTMLDivElement | null) => {
    tapeEls.current[v] = el;
  }, []);
  const onTapeEnter = useCallback((v: number) => {
    eng.current.hover = v;
  }, []);
  const onTapeLeave = useCallback((v: number) => {
    if (eng.current.hover === v) eng.current.hover = -1;
  }, []);

  const swapCaption = useCallback((book: GlacierBookSpec, dir: number, instant: boolean) => {
    const texts = [
      book.title,
      `${book.subtitleEn} / ${book.code}`,
      `${book.groupLabel} · ${book.year} · ${book.countLabel}`,
    ];
    const reduced = instant || eng.current.reduced;
    capEls.current.forEach((mask, i) => {
      if (!mask) return;
      const olds = Array.from(mask.children) as HTMLElement[];
      const next = document.createElement('span');
      next.className = 'gb-cap-i';
      next.textContent = texts[i];
      if (reduced) {
        olds.forEach((o) => o.remove());
        mask.appendChild(next);
        return;
      }
      olds.forEach((o) => {
        if (o.dataset.leaving) return;
        o.dataset.leaving = '1';
        const from = getComputedStyle(o).transform;
        const out = o.animate(
          [{ transform: from === 'none' ? 'translateY(0%)' : from }, { transform: `translateY(${-dir * 105}%)` }],
          { duration: 650, easing: EASE, fill: 'both' }
        );
        out.onfinish = () => o.remove();
      });
      mask.appendChild(next);
      next.animate(
        [{ transform: `translateY(${dir * 105}%)` }, { transform: 'translateY(0%)' }],
        { duration: 650, easing: EASE, fill: 'both' }
      );
    });
  }, []);

  const goTo = useCallback(
    (t: number) => {
      const e = eng.current;
      const prev = e.T;
      e.T = t;
      const idx = mod(Math.round(t), COUNT);
      if (idx !== e.active) {
        e.active = idx;
        setActiveIdx(idx);
        swapCaption(GLACIER_BOOKS[idx], t >= prev ? 1 : -1, false);
      }
    },
    [swapCaption]
  );

  const step = useCallback(
    (delta: number) => {
      goTo(Math.round(eng.current.T) + delta);
    },
    [goTo]
  );

  const handleStepDialogBook = useCallback(
    (delta: -1 | 1) => {
      step(delta);
      setDialog((prev) => (prev ? { ...prev, idx: mod(prev.idx + delta, COUNT) } : null));
    },
    [step]
  );

  const handleSelectDialogBook = useCallback(
    (targetIdx: number) => {
      const normalized = mod(targetIdx, COUNT);
      const current = eng.current.active;
      let delta = normalized - current;
      if (delta > COUNT / 2) delta -= COUNT;
      if (delta < -COUNT / 2) delta += COUNT;
      if (delta !== 0) step(delta);
      setDialog((prev) => (prev ? { ...prev, idx: normalized } : null));
    },
    [step]
  );

  const openBook = useCallback(() => {
    const e = eng.current;
    if (e.modal) return;
    let best = 0;
    let bd = Infinity;
    for (let v = 0; v < TOTAL; v += 1) {
      const dist = Math.abs(relIndex(v, e.s));
      if (dist < bd) {
        bd = dist;
        best = v;
      }
    }
    const cover = tapeEls.current[best]?.children[1] as HTMLElement | undefined;
    if (!cover) return;
    const r = cover.getBoundingClientRect();
    e.modal = true;
    setDialog({ idx: e.active, rect: { l: r.left, t: r.top, w: r.width, h: r.height } });
  }, []);

  const onClosed = useCallback(() => {
    eng.current.modal = false;
    setDialog(null);
    stageRef.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    swapCaption(GLACIER_BOOKS[START_INDEX], 1, true);
  }, [swapCaption]);

  useEffect(() => {
    const root = rootRef.current;
    const stage = stageRef.current;
    if (!root || !stage) return undefined;
    const e = eng.current;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    e.reduced = mq.matches;
    const onMq = () => {
      e.reduced = mq.matches;
    };
    mq.addEventListener('change', onMq);

    const measure = () => {
      const probe = probeRef.current;
      if (!probe) return;
      const H = probe.getBoundingClientRect().height || 400;
      e.H = H;
      e.ws = (H * 142) / 840;
      e.d = (H * 474) / 900;
      e.gap = H * 0.03;
      root.style.setProperty('--h-px', `${H}px`);
      root.style.setProperty('--ws', `${e.ws}px`);
      root.style.setProperty('--d', `${e.d}px`);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(root);

    const tick = (now: number) => {
      e.raf = requestAnimationFrame(tick);
      const dt = Math.min(0.05, Math.max(0, (now - e.last) / 1000));
      e.last = now;
      const sr = stage.getBoundingClientRect();
      const { H, ws, d, gap } = e;
      const W = sr.width;
      const scx = sr.left + W / 2;
      const scy = sr.top + sr.height / 2;

      if (e.reduced) {
        e.s = e.T;
      } else {
        const k = e.drag ? 18 : 5.2;
        e.s += (e.T - e.s) * (1 - Math.exp(-k * dt));
        if (Math.abs(e.T - e.s) < 1e-4) e.s = e.T;
      }
      if (Math.abs(e.T) > 360) {
        const shift = TOTAL * Math.floor(e.T / TOTAL);
        e.T -= shift;
        e.s -= shift;
        if (e.drag) e.drag.T0 -= shift;
      }

      const dx = e.mx - scx;
      const dy = e.my - scy;
      const settled = Math.abs(e.T - e.s) < 0.3;
      const onCover =
        e.inside && !e.modal && settled && Math.abs(dx) < 0.55 * d && Math.abs(dy) < 0.55 * H;
      const tyT = e.inside ? (onCover ? (dx / (0.55 * d)) * 9 : (dx / W) * 5) : 0;
      const txT = onCover ? (-dy / (H / 2)) * 6 : 0;
      const ta = e.reduced ? 1 : 1 - Math.exp(-7 * dt);
      e.tiltY += (Math.max(-12, Math.min(12, tyT)) - e.tiltY) * ta;
      e.tiltX += (Math.max(-8, Math.min(8, txT)) - e.tiltX) * ta;

      const la = e.reduced ? 1 : 1 - Math.exp(-12 * dt);
      for (let v = 0; v < TOTAL; v += 1) {
        const tape = tapeEls.current[v];
        if (!tape) continue;
        const r = relIndex(v, e.s);
        const x = r * (ws + gap) + (d - ws + 1.6 * gap) * shelfBlend(r);
        const hide = Math.abs(x) > W / 2 + 1.5 * d;
        if (hide !== e.lastHidden[v]) {
          tape.style.visibility = hide ? 'hidden' : 'visible';
          e.lastHidden[v] = hide;
        }
        if (hide) continue;
        const o = smooth(Math.max(0, 1 - Math.abs(r)));
        const target = e.hover === v && Math.abs(r) > 0.5 ? 1 : 0;
        e.lift[v] += (target - e.lift[v]) * la;
        const y = -o * 0.025 * H - e.lift[v] * 0.045 * H;
        const z = o * 0.2 * H;
        const tf = `translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,${z.toFixed(2)}px) rotateZ(${(-4.5 * o).toFixed(3)}deg) rotateX(${(e.tiltX * o).toFixed(3)}deg) rotateY(${((-90 + e.tiltY) * o).toFixed(3)}deg)`;
        if (tf !== e.lastTransform[v]) {
          tape.style.transform = tf;
          tape.style.zIndex = String(Math.round(100 - Math.abs(r) * 4));
          e.lastTransform[v] = tf;
        }
        const shS = Math.round(o * 0.55 * 1000) / 1000;
        if (shS !== e.lastShadeS[v]) {
          (tape.children[0] as HTMLElement).style.setProperty('--shade', String(shS));
          e.lastShadeS[v] = shS;
        }
        const shC = Math.round((1 - o) * 0.5 * 1000) / 1000;
        if (shC !== e.lastShadeC[v]) {
          (tape.children[1] as HTMLElement).style.setProperty('--shade', String(shC));
          e.lastShadeC[v] = shC;
        }
      }

      const ring = ringRef.current;
      if (ring) {
        const raw = e.modal ? 0 : e.reduced ? (settled ? 1 : 0) : smooth(clamp01(1 - Math.abs(e.T - e.s) * 3));
        if (Math.abs(raw - e.ringScale) > 0.001) {
          e.ringScale = raw;
          ring.style.transform = `translate(${(-0.5 * d - 6).toFixed(2)}px, ${(0.36 * H).toFixed(2)}px) scale(${raw.toFixed(3)})`;
          ring.style.visibility = raw < 0.01 ? 'hidden' : 'visible';
        }
      }
    };

    let running = false;
    const start = () => {
      if (running) return;
      running = true;
      e.last = performance.now();
      e.raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(e.raf);
    };
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((en) => en.isIntersecting)) start();
        else stop();
      },
      { threshold: 0 }
    );
    io.observe(root);

    const onWheel = (ev: WheelEvent) => {
      if (e.modal) return;
      const h = Math.abs(ev.deltaX) > Math.abs(ev.deltaY) ? ev.deltaX : ev.shiftKey ? ev.deltaY : 0;
      if (!h) return;
      ev.preventDefault();
      const now = performance.now();
      if (now - e.wheelAt > 220) e.wheelAcc = 0;
      e.wheelAcc += h;
      e.wheelAt = now;
      if (Math.abs(e.wheelAcc) > 40) {
        step(e.wheelAcc > 0 ? 1 : -1);
        e.wheelAcc = 0;
        e.wheelAt = now + 260;
      }
    };
    stage.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      stop();
      io.disconnect();
      ro.disconnect();
      mq.removeEventListener('change', onMq);
      stage.removeEventListener('wheel', onWheel);
    };
  }, [step]);

  const onPointerDown = (ev: React.PointerEvent<HTMLDivElement>) => {
    const e = eng.current;
    if (e.modal || (ev.pointerType === 'mouse' && ev.button !== 0)) return;
    if ((ev.target as HTMLElement).closest('button')) return;
    e.drag = { x: ev.clientX, T0: e.T, moved: false };
    const move = (m: PointerEvent) => {
      const dr = e.drag;
      if (!dr) return;
      const dx = m.clientX - dr.x;
      if (!dr.moved && Math.abs(dx) > 6) dr.moved = true;
      if (dr.moved) goTo(dr.T0 - dx / (e.ws + e.gap));
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      const dr = e.drag;
      e.drag = null;
      if (dr?.moved) {
        e.suppress = true;
        window.setTimeout(() => {
          e.suppress = false;
        }, 120);
        goTo(Math.round(e.T));
      }
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  };

  const onStageClick = (ev: React.MouseEvent<HTMLDivElement>) => {
    const e = eng.current;
    if (e.suppress) {
      e.suppress = false;
      return;
    }
    if ((ev.target as HTMLElement).closest('button')) return;
    const holder = (ev.target as HTMLElement).closest('[data-v]') as HTMLElement | null;
    if (holder) {
      const v = Number(holder.dataset.v);
      const base = Math.round(e.T);
      const r = relIndex(v, base);
      if (Math.abs(relIndex(v, e.s)) > 0.5) goTo(base + r);
      else openBook();
      return;
    }
    const stage = stageRef.current;
    if (!stage) return;
    const sr = stage.getBoundingClientRect();
    const dx = ev.clientX - (sr.left + sr.width / 2);
    const dy = ev.clientY - (sr.top + sr.height / 2);
    if (Math.abs(dy) > 0.55 * e.H) return;
    if (Math.abs(dx) <= 0.55 * e.d) {
      openBook();
      return;
    }
    let bestV = -1;
    let bestDist = Infinity;
    for (let v = 0; v < TOTAL; v += 1) {
      const r = relIndex(v, e.s);
      const x = r * (e.ws + e.gap) + (e.d - e.ws + 1.6 * e.gap) * shelfBlend(r);
      const dist = Math.abs(dx - x);
      if (dist < bestDist && dist <= (e.ws + e.gap) * 0.75) {
        bestDist = dist;
        bestV = v;
      }
    }
    if (bestV >= 0) {
      const base = Math.round(e.T);
      goTo(base + relIndex(bestV, base));
    }
  };

  const onStageKey = (ev: React.KeyboardEvent<HTMLDivElement>) => {
    if (ev.key === 'ArrowRight') {
      ev.preventDefault();
      step(1);
    } else if (ev.key === 'ArrowLeft') {
      ev.preventDefault();
      step(-1);
    } else if (ev.key === 'Home') {
      ev.preventDefault();
      goTo(Math.round(eng.current.T) + mod(-eng.current.active, COUNT) - (eng.current.active > 6 ? COUNT : 0));
    } else if (ev.key === 'End') {
      ev.preventDefault();
      goTo(Math.round(eng.current.T) + (COUNT - 1 - eng.current.active));
    } else if (ev.key === 'Enter' || ev.key === ' ') {
      ev.preventDefault();
      openBook();
    }
  };

  const onRootMove = (ev: React.PointerEvent<HTMLElement>) => {
    const e = eng.current;
    if (e.modal || ev.pointerType === 'touch') return;
    e.inside = true;
    e.mx = ev.clientX;
    e.my = ev.clientY;
  };

  const onRootLeave = () => {
    const e = eng.current;
    e.inside = false;
    e.hover = -1;
  };

  const tapes = useMemo(
    () =>
      Array.from({ length: TOTAL }, (_, v) => (
        <Tape key={v} v={v} setRef={setTapeRef} onEnter={onTapeEnter} onLeave={onTapeLeave} />
      )),
    [setTapeRef, onTapeEnter, onTapeLeave]
  );

  const dialogBook = dialog ? GLACIER_BOOKS[dialog.idx] : null;

  return (
    <section
      ref={rootRef}
      className="gb-shelf-root"
      aria-label="Tủ sách tài nguyên Glacier"
      onPointerMove={onRootMove}
      onPointerLeave={onRootLeave}
    >
      <div ref={probeRef} className="gb-probe" aria-hidden="true" />

      <header className="gb-top">
        <span className="gb-box gb-lbl gb-top-l">TỦ SÁCH</span>
        <div className="gb-mark">
          <span className="gb-mark-a">Tủ sách tài nguyên</span>
          <span className="gb-mark-b">KÉO HOẶC CHỌN SÁCH ĐỂ CHẠY THỬ</span>
        </div>
        <span className="gb-lbl gb-top-r">
          {String(activeIdx + 1).padStart(2, '0')} / {String(COUNT).padStart(2, '0')} · {activeBook.editionTag}
        </span>
      </header>

      <div
        ref={stageRef}
        className="gb-stage"
        role="group"
        aria-roledescription="carousel"
        aria-label="Giá sách 3D, dùng phím mũi tên để đổi sách, Enter để mở"
        tabIndex={0}
        onPointerDown={onPointerDown}
        onClick={onStageClick}
        onKeyDown={onStageKey}
      >
        <div className="gb-stage-light" aria-hidden="true" />
        <div className="gb-plinth" aria-hidden="true">
          <div className="gb-plinth-shadow" />
          <div className="gb-plinth-top" />
          <div className="gb-plinth-front" />
        </div>

        <button
          type="button"
          className="gb-stage-nav gb-stage-nav--prev"
          aria-label="Cuốn sách trước"
          title="Sách trước"
          onClick={(ev) => {
            ev.stopPropagation();
            step(-1);
          }}
        >
          <IconChevronLeft size={22} aria-hidden="true" />
        </button>

        <div className="gb-origin">{tapes}</div>

        <button
          ref={ringRef}
          type="button"
          className="gb-ring"
          aria-label={`Mở sách ${activeBook.title}`}
          title="Mở sách"
          onClick={(ev) => {
            ev.stopPropagation();
            openBook();
          }}
        >
          <IconBookOpen size={17} aria-hidden="true" />
        </button>

        <button
          type="button"
          className="gb-stage-nav gb-stage-nav--next"
          aria-label="Cuốn sách tiếp theo"
          title="Sách tiếp"
          onClick={(ev) => {
            ev.stopPropagation();
            step(1);
          }}
        >
          <IconChevronRight size={22} aria-hidden="true" />
        </button>
      </div>

      <div className="gb-capwrap">
        <button
          type="button"
          className="gb-arrow gb-arrow-l"
          aria-label="Sách trước"
          title="Sách trước"
          onClick={() => step(-1)}
        >
          <IconChevronLeft size={18} aria-hidden="true" />
        </button>
        <div className="gb-cap" aria-hidden="true">
          <div
            ref={(el) => {
              capEls.current[0] = el;
            }}
            className="gb-cap-line gb-cap-title"
          />
          <div
            ref={(el) => {
              capEls.current[1] = el;
            }}
            className="gb-cap-line gb-cap-sub gb-lbl"
          />
          <div
            ref={(el) => {
              capEls.current[2] = el;
            }}
            className="gb-cap-line gb-cap-meta"
          />
        </div>
        <button
          type="button"
          className="gb-arrow gb-arrow-r"
          aria-label="Sách sau"
          title="Sách sau"
          onClick={() => step(1)}
        >
          <IconChevronRight size={18} aria-hidden="true" />
        </button>
      </div>

      <nav className="gb-shelf-index" aria-label="Chọn nhanh 12 tập sách">
        {GLACIER_BOOKS.map((book, idx) => {
          const isCurrent = idx === activeIdx;
          return (
            <button
              key={book.id}
              type="button"
              className={`gb-shelf-pip${isCurrent ? ' is-active' : ''}`}
              aria-current={isCurrent ? 'true' : undefined}
              aria-label={`${book.editionTag}: ${book.title}`}
              title={`${book.editionTag} · ${book.title}`}
              style={{ '--pip-ac': book.accent } as React.CSSProperties}
              onClick={() => {
                let delta = idx - eng.current.active;
                if (delta > COUNT / 2) delta -= COUNT;
                if (delta < -COUNT / 2) delta += COUNT;
                if (delta === 0) openBook();
                else step(delta);
              }}
            >
              <span className="gb-shelf-pip-bar" aria-hidden="true" />
              <span className="gb-shelf-pip-num">{String(idx + 1).padStart(2, '0')}</span>
            </button>
          );
        })}
      </nav>

      <p className="gb-sr" aria-live="polite">
        {activeBook.title}, {activeBook.groupLabel}, {activeBook.countLabel}
      </p>

      <svg className="gb-grain" aria-hidden="true" focusable="false">
        <filter id={filterId} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={3} stitchTiles="stitch" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0.45  0 0 0 0 0.42  0 0 0 0 0.38  0 0 0 0.5 0"
          />
        </filter>
        <rect width="100%" height="100%" filter={`url(#${filterId})`} />
      </svg>

      {dialog && dialogBook ? (
        <BookDialog
          book={dialogBook}
          bookIndex={dialog.idx}
          totalBooks={COUNT}
          rect={dialog.rect}
          onStepBook={handleStepDialogBook}
          onSelectBook={handleSelectDialogBook}
          onClosed={onClosed}
          onNavigate={onNavigate}
          onLaunchPrompt={onLaunchPrompt}
        />
      ) : null}
    </section>
  );
}

export default GlacierBookShelf;
