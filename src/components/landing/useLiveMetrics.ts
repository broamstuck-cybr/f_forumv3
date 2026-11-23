import { useEffect, useRef, useState } from 'react';
import {
  fetchSiteMetrics,
  recordSiteVisit,
  sendSiteHeartbeat,
} from '../../services/apiClient';

export const BASELINE_VISITORS = 195;
export const BASELINE_ACTIVE_SECONDS = 91 * 3600;

const VISITOR_ID_KEY = 'fforum_v3_metrics_visitor_id';
const SESSION_ID_KEY = 'fforum_v3_metrics_session_id';
const HEARTBEAT_FLUSH_SECONDS = 15;

function createStableId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
}

function getOrCreateVisitorId(): string {
  if (typeof window === 'undefined') return 'ssr-visitor';
  try {
    const existing = window.localStorage.getItem(VISITOR_ID_KEY);
    if (existing && existing.length >= 8) return existing;
    const next = createStableId('vis');
    window.localStorage.setItem(VISITOR_ID_KEY, next);
    return next;
  } catch {
    return createStableId('vis');
  }
}

function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return 'ssr-session';
  try {
    const existing = window.sessionStorage.getItem(SESSION_ID_KEY);
    if (existing && existing.length >= 8) return existing;
    const next = createStableId('ses');
    window.sessionStorage.setItem(SESSION_ID_KEY, next);
    return next;
  } catch {
    return createStableId('ses');
  }
}

export function formatActiveDurationVi(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${hours.toLocaleString('vi-VN')} giờ ${pad(minutes)} phút ${pad(seconds)} giây`;
}

export interface LiveSiteMetricsState {
  visitors: number;
  activeSeconds: number;
  synced: boolean;
}

export function useLiveMetrics(): LiveSiteMetricsState {
  const [visitors, setVisitors] = useState<number>(BASELINE_VISITORS);
  const [activeSeconds, setActiveSeconds] = useState<number>(BASELINE_ACTIVE_SECONDS);
  const [synced, setSynced] = useState<boolean>(false);

  const pendingDeltaRef = useRef<number>(0);
  const flushingRef = useRef<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    let cancelled = false;
    const visitorId = getOrCreateVisitorId();
    const sessionId = getOrCreateSessionId();

    const applyServerMetrics = (nextVisitors: number, nextActiveSeconds: number) => {
      if (cancelled) return;
      if (Number.isFinite(nextVisitors)) {
        setVisitors((prev) => Math.max(BASELINE_VISITORS, prev, Math.floor(nextVisitors)));
      }
      if (Number.isFinite(nextActiveSeconds)) {
        setActiveSeconds((prev) =>
          Math.max(BASELINE_ACTIVE_SECONDS, prev, Math.floor(nextActiveSeconds))
        );
      }
      setSynced(true);
    };

    void fetchSiteMetrics()
      .then((snapshot) => {
        applyServerMetrics(snapshot.visitors, snapshot.activeSeconds);
      })
      .catch(() => undefined);

    void recordSiteVisit(visitorId)
      .then((res) => {
        applyServerMetrics(res.visitors, res.activeSeconds);
      })
      .catch(() => undefined);

    const flushHeartbeat = (useKeepalive = false) => {
      const delta = Math.min(60, Math.floor(pendingDeltaRef.current));
      if (delta < 1) return;
      if (flushingRef.current && !useKeepalive) return;

      pendingDeltaRef.current -= delta;

      if (useKeepalive) {
        try {
          void fetch('/api/metrics/heartbeat', {
            method: 'POST',
            credentials: 'include',
            keepalive: true,
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ sessionId, deltaSeconds: delta }),
          });
        } catch {
          return;
        }
        return;
      }

      flushingRef.current = true;
      void sendSiteHeartbeat(sessionId, delta)
        .then((res) => {
          if (res.ok) {
            applyServerMetrics(res.visitors, res.activeSeconds);
          }
        })
        .catch(() => {
          pendingDeltaRef.current = Math.min(60, pendingDeltaRef.current + delta);
        })
        .finally(() => {
          flushingRef.current = false;
        });
    };

    const tickId = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      pendingDeltaRef.current += 1;
      setActiveSeconds((prev) => prev + 1);
      if (pendingDeltaRef.current >= HEARTBEAT_FLUSH_SECONDS) {
        flushHeartbeat(false);
      }
    }, 1000);

    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        flushHeartbeat(true);
      }
    };

    const onPageHide = () => {
      flushHeartbeat(true);
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('pagehide', onPageHide);

    return () => {
      cancelled = true;
      window.clearInterval(tickId);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('pagehide', onPageHide);
      flushHeartbeat(true);
    };
  }, []);

  return { visitors, activeSeconds, synced };
}
