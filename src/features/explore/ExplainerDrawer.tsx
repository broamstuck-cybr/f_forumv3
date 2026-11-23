import React, { useEffect, useRef, useState } from 'react';
import { BookOpen, Check, Copy, ExternalLink, Terminal, User, X } from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { copyText } from './catalog';
import type { ExplainerProfile } from './explainerData';

interface ExplainerDrawerProps {
  profile: ExplainerProfile | null;
  onClose: () => void;
}

export const ExplainerDrawer: React.FC<ExplainerDrawerProps> = ({ profile, onClose }) => {
  const { attachItemToWorkspace, openInWorkspace, activeProject, addToast } = useAppStore();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [copiedCmd, setCopiedCmd] = useState(false);

  const isOpen = profile !== null;

  useEffect(() => {
    setCopiedCmd(false);
  }, [profile?.id]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const root = document.documentElement;
    const prevOverflow = root.style.overflowY;
    root.style.overflowY = 'hidden';
    return () => {
      root.style.overflowY = prevOverflow;
    };
  }, [isOpen]);

  const handleBackdrop = (event: React.MouseEvent<HTMLDialogElement>) => {
    if (event.target === event.currentTarget) {
      event.currentTarget.close();
    }
  };

  const handleCopyCommand = async () => {
    if (!profile) return;
    const ok = await copyText(profile.installCommand);
    if (ok) {
      setCopiedCmd(true);
      window.setTimeout(() => setCopiedCmd(false), 1800);
    }
    addToast(
      ok
        ? { type: 'success', title: 'Đã chép lệnh', message: profile.installCommand }
        : { type: 'error', title: 'Không chép được lệnh', message: profile.title }
    );
  };

  const handleAttach = () => {
    if (!profile) return;
    if (activeProject.attachedItems.some((item) => item.id === profile.contextItem.id)) {
      addToast({ type: 'info', title: 'Đã đính kèm từ trước', message: profile.title });
      return;
    }
    attachItemToWorkspace(profile.contextItem);
  };

  const handleOpenWorkspace = () => {
    if (!profile) return;
    onClose();
    openInWorkspace(profile.contextItem);
  };

  return (
    <dialog
      ref={dialogRef}
      className="ex-explainer-dialog"
      aria-labelledby="ex-explainer-title"
      onClose={onClose}
      onClick={handleBackdrop}
    >
      {profile ? (
        <div className="ex-explainer-shell">
          <header className="ex-explainer-head">
            <div className="ex-explainer-head-meta">
              <span className="t-label">{profile.subtitle}</span>
              <span
                className={`ex-badge ${
                  profile.statusKind === 'tested'
                    ? 'ex-badge-tested'
                    : profile.statusKind === 'info'
                      ? 'ex-badge-info'
                      : 'ex-badge-tested'
                }`}
              >
                {profile.statusLabel}
              </span>
              {profile.isSpdx ? (
                <span className="ex-badge ex-badge-tested">{profile.licenseLabel}</span>
              ) : profile.licenseUrl ? (
                <a
                  href={profile.licenseUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ex-badge ex-badge-link"
                >
                  {profile.licenseLabel} ↗
                </a>
              ) : (
                <span className="ex-badge ex-badge-muted">{profile.licenseLabel}</span>
              )}
            </div>
            <button
              type="button"
              className="icon-btn"
              aria-label="Đóng bảng giải thích"
              onClick={() => dialogRef.current?.close()}
            >
              <X size={20} aria-hidden="true" />
            </button>
          </header>

          <div className="ex-explainer-body ff-scrollbar">
            <div className="ex-explainer-hero">
              <h2 id="ex-explainer-title" className="t-title ex-explainer-title">
                {profile.title}
              </h2>
              <p className="ex-explainer-summary">{profile.summary}</p>
              <p className="t-note ex-explainer-snapshot">{profile.snapshotNote}</p>
              {profile.botBlockedNote ? (
                <p className="ex-explainer-notice" role="note">
                  {profile.botBlockedNote}
                </p>
              ) : null}
            </div>

            <div className="ex-explainer-meta-grid">
              <div className="ex-explainer-meta-card">
                <span className="t-label">
                  <User size={13} aria-hidden="true" /> Tác giả / Chuyên gia
                </span>
                <strong className="ex-explainer-meta-val">{profile.author}</strong>
              </div>
              <div className="ex-explainer-meta-card">
                <span className="t-label">
                  <ExternalLink size={13} aria-hidden="true" /> Nguồn gốc chính thức
                </span>
                <a
                  href={profile.originUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ex-explainer-origin-anchor"
                >
                  <span>{profile.originUrl}</span>
                  <ExternalLink size={13} aria-hidden="true" />
                </a>
              </div>
            </div>

            {profile.metrics.length > 0 ? (
              <dl className="ex-explainer-stats">
                {profile.metrics.map((m) => (
                  <div key={m.label}>
                    <dt>{m.label}</dt>
                    <dd>{m.value}</dd>
                  </div>
                ))}
              </dl>
            ) : null}

            <section className="ex-explainer-section" aria-labelledby="ex-exp-works">
              <h3 id="ex-exp-works" className="ex-explainer-h3">
                <BookOpen size={15} aria-hidden="true" />
                <span>Nguyên lý hoạt động</span>
              </h3>
              <ul className="ex-explainer-list">
                {profile.howItWorks.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
            </section>

            <section className="ex-explainer-section" aria-labelledby="ex-exp-steps">
              <h3 id="ex-exp-steps" className="ex-explainer-h3">
                <Terminal size={15} aria-hidden="true" />
                <span>Cách cài đặt &amp; sử dụng từng bước</span>
              </h3>
              <ol className="ex-explainer-steps">
                {profile.steps.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
              <div className="ex-explainer-cmd">
                <pre>
                  <code>{profile.installCommand}</code>
                </pre>
                <button
                  type="button"
                  className="btn btn-line btn-sm"
                  onClick={() => void handleCopyCommand()}
                >
                  {copiedCmd ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
                  <span>{copiedCmd ? 'Đã chép' : 'Chép lệnh'}</span>
                </button>
              </div>
            </section>

            <section className="ex-explainer-section" aria-labelledby="ex-exp-use">
              <h3 id="ex-exp-use" className="ex-explainer-h3">
                <span>Trường hợp áp dụng cho học sinh &amp; lập trình viên</span>
              </h3>
              <ul className="ex-explainer-list">
                {profile.useCases.map((uc, i) => (
                  <li key={i}>{uc}</li>
                ))}
              </ul>
            </section>
          </div>

          <footer className="ex-explainer-foot">
            <a
              href={profile.originUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-line"
            >
              <span>{profile.originLabel}</span>
              <ExternalLink size={14} aria-hidden="true" />
            </a>
            <button type="button" className="btn btn-line" onClick={handleAttach}>
              Đính kèm vào Workspace
            </button>
            <button type="button" className="btn btn-solid" onClick={handleOpenWorkspace}>
              Dùng ngay trong Workspace
            </button>
          </footer>
        </div>
      ) : null}
    </dialog>
  );
};
