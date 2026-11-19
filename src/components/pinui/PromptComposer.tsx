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
import { ArrowUp, Check, ChevronDown, Paperclip, Plus, X } from 'lucide-react';

export interface PromptComposerAction {
  id: string;
  label: string;
  placeholder?: string;
  accent?: string;
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
}

const DEFAULT_ACTIONS: PromptComposerAction[] = [
  { id: 'landing', label: 'Landing Page', placeholder: 'Mô tả trang Landing Page cần dựng...', accent: 'var(--accent-primary)' },
  { id: 'dashboard', label: 'Dashboard', placeholder: 'Mô tả bảng điều khiển và chỉ số...', accent: 'var(--accent-verdigris)' },
  { id: 'club-hub', label: 'Club Hub', placeholder: 'Thiết kế không gian CLB và hồ sơ dự án...', accent: 'var(--accent-jade)' },
  { id: 'quiz-tools', label: 'Quiz & Tools', placeholder: 'Tạo công cụ luyện tập hoặc quiz tương tác...', accent: 'var(--accent-copper)' },
  { id: 'design-code', label: 'Design to Code', placeholder: 'Dán mô tả giao diện để chuyển thành HTML/CSS/JS...', accent: 'var(--accent-primary)' },
];

const DEFAULT_MODELS: PromptComposerModel[] = [
  { id: 'auto', name: 'Auto Router', note: 'Tự động chọn model tối ưu' },
  { id: 'obsidian-fast', name: 'Fast Draft', note: 'Phản hồi nhanh cho bản mẫu' },
  { id: 'architect-deep', name: 'Deep Craft', note: 'Ưu tiên cấu trúc & kiểm định' },
];

const CARD_GEOMETRY = [
  { centre: 11.5, tilt: -4.2, rise: 0, layer: 1 },
  { centre: 30.75, tilt: 2, rise: 4, layer: 2 },
  { centre: 50, tilt: -1.4, rise: 7, layer: 4 },
  { centre: 69.25, tilt: 2.2, rise: 4, layer: 3 },
  { centre: 88.5, tilt: -3.6, rise: 0, layer: 2 },
];

const MORPH_SPRING: Transition = { type: 'spring', visualDuration: 0.42, bounce: 0.16 };

