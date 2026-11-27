import React, { useEffect, useRef, useState } from 'react';
import { BRAND_PALETTES } from '../../engine/motionCraftPack';
import { handleLiquidPointerLeave, handleLiquidPointerMove } from '../../utils/liquidGlassPointer';
import type {
  AgentChatMessage,
  OnboardingProfile,
  OnboardingRole,
} from '../../types/workspaceV4';

export interface AgentChatPaneProps {
  profile: OnboardingProfile | null;
  messages: AgentChatMessage[];
  busy: boolean;
  errorMessage: string | null;
  canUndo: boolean;
  hasGeneratedHtml: boolean;
  canUseAi: boolean;
  onRequireAuth: () => void;
  onOpenShowcase: () => void;
  onSendPrompt: (text: string) => void;
  onRetryLast: () => void;
  onUndo: () => void;
  onFeedback: (messageId: string, value: 'yes' | 'no' | 'keep_working') => void;
  onEditOnboarding: () => void;
  onInspectFile: (filePath?: string) => void;
}

const ROLE_LABELS: Record<OnboardingRole, string> = {
  student: 'Học sinh / SV',
  beginner: 'Người mới',
  business: 'Kinh doanh',
  tech: 'Công nghệ',
};

const QUICK_EDIT_CHIPS = [
  'Nền sáng',
  'Thêm câu hỏi',
  'Đếm ngược',
  'Màu cam đào',
  'Rút gọn chữ',
];

const EMPTY_STARTERS: Array<{ tag: string; prompt: string }> = [
  {
    tag: 'Thuyết trình',
    prompt: 'Làm trang thuyết trình Dự án Năng lượng Xanh có số liệu và 2 câu trắc nghiệm',
  },
  {
    tag: 'React TSX',
    prompt: 'Tạo ứng dụng dashboard React TSX cho CLB Robotics có lọc dự án trực tiếp và form đăng ký',
  },
  {
    tag: 'Hồ sơ IT',
    prompt: 'Dựng hồ sơ sinh viên Công nghệ Thông tin nền tối gọn sạch',
  },
];

