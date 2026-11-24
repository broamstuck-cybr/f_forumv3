import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Check,
  Code2,
  Copy,
  Flame,
  Hash,
  Heart,
  Image as ImageIcon,
  MessageCircle,
  Mic,
  Pause,
  Pin,
  Play,
  Plus,
  Reply,
  Send,
  Square,
  ThumbsUp,
  Upload,
  X,
} from 'lucide-react';
import { SearchCard } from '../../components/pinui';
import { moderateText } from './moderationFilter';
import './chat.css';

interface ChatVoiceNote {
  audioUrl: string;
  durationSec: number;
  bars: number[];
  label?: string;
}

interface ChatMessage {
  id: string;
  threadId: string;
  authorHandle: string;
  authorName: string;
  text: string;
  at: string;
  replyToId?: string;
  snippet?: string;
  imageUrl?: string;
  voiceNote?: ChatVoiceNote;
  reactions: Record<string, string[]>;
}

interface ChatThread {
  id: string;
  name: string;
  kind: 'channel' | 'dm';
  online: boolean;
  rule?: string;
}

const STORE_KEY = 'fforum_v3_chat_messages_v2';
const THREADS_KEY = 'fforum_v3_chat_threads_v1';
const READ_KEY = 'fforum_v3_chat_read_v1';
const BUS = 'fforum_v3_chat_bus';

const REACTIONS: Array<{ id: string; label: string; Icon: React.ComponentType<{ size?: number }> }> = [
  { id: 'heart', label: 'Yêu thích', Icon: Heart },
  { id: 'like', label: 'Thích', Icon: ThumbsUp },
  { id: 'fire', label: 'Tuyệt vời', Icon: Flame },
];
const REACTION_ICON = Object.fromEntries(REACTIONS.map((r) => [r.id, r.Icon]));

const BASE_THREADS: ChatThread[] = [
  {
    id: 'chung',
    name: '#chung',
    kind: 'channel',
    online: true,
    rule: 'Kênh thảo luận chung. Tôn trọng nhau, không spam, không đăng đáp án thi.',
  },
  {
    id: 'vibe-coding',
    name: '#vibe-coding',
    kind: 'channel',
    online: true,
    rule: 'Chia sẻ prompt kèm kết quả. Ghi rõ công cụ đã dùng.',
  },
  {
    id: 'ui-ux-critique',
    name: '#ui-ux-critique',
    kind: 'channel',
    online: true,
    rule: 'Góp ý cụ thể, có lý do. Không chê chung chung.',
  },
  {
    id: 'hoi-dap-nhanh',
    name: '#hoi-dap-nhanh',
    kind: 'channel',
    online: true,
    rule: 'Nêu rõ lỗi, môi trường và đoạn code liên quan.',
  },
];

const SEED: ChatMessage[] = [];
const VOICE_SPEEDS = [1, 1.5, 2] as const;

const TOKEN_RE =
  /(\/\/[^\n]*|\/\*[\s\S]*?\*\/|<!--[\s\S]*?-->|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|\b(?:const|let|var|function|return|import|export|from|if|else|for|while|async|await|interface|type|class|new|true|false|null|undefined)\b|\b\d+(?:\.\d+)?\b)/g;

function renderHighlightedCode(code: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;
  TOKEN_RE.lastIndex = 0;
  let match: RegExpExecArray | null = TOKEN_RE.exec(code);
  while (match !== null) {
    if (match.index > lastIndex) {
      nodes.push(code.slice(lastIndex, match.index));
    }
    const token = match[0];
    let cls = 'chat-tok-kw';
    if (token.startsWith('//') || token.startsWith('/*') || token.startsWith('<!--')) {
      cls = 'chat-tok-cmt';
    } else if (token.startsWith('"') || token.startsWith("'") || token.startsWith('`')) {
      cls = 'chat-tok-str';
    } else if (/^\d/.test(token)) {
      cls = 'chat-tok-num';
    }
    nodes.push(
      <span key={key++} className={cls}>
        {token}
      </span>
    );
    lastIndex = TOKEN_RE.lastIndex;
    match = TOKEN_RE.exec(code);
  }
  if (lastIndex < code.length) {
    nodes.push(code.slice(lastIndex));
  }
  return nodes;
}