function ActionArt({ index, accent }: { index: number; accent: string }) {
  if (index === 0) {
    return (
      <svg viewBox="0 0 64 40" className="w-8 h-5 sm:w-11 sm:h-7 mx-auto shrink-0" fill="none" aria-hidden="true">
        <rect x="4" y="5" width="56" height="30" rx="5" stroke={accent} strokeWidth="2.2" />
        <line x1="12" y1="15" x2="36" y2="15" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" opacity="0.7" />
        <line x1="12" y1="23" x2="48" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.35" />
      </svg>
    );
  }
  if (index === 1) {
    return (
      <svg viewBox="0 0 64 40" className="w-8 h-5 sm:w-11 sm:h-7 mx-auto shrink-0" fill="none" aria-hidden="true">
        <rect x="6" y="20" width="10" height="14" rx="2.5" fill={accent} opacity="0.6" />
        <rect x="21" y="12" width="10" height="22" rx="2.5" fill={accent} opacity="0.85" />
        <rect x="36" y="16" width="10" height="18" rx="2.5" fill="currentColor" opacity="0.35" />
        <rect x="51" y="8" width="8" height="26" rx="2.5" fill={accent} />
      </svg>
    );
  }
  if (index === 2) {
    return (
      <svg viewBox="0 0 64 40" className="w-8 h-5 sm:w-11 sm:h-7 mx-auto shrink-0" fill="none" aria-hidden="true">
        <circle cx="22" cy="18" r="7" stroke={accent} strokeWidth="2.2" />
        <circle cx="42" cy="18" r="7" stroke="currentColor" strokeWidth="2" opacity="0.45" />
        <path d="M12 34c2-5 6-7 10-7s8 2 10 7" stroke={accent} strokeWidth="2.2" strokeLinecap="round" />
        <path d="M34 34c2-4 5-6 8-6s6 2 8 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.45" />
      </svg>
    );
  }
  if (index === 3) {
    return (
      <svg viewBox="0 0 64 40" className="w-8 h-5 sm:w-11 sm:h-7 mx-auto shrink-0" fill="none" aria-hidden="true">
        <rect x="8" y="6" width="48" height="28" rx="6" stroke="currentColor" strokeWidth="2" opacity="0.35" />
        <path d="M19 20l6 6 12-12" stroke={accent} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="42" y1="20" x2="48" y2="20" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" opacity="0.5" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 64 40" className="w-8 h-5 sm:w-11 sm:h-7 mx-auto shrink-0" fill="none" aria-hidden="true">
      <path d="M22 13l-8 7 8 7" stroke={accent} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M42 13l8 7-8 7" stroke={accent} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="35" y1="10" x2="29" y2="30" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" opacity="0.55" />
    </svg>
  );
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
  placeholder = 'Mô tả giao diện, ứng dụng hoặc tính năng bạn muốn xây dựng...',
  showFan = true,
  className = '',
}) => {
  const reduced = Boolean(useReducedMotion());
  const uid = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const [internalText, setInternalText] = useState('');
  const [internalAction, setInternalAction] = useState<string | null>(null);
  const [internalModel, setInternalModel] = useState(models[0]?.name ?? 'Auto Router');
  const [trayOpen, setTrayOpen] = useState(showFan);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const text = value !== undefined ? value : internalText;
  const activeActionId = selectedAction !== undefined ? selectedAction : internalAction;
  const activeModel = selectedModel !== undefined ? selectedModel : internalModel;

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

  const fanActions = actions.slice(0, 5);
  const pickedAction = fanActions.find((a) => a.id === activeActionId) ?? null;
  const fanVisible = showFan && trayOpen && activeActionId === null && fanActions.length > 0;
  const canSend = !disabled && text.trim().length > 0;

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
    <div className={`pcmp ${className}`}>
      <LayoutGroup id={`pcmp-${uid}`}>
        <form className="pcmp__row" onSubmit={handleSubmit}>
          {models.length > 0 && (
            <div className="pcmp__side" ref={menuRef}>
              <div className="pcmp__model">
                <button
                  type="button"
                  className="pcmp__pill"
                  aria-haspopup="listbox"
                  aria-expanded={menuOpen}
                  onClick={() => setMenuOpen((prev) => !prev)}
                >
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ background: 'var(--accent-primary)' }}
                    aria-hidden="true"
                  />
                  <span>{activeModel}</span>
                  <ChevronDown className="h-3.5 w-3.5 opacity-75" aria-hidden="true" />
                </button>

                <AnimatePresence>
                  {menuOpen && (
                    <motion.div
                      className="pcmp__menu"
                      role="listbox"
                      aria-label="Chọn chế độ AI"
                      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 6, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={reduced ? { opacity: 0 } : { opacity: 0, y: 4, scale: 0.96 }}
                      transition={MORPH_SPRING}
                    >
                      {models.map((m) => {
                        const isSelected = m.name === activeModel || m.id === activeModel;
                        return (
                          <button
                            key={m.id ?? m.name}
                            type="button"
                            role="option"
                            aria-selected={isSelected}
                            className="pcmp__option"
                            onClick={() => {
                              setModel(m.name);
                              setMenuOpen(false);
                            }}
                          >
                            <span className="flex flex-col">
                              <span className="text-[13px] font-medium" style={{ color: 'var(--ink-primary)' }}>
                                {m.name}
                              </span>
                              {m.note && (
                                <span className="text-[11px]" style={{ color: 'var(--ink-muted)' }}>
                                  {m.note}
                                </span>
                              )}
                            </span>
                            {isSelected && (
                              <Check className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--accent-primary)' }} />
                            )}
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
                    const geo = CARD_GEOMETRY[idx] ?? CARD_GEOMETRY[2];
                    const lifted = hoveredId === act.id;
                    const hoveredIndex = hoveredId ? fanActions.findIndex((x) => x.id === hoveredId) : -1;
                    const lean = hoveredIndex < 0 || hoveredIndex === idx ? 0 : idx < hoveredIndex ? -1 : 1;
                    const near = hoveredIndex >= 0 && Math.abs(hoveredIndex - idx) === 1;
                    const accent = act.accent ?? 'var(--accent-primary)';

                    return (
                      <motion.button
                        key={act.id}
                        type="button"
                        className="pcmp__card"
                        style={{
                          left: `calc(${geo.centre}% - var(--pcmp-card-w) / 2)`,
                          zIndex: lifted ? 12 : geo.layer,
                        }}
                        aria-label={act.label}
                        tabIndex={fanVisible ? 0 : -1}
                        aria-hidden={!fanVisible}
                        onPointerEnter={(e) => {
                          if (e.pointerType === 'mouse' && fanVisible) setHoveredId(act.id);
                        }}
                        onFocus={() => fanVisible && setHoveredId(act.id)}
                        onBlur={() => setHoveredId(null)}
                        onClick={() => {
                          if (!fanVisible) return;
                          setHoveredId(null);
                          setAction(act.id);
                          inputRef.current?.focus({ preventScroll: true });
                        }}
                        initial={reduced ? false : { y: '115%', rotate: 0, scale: 0.92 }}
                        animate={
                          fanVisible
                            ? {
                                y: -geo.rise + (lifted ? -14 : near ? -3 : 0),
                                x: lean * (near ? 6 : 2),
                                rotate: lifted ? geo.tilt * 0.25 : geo.tilt + lean * (near ? 1.2 : 0.3),
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
                        <span className="pcmp__cardFace">
                          <span className="pcmp__cardBand" style={{ background: accent }} aria-hidden="true" />
                          <span className="pcmp__label">{act.label}</span>
                          <ActionArt index={idx} accent={accent} />
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              )}

              <motion.div layoutId={layoutId} transition={MORPH_SPRING} className="pcmp__bar">
                <div className="pcmp__typer">
                  <AnimatePresence mode="popLayout" initial={false}>
                    {pickedAction && (
                      <motion.button
                        key={pickedAction.id}
                        type="button"
                        className="pcmp__chip"
                        onClick={() => {
                          setAction(null);
                          setTrayOpen(showFan);
                          inputRef.current?.focus({ preventScroll: true });
                        }}
                        aria-label={`Bỏ chế độ ${pickedAction.label}`}
                        initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.78, y: -6 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.78 }}
                        transition={MORPH_SPRING}
                      >
                        <span>{pickedAction.label}</span>
                        <X className="h-3.5 w-3.5 opacity-80" aria-hidden="true" />
                      </motion.button>
                    )}
                  </AnimatePresence>

                  <div className="pcmp__inputWrap">
                    <label htmlFor={`pcmp-input-${uid}`} className="sr-only">
                      Nhập yêu cầu AI
                    </label>
                    <input
                      ref={inputRef}
                      id={`pcmp-input-${uid}`}
                      type="text"
                      className="pcmp__input"
                      value={text}
                      disabled={disabled}
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
                        aria-label="Đính kèm tệp hoặc ngữ cảnh"
                        disabled={disabled}
                        onClick={onAttachClick}
                      >
                        <Paperclip className="h-4 w-4" aria-hidden="true" />
                      </button>
                    )}

                    {showFan && fanActions.length > 0 && (
                      <button
                        type="button"
                        className="pcmp__tool"
                        aria-label={fanVisible ? 'Ẩn thẻ tác vụ nhanh' : 'Hiện thẻ tác vụ nhanh'}
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
                      aria-label="Gửi yêu cầu"
                      disabled={!canSend}
                      data-ready={canSend}
                    >
                      <ArrowUp className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </form>
      </LayoutGroup>
    </div>
  );
};

export default PromptComposer;
