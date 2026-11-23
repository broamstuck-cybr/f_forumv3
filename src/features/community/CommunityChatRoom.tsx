import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Check, Code2, Copy, Flame, Heart, Pin, Search, Send, ThumbsUp, X } from 'lucide-react';
import { moderateText } from './moderationFilter';
import { useAppStore } from '../../store/appStore';
import './chat.css';

interface ChatMessage {
  id: string;
  threadId: string;
  authorHandle: string;
  authorName: string;
  text: string;
  at: string;
  replyToId?: string;
  snippet?: string;
  reactions: Record<string, string[]>;
}

interface ChatThread {
  id: string;
  name: string;
  kind: 'channel' | 'dm';
  online: boolean;
  rule?: string;
}

const STORE_KEY = 'fforum_v3_chat_messages_v1';
const READ_KEY = 'fforum_v3_chat_read_v1';
const BUS = 'fforum_v3_chat_bus';
const REACTIONS: Array<{ id: string; label: string; Icon: React.ComponentType<{ size?: number }> }> = [
  { id: 'heart', label: 'Yêu thích', Icon: Heart },
  { id: 'like', label: 'Thích', Icon: ThumbsUp },
  { id: 'fire', label: 'Tuyệt', Icon: Flame },
];
const REACTION_ICON = Object.fromEntries(REACTIONS.map((r) => [r.id, r.Icon]));

const THREADS: ChatThread[] = [
  { id: 'chung-fpt', name: '#chung-fpt', kind: 'channel', online: true, rule: 'Tôn trọng nhau, không spam, không đăng đáp án thi.' },
  { id: 'vibe-coding', name: '#vibe-coding', kind: 'channel', online: true, rule: 'Chia sẻ prompt kèm kết quả. Ghi rõ công cụ đã dùng.' },
  { id: 'ui-ux-critique', name: '#ui-ux-critique', kind: 'channel', online: true, rule: 'Góp ý cụ thể, có lý do. Không chê chung chung.' },
  { id: 'hoi-dap-nhanh', name: '#hoi-dap-nhanh', kind: 'channel', online: true, rule: 'Nêu rõ lỗi, môi trường và đoạn code liên quan.' },
  { id: 'dm-nam_core', name: 'Trần Hoàng Nam', kind: 'dm', online: true },
  { id: 'dm-minh_dev', name: 'Nguyễn Văn Minh', kind: 'dm', online: false },
];

const SEED: ChatMessage[] = [
  { id: 's1', threadId: 'chung-fpt', authorHandle: 'nam_core', authorName: 'Trần Hoàng Nam', text: 'Chào mọi người, tuần này CLB có buổi review đồ án vào thứ Sáu.', at: '2026-11-22T08:00:00Z', reactions: {} },
  { id: 's2', threadId: 'vibe-coding', authorHandle: 'minh_dev', authorName: 'Nguyễn Văn Minh', text: 'Ai có prompt dựng dashboard bằng React + Tailwind gọn không?', at: '2026-11-22T09:10:00Z', reactions: {} },
  { id: 's3', threadId: 'dm-nam_core', authorHandle: 'nam_core', authorName: 'Trần Hoàng Nam', text: 'Bạn gửi mình link repo nhé, mình xem giúp phần virtualization.', at: '2026-11-22T10:30:00Z', reactions: {} },
];

function load<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

const timeLabel = (iso: string) =>
  new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

interface Props {
  currentHandle: string;
  currentName: string;
}

