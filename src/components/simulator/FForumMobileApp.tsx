import React, { useMemo, useState } from 'react';
import type { CheckCategory, DimensionView } from '../../types/index';
import sourceCatalogJson from '../../data/sourceCatalog.json';
import { getProofDemo, PROOF_BRIEF, type ProofVersion } from '../../data/proofDemo';
import { Media, previewFor } from '../../ui/Media';
import './fforum-mobile.css';

interface FForumMobileAppProps {
  onNavigate?: (view: DimensionView) => void;
  onGoHome: () => void;
  onActivityPulse?: (label: string) => void;
}

type MobileTab = 'write' | 'live' | 'proof' | 'source';

const TABS: Array<{ id: MobileTab; label: string }> = [
  { id: 'write', label: 'Viết' },
  { id: 'live', label: 'Live' },
  { id: 'proof', label: 'Soi' },
  { id: 'source', label: 'Nguồn' },
];

export const CHECK_LABELS: Record<CheckCategory, string> = {
  html_structure: 'Cấu trúc',
  js_syntax: 'Cú pháp',
  responsive_layout: 'Khung nhìn',
  internal_links: 'Liên kết',
  secret_scan: 'Khóa bí mật',
  accessibility: 'Tiếp cận',
};

interface CatalogRow {
  id: string;
  title: string;
  sourceLibrary: string;
}

export const FForumMobileApp: React.FC<FForumMobileAppProps> = ({ onNavigate, onGoHome, onActivityPulse }) => {
  const [tab, setTab] = useState<MobileTab>('write');
  const [version, setVersion] = useState<ProofVersion>('draft');
  const demo = useMemo(() => getProofDemo(), []);
  const state = demo[version];
  const additions = demo.diffs.reduce((sum, entry) => sum + entry.additions, 0);
  const deletions = demo.diffs.reduce((sum, entry) => sum + entry.deletions, 0);
  const issueCount = state.report.results.reduce(
    (sum, result) => sum + result.issues.filter((issue) => issue.severity !== 'info').length,
    0
  );

  const plates = useMemo(() => {
    const rows = sourceCatalogJson as CatalogRow[];
    return rows.filter((row) => previewFor(row.id)?.kind === 'video').slice(0, 4);
  }, []);

  const switchTab = (next: MobileTab) => {
    setTab(next);
    if (onActivityPulse) onActivityPulse(TABS.find((item) => item.id === next)?.label ?? 'F-Forum');
  };

  const revise = () => {
    setVersion('revised');
    setTab('proof');
    if (onActivityPulse) onActivityPulse('Đã sửa');
  };

  return (
    <div className="ffm scene-paper">
      <header className="ffm__head">
        <p className="ffm__brand">F-Forum</p>
        <button type="button" className="ffm__text" onClick={onGoHome}>
          Đóng
        </button>
      </header>

      <div className="ffm__body">
        {tab === 'write' && (
          <section aria-label="Viết">
            <p className="ffm__label">lời nhắc</p>
            <p className="ffm__brief">{PROOF_BRIEF}</p>
            <div className="ffm__seg" role="group" aria-label="Phiên bản">
              <button type="button" aria-pressed={version === 'draft'} onClick={() => setVersion('draft')}>
                Bản nháp
              </button>
              <button type="button" aria-pressed={version === 'revised'} onClick={() => setVersion('revised')}>
                Bản sửa
              </button>
            </div>
            <p className="ffm__note">
              {version === 'draft'
                ? `Bản nháp còn ${issueCount} chỗ cần sửa.`
                : 'Bản sửa qua cả sáu phép kiểm.'}
            </p>
            <div className="ffm__actions">
              <button type="button" className="ffm__btn" onClick={() => switchTab('live')}>
                Xem chạy
              </button>
              {version === 'draft' && (
                <button type="button" className="ffm__btn ffm__btn--red" onClick={revise}>
                  Sửa ngay
                </button>
              )}
            </div>
          </section>
        )}

        {tab === 'live' && (
          <section aria-label="Live View">
            <p className="ffm__label">live view, {version === 'draft' ? 'bản nháp' : 'bản sửa'}</p>
            <div className="ffm__frame">
              <iframe title="Live View của trang mẫu" sandbox="" srcDoc={state.srcDoc} />
            </div>
            <p className="ffm__note">
              {version === 'draft'
                ? 'Trang rộng cố định 640px nên tràn khỏi màn hình này.'
                : 'Trang co theo màn hình, không còn tràn.'}
            </p>
          </section>
        )}

        {tab === 'proof' && (
          <section aria-label="Diff & Check">
            <p className="ffm__label">
              check, {state.report.passCount}/{state.report.results.length} đạt
            </p>
            <ul className="ffm__checks">
              {state.report.results.map((result) => (
                <li key={result.id} data-status={result.status}>
                  <span>{CHECK_LABELS[result.category]}</span>
                  <span className="ffm__status">
                    {result.status === 'pass' ? 'đạt' : result.status === 'warn' ? 'cần sửa' : 'lỗi'}
                  </span>
                </li>
              ))}
            </ul>
            <p className="ffm__label">
              diff, <span className="ffm__add">+{additions}</span> <span className="ffm__del">−{deletions}</span>
            </p>
            {version === 'draft' ? (
              <button type="button" className="ffm__btn ffm__btn--red" onClick={revise}>
                Sửa ngay
              </button>
            ) : (
              <ul className="ffm__diff">
                {demo.diffs[0].hunks[0].lines
                  .filter((line) => line.type !== 'context')
                  .slice(0, 5)
                  .map((line, index) => (
                    <li key={`${line.type}-${index}`} data-type={line.type}>
                      {line.type === 'add' ? '+' : '−'} {line.content.trim().slice(0, 44)}
                    </li>
                  ))}
              </ul>
            )}
          </section>
        )}

        {tab === 'source' && (
          <section aria-label="Nguồn">
            <p className="ffm__label">kho tham chiếu</p>
            <div className="ffm__plates">
              {plates.map((row) => {
                const preview = previewFor(row.id);
                return (
                  <figure key={row.id}>
                    {preview && <Media preview={preview} title={row.title} />}
                    <figcaption>{row.title}</figcaption>
                  </figure>
                );
              })}
            </div>
            {onNavigate && (
              <button type="button" className="ffm__btn" onClick={() => onNavigate('explore')}>
                Mở kho
              </button>
            )}
          </section>
        )}
      </div>

      <nav className="ffm__tabs" aria-label="Ứng dụng F-Forum">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-current={tab === item.id ? 'page' : undefined}
            onClick={() => switchTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  );
};

export default FForumMobileApp;
