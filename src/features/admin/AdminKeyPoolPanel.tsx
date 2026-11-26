import React, { useState } from 'react';
import type {
  AdminKeyPoolKeyStatus,
  AdminKeyPoolStatus,
  AdminTokenTotals,
} from '../../types/index';
import {
  IconAlertTriangle,
  IconCheckCircle2,
  IconCoins,
  IconCpu,
  IconKeyRound,
  IconRefreshCw,
  IconXCircle,
} from '../../ui/icons';
import type { AdminKeyPoolMode, AdminPoolProbeOutcome } from './adminTypes';
import { formatAdminDateTime } from './adminTypes';

interface AdminKeyPoolPanelProps {
  keyPool?: AdminKeyPoolStatus;
  totalTokens?: AdminTokenTotals;
  loading: boolean;
  error: string | null;
  probeResult: AdminPoolProbeOutcome | null;
  probing: boolean;
  onRetryLoad: () => void;
  onRunProbe: (mode: AdminKeyPoolMode, prompt?: string) => void;
}

const PROBE_MODES: Array<{ id: AdminKeyPoolMode; label: string }> = [
  { id: 'pool', label: 'Luân phiên' },
  { id: 'key1', label: 'Key 1' },
  { id: 'key2', label: 'Key 2' },
  { id: 'failover_sim', label: 'Dự phòng' },
];

const KEY_STATUS_LABEL: Record<AdminKeyPoolKeyStatus['status'], string> = {
  active: 'Hoạt động',
  cooldown: 'Tạm nghỉ',
  error: 'Lỗi',
  exhausted: 'Hết lượt',
  disabled: 'Tắt',
};

function formatNumber(val?: number | null): string {
  return Math.max(0, Math.round(val ?? 0)).toLocaleString('vi-VN');
}

