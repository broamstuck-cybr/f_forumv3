import React, { useMemo, useState } from 'react';
import type { AdminTelemetryDay, AdminUserGrowthPoint } from '../../types/index';

type ActivityMetric = 'aiRequests' | 'success' | 'fallback' | 'quotaBlocked';

const ACTIVITY_METRICS: Array<{ id: ActivityMetric; label: string; color: string }> = [
  { id: 'aiRequests', label: 'Tổng lượt', color: 'var(--fg)' },
  { id: 'success', label: 'Thành công', color: 'var(--red)' },
  { id: 'fallback', label: 'Dự phòng', color: 'var(--fg-muted)' },
  { id: 'quotaBlocked', label: 'Chạm hạn mức', color: 'var(--line-strong)' },
];

const W = 620;
const H = 220;
const PAD = { top: 18, right: 14, bottom: 26, left: 40 };

function dayLabel(date: string): string {
  const [, month, day] = date.split('-');
  return `${day}/${month}`;
}

function niceMax(value: number): number {
  if (value <= 4) return 4;
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
  const step = magnitude / 2;
  return Math.ceil(value / step) * step;
}

function buildPath(points: Array<{ x: number; y: number }>): string {
  if (!points.length) return '';
  if (points.length === 1) return `M${points[0].x} ${points[0].y}`;
  let d = `M${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i += 1) {
    const prev = points[i - 1];
    const curr = points[i];
    const midX = (prev.x + curr.x) / 2;
    d += ` C${midX} ${prev.y} ${midX} ${curr.y} ${curr.x} ${curr.y}`;
  }
  return d;
}

export interface AdminChartsProps {
  history: AdminTelemetryDay[];
  growth: AdminUserGrowthPoint[];
  uptimeSeconds: number;
  storageNote?: string;
}

/**
 * Ba biểu đồ của bảng điều khiển, tất cả đọc từ dữ liệu server thật:
 * hoạt động theo ngày, tăng trưởng tài khoản, và mức dùng tài nguyên theo ngày.
 * Chuỗi ngày rỗng sẽ hiện đúng là "chưa có số liệu" thay vì một đường cong bịa.
 */
export const AdminCharts: React.FC<AdminChartsProps> = ({ history, growth, uptimeSeconds, storageNote }) => {
  const [metric, setMetric] = useState<ActivityMetric>('aiRequests');
  const [hovered, setHovered] = useState<number | null>(null);

  const plotted = useMemo(() => {
    /* Luôn vẽ 14 ngày gần nhất, kể cả ngày trống, để trục thời gian không co giãn. */
    const days: AdminTelemetryDay[] = [];
    const byDate = new Map(history.map((day) => [day.date, day]));
    for (let i = 13; i >= 0; i -= 1) {
      const d = new Date();
      d.setUTCDate(d.getUTCDate() - i);
      const key = d.toISOString().slice(0, 10);
      days.push(byDate.get(key) ?? { date: key, aiRequests: 0, success: 0, fallback: 0, quotaBlocked: 0, newUsers: 0 });
    }
    return days;
  }, [history]);

  const seriesMax = niceMax(Math.max(1, ...plotted.map((day) => day[metric])));
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const xOf = (index: number) =>
    PAD.left + (plotted.length <= 1 ? innerW / 2 : (index / (plotted.length - 1)) * innerW);
  const yOf = (value: number) => PAD.top + innerH - (value / seriesMax) * innerH;

  const linePoints = plotted.map((day, index) => ({ x: xOf(index), y: yOf(day[metric]) }));
  const linePath = buildPath(linePoints);
  const areaPath = linePath
    ? `${linePath} L${xOf(plotted.length - 1)} ${PAD.top + innerH} L${xOf(0)} ${PAD.top + innerH} Z`
    : '';

  const growthMax = niceMax(Math.max(1, ...growth.map((point) => point.totalUsers)));
  const growthPath = buildPath(
    growth.map((point, index) => ({
      x: PAD.left + (growth.length <= 1 ? innerW / 2 : (index / (growth.length - 1)) * innerW),
      y: PAD.top + innerH - (point.totalUsers / growthMax) * innerH,
    }))
  );

  const totalRequests = history.reduce((sum, day) => sum + day.aiRequests, 0);
  const totalFallback = history.reduce((sum, day) => sum + day.fallback, 0);
  const fallbackPct = totalRequests ? Math.round((totalFallback / totalRequests) * 100) : 0;
  const uptimeHours = Math.floor(uptimeSeconds / 3600);
  const uptimeMinutes = Math.floor((uptimeSeconds % 3600) / 60);
  const activeMetric = ACTIVITY_METRICS.find((entry) => entry.id === metric) ?? ACTIVITY_METRICS[0];
  const hoveredDay = hovered !== null ? plotted[hovered] : null;

  return (
    <div className="adm-charts">
      <section className="adm-card adm-chart-card" aria-label="Hoạt động máy chủ theo ngày">
        <div className="adm-card-head">
          <div>
            <h2 className="adm-card-title">Hoạt động máy chủ</h2>
            <p className="adm-card-sub">
              {history.length
                ? `${totalRequests} lượt AI trong ${history.length} ngày gần nhất · ${fallbackPct}% phải dùng đường dự phòng.`
                : 'Chưa có lượt AI nào được ghi nhận. Biểu đồ sẽ tự đầy khi hệ thống có lưu lượng.'}
            </p>
          </div>
          <div className="adm-seg" role="group" aria-label="Chọn chỉ số hoạt động">
            {ACTIVITY_METRICS.map((entry) => (
              <button
                key={entry.id}
                type="button"
                className="adm-seg-btn"
                aria-pressed={metric === entry.id}
                onClick={() => setMetric(entry.id)}
              >
                {entry.label}
              </button>
            ))}
          </div>
        </div>

        <div className="adm-chart-box">
          <svg viewBox={`0 0 ${W} ${H}`} className="adm-chart-svg" role="img" aria-label={`Biểu đồ ${activeMetric.label} theo ngày`}>
            <title>{activeMetric.label} theo ngày</title>
            <desc>Đường biểu diễn số lượt AI mỗi ngày, đọc từ bộ đếm thật của máy chủ.</desc>
            <defs>
              <linearGradient id="adm-activity-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={activeMetric.color} stopOpacity="0.26" />
                <stop offset="100%" stopColor={activeMetric.color} stopOpacity="0" />
              </linearGradient>
            </defs>
            {[0, 0.25, 0.5, 0.75, 1].map((tick) => {
              const y = PAD.top + innerH - tick * innerH;
              return (
                <g key={tick}>
                  <line
                    x1={PAD.left}
                    y1={y}
                    x2={W - PAD.right}
                    y2={y}
                    stroke="var(--line)"
                    strokeDasharray={tick === 0 ? undefined : '4 5'}
                  />
                  <text x={PAD.left - 8} y={y + 3.5} textAnchor="end" fontSize="9.5" fontFamily="var(--font-mono)" fill="var(--fg-faint)">
                    {Math.round(seriesMax * tick)}
                  </text>
                </g>
              );
            })}
            {areaPath ? <path d={areaPath} fill="url(#adm-activity-fill)" /> : null}
            {linePath ? <path d={linePath} fill="none" stroke={activeMetric.color} strokeWidth="2" strokeLinecap="round" /> : null}
            {plotted.map((day, index) => (
              <g key={day.date}>
                <circle
                  cx={xOf(index)}
                  cy={yOf(day[metric])}
                  r={hovered === index ? 4.5 : 2.6}
                  fill="var(--bg-raised)"
                  stroke={activeMetric.color}
                  strokeWidth="2"
                  style={{ transition: 'r 120ms ease' }}
                />
                <rect
                  x={xOf(index) - innerW / plotted.length / 2}
                  y={PAD.top}
                  width={innerW / plotted.length}
                  height={innerH}
                  fill="transparent"
                  tabIndex={0}
                  role="button"
                  aria-label={`${dayLabel(day.date)}: ${day[metric]} lượt`}
                  onMouseEnter={() => setHovered(index)}
                  onMouseLeave={() => setHovered(null)}
                  onFocus={() => setHovered(index)}
                  onBlur={() => setHovered(null)}
                />
              </g>
            ))}
            {[0, Math.floor(plotted.length / 2), plotted.length - 1].map((index) => (
              <text
                key={index}
                x={xOf(index)}
                y={H - 8}
                textAnchor={index === 0 ? 'start' : index === plotted.length - 1 ? 'end' : 'middle'}
                fontSize="9.5"
                fontFamily="var(--font-mono)"
                fill="var(--fg-faint)"
              >
                {dayLabel(plotted[index].date)}
              </text>
            ))}
          </svg>
          {hoveredDay ? (
            <div className="adm-chart-tip">
              <strong>{dayLabel(hoveredDay.date)}</strong>
              <span>{hoveredDay[metric]} lượt · {hoveredDay.success} thành công</span>
            </div>
          ) : null}
        </div>
      </section>

      <div className="adm-chart-pair">
        <section className="adm-card adm-chart-card" aria-label="Tăng trưởng tài khoản">
          <div className="adm-card-head">
            <div>
              <h2 className="adm-card-title">Tài khoản theo ngày</h2>
              <p className="adm-card-sub">
                {growth.length ? 'Cộng dồn từ ngày tạo tài khoản thật.' : 'Chưa có tài khoản nào được tạo.'}
              </p>
            </div>
          </div>
          <div className="adm-chart-box adm-chart-box--short">
            <svg viewBox={`0 0 ${W} ${H}`} className="adm-chart-svg" role="img" aria-label="Tăng trưởng tổng số tài khoản">
              <title>Tăng trưởng tài khoản</title>
              <desc>Đường cộng dồn số tài khoản, tính từ thời điểm tạo của từng tài khoản.</desc>
              {[0, 0.5, 1].map((tick) => {
                const y = PAD.top + innerH - tick * innerH;
                return (
                  <g key={tick}>
                    <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y} stroke="var(--line)" strokeDasharray={tick === 0 ? undefined : '4 5'} />
                    <text x={PAD.left - 8} y={y + 3.5} textAnchor="end" fontSize="9.5" fontFamily="var(--font-mono)" fill="var(--fg-faint)">
                      {Math.round(growthMax * tick)}
                    </text>
                  </g>
                );
              })}
              {growthPath ? <path d={growthPath} fill="none" stroke="var(--red)" strokeWidth="2" strokeLinecap="round" /> : null}
              {growth.length ? (
                <text
                  x={W - PAD.right}
                  y={PAD.top + 12}
                  textAnchor="end"
                  fontSize="11"
                  fontFamily="var(--font-mono)"
                  fill="var(--fg)"
                >
                  {growth[growth.length - 1].totalUsers} tài khoản
                </text>
              ) : null}
            </svg>
          </div>
        </section>

        <section className="adm-card adm-chart-card" aria-label="Mức dùng tài nguyên">
          <div className="adm-card-head">
            <div>
              <h2 className="adm-card-title">Tài nguyên &amp; vận hành</h2>
              <p className="adm-card-sub">Thời gian chạy liên tục và tỷ lệ phải dùng đường dự phòng.</p>
            </div>
          </div>
          <dl className="adm-resource-list">
            <div>
              <dt>Phiên máy chủ</dt>
              <dd>
                {uptimeHours > 0 ? `${uptimeHours} giờ ${uptimeMinutes} phút` : `${uptimeMinutes} phút`}
              </dd>
            </div>
            <div>
              <dt>Đường dự phòng</dt>
              <dd>{fallbackPct}%</dd>
            </div>
            <div>
              <dt>Ngày có lưu lượng</dt>
              <dd>
                {history.filter((day) => day.aiRequests > 0).length}/{history.length || 0}
              </dd>
            </div>
            <div>
              <dt>Lưu trữ</dt>
              <dd>{storageNote ?? 'Bộ nhớ máy chủ'}</dd>
            </div>
          </dl>
          <div className="adm-resource-bar" aria-hidden="true">
            <span style={{ width: `${totalRequests ? 100 - fallbackPct : 0}%` }} />
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminCharts;