function load<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function buildWaveformBars(seedText: string, count = 28): number[] {
  let hash = 2166136261;
  for (let i = 0; i < seedText.length; i += 1) {
    hash ^= seedText.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const bars: number[] = [];
  for (let i = 0; i < count; i += 1) {
    hash = Math.imul(hash ^ (i + 17), 2246822519);
    const norm = ((hash >>> 0) % 100) / 100;
    const envelope = Math.sin((i / (count - 1)) * Math.PI) * 0.45 + 0.55;
    bars.push(Number(Math.min(1, Math.max(0.16, norm * envelope)).toFixed(2)));
  }
  return bars;
}

function formatDuration(sec: number): string {
  const safe = Math.max(0, Math.round(sec));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

const timeLabel = (iso: string) =>
  new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

const dayKey = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
};

const dayLabel = (iso: string) => {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor(
    (new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() -
      new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()) /
      86400000
  );
  if (diffDays === 0) return 'Hôm nay';
  if (diffDays === 1) return 'Hôm qua';
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const threadInitial = (name: string) =>
  name.replace(/^[#@]/, '').trim().slice(0, 1).toUpperCase() || 'F';

interface VoiceNoteCardProps {
  note: ChatVoiceNote;
  mine: boolean;
}

const VoiceNoteCard: React.FC<VoiceNoteCardProps> = ({ note, mine }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const waveRef = useRef<HTMLDivElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(note.durationSec || 0);
  const [currentTime, setCurrentTime] = useState(0);
  const [speedIdx, setSpeedIdx] = useState(0);
  const [waveWidth, setWaveWidth] = useState<number>(220);

  useEffect(() => {
    const el = waveRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w && w > 0) setWaveWidth(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.playbackRate = VOICE_SPEEDS[speedIdx];
  }, [speedIdx]);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
      return;
    }
    try {
      await audio.play();
      setPlaying(true);
    } catch {
      setPlaying(false);
    }
  };

  const handleSeek = (val: number) => {
    const audio = audioRef.current;
    const targetDur = audio?.duration && Number.isFinite(audio.duration) ? audio.duration : duration;
    const nextTime = (val / 100) * (targetDur || 0);
    setProgress(val);
    setCurrentTime(nextTime);
    if (audio && Number.isFinite(targetDur) && targetDur > 0) {
      audio.currentTime = nextTime;
    }
  };

  const bars = note.bars.length > 0 ? note.bars : buildWaveformBars(note.audioUrl.slice(0, 48));

  return (
    <div className="chat-voice" data-mine={mine} data-playing={playing ? 'true' : undefined}>
      <audio
        ref={audioRef}
        src={note.audioUrl}
        preload="metadata"
        onLoadedMetadata={(e) => {
          const d = e.currentTarget.duration;
          if (Number.isFinite(d) && d > 0) setDuration(d);
        }}
        onTimeUpdate={(e) => {
          const a = e.currentTarget;
          const d = Number.isFinite(a.duration) && a.duration > 0 ? a.duration : duration || 1;
          setCurrentTime(a.currentTime);
          setProgress(Math.min(100, (a.currentTime / d) * 100));
        }}
        onEnded={() => {
          setPlaying(false);
          setProgress(0);
          setCurrentTime(0);
        }}
      />
      <button
        type="button"
        className="chat-voice-play"
        onClick={() => void togglePlay()}
        aria-label={playing ? 'Tạm dừng ghi âm' : 'Phát ghi âm'}
      >
        {playing ? <Pause size={15} aria-hidden="true" /> : <Play size={15} aria-hidden="true" />}
      </button>
      <div
        ref={waveRef}
        className="chat-voice-wave"
        style={
          {
            '--p': `${progress}%`,
            '--wave-w': `${waveWidth}px`,
          } as React.CSSProperties
        }
      >
        <div className="chat-voice-bars" aria-hidden="true">
          {bars.map((h, idx) => (
            <span
              key={idx}
              className="chat-voice-bar"
              style={{ '--h': h } as React.CSSProperties}
            />
          ))}
        </div>
        <div className="chat-voice-fill" aria-hidden="true">
          <div className="chat-voice-bars">
            {bars.map((h, idx) => (
              <span
                key={idx}
                className="chat-voice-bar"
                style={{ '--h': h } as React.CSSProperties}
              />
            ))}
          </div>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          step={0.5}
          value={progress}
          onChange={(e) => handleSeek(Number(e.target.value))}
          className="chat-voice-seek"
          aria-label="Tua đoạn ghi âm"
        />
      </div>
      <div className="chat-voice-meta">
        <span className="chat-voice-time">
          {playing || currentTime > 0 ? formatDuration(currentTime) : formatDuration(duration)}
        </span>
        <button
          type="button"
          className="chat-voice-speed"
          onClick={() => setSpeedIdx((idx) => (idx + 1) % VOICE_SPEEDS.length)}
          aria-label={`Tốc độ phát ${VOICE_SPEEDS[speedIdx]}x`}
        >
          {VOICE_SPEEDS[speedIdx]}×
        </button>
      </div>
    </div>
  );
};

interface Props {
  currentHandle: string;
  currentName: string;
}

export const CommunityChatRoom: React.FC<Props> = ({ currentHandle, currentName }) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [customThreads, setCustomThreads] = useState<ChatThread[]>(() => load(THREADS_KEY, []));
  const [messages, setMessages] = useState<ChatMessage[]>(() => load(STORE_KEY, SEED));
  const [readAt, setReadAt] = useState<Record<string, number>>(() => load(READ_KEY, {}));
  const [activeId, setActiveId] = useState<string>('chung');
  const [mobileThread, setMobileThread] = useState(false);
  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState('');
  const [snippet, setSnippet] = useState('');
  const [showSnippet, setShowSnippet] = useState(false);
  const [showPhoto, setShowPhoto] = useState(false);
  const [photoUrl, setPhotoUrl] = useState('');
  const [showVoice, setShowVoice] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordSec, setRecordSec] = useState(0);
  const [voiceDraft, setVoiceDraft] = useState<ChatVoiceNote | null>(null);
  const [voiceError, setVoiceError] = useState('');
  const [showPin, setShowPin] = useState(true);
  const [newDmOpen, setNewDmOpen] = useState(false);
  const [newDmName, setNewDmName] = useState('');
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [warning, setWarning] = useState('');
  const [typingFrom, setTypingFrom] = useState('');

  const busRef = useRef<BroadcastChannel | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);
  const typingTimer = useRef<number | undefined>(undefined);
  const highlightTimer = useRef<number | undefined>(undefined);
  const msgRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recordChunksRef = useRef<Blob[]>([]);
  const recordIntervalRef = useRef<number | undefined>(undefined);
  const recordStartRef = useRef<number>(0);

  const threads = useMemo(() => {
    const map = new Map<string, ChatThread>();
    for (const t of BASE_THREADS) map.set(t.id, t);
    for (const t of customThreads) map.set(t.id, t);
    return Array.from(map.values());
  }, [customThreads]);

  const persist = useCallback((next: ChatMessage[]) => {
    try {
      window.localStorage.setItem(STORE_KEY, JSON.stringify(next));
    } catch {
      return;
    }
    busRef.current?.postMessage({ type: 'sync' });
  }, []);

  const persistThreads = useCallback((next: ChatThread[]) => {
    try {
      window.localStorage.setItem(THREADS_KEY, JSON.stringify(next));
    } catch {
      return;
    }
    busRef.current?.postMessage({ type: 'threads' });
  }, []);

  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;
    const bus = new BroadcastChannel(BUS);
    busRef.current = bus;
    bus.onmessage = (ev: MessageEvent<{ type: string; from?: string; thread?: string }>) => {
      if (ev.data.type === 'sync') setMessages(load(STORE_KEY, SEED));
      if (ev.data.type === 'threads') setCustomThreads(load(THREADS_KEY, []));
      if (ev.data.type === 'typing' && ev.data.from !== currentHandle && ev.data.thread === activeId) {
        setTypingFrom(ev.data.from ?? '');
        window.clearTimeout(typingTimer.current);
        typingTimer.current = window.setTimeout(() => setTypingFrom(''), 2400);
      }
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORE_KEY) setMessages(load(STORE_KEY, SEED));
      if (e.key === THREADS_KEY) setCustomThreads(load(THREADS_KEY, []));
    };
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.clearTimeout(typingTimer.current);
      window.clearTimeout(highlightTimer.current);
      window.clearInterval(recordIntervalRef.current);
      bus.close();
      busRef.current = null;
    };
  }, [currentHandle, activeId]);

  const thread = threads.find((t) => t.id === activeId) ?? threads[0];
  const threadMessages = useMemo(
    () => messages.filter((m) => m.threadId === activeId).sort((a, b) => Date.parse(a.at) - Date.parse(b.at)),
    [messages, activeId]
  );

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
    setReadAt((prev) => {
      const next = { ...prev, [activeId]: Date.now() };
      try {
        window.localStorage.setItem(READ_KEY, JSON.stringify(next));
      } catch {
        return next;
      }
      return next;
    });
  }, [activeId, threadMessages.length]);

  const unread = (id: string) =>
    messages.filter(
      (m) => m.threadId === id && m.authorHandle !== currentHandle && Date.parse(m.at) > (readAt[id] ?? 0)
    ).length;

  const lastOf = (id: string) => {
    const list = messages.filter((m) => m.threadId === id);
    return list.length ? list.reduce((a, b) => (Date.parse(a.at) >= Date.parse(b.at) ? a : b)) : undefined;
  };

  const visibleThreads = threads.filter((t) => t.name.toLowerCase().includes(query.trim().toLowerCase()));
  const channelThreads = visibleThreads.filter((t) => t.kind === 'channel');
  const dmThreads = visibleThreads.filter((t) => t.kind === 'dm');

  const createConversation = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newDmName.trim();
    if (!clean) return;
    const isChannel = clean.startsWith('#');
    const slug = clean.toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-|-$/g, '') || `dm-${Date.now()}`;
    const id = isChannel ? slug : `dm-${slug}`;
    const existing = threads.find((t) => t.id === id || t.name.toLowerCase() === clean.toLowerCase());
    if (existing) {
      setActiveId(existing.id);
      setMobileThread(true);
      setNewDmName('');
      setNewDmOpen(false);
      return;
    }
    const created: ChatThread = {
      id,
      name: clean,
      kind: isChannel ? 'channel' : 'dm',
      online: true,
    };
    const next = [created, ...load<ChatThread[]>(THREADS_KEY, customThreads)];
    setCustomThreads(next);
    persistThreads(next);
    setActiveId(created.id);
    setMobileThread(true);
    setNewDmName('');
    setNewDmOpen(false);
  };

  const handlePhotoFile = (files: FileList | null) => {
    const file = files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPhotoUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAudioFile = (files: FileList | null) => {
    const file = files?.[0];
    if (!file || !file.type.startsWith('audio/')) return;
    setVoiceError('');
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') return;
      const dataUrl = reader.result;
      const probe = new Audio(dataUrl);
      probe.onloadedmetadata = () => {
        const dur = Number.isFinite(probe.duration) ? probe.duration : 12;
        setVoiceDraft({
          audioUrl: dataUrl,
          durationSec: dur,
          bars: buildWaveformBars(`${file.name}-${file.size}`),
          label: file.name,
        });
      };
      probe.onerror = () => {
        setVoiceDraft({
          audioUrl: dataUrl,
          durationSec: 12,
          bars: buildWaveformBars(`${file.name}-${file.size}`),
          label: file.name,
        });
      };
    };
    reader.readAsDataURL(file);
  };

  const startVoiceRecording = async () => {
    setVoiceError('');
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setVoiceError('Trình duyệt không hỗ trợ ghi âm trực tiếp. Bạn có thể tải tệp âm thanh lên.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      recordChunksRef.current = [];
      recordStartRef.current = Date.now();
      recorder.ondataavailable = (ev) => {
        if (ev.data.size > 0) recordChunksRef.current.push(ev.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        window.clearInterval(recordIntervalRef.current);
        const elapsed = Math.max(1, (Date.now() - recordStartRef.current) / 1000);
        const blob = new Blob(recordChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            setVoiceDraft({
              audioUrl: reader.result,
              durationSec: elapsed,
              bars: buildWaveformBars(`rec-${Date.now()}-${blob.size}`),
              label: 'Tin nhắn thoại',
            });
          }
        };
        reader.readAsDataURL(blob);
        setRecording(false);
        setRecordSec(0);
      };
      recorderRef.current = recorder;
      recorder.start();
      setRecording(true);
      setRecordSec(0);
      window.clearInterval(recordIntervalRef.current);
      recordIntervalRef.current = window.setInterval(() => {
        setRecordSec(Math.floor((Date.now() - recordStartRef.current) / 1000));
      }, 250);
    } catch {
      setVoiceError('Không thể truy cập micro. Hãy cấp quyền hoặc tải tệp âm thanh có sẵn.');
      setRecording(false);
    }
  };

  const stopVoiceRecording = () => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
    }
  };

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    const cleanSnippet = snippet.trim();
    const cleanPhoto = photoUrl.trim();
    if (!text && !cleanSnippet && !cleanPhoto && !voiceDraft) return;
    const verdict = moderateText(`${text}\n${cleanSnippet}`);
    if (!verdict.ok) {
      setWarning(verdict.message);
      return;
    }
    const msg: ChatMessage = {
      id: `m-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      threadId: activeId,
      authorHandle: currentHandle,
      authorName: currentName,
      text,
      at: new Date().toISOString(),
      replyToId: replyTo?.id,
      snippet: cleanSnippet || undefined,
      imageUrl: cleanPhoto || undefined,
      voiceNote: voiceDraft || undefined,
      reactions: {},
    };
    const next = [...load(STORE_KEY, messages), msg];
    setMessages(next);
    persist(next);
    setDraft('');
    setSnippet('');
    setPhotoUrl('');
    setVoiceDraft(null);
    setVoiceError('');
    setShowSnippet(false);
    setShowPhoto(false);
    setShowVoice(false);
    setReplyTo(null);
    setWarning('');
  };

  const react = (id: string, reactionId: string) => {
    const next = load<ChatMessage[]>(STORE_KEY, messages).map((m) => {
      if (m.id !== id) return m;
      const users = m.reactions[reactionId] ?? [];
      const updated = users.includes(currentHandle) ? users.filter((u) => u !== currentHandle) : [...users, currentHandle];
      return { ...m, reactions: { ...m.reactions, [reactionId]: updated } };
    });
    setMessages(next);
    persist(next);
  };

  const onType = (value: string) => {
    setDraft(value);
    if (warning) setWarning('');
    busRef.current?.postMessage({ type: 'typing', from: currentHandle, thread: activeId });
  };

  const openThread = (id: string) => {
    setActiveId(id);
    setMobileThread(true);
    setReplyTo(null);
  };

  const jumpToMessage = (targetId: string) => {
    const el = msgRefs.current[targetId];
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setHighlightedId(targetId);
    window.clearTimeout(highlightTimer.current);
    highlightTimer.current = window.setTimeout(() => setHighlightedId(null), 1600);
  };

  const copySnippet = async (id: string, code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedId(id);
      window.setTimeout(() => setCopiedId((prev) => (prev === id ? null : prev)), 1500);
    } catch {
      return;
    }
  };

  const hasSendable = Boolean(draft.trim() || snippet.trim() || photoUrl.trim() || voiceDraft);

  const renderThreadRow = (t: ChatThread) => {
    const last = lastOf(t.id);
    const n = unread(t.id);
    const previewText = last
      ? `${last.authorHandle === currentHandle ? 'Bạn: ' : ''}${
          last.text ||
          (last.voiceNote ? 'Đã gửi tin nhắn thoại' : last.imageUrl ? 'Đã gửi ảnh' : 'Đã chia sẻ đoạn code')
        }`
      : t.kind === 'channel'
        ? 'Kênh thảo luận mở'
        : 'Chưa có tin nhắn';
    const isChannel = t.kind === 'channel';
    return (
      <li key={t.id}>
        <button
          type="button"
          className="chat-thread"
          aria-current={t.id === activeId}
          data-unread={n > 0}
          onClick={() => openThread(t.id)}
        >
          <span className="chat-avatar-ring" data-unread={n > 0} data-online={t.online}>
            <span className="chat-avatar">
              {isChannel ? <Hash size={15} aria-hidden="true" /> : threadInitial(t.name)}
            </span>
            {t.online && <span className="chat-online-dot" aria-hidden="true" />}
          </span>
          <span className="chat-thread-body">
            <span className="chat-thread-top">
              <strong className="chat-thread-name">{t.name}</strong>
              {last && <span className="chat-thread-time">{timeLabel(last.at)}</span>}
            </span>
            <span className="chat-thread-preview">{previewText}</span>
          </span>
          {n > 0 && (
            <span className="chat-thread-unread">
              <span className="chat-badge" aria-label={`${n} tin chưa đọc`}>
                {n}
              </span>
            </span>
          )}
        </button>
      </li>
    );
  };

  return (
    <section className="chat" data-thread-open={mobileThread} aria-label="Phòng chat Tri thức">
      <aside className="chat-list">
        <div className="chat-list-head">
          <div className="chat-title-group">
            <span className="chat-title-mark" aria-hidden="true">
              <MessageCircle size={15} />
            </span>
            <h2 className="chat-title">Phòng chat</h2>
          </div>
          <button
            type="button"
            className="chat-new-btn"
            aria-expanded={newDmOpen}
            onClick={() => setNewDmOpen((v) => !v)}
          >
            <Plus size={14} aria-hidden="true" />
            <span>Nhắn mới</span>
          </button>
        </div>

        {newDmOpen && (
          <form className="chat-new-form" onSubmit={createConversation}>
            <div className="chat-new-form-row">
              <input
                value={newDmName}
                onChange={(e) => setNewDmName(e.target.value)}
                placeholder="Nhập tên, @handle hoặc #kênh..."
                aria-label="Tên người nhận hoặc kênh mới"
              />
              <button type="submit" className="chat-new-submit" disabled={!newDmName.trim()}>
                Mở
              </button>
            </div>
          </form>
        )}

        <div className="chat-search-wrap">
          <SearchCard
            value={query}
            onChange={setQuery}
            placeholder="Tìm kênh hoặc tin nhắn..."
            compact
            className="chat-pinui-search"
          />
        </div>

        <div className="chat-stories" aria-label="Truy cập nhanh kênh và hội thoại">
          <button
            type="button"
            className="chat-story-btn"
            onClick={() => setNewDmOpen(true)}
            aria-label="Bắt đầu cuộc trò chuyện mới"
          >
            <span className="chat-story-ring" data-active-ring="true">
              <span className="chat-story-inner">
                <Plus size={17} aria-hidden="true" />
              </span>
            </span>
            <span className="chat-story-label">{currentName.split(/\s+/)[0] || 'Bạn'}</span>
          </button>

          {threads.map((t) => {
            const isUnread = unread(t.id) > 0;
            const isActive = t.id === activeId;
            return (
              <button
                key={`story-${t.id}`}
                type="button"
                className="chat-story-btn"
                aria-pressed={isActive}
                onClick={() => openThread(t.id)}
                title={t.name}
              >
                <span className="chat-story-ring" data-active-ring={t.online || isUnread || isActive}>
                  <span className="chat-story-inner">{threadInitial(t.name)}</span>
                </span>
                <span className="chat-story-label">{t.name.replace(/^#/, '')}</span>
              </button>
            );
          })}
        </div>

        <div className="chat-threads-scroll">
          {channelThreads.length > 0 && (
            <div className="chat-thread-section">
              <span className="chat-section-label">Kênh thảo luận</span>
              <ul className="chat-threads">{channelThreads.map(renderThreadRow)}</ul>
            </div>
          )}
          {dmThreads.length > 0 && (
            <div className="chat-thread-section">
              <span className="chat-section-label">Tin nhắn trực tiếp</span>
              <ul className="chat-threads">{dmThreads.map(renderThreadRow)}</ul>
            </div>
          )}
          {visibleThreads.length === 0 && (
            <p className="chat-empty">Không tìm thấy cuộc trò chuyện phù hợp.</p>
          )}
        </div>
      </aside>

      <div className="chat-pane">
        <header className="chat-head">
          <div className="chat-head-user">
            <button
              type="button"
              className="chat-back"
              onClick={() => setMobileThread(false)}
              aria-label="Quay lại danh sách"
            >
              <ArrowLeft size={18} />
            </button>
            <span className="chat-avatar chat-avatar--head">
              {thread.kind === 'channel' ? <Hash size={16} aria-hidden="true" /> : threadInitial(thread.name)}
              {thread.online && <span className="chat-online-dot" aria-hidden="true" />}
            </span>
            <div className="chat-head-meta">
              <strong>{thread.name}</strong>
              <span className="chat-sub">
                <span className="chat-sub-dot" aria-hidden="true" />
                {thread.kind === 'channel'
                  ? 'Kênh trực tuyến · Đồng bộ tức thì'
                  : thread.online
                    ? 'Đang hoạt động'
                    : 'Ngoại tuyến'}
              </span>
            </div>
          </div>

          <div className="chat-head-actions">
            {thread.rule && (
              <button
                type="button"
                className="chat-head-btn"
                aria-pressed={showPin}
                aria-label={showPin ? 'Ẩn quy tắc kênh' : 'Hiện quy tắc kênh'}
                title="Quy tắc kênh"
                onClick={() => setShowPin((v) => !v)}
              >
                <Pin size={15} />
              </button>
            )}
            <button
              type="button"
              className="chat-head-btn"
              aria-pressed={showSnippet}
              aria-label="Đính kèm đoạn mã"
              title="Đính kèm đoạn mã"
              onClick={() => setShowSnippet((v) => !v)}
            >
              <Code2 size={15} />
            </button>
            <button
              type="button"
              className="chat-head-btn"
              aria-pressed={showVoice}
              aria-label="Đính kèm tin nhắn thoại"
              title="Tin nhắn thoại"
              onClick={() => setShowVoice((v) => !v)}
            >
              <Mic size={15} />
            </button>
          </div>
        </header>

        {thread.rule && showPin && (
          <p className="chat-pin">
            <span className="chat-pin-text">
              <Pin size={14} aria-hidden="true" />
              <span>{thread.rule}</span>
            </span>
            <button
              type="button"
              className="chat-pin-close"
              onClick={() => setShowPin(false)}
              aria-label="Ẩn thông báo ghim"
            >
              <X size={13} />
            </button>
          </p>
        )}

        <div className="chat-stream" role="log" aria-live="polite">
          {threadMessages.length === 0 && (
            <div className="chat-empty-state">
              <span className="chat-empty-glyph" aria-hidden="true">
                {thread.kind === 'channel' ? <Hash size={22} /> : <MessageCircle size={22} />}
              </span>
              <h3>Bắt đầu hội thoại tại {thread.name}</h3>
              <p>
                Gửi tin nhắn, chia sẻ đoạn mã tô sáng cú pháp, đính kèm ảnh hoặc ghi âm thoại. Tin nhắn đồng bộ trực tiếp giữa các thẻ trình duyệt.
              </p>
            </div>
          )}

          {threadMessages.map((m, i) => {
            const mine = m.authorHandle === currentHandle;
            const prev = threadMessages[i - 1];
            const next = threadMessages[i + 1];
            const showDayDivider = !prev || dayKey(prev.at) !== dayKey(m.at);
            const samePrev =
              !showDayDivider &&
              prev?.authorHandle === m.authorHandle &&
              Date.parse(m.at) - Date.parse(prev.at) < 300000;
            const sameNext =
              Boolean(next) &&
              dayKey(next.at) === dayKey(m.at) &&
              next.authorHandle === m.authorHandle &&
              Date.parse(next.at) - Date.parse(m.at) < 300000;
            const isFirstInRun = !samePrev;
            const isLastInRun = !sameNext;
            const quoted = m.replyToId ? messages.find((x) => x.id === m.replyToId) : undefined;
            const heartReacted = (m.reactions.heart ?? []).includes(currentHandle);
            const hasReactions = Object.values(m.reactions).some((u) => u.length > 0);

            return (
              <React.Fragment key={m.id}>
                {showDayDivider && (
                  <div className="chat-day-divider" role="separator">
                    <span>{dayLabel(m.at)}</span>
                  </div>
                )}
                <div
                  ref={(el) => {
                    msgRefs.current[m.id] = el;
                  }}
                  className="chat-row"
                  data-mine={mine}
                  data-grouped={samePrev}
                  data-run-first={isFirstInRun}
                  data-run-last={isLastInRun}
                  data-highlighted={highlightedId === m.id ? 'true' : undefined}
                >
                  {!mine && isFirstInRun && <span className="chat-author">{m.authorName}</span>}
                  <div className="chat-bubble-wrap">
                    <div
                      className="chat-bubble"
                      onDoubleClick={() => react(m.id, 'heart')}
                      title="Nhấn đúp để thả tim"
                    >
                      {quoted && (
                        <button
                          type="button"
                          className="chat-quote"
                          onClick={() => jumpToMessage(quoted.id)}
                        >
                          <span className="chat-quote-author">{quoted.authorName}</span>
                          <span className="chat-quote-text">
                            {quoted.text.slice(0, 84) ||
                              (quoted.voiceNote ? 'Tin nhắn thoại' : quoted.imageUrl ? 'Ảnh đính kèm' : 'Đoạn mã')}
                          </span>
                        </button>
                      )}
                      {m.text && <p className="chat-msg-text">{m.text}</p>}
                      {m.voiceNote && <VoiceNoteCard note={m.voiceNote} mine={mine} />}
                      {m.imageUrl && (
                        <button
                          type="button"
                          className="chat-photo-btn"
                          onClick={() => setLightboxUrl(m.imageUrl || null)}
                          aria-label="Xem ảnh phóng to"
                        >
                          <img
                            className="chat-photo"
                            src={m.imageUrl}
                            alt="Ảnh đính kèm trong tin nhắn"
                            loading="lazy"
                          />
                        </button>
                      )}
                      {m.snippet && (
                        <div className="chat-code-wrap">
                          <div className="chat-code-bar">
                            <span className="chat-code-lang">
                              <Code2 size={12} aria-hidden="true" />
                              <span>snippet</span>
                            </span>
                            <button
                              type="button"
                              className="chat-code-copy"
                              data-copied={copiedId === m.id ? 'true' : undefined}
                              aria-label="Chép đoạn code"
                              onClick={() => void copySnippet(m.id, m.snippet || '')}
                            >
                              {copiedId === m.id ? <Check size={12} /> : <Copy size={12} />}
                              <span>{copiedId === m.id ? 'Đã chép' : 'Chép'}</span>
                            </button>
                          </div>
                          <pre className="chat-code">
                            <code>{renderHighlightedCode(m.snippet)}</code>
                          </pre>
                        </div>
                      )}
                      {isLastInRun && (
                        <time className="chat-msg-time" dateTime={m.at}>
                          {timeLabel(m.at)}
                        </time>
                      )}
                    </div>

                    <div className="chat-actions" role="toolbar" aria-label="Tương tác tin nhắn">
                      {REACTIONS.map(({ id, label, Icon }) => {
                        const active = (m.reactions[id] ?? []).includes(currentHandle);
                        return (
                          <button
                            key={id}
                            type="button"
                            data-reacted={id === 'heart' && heartReacted ? 'true' : undefined}
                            aria-pressed={active}
                            onClick={() => react(m.id, id)}
                            aria-label={label}
                            title={label}
                          >
                            <Icon size={14} />
                          </button>
                        );
                      })}
                      <button
                        type="button"
                        className="chat-action-reply"
                        onClick={() => setReplyTo(m)}
                        aria-label="Trả lời tin nhắn"
                        title="Trả lời"
                      >
                        <Reply size={13} />
                        <span>Trả lời</span>
                      </button>
                    </div>
                  </div>

                  {hasReactions && (
                    <div className="chat-reacts">
                      {Object.entries(m.reactions)
                        .filter(([, u]) => u.length > 0)
                        .map(([id, u]) => {
                          const Icon = REACTION_ICON[id];
                          return (
                            <button
                              key={id}
                              type="button"
                              aria-pressed={u.includes(currentHandle)}
                              onClick={() => react(m.id, id)}
                            >
                              {Icon && <Icon size={12} />}
                              <span>{u.length}</span>
                            </button>
                          );
                        })}
                    </div>
                  )}
                </div>
              </React.Fragment>
            );
          })}

          {typingFrom && (
            <div className="chat-typing-row" aria-live="polite">
              <div className="chat-typing">
                <span className="chat-typing-dots" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </span>
                <span className="chat-typing-label">@{typingFrom} đang nhập...</span>
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        <form className="chat-compose" onSubmit={send}>
          {replyTo && (
            <div className="chat-replying">
              <div className="chat-replying-copy">
                <Reply size={13} aria-hidden="true" />
                <span>
                  Trả lời <strong>{replyTo.authorName}</strong>:{' '}
                  {replyTo.text.slice(0, 64) ||
                    (replyTo.voiceNote ? 'Tin nhắn thoại' : replyTo.imageUrl ? 'Ảnh đính kèm' : 'Đoạn mã')}
                </span>
              </div>
              <button type="button" onClick={() => setReplyTo(null)} aria-label="Hủy trả lời">
                <X size={14} />
              </button>
            </div>
          )}

          {showVoice && (
            <div className="chat-voice-bar">
              {voiceDraft ? (
                <div className="chat-voice-draft">
                  <VoiceNoteCard note={voiceDraft} mine={false} />
                  <button
                    type="button"
                    className="chat-search-clear"
                    onClick={() => setVoiceDraft(null)}
                    aria-label="Gỡ ghi âm"
                  >
                    <X size={15} />
                  </button>
                </div>
              ) : (
                <div className="chat-voice-controls">
                  {recording ? (
                    <button
                      type="button"
                      className="chat-voice-rec-btn"
                      data-recording="true"
                      onClick={stopVoiceRecording}
                    >
                      <Square size={13} aria-hidden="true" />
                      <span>Dừng ghi ({formatDuration(recordSec)})</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="chat-voice-rec-btn"
                      onClick={() => void startVoiceRecording()}
                    >
                      <Mic size={14} aria-hidden="true" />
                      <span>Ghi âm thoại</span>
                    </button>
                  )}
                  <label className="chat-photo-pick">
                    <Upload size={13} aria-hidden="true" />
                    <span>Tải tệp âm thanh</span>
                    <input
                      type="file"
                      accept="audio/*"
                      className="sr-only"
                      onChange={(e) => {
                        handleAudioFile(e.target.files);
                        e.target.value = '';
                      }}
                    />
                  </label>
                </div>
              )}
              {voiceError && <p className="chat-voice-err">{voiceError}</p>}
            </div>
          )}

          {showPhoto && (
            <div className="chat-photo-bar">
              <label className="chat-photo-pick">
                <ImageIcon size={14} aria-hidden="true" />
                <span>Chọn ảnh</span>
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => {
                    handlePhotoFile(e.target.files);
                    e.target.value = '';
                  }}
                />
              </label>
              <input
                type="url"
                value={photoUrl.startsWith('data:') ? '' : photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                placeholder="Hoặc dán liên kết ảnh https://..."
                aria-label="Liên kết ảnh"
              />
              {photoUrl && (
                <span className="chat-photo-preview">
                  <img src={photoUrl} alt="Xem trước ảnh" />
                  <button
                    type="button"
                    className="chat-search-clear"
                    onClick={() => setPhotoUrl('')}
                    aria-label="Gỡ ảnh"
                  >
                    <X size={14} />
                  </button>
                </span>
              )}
            </div>
          )}

          {showSnippet && (
            <textarea
              className="chat-snippet"
              value={snippet}
              onChange={(e) => setSnippet(e.target.value)}
              placeholder="Dán đoạn code / UI snippet..."
              aria-label="Đoạn code"
              rows={4}
            />
          )}

          {warning && (
            <p className="chat-warning" role="alert">
              {warning}
            </p>
          )}

          <div className="chat-compose-row">
            <button
              type="button"
              className="chat-icon"
              aria-pressed={showPhoto}
              onClick={() => setShowPhoto((v) => !v)}
              aria-label="Đính kèm ảnh"
              title="Đính kèm ảnh"
            >
              <ImageIcon size={18} />
            </button>
            <button
              type="button"
              className="chat-icon"
              aria-pressed={showSnippet}
              onClick={() => setShowSnippet((v) => !v)}
              aria-label="Đính kèm code"
              title="Đính kèm code"
            >
              <Code2 size={18} />
            </button>
            <button
              type="button"
              className="chat-icon"
              aria-pressed={showVoice || Boolean(voiceDraft)}
              onClick={() => setShowVoice((v) => !v)}
              aria-label="Đính kèm tin nhắn thoại"
              title="Tin nhắn thoại"
            >
              <Mic size={18} />
            </button>
            <input
              value={draft}
              onChange={(e) => onType(e.target.value)}
              placeholder={`Nhắn tin tới ${thread.name}...`}
              aria-label="Nội dung tin nhắn"
            />
            <button type="submit" className="chat-send" disabled={!hasSendable} aria-label="Gửi tin nhắn">
              <Send size={16} />
            </button>
          </div>
        </form>
      </div>

      {lightboxUrl && (
        <div
          className="chat-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Xem ảnh phóng to"
          onClick={() => setLightboxUrl(null)}
        >
          <div className="chat-lightbox-content" onClick={(e) => e.stopPropagation()}>
            <img src={lightboxUrl} alt="Ảnh phóng to" className="chat-lightbox-img" />
            <button
              type="button"
              className="chat-lightbox-close"
              onClick={() => setLightboxUrl(null)}
              aria-label="Đóng xem ảnh"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}
    </section>
  );
};
