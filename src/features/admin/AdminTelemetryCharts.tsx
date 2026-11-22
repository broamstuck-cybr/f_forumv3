import React, { useMemo, useState } from 'react';
import type { AdminState } from '../../types/index';

interface AdminTelemetryChartsProps {
  adminState: AdminState | null;
  totalUsedAcrossSubjects: number;
  projectsCount: number;
}

interface RingMetric {
  id: string;
  label: string;
  pct: number;
  valueLabel: string;
  detail: string;
  color: string;
}

interface TrendPoint {
  key: string;
  label: string;
  requests: number;
  users: number;
}

export function formatUptime(totalSeconds?: number | null): string {
  const sec = Math.max(0, Math.floor(totalSeconds ?? 0));
  if (sec < 60) return `${sec} giây`;
  const mins = Math.floor(sec / 60);
  if (mins < 60) return `${mins} phút`;
  const hours = Math.floor(mins / 60);
  const remMins = mins % 60;
  if (hours < 24) return remMins > 0 ? `${hours}g ${String(remMins).padStart(2, '0')}p` : `${hours} giờ`;
  const days = Math.floor(hours / 24);
  const remHours = hours % 24;
  return remHours > 0 ? `${days} ngày ${remHours}g` : `${days} ngày`;
}

function buildRecentDayKeys(): Array<{ key: string; label: string }> {
  const days: Array<{ key: string; label: string }> = [];
  const now = new Date();
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    days.push({ key, label: `${dd}/${mm}` });
  }
  return days;
}

