import React, { useMemo, useState } from 'react';
import JSZip from 'jszip';
import { handleLiquidPointerLeave, handleLiquidPointerMove } from '../../utils/liquidGlassPointer';

export interface ArenaRunnerPaneProps {
  html: string;
  pageTitle: string;
  publishedSlug: string | null;
  publishing: boolean;
  busy: boolean;
  viewMode: 'preview' | 'code';
  pointerShield?: boolean;
  onChangeViewMode: (mode: 'preview' | 'code') => void;
  onPublish: () => void;
  onOpenShowcase: () => void;
  onNotify: (title: string, message?: string) => void;
}

export const ArenaRunnerPane: React.FC<ArenaRunnerPaneProps> = ({
  html,
  pageTitle,
  publishedSlug,
  publishing,
  busy,
  viewMode,
  pointerShield = false,
  onChangeViewMode,
  onPublish,
  onOpenShowcase,
  onNotify,
}) => {
  const [reloadNonce, setReloadNonce] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const publicUrl = useMemo(() => {
    if (!publishedSlug) return null;
    if (typeof window !== 'undefined' && window.location.origin) {
      return `${window.location.origin}/p/${publishedSlug}`;
    }
    return `https://fforum3.vercel.app/p/${publishedSlug}`;
  }, [publishedSlug]);

  const displayAddress = publishedSlug
    ? `fforum3.vercel.app/p/${publishedSlug}`
    : 'Xem trước cục bộ';

  const lineCount = useMemo(() => (html ? html.split('\n').length : 0), [html]);
  const kbSize = useMemo(
    () => (html ? (new Blob([html]).size / 1024).toFixed(1) : '0.0'),
    [html]
  );

  const handleCopyLink = async () => {
    const target = publicUrl || (typeof window !== 'undefined' ? window.location.href : '');
    try {
      await navigator.clipboard.writeText(target);
      setCopiedLink(true);
      onNotify(publicUrl ? 'Đã sao chép liên kết' : 'Chưa xuất bản', publicUrl || 'Bấm Xuất bản để tạo liên kết công khai.');
      window.setTimeout(() => setCopiedLink(false), 1800);
    } catch {
      onNotify('Không sao chép được', 'Trình duyệt không cấp quyền bảng nhớ tạm.');
    }
  };

  const handleOpenNewTab = () => {
    if (publicUrl) {
      window.open(publicUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    if (!html) return;
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank', 'noopener,noreferrer');
    window.setTimeout(() => URL.revokeObjectURL(url), 15000);
  };

  const handleCopyCode = async () => {
    if (!html) return;
    try {
      await navigator.clipboard.writeText(html);
      setCopiedCode(true);
      onNotify('Đã sao chép mã HTML', `${lineCount} dòng · ${kbSize} KB`);
      window.setTimeout(() => setCopiedCode(false), 1800);
    } catch {
      onNotify('Không sao chép được mã', 'Hãy thử chọn trực tiếp trong khung mã.');
    }
  };

  const handleDownloadZip = async () => {
    if (!html) return;
    try {
      const zip = new JSZip();
      const safeSlug =
        (publishedSlug || pageTitle || 'fforum-page')
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/đ/g, 'd')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '') || 'fforum-page';
      zip.file('index.html', html);
      zip.file(
        'README.txt',
        `${pageTitle || 'F-Forum Page'}\nMở tệp index.html bằng trình duyệt bất kỳ để chạy trực tiếp.\n`
      );
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${safeSlug}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 5000);
      onNotify('Đã tải gói ZIP', `${safeSlug}.zip (${kbSize} KB)`);
    } catch {
      onNotify('Tải ZIP thất bại', 'Vui lòng thử lại sau vài giây.');
    }
  };

  return (
    <section className="ws-runner lg-glass lg-glass--matte" aria-label="Khung xem trước và xuất bản">
      <div className="ws-runner__bar">
        <div className="ws-runner__left">
          <div className="ws-seg" role="tablist" aria-label="Chế độ xem">
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === 'preview'}
              className={`ws-seg__btn${viewMode === 'preview' ? ' is-active' : ''}`}
              onClick={() => onChangeViewMode('preview')}
              aria-label="Xem trực tiếp"
              title="Xem trang"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === 'code'}
              className={`ws-seg__btn${viewMode === 'code' ? ' is-active' : ''}`}
              onClick={() => onChangeViewMode('code')}
              aria-label="Xem mã nguồn HTML"
              title="Mã nguồn"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
              </svg>
            </button>
          </div>

          <button
            type="button"
            className="ws-iconBtn ws-iconBtn--sm"
            disabled={!html}
            onClick={() => setReloadNonce((n) => n + 1)}
            aria-label="Tải lại bản xem trước"
            title="Tải lại"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 12a9 9 0 1 1-2.64-6.36" />
              <polyline points="21 3 21 9 15 9" />
            </svg>
          </button>
        </div>

        <div className="ws-address">
          <span
            className={`ws-address__dot${publishedSlug ? ' is-live' : ''}`}
            aria-hidden="true"
          />
          <span className="ws-address__text" title={displayAddress}>
            {displayAddress}
          </span>
          <button
            type="button"
            className="ws-address__act"
            disabled={!html}
            onClick={handleCopyLink}
            aria-label="Sao chép liên kết"
            title={copiedLink ? 'Đã sao chép' : 'Sao chép'}
          >
            {copiedLink ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="9" y="9" width="13" height="13" rx="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            )}
          </button>
          <button
            type="button"
            className="ws-address__act"
            disabled={!html}
            onClick={handleOpenNewTab}
            aria-label="Mở ở tab mới"
            title="Mở tab mới"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M15 3h6v6" />
              <path d="M10 14 21 3" />
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            </svg>
          </button>
        </div>

        <div className="ws-runner__right">
          <button
            type="button"
            className="ws-ctaBtn ws-ctaBtn--primary"
            disabled={!html || publishing || busy}
            onClick={onPublish}
          >
            {publishing ? 'Đang xuất...' : 'Xuất bản'}
          </button>
          <button
            type="button"
            className="ws-ctaBtn ws-ctaBtn--ghost"
            disabled={!html || busy}
            onClick={handleDownloadZip}
            aria-label="Tải gói ZIP"
            title="Tải ZIP"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span className="ws-hideSm">Tải ZIP</span>
          </button>
        </div>
      </div>

      <div className="ws-runner__body">
        {!html && !busy && (
          <div
            className="ws-runner__empty lg-glass lg-glass--matte"
            onPointerMove={handleLiquidPointerMove}
            onPointerLeave={handleLiquidPointerLeave}
          >
            <div className="ws-runner__emptyGlyph" aria-hidden="true">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="16" rx="2.5" />
                <path d="M3 9h18" />
                <path d="M8 14h4" />
              </svg>
            </div>
            <h3>Chưa có trang nào được dựng</h3>
            <p>Nhập yêu cầu ở khung bên trái hoặc chọn ngay một trong 15 mẫu Agent có sẵn.</p>
            <button type="button" className="ws-ctaBtn ws-ctaBtn--primary" onClick={onOpenShowcase}>
              Mở 15 mẫu Agent
            </button>
          </div>
        )}

        {!html && busy && (
          <div className="ws-runner__skeleton" role="status" aria-live="polite">
            <div className="ws-skel ws-skel--nav" />
            <div className="ws-skel ws-skel--hero" />
            <div className="ws-skelRow">
              <div className="ws-skel ws-skel--card" />
              <div className="ws-skel ws-skel--card" />
              <div className="ws-skel ws-skel--card" />
            </div>
            <span className="ws-skelLabel">Đang lắp ghép giao diện trực tiếp...</span>
          </div>
        )}

        {html && viewMode === 'preview' && (
          <div className="ws-iframeWrap">
            <iframe
              key={`${reloadNonce}-${publishedSlug || 'local'}`}
              className="ws-iframe"
              title={`Xem trước: ${pageTitle || 'Trang web'}`}
              srcDoc={html}
              sandbox="allow-scripts allow-forms allow-modals allow-popups"
              referrerPolicy="no-referrer"
            />
            {pointerShield && <div className="ws-iframeShield" aria-hidden="true" />}
          </div>
        )}

        {html && viewMode === 'code' && (
          <div className="ws-codeView">
            <div className="ws-codeView__bar">
              <span className="ws-codeView__meta">
                index.html · {lineCount} dòng · {kbSize} KB
              </span>
              <button
                type="button"
                className="ws-iconBtn ws-iconBtn--sm"
                onClick={handleCopyCode}
                aria-label="Sao chép mã nguồn"
                title={copiedCode ? 'Đã sao chép' : 'Sao chép mã'}
              >
                {copiedCode ? (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="9" y="9" width="13" height="13" rx="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                )}
              </button>
            </div>
            <pre className="ws-codePre">
              <code>{html}</code>
            </pre>
          </div>
        )}
      </div>
    </section>
  );
};
