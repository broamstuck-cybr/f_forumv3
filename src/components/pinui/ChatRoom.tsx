import React, { useId, useState } from 'react';
import { LayoutGroup, motion, useReducedMotion, type Transition } from 'motion/react';
import { IconX } from '../../ui/icons';
import './chat-room.css';

export interface ChatRoomPerson {
  id: string;
  name: string;
  role: string;
  initials: string;
  hue: string;
  speaking?: boolean;
}

export interface ChatRoomProps {
  title?: string;
  people?: ChatRoomPerson[];
  corner?: number;
  sound?: boolean;
  defaultOpen?: boolean;
  onJoinChange?: (joined: boolean) => void;
  className?: string;
}

export const CHAT_ROOM_PEOPLE: ChatRoomPerson[] = [
  { id: 'cr-1', name: 'Minh Khoa', role: 'Thiết kế', initials: 'MK', hue: '#c89b54', speaking: true },
  { id: 'cr-2', name: 'Gia Hân', role: 'Phản biện', initials: 'GH', hue: '#2dd4bf', speaking: false },
  { id: 'cr-3', name: 'Đức Anh', role: 'Kiến trúc', initials: 'DA', hue: '#34d399', speaking: true },
  { id: 'cr-4', name: 'Lan Vy', role: 'Nội dung', initials: 'LV', hue: '#b87444', speaking: false },
  { id: 'cr-5', name: 'Quang Huy', role: 'Kiểm định', initials: 'QH', hue: '#7db4ff', speaking: false },
];

const morph: Transition = { type: 'spring', visualDuration: 0.42, bounce: 0.16 };
const BAR_PATTERNS = [0, 0.18, 0.34, 0.12];

function playRoomChime(kind: 'open' | 'close' | 'join' | 'leave') {
  if (typeof window === 'undefined') return;
  try {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    const ctx = new Ctor();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const freqMap = { open: [440, 620], close: [520, 340], join: [520, 780], leave: [420, 260] };
    const [f0, f1] = freqMap[kind];
    osc.type = 'sine';
    osc.frequency.setValueAtTime(f0, now);
    osc.frequency.exponentialRampToValueAtTime(f1, now + 0.08);
    gain.gain.setValueAtTime(0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.11);
    window.setTimeout(() => void ctx.close().catch(() => undefined), 160);
  } catch {
    return;
  }
}

function AvatarBadge({ person }: { person: ChatRoomPerson }) {
  const uid = useId().replace(/:/g, '');
  const gradId = `pvc-av-${uid}-${person.id}`;
  return (
    <span className="pvc__avatar" title={`${person.name} · ${person.role}`}>
      <svg viewBox="0 0 28 28" className="absolute inset-0 w-full h-full" aria-hidden="true">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={person.hue} stopOpacity="0.34" />
            <stop offset="100%" stopColor={person.hue} stopOpacity="0.08" />
          </linearGradient>
        </defs>
        <rect width="28" height="28" fill={`url(#${gradId})`} />
      </svg>
      <span className="relative z-10">{person.initials}</span>
    </span>
  );
}

export const ChatRoom: React.FC<ChatRoomProps> = ({
  title = 'Thảo luận',
  people = CHAT_ROOM_PEOPLE,
  corner = 20,
  sound = true,
  defaultOpen = false,
  onJoinChange,
  className = '',
}) => {
  const reduced = Boolean(useReducedMotion());
  const uid = useId().replace(/:/g, '');
  const [open, setOpen] = useState(defaultOpen);
  const [joined, setJoined] = useState(false);

  const visibleAvatars = people.slice(0, 3);
  const overflowCount = Math.max(0, people.length - visibleAvatars.length);

  const handleOpen = (next: boolean) => {
    setOpen(next);
    if (sound) playRoomChime(next ? 'open' : 'close');
  };

  const handleJoinToggle = () => {
    const next = !joined;
    setJoined(next);
    onJoinChange?.(next);
    if (sound) playRoomChime(next ? 'join' : 'leave');
  };

  return (
    <div className={`pvc ${className}`}>
      <LayoutGroup id={`pvc-${uid}`}>
        {!open ? (
          <motion.div
            layoutId="shell"
            transition={reduced ? { duration: 0.01 } : morph}
            className="pvc__pill"
          >
            <div className="pvc__avatars" aria-hidden="true">
              {visibleAvatars.map((p) => (
                <AvatarBadge key={p.id} person={p} />
              ))}
              {overflowCount > 0 && (
                <motion.span layoutId="more" className="pvc__more">
                  +{overflowCount}
                </motion.span>
              )}
            </div>
            <button
              type="button"
              className="pvc__pillBtn"
              onClick={() => handleOpen(true)}
            >
              {title}
            </button>
            <span className="pvc__bars" aria-hidden="true">
              {BAR_PATTERNS.map((delay, i) => (
                <span
                  key={i}
                  className="pvc__bar"
                  style={{
                    animationDelay: `${delay}s`,
                    animationPlayState: reduced ? 'paused' : 'running',
                  }}
                />
              ))}
            </span>
          </motion.div>
        ) : (
          <motion.div
            layoutId="shell"
            transition={reduced ? { duration: 0.01 } : morph}
            className="pvc__card"
            style={{ borderRadius: `${corner}px` }}
          >
            <div className="pvc__head">
              <div className="flex items-center gap-2 min-w-0">
                <span className="pvc__title truncate">{title}</span>
                {overflowCount > 0 && (
                  <motion.span layoutId="more" className="pvc__more" style={{ marginLeft: 0 }}>
                    +{overflowCount}
                  </motion.span>
                )}
              </div>
              <button
                type="button"
                className="inline-grid place-items-center h-7 w-7 rounded-full border-0 bg-transparent cursor-pointer"
                style={{ color: 'var(--ink-muted)' }}
                aria-label="Thu gọn"
                title="Thu gọn"
                onClick={() => handleOpen(false)}
              >
                <IconX className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>

            <div className="pvc__list">
              {people.map((person) => (
                <div key={person.id} className="pvc__member">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <AvatarBadge person={person} />
                    <div className="min-w-0">
                      <div className="text-[12.5px] font-medium truncate" style={{ color: 'var(--ink-primary)' }}>
                        {person.name}
                      </div>
                      <div className="text-[11px] truncate" style={{ color: 'var(--ink-muted)' }}>
                        {person.role}
                      </div>
                    </div>
                  </div>
                  {person.speaking && (
                    <span className="pvc__bars" aria-hidden="true">
                      {BAR_PATTERNS.map((delay, i) => (
                        <span
                          key={i}
                          className="pvc__bar"
                          style={{
                            animationDelay: `${delay}s`,
                            animationPlayState: reduced ? 'paused' : 'running',
                          }}
                        />
                      ))}
                    </span>
                  )}
                </div>
              ))}
            </div>

            <div className="pvc__foot">
              <span className="text-[11.5px] font-mono" style={{ color: 'var(--ink-muted)' }}>
                {joined ? 'Đang kết nối' : `${people.length} thành viên`}
              </span>
              <button
                type="button"
                className={`pvc__btn ${joined ? '' : 'pvc__btn--primary'}`}
                onClick={handleJoinToggle}
              >
                {joined ? 'Rời phòng' : 'Tham gia'}
              </button>
            </div>
          </motion.div>
        )}
      </LayoutGroup>
    </div>
  );
};

export default ChatRoom;