export const CommunityChatRoom: React.FC<Props> = ({ currentHandle, currentName }) => {
  const { settings } = useAppStore();
  const isFabulous = settings.uiMode === 'fabulous';
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>(() => load(STORE_KEY, SEED));
  const [readAt, setReadAt] = useState<Record<string, number>>(() => load(READ_KEY, {}));
  const [activeId, setActiveId] = useState<string>('chung-fpt');
  const [mobileThread, setMobileThread] = useState(false);
  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState('');
  const [snippet, setSnippet] = useState('');
  const [showSnippet, setShowSnippet] = useState(false);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [warning, setWarning] = useState('');
  const [typingFrom, setTypingFrom] = useState('');
  const busRef = useRef<BroadcastChannel | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);
  const typingTimer = useRef<number | undefined>(undefined);

  const persist = useCallback((next: ChatMessage[]) => {
    try {
      window.localStorage.setItem(STORE_KEY, JSON.stringify(next));
    } catch {
      return;
    }
    busRef.current?.postMessage({ type: 'sync' });
  }, []);

  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;
    const bus = new BroadcastChannel(BUS);
    busRef.current = bus;
    bus.onmessage = (ev: MessageEvent<{ type: string; from?: string; thread?: string }>) => {
      if (ev.data.type === 'sync') setMessages(load(STORE_KEY, SEED));
      if (ev.data.type === 'typing' && ev.data.from !== currentHandle) {
        setTypingFrom(ev.data.from ?? '');
        window.clearTimeout(typingTimer.current);
        typingTimer.current = window.setTimeout(() => setTypingFrom(''), 2000);
      }
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORE_KEY) setMessages(load(STORE_KEY, SEED));
    };
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.clearTimeout(typingTimer.current);
      bus.close();
      busRef.current = null;
    };
  }, [currentHandle]);

  const thread = THREADS.find((t) => t.id === activeId) ?? THREADS[0];
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

  const visibleThreads = THREADS.filter((t) => t.name.toLowerCase().includes(query.trim().toLowerCase()));

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text && !snippet.trim()) return;
    const verdict = moderateText(`${text}\n${snippet}`);
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
      snippet: snippet.trim() || undefined,
      reactions: {},
    };
    const next = [...load(STORE_KEY, messages), msg];
    setMessages(next);
    persist(next);
    setDraft('');
    setSnippet('');
    setShowSnippet(false);
    setReplyTo(null);
    setWarning('');
  };

  const react = (id: string, emoji: string) => {
    const next = load<ChatMessage[]>(STORE_KEY, messages).map((m) => {
      if (m.id !== id) return m;
      const users = m.reactions[emoji] ?? [];
      const updated = users.includes(currentHandle) ? users.filter((u) => u !== currentHandle) : [...users, currentHandle];
      return { ...m, reactions: { ...m.reactions, [emoji]: updated } };
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

  const copySnippet = async (id: string, code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedId(id);
      window.setTimeout(() => setCopiedId((prev) => (prev === id ? null : prev)), 1500);
    } catch {
      return;
    }
  };

  return (
    <section className="chat" data-thread-open={mobileThread} aria-label="Phòng chat Tri thức">
      <aside className="chat-list">
        <h2 className="chat-title">Phòng chat Tri thức</h2>
        <label className="chat-search">
          <Search size={16} aria-hidden="true" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm cuộc trò chuyện" aria-label="Tìm cuộc trò chuyện" />
        </label>
        <ul className="chat-threads">
          {visibleThreads.map((t) => {
            const last = lastOf(t.id);
            const n = unread(t.id);
            return (
              <li key={t.id}>
                <button type="button" className="chat-thread" aria-current={t.id === activeId} onClick={() => openThread(t.id)}>
                  <span className="chat-avatar" data-online={t.online}>{t.name.replace('#', '').slice(0, 1).toUpperCase()}</span>
                  <span className="chat-thread-body">
                    <strong>{t.name}</strong>
                    <span>{last ? last.text || 'Đã chia sẻ đoạn code' : 'Chưa có tin nhắn'}</span>
                  </span>
                  {n > 0 && <span className="chat-badge" aria-label={`${n} tin chưa đọc`}>{n}</span>}
                </button>
              </li>
            );
          })}
          {visibleThreads.length === 0 && <li className="chat-empty">Không tìm thấy cuộc trò chuyện.</li>}
        </ul>
      </aside>

      <div className="chat-pane">
        <header className="chat-head">
          <button type="button" className="chat-back" onClick={() => setMobileThread(false)} aria-label="Quay lại danh sách">
            <ArrowLeft size={18} />
          </button>
          <span className="chat-avatar" data-online={thread.online}>{thread.name.replace('#', '').slice(0, 1).toUpperCase()}</span>
          <div>
            <strong>{thread.name}</strong>
            <span className="chat-sub">{thread.online ? 'Đang hoạt động' : 'Ngoại tuyến'}</span>
          </div>
        </header>
        {thread.rule && (
          <p className="chat-pin"><Pin size={14} aria-hidden="true" /> {thread.rule}</p>
        )}
        <div className="chat-stream" role="log" aria-live="polite">
          {threadMessages.length === 0 && <p className="chat-empty">Chưa có tin nhắn. Hãy mở đầu cuộc trò chuyện.</p>}
          {threadMessages.map((m, i) => {
            const mine = m.authorHandle === currentHandle;
            const prev = threadMessages[i - 1];
            const grouped = prev?.authorHandle === m.authorHandle && Date.parse(m.at) - Date.parse(prev.at) < 300000;
            const quoted = m.replyToId ? messages.find((x) => x.id === m.replyToId) : undefined;
            return (
              <div key={m.id} className="chat-row" data-mine={mine} data-grouped={grouped}>
                {!mine && !grouped && <span className="chat-author">{m.authorName}</span>}
                <div className="chat-bubble-wrap">
                  <div className="chat-bubble">
                    {quoted && <blockquote className="chat-quote">{quoted.authorName}: {quoted.text.slice(0, 80)}</blockquote>}
                    {m.text && <p>{m.text}</p>}
                    {m.snippet && (
                      <div className="relative">
                        <pre className="chat-code"><code>{m.snippet}</code></pre>
                        {isFabulous && (
                          <button
                            type="button"
                            className="chat-copy-btn"
                            aria-label="Chép đoạn code"
                            title={copiedId === m.id ? 'Đã chép' : 'Chép code'}
                            onClick={() => void copySnippet(m.id, m.snippet || '')}
                          >
                            {copiedId === m.id ? <Check size={12} /> : <Copy size={12} />}
                            <span>{copiedId === m.id ? 'Đã chép' : 'Chép'}</span>
                          </button>
                        )}
                      </div>
                    )}
                    <time dateTime={m.at}>{timeLabel(m.at)}</time>
                  </div>
                  <div className="chat-actions">
                    {REACTIONS.map(({ id, label, Icon }) => (
                      <button key={id} type="button" onClick={() => react(m.id, id)} aria-label={label}><Icon size={14} /></button>
                    ))}
                    <button type="button" onClick={() => setReplyTo(m)}>Trả lời</button>
                  </div>
                </div>
                {Object.entries(m.reactions).some(([, u]) => u.length > 0) && (
                  <div className="chat-reacts">
                    {Object.entries(m.reactions).filter(([, u]) => u.length > 0).map(([id, u]) => {
                      const Icon = REACTION_ICON[id];
                      return (
                        <button key={id} type="button" aria-pressed={u.includes(currentHandle)} onClick={() => react(m.id, id)}>
                          {Icon && <Icon size={12} />} {u.length}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
          {typingFrom && <p className="chat-typing">{typingFrom} đang nhập…</p>}
          <div ref={endRef} />
        </div>
        <form className="chat-compose" onSubmit={send}>
          {replyTo && (
            <p className="chat-replying">
              Trả lời {replyTo.authorName}: {replyTo.text.slice(0, 50)}
              <button type="button" onClick={() => setReplyTo(null)} aria-label="Hủy trả lời"><X size={14} /></button>
            </p>
          )}
          {showSnippet && (
            <textarea className="chat-snippet" value={snippet} onChange={(e) => setSnippet(e.target.value)} placeholder="Dán đoạn code / UI snippet" aria-label="Đoạn code" rows={4} />
          )}
          {warning && <p className="chat-warning" role="alert">{warning}</p>}
          <div className="chat-compose-row">
            <button type="button" className="chat-icon" aria-pressed={showSnippet} onClick={() => setShowSnippet((v) => !v)} aria-label="Đính kèm code">
              <Code2 size={18} />
            </button>
            <input value={draft} onChange={(e) => onType(e.target.value)} placeholder="Nhắn tin…" aria-label="Nội dung tin nhắn" />
            <button type="submit" className="chat-send" disabled={!draft.trim() && !snippet.trim()} aria-label="Gửi">
              <Send size={16} />
            </button>
          </div>
        </form>
      </div>
    </section>
  );
};
