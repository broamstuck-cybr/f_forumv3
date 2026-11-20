/* Prompt Composer — ported from Pin UI (https://www.pinui.xyz/components/prompt-composer) · MIT License (c) Rachit Thakur / Shadcn Labs */
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from "react";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion, type Transition } from "motion/react";
import "./prompt-composer.css";

export type ActionId = "image" | "note" | "event" | "voice" | "docs";
export type PromptCardKind = ActionId;

export interface PromptComposerAction {
  id: string;
  label: string;
  placeholder?: string;
  kind?: PromptCardKind;
  accent?: string;
  tilt?: number;
  rise?: number;
  layer?: number;
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
  onNotice?: (message: string) => void;
  extraControls?: ReactNode;
  disabled?: boolean;
  placeholder?: string;
  showFan?: boolean;
  className?: string;
  transcriptText?: string;
  theme?: "light" | "dark";
  menuPlacement?: "down" | "up";
}

type Slot = {
  id: ActionId;
  key: string;
  label: string;
  placeholder: string;
  tilt: number;
  rise: number;
  layer: number;
};

const SLOT_SHAPES: Array<{ id: ActionId; tilt: number; rise: number; layer: number }> = [
  { id: "image", tilt: -5, rise: 0, layer: 1 },
  { id: "note", tilt: 2.5, rise: 3, layer: 2 },
  { id: "event", tilt: -2, rise: 6, layer: 4 },
  { id: "voice", tilt: 3, rise: 3, layer: 3 },
  { id: "docs", tilt: -4.5, rise: 0, layer: 4 },
];

const DEFAULT_ACTIONS: PromptComposerAction[] = [
  { id: "landing", label: "Trang đích", placeholder: "Trang này kể câu chuyện gì?", kind: "image" },
  { id: "note", label: "Ghi chú", placeholder: "Ghi lại yêu cầu của bạn", kind: "note" },
  { id: "club", label: "Hội nhóm", placeholder: "Câu lạc bộ nào, cần trang gì?", kind: "event" },
  { id: "voice", label: "Giọng nói", placeholder: "", kind: "voice" },
  { id: "code", label: "Mã nguồn", placeholder: "Dán đặc tả hoặc mô tả tệp cần dựng", kind: "docs" },
];

const DEFAULT_MODELS: PromptComposerModel[] = [{ name: "Tự chọn", note: "Máy chủ định tuyến" }];

const morph: Transition = { type: "spring", visualDuration: 0.42, bounce: 0.16 };
const fade = (delay = 0): Transition => ({ duration: 0.22, ease: [0.25, 0.1, 0.25, 1], delay });
const blurIn = { opacity: 0, filter: "blur(6px)" };
const blurOut = { opacity: 1, filter: "blur(0px)" };

const CENTRES = [14.2, 32.1, 50, 67.9, 85.8];

type Mode = "idle" | "recording" | "transcribing";

interface SpeechResultLike {
  isFinal: boolean;
  0: { transcript: string };
}

interface SpeechEventLike {
  resultIndex: number;
  results: ArrayLike<SpeechResultLike>;
}

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechEventLike) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

function getSpeechRecognition(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const host = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return host.SpeechRecognition ?? host.webkitSpeechRecognition ?? null;
}

function resolveSlots(actions: PromptComposerAction[]): Slot[] {
  const taken = new Set<ActionId>();
  const picked = actions.slice(0, SLOT_SHAPES.length);
  picked.forEach((a) => {
    if (a.kind && !taken.has(a.kind)) taken.add(a.kind);
  });
  const free = SLOT_SHAPES.map((s) => s.id).filter((id) => !taken.has(id));
  const seen = new Set<ActionId>();
  return picked.map((a, index) => {
    let kind = a.kind;
    if (!kind || seen.has(kind)) kind = free.shift() ?? SLOT_SHAPES[index].id;
    seen.add(kind);
    const shape = SLOT_SHAPES[index];
    return {
      id: kind,
      key: a.id,
      label: a.label,
      placeholder: a.placeholder ?? "",
      tilt: a.tilt ?? shape.tilt,
      rise: a.rise ?? shape.rise,
      layer: a.layer ?? shape.layer,
    };
  });
}

