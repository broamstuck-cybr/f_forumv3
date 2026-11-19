import React, {
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from 'react';
import { AnimatePresence, LayoutGroup, motion, useReducedMotion, type Transition } from 'motion/react';
import { ArrowUp, Mic, Paperclip, Plus, Square, X } from 'lucide-react';
import './prompt-composer.css';

export type PromptCardKind = 'image' | 'note' | 'event' | 'voice' | 'docs';

export interface PromptComposerAction {
  id: string;
  label: string;
  placeholder?: string;
  accent?: string;
  tilt?: number;
  rise?: number;
  layer?: number;
  kind?: PromptCardKind;
}

export interface PromptComposerModel {
  id?: string;
  name: string;
  note?: string;
}

export interface PromptComposerProps {
  layoutId?: string;
  value?: string;
  onChange?: (value: string) => void;
  selectedAction?: string | null;
  onSelectAction?: (id: string | null) => void;
  selectedModel?: string;
  onSelectModel?: (model: string) => void;
  actions?: PromptComposerAction[];
  models?: PromptComposerModel[];
  onSend: (prompt: string, meta?: { action: string | null; model: string }) => void;
  onAttachClick?: () => void;
  extraControls?: ReactNode;
  disabled?: boolean;
  placeholder?: string;
  showFan?: boolean;
  className?: string;
  transcriptText?: string;
  theme?: 'light' | 'dark';
}

const DEFAULT_ACTIONS: PromptComposerAction[] = [
  {
    id: 'landing',
    label: 'Trang đích',
    placeholder: 'Mô tả nhịp kể chuyện và bố cục trang đích...',
    accent: 'var(--accent-primary)',
    kind: 'image',
  },
  {
    id: 'dashboard',
    label: 'Dữ liệu',
    placeholder: 'Mô tả bảng số liệu và ngữ cảnh phân tích...',
    accent: 'var(--accent-verdigris)',
    kind: 'note',
  },
  {
    id: 'club-hub',
    label: 'Hội nhóm',
    placeholder: 'Thiết kế không gian sinh hoạt và hồ sơ bàn giao...',
    accent: 'var(--accent-jade)',
    kind: 'event',
  },
  {
    id: 'quiz-tools',
    label: 'Phản biện',
    placeholder: 'Tạo bài luyện tập tư duy phản biện tương tác...',
    accent: 'var(--accent-copper)',
    kind: 'voice',
  },
  {
    id: 'design-code',
    label: 'Mã nguồn',
    placeholder: 'Dán đặc tả giao diện để chuyển thành HTML/CSS/JS...',
    accent: 'var(--accent-primary)',
    kind: 'docs',
  },
];

const DEFAULT_MODELS: PromptComposerModel[] = [
  { id: 'auto', name: 'Định tuyến', note: 'Tự động chọn mô hình phù hợp' },
  { id: 'obsidian-fast', name: 'Nhanh gọn', note: 'Phản hồi nhanh cho bản phác' },
  { id: 'architect-deep', name: 'Chuyên sâu', note: 'Ưu tiên kiến trúc và kiểm định' },
];

const CENTRES = [14.2, 32.1, 50, 67.9, 85.8];
const DEFAULT_TILT = [-5, 2.5, -2, 3, -4.5];
const DEFAULT_RISE = [0, 3, 6, 3, 0];
const DEFAULT_LAYER = [1, 2, 4, 3, 4];
const BARS = 44;
const STEP_MS = 75;
const DEFAULT_TRANSCRIPT =
  'Thiết kế không gian trưng bày tài nguyên tối giản với độ tương phản cao, thanh điều hướng một dòng và Live View cô lập.';

const MORPH_SPRING: Transition = { type: 'spring', visualDuration: 0.42, bounce: 0.16 };

function fadeTransition(delay = 0): Transition {
  return { duration: 0.22, ease: [0.25, 0.1, 0.25, 1], delay };
}

function CardArt({ index, kind, accent }: { index: number; kind?: PromptCardKind; accent: string }) {
  const resolved = kind ?? (['image', 'note', 'event', 'voice', 'docs'][index] as PromptCardKind);
  if (resolved === 'image') {
    return (
      <svg viewBox="0 0 64 40" className="w-8 h-5 sm:w-11 sm:h-7 mx-auto shrink-0" fill="none" aria-hidden="true">
        <rect x="4" y="5" width="56" height="30" rx="5" stroke={accent} strokeWidth="2.1" />
        <line x1="12" y1="15" x2="36" y2="15" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" opacity="0.7" />
        <line x1="12" y1="23" x2="48" y2="23" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" opacity="0.35" />
      </svg>
    );
  }
  if (resolved === 'note') {
    return (
      <svg viewBox="0 0 64 40" className="w-8 h-5 sm:w-11 sm:h-7 mx-auto shrink-0" fill="none" aria-hidden="true">
        <rect x="6" y="20" width="10" height="14" rx="2.5" fill={accent} opacity="0.6" />
        <rect x="21" y="12" width="10" height="22" rx="2.5" fill={accent} opacity="0.85" />
        <rect x="36" y="16" width="10" height="18" rx="2.5" fill="currentColor" opacity="0.35" />
        <rect x="51" y="8" width="8" height="26" rx="2.5" fill={accent} />
      </svg>
    );
  }
  if (resolved === 'event') {
    return (
      <svg viewBox="0 0 64 40" className="w-8 h-5 sm:w-11 sm:h-7 mx-auto shrink-0" fill="none" aria-hidden="true">
        <circle cx="22" cy="18" r="7" stroke={accent} strokeWidth="2.1" />
        <circle cx="42" cy="18" r="7" stroke="currentColor" strokeWidth="1.9" opacity="0.45" />
        <path d="M12 34c2-5 6-7 10-7s8 2 10 7" stroke={accent} strokeWidth="2.1" strokeLinecap="round" />
        <path d="M34 34c2-4 5-6 8-6s6 2 8 6" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" opacity="0.45" />
      </svg>
    );
  }
  if (resolved === 'voice') {
    return (
      <svg viewBox="0 0 64 40" className="w-8 h-5 sm:w-11 sm:h-7 mx-auto shrink-0" fill="none" aria-hidden="true">
        <line x1="12" y1="16" x2="12" y2="24" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" opacity="0.45" />
        <line x1="22" y1="10" x2="22" y2="30" stroke={accent} strokeWidth="2.4" strokeLinecap="round" />
        <line x1="32" y1="6" x2="32" y2="34" stroke={accent} strokeWidth="2.4" strokeLinecap="round" />
        <line x1="42" y1="12" x2="42" y2="28" stroke={accent} strokeWidth="2.4" strokeLinecap="round" opacity="0.8" />
        <line x1="52" y1="17" x2="52" y2="23" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" opacity="0.45" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 64 40" className="w-8 h-5 sm:w-11 sm:h-7 mx-auto shrink-0" fill="none" aria-hidden="true">
      <path d="M22 13l-8 7 8 7" stroke={accent} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M42 13l8 7-8 7" stroke={accent} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="35" y1="10" x2="29" y2="30" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.55" />
    </svg>
  );
}

function formatClock(ms: number): string {
  const sec = Math.floor(ms / 1000);
  const m = String(Math.floor(sec / 60)).padStart(1, '0');
  const s = String(sec % 60).padStart(2, '0');
  return `${m}:${s}`;
}

export const PromptComposer: React.FC<PromptComposerProps> = ({
  layoutId,
  value,
  onChange,
  selectedAction,
  onSelectAction,
  selectedModel,
  onSelectModel,
  actions = DEFAULT_ACTIONS,
  models = DEFAULT_MODELS,
  onSend,
  onAttachClick,
  extraControls,
  disabled = false,
  placeholder = 'Phác thảo giao diện, bài toán phản biện hoặc hệ thống cần dựng...',
  showFan = true,
  className = '',
  transcriptText = DEFAULT_TRANSCRIPT,
  theme,
}) => {
  const reduced = Boolean(useReducedMotion());
  const uid = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const barsRef = useRef<Array<HTMLSpanElement | null>>([]);
  const waveLevelsRef = useRef<number[]>(Array.from({ length: BARS }, () => 0.16));

  const [internalText, setInternalText] = useState('');
  const [internalAction, setInternalAction] = useState<string | null>(null);
  const [internalModel, setInternalModel] = useState(models[0]?.name ?? 'Định tuyến');
  const [trayOpen, setTrayOpen] = useState(showFan);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [hoveredOption, setHoveredOption] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mode, setMode] = useState<'typing' | 'recording' | 'transcribing'>('typing');
  const [recordMs, setRecordMs] = useState(0);

  const text = value !== undefined ? value : internalText;
  const activeActionId = selectedAction !== undefined ? selectedAction : internalAction;
  const activeModel = selectedModel !== undefined ? selectedModel : internalModel;
  const activeModelIndex = Math.max(
    0,
    models.findIndex((m) => m.name === activeModel || m.id === activeModel)
  );

  const setText = (next: string) => {
    if (value === undefined) setInternalText(next);
    onChange?.(next);
  };

  const setAction = (next: string | null) => {
    if (selectedAction === undefined) setInternalAction(next);
    onSelectAction?.(next);
  };

  const setModel = (next: string) => {
    if (selectedModel === undefined) setInternalModel(next);
    onSelectModel?.(next);
  };

  useEffect(() => {
    setTrayOpen(showFan);
  }, [showFan]);

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: PointerEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (mode !== 'recording') return;
    const started = Date.now();
    let tick = 0;
    const id = window.setInterval(() => {
      tick += 1;
      setRecordMs(Date.now() - started);
      const nextLevel = reduced
        ? 0.42
        : Math.max(0.14, Math.min(0.95, 0.36 + Math.sin(tick * 0.65) * 0.28 + Math.cos(tick * 1.4) * 0.22));
      waveLevelsRef.current = [...waveLevelsRef.current.slice(1), nextLevel];
      waveLevelsRef.current.forEach((lvl, idx) => {
        const el = barsRef.current[idx];
        if (el) {
          el.style.transform = `scaleY(${lvl.toFixed(3)})`;
        }
      });
    }, STEP_MS);
    return () => window.clearInterval(id);
  }, [mode, reduced]);

  useEffect(() => {
    if (mode !== 'transcribing') return;
    const target = transcriptText;
    if (reduced) {
      setText(target);
      setMode('typing');
      inputRef.current?.focus({ preventScroll: true });
      return;
    }
    let idx = 0;
    const id = window.setInterval(() => {
      idx += 1;
      setText(target.slice(0, idx));
      if (idx >= target.length) {
        window.clearInterval(id);
        setMode('typing');
        inputRef.current?.focus({ preventScroll: true });
      }
    }, 22);
    return () => window.clearInterval(id);
  }, [mode, reduced, transcriptText]);

  const fanActions = actions.slice(0, 5);
  const pickedAction = fanActions.find((a) => a.id === activeActionId) ?? null;
  const fanVisible = showFan && trayOpen && activeActionId === null && fanActions.length > 0 && mode === 'typing';
  const canSend = !disabled && mode === 'typing' && text.trim().length > 0;

  const handleSubmit = (e?: FormEvent) => {
    e?.preventDefault();
    if (!canSend) return;
    const trimmed = text.trim();
    onSend(trimmed, { action: activeActionId, model: activeModel });
    setText('');
    setHoveredId(null);
    setMenuOpen(false);
  };

  const handleKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape' && activeActionId) {
      e.preventDefault();
      setAction(null);
      setTrayOpen(showFan);
    } else if (e.key === 'Backspace' && activeActionId && text === '') {
      setAction(null);
      setTrayOpen(showFan);
    }
  };

  return (
    <div className={`pcmp ${className}`} data-theme={theme}>
      <LayoutGroup id={`pcmp-${uid}`}>
        <form className="pcmp__row" onSubmit={handleSubmit}>
          {models.length > 0 && (
            <div className="pcmp__side" ref={menuRef}>
              <div className="pcmp__model">
                <div className="pcmp__pill">
                  <motion.svg
                    viewBox="0 0 24 24"
                    className="pcmp__petals"
                    animate={reduced ? undefined : { rotate: activeModelIndex * 60 }}
                    transition={MORPH_SPRING}
                    aria-hidden="true"
                  >
                    {[0, 60, 120, 180, 240, 300].map((deg) => (
                      <ellipse
                        key={deg}
                        cx="12"
                        cy="6.2"
                        rx="2.1"
                        ry="4.4"
                        fill="currentColor"
                        opacity="0.82"
                        transform={`rotate(${deg} 12 12)`}
                      />
                    ))}
                  </motion.svg>
                  <button
                    type="button"
                    className="pcmp__pillBtn"
                    aria-haspopup="listbox"
                    aria-expanded={menuOpen}
                    title={activeModel}
                    onClick={() => setMenuOpen((prev) => !prev)}
                  >
                    <span className="pcmp__pillNameWrap">
                      <AnimatePresence mode="popLayout" initial={false}>
                        <motion.span
                          key={activeModel}
                          className="pcmp__pillName"
                          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 6, filter: 'blur(4px)' }}
                          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                          exit={reduced ? { opacity: 0 } : { opacity: 0, y: -6, filter: 'blur(4px)' }}
                          transition={fadeTransition(0)}
                        >
                          {activeModel}
                        </motion.span>
                      </AnimatePresence>
                    </span>
                  </button>
                </div>

                <AnimatePresence>
                  {menuOpen && (
                    <motion.div
                      className="pcmp__menu"
                      role="listbox"
                      aria-label="Mô hình"
                      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 6, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={reduced ? { opacity: 0 } : { opacity: 0, y: 4, scale: 0.96 }}
                      transition={MORPH_SPRING}
                      onPointerLeave={() => setHoveredOption(null)}
                    >
                      {models.map((m) => {
                        const key = m.id ?? m.name;
                        const isSelected = m.name === activeModel || m.id === activeModel;
                        const isHovered = hoveredOption === key;
                        return (
                          <button
                            key={key}
                            type="button"
                            role="option"
                            aria-selected={isSelected}
                            title={m.note}
                            className="pcmp__option"
                            onPointerEnter={() => setHoveredOption(key)}
                            onFocus={() => setHoveredOption(key)}
                            onClick={() => {
                              setModel(m.name);
                              setMenuOpen(false);
                            }}
                          >
                            {isHovered && (
                              <motion.span
                                layoutId="pcmp-option-hover"
                                className="pcmp__optionHover"
                                transition={MORPH_SPRING}
                                aria-hidden="true"
                              />
                            )}
                            <span className="pcmp__optionLabel text-[13px] font-medium truncate">
                              {m.name}
                            </span>
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}

          <div className="pcmp__fieldWrap">
            <div className={`pcmp__field ${showFan ? 'pcmp__field--with-fan' : ''}`}>
              {showFan && fanActions.length > 0 && (
                <div className="pcmp__fan" onPointerLeave={() => setHoveredId(null)}>
                  {fanActions.map((act, idx) => {
                    const centre = CENTRES[idx] ?? 50;
                    const tilt = act.tilt ?? DEFAULT_TILT[idx] ?? 0;
                    const rise = act.rise ?? DEFAULT_RISE[idx] ?? 0;
                    const layer = act.layer ?? DEFAULT_LAYER[idx] ?? 2;
                    const lifted = hoveredId === act.id;
                    const hoveredIndex = hoveredId ? fanActions.findIndex((x) => x.id === hoveredId) : -1;
                    const lean = hoveredIndex < 0 || hoveredIndex === idx ? 0 : idx < hoveredIndex ? -1 : 1;
                    const near = hoveredIndex >= 0 && Math.abs(hoveredIndex - idx) === 1;
                    const accent = act.accent ?? 'var(--accent-primary)';
                    const isDocs = act.kind === 'docs' || idx === 4;

                    return (
                      <motion.div
                        key={act.id}
                        className={`pcmp__card ${isDocs ? 'pcmp__card--docs' : ''}`}
                        style={{
                          left: `calc(${centre}% - var(--pcmp-card-w) / 2)`,
                          zIndex: lifted ? 10 : layer,
                        }}
                        aria-hidden={!fanVisible}
                        onPointerEnter={(e) => {
                          if (e.pointerType === 'mouse' && fanVisible) setHoveredId(act.id);
                        }}
                        initial={reduced ? false : { y: '115%', rotate: 0, scale: 0.92 }}
                        animate={
                          fanVisible
                            ? {
                                y: -rise + (lifted ? -16 : near ? -3 : 0),
                                x: lifted ? 0 : near ? lean * 10 : lean * 4,
                                rotate: lifted ? tilt * 0.3 : near ? tilt + lean * 1.5 : tilt + lean * 0.5,
                                scale: lifted ? 1.05 : 1,
                                opacity: 1,
                              }
                            : { y: '115%', x: 0, rotate: 0, scale: 0.92, opacity: 0 }
                        }
                        transition={{
                          ...MORPH_SPRING,
                          delay: reduced ? 0 : fanVisible ? (hoveredId ? 0 : 0.03 + idx * 0.035) : 0,
                        }}
                      >
                        <motion.span
                          className="pcmp__cardFace"
                          animate={
                            isDocs
                              ? ({ '--pcmp-peel': lifted && !reduced ? 1.2 : 1 } as Record<string, number>)
                              : undefined
                          }
                          transition={MORPH_SPRING}
                        >
                          <span className="pcmp__cardBand" style={{ background: accent }} aria-hidden="true" />
                          <button
                            type="button"
                            className="pcmp__cardTrigger"
                            tabIndex={fanVisible ? 0 : -1}
                            onFocus={() => fanVisible && setHoveredId(act.id)}
                            onBlur={() => setHoveredId(null)}
                            onClick={() => {
                              if (!fanVisible) return;
                              setHoveredId(null);
                              setAction(act.id);
                              inputRef.current?.focus({ preventScroll: true });
                            }}
                          >
                            {act.label}
                          </button>
                          <CardArt index={idx} kind={act.kind} accent={accent} />
                          {isDocs && <span className="pcmp__peel" aria-hidden="true" />}
                        </motion.span>
                      </motion.div>
                    );
                  })}
                </div>
              )}

              <motion.div layoutId={layoutId} transition={MORPH_SPRING} className="pcmp__bar">
                <AnimatePresence mode="wait" initial={false}>
                  {mode === 'recording' ? (
                    <motion.div
                      key="recording"
                      className="pcmp__recorder"
                      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={reduced ? { opacity: 0 } : { opacity: 0, y: -6 }}
                      transition={fadeTransition(0)}
                    >
                      <div className="pcmp__recStatus">
                        <span className="pcmp__recDot" aria-hidden="true" />
                        <span className="pcmp__recClock">{formatClock(recordMs)}</span>
                      </div>
                      <div className="pcmp__wave" aria-hidden="true">
                        {Array.from({ length: BARS }, (_, idx) => (
                          <span
                            key={idx}
                            ref={(el) => {
                              barsRef.current[idx] = el;
                            }}
                            className="pcmp__waveBar"
                          />
                        ))}
                      </div>
                      <button
                        type="button"
                        className="pcmp__stop"
                        aria-label="Dừng ghi"
                        title="Dừng ghi"
                        onClick={() => setMode('transcribing')}
                      >
                        <span className="pcmp__ring" aria-hidden="true" />
                        <Square className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
                      </button>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="typer"
                      className="pcmp__typer"
                      initial={reduced ? { opacity: 0 } : { opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={reduced ? { opacity: 0 } : { opacity: 0 }}
                      transition={fadeTransition(0)}
                    >
                      <AnimatePresence mode="popLayout" initial={false}>
                        {pickedAction && (
                          <motion.div
                            key={pickedAction.id}
                            className="pcmp__chip"
                            initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.78, y: -6 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.78 }}
                            transition={MORPH_SPRING}
                          >
                            <span>{pickedAction.label}</span>
                            <button
                              type="button"
                              className="pcmp__chipClose"
                              aria-label="Bỏ chọn"
                              title="Bỏ chọn"
                              onClick={() => {
                                setAction(null);
                                setTrayOpen(showFan);
                                inputRef.current?.focus({ preventScroll: true });
                              }}
                            >
                              <X className="h-3 w-3" aria-hidden="true" />
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <div className="pcmp__inputWrap">
                        <label htmlFor={`pcmp-input-${uid}`} className="sr-only">
                          Yêu cầu
                        </label>
                        <input
                          ref={inputRef}
                          id={`pcmp-input-${uid}`}
                          type="text"
                          className="pcmp__input"
                          value={text}
                          disabled={disabled || mode === 'transcribing'}
                          onChange={(e) => setText(e.target.value)}
                          onKeyDown={handleKeyDown}
                          placeholder={pickedAction?.placeholder ?? placeholder}
                          autoComplete="off"
                        />
                      </div>

                      <div className="pcmp__tools">
                        {extraControls}

                        {onAttachClick && (
                          <button
                            type="button"
                            className="pcmp__tool"
                            aria-label="Đính kèm"
                            title="Đính kèm"
                            disabled={disabled}
                            onClick={onAttachClick}
                          >
                            <Paperclip className="h-4 w-4" aria-hidden="true" />
                          </button>
                        )}

                        <button
                          type="button"
                          className="pcmp__tool"
                          aria-label="Giọng nói"
                          title="Giọng nói"
                          disabled={disabled}
                          onClick={() => {
                            setRecordMs(0);
                            setMode('recording');
                          }}
                        >
                          <Mic className="h-4 w-4" aria-hidden="true" />
                        </button>

                        {showFan && fanActions.length > 0 && (
                          <button
                            type="button"
                            className="pcmp__tool"
                            aria-label={fanVisible ? 'Thu gọn' : 'Mở rộng'}
                            title={fanVisible ? 'Thu gọn' : 'Mở rộng'}
                            aria-expanded={fanVisible}
                            disabled={disabled}
                            onClick={() => {
                              if (activeActionId) {
                                setAction(null);
                                setTrayOpen(true);
                              } else {
                                setTrayOpen((prev) => !prev);
                              }
                            }}
                          >
                            <Plus
                              className="h-4 w-4"
                              style={{
                                transform: fanVisible ? 'rotate(45deg)' : 'rotate(0deg)',
                                transition: 'transform 220ms var(--ease-snappy)',
                              }}
                              aria-hidden="true"
                            />
                          </button>
                        )}

                        <button
                          type="submit"
                          className="pcmp__send"
                          aria-label="Gửi"
                          title="Gửi"
                          disabled={!canSend}
                          data-ready={canSend}
                        >
                          <ArrowUp className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
          </div>
        </form>
      </LayoutGroup>
    </div>
  );
};

export default PromptComposer;