export const AdminKeyPoolPanel: React.FC<AdminKeyPoolPanelProps> = ({
  keyPool,
  totalTokens,
  loading,
  error,
  probeResult,
  probing,
  onRetryLoad,
  onRunProbe,
}) => {
  const [probeMode, setProbeMode] = useState<AdminKeyPoolMode>('pool');
  const [probePrompt, setProbePrompt] = useState('');

  if (loading && !keyPool) {
    return (
      <section aria-label="Đang tải trạng thái Key Pool" className="adm-card adm-skeleton-card">
        <div className="adm-card-head">
          <div className="adm-skel-stack">
            <span className="adm-skel adm-skel--title" />
            <span className="adm-skel adm-skel--sub" />
          </div>
          <span className="adm-skel adm-skel--pill" />
        </div>
        <div className="adm-skel adm-skel--bar" />
        <div className="adm-pool-grid">
          <div className="adm-skel adm-skel--box" />
          <div className="adm-skel adm-skel--box" />
        </div>
        <span className="adm-card-sub">Đang đồng bộ trạng thái Key Pool &amp; hạn mức tài khoản gốc...</span>
      </section>
    );
  }

  if (error && !keyPool) {
    return (
      <section aria-label="Lỗi tải Key Pool" role="alert" className="adm-card adm-error-card">
        <div className="adm-card-head">
          <div className="adm-inline-icon">
            <IconAlertTriangle size={18} aria-hidden="true" />
            <div>
              <h2 className="adm-card-title">Không thể tải dữ liệu Key Pool</h2>
              <p className="adm-card-sub">{error}</p>
            </div>
          </div>
          <button type="button" onClick={onRetryLoad} className="btn btn-line btn-sm">
            Thử lại
          </button>
        </div>
      </section>
    );
  }

  const keys = keyPool?.keys ?? [];
  const shared = keyPool?.sharedAccountQuota;
  const aggTokens = totalTokens ?? keyPool?.totalTokens ?? { prompt: 0, completion: 0, total: 0 };

  const dailyLimit = Math.max(1, shared?.dailyLimit ?? 1500);
  const dailyUsed = Math.max(0, shared?.dailyUsed ?? 0);
  const dailyPct = Math.min(100, Math.round((dailyUsed / dailyLimit) * 100));

  const rpmLimit = Math.max(1, shared?.rpmLimit ?? 30);
  const rpmUsed = Math.max(0, shared?.rpmUsed ?? 0);
  const rpmPct = Math.min(100, Math.round((rpmUsed / rpmLimit) * 100));

  const activeCount = keys.filter((k) => k.status === 'active').length;
  const poolBadgeTone =
    activeCount === 0
      ? 'adm-tag-danger'
      : activeCount < keys.length
        ? 'adm-tag-amber'
        : 'tag-green';

  return (
    <section aria-label="API Key Pool và hạn mức tài khoản gốc" className="adm-card adm-pool-shell">
      <div className="adm-card-head">
        <div className="adm-inline-icon">
          <span className="adm-icon-badge" aria-hidden="true">
            <IconKeyRound size={18} />
          </span>
          <div>
            <h2 className="adm-card-title">API Key Pool &amp; Tài khoản gốc</h2>
            <p className="adm-card-sub">
              {keyPool?.parentAccountLabel || 'Tài khoản Gemini dùng chung'} · {keyPool?.provider || 'gemini'} ·{' '}
              <span className="font-mono">{keyPool?.model || 'gemini-3-flash-preview'}</span>
            </p>
          </div>
        </div>

        <div className="adm-banner-actions">
          <span className={`tag ${poolBadgeTone}`}>
            {activeCount}/{keys.length} khóa sẵn sàng
          </span>
          {shared?.dateKey && <span className="tag">{shared.dateKey} UTC</span>}
          <button
            type="button"
            className="icon-btn"
            aria-label="Làm mới pool"
            title="Làm mới"
            disabled={loading}
            onClick={onRetryLoad}
          >
            <IconRefreshCw size={18} />
          </button>
        </div>
      </div>

      {/* Shared parent-account bullet meters + Token ledger */}
      <div className="adm-pool-overview">
        <div className="adm-bullet-panel">
          <div className="adm-bullet-block">
            <div className="adm-bullet-head">
              <span className="adm-field-label">Hạn mức ngày (Tài khoản gốc)</span>
              <span className="adm-mono-stat">
                {formatNumber(dailyUsed)} / {formatNumber(dailyLimit)} · Còn{' '}
                <strong>{formatNumber(shared?.remaining ?? Math.max(0, dailyLimit - dailyUsed))}</strong>
              </span>
            </div>
            <div
              className="adm-bullet-track"
              role="progressbar"
              aria-label="Hạn mức ngày tài khoản gốc"
              aria-valuemin={0}
              aria-valuemax={dailyLimit}
              aria-valuenow={dailyUsed}
            >
              <div className="adm-bullet-fill" style={{ width: `${dailyPct}%` }} />
              <div
                className="adm-bullet-threshold"
                style={{ left: '85%' }}
                data-value="85%"
                aria-hidden="true"
              />
            </div>
            <div className="adm-bullet-ticks" aria-hidden="true">
              <span>0</span>
              <span>50%</span>
              <span>75%</span>
              <span>100%</span>
            </div>
          </div>

          <div className="adm-bullet-block">
            <div className="adm-bullet-head">
              <span className="adm-field-label">Lưu lượng phút (RPM)</span>
              <span className="adm-mono-stat">
                {formatNumber(rpmUsed)} / {formatNumber(rpmLimit)} RPM ({rpmPct}%)
              </span>
            </div>
            <div
              className="adm-bullet-track adm-bullet-track--compact"
              role="progressbar"
              aria-label="Lưu lượng RPM hiện tại"
              aria-valuemin={0}
              aria-valuemax={rpmLimit}
              aria-valuenow={rpmUsed}
            >
              <div className="adm-bullet-fill adm-bullet-fill--harbour" style={{ width: `${rpmPct}%` }} />
              <div
                className="adm-bullet-threshold"
                style={{ left: '80%' }}
                data-value="80%"
                aria-hidden="true"
              />
            </div>
          </div>
        </div>

        <div className="adm-token-ledger" aria-label="Tổng token tiêu thụ">
          <div className="adm-token-ledger-head">
            <span className="adm-inline-icon">
              <IconCoins size={16} aria-hidden="true" />
              <span className="adm-field-label">Tổng Token Pool</span>
            </span>
            <span className="tag">
              <IconCpu size={13} aria-hidden="true" />
              <span className="ml-1 font-mono">{formatNumber(aggTokens.total)}</span>
            </span>
          </div>

          <dl className="adm-dl-strip">
            <div className="adm-dl-cell">
              <dt>Prompt</dt>
              <dd>{formatNumber(aggTokens.prompt)}</dd>
            </div>
            <div className="adm-dl-cell">
              <dt>Completion</dt>
              <dd>{formatNumber(aggTokens.completion)}</dd>
            </div>
            <div className="adm-dl-cell">
              <dt>Tổng cộng</dt>
              <dd className="adm-dl-accent">{formatNumber(aggTokens.total)}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Key cards (CodeFronts #15 + #20 multi-shape status indicator) */}
      {keys.length === 0 ? (
        <div className="adm-empty-box">
          <p className="adm-card-title">Chưa cấu hình API Key trong Pool</p>
          <p className="adm-card-sub">
            Thiết lập biến môi trường khóa API trên máy chủ (.env) rồi bấm làm mới để kích hoạt xoay vòng.
          </p>
          <button type="button" onClick={onRetryLoad} className="btn btn-line btn-sm">
            Kiểm tra lại
          </button>
        </div>
      ) : (
        <div className="adm-pool-grid">
          {keys.map((keyItem) => {
            const statusText = KEY_STATUS_LABEL[keyItem.status] || keyItem.status;
            return (
              <article key={keyItem.id} className="adm-key-card" data-status={keyItem.status}>
                <header className="adm-key-head">
                  <div className="adm-key-identity">
                    <span className="adm-status-shape" aria-hidden="true" />
                    <div className="min-w-0">
                      <div className="adm-key-id">{keyItem.id}</div>
                      <code className="adm-key-mask">{keyItem.mask}</code>
                    </div>
                  </div>
                  <span className="adm-status-pill" data-status={keyItem.status}>
                    {statusText}
                  </span>
                </header>

                <dl className="adm-dl-strip adm-dl-strip--compact">
                  <div className="adm-dl-cell">
                    <dt>Prompt</dt>
                    <dd>{formatNumber(keyItem.tokens?.prompt)}</dd>
                  </div>
                  <div className="adm-dl-cell">
                    <dt>Completion</dt>
                    <dd>{formatNumber(keyItem.tokens?.completion)}</dd>
                  </div>
                  <div className="adm-dl-cell">
                    <dt>Tổng</dt>
                    <dd>{formatNumber(keyItem.tokens?.total)}</dd>
                  </div>
                </dl>

                <footer className="adm-key-foot">
                  <div className="adm-key-counts">
                    <span>{formatNumber(keyItem.requests)} lượt gọi</span>
                    <span>·</span>
                    <span>{formatNumber(keyItem.failovers)} chuyển dự phòng</span>
                  </div>
                  <div className="adm-key-note">
                    {keyItem.cooldownUntil
                      ? `Hồi phục: ${formatAdminDateTime(keyItem.cooldownUntil)}`
                      : keyItem.lastError
                        ? keyItem.lastError
                        : 'Sẵn sàng xoay vòng'}
                  </div>
                </footer>
              </article>
            );
          })}
        </div>
      )}

      {/* Pool Probe Controls */}
      <div className="adm-probe-box">
        <div className="adm-probe-controls">
          <div className="adm-seg" role="group" aria-label="Chế độ kiểm tra Key Pool">
            {PROBE_MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                className="adm-seg-btn"
                aria-pressed={probeMode === m.id}
                onClick={() => setProbeMode(m.id)}
              >
                {m.label}
              </button>
            ))}
          </div>

          <div className="adm-probe-input-row">
            <input
              type="text"
              value={probePrompt}
              onChange={(e) => setProbePrompt(e.target.value)}
              placeholder="Câu lệnh kiểm tra tùy chọn (mặc định: ping)"
              aria-label="Câu lệnh kiểm tra Key Pool"
              className="field font-mono"
            />
            <button
              type="button"
              disabled={probing}
              onClick={() => onRunProbe(probeMode, probePrompt.trim() || undefined)}
              className="btn btn-accent"
            >
              {probing ? 'Đang kiểm tra' : 'Kiểm tra Pool'}
            </button>
          </div>
        </div>

        {probeResult && (
          <div
            className="adm-probe-result"
            data-ok={probeResult.ok ? 'true' : 'false'}
            role="status"
            aria-live="polite"
          >
            <div className="adm-probe-result-head">
              <span className="adm-inline-icon">
                {probeResult.ok ? (
                  <IconCheckCircle2 size={16} aria-hidden="true" />
                ) : (
                  <IconXCircle size={16} aria-hidden="true" />
                )}
                <strong>
                  {probeResult.ok ? 'Kết nối Pool thành công' : 'Kiểm tra Pool thất bại'}
                </strong>
              </span>
              <div className="adm-banner-meta">
                <span className="tag font-mono">{probeResult.usedKeyMask || probeResult.keyMask}</span>
                <span className="tag font-mono">{probeResult.latencyMs} ms</span>
                {probeResult.failoverTriggered && (
                  <span className="tag adm-tag-amber">Đã chuyển dự phòng</span>
                )}
              </div>
            </div>

            <div className="adm-probe-meta-grid">
              <span>
                Chế độ: <strong className="font-mono">{probeResult.mode}</strong>
              </span>
              <span>
                Mô hình: <strong className="font-mono">{probeResult.model}</strong>
              </span>
              <span>
                Khóa thử:{' '}
                <strong className="font-mono">
                  {probeResult.attemptedKeys?.length ? probeResult.attemptedKeys.join(' → ') : probeResult.keyMask}
                </strong>
              </span>
              <span>
                Token:{' '}
                <strong className="font-mono">
                  {formatNumber(probeResult.tokens?.prompt)}P / {formatNumber(probeResult.tokens?.completion)}C /{' '}
                  {formatNumber(probeResult.tokens?.total)}T
                </strong>
              </span>
            </div>

            {(probeResult.replyPreview || probeResult.preview || probeResult.error) && (
              <p className="adm-probe-preview">
                {probeResult.ok
                  ? probeResult.replyPreview || probeResult.preview
                  : probeResult.error}
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default AdminKeyPoolPanel;