export function PromptComposer({
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
  onNotice,
  extraControls,
  disabled = false,
  placeholder = "Bạn muốn dựng gì?",
  showFan = true,
  className = "",
  theme = "light",
  menuPlacement = "down",
}: PromptComposerProps) {
  const reduced = useReducedMotion();
  const group = useId();
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const heardRef = useRef("");

  const slots = useMemo(() => resolveSlots(actions), [actions]);
  const modelList = models.length ? models : DEFAULT_MODELS;

  const [innerText, setInnerText] = useState("");
  const text = value ?? innerText;
  const setText = useCallback(
    (next: string) => {
      if (value === undefined) setInnerText(next);
      if (onChange) onChange(next);
    },
    [value, onChange]
  );

  const [innerAction, setInnerAction] = useState<ActionId | null>(null);
  const controlledSlot = selectedAction ? slots.find((s) => s.key === selectedAction) : undefined;
  const action: ActionId | null = selectedAction !== undefined ? controlledSlot?.id ?? null : innerAction;
  const setAction = (next: ActionId | null) => {
    if (selectedAction === undefined) setInnerAction(next);
    if (onSelectAction) onSelectAction(next ? slots.find((s) => s.id === next)?.key ?? null : null);
  };

  const [innerModel, setInnerModel] = useState(0);
  const controlledModel = selectedModel ? modelList.findIndex((m) => (m.id ?? m.name) === selectedModel || m.name === selectedModel) : -1;
  const model = controlledModel >= 0 ? controlledModel : Math.min(innerModel, modelList.length - 1);
  const pickModel = (index: number) => {
    setInnerModel(index);
    const next = modelList[index];
    if (onSelectModel && next) onSelectModel(next.id ?? next.name);
  };

  const [mode, setMode] = useState<Mode>("idle");
  const [trayOpen, setTrayOpen] = useState(true);
  const [hovered, setHovered] = useState<ActionId | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuHover, setMenuHover] = useState<number | null>(null);
  const [spins, setSpins] = useState(0);
  const [round, setRound] = useState(0);

  const voiceSlot = slots.find((a) => a.id === "voice" && a.key === "voice") ?? null;
  const picked = action && !(voiceSlot && action === "voice") ? slots.find((a) => a.id === action) ?? null : null;
  const fanUp = showFan && trayOpen && action === null && mode === "idle" && !disabled;
  const canSend = text.trim().length > 0 && mode === "idle" && !disabled;

  const focusField = () => inputRef.current?.focus({ preventScroll: true });

  useEffect(() => {
    if (mode !== "transcribing") return;
    const heard = heardRef.current.trim();
    if (!heard) {
      setMode("idle");
      setTrayOpen(true);
      if (onNotice) onNotice("Chưa nghe được nội dung nào.");
      return;
    }
    let i = 0;
    const t = setInterval(() => {
      i = reduced ? heard.length : i + 1;
      setText(heard.slice(0, i));
      if (i >= heard.length) {
        clearInterval(t);
        setMode("idle");
        focusField();
      }
    }, 22);
    return () => clearInterval(t);
  }, [mode, reduced, setText, onNotice]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) recognitionRef.current.abort();
    };
  }, []);

  const startListening = () => {
    const Recognition = getSpeechRecognition();
    if (!Recognition) {
      if (onNotice) onNotice("Trình duyệt này chưa hỗ trợ nhập giọng nói.");
      return;
    }
    heardRef.current = "";
    const recognition = new Recognition();
    recognition.lang = "vi-VN";
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        if (result.isFinal) heardRef.current = `${heardRef.current} ${result[0].transcript}`.trim();
      }
    };
    recognition.onerror = (event) => {
      recognitionRef.current = null;
      setMode("idle");
      setTrayOpen(true);
      if (onNotice) {
        onNotice(
          event.error === "not-allowed"
            ? "Chưa được cấp quyền micro."
            : "Không ghi âm được. Hãy thử lại."
        );
      }
    };
    recognition.onend = () => {
      if (recognitionRef.current === recognition) {
        recognitionRef.current = null;
        setMode((current) => (current === "recording" ? "transcribing" : current));
      }
    };
    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      recognitionRef.current = null;
      if (onNotice) onNotice("Không ghi âm được. Hãy thử lại.");
      return;
    }
    setAction(null);
    setText("");
    setMode("recording");
  };

  const pick = (id: ActionId) => {
    setHovered(null);
    setMenuOpen(false);
    if (id === "voice" && voiceSlot) {
      startListening();
      return;
    }
    setAction(id);
    focusField();
  };

  const clearAction = () => {
    setAction(null);
    setTrayOpen(true);
    focusField();
  };

  const stopRecording = useCallback(() => {
    const recognition = recognitionRef.current;
    if (recognition) {
      recognition.stop();
      return;
    }
    setMode("transcribing");
  }, []);

  const cancelRecording = () => {
    const recognition = recognitionRef.current;
    recognitionRef.current = null;
    if (recognition) recognition.abort();
    heardRef.current = "";
    setMode("idle");
    setTrayOpen(true);
  };

  const send = (e?: FormEvent) => {
    e?.preventDefault();
    if (!canSend) return;
    const slot = action ? slots.find((s) => s.id === action) : undefined;
    const current = modelList[model];
    onSend(text.trim(), { action: slot ? slot.key : null, model: current ? current.id ?? current.name : "" });
    setText("");
    setAction(null);
    setTrayOpen(true);
    setHovered(null);
    setMenuOpen(false);
    setRound((n) => n + 1);
  };

  const onInputKey = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape" && action) {
      e.preventDefault();
      clearAction();
    } else if (e.key === "Backspace" && action && text === "") {
      clearAction();
    }
  };

  const recording = mode === "recording";

  return (
    <div
      className={`pcmp ${className}`}
      data-theme={theme}
      data-menu={menuPlacement}
      data-disabled={disabled || undefined}
    >
      <LayoutGroup id={layoutId ?? `pcmp-${group}`}>
        <form className="pcmp__row" onSubmit={send}>
          <div className="pcmp__side">
            <ModelPill
              models={modelList}
              model={model}
              open={menuOpen}
              hover={menuHover}
              onToggle={() => setMenuOpen((o) => !o)}
              onClose={() => setMenuOpen(false)}
              onHover={setMenuHover}
              onPick={(i) => {
                pickModel(i);
                setMenuOpen(false);
              }}
            />
            {extraControls}
          </div>

          <div className="pcmp__fieldWrap">
            <div className="pcmp__field">
                            <div className="pcmp__fan" key={round} hidden={!showFan} onPointerLeave={() => setHovered(null)}>
                {slots.map((a, i) => {
                  const lifted = hovered === a.id;
                  const h = hovered ? slots.findIndex((x) => x.id === hovered) : -1;
                  const lean = h < 0 || h === i ? 0 : i < h ? -1 : 1;
                  const near = h >= 0 && Math.abs(h - i) === 1;
                  const sinking = a.id === action || (a.id === "voice" && recording);
                  return (
                    <motion.button
                      key={a.id}
                      type="button"
                      className={`pcmp__card pcmp__card--${a.id}`}
                      style={{ left: `calc(${CENTRES[i]}% - var(--pcmp-card-w) / 2)`, zIndex: lifted ? 10 : a.layer }}
                      aria-label={a.label}
                      tabIndex={fanUp ? 0 : -1}
                      aria-hidden={!fanUp}
                      onPointerEnter={(e) => e.pointerType === "mouse" && fanUp && setHovered(a.id)}
                      onFocus={() => fanUp && setHovered(a.id)}
                      onBlur={() => setHovered(null)}
                      onClick={() => fanUp && pick(a.id)}
                      initial={reduced ? false : { y: "115%", rotate: 0, scale: 0.92 }}
                      animate={
                        fanUp
                          ? {
                              y: -a.rise + (lifted ? -16 : near ? -3 : 0),
                              x: lean * (near ? 10 : 4),
                              rotate: lifted ? a.tilt * 0.3 : a.tilt + lean * (near ? 1.5 : 0.5),
                              scale: lifted ? 1.05 : 1,
                              opacity: 1,
                            }
                          : { y: "115%", x: 0, rotate: 0, scale: 0.92, opacity: reduced ? 0 : 1 }
                      }
                      transition={{
                        ...morph,
                        delay: reduced ? 0 : fanUp ? (hovered ? 0 : 0.05 + i * 0.045) : sinking ? 0.06 : 0,
                        opacity: fade(),
                      }}
                      whileTap={reduced || !fanUp ? undefined : { scale: 0.97, y: -10 - a.rise }}
                    >
                      <motion.span
                        className="pcmp__cardFace"
                        initial={false}
                        animate={{ "--pcmp-peel": a.id === "docs" && lifted && !reduced ? 1.2 : 1 } as Record<string, number>}
                        transition={morph}
                      >
                        {(a.id === "note" || a.id === "event") && <span className="pcmp__band" />}
                        {a.id === "docs" && <span className="pcmp__peel" aria-hidden="true" />}
                        <span className="pcmp__label">{a.label}</span>
                        <span className="pcmp__artBox">
                          <CardArt id={a.id} live={lifted} />
                        </span>
                      </motion.span>
                    </motion.button>
                  );
                })}
              </div>

                            <div className="pcmp__bar" data-recording={recording || undefined}>
                <AnimatePresence mode="popLayout" initial={false}>
                  {recording ? (
                    <motion.div
                      key="recorder"
                      className="pcmp__recorder"
                      initial={reduced ? { opacity: 0 } : { ...blurIn, y: 6 }}
                      animate={{ ...blurOut, y: 0 }}
                      exit={reduced ? { opacity: 0 } : { ...blurIn, y: -6 }}
                      transition={{ ...morph, opacity: fade(), filter: fade() }}
                    >
                      <Recorder onCancel={cancelRecording} onStop={stopRecording} />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="typer"
                      className="pcmp__typer"
                      initial={reduced ? { opacity: 0 } : { ...blurIn, y: 6 }}
                      animate={{ ...blurOut, y: 0 }}
                      exit={reduced ? { opacity: 0 } : { ...blurIn, y: -6 }}
                      transition={{ ...morph, opacity: fade(), filter: fade() }}
                    >
                      <AnimatePresence mode="popLayout" initial={false}>
                        {picked && (
                          <motion.button
                            key={picked.id}
                            type="button"
                            className={`pcmp__chip pcmp__chip--${picked.id}`}
                            onClick={clearAction}
                            aria-label={`Bỏ ${picked.label}`}
                            initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.6, y: -10, filter: "blur(6px)" }}
                            animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
                            exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.7, filter: "blur(6px)" }}
                            transition={{
                              ...morph,
                              delay: reduced ? 0 : 0.12,
                              opacity: fade(reduced ? 0 : 0.12),
                              filter: fade(reduced ? 0 : 0.12),
                            }}
                            whileTap={reduced ? undefined : { scale: 0.94 }}
                          >
                            <ChipIcon id={picked.id} />
                            <span>{picked.label}</span>
                            <svg className="pcmp__chipX" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                              <path d="m3.5 3.5 5 5m0-5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                            </svg>
                          </motion.button>
                        )}
                      </AnimatePresence>

                      <motion.div className="pcmp__inputWrap" layout="position" transition={morph}>
                        <label htmlFor={inputId} className="pcmp__sr">
                          Lời nhắc
                        </label>
                        <input
                          ref={inputRef}
                          id={inputId}
                          className="pcmp__input"
                          value={text}
                          onChange={(e) => setText(e.target.value)}
                          placeholder=""
                          onKeyDown={onInputKey}
                          readOnly={mode === "transcribing" || disabled}
                          autoComplete="off"
                        />
                                                <AnimatePresence mode="popLayout" initial={false}>
                          {text === "" && (
                            <motion.span
                              key={picked?.placeholder || placeholder}
                              className="pcmp__placeholder"
                              aria-hidden="true"
                              initial={reduced ? { opacity: 0 } : { opacity: 0, x: 8, filter: "blur(4px)" }}
                              animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                              exit={reduced ? { opacity: 0 } : { opacity: 0, x: -8, filter: "blur(4px)" }}
                              transition={{ ...morph, opacity: fade(), filter: fade() }}
                            >
                              {picked?.placeholder || placeholder}
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </motion.div>

                      <div className="pcmp__tools">
                        <motion.button
                          type="button"
                          className="pcmp__tool"
                          aria-label={fanUp ? "Ẩn thao tác nhanh" : "Hiện thao tác nhanh"}
                          aria-expanded={fanUp}
                          disabled={mode !== "idle"}
                          onClick={() => {
                            setSpins((n) => n + 1);
                            if (action) clearAction();
                            else setTrayOpen((o) => !o);
                          }}
                          whileTap={reduced ? undefined : { scale: 0.86 }}
                          transition={morph}
                        >
                          <motion.svg
                            viewBox="0 0 20 20"
                            fill="none"
                            aria-hidden="true"
                            animate={{ rotate: spins * 90 }}
                            transition={morph}
                          >
                            <path d="M10 3.75v12.5M3.75 10h12.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                          </motion.svg>
                        </motion.button>

                        {onAttachClick && (
                          <motion.button
                            type="button"
                            className="pcmp__tool"
                            aria-label="Đính kèm"
                            disabled={mode !== "idle"}
                            onClick={onAttachClick}
                            whileTap={reduced ? undefined : { scale: 0.86 }}
                            transition={morph}
                          >
                            <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                              <path d="M14.5 9.2 9.6 14.1a2.9 2.9 0 0 1-4.1-4.1l5.6-5.6a1.9 1.9 0 0 1 2.7 2.7l-5.5 5.5a.95.95 0 0 1-1.35-1.35l4.7-4.7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </motion.button>
                        )}

                        <motion.button
                          type="button"
                          className="pcmp__tool"
                          aria-label="Nhập giọng nói"
                          disabled={mode !== "idle"}
                          onClick={startListening}
                          whileTap={reduced ? undefined : { scale: 0.86 }}
                          transition={morph}
                        >
                          <MicGlyph />
                        </motion.button>

                                                <motion.button
                          type="submit"
                          className="pcmp__send"
                          aria-label="Gửi"
                          disabled={!canSend}
                          data-ready={canSend || undefined}
                          whileTap={reduced || !canSend ? undefined : { scale: 0.88 }}
                          transition={morph}
                        >
                          <motion.svg
                            viewBox="0 0 16 16"
                            fill="none"
                            aria-hidden="true"
                            animate={canSend && !reduced ? { y: [0, -1.5, 0] } : { y: 0 }}
                            transition={{ duration: 0.35, ease: "easeOut" }}
                          >
                            <path d="M8 12.75V3.5M4 7.5l4-4 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                          </motion.svg>
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

        </form>
      </LayoutGroup>
    </div>
  );
}