export const AdminTelemetryCharts: React.FC<AdminTelemetryChartsProps> = ({
  adminState,
  totalUsedAcrossSubjects,
  projectsCount,
}) => {
  const [activeRingId, setActiveRingId] = useState<string | null>(null);
  const [hoveredDayIdx, setHoveredDayIdx] = useState<number>(6);

  const rings = useMemo<RingMetric[]>(() => {
    const telemetry = adminState?.telemetry;
    const totalReq = Math.max(0, telemetry?.totalAiRequests ?? totalUsedAcrossSubjects);
    const okReq = Math.max(0, telemetry?.successfulAiRequests ?? totalReq);
    const fallbackReq = Math.max(0, telemetry?.fallbackAiRequests ?? 0);
    const sessions = telemetry?.activeSessionsCount ?? 0;
    const users = telemetry?.registeredUsersCount ?? 0;

    const successPct = totalReq > 0 ? Math.min(100, Math.round((okReq / totalReq) * 100)) : 100;
    const stabilityPct =
      totalReq > 0
        ? Math.max(15, Math.min(100, Math.round(((totalReq - fallbackReq) / totalReq) * 100)))
        : 100;
    const activityPct =
      users > 0
        ? Math.max(18, Math.min(100, Math.round((sessions / Math.max(1, users + 2)) * 100)))
        : projectsCount > 0
          ? 36
          : 12;

    return [
      {
        id: 'success',
        label: 'Phản hồi AI chuẩn',
        pct: successPct,
        valueLabel: `${okReq}/${totalReq || 0}`,
        detail: `${successPct}% yêu cầu hoàn tất không lỗi`,
        color: 'var(--green)',
      },
      {
        id: 'stability',
        label: 'Độ ổn định Gateway',
        pct: stabilityPct,
        valueLabel: formatUptime(telemetry?.uptimeSeconds),
        detail: `${fallbackReq} lượt chuyển dự phòng`,
        color: 'var(--red)',
      },
      {
        id: 'engagement',
        label: 'Mức dùng phiên',
        pct: activityPct,
        valueLabel: `${sessions} phiên`,
        detail: `${users} tài khoản · ${projectsCount} dự án`,
        color: 'var(--harbour)',
      },
    ];
  }, [adminState?.telemetry, totalUsedAcrossSubjects, projectsCount]);

  const trendPoints = useMemo<TrendPoint[]>(() => {
    const dayBuckets = buildRecentDayKeys();
    const logs = adminState?.auditLogs ?? [];
    const usersList = adminState?.usersAndQuotas ?? [];

    const reqByDay = new Map<string, number>();
    const usrByDay = new Map<string, number>();
    for (const d of dayBuckets) {
      reqByDay.set(d.key, 0);
      usrByDay.set(d.key, 0);
    }

    for (const entry of logs) {
      const k = entry.timestamp.slice(0, 10);
      if (reqByDay.has(k)) {
        reqByDay.set(k, (reqByDay.get(k) || 0) + 1);
      }
    }
    for (const u of usersList) {
      const k = (u.updatedAt || '').slice(0, 10);
      if (usrByDay.has(k)) {
        usrByDay.set(k, (usrByDay.get(k) || 0) + Math.max(1, u.used));
      }
    }

    const totalTelemetryReq = adminState?.telemetry.totalAiRequests ?? totalUsedAcrossSubjects;
    const baseTail = dayBuckets[dayBuckets.length - 1]?.key;
    if (baseTail) {
      const existingToday = reqByDay.get(baseTail) || 0;
      reqByDay.set(baseTail, Math.max(existingToday, totalTelemetryReq));
      const existingUsrToday = usrByDay.get(baseTail) || 0;
      usrByDay.set(baseTail, Math.max(existingUsrToday, adminState?.telemetry.registeredUsersCount ?? usersList.length));
    }

    return dayBuckets.map((d) => ({
      key: d.key,
      label: d.label,
      requests: reqByDay.get(d.key) || 0,
      users: usrByDay.get(d.key) || 0,
    }));
  }, [adminState?.auditLogs, adminState?.usersAndQuotas, adminState?.telemetry, totalUsedAcrossSubjects]);

  const maxTrend = useMemo(
    () => Math.max(4, ...trendPoints.map((pt) => Math.max(pt.requests, pt.users))),
    [trendPoints]
  );

  const svgCoords = useMemo(() => {
    const w = 520;
    const h = 156;
    const padX = 28;
    const padY = 18;
    const usableW = w - padX * 2;
    const usableH = h - padY * 2;

    const mapPoint = (idx: number, val: number) => ({
      x: padX + (usableW * idx) / Math.max(1, trendPoints.length - 1),
      y: padY + usableH - (val / maxTrend) * usableH,
    });

    const reqPts = trendPoints.map((pt, idx) => mapPoint(idx, pt.requests));
    const usrPts = trendPoints.map((pt, idx) => mapPoint(idx, pt.users));

    const toPolyline = (pts: Array<{ x: number; y: number }>) =>
      pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

    const reqArea = reqPts.length
      ? `M ${reqPts[0].x.toFixed(1)} ${(h - padY).toFixed(1)} ` +
        reqPts.map((p) => `L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ') +
        ` L ${reqPts[reqPts.length - 1].x.toFixed(1)} ${(h - padY).toFixed(1)} Z`
      : '';

    return {
      reqLine: toPolyline(reqPts),
      usrLine: toPolyline(usrPts),
      reqArea,
      reqPts,
      usrPts,
      bottomY: h - padY,
    };
  }, [trendPoints, maxTrend]);

  const inspectedRing = rings.find((r) => r.id === activeRingId) || rings[0];
  const inspectedDay = trendPoints[hoveredDayIdx] || trendPoints[trendPoints.length - 1];

  return (
    <div className="adm-grid-2 adm-charts-top">
      <section aria-label="Vòng hiệu năng hệ thống" className="adm-card">
        <div className="adm-card-head">
          <div>
            <h2 className="adm-card-title">Hiệu năng &amp; Phản hồi</h2>
            <p className="adm-card-sub">
              {inspectedRing.label} · {inspectedRing.detail}
            </p>
          </div>
          <span className="tag">{inspectedRing.pct}%</span>
        </div>

        <div className="adm-rings-layout">
          <div className="adm-rings-svg-box">
            <svg viewBox="0 0 180 180" className="adm-chart-svg" role="img" aria-label="Biểu đồ vòng hiệu năng">
              {rings.map((ring, idx) => {
                const r = 76 - idx * 18;
                const circ = 2 * Math.PI * r;
                const dash = (circ * ring.pct) / 100;
                const isFocused = activeRingId === ring.id;
                return (
                  <g key={ring.id} transform="rotate(-90 90 90)">
                    <circle cx={90} cy={90} r={r} fill="none" stroke="var(--bg-sunken)" strokeWidth={10} />
                    <circle
                      cx={90}
                      cy={90}
                      r={r}
                      fill="none"
                      stroke={ring.color}
                      strokeWidth={isFocused ? 11.5 : 10}
                      strokeLinecap="round"
                      strokeDasharray={`${dash.toFixed(2)} ${circ.toFixed(2)}`}
                      opacity={activeRingId && !isFocused ? 0.36 : 1}
                      style={{ cursor: 'pointer', transition: 'stroke-width 180ms ease, opacity 180ms ease' }}
                      onMouseEnter={() => setActiveRingId(ring.id)}
                      onMouseLeave={() => setActiveRingId(null)}
                    />
                  </g>
                );
              })}
            </svg>
            <div className="adm-rings-center">
              <strong>{inspectedRing.pct}%</strong>
            </div>
          </div>

          <ul className="adm-legend">
            {rings.map((ring) => {
              const active = activeRingId === ring.id;
              return (
                <li key={ring.id}>
                  <button
                    type="button"
                    className="adm-legend-btn"
                    data-active={active}
                    onMouseEnter={() => setActiveRingId(ring.id)}
                    onMouseLeave={() => setActiveRingId(null)}
                    onFocus={() => setActiveRingId(ring.id)}
                    onBlur={() => setActiveRingId(null)}
                  >
                    <span className="adm-legend-left">
                      <span className="adm-swatch" style={{ background: ring.color }} aria-hidden="true" />
                      <span className="adm-legend-name">{ring.label}</span>
                    </span>
                    <span className="adm-legend-val">{ring.valueLabel}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <section aria-label="Xu hướng 7 ngày gần nhất" className="adm-card">
        <div className="adm-card-head">
          <div>
            <h2 className="adm-card-title">Xu hướng hoạt động 7 ngày</h2>
            <p className="adm-card-sub">
              Ngày {inspectedDay?.label}: {inspectedDay?.requests ?? 0} tác vụ AI · {inspectedDay?.users ?? 0} lượt thành viên
            </p>
          </div>
          <div className="adm-trend-legend">
            <span><i style={{ background: 'var(--red)' }} />Tác vụ</span>
            <span><i style={{ background: 'var(--green)' }} />Thành viên</span>
          </div>
        </div>

        <div className="adm-chart-box">
          <svg viewBox="0 0 520 176" className="adm-chart-svg" role="img" aria-label="Biểu đồ đường xu hướng 7 ngày">
            <defs>
              <linearGradient id="admTrendArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--red)" stopOpacity="0.28" />
                <stop offset="100%" stopColor="var(--red)" stopOpacity="0" />
              </linearGradient>
            </defs>
            {[0, 0.5, 1].map((t) => {
              const y = 18 + (156 - 36) * (1 - t);
              return (
                <line
                  key={t}
                  x1={28}
                  y1={y}
                  x2={492}
                  y2={y}
                  stroke="var(--line)"
                  strokeDasharray={t === 0 ? undefined : '4 4'}
                />
              );
            })}
            {svgCoords.reqArea && <path d={svgCoords.reqArea} fill="url(#admTrendArea)" />}
            <polyline
              fill="none"
              stroke="var(--red)"
              strokeWidth="2.5"
              strokeLinejoin="round"
              strokeLinecap="round"
              points={svgCoords.reqLine}
            />
            <polyline
              fill="none"
              stroke="var(--green)"
              strokeWidth="2.2"
              strokeDasharray="5 3"
              strokeLinejoin="round"
              strokeLinecap="round"
              points={svgCoords.usrLine}
            />
            {trendPoints.map((pt, idx) => {
              const pReq = svgCoords.reqPts[idx];
              const pUsr = svgCoords.usrPts[idx];
              const isHot = hoveredDayIdx === idx;
              return (
                <g
                  key={pt.key}
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() => setHoveredDayIdx(idx)}
                  onFocus={() => setHoveredDayIdx(idx)}
                >
                  <line
                    x1={pReq.x}
                    y1={18}
                    x2={pReq.x}
                    y2={svgCoords.bottomY}
                    stroke={isHot ? 'var(--line-strong)' : 'transparent'}
                    strokeWidth="1"
                  />
                  <circle cx={pReq.x} cy={pReq.y} r={isHot ? 5 : 3.5} fill="var(--red)" />
                  <circle cx={pUsr.x} cy={pUsr.y} r={isHot ? 4.5 : 3} fill="var(--green)" />
                  <text
                    x={pReq.x}
                    y={166}
                    textAnchor="middle"
                    fontSize="10"
                    fontFamily="var(--font-mono)"
                    fill={isHot ? 'var(--fg)' : 'var(--fg-faint)'}
                  >
                    {pt.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </section>
    </div>
  );
};

export default AdminTelemetryCharts;
