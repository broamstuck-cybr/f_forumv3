import React, { useEffect, useId, useRef, useState } from 'react';
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from 'motion/react';
import './lamp-switch.css';

export interface LampSwitchProps {
  on?: boolean;
  defaultOn?: boolean;
  onToggle?: (on: boolean) => void;
  onLabel?: string;
  offLabel?: string;
  className?: string;
}

const KNOB_OFF = 0;
const KNOB_ON = 142;
const PULL_DETENT = 38;

function rubber(val: number, limit: number): number {
  if (val < 0) return -limit * (1 - Math.exp(val / limit));
  if (val > KNOB_ON) return KNOB_ON + limit * (1 - Math.exp(-(val - KNOB_ON) / limit));
  return val;
}

export const LampSwitch: React.FC<LampSwitchProps> = ({
  on,
  defaultOn = false,
  onToggle,
  onLabel = 'Sáng',
  offLabel = 'Tối',
  className = '',
}) => {
  const reduced = Boolean(useReducedMotion());
  const uid = useId();
  const gooId = `plamp-goo-${uid.replace(/:/g, '')}`;
  const stageRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [internalOn, setInternalOn] = useState(defaultOn);
  const isOn = on !== undefined ? on : internalOn;

  const swingRaw = useMotionValue(0);
  const pullRaw = useMotionValue(0);
  const dropY = useMotionValue(reduced ? 0 : -330);

  const swingAngle = useSpring(swingRaw, { stiffness: 90, damping: 10, mass: 1.2 });
  const pullStretch = useSpring(pullRaw, { stiffness: 230, damping: 18 });
  const cordScaleY = useTransform(pullStretch, (v) => 1 + Math.max(-0.08, v) / 356);
  const combinedY = useTransform([dropY, pullStretch], ([d, p]) => Number(d) + Number(p));

  const knobTarget = useMotionValue(isOn ? KNOB_ON : KNOB_OFF);
  const knobX = useSpring(knobTarget, { stiffness: 340, damping: 28 });
  const tailX = useSpring(knobTarget, { stiffness: 190, damping: 24 });

  const shadeDragRef = useRef<{
    active: boolean;
    startX: number;
    startY: number;
    toggled: boolean;
  }>({ active: false, startX: 0, startY: 0, toggled: false });

  const switchDragRef = useRef<{
    active: boolean;
    startX: number;
    startVal: number;
    moved: boolean;
  }>({ active: false, startX: 0, startVal: 0, moved: false });

  const setLight = (next: boolean) => {
    if (on === undefined) setInternalOn(next);
    onToggle?.(next);
  };

  useEffect(() => {
    knobTarget.set(isOn ? KNOB_ON : KNOB_OFF);
  }, [isOn, knobTarget]);

  useEffect(() => {
    if (reduced) {
      dropY.set(0);
      return;
    }
    dropY.set(-330);
    const ctrl = animate(dropY, 0, {
      delay: 0.4,
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1],
      onComplete: () => {
        pullRaw.set(16);
        window.setTimeout(() => pullRaw.set(0), 90);
      },
    });
    return () => ctrl.stop();
  }, [dropY, pullRaw, reduced]);

  useEffect(() => {
    const el = stageRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver((entries) => {
      const box = entries[0]?.contentRect;
      if (!box) return;
      const room = Math.min(box.width, box.height || box.width);
      setScale(Math.max(0.4, Math.min(1, room / 412)));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={stageRef}
      className={`plamp ${className}`}
      style={{ '--plamp-scale': scale } as React.CSSProperties}
    >
      <div className="plamp__stage">
        <div className="plamp__world">
          <div className="plamp__glow" style={{ opacity: isOn ? 1 : 0 }} aria-hidden="true" />

          <div className="plamp__pivot">
            <motion.div
              className="plamp__pendulum"
              style={{ rotate: swingAngle, y: combinedY }}
            >
              <motion.div className="plamp__cord" style={{ scaleY: cordScaleY }} />
              <div
                className="plamp__grab"
                role="button"
                tabIndex={0}
                aria-label={isOn ? 'Kéo dây để tắt' : 'Kéo dây để bật'}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setLight(!isOn);
                  }
                }}
                onPointerDown={(e) => {
                  e.currentTarget.setPointerCapture(e.pointerId);
                  shadeDragRef.current = {
                    active: true,
                    startX: e.clientX,
                    startY: e.clientY,
                    toggled: false,
                  };
                }}
                onPointerMove={(e) => {
                  if (!shadeDragRef.current.active) return;
                  const dx = (e.clientX - shadeDragRef.current.startX) / scale;
                  const dy = Math.max(-18, (e.clientY - shadeDragRef.current.startY) / scale);
                  swingRaw.set(Math.max(-22, Math.min(22, -dx * 0.14)));
                  pullRaw.set(Math.min(62, dy * 0.72));
                  if (!shadeDragRef.current.toggled && dy >= PULL_DETENT) {
                    shadeDragRef.current.toggled = true;
                    if (typeof navigator !== 'undefined' && navigator.vibrate) {
                      navigator.vibrate(8);
                    }
                    setLight(!isOn);
                  }
                }}
                onPointerUp={() => {
                  shadeDragRef.current.active = false;
                  swingRaw.set(0);
                  pullRaw.set(0);
                }}
                onPointerCancel={() => {
                  shadeDragRef.current.active = false;
                  swingRaw.set(0);
                  pullRaw.set(0);
                }}
              >
                <div className="plamp__cap" />
                <div className="plamp__shade" data-on={isOn} />
                <div className="plamp__bulb" data-on={isOn} />
              </div>
            </motion.div>
          </div>

          <div className="plamp__switchWrap">
            <svg width="0" height="0" aria-hidden="true" style={{ position: 'absolute' }}>
              <defs>
                <filter id={gooId}>
                  <feGaussianBlur in="SourceGraphic" stdDeviation="7" result="blur" />
                  <feColorMatrix
                    in="blur"
                    mode="matrix"
                    values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -10"
                    result="goo"
                  />
                  <feComposite in="SourceGraphic" in2="goo" operator="atop" />
                </filter>
              </defs>
            </svg>

            <button
              type="button"
              role="switch"
              aria-checked={isOn}
              aria-label={isOn ? onLabel : offLabel}
              className="plamp__switch"
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                switchDragRef.current = {
                  active: true,
                  startX: e.clientX,
                  startVal: isOn ? KNOB_ON : KNOB_OFF,
                  moved: false,
                };
              }}
              onPointerMove={(e) => {
                if (!switchDragRef.current.active) return;
                const dx = (e.clientX - switchDragRef.current.startX) / scale;
                if (Math.abs(dx) > 4) switchDragRef.current.moved = true;
                knobTarget.set(rubber(switchDragRef.current.startVal + dx, 14));
              }}
              onPointerUp={() => {
                if (!switchDragRef.current.active) return;
                const wasMoved = switchDragRef.current.moved;
                switchDragRef.current.active = false;
                if (!wasMoved) {
                  setLight(!isOn);
                  return;
                }
                const next = knobTarget.get() > KNOB_ON / 2;
                knobTarget.set(next ? KNOB_ON : KNOB_OFF);
                if (next !== isOn) setLight(next);
              }}
              onPointerCancel={() => {
                switchDragRef.current.active = false;
                knobTarget.set(isOn ? KNOB_ON : KNOB_OFF);
              }}
            >
              <span
                className="plamp__goo"
                style={{ filter: reduced ? undefined : `url(#${gooId})` }}
                aria-hidden="true"
              >
                <motion.span className="plamp__tail" style={{ x: tailX }} />
                <motion.span className="plamp__fill" style={{ x: knobX }} />
              </span>
              <span className="plamp__labels">
                <span className="plamp__label" data-active={!isOn}>
                  {offLabel}
                </span>
                <span className="plamp__label" data-active={isOn}>
                  {onLabel}
                </span>
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LampSwitch;