function MicGlyph() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <rect x="7" y="2.75" width="6" height="9.5" rx="3" stroke="currentColor" strokeWidth="1.7" />
      <path d="M4.6 9.5a5.4 5.4 0 0 0 10.8 0M10 15v2.25" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

const BARS = 44;
const STEP_MS = 75;

function Recorder({ onCancel, onStop }: { onCancel: () => void; onStop: () => void }) {
  const reduced = useReducedMotion();
  const barsRef = useRef<HTMLSpanElement[]>([]);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const levels = Array.from({ length: BARS }, () => 0.08);
    let syllable = 0;
    let word = 4 + Math.floor(Math.random() * 6);
    let pause = 0;
    const next = () => {
      if (pause > 0) {
        pause -= 1;
        return 0.06 + Math.random() * 0.05;
      }
      syllable += 1;
      if (syllable > word) {
        syllable = 0;
        word = 3 + Math.floor(Math.random() * 7);
        pause = 1 + Math.floor(Math.random() * 3);
        return 0.1;
      }
      const mid = 1 - Math.abs(syllable / word - 0.5) * 1.2;
      return Math.min(1, 0.25 + mid * 0.55 + Math.random() * 0.35);
    };
    const paint = () => {
      barsRef.current.forEach((el, i) => {
        if (el) el.style.transform = `scaleY(${levels[i].toFixed(3)})`;
      });
    };
    if (reduced) {
      for (let i = 0; i < BARS; i++) levels[i] = 0.15 + 0.5 * Math.abs(Math.sin(i * 0.7));
      paint();
      return;
    }
    const t = setInterval(() => {
      levels.shift();
      levels.push(next());
      paint();
    }, STEP_MS);
    paint();
    return () => clearInterval(t);
  }, [reduced]);

  const clock = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

  return (
    <>
      <span className="pcmp__rec" aria-hidden="true">
        <motion.span
          className="pcmp__recDot"
          animate={reduced ? undefined : { opacity: [1, 0.35, 1] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
        />
        <span className="pcmp__recClock">{clock}</span>
      </span>
      <span className="pcmp__sr" role="status">
        Đang nghe
      </span>
      <span className="pcmp__wave" aria-hidden="true">
        {Array.from({ length: BARS }, (_, i) => (
          <span
            key={i}
            className="pcmp__waveBar"
            ref={(el) => {
              if (el) barsRef.current[i] = el;
            }}
          />
        ))}
      </span>
      <div className="pcmp__tools">
        <motion.button
          type="button"
          className="pcmp__tool"
          aria-label="Hủy ghi âm"
          onClick={onCancel}
          whileTap={reduced ? undefined : { scale: 0.86 }}
          transition={morph}
        >
          <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="m5.5 5.5 9 9m0-9-9 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </motion.button>
        <motion.button
          type="button"
          className="pcmp__stop"
          aria-label="Dừng ghi âm"
          onClick={onStop}
          whileTap={reduced ? undefined : { scale: 0.88 }}
          transition={morph}
        >
          {!reduced && (
            <motion.span
              className="pcmp__ring"
              initial={{ scale: 0.8, opacity: 0.5 }}
              animate={{ scale: 1.6, opacity: 0 }}
              transition={{ duration: 1.4, ease: "easeOut", repeat: Infinity }}
            />
          )}
          <span className="pcmp__stopSquare" />
        </motion.button>
      </div>
    </>
  );
}

function ModelPill({
  models,
  model,
  open,
  hover,
  onToggle,
  onClose,
  onHover,
  onPick,
}: {
  models: PromptComposerModel[];
  model: number;
  open: boolean;
  hover: number | null;
  onToggle: () => void;
  onClose: () => void;
  onHover: (i: number | null) => void;
  onPick: (i: number) => void;
}) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) onClose();
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", away);
      document.removeEventListener("keydown", esc);
    };
  }, [open, onClose]);

  return (
    <div className="pcmp__model" ref={ref}>
      <motion.button
        type="button"
        className="pcmp__pill"
        layout
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={onToggle}
        whileTap={reduced ? undefined : { scale: 0.95 }}
        transition={morph}
      >
        <motion.svg
          className="pcmp__petals"
          layout="position"
          viewBox="0 0 16 16"
          aria-hidden="true"
          animate={{ rotate: model * 60 }}
          transition={morph}
        >
                    {Array.from({ length: 6 }, (_, i) => (
            <circle key={i} cx="8" cy="3.9" r="2.6" fill="currentColor" transform={`rotate(${i * 60} 8 8)`} />
          ))}
          <circle cx="8" cy="8" r="2" fill="var(--pcmp-pill)" />
        </motion.svg>
        <span className="pcmp__pillName">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={models[model].name}
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 6, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, y: -6, filter: "blur(4px)" }}
              transition={{ ...morph, opacity: fade(), filter: fade() }}
            >
              {models[model].name}
            </motion.span>
          </AnimatePresence>
        </span>
        <motion.svg
          className="pcmp__caret"
          layout="position"
          viewBox="0 0 10 10"
          fill="none"
          aria-hidden="true"
          animate={{ rotate: open ? 180 : 0 }}
          transition={morph}
        >
          <path d="m2.5 4 2.5 2.5L7.5 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </motion.svg>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            id={menuId}
            className="pcmp__menu"
            role="listbox"
            aria-label="Mô hình"
            initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: -4, filter: "blur(6px)" }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: -4, filter: "blur(6px)" }}
            transition={{ ...morph, opacity: fade(), filter: fade() }}
            onPointerLeave={() => onHover(null)}
          >
            {models.map((m, i) => (
              <motion.button
                key={m.name}
                type="button"
                role="option"
                aria-selected={i === model}
                className="pcmp__option"
                onPointerEnter={() => onHover(i)}
                onFocus={() => onHover(i)}
                onClick={() => onPick(i)}
                initial={reduced ? false : { opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  ...morph,
                  opacity: fade(reduced ? 0 : 0.03 + i * 0.03),
                  y: { ...morph, delay: reduced ? 0 : 0.03 + i * 0.03 },
                }}
              >
                {hover === i && <motion.span layoutId="pcmp-option-hover" className="pcmp__optionHover" transition={morph} />}
                <span className="pcmp__optionText">
                  <span className="pcmp__optionName">{m.name}</span>
                  <span className="pcmp__optionNote">{m.note}</span>
                </span>
                {i === model && (
                  <motion.svg
                    layoutId="pcmp-option-check"
                    className="pcmp__check"
                    viewBox="0 0 14 14"
                    fill="none"
                    aria-hidden="true"
                    transition={morph}
                  >
                    <path d="m3 7.4 2.6 2.6L11 4.4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                  </motion.svg>
                )}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CardArt({ id, live }: { id: ActionId; live: boolean }) {
  const reduced = useReducedMotion();
  const uid = useId().replace(/:/g, "");
  const go = live && !reduced;
  const spin = { transformBox: "fill-box" as const, transformOrigin: "center" };

  if (id === "image") {
    return (
      <svg className="pcmp__art" viewBox="0 0 80 64" fill="none" aria-hidden="true">
        <motion.path
          d="M52 4c1.3 7.4 3.6 9.7 11 11-7.4 1.3-9.7 3.6-11 11-1.3-7.4-3.6-9.7-11-11 7.4-1.3 9.7-3.6 11-11Z"
          fill="var(--pcmp-art-deep)"
          style={spin}
          animate={go ? { rotate: 90, scale: 1.2 } : { rotate: 0, scale: 1 }}
          transition={morph}
        />
        <motion.path
          d="M24 22 35 41H13Z"
          stroke="var(--pcmp-art)"
          strokeWidth="5"
          strokeLinejoin="round"
          style={spin}
          animate={go ? { rotate: -14, y: -2 } : { rotate: 0, y: 0 }}
          transition={morph}
        />
        <rect x="12" y="48" width="18" height="18" rx="4.5" stroke="var(--pcmp-art)" strokeWidth="5" />
        <motion.circle
          cx="52"
          cy="54"
          r="9"
          stroke="var(--pcmp-art)"
          strokeWidth="5"
          animate={go ? { y: -3 } : { y: 0 }}
          transition={{ ...morph, delay: go ? 0.04 : 0 }}
        />
      </svg>
    );
  }

  if (id === "note") {
    return (
      <span className="pcmp__lines" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <motion.span
            key={i}
            className="pcmp__line"
            animate={go ? { scaleX: [0.15, 1] } : { scaleX: 1 }}
            transition={go ? { duration: 0.5, ease: [0.2, 0, 0, 1], delay: i * 0.06 } : morph}
          />
        ))}
      </span>
    );
  }

  if (id === "event") {
    return (
      <motion.span className="pcmp__date" aria-hidden="true" animate={go ? { y: -3, scale: 1.06 } : { y: 0, scale: 1 }} transition={morph}>
        12
      </motion.span>
    );
  }

  if (id === "voice") {
    return (
      <svg className="pcmp__art" viewBox="0 0 80 64" fill="none" aria-hidden="true">
        <defs>
          <linearGradient id={`pcmp-mic-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--pcmp-art)" />
            <stop offset="1" stopColor="var(--pcmp-art-deep)" />
          </linearGradient>
        </defs>
        <path d="M18 34c0 13 9.5 22 22 22s22-9 22-22" stroke="var(--pcmp-art)" strokeWidth="5" strokeLinecap="round" />
        <motion.rect x="28" y="2" width="24" height="44" rx="12" fill={`url(#pcmp-mic-${uid})`} animate={go ? { y: -2 } : { y: 0 }} transition={morph} />
        <motion.g
          style={spin}
          animate={go ? { scale: [1, 1.14, 1] } : { scale: 1 }}
          transition={go ? { duration: 0.9, repeat: Infinity, ease: "easeInOut" } : morph}
        >
          <circle cx="40" cy="46" r="11" fill="var(--pcmp-rec)" />
          <circle cx="40" cy="46" r="4" fill="var(--pcmp-rec-dot)" />
        </motion.g>
      </svg>
    );
  }

  return (
    <svg className="pcmp__art" viewBox="0 0 80 64" fill="none" aria-hidden="true">
      <motion.g style={spin} animate={go ? { rotate: -4, y: -2 } : { rotate: 0, y: 0 }} transition={morph}>
        <rect x="16" y="4" width="48" height="60" rx="8" fill="var(--pcmp-art)" />
        <motion.rect
          x="31"
          y="24"
          width="24"
          height="5.5"
          rx="2.75"
          fill="var(--pcmp-card)"
          style={{ transformBox: "fill-box", transformOrigin: "0% 50%" }}
          animate={go ? { scaleX: 1.15 } : { scaleX: 1 }}
          transition={morph}
        />
        <motion.rect
          x="31"
          y="36"
          width="24"
          height="5.5"
          rx="2.75"
          fill="var(--pcmp-card)"
          style={{ transformBox: "fill-box", transformOrigin: "0% 50%" }}
          animate={go ? { scaleX: 0.7 } : { scaleX: 1 }}
          transition={morph}
        />
      </motion.g>
    </svg>
  );
}

function ChipIcon({ id }: { id: ActionId }) {
  const paths: Record<ActionId, ReactNode> = {
    image: <path d="M8 1.8c.6 3.3 1.6 4.3 4.9 4.9-3.3.6-4.3 1.6-4.9 4.9-.6-3.3-1.6-4.3-4.9-4.9 3.3-.6 4.3-1.6 4.9-4.9Z" fill="currentColor" />,
    note: (
      <>
        <rect x="2.5" y="2.5" width="11" height="11" rx="2.5" stroke="currentColor" strokeWidth="1.4" />
        <path d="M5.2 6.5h5.6M5.2 9.5h3.6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </>
    ),
    event: (
      <>
        <rect x="2.5" y="3.2" width="11" height="10.3" rx="2.5" stroke="currentColor" strokeWidth="1.4" />
        <path d="M2.5 6.6h11M5.5 1.8v2.6M10.5 1.8v2.6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </>
    ),
    voice: (
      <>
        <rect x="5.6" y="1.8" width="4.8" height="7.6" rx="2.4" fill="currentColor" />
        <path d="M3.6 7.6a4.4 4.4 0 0 0 8.8 0M8 12v2.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </>
    ),
    docs: (
      <>
        <path
          d="M4 1.9h5.2L12.6 5.3v7.6a1.3 1.3 0 0 1-1.3 1.3H4a1.3 1.3 0 0 1-1.3-1.3V3.2A1.3 1.3 0 0 1 4 1.9Z"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        <path d="M5.4 8.5h4.6M5.4 11h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </>
    ),
  };
  return (
    <svg className="pcmp__chipIcon" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      {paths[id]}
    </svg>
  );
}

export default PromptComposer;