export const AgentChatPane: React.FC<AgentChatPaneProps> = ({
  profile,
  messages,
  busy,
  errorMessage,
  canUndo,
  hasGeneratedHtml,
  canUseAi,
  onRequireAuth,
  onOpenShowcase,
  onSendPrompt,
  onRetryLast,
  onUndo,
  onFeedback,
  onEditOnboarding,
  onInspectFile,
}) => {
  const [draft, setDraft] = useState('');
  const [openTraceIds, setOpenTraceIds] = useState<Record<string, boolean>>({});
  const feedEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length, busy]);

  const submit = () => {
    const clean = draft.trim();
    if (!clean || busy) return;
    setDraft('');
    onSendPrompt(clean);
  };

  const toggleTrace = (id: string) => {
    setOpenTraceIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant');

  const contextSummary = profile
    ? `${ROLE_LABELS[profile.role]} · ${profile.siteName || 'Trang mới'} · ${BRAND_PALETTES[profile.personality].label}`
    : 'Chế độ Chat nhanh · Chưa đặt hồ sơ 5 bước';

  return (
    <section className="ws-chat lg-glass lg-glass--matte" aria-label="Hội thoại với AI dựng trang">
      <div className="ws-chat__ctx">
        <span className="ws-chat__ctxText" title={contextSummary}>
          {contextSummary}
        </span>
        <button
          type="button"
          className="ws-iconBtn ws-iconBtn--sm lg-pill"
          onClick={onEditOnboarding}
          aria-label="Sửa thiết lập 5 bước"
          title="Sửa 5 bước"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.12 2.12 0 1 1 3 3L7 19l-4 1 1-4Z" />
          </svg>
        </button>
      </div>

      <div className="ws-chat__feed">
        {messages.length === 0 && !busy && (
          <div className="ws-chat__empty">
            <h2>Mô tả trang web bạn muốn dựng</h2>
            <p>
              AI tra kho mẫu giao diện miễn phí, tổ chức thành dự án nhiều tệp (HTML, CSS, JS hoặc React TSX) và chạy trực tiếp ở khung bên phải.
            </p>
            <div className="ws-chat__starters">
              {EMPTY_STARTERS.map((starter, idx) => (
                <button
                  key={starter.prompt}
                  type="button"
                  className={`ws-starterBtn lg-glass lg-glass--matte${idx === 0 ? ' ws-starterBtn--featured' : ''}`}
                  onPointerMove={handleLiquidPointerMove}
                  onPointerLeave={handleLiquidPointerLeave}
                  onClick={() => onSendPrompt(starter.prompt)}
                >
                  <span className="ws-starterTag">{starter.tag}</span>
                  <span className="ws-starterCopy">{starter.prompt}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => {
          if (msg.role === 'user') {
            return (
              <div key={msg.id} className="ws-msg ws-msg--user">
                <div className="ws-userBubble">{msg.text}</div>
              </div>
            );
          }

          const vaultStep = msg.trace?.find((s) => s.kind === 'vault_search');
          const fileSteps = msg.trace?.filter((s) => s.kind === 'file_create' || s.kind === 'file_edit') ?? [];
          const checkStep = msg.trace?.find((s) => s.kind === 'check');
          const isOpen = Boolean(openTraceIds[msg.id]);

          return (
            <article key={msg.id} className="ws-msg ws-msg--ai">
              <p className="ws-aiText">{msg.text}</p>

              {vaultStep && (
                <div className="ws-traceBlock">
                  <button
                    type="button"
                    className="ws-traceToggle"
                    aria-expanded={isOpen}
                    onClick={() => toggleTrace(msg.id)}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={isOpen ? 'is-rotated' : undefined}
                      aria-hidden="true"
                    >
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                    <span>{vaultStep.label}</span>
                  </button>

                  {isOpen && (
                    <div className="ws-traceDetail">
                      {msg.matchedResources && msg.matchedResources.length > 0 && (
                        <ul className="ws-matchedList">
                          {msg.matchedResources.map((res) => (
                            <li key={`${msg.id}-${res.id}`}>
                              <span className="ws-libTag">{res.library}</span>
                              <span className="ws-resTitle">{res.title}</span>
                              <span className="ws-resReason">{res.reason}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                      {checkStep && (
                        <div className="ws-checkNote">
                          <strong>{checkStep.label}</strong>
                          {checkStep.detail ? <span> — {checkStep.detail}</span> : null}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {fileSteps.length > 0 && (
                <div className="ws-fileRows">
                  {fileSteps.map((fs) => {
                    const targetFile =
                      fs.detail || fs.label.replace(/^(?:Created|Edited)\s+/i, '').trim() || undefined;
                    return (
                      <button
                        key={fs.id}
                        type="button"
                        className="ws-fileRow"
                        onClick={() => onInspectFile(targetFile)}
                        title={targetFile ? `Mở ${targetFile} trong Code` : 'Mở mã nguồn'}
                      >
                        <span className="ws-fileRow__left">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          <span>{fs.label}</span>
                        </span>
                        <span className="ws-fileRow__diff">
                          {typeof fs.added === 'number' && fs.added > 0 && (
                            <span className="ws-diffAdd">+{fs.added}</span>
                          )}
                          {typeof fs.removed === 'number' && fs.removed > 0 && (
                            <span className="ws-diffDel">-{fs.removed}</span>
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="ws-aiFoot">
                {msg.motionSignature && <span>{msg.motionSignature}</span>}
                {typeof msg.durationMs === 'number' && (
                  <span>{(msg.durationMs / 1000).toFixed(1)}s</span>
                )}
              </div>
            </article>
          );
        })}

        {busy && (
          <div className="ws-thinking" role="status" aria-live="polite">
            <span className="ws-thinking__dot" aria-hidden="true" />
            <span>Đang tra kho tài nguyên và dựng dự án đa tệp...</span>
          </div>
        )}

        {errorMessage && !busy && (
          <div className="ws-errorBox" role="alert">
            <span>{errorMessage}</span>
            <button type="button" className="ws-miniBtn" onClick={onRetryLast}>
              Thử lại
            </button>
          </div>
        )}

        <div ref={feedEndRef} />
      </div>

      {hasGeneratedHtml && lastAssistant && !busy && (
        <div className="ws-satisfy">
          <span className="ws-satisfy__q">Bạn thấy bản này ổn chưa?</span>
          <div className="ws-satisfy__btns">
            <button
              type="button"
              className={`ws-satBtn${lastAssistant.feedback === 'yes' ? ' is-picked' : ''}`}
              onClick={() => onFeedback(lastAssistant.id, 'yes')}
            >
              Có
            </button>
            <button
              type="button"
              className={`ws-satBtn${lastAssistant.feedback === 'no' ? ' is-picked' : ''}`}
              onClick={() => onFeedback(lastAssistant.id, 'no')}
            >
              Chưa
            </button>
            <button
              type="button"
              className={`ws-satBtn${lastAssistant.feedback === 'keep_working' ? ' is-picked' : ''}`}
              onClick={() => {
                onFeedback(lastAssistant.id, 'keep_working');
                inputRef.current?.focus();
              }}
            >
              Làm tiếp
            </button>
          </div>
        </div>
      )}

      <div className="ws-composerWrap">
        {!canUseAi && (
          <div className="ws-authGate" role="status">
            <span className="ws-authGate__text">
              AI chỉ bật cho tài khoản đã đăng nhập. Khách có thể xem trước 15 mẫu có sẵn.
            </span>
            <div className="ws-authGate__actions">
              <button type="button" className="ws-miniBtn ws-miniBtn--primary" onClick={onRequireAuth}>
                Đăng nhập
              </button>
              <button type="button" className="ws-miniBtn" onClick={onOpenShowcase}>
                Xem mẫu
              </button>
            </div>
          </div>
        )}

        {hasGeneratedHtml && canUseAi && (
          <div className="ws-quickChips" aria-label="Gợi ý chỉnh nhanh">
            {QUICK_EDIT_CHIPS.map((chip) => (
              <button
                key={chip}
                type="button"
                className="ws-chip"
                disabled={busy}
                onClick={() => onSendPrompt(chip)}
              >
                {chip}
              </button>
            ))}
          </div>
        )}

        <div
          className="ws-composer lg-glass lg-glass--matte"
          onPointerMove={handleLiquidPointerMove}
          onPointerLeave={handleLiquidPointerLeave}
        >
          <button
            type="button"
            className="ws-iconBtn ws-iconBtn--sm"
            disabled={!canUndo || busy}
            onClick={onUndo}
            aria-label="Quay lại bản trước"
            title="Hoàn tác"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 7v6h6" />
              <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
            </svg>
          </button>

          <textarea
            ref={inputRef}
            className="ws-input"
            rows={1}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder={
              hasGeneratedHtml
                ? 'Nhắn yêu cầu chỉnh sửa...'
                : 'Mô tả trang web bạn muốn tạo...'
            }
            aria-label="Nhập yêu cầu cho AI"
          />

          <button
            type="button"
            className="ws-sendBtn"
            disabled={!draft.trim() || busy}
            onClick={submit}
            aria-label="Gửi yêu cầu"
            title="Gửi"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 19V5" />
              <path d="m5 12 7-7 7 7" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
};
