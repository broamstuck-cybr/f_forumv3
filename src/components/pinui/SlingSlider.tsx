import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent, type PointerEvent as ReactPointerEvent } from 'react';
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'motion/react';
import './sling-slider.css';

export interface SlingSliderProps {
  min?: number;
  max?: number;
  step?: number;
  defaultValue?: number;
  label?: string;
  unit?: string;
  theme?: 'light' | 'dark';
  onChange?: (value: number) => void;
  className?: string;
}

const clamp = (value: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, value));

export const SlingSlider = ({
  min = 0,
  max = 100,
  step = 1,
  defaultValue = 40,
  label = 'Âm lượng',
  unit = '%',
  theme,
  onChange,
  className = '',
}: SlingSliderProps) => {
  const reduced = Boolean(useReducedMotion());
  const labelId = useId();
  const trackRef = useRef<HTMLDivElement>(null);
  const widthRef = useRef(0);
  const dragging = useRef(false);
  const [value, setValue] = useState(clamp(defaultValue, min, max));
  const [active, setActive] = useState(false);
  const x = useMotionValue(0);
  const pull = useMotionValue(0);
  const fill = useTransform(x, (v) => `${v}px`);
  const stretch = useTransform(pull, (v) => 1 + Math.min(Math.abs(v), 120) / 160);
  const squash = useTransform(pull, (v) => 1 - Math.min(Math.abs(v), 120) / 520);

  const toX = useCallback(
    (v: number) => ((v - min) / (max - min || 1)) * widthRef.current,
    [min, max],
  );

  const commit = useCallback(
    (next: number) => {
      const snapped = clamp(Math.round((next - min) / step) * step + min, min, max);
      setValue((prev) => {
        if (prev !== snapped) onChange?.(snapped);
        return snapped;
      });
      return snapped;
    },
    [min, max, step, onChange],
  );

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const measure = () => {
      widthRef.current = el.clientWidth;
      x.set(toX(value));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [toX, value, x]);


  const moveTo = (clientX: number, release = false) => {
    const el = trackRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const raw = clamp(clientX - rect.left, 0, rect.width);
    const next = commit(min + (raw / (rect.width || 1)) * (max - min));
    const target = toX(next);
    const overshoot = (clientX - rect.left) - target;
    pull.set(release ? 0 : overshoot);
    if (reduced) x.set(target);
    else animate(x, target, { type: 'spring', stiffness: release ? 240 : 520, damping: release ? 11 : 30, mass: 0.7 });
    if (release) animate(pull, 0, { type: 'spring', stiffness: 300, damping: 9 });
  };

  const onDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    dragging.current = true;
    setActive(true);
    event.currentTarget.setPointerCapture(event.pointerId);
    moveTo(event.clientX);
  };
  const onMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (dragging.current) moveTo(event.clientX);
  };
  const onUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    dragging.current = false;
    setActive(false);
    moveTo(event.clientX, true);
  };

  const onKey = (event: KeyboardEvent<HTMLDivElement>) => {
    const big = (max - min) / 10;
    const deltas: Record<string, number> = {
      ArrowRight: step,
      ArrowUp: step,
      ArrowLeft: -step,
      ArrowDown: -step,
      PageUp: big,
      PageDown: -big,
    };
    let next: number | null = null;
    if (event.key in deltas) next = value + deltas[event.key];
    else if (event.key === 'Home') next = min;
    else if (event.key === 'End') next = max;
    if (next === null) return;
    event.preventDefault();
    const snapped = commit(next);
    animate(x, toX(snapped), { type: 'spring', stiffness: 420, damping: 26 });
  };

  return (
    <div className={`psling ${className}`} data-theme={theme} data-active={active || undefined}>
      <div className="psling__head">
        <span id={labelId} className="psling__label">
          {label}
        </span>
        <output className="psling__value" aria-live="off">
          {value}
          <span>{unit}</span>
        </output>
      </div>
      <div
        ref={trackRef}
        className="psling__track"
        role="slider"
        tabIndex={0}
        aria-labelledby={labelId}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={`${value}${unit}`}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onKeyDown={onKey}
      >
        <div className="psling__rail" />
        <motion.div className="psling__fill" style={{ width: fill }} />
        <motion.div className="psling__thumb" style={{ x, scaleX: stretch, scaleY: squash }} data-active={active || undefined}>
          <span className="psling__grip" />
        </motion.div>
      </div>
      <div className="psling__scale" aria-hidden="true">
        <span>{min}</span>
        <span>{Math.round((min + max) / 2)}</span>
        <span>{max}</span>
      </div>
    </div>
  );
};
