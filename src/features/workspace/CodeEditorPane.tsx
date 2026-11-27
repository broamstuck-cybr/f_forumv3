import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { WorkspaceFile } from '../../types/index';
import { tokenizeForEditor } from './syntaxHighlight';

export interface CodeEditorPaneProps {
  files: WorkspaceFile[];
  openTabs: string[];
  activeFilePath: string;
  modifiedPaths?: Set<string>;
  explorerOpen: boolean;
  onToggleExplorer: () => void;
  onSelectTab: (filePath: string) => void;
  onCloseTab: (filePath: string) => void;
  onChangeFileContent: (filePath: string, nextContent: string) => void;
  onNotify: (title: string, message?: string) => void;
}

export const CodeEditorPane: React.FC<CodeEditorPaneProps> = ({
  files,
  openTabs,
  activeFilePath,
  modifiedPaths,
  explorerOpen,
  onToggleExplorer,
  onSelectTab,
  onCloseTab,
  onChangeFileContent,
  onNotify,
}) => {
  const [copied, setCopied] = useState(false);
  const [findOpen, setFindOpen] = useState(false);
  const [findQuery, setFindQuery] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const highlightPreRef = useRef<HTMLPreElement | null>(null);
  const gutterRef = useRef<HTMLDivElement | null>(null);
  const findInputRef = useRef<HTMLInputElement | null>(null);
  const tabsScrollRef = useRef<HTMLDivElement | null>(null);

  const activeFile = useMemo(
    () => files.find((f) => f.path === activeFilePath) || files[0] || null,
    [files, activeFilePath]
  );

  const content = activeFile?.content ?? '';
  const lineCount = useMemo(() => (content ? content.split('\n').length : 1), [content]);
  const kbSize = useMemo(
    () => (content ? (new Blob([content]).size / 1024).toFixed(1) : '0.0'),
    [content]
  );

  const tokens = useMemo(
    () => (activeFile ? tokenizeForEditor(content, activeFile.language) : []),
    [activeFile, content]
  );

  const findMatchCount = useMemo(() => {
    const q = findQuery.trim().toLowerCase();
    if (!q || !content) return 0;
    const hay = content.toLowerCase();
    let count = 0;
    let idx = hay.indexOf(q);
    while (idx !== -1) {
      count += 1;
      idx = hay.indexOf(q, idx + q.length);
    }
    return count;
  }, [content, findQuery]);

  useEffect(() => {
    if (findOpen) {
      findInputRef.current?.focus();
    }
  }, [findOpen]);

  useEffect(() => {
    const activeTabEl = tabsScrollRef.current?.querySelector('.ws-fileTab.is-active');
    if (activeTabEl && 'scrollIntoView' in activeTabEl) {
      activeTabEl.scrollIntoView({ inline: 'nearest', block: 'nearest' });
    }
  }, [activeFilePath]);

  const syncScroll = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    if (highlightPreRef.current) {
      highlightPreRef.current.scrollTop = ta.scrollTop;
      highlightPreRef.current.scrollLeft = ta.scrollLeft;
    }
    if (gutterRef.current) {
      gutterRef.current.scrollTop = ta.scrollTop;
    }
  };

  const handleCopy = async () => {
    if (!activeFile) return;
    try {
      await navigator.clipboard.writeText(activeFile.content);
      setCopied(true);
      onNotify(`Đã sao chép ${activeFile.path}`, `${lineCount} dòng · ${kbSize} KB`);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      onNotify('Không sao chép được mã', 'Hãy chọn trực tiếp trong trình soạn thảo.');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
      e.preventDefault();
      setFindOpen(true);
      return;
    }
    if (e.key === 'Tab' && activeFile) {
      e.preventDefault();
      const ta = e.currentTarget;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const nextVal = `${content.slice(0, start)}  ${content.slice(end)}`;
      onChangeFileContent(activeFile.path, nextVal);
      window.requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = start + 2;
          textareaRef.current.selectionEnd = start + 2;
        }
      });
    }
  };

  const jumpToFindMatch = () => {
    const q = findQuery.trim().toLowerCase();
    const ta = textareaRef.current;
    if (!q || !ta) return;
    const hay = content.toLowerCase();
    const from = ta.selectionEnd || 0;
    let idx = hay.indexOf(q, from);
    if (idx === -1) idx = hay.indexOf(q, 0);
    if (idx !== -1) {
      ta.focus();
      ta.setSelectionRange(idx, idx + q.length);
      const lineIdx = content.slice(0, idx).split('\n').length - 1;
      ta.scrollTop = Math.max(0, lineIdx * 21 - 80);
      syncScroll();
    }
  };

  const visibleTabs = useMemo(() => {
    const existing = new Set(files.map((f) => f.path));
    const filtered = openTabs.filter((p) => existing.has(p));
    if (activeFile && !filtered.includes(activeFile.path)) {
      filtered.push(activeFile.path);
    }
    return filtered;
  }, [activeFile, files, openTabs]);

  return (
    <div className="ws-editorPane">
      <div className="ws-tabsBar">
        <button
          type="button"
          className={`ws-editorToolBtn${explorerOpen ? ' is-active' : ''}`}
          onClick={onToggleExplorer}
          aria-label={explorerOpen ? 'Ẩn cây tệp' : 'Hiện cây tệp'}
          title={explorerOpen ? 'Ẩn cây tệp' : 'Hiện cây tệp'}
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="3" y="4" width="18" height="16" rx="2" />
            <line x1="9" y1="4" x2="9" y2="20" />
          </svg>
        </button>

        <div ref={tabsScrollRef} className="ws-tabsScroll" role="tablist" aria-label="Các tệp đang mở">
          {visibleTabs.map((tabPath) => {
            const isActive = activeFile?.path === tabPath;
            const isModified = Boolean(modifiedPaths?.has(tabPath));
            const shortName = tabPath.split('/').pop() || tabPath;
            return (
              <div
                key={tabPath}
                className={`ws-fileTab${isActive ? ' is-active' : ''}`}
                role="tab"
                aria-selected={isActive}
              >
                <button
                  type="button"
                  className="ws-fileTab__btn"
                  onClick={() => onSelectTab(tabPath)}
                  title={tabPath}
                >
                  <span>{shortName}</span>
                  {isModified && <span className="ws-fileTab__dot" aria-label="Đã sửa" />}
                </button>
                {visibleTabs.length > 1 && (
                  <button
                    type="button"
                    className="ws-fileTab__close"
                    onClick={() => onCloseTab(tabPath)}
                    aria-label={`Đóng thẻ ${shortName}`}
                    title="Đóng thẻ"
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M18 6 6 18" />
                      <path d="m6 6 12 12" />
                    </svg>
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div className="ws-editorMeta">
          <span className="ws-editorMeta__stat">
            {lineCount} dòng · {kbSize} KB
          </span>
          <button
            type="button"
            className={`ws-editorToolBtn${findOpen ? ' is-active' : ''}`}
            onClick={() => setFindOpen((v) => !v)}
            aria-label="Tìm trong tệp"
            title="Tìm (Ctrl+F)"
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
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </button>
          <button
            type="button"
            className="ws-editorToolBtn"
            onClick={handleCopy}
            disabled={!activeFile}
            aria-label="Sao chép mã tệp hiện tại"
            title={copied ? 'Đã sao chép' : 'Sao chép'}
          >
            {copied ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="9" y="9" width="13" height="13" rx="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {findOpen && (
        <div className="ws-findBar">
          <input
            ref={findInputRef}
            type="text"
            className="ws-findBar__input"
            value={findQuery}
            onChange={(e) => setFindQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                jumpToFindMatch();
              } else if (e.key === 'Escape') {
                setFindOpen(false);
              }
            }}
            placeholder="Tìm trong tệp hiện tại..."
            aria-label="Từ khóa tìm trong tệp"
          />
          <span className="ws-findBar__count">
            {findQuery.trim() ? `${findMatchCount} kết quả` : ''}
          </span>
          <button
            type="button"
            className="ws-editorToolBtn"
            onClick={jumpToFindMatch}
            disabled={findMatchCount === 0}
            aria-label="Kết quả tiếp theo"
            title="Tiếp theo"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
          <button
            type="button"
            className="ws-editorToolBtn"
            onClick={() => setFindOpen(false)}
            aria-label="Đóng thanh tìm kiếm"
            title="Đóng"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>
      )}

      {activeFile ? (
        <div className="ws-codeStage">
          <div ref={gutterRef} className="ws-codeGutter" aria-hidden="true">
            {Array.from({ length: lineCount }, (_, idx) => (
              <span key={idx + 1} className="ws-codeLineNum">
                {idx + 1}
              </span>
            ))}
          </div>

          <div className="ws-codeSurface">
            <pre ref={highlightPreRef} className="ws-codeHighlight" aria-hidden="true">
              <code>
                {tokens.map((tok, idx) =>
                  tok.kind === 'plain' ? (
                    tok.text
                  ) : (
                    <span key={idx} className={`ws-tok ws-tok--${tok.kind}`}>
                      {tok.text}
                    </span>
                  )
                )}
                {'\n'}
              </code>
            </pre>

            <textarea
              ref={textareaRef}
              className="ws-codeTextarea"
              value={content}
              onChange={(e) => onChangeFileContent(activeFile.path, e.target.value)}
              onScroll={syncScroll}
              onKeyDown={handleKeyDown}
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
              autoComplete="off"
              wrap="off"
              aria-label={`Trình soạn thảo mã cho ${activeFile.path}`}
            />
          </div>
        </div>
      ) : (
        <div className="ws-codeEmpty">Chọn một tệp ở thanh bên trái để chỉnh sửa mã nguồn.</div>
      )}
    </div>
  );
};
