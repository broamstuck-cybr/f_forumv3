import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Check,
  Code2,
  Copy,
  Flame,
  Heart,
  Image as ImageIcon,
  Pin,
  Plus,
  Reply,
  Search,
  Send,
  ThumbsUp,
  X,
} from 'lucide-react';
import { moderateText } from './moderationFilter';
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
  imageUrl?: string;
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
  { id: 'chung-fpt', name: '#chung-fpt', kind: 'channel', online: true, rule: 'Tôn trọng nhau, không spam, không đăng đáp án thi.' },
  { id: 'vibe-coding', name: '#vibe-coding', kind: 'channel', online: true, rule: 'Chia sẻ prompt kèm kết quả. Ghi rõ công cụ đã dùng.' },
  { id: 'ui-ux-critique', name: '#ui-ux-critique', kind: 'channel', online: true, rule: 'Góp ý cụ thể, có lý do. Không chê chung chung.' },
  { id: 'hoi-dap-nhanh', name: '#hoi-dap-nhanh', kind: 'channel', online: true, rule: 'Nêu rõ lỗi, môi trường và đoạn code liên quan.' },
];

const SEED: ChatMessage[] = [];

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

const timeLabel = (iso: string) =>
  new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

const threadInitial = (name: string) =>
  name.replace(/^[#@]/, '').trim().slice(0, 1).toUpperCase() || 'F';

interface Props {
  currentHandle: string;
  currentName: string;
}

export const CommunityChatRoom: React.FC<Props> = ({ currentHandle, currentName }) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [customThreads, setCustomThreads] = useState<ChatThread[]>(() => load(THREADS_KEY, []));
  const [messages, setMessages] = useState<ChatMessage[]>(() => load(STORE_KEY, SEED));
  const [readAt, setReadAt] = useState<Record<string, number>>(() => load(READ_KEY, {}));
  const [activeId, setActiveId] = useState<string>('chung-fpt');
  const [mobileThread, setMobileThread] = useState(false);
  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState('');
  const [snippet, setSnippet] = useState('');
  const [showSnippet, setShowSnippet] = useState(false);
  const [showPhoto, setShowPhoto] = useState(false);
  const [photoUrl, setPhotoUrl] = useState('');
  const [showPin, setShowPin] = useState(true);
  const [newDmOpen, setNewDmOpen] = useState(false);
  const [newDmName, setNewDmName] = useState('');
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [warning, setWarning] = useState('');
  const [typingFrom, setTypingFrom] = useState('');
  const busRef = useRef<BroadcastChannel | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);
  const typingTimer = useRef<number | undefined>(undefined);

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
        typingTimer.current = window.setTimeout(() => setTypingFrom(''), 2000);
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

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    const cleanSnippet = snippet.trim();
    const cleanPhoto = photoUrl.trim();
    if (!text && !cleanSnippet && !cleanPhoto) return;
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
      reactions: {},
    };
    const next = [...load(STORE_KEY, messages), msg];
    setMessages(next);
    persist(next);
    setDraft('');
    setSnippet('');
    setPhotoUrl('');
    setShowSnippet(false);
    setShowPhoto(false);
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

  const copySnippet = async (id: string, code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedId(id);
      window.setTimeout(() => setCopiedId((prev) => (prev === id ? null : prev)), 1500);
    } catch {
      return;
    }
  };

  const hasSendable = Boolean(draft.trim() || snippet.trim() || photoUrl.trim());

  return (
    <section className="chat" data-thread-open={mobileThread} aria-label="Phòng chat Tri thức">
      <aside className="chat-list">
        <div className="chat-list-head">
          <h2 className="chat-title">Direct · Tri thức</h2>
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

        <div className="chat-stories" aria-label="Bạn bè và kênh đang hoạt động">
          <button
            type="button"
            className="chat-story-btn"
            onClick={() => setNewDmOpen(true)}
            aria-label="Bắt đầu cuộc trò chuyện mới"
          >
            <span className="chat-story-ring" data-active-ring="true">
              <span className="chat-story-inner">
                <Plus size={18} aria-hidden="true" />
              </span>
              <span className="chat-online-dot" aria-hidden="true" />
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
                  {t.online && <span className="chat-online-dot" aria-hidden="true" />}
                </span>
                <span className="chat-story-label">{t.name.replace(/^#/, '')}</span>
              </button>
            );
          })}
        </div>

        <label className="chat-search">
          <Search size={15} aria-hidden="true" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm cuộc trò chuyện"
            aria-label="Tìm cuộc trò chuyện"
          />
          {query && (
            <button type="button" className="chat-search-clear" onClick={() => setQuery('')} aria-label="Xóa tìm kiếm">
              <X size={13} />
            </button>
          )}
        </label>

        <ul className="chat-threads">
          {visibleThreads.map((t) => {
            const last = lastOf(t.id);
            const n = unread(t.id);
            const previewText = last
              ? `${last.authorHandle === currentHandle ? 'Bạn: ' : ''}${last.text || (last.imageUrl ? 'Đã gửi ảnh' : 'Đã chia sẻ đoạn code')}`
              : 'Chưa có tin nhắn';
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
                    <span className="chat-avatar">{threadInitial(t.name)}</span>
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
                      <span className="chat-unread-dot" aria-hidden="true" />
                      <span className="chat-badge" aria-label={`${n} tin chưa đọc`}>{n}</span>
                    </span>
                  )}
                </button>
              </li>
            );
          })}
          {visibleThreads.length === 0 && <li className="chat-empty">Không tìm thấy cuộc trò chuyện.</li>}
        </ul>
      </aside>

      <div className="chat-pane">
        <header className="chat-head">
          <div className="chat-head-user">
            <button type="button" className="chat-back" onClick={() => setMobileThread(false)} aria-label="Quay lại danh sách">
              <ArrowLeft size={18} />
            </button>
            <span className="chat-avatar chat-avatar--head">
              {threadInitial(thread.name)}
              {thread.online && <span className="chat-online-dot" aria-hidden="true" />}
            </span>
            <div className="chat-head-meta">
              <strong>{thread.name}</strong>
              <span className="chat-sub">{thread.online ? 'Đang hoạt động' : 'Ngoại tuyến'}</span>
            </div>
          </div>

          <div className="chat-head-actions">
            {thread.rule && (
              <button
                type="button"
                className="chat-head-btn"
                aria-pressed={showPin}
                aria-label={showPin ? 'Ẩn ghim kênh' : 'Hiện ghim kênh'}
                title="Ghim quy tắc"
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
          </div>
        </header>

        {thread.rule && showPin && (
          <p className="chat-pin">
            <span className="chat-pin-text">
              <Pin size={14} aria-hidden="true" />
              <span>{thread.rule}</span>
            </span>
          </p>
        )}

        <div className="chat-stream" role="log" aria-live="polite">
          {threadMessages.length === 0 && (
            <p className="chat-empty">Chưa có tin nhắn trong {thread.name}. Hãy gửi lời chào hoặc đoạn mã đầu tiên.</p>
          )}
          {threadMessages.map((m, i) => {
            const mine = m.authorHandle === currentHandle;
            const prev = threadMessages[i - 1];
            const grouped = prev?.authorHandle === m.authorHandle && Date.parse(m.at) - Date.parse(prev.at) < 300000;
            const quoted = m.replyToId ? messages.find((x) => x.id === m.replyToId) : undefined;
            const heartReacted = (m.reactions.heart ?? []).includes(currentHandle);
            return (
              <div key={m.id} className="chat-row" data-mine={mine} data-grouped={grouped}>
                {!mine && !grouped && <span className="chat-author">{m.authorName}</span>}
                <div className="chat-bubble-wrap">
                  <div
                    className="chat-bubble"
                    onDoubleClick={() => react(m.id, 'heart')}
                    title="Nhấn đúp để thả tim"
                  >
                    {quoted && (
                      <blockquote className="chat-quote">
                        {quoted.authorName}: {quoted.text.slice(0, 80) || 'Đoạn mã / Ảnh'}
                      </blockquote>
                    )}
                    {m.text && <p>{m.text}</p>}
                    {m.imageUrl && <img className="chat-photo" src={m.imageUrl} alt="Ảnh đính kèm trong tin nhắn" loading="lazy" />}
                    {m.snippet && (
                      <div className="chat-code-wrap">
                        <div className="chat-code-bar">
                          <span>snippet</span>
                          <button
                            type="button"
                            className="chat-code-copy"
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
                    <time dateTime={m.at}>{timeLabel(m.at)}</time>
                  </div>
                  <div className="chat-actions">
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
                        >
                          <Icon size={14} />
                        </button>
                      );
                    })}
                    <button type="button" onClick={() => setReplyTo(m)} aria-label="Trả lời tin nhắn">
                      <Reply size={13} />
                      <span>Trả lời</span>
                    </button>
                  </div>
                </div>
                {Object.entries(m.reactions).some(([, u]) => u.length > 0) && (
                  <div className="chat-reacts">
                    {Object.entries(m.reactions)
                      .filter(([, u]) => u.length > 0)
                      .map(([id, u]) => {
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
          {typingFrom && (
            <p className="chat-typing" aria-live="polite">
              <span>{typingFrom} đang nhập</span>
              <span className="chat-typing-dots" aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
            </p>
          )}
          <div ref={endRef} />
        </div>

        <form className="chat-compose" onSubmit={send}>
          {replyTo && (
            <p className="chat-replying">
              <span>
                Trả lời <strong>{replyTo.authorName}</strong>: {replyTo.text.slice(0, 60) || 'Đoạn mã / Ảnh'}
              </span>
              <button type="button" onClick={() => setReplyTo(null)} aria-label="Hủy trả lời">
                <X size={14} />
              </button>
            </p>
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
                  <button type="button" className="chat-search-clear" onClick={() => setPhotoUrl('')} aria-label="Gỡ ảnh">
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
          {warning && <p className="chat-warning" role="alert">{warning}</p>}
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
            <input
              value={draft}
              onChange={(e) => onType(e.target.value)}
              placeholder={`Nhắn tin tới ${thread.name}...`}
              aria-label="Nội dung tin nhắn"
            />
            <button type="submit" className="chat-send" disabled={!hasSendable} aria-label="Gửi">
              <Send size={16} />
            </button>
          </div>
        </form>
      </div>
    </section>
  );
};
