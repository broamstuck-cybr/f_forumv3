import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  AdminDedicatedGatewayPreset,
  AdminKeyPoolTestResult,
  AIProtocol,
  ModerationReportStatus,
} from '../../types/index';
import {
  IconAlertTriangle,
  IconCpu,
  IconEye,
  IconEyeOff,
  IconLock,
  IconRefreshCw,
} from '../../ui/icons';
import { requestJson } from '../../services/apiClient';
import { adminApi, extractAdminError } from './adminApi';
import { useAppStore } from '../../store/appStore';
import { LampSwitch, LiquidTabs, SelectionList, SlingSlider } from '../../components/pinui';
import { AdminTelemetryCharts, formatUptime } from './AdminTelemetryCharts';
import { AdminCodeFrontsStats } from './AdminCodeFrontsStats';
import { AdminKeyPoolPanel } from './AdminKeyPoolPanel';
import { AdminQuotasPanel } from './AdminQuotasPanel';
import { AdminSecurityLogsPanel } from './AdminSecurityLogsPanel';
import type {
  AdminKeyPoolMode,
  AdminPoolProbeOutcome,
  AdminQuotaSubjectKind,
  AdminSecurityEventView,
  AdminStateView,
  AdminUserQuotaView,
} from './adminTypes';
import {
  classifyQuotaSubject,
  formatAdminDateTime,
  normalizeSecurityEvent,
} from './adminTypes';
import './admin.css';

type AdminTab = 'analytics' | 'users' | 'system' | 'logs';
type BarMode = 'accounts' | 'daily';
type DonutMode = 'roles' | 'gateway';

interface BarDatum {
  id: string;
  label: string;
  shortLabel: string;
  value: number;
  limit: number | null;
  unlimited: boolean;
  meta: string;
}

interface DonutSlice {
  id: string;
  label: string;
  value: number;
  color: string;
  detail: string;
}

const PROTOCOL_ITEMS = [
  { id: 'openai-compatible', label: 'OpenAI Compatible', swatch: 'var(--accent)' },
  { id: 'anthropic', label: 'Anthropic Messages', swatch: 'var(--amber)' },
  { id: 'gemini', label: 'Google Gemini', swatch: 'var(--harbour)' },
];

const OPENROUTER_MODEL_PRESETS = [
  { id: 'openrouter/auto-smart', label: 'Tự động tiết kiệm (Hỏi đáp + Lắp ghép)', swatch: 'var(--accent)' },
  { id: 'google/gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash Lite ($0.10/$0.40)', swatch: 'var(--green)' },
  { id: 'deepseek/deepseek-v3.2', label: 'DeepSeek V3.2 ($0.26/$0.38)', swatch: 'var(--harbour)' },
  { id: 'qwen/qwen3-coder-next', label: 'Qwen3 Coder Next ($0.12/$0.80)', swatch: 'var(--amber)' },
  { id: 'nvidia/nemotron-3-ultra-550b-a55b:free', label: 'Nemotron 3 Ultra (Miễn phí)', swatch: 'var(--fg-muted)' },
  { id: 'openrouter/free', label: 'OpenRouter Free (Miễn phí)', swatch: 'var(--fg)' },
];

const GEMINI_MODEL_PRESETS = [
  { id: 'gemini-3-flash-preview', label: 'Gemini 3 Flash Preview', swatch: 'var(--accent)' },
  { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', swatch: 'var(--green)' },
  { id: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash Lite', swatch: 'var(--harbour)' },
  { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro', swatch: 'var(--amber)' },
];

const ADMIN_OPENROUTER_PRESETS = [
  { id: 'deepseek/deepseek-v3.2', label: 'DeepSeek V3.2 (Code & thiết kế)', swatch: 'var(--accent)' },
  { id: 'qwen/qwen3-coder-next', label: 'Qwen3 Coder Next', swatch: 'var(--harbour)' },
  { id: 'google/gemini-2.5-pro', label: 'Gemini 2.5 Pro', swatch: 'var(--green)' },
  { id: 'anthropic/claude-sonnet-4', label: 'Claude Sonnet 4', swatch: 'var(--amber)' },
  { id: 'openrouter/auto-smart', label: 'Tự động chọn model', swatch: 'var(--fg-muted)' },
];

function formatShortDay(isoDate: string): string {
  const parts = isoDate.split('-');
  if (parts.length !== 3) return isoDate;
  return `${parts[2]}/${parts[1]}`;
}

function clampInt(val: number, min: number, max: number, fallback: number): number {
  if (!Number.isFinite(val)) return fallback;
  return Math.min(max, Math.max(min, Math.round(val)));
}

export const AdminView: React.FC = () => {
  const { currentUser, refreshAuthAndQuota, logout, navigate, addToast, projects, theme } =
    useAppStore();
  const isAdmin = currentUser?.role === 'admin';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showAuthPassword, setShowAuthPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [lockoutUntilMs, setLockoutUntilMs] = useState<number>(0);
  const [lockoutRemainingSec, setLockoutRemainingSec] = useState<number>(0);

  const [adminState, setAdminState] = useState<AdminStateView | null>(null);
  const [securityEvents, setSecurityEvents] = useState<AdminSecurityEventView[]>([]);
  const [loadingState, setLoadingState] = useState(false);
  const [stateError, setStateError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AdminTab>('analytics');

  const [probingPool, setProbingPool] = useState(false);
  const [probeResult, setProbeResult] = useState<AdminPoolProbeOutcome | null>(null);
  const [busySubjectId, setBusySubjectId] = useState<string | null>(null);
  const [refreshingEvents, setRefreshingEvents] = useState(false);

  const [barMode, setBarMode] = useState<BarMode>('accounts');
  const [selectedBarId, setSelectedBarId] = useState<string | null>(null);
  const [hoveredBarId, setHoveredBarId] = useState<string | null>(null);
  const activeBarId = hoveredBarId ?? selectedBarId;

  const [donutMode, setDonutMode] = useState<DonutMode>('roles');
  const [selectedSliceId, setSelectedSliceId] = useState<string | null>(null);
  const [hoveredSliceId, setHoveredSliceId] = useState<string | null>(null);
  const activeSliceId = hoveredSliceId ?? selectedSliceId;

  const [sliderSyncVersion, setSliderSyncVersion] = useState(0);

  const [gwEnabled, setGwEnabled] = useState(false);
  const [gwProtocol, setGwProtocol] = useState<AIProtocol>('gemini');
  const [gwBaseUrl, setGwBaseUrl] = useState('');
  const [gwModel, setGwModel] = useState('gemini-3-flash-preview');
  const [gwApiKey, setGwApiKey] = useState('');
  const [showGwApiKey, setShowGwApiKey] = useState(false);
  const [gwSystemPromptSuffix, setGwSystemPromptSuffix] = useState('');
  const [gwDailyUserLimit, setGwDailyUserLimit] = useState(15);
  const [gwDailyIpLimit, setGwDailyIpLimit] = useState(45);
  const [gwMaxOutputTokens, setGwMaxOutputTokens] = useState(3200);
  const [gwGuestSandbox, setGwGuestSandbox] = useState(true);
  const [gwSaving, setGwSaving] = useState(false);
  const [gwTesting, setGwTesting] = useState(false);
  const [gwProbeNote, setGwProbeNote] = useState<{ ok: boolean; text: string } | null>(null);

  const [adminGwEnabled, setAdminGwEnabled] = useState(false);
  const [adminGwPreset, setAdminGwPreset] = useState<AdminDedicatedGatewayPreset>('openrouter');
  const [adminGwProtocol, setAdminGwProtocol] = useState<AIProtocol>('openai-compatible');
  const [adminGwBaseUrl, setAdminGwBaseUrl] = useState('https://openrouter.ai/api/v1');
  const [adminGwModel, setAdminGwModel] = useState('deepseek/deepseek-v3.2');
  const [adminGwMaxTokens, setAdminGwMaxTokens] = useState(8192);
  const [adminGwApiKey, setAdminGwApiKey] = useState('');
  const [showAdminGwApiKey, setShowAdminGwApiKey] = useState(false);
  const [adminGwReuseOrKey, setAdminGwReuseOrKey] = useState(true);
  const [adminGwSaving, setAdminGwSaving] = useState(false);
  const [adminGwTesting, setAdminGwTesting] = useState(false);
  const [adminGwProbeNote, setAdminGwProbeNote] = useState<{ ok: boolean; text: string } | null>(null);

  const [clVersion, setClVersion] = useState('3.0.1');
  const [clTitle, setClTitle] = useState('');
  const [clNotes, setClNotes] = useState('');
  const [clSaving, setClSaving] = useState(false);

  const syncGatewayForm = useCallback((state: AdminStateView) => {
    setGwEnabled(state.gateway.enabled);
    setGwProtocol(state.gateway.protocol);
    setGwBaseUrl(state.gateway.baseUrl);
    setGwModel(state.gateway.model);
    setGwSystemPromptSuffix(state.gateway.systemPromptSuffix ?? '');
    setGwDailyUserLimit(state.gateway.dailyUserLimit ?? state.gateway.standardTurnLimit ?? 15);
    setGwDailyIpLimit(state.gateway.dailyIpLimit ?? 45);
    setGwMaxOutputTokens(state.gateway.maxOutputTokens ?? 3200);
    setGwGuestSandbox(state.gateway.guestSandboxEnabled ?? true);
    setGwApiKey('');
    const ag = state.gateway.adminGateway;
    if (ag) {
      setAdminGwEnabled(Boolean(ag.enabled));
      setAdminGwPreset(ag.preset === 'custom' ? 'custom' : 'openrouter');
      setAdminGwProtocol(ag.protocol || 'openai-compatible');
      setAdminGwBaseUrl(ag.baseUrl || (ag.preset === 'custom' ? '' : 'https://openrouter.ai/api/v1'));
      setAdminGwModel(ag.model || (ag.preset === 'custom' ? '' : 'deepseek/deepseek-v3.2'));
      setAdminGwMaxTokens(ag.maxOutputTokens ?? 8192);
      setAdminGwReuseOrKey(ag.reuseOpenRouterKey !== false);
    }
    setAdminGwApiKey('');
    setSecurityEvents((state.securityEvents || []).map(normalizeSecurityEvent));
  }, []);

  const handleAdminApiFailure = useCallback(
    (err: unknown, title: string): string => {
      const parsed = extractAdminError(err);
      if (parsed.status === 401 || parsed.status === 403) {
        setAdminState(null);
        setSecurityEvents([]);
        setProbeResult(null);
        setStateError(parsed.message);
        void refreshAuthAndQuota();
      }
      addToast({
        type: 'error',
        title,
        message: parsed.message,
      });
      return parsed.message;
    },
    [addToast, refreshAuthAndQuota]
  );

  const isAdminRef = useRef(isAdmin);
  isAdminRef.current = isAdmin;
  const adminLoadSeqRef = useRef(0);

  const loadAdminState = useCallback(async () => {
    const reqId = ++adminLoadSeqRef.current;
    setLoadingState(true);
    setStateError(null);
    try {
      const res = await adminApi.fetchAdminState();
      if (reqId !== adminLoadSeqRef.current || !isAdminRef.current) return;
      setAdminState(res.state);
      syncGatewayForm(res.state);
    } catch (err) {
      if (reqId !== adminLoadSeqRef.current || !isAdminRef.current) return;
      const msg = handleAdminApiFailure(err, 'Không thể tải dữ liệu Admin');
      setStateError(msg);
    } finally {
      if (reqId === adminLoadSeqRef.current) {
        setLoadingState(false);
      }
    }
  }, [syncGatewayForm, handleAdminApiFailure]);

  useEffect(() => {
    document.title = 'Quản trị — F-Forum';
    const robots = document.querySelector('meta[name="robots"]');
    if (robots) robots.setAttribute('content', 'noindex, nofollow');
  }, []);

  useEffect(() => {
    if (isAdmin) {
      void loadAdminState();
    } else {
      adminLoadSeqRef.current += 1;
      setAdminState(null);
      setSecurityEvents([]);
      setProbeResult(null);
      setStateError(null);
    }
  }, [isAdmin, loadAdminState]);

  useEffect(() => {
    if (!lockoutUntilMs) {
      setLockoutRemainingSec(0);
      return undefined;
    }
    let timerId = 0;
    const tick = () => {
      const rem = Math.max(0, Math.ceil((lockoutUntilMs - Date.now()) / 1000));
      setLockoutRemainingSec(rem);
      if (rem === 0) {
        setLockoutUntilMs(0);
        return;
      }
      timerId = window.setTimeout(tick, 1000);
    };
    tick();
    return () => {
      if (timerId) window.clearTimeout(timerId);
    };
  }, [lockoutUntilMs]);

  const handleAdminSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutRemainingSec > 0) return;
    setAuthError(null);
    setAuthLoading(true);
    try {
      await adminApi.loginAdmin({ username, password });
      await refreshAuthAndQuota();
      setLockoutUntilMs(0);
      setLockoutRemainingSec(0);
      addToast({
        type: 'success',
        title: 'Đã xác thực Quản trị viên',
        message: 'Phiên điều hành Admin đã sẵn sàng.',
      });
      setPassword('');
    } catch (err) {
      const parsed = extractAdminError(err);
      if (parsed.status === 429) {
        const waitSec = parsed.retryAfterSec ?? 60;
        setLockoutUntilMs(Date.now() + waitSec * 1000);
        setLockoutRemainingSec(waitSec);
      }
      setAuthError(parsed.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleAdminLogout = async () => {
    setAdminState(null);
    setStateError(null);
    setProbeResult(null);
    setSecurityEvents([]);
    setGwApiKey('');
    setAdminGwApiKey('');
    setAdminGwProbeNote(null);
    setClTitle('');
    setClNotes('');
    try {
      await logout();
    } catch (err) {
      const parsed = extractAdminError(err);
      addToast({
        type: 'error',
        title: 'Lỗi đăng xuất',
        message: parsed.message,
      });
      await refreshAuthAndQuota();
    }
  };

  const handleRunKeyPoolProbe = async (mode: AdminKeyPoolMode, prompt?: string) => {
    setProbingPool(true);
    try {
      const outcome = await adminApi.testAdminKeyPool({ mode, prompt });
      setProbeResult(outcome);
      if (outcome.state) {
        setAdminState(outcome.state);
        syncGatewayForm(outcome.state);
      }
      addToast({
        type: outcome.ok ? 'success' : 'warning',
        title: outcome.ok ? 'Kiểm tra Pool thành công' : 'Kiểm tra Pool ghi nhận lỗi',
        message: outcome.ok
          ? `${outcome.usedKeyMask || outcome.keyMask} · ${outcome.tokens.total} token (${outcome.latencyMs}ms)`
          : outcome.error,
      });
    } catch (err) {
      handleAdminApiFailure(err, 'Kiểm tra Key Pool thất bại');
    } finally {
      setProbingPool(false);
    }
  };

  const handleRefreshSecurityEvents = async () => {
    setRefreshingEvents(true);
    try {
      const res = await adminApi.fetchAdminSecurityEvents(100);
      setSecurityEvents(res.events);
    } catch (err) {
      handleAdminApiFailure(err, 'Không thể làm mới nhật ký bảo mật');
    } finally {
      setRefreshingEvents(false);
    }
  };

  const handleSaveGateway = async (e: React.FormEvent) => {
    e.preventDefault();
    setGwSaving(true);
    const safeUserLimit = clampInt(gwDailyUserLimit, 1, 500, 15);
    const safeIpLimit = clampInt(gwDailyIpLimit, 1, 2000, 45);
    const safeMaxOut = clampInt(gwMaxOutputTokens, 512, 8192, 3200);
    try {
      const res = await adminApi.updateAdminGateway({
        enabled: gwEnabled,
        protocol: gwProtocol,
        baseUrl: gwBaseUrl,
        model: gwModel,
        apiKey: gwApiKey.trim() || undefined,
        maxOutputTokens: safeMaxOut,
        systemPromptSuffix: gwSystemPromptSuffix,
        standardTurnLimit: safeUserLimit,
        dailyUserLimit: safeUserLimit,
        dailyIpLimit: safeIpLimit,
        guestSandboxEnabled: gwGuestSandbox,
      });
      setAdminState(res.state);
      syncGatewayForm(res.state);
      void refreshAuthAndQuota();
      addToast({
        type: 'success',
        title: 'Đã lưu cấu hình Gateway',
      });
    } catch (err) {
      handleAdminApiFailure(err, 'Lỗi cập nhật Gateway');
    } finally {
      setGwSaving(false);
    }
  };

  const handleSwitchGatewayProfile = async (profile: 'openrouter' | 'gemini') => {
    setGwSaving(true);
    setGwProbeNote(null);
    try {
      const res = await adminApi.updateAdminGateway({ switchProfile: profile });
      setAdminState(res.state);
      syncGatewayForm(res.state);
      void refreshAuthAndQuota();
      addToast({
        type: 'success',
        title: profile === 'openrouter' ? 'Đã chuyển sang OpenRouter' : 'Đã chuyển sang Google Gemini',
        message: 'Khóa đã lưu của cấu hình này đã được nạp tự động.',
      });
    } catch (err) {
      handleAdminApiFailure(err, 'Không chuyển được cấu hình API');
    } finally {
      setGwSaving(false);
    }
  };

  const handleTestActiveGateway = async () => {
    setGwTesting(true);
    setGwProbeNote(null);
    try {
      const outcome = await adminApi.testAdminKeyPool({ mode: 'gateway' });
      if (outcome.state) {
        setAdminState(outcome.state);
      }
      const noteText = outcome.ok
        ? `Kết nối ổn (${outcome.model} · ${outcome.usedKeyMask || outcome.keyMask} · ${outcome.tokens.total} token · ${outcome.latencyMs}ms)`
        : outcome.error || 'Không kết nối được Gateway';
      setGwProbeNote({ ok: outcome.ok, text: noteText });
      addToast({
        type: outcome.ok ? 'success' : 'warning',
        title: outcome.ok ? 'API Gateway hoạt động' : 'API Gateway gặp lỗi',
        message: noteText,
      });
    } catch (err) {
      const msg = handleAdminApiFailure(err, 'Kiểm tra Gateway thất bại');
      setGwProbeNote({ ok: false, text: msg });
    } finally {
      setGwTesting(false);
    }
  };

  const handleClearGatewayApiKey = async () => {
    setGwSaving(true);
    try {
      const res = await adminApi.updateAdminGateway({ clearApiKey: true });
      setAdminState(res.state);
      syncGatewayForm(res.state);
      void refreshAuthAndQuota();
      addToast({
        type: 'success',
        title: 'Đã xóa khóa ghi đè',
      });
    } catch (err) {
      handleAdminApiFailure(err, 'Không thể xóa khóa ghi đè');
    } finally {
      setGwSaving(false);
    }
  };

  const handleSelectAdminPreset = (preset: AdminDedicatedGatewayPreset) => {
    setAdminGwPreset(preset);
    setAdminGwProbeNote(null);
    if (preset === 'openrouter') {
      setAdminGwProtocol('openai-compatible');
      if (!adminGwBaseUrl.trim() || !adminGwBaseUrl.toLowerCase().includes('openrouter.ai')) {
        setAdminGwBaseUrl('https://openrouter.ai/api/v1');
      }
      if (!adminGwModel.trim() || !ADMIN_OPENROUTER_PRESETS.some((m) => m.id === adminGwModel)) {
        setAdminGwModel('deepseek/deepseek-v3.2');
      }
    } else {
      if (adminGwBaseUrl.trim() === 'https://openrouter.ai/api/v1') {
        setAdminGwBaseUrl('');
      }
      if (ADMIN_OPENROUTER_PRESETS.some((m) => m.id === adminGwModel)) {
        setAdminGwModel('');
      }
    }
  };

  const buildAdminGatewayPayload = (requireConfigured = false) => {
    const safeMaxOut = clampInt(adminGwMaxTokens, 1024, 32768, 8192);
    const cleanUrl =
      adminGwPreset === 'openrouter' && !adminGwBaseUrl.trim()
        ? 'https://openrouter.ai/api/v1'
        : adminGwBaseUrl.trim();
    const cleanModel =
      adminGwPreset === 'openrouter' && !adminGwModel.trim()
        ? 'deepseek/deepseek-v3.2'
        : adminGwModel.trim();
    if ((adminGwEnabled || requireConfigured) && adminGwPreset === 'custom' && (!cleanUrl || !cleanModel)) {
      return null;
    }
    return {
      enabled: adminGwEnabled,
      preset: adminGwPreset,
      protocol: adminGwPreset === 'openrouter' ? ('openai-compatible' as AIProtocol) : adminGwProtocol,
      baseUrl: cleanUrl,
      model: cleanModel,
      chatModel: cleanModel || undefined,
      buildModel: cleanModel || undefined,
      maxOutputTokens: safeMaxOut,
      reuseOpenRouterKey: adminGwReuseOrKey,
      ...(adminGwApiKey.trim() ? { apiKey: adminGwApiKey.trim() } : {}),
    };
  };

  const handleSaveAdminGateway = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = buildAdminGatewayPayload(false);
    if (!payload) {
      const msg = 'Vui lòng nhập đường dẫn HTTPS và mã mô hình cho cổng riêng.';
      setAdminGwProbeNote({ ok: false, text: msg });
      addToast({ type: 'warning', title: 'Thiếu thông tin cổng riêng', message: msg });
      return;
    }
    setAdminGwSaving(true);
    try {
      const res = await adminApi.updateAdminGateway({ adminGateway: payload });
      setAdminState(res.state);
      syncGatewayForm(res.state);
      void refreshAuthAndQuota();
      addToast({
        type: 'success',
        title: 'Đã lưu cấu hình AI riêng cho Admin',
      });
    } catch (err) {
      handleAdminApiFailure(err, 'Không lưu được AI riêng cho Admin');
    } finally {
      setAdminGwSaving(false);
    }
  };

  const handleTestAdminGateway = async () => {
    const payload = buildAdminGatewayPayload(true);
    if (!payload) {
      const msg = 'Vui lòng nhập đường dẫn HTTPS và mã mô hình trước khi kiểm tra.';
      setAdminGwProbeNote({ ok: false, text: msg });
      addToast({ type: 'warning', title: 'Thiếu thông tin kết nối', message: msg });
      return;
    }
    setAdminGwTesting(true);
    setAdminGwProbeNote(null);
    try {
      const saved = await adminApi.updateAdminGateway({ adminGateway: payload });
      setAdminState(saved.state);
      syncGatewayForm(saved.state);

      let outcome: AdminKeyPoolTestResult & { state?: AdminStateView };
      try {
        outcome = await requestJson<AdminKeyPoolTestResult & { state?: AdminStateView }>(
          '/api/admin/gateway/test',
          {
            method: 'POST',
            body: JSON.stringify({ target: 'admin' }),
          }
        );
      } catch (probeErr) {
        const parsed = extractAdminError(probeErr);
        const rawPayload =
          parsed.payload && typeof parsed.payload === 'object'
            ? (parsed.payload as Partial<AdminKeyPoolTestResult> & { state?: AdminStateView })
            : null;
        if (parsed.status === 502 && rawPayload && typeof rawPayload.ok === 'boolean') {
          outcome = {
            ok: Boolean(rawPayload.ok),
            mode: 'gateway',
            target: 'admin',
            keyId: rawPayload.keyId ?? 'admin',
            keyMask: rawPayload.keyMask ?? '—',
            usedKeyMask: rawPayload.usedKeyMask ?? null,
            model: rawPayload.model ?? payload.model,
            protocol: rawPayload.protocol,
            latencyMs: rawPayload.latencyMs ?? 0,
            tokens: rawPayload.tokens ?? { prompt: 0, completion: 0, total: 0 },
            replyPreview: rawPayload.replyPreview,
            preview: rawPayload.preview,
            error: rawPayload.error ?? parsed.message,
            state: rawPayload.state,
          };
        } else {
          throw probeErr;
        }
      }

      if (outcome.state) {
        setAdminState(outcome.state);
      }
      const preview = (outcome.replyPreview || outcome.preview || '').trim();
      const noteText = outcome.ok
        ? `Kết nối ổn (${outcome.model} · ${outcome.usedKeyMask || outcome.keyMask} · ${outcome.latencyMs}ms)${preview ? ` · ${preview.slice(0, 110)}` : ''}`
        : `${outcome.error || 'Không kết nối được cổng Admin AI'} (${outcome.latencyMs}ms)`;
      setAdminGwProbeNote({ ok: outcome.ok, text: noteText });
      addToast({
        type: outcome.ok ? 'success' : 'warning',
        title: outcome.ok ? 'Admin AI kết nối tốt' : 'Admin AI gặp lỗi',
        message: noteText,
      });
    } catch (err) {
      const msg = handleAdminApiFailure(err, 'Kiểm tra kết nối Admin AI thất bại');
      setAdminGwProbeNote({ ok: false, text: msg });
    } finally {
      setAdminGwTesting(false);
    }
  };

  const handleClearAdminGatewayApiKey = async () => {
    setAdminGwSaving(true);
    try {
      const res = await adminApi.updateAdminGateway({
        clearAdminApiKey: true,
      } as Parameters<typeof adminApi.updateAdminGateway>[0]);
      setAdminState(res.state);
      syncGatewayForm(res.state);
      void refreshAuthAndQuota();
      addToast({
        type: 'success',
        title: 'Đã xóa khóa AI riêng của Admin',
      });
    } catch (err) {
      handleAdminApiFailure(err, 'Không thể xóa khóa Admin AI');
    } finally {
      setAdminGwSaving(false);
    }
  };

  const handleToggleMaintenance = async (maintenanceOn: boolean) => {
    const nextSandbox = !maintenanceOn;
    setGwGuestSandbox(nextSandbox);
    try {
      const res = await adminApi.updateAdminGateway({
        guestSandboxEnabled: nextSandbox,
      });
      setAdminState(res.state);
      syncGatewayForm(res.state);
      void refreshAuthAndQuota();
      addToast({
        type: maintenanceOn ? 'warning' : 'success',
        title: maintenanceOn ? 'Đã bật chế độ Chỉ đọc cho Khách' : 'Đã mở lại Guest Sandbox',
      });
    } catch (err) {
      setGwGuestSandbox(!nextSandbox);
      handleAdminApiFailure(err, 'Không thể đổi chế độ Sandbox');
    }
  };

  const handleSetCustomLimit = async (
    rec: AdminUserQuotaView,
    subjectKind: AdminQuotaSubjectKind,
    customLimit: number | null
  ): Promise<boolean> => {
    setBusySubjectId(rec.subjectId);
    try {
      const apiKind = subjectKind === 'ip' ? 'ip' : subjectKind === 'guest' ? 'guest' : 'user';
      const res = await adminApi.updateAdminQuotas({
        subjectId: rec.subjectId,
        kind: apiKind,
        action: 'set-limit',
        customLimit,
      });
      setAdminState(res.state);
      syncGatewayForm(res.state);
      void refreshAuthAndQuota();
      addToast({
        type: 'success',
        title: customLimit === null ? 'Đã khôi phục hạn mức mặc định' : `Đã đặt hạn mức ${customLimit} lượt/ngày`,
      });
      return true;
    } catch (err) {
      handleAdminApiFailure(err, 'Cập nhật hạn mức thất bại');
      return false;
    } finally {
      setBusySubjectId(null);
    }
  };

  const handleResetQuota = async (rec: AdminUserQuotaView, subjectKind: AdminQuotaSubjectKind) => {
    setBusySubjectId(rec.subjectId);
    try {
      const apiKind = subjectKind === 'ip' ? 'ip' : subjectKind === 'guest' ? 'guest' : 'user';
      const res = await adminApi.updateAdminQuotas({
        subjectId: rec.subjectId,
        kind: apiKind,
        action: 'reset',
        reset: true,
      });
      setAdminState(res.state);
      syncGatewayForm(res.state);
      void refreshAuthAndQuota();
      addToast({
        type: 'success',
        title: `Đã đặt lại lượt cho ${rec.username}`,
      });
    } catch (err) {
      handleAdminApiFailure(err, 'Đặt lại hạn mức thất bại');
    } finally {
      setBusySubjectId(null);
    }
  };

  const handleToggleBlock = async (
    rec: AdminUserQuotaView,
    subjectKind: AdminQuotaSubjectKind,
    blocked: boolean
  ) => {
    setBusySubjectId(rec.subjectId);
    try {
      const apiKind = subjectKind === 'ip' ? 'ip' : subjectKind === 'guest' ? 'guest' : 'user';
      const res = await adminApi.updateAdminQuotas({
        subjectId: rec.subjectId,
        kind: apiKind,
        action: blocked ? 'block' : 'unblock',
        blocked,
      });
      setAdminState(res.state);
      syncGatewayForm(res.state);
      void refreshAuthAndQuota();
      addToast({
        type: blocked ? 'warning' : 'success',
        title: blocked ? `Đã chặn ${rec.username}` : `Đã mở chặn ${rec.username}`,
      });
    } catch (err) {
      handleAdminApiFailure(err, 'Thao tác chặn thất bại');
    } finally {
      setBusySubjectId(null);
    }
  };

  const handleModerate = async (reportId: string, status: ModerationReportStatus) => {
    try {
      const res = await adminApi.moderateAdminReport(reportId, status);
      setAdminState(res.state);
      syncGatewayForm(res.state);
      addToast({
        type: 'success',
        title: `Đã cập nhật trạng thái báo cáo`,
      });
    } catch (err) {
      handleAdminApiFailure(err, 'Kiểm duyệt thất bại');
    }
  };

  const handleToggleRole = async (subjectId: string) => {
    const cleanUserId = subjectId.replace(/^(user|admin):/, '');
    setBusySubjectId(subjectId);
    try {
      const res = await adminApi.toggleAdminUserRole(cleanUserId);
      setAdminState(res.state);
      syncGatewayForm(res.state);
      void refreshAuthAndQuota();
      addToast({
        type: 'success',
        title: 'Đã cập nhật vai trò tài khoản',
      });
    } catch (err) {
      handleAdminApiFailure(err, 'Không thể thay đổi vai trò');
    } finally {
      setBusySubjectId(null);
    }
  };

  const handlePublishChangelog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clTitle.trim() || !clNotes.trim()) return;
    setClSaving(true);
    try {
      const res = await adminApi.publishAdminChangelog({
        version: clVersion,
        title: clTitle,
        notes: clNotes,
      });
      setAdminState(res.state);
      syncGatewayForm(res.state);
      setClTitle('');
      setClNotes('');
      addToast({
        type: 'success',
        title: `Đã xuất bản phiên bản ${res.entry.version}`,
      });
    } catch (err) {
      handleAdminApiFailure(err, 'Xuất bản thất bại');
    } finally {
      setClSaving(false);
    }
  };

  const totalUsedAcrossSubjects = useMemo(
    () => (adminState?.usersAndQuotas || []).reduce((acc, rec) => acc + (rec.dailyUsed ?? rec.used), 0),
    [adminState?.usersAndQuotas]
  );

  const totalProjectFiles = useMemo(
    () => projects.reduce((acc, proj) => acc + proj.files.length, 0),
    [projects]
  );

  const accountBarData = useMemo<BarDatum[]>(() => {
    const records = [...(adminState?.usersAndQuotas || [])]
      .sort((a, b) => (b.dailyUsed ?? b.used) - (a.dailyUsed ?? a.used) || a.username.localeCompare(b.username))
      .slice(0, 7);

    return records.map((rec) => {
      const kind = classifyQuotaSubject(rec);
      const used = rec.dailyUsed ?? rec.used;
      const limit = rec.dailyLimit ?? rec.limit ?? (kind === 'ip' ? 45 : 15);
      const kindText =
        kind === 'admin'
          ? 'Quản trị'
          : kind === 'ip'
            ? 'IP'
            : kind === 'guest'
              ? 'Khách'
              : 'Thành viên';
      return {
        id: rec.subjectId,
        label: rec.username,
        shortLabel: rec.username.length > 10 ? `${rec.username.slice(0, 9)}..` : rec.username,
        value: used,
        limit,
        unlimited: rec.unlimited,
        meta: rec.unlimited
          ? `${used} lượt (Không giới hạn)`
          : `${used}/${limit} lượt (${kindText})`,
      };
    });
  }, [adminState?.usersAndQuotas]);

  const dailyBarData = useMemo<BarDatum[]>(() => {
    const dayMap = new Map<string, number>();
    const today = new Date();
    const orderedKeys: string[] = [];
    for (let offset = 6; offset >= 0; offset -= 1) {
      const d = new Date(today.getTime() - offset * 86400000);
      const key = d.toISOString().slice(0, 10);
      orderedKeys.push(key);
      dayMap.set(key, 0);
    }

    for (const rec of adminState?.usersAndQuotas || []) {
      const key = rec.updatedAt.slice(0, 10);
      if (dayMap.has(key)) {
        dayMap.set(key, (dayMap.get(key) || 0) + (rec.dailyUsed ?? rec.used));
      }
    }

    for (const log of adminState?.auditLogs || []) {
      const key = log.timestamp.slice(0, 10);
      if (dayMap.has(key)) {
        dayMap.set(key, (dayMap.get(key) || 0) + 1);
      }
    }

    return orderedKeys.map((key) => {
      const count = dayMap.get(key) || 0;
      return {
        id: key,
        label: `Ngày ${formatShortDay(key)}`,
        shortLabel: formatShortDay(key),
        value: count,
        limit: null,
        unlimited: true,
        meta: `${count} lượt hoạt động & yêu cầu ghi nhận`,
      };
    });
  }, [adminState?.usersAndQuotas, adminState?.auditLogs]);

  const activeBarData = barMode === 'accounts' ? accountBarData : dailyBarData;
  const maxBarValue = useMemo(
    () => Math.max(1, ...activeBarData.map((d) => d.value)),
    [activeBarData]
  );

  const activeBarItem = useMemo(
    () => activeBarData.find((d) => d.id === activeBarId) ?? activeBarData[0] ?? null,
    [activeBarData, activeBarId]
  );

  const roleDonutSlices = useMemo<DonutSlice[]>(() => {
    const list = adminState?.usersAndQuotas || [];
    const adminCount = list.filter((r) => classifyQuotaSubject(r) === 'admin').length;
    const memberCount = list.filter((r) => classifyQuotaSubject(r) === 'user').length;
    const ipCount = list.filter((r) => classifyQuotaSubject(r) === 'ip').length;
    const guestCount = list.filter((r) => classifyQuotaSubject(r) === 'guest').length;

    return [
      {
        id: 'admin',
        label: 'Admin',
        value: adminCount,
        color: 'var(--accent)',
        detail: 'Bỏ qua giới hạn lượt AI',
      },
      {
        id: 'user',
        label: 'Thành viên',
        value: memberCount,
        color: 'var(--green)',
        detail: 'Hạn mức theo tài khoản',
      },
      {
        id: 'ip',
        label: 'Địa chỉ IP',
        value: ipCount,
        color: 'var(--harbour)',
        detail: 'Hạn mức ngày theo IP',
      },
      {
        id: 'guest',
        label: 'Phiên Khách',
        value: guestCount,
        color: 'var(--amber)',
        detail: 'Theo dõi qua cookie ký số',
      },
    ];
  }, [adminState?.usersAndQuotas]);

  const gatewayDonutSlices = useMemo<DonutSlice[]>(() => {
    const tel = adminState?.telemetry;
    return [
      {
        id: 'ok',
        label: 'Thành công',
        value: tel?.successfulAiRequests ?? 0,
        color: 'var(--accent)',
        detail: 'Phản hồi trực tiếp từ Pool',
      },
      {
        id: 'fallback',
        label: 'Dự phòng',
        value: tel?.fallbackAiRequests ?? 0,
        color: 'var(--amber)',
        detail: 'Chuyển dự phòng khi lỗi upstream',
      },
      {
        id: 'blocked',
        label: 'Chặn hạn mức',
        value: tel?.quotaBlockedRequests ?? 0,
        color: 'var(--danger)',
        detail: 'Vượt ngưỡng lượt cho phép',
      },
    ];
  }, [adminState?.telemetry]);

  const activeDonutSlices = donutMode === 'roles' ? roleDonutSlices : gatewayDonutSlices;
  const donutTotal = useMemo(
    () => activeDonutSlices.reduce((sum, s) => sum + s.value, 0),
    [activeDonutSlices]
  );

  const donutGeometry = useMemo(() => {
    const radius = 74;
    const circumference = 2 * Math.PI * radius;
    let cumulative = 0;
    return activeDonutSlices.map((slice) => {
      const ratio = donutTotal > 0 ? slice.value / donutTotal : 0;
      const arcLength = ratio * circumference;
      const offset = -cumulative;
      cumulative += arcLength;
      return {
        ...slice,
        radius,
        circumference,
        arcLength,
        offset,
        pct: donutTotal > 0 ? Math.round(ratio * 100) : 0,
      };
    });
  }, [activeDonutSlices, donutTotal]);

  const inspectedSlice = useMemo(
    () => donutGeometry.find((s) => s.id === activeSliceId) ?? null,
    [donutGeometry, activeSliceId]
  );

  const adminTabs = useMemo(
    () => [
      { id: 'analytics', label: 'Thống kê' },
      { id: 'users', label: 'Hạn mức', count: adminState?.usersAndQuotas.length ?? 0 },
      { id: 'system', label: 'Hệ thống' },
      { id: 'logs', label: 'Bảo mật', count: securityEvents.length },
    ],
    [adminState?.usersAndQuotas.length, securityEvents.length]
  );

  if (!isAdmin) {
    const nonAdminUser = currentUser && currentUser.role !== 'admin' ? currentUser : null;

    return (
      <div className="adm-auth-shell">
        <section aria-label="Cổng đăng nhập quản trị" className="adm-auth-card">
          <div className="adm-auth-head">
            <span className="adm-icon-badge" aria-hidden="true">
              <IconLock size={20} />
            </span>
            <div>
              <p className="t-label">quản trị hệ thống</p>
              <h1 className="t-title adm-auth-title">Cổng Quản trị</h1>
            </div>
          </div>

          <p className="adm-card-sub">
            Khu vực điều hành tách biệt. Xác thực bằng tài khoản Admin cấu hình trên máy chủ.
          </p>

          {nonAdminUser && (
            <div className="adm-nonadmin-notice" role="status">
              <div className="adm-nonadmin-text">
                <strong>Truy cập bị giới hạn (403)</strong>
                <span>
                  Tài khoản <code className="font-mono">{nonAdminUser.username}</code> không có quyền quản trị.
                </span>
              </div>
              <div className="adm-banner-actions">
                <button
                  type="button"
                  onClick={() => navigate('home')}
                  className="btn btn-line btn-sm"
                >
                  Trang chủ
                </button>
                <button
                  type="button"
                  onClick={() => void handleAdminLogout()}
                  className="btn btn-ghost btn-sm"
                >
                  Đăng xuất
                </button>
              </div>
            </div>
          )}

          <form onSubmit={(e) => void handleAdminSignIn(e)} className="adm-field-stack">
            <label className="adm-field-group">
              <span className="adm-field-label">Tài khoản Admin</span>
              <input
                type="text"
                required
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Nhập tài khoản quản trị"
                className="field"
              />
            </label>

            <div className="adm-field-group">
              <label htmlFor="adm-login-password" className="adm-field-label">
                Mật khẩu Admin
              </label>
              <div className="adm-secret-row">
                <input
                  id="adm-login-password"
                  type={showAuthPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu quản trị"
                  className="field"
                />
                <button
                  type="button"
                  className="icon-btn"
                  aria-label={showAuthPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  title={showAuthPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  aria-pressed={showAuthPassword}
                  onClick={() => setShowAuthPassword((v) => !v)}
                >
                  {showAuthPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                </button>
              </div>
            </div>

            {lockoutRemainingSec > 0 && (
              <p className="adm-lockout-alert" role="alert">
                Tạm khóa đăng nhập do thử sai nhiều lần. Thử lại sau{' '}
                <strong className="font-mono">{lockoutRemainingSec}s</strong>.
              </p>
            )}

            {authError && lockoutRemainingSec === 0 && (
              <p className="adm-auth-error" role="alert">
                {authError}
              </p>
            )}

            <button
              type="submit"
              disabled={authLoading || lockoutRemainingSec > 0}
              className="btn btn-accent w-full"
            >
              {authLoading
                ? 'Đang xác thực'
                : lockoutRemainingSec > 0
                  ? `Đợi ${lockoutRemainingSec}s`
                  : 'Đăng nhập'}
            </button>
          </form>

          {!nonAdminUser && (
            <button
              type="button"
              onClick={() => navigate('home')}
              className="btn btn-ghost btn-sm self-center"
            >
              Trang chủ
            </button>
          )}
        </section>
      </div>
    );
  }

  const maintenanceReadOnly = !gwGuestSandbox;
  const aggTokens = adminState?.totalTokens ?? adminState?.keyPool?.totalTokens ?? {
    prompt: 0,
    completion: 0,
    total: 0,
  };
  const poolKeys = adminState?.keyPool?.keys ?? [];
  const activePoolKeys = poolKeys.filter((k) => k.status === 'active').length;

  const toggleSelectedBar = (id: string) => {
    setHoveredBarId(null);
    setSelectedBarId((prev) => (prev === id ? null : id));
  };

  const toggleSelectedSlice = (id: string) => {
    setHoveredSliceId(null);
    setSelectedSliceId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="adm">
      <div className="adm-wrap">
        <section aria-label="Thanh trạng thái quản trị" className="adm-banner">
          <div className="adm-banner-top">
            <div>
              <div className="adm-banner-meta">
                <span className="t-label">Điều hành: {currentUser.username}</span>
                {maintenanceReadOnly && <span className="tag adm-tag-amber">Khách chỉ đọc</span>}
              </div>
              <h1 className="adm-banner-title">Bảng điều khiển quản trị</h1>
            </div>

            <div className="adm-banner-actions">
              <button type="button" onClick={() => navigate('workspace')} className="btn btn-accent btn-sm">
                Workspace
              </button>
              <button
                type="button"
                onClick={() => void loadAdminState()}
                disabled={loadingState}
                aria-label="Làm mới"
                title="Làm mới"
                className="icon-btn"
              >
                <IconRefreshCw size={18} />
              </button>
              <button type="button" onClick={() => void handleAdminLogout()} className="btn btn-ghost btn-sm">
                Đăng xuất
              </button>
            </div>
          </div>
        </section>

        {!adminState && stateError ? (
          <section aria-label="Lỗi tải bảng điều khiển" role="alert" className="adm-card adm-error-card">
            <div className="adm-card-head">
              <div className="adm-inline-icon">
                <IconAlertTriangle size={18} aria-hidden="true" />
                <div>
                  <h2 className="adm-card-title">Không thể tải dữ liệu quản trị</h2>
                  <p className="adm-card-sub">{stateError}</p>
                </div>
              </div>
              <button
                type="button"
                disabled={loadingState}
                onClick={() => void loadAdminState()}
                className="btn btn-line btn-sm"
              >
                {loadingState ? 'Đang tải' : 'Thử lại'}
              </button>
            </div>
          </section>
        ) : !adminState ? (
          <>
            <section aria-label="Đang tải chỉ số hệ thống" className="adm-kpis">
              {[0, 1, 2, 3].map((idx) => (
                <article key={idx} className="adm-kpi adm-skeleton-card">
                  <span className="adm-skel adm-skel--sub" />
                  <span className="adm-skel adm-skel--title" />
                  <span className="adm-skel adm-skel--sub" />
                </article>
              ))}
            </section>

            <div className="adm-tabs-row">
              <LiquidTabs
                tabs={adminTabs}
                activeId={activeTab}
                onChange={(id) => setActiveTab(id as AdminTab)}
                ariaLabel="Khu vực quản trị"
              />
            </div>

            {activeTab === 'analytics' ? (
              <div className="adm-analytics-stack">
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
                  <span className="adm-card-sub">
                    Đang đồng bộ trạng thái Key Pool &amp; dữ liệu thống kê quản trị...
                  </span>
                </section>

                <div className="adm-grid-2">
                  {[0, 1].map((idx) => (
                    <section key={idx} aria-label="Đang tải biểu đồ quản trị" className="adm-card adm-skeleton-card">
                      <div className="adm-skel-stack">
                        <span className="adm-skel adm-skel--title" />
                        <span className="adm-skel adm-skel--sub" />
                      </div>
                      <div className="adm-skel adm-skel--box" />
                    </section>
                  ))}
                </div>
              </div>
            ) : (
              <section aria-label="Đang tải nội dung quản trị" className="adm-card adm-skeleton-card">
                <div className="adm-card-head">
                  <div className="adm-skel-stack">
                    <span className="adm-skel adm-skel--title" />
                    <span className="adm-skel adm-skel--sub" />
                  </div>
                  <span className="adm-skel adm-skel--pill" />
                </div>
                <div className="adm-skel adm-skel--bar" />
                <div className="adm-skel adm-skel--box" />
                <span className="adm-card-sub">Đang tải dữ liệu quản trị từ máy chủ...</span>
              </section>
            )}
          </>
        ) : (
          <>
            <section aria-label="Tổng quan chỉ số hệ thống" className="adm-kpis">
              <article className="adm-kpi">
                <span className="adm-kpi-label">Tổng tài khoản</span>
                <strong className="adm-kpi-val">{adminState.telemetry.registeredUsersCount}</strong>
                <span className="adm-kpi-meta">
                  {adminState.telemetry.activeSessionsCount} phiên hạn mức ·{' '}
                  {adminState.telemetry.communityPostsCount} bài viết
                </span>
              </article>

              <article className="adm-kpi">
                <span className="adm-kpi-label">Lượt AI &amp; Token</span>
                <strong className="adm-kpi-val" data-tone="accent">
                  {Math.max(adminState.telemetry.totalAiRequests, totalUsedAcrossSubjects).toLocaleString('vi-VN')}
                </strong>
                <span className="adm-kpi-meta">
                  {aggTokens.total.toLocaleString('vi-VN')} token · {adminState.telemetry.successfulAiRequests} chuẩn ·{' '}
                  {adminState.telemetry.quotaBlockedRequests} chặn
                </span>
              </article>

              <article className="adm-kpi">
                <span className="adm-kpi-label">Key Pool &amp; Gateway</span>
                <strong
                  className="adm-kpi-val"
                  data-tone={poolKeys.length === 0 || activePoolKeys < poolKeys.length ? 'warn' : 'jade'}
                >
                  {poolKeys.length > 0 ? `${activePoolKeys}/${poolKeys.length} khóa` : 'Chờ khóa'}
                </strong>
                <span className="adm-kpi-meta">
                  {adminState.gateway.model} · {formatUptime(adminState.telemetry.uptimeSeconds)}
                </span>
              </article>

              <article className="adm-kpi">
                <span className="adm-kpi-label">Bảo mật &amp; Kiểm duyệt</span>
                <strong className="adm-kpi-val" data-tone={securityEvents.length > 0 ? 'warn' : undefined}>
                  {securityEvents.length.toLocaleString('vi-VN')}
                </strong>
                <span className="adm-kpi-meta">
                  {adminState.telemetry.pendingModerationCount} chờ duyệt · {projects.length} dự án ({totalProjectFiles}{' '}
                  tệp)
                </span>
              </article>
            </section>

            {stateError && (
              <section aria-label="Cảnh báo làm mới dữ liệu" role="alert" className="adm-card adm-error-card">
                <div className="adm-card-head">
                  <div className="adm-inline-icon">
                    <IconAlertTriangle size={18} aria-hidden="true" />
                    <div>
                      <h2 className="adm-card-title">Không thể làm mới dữ liệu quản trị</h2>
                      <p className="adm-card-sub">{stateError}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={loadingState}
                    onClick={() => void loadAdminState()}
                    className="btn btn-line btn-sm"
                  >
                    Thử lại
                  </button>
                </div>
              </section>
            )}

            <div className="adm-tabs-row">
              <LiquidTabs
                tabs={adminTabs}
                activeId={activeTab}
                onChange={(id) => setActiveTab(id as AdminTab)}
                ariaLabel="Khu vực quản trị"
              />
              {adminState.telemetry.pendingModerationCount > 0 && (
                <span className="tag adm-tag-danger">
                  {adminState.telemetry.pendingModerationCount} báo cáo chờ duyệt
                </span>
              )}
            </div>

            {activeTab === 'analytics' && (
              <div className="adm-analytics-stack">
                <AdminKeyPoolPanel
                  keyPool={adminState.keyPool}
                  totalTokens={adminState.totalTokens}
                  loading={loadingState}
                  error={stateError}
                  probeResult={probeResult}
                  probing={probingPool}
                  onRetryLoad={() => void loadAdminState()}
                  onRunProbe={(mode, prompt) => void handleRunKeyPoolProbe(mode, prompt)}
                />

                <AdminCodeFrontsStats
                  adminState={adminState}
                  totalUsedAcrossSubjects={totalUsedAcrossSubjects}
                  projectsCount={projects.length}
                  onQuickToggleRole={(subjectId) => void handleToggleRole(subjectId)}
                />

                <AdminTelemetryCharts
                  adminState={adminState}
                  totalUsedAcrossSubjects={totalUsedAcrossSubjects}
                  projectsCount={projects.length}
                />

                <div className="adm-grid-2">
                  <section aria-label="Biểu đồ phân bổ lượt dùng AI" className="adm-card">
                    <div className="adm-card-head">
                      <div>
                        <h2 className="adm-card-title">Phân bổ lượt dùng AI</h2>
                        <p className="adm-card-sub">
                          Số liệu thực từ bảng hạn mức tài khoản, IP và hoạt động hệ thống.
                        </p>
                      </div>
                      <div className="adm-seg" role="group" aria-label="Chế độ biểu đồ cột">
                        <button
                          type="button"
                          className="adm-seg-btn"
                          aria-pressed={barMode === 'accounts'}
                          onClick={() => {
                            setBarMode('accounts');
                            setSelectedBarId(null);
                            setHoveredBarId(null);
                          }}
                        >
                          Đối tượng
                        </button>
                        <button
                          type="button"
                          className="adm-seg-btn"
                          aria-pressed={barMode === 'daily'}
                          onClick={() => {
                            setBarMode('daily');
                            setSelectedBarId(null);
                            setHoveredBarId(null);
                          }}
                        >
                          Theo ngày
                        </button>
                      </div>
                    </div>

                    {activeBarData.length === 0 ? (
                      <div className="adm-empty-box">
                        <p className="adm-card-title">Chưa có dữ liệu phiên AI</p>
                        <p className="adm-card-sub">Khi có lượt gọi AI hoặc kiểm tra Pool, biểu đồ sẽ cập nhật tự động.</p>
                      </div>
                    ) : (
                      <div className="adm-chart-box">
                        <svg
                          viewBox="0 0 560 230"
                          className="adm-chart-svg"
                          role="img"
                          aria-label="Biểu đồ cột phân bổ lượt dùng AI"
                        >
                          <title>Phân bổ lượt dùng AI</title>
                          {[0, 0.25, 0.5, 0.75, 1].map((tick) => {
                            const y = 186 - tick * 150;
                            const tickVal = Math.round(maxBarValue * tick);
                            return (
                              <g key={tick}>
                                <line
                                  x1={42}
                                  y1={y}
                                  x2={544}
                                  y2={y}
                                  stroke="var(--line)"
                                  strokeDasharray={tick === 0 ? undefined : '4 4'}
                                />
                                <text
                                  x={34}
                                  y={y + 4}
                                  textAnchor="end"
                                  fontSize="10"
                                  fontFamily="var(--font-mono)"
                                  fill="var(--fg-faint)"
                                >
                                  {tickVal}
                                </text>
                              </g>
                            );
                          })}

                          {activeBarData.map((bar, idx) => {
                            const count = Math.max(1, activeBarData.length);
                            const chartWidth = 492;
                            const slotW = chartWidth / count;
                            const barW = Math.min(44, Math.max(20, slotW * 0.56));
                            const x = 48 + idx * slotW + (slotW - barW) / 2;
                            const rawH = (bar.value / maxBarValue) * 150;
                            const h = bar.value > 0 ? Math.max(8, rawH) : 3;
                            const y = 186 - h;
                            const isFocused = activeBarItem?.id === bar.id;
                            const fillColor =
                              bar.value === 0
                                ? 'var(--line-strong)'
                                : bar.unlimited
                                  ? 'var(--accent-fill)'
                                  : 'var(--accent)';

                            return (
                              <g key={bar.id}>
                                <rect
                                  x={x}
                                  y={y}
                                  width={barW}
                                  height={h}
                                  rx={6}
                                  fill={fillColor}
                                  opacity={activeBarId && !isFocused ? 0.45 : 1}
                                  tabIndex={0}
                                  role="button"
                                  aria-pressed={selectedBarId === bar.id}
                                  aria-label={`${bar.label}: ${bar.meta}`}
                                  className="adm-bar-rect"
                                  onMouseEnter={() => setHoveredBarId(bar.id)}
                                  onMouseLeave={() => setHoveredBarId(null)}
                                  onFocus={() => setHoveredBarId(bar.id)}
                                  onBlur={() => setHoveredBarId(null)}
                                  onClick={() => toggleSelectedBar(bar.id)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                      e.preventDefault();
                                      toggleSelectedBar(bar.id);
                                    }
                                  }}
                                />
                                <text
                                  x={x + barW / 2}
                                  y={y - 6}
                                  textAnchor="middle"
                                  fontSize="10"
                                  fontFamily="var(--font-mono)"
                                  fill="var(--fg-muted)"
                                >
                                  {bar.value}
                                </text>
                                <text
                                  x={x + barW / 2}
                                  y={206}
                                  textAnchor="middle"
                                  fontSize="10.5"
                                  fontFamily="var(--font-mono)"
                                  fill={isFocused ? 'var(--fg)' : 'var(--fg-faint)'}
                                >
                                  {bar.shortLabel}
                                </text>
                              </g>
                            );
                          })}
                        </svg>

                        <div className="adm-tooltip" aria-live="polite">
                          {activeBarItem ? (
                            <>
                              <strong>{activeBarItem.label}</strong>
                              <span className="t-label">{activeBarItem.meta}</span>
                            </>
                          ) : (
                            <span className="t-label">Chưa có dữ liệu phiên AI.</span>
                          )}
                        </div>
                      </div>
                    )}
                  </section>

                  <section aria-label="Biểu đồ tỷ trọng hạn mức và vai trò" className="adm-card">
                    <div className="adm-card-head">
                      <div>
                        <h2 className="adm-card-title">Tỷ trọng Hạn mức &amp; Vai trò</h2>
                        <p className="adm-card-sub">
                          Chọn từng nhóm để xem chi tiết số lượng và tỷ lệ.
                        </p>
                      </div>
                      <div className="adm-seg" role="group" aria-label="Chế độ biểu đồ tròn">
                        <button
                          type="button"
                          className="adm-seg-btn"
                          aria-pressed={donutMode === 'roles'}
                          onClick={() => {
                            setDonutMode('roles');
                            setSelectedSliceId(null);
                            setHoveredSliceId(null);
                          }}
                        >
                          Đối tượng
                        </button>
                        <button
                          type="button"
                          className="adm-seg-btn"
                          aria-pressed={donutMode === 'gateway'}
                          onClick={() => {
                            setDonutMode('gateway');
                            setSelectedSliceId(null);
                            setHoveredSliceId(null);
                          }}
                        >
                          Gateway
                        </button>
                      </div>
                    </div>

                    <div className="adm-donut-layout">
                      <div className="adm-donut-wrap">
                        <svg
                          viewBox="0 0 200 200"
                          className="adm-chart-svg"
                          role="img"
                          aria-label="Biểu đồ tròn phân bổ vai trò và hạn mức"
                        >
                          <title>Tỷ trọng Hạn mức và Vai trò</title>
                          <circle
                            cx={100}
                            cy={100}
                            r={74}
                            fill="none"
                            stroke="var(--bg-sunken)"
                            strokeWidth={22}
                          />
                          <g transform="rotate(-90 100 100)">
                            {donutGeometry.map((slice) => {
                              if (slice.value <= 0) return null;
                              const active = activeSliceId === slice.id;
                              return (
                                <circle
                                  key={slice.id}
                                  cx={100}
                                  cy={100}
                                  r={slice.radius}
                                  fill="none"
                                  stroke={slice.color}
                                  strokeWidth={22}
                                  strokeDasharray={`${slice.arcLength} ${slice.circumference}`}
                                  strokeDashoffset={slice.offset}
                                  opacity={activeSliceId && !active ? 0.34 : 1}
                                  tabIndex={0}
                                  role="button"
                                  aria-pressed={selectedSliceId === slice.id}
                                  aria-label={`${slice.label}: ${slice.value} (${slice.pct}%)`}
                                  className="adm-ring-arc"
                                  onMouseEnter={() => setHoveredSliceId(slice.id)}
                                  onMouseLeave={() => setHoveredSliceId(null)}
                                  onFocus={() => setHoveredSliceId(slice.id)}
                                  onBlur={() => setHoveredSliceId(null)}
                                  onClick={() => toggleSelectedSlice(slice.id)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                      e.preventDefault();
                                      toggleSelectedSlice(slice.id);
                                    }
                                  }}
                                />
                              );
                            })}
                          </g>
                        </svg>

                        <div className="adm-donut-center" aria-live="polite">
                          <span className="adm-donut-num">
                            {inspectedSlice ? `${inspectedSlice.pct}%` : donutTotal}
                          </span>
                          <span className="adm-donut-lbl">
                            {inspectedSlice
                              ? `${inspectedSlice.label} (${inspectedSlice.value})`
                              : donutMode === 'roles'
                                ? 'Tổng đối tượng'
                                : 'Tổng lượt AI'}
                          </span>
                        </div>
                      </div>

                      <ul className="adm-legend">
                        {donutGeometry.map((slice) => {
                          const active = activeSliceId === slice.id;
                          return (
                            <li key={slice.id}>
                              <button
                                type="button"
                                className="adm-legend-btn"
                                data-active={active}
                                aria-pressed={selectedSliceId === slice.id}
                                onMouseEnter={() => setHoveredSliceId(slice.id)}
                                onMouseLeave={() => setHoveredSliceId(null)}
                                onFocus={() => setHoveredSliceId(slice.id)}
                                onBlur={() => setHoveredSliceId(null)}
                                onClick={() => toggleSelectedSlice(slice.id)}
                              >
                                <span className="adm-legend-left">
                                  <span className="adm-swatch" style={{ background: slice.color }} aria-hidden="true" />
                                  <span className="adm-legend-name">{slice.label}</span>
                                </span>
                                <span className="adm-legend-val">
                                  {slice.value} ({slice.pct}%)
                                </span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </section>
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <AdminQuotasPanel
                records={adminState.usersAndQuotas}
                defaultUserLimit={adminState.gateway.dailyUserLimit ?? adminState.gateway.standardTurnLimit ?? 15}
                defaultIpLimit={adminState.gateway.dailyIpLimit ?? 45}
                theme={theme}
                loading={loadingState}
                error={stateError}
                busySubjectId={busySubjectId}
                onRetryLoad={() => void loadAdminState()}
                onSetCustomLimit={(rec, kind, limit) => handleSetCustomLimit(rec, kind, limit)}
                onResetQuota={(rec, kind) => void handleResetQuota(rec, kind)}
                onToggleBlock={(rec, kind, blocked) => void handleToggleBlock(rec, kind, blocked)}
                onToggleRole={(subjectId) => void handleToggleRole(subjectId)}
              />
            )}

            {activeTab === 'system' && (() => {
              const adminGwState = adminState.gateway.adminGateway;
              const sharedOpenRouterMask =
                adminState.gateway.profiles?.openrouter?.maskedKey ||
                (adminState.gateway.baseUrl.toLowerCase().includes('openrouter.ai')
                  ? adminState.gateway.maskedKey
                  : undefined);

              return (
              <div className="adm-sys-grid">
                <div className="adm-field-stack">
                  <section
                    aria-label="Cổng AI riêng cho tài khoản Admin"
                    className="adm-card adm-card-dedicated"
                  >
                    <div className="adm-card-head">
                      <div className="adm-inline-icon">
                        <span className="adm-icon-badge" aria-hidden="true">
                          <IconCpu size={18} />
                        </span>
                        <div>
                          <div className="adm-banner-meta">
                            <h2 className="adm-card-title">AI riêng cho tài khoản Admin</h2>
                            <span className={`tag ${adminGwEnabled ? 'tag-green' : ''}`}>
                              {adminGwEnabled ? 'Đang bật' : 'Đang tắt'}
                            </span>
                          </div>
                          <p className="adm-card-sub">
                            Chỉ dùng cho tài khoản Admin khi dựng web. Thành viên và khách vẫn chạy cổng công khai.
                          </p>
                        </div>
                      </div>
                      <label className="adm-check-label">
                        <input
                          type="checkbox"
                          checked={adminGwEnabled}
                          onChange={(e) => setAdminGwEnabled(e.target.checked)}
                        />
                        <span>Bật AI riêng</span>
                      </label>
                    </div>

                    <div className="adm-profile-bar" role="group" aria-label="Chọn loại cổng AI riêng cho Admin">
                      <button
                        type="button"
                        disabled={adminGwSaving || adminGwTesting}
                        className={`adm-profile-btn${adminGwPreset === 'openrouter' ? ' is-active' : ''}`}
                        onClick={() => handleSelectAdminPreset('openrouter')}
                      >
                        <strong>OpenRouter Cao cấp (Admin)</strong>
                        <span className="adm-field-hint">
                          {adminGwState?.maskedKey
                            ? `Khóa riêng: ${adminGwState.maskedKey}`
                            : sharedOpenRouterMask && adminGwReuseOrKey
                              ? `Dùng chung: ${sharedOpenRouterMask}`
                              : 'Chưa gắn khóa'}
                        </span>
                      </button>

                      <button
                        type="button"
                        disabled={adminGwSaving || adminGwTesting}
                        className={`adm-profile-btn${adminGwPreset === 'custom' ? ' is-active' : ''}`}
                        onClick={() => handleSelectAdminPreset('custom')}
                      >
                        <strong>Cổng riêng OpenAI-Compatible</strong>
                        <span className="adm-field-hint">9Router / Tunnel / Proxy tự mở</span>
                      </button>
                    </div>

                    <form onSubmit={(e) => void handleSaveAdminGateway(e)} className="adm-field-stack">
                      {adminGwPreset === 'openrouter' ? (
                        <>
                          <div className="adm-field-group">
                            <span className="adm-field-label">Chọn nhanh mô hình cao cấp (Admin)</span>
                            <SelectionList
                              items={ADMIN_OPENROUTER_PRESETS}
                              selectedId={adminGwModel}
                              onSelect={(id) => setAdminGwModel(id)}
                              ariaLabel="Chọn mô hình OpenRouter cho Admin"
                            />
                          </div>

                          <div className="adm-two-col">
                            <label className="adm-field-group">
                              <span className="adm-field-label">Mã mô hình Admin</span>
                              <input
                                type="text"
                                value={adminGwModel}
                                onChange={(e) => setAdminGwModel(e.target.value)}
                                placeholder="deepseek/deepseek-v3.2"
                                className="field font-mono"
                              />
                            </label>

                            <label className="adm-field-group">
                              <span className="adm-field-label">Giới hạn token đầu ra (1024–32768)</span>
                              <input
                                type="number"
                                min={1024}
                                max={32768}
                                step={256}
                                value={adminGwMaxTokens}
                                onChange={(e) => setAdminGwMaxTokens(Number(e.target.value))}
                                className="field font-mono"
                              />
                            </label>
                          </div>

                          <label className="adm-check-label">
                            <input
                              type="checkbox"
                              checked={adminGwReuseOrKey}
                              onChange={(e) => setAdminGwReuseOrKey(e.target.checked)}
                            />
                            <span>
                              Tự dùng khóa OpenRouter công khai nếu bỏ trống ô khóa riêng
                              {sharedOpenRouterMask ? ` (${sharedOpenRouterMask})` : ''}
                            </span>
                          </label>
                        </>
                      ) : (
                        <>
                          <div className="adm-two-col">
                            <div className="adm-field-group">
                              <span className="adm-field-label">Giao thức cổng riêng</span>
                              <SelectionList
                                items={PROTOCOL_ITEMS}
                                selectedId={adminGwProtocol}
                                onSelect={(id) => setAdminGwProtocol(id as AIProtocol)}
                                ariaLabel="Chọn giao thức cổng riêng Admin"
                              />
                            </div>

                            <div className="adm-field-stack">
                              <label className="adm-field-group">
                                <span className="adm-field-label">Đường dẫn HTTPS cổng riêng</span>
                                <input
                                  type="url"
                                  value={adminGwBaseUrl}
                                  onChange={(e) => setAdminGwBaseUrl(e.target.value)}
                                  placeholder="https://gateway.example.com/v1"
                                  className="field font-mono"
                                />
                              </label>

                              <label className="adm-field-group">
                                <span className="adm-field-label">Mã mô hình tùy chỉnh</span>
                                <input
                                  type="text"
                                  value={adminGwModel}
                                  onChange={(e) => setAdminGwModel(e.target.value)}
                                  placeholder="gemini-4-hydrogen-high"
                                  className="field font-mono"
                                />
                              </label>
                            </div>
                          </div>

                          <label className="adm-field-group">
                            <span className="adm-field-label">Giới hạn token đầu ra (1024–32768)</span>
                            <input
                              type="number"
                              min={1024}
                              max={32768}
                              step={256}
                              value={adminGwMaxTokens}
                              onChange={(e) => setAdminGwMaxTokens(Number(e.target.value))}
                              className="field font-mono"
                            />
                          </label>
                        </>
                      )}

                      <div className="adm-field-group">
                        <label htmlFor="adm-dedicated-apikey" className="adm-field-label">
                          Khóa API riêng của Admin
                        </label>
                        <div className="adm-secret-row">
                          <input
                            id="adm-dedicated-apikey"
                            type={showAdminGwApiKey ? 'text' : 'password'}
                            value={adminGwApiKey}
                            onChange={(e) => setAdminGwApiKey(e.target.value)}
                            placeholder={
                              adminGwState?.maskedKey
                                ? `Đã lưu: ${adminGwState.maskedKey} (để trống nếu giữ nguyên)`
                                : adminGwPreset === 'openrouter' && sharedOpenRouterMask && adminGwReuseOrKey
                                  ? `Đang dùng chung: ${sharedOpenRouterMask} (dán nếu muốn tách khóa)`
                                  : 'Dán khóa API riêng cho Admin'
                            }
                            className="field font-mono"
                          />
                          <button
                            type="button"
                            className="icon-btn"
                            aria-label={showAdminGwApiKey ? 'Ẩn khóa Admin AI' : 'Hiện khóa Admin AI'}
                            title={showAdminGwApiKey ? 'Ẩn khóa' : 'Hiện khóa'}
                            aria-pressed={showAdminGwApiKey}
                            onClick={() => setShowAdminGwApiKey((v) => !v)}
                          >
                            {showAdminGwApiKey ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                          </button>
                          {adminGwState?.hasApiKey && (
                            <button
                              type="button"
                              disabled={adminGwSaving || adminGwTesting}
                              className="btn btn-line btn-sm adm-secret-clear"
                              onClick={() => void handleClearAdminGatewayApiKey()}
                            >
                              Xóa khóa
                            </button>
                          )}
                        </div>
                      </div>

                      {adminGwProbeNote && (
                        <div
                          className={`adm-probe-banner${adminGwProbeNote.ok ? ' is-ok' : ' is-err'}`}
                          role="status"
                        >
                          {adminGwProbeNote.text}
                        </div>
                      )}

                      <div className="adm-form-foot">
                        <span className="adm-field-hint">
                          {adminGwState?.updatedAt
                            ? `Cập nhật cuối: ${formatAdminDateTime(adminGwState.updatedAt)}`
                            : 'Chưa lưu thay đổi riêng'}
                        </span>
                        <div className="adm-row-actions">
                          <button
                            type="button"
                            disabled={adminGwTesting || adminGwSaving}
                            className="btn btn-line"
                            onClick={() => void handleTestAdminGateway()}
                          >
                            {adminGwTesting ? 'Đang kiểm tra' : 'Kiểm tra kết nối Admin AI'}
                          </button>
                          <button
                            type="submit"
                            disabled={adminGwSaving || adminGwTesting}
                            className="btn btn-accent"
                          >
                            {adminGwSaving ? 'Đang lưu' : 'Lưu AI riêng'}
                          </button>
                        </div>
                      </div>
                    </form>
                  </section>

                  <section aria-label="Cấu hình AI Gateway và hạn mức mặc định" className="adm-card">
                  <div className="adm-card-head">
                    <div>
                      <h2 className="adm-card-title">Cài đặt hệ thống &amp; AI Gateway</h2>
                      <p className="adm-card-sub">
                        Quản lý model mặc định, hạn mức ngày theo User/IP và cấu hình runtime máy chủ.
                      </p>
                    </div>
                    <label className="adm-check-label">
                      <input
                        type="checkbox"
                        checked={gwEnabled}
                        onChange={(e) => setGwEnabled(e.target.checked)}
                      />
                      <span>Bật ghi đè Gateway</span>
                    </label>
                  </div>

                  <div className="adm-profile-bar" role="group" aria-label="Chuyển nhanh nhà cung cấp AI">
                    <button
                      type="button"
                      disabled={gwSaving}
                      className={`adm-profile-btn${
                        (adminState.gateway.activeProfile === 'openrouter' ||
                          gwBaseUrl.toLowerCase().includes('openrouter.ai'))
                          ? ' is-active'
                          : ''
                      }`}
                      onClick={() => void handleSwitchGatewayProfile('openrouter')}
                    >
                      <strong>OpenRouter</strong>
                      <span className="adm-field-hint">
                        {adminState.gateway.profiles?.openrouter?.maskedKey
                          ? `Khóa: ${adminState.gateway.profiles.openrouter.maskedKey}`
                          : 'Chưa gắn khóa'}
                      </span>
                    </button>

                    <button
                      type="button"
                      disabled={gwSaving}
                      className={`adm-profile-btn${
                        (adminState.gateway.activeProfile === 'gemini' ||
                          gwProtocol === 'gemini')
                          ? ' is-active'
                          : ''
                      }`}
                      onClick={() => void handleSwitchGatewayProfile('gemini')}
                    >
                      <strong>Google Gemini</strong>
                      <span className="adm-field-hint">
                        {adminState.gateway.profiles?.gemini?.maskedKey
                          ? `Khóa: ${adminState.gateway.profiles.gemini.maskedKey}`
                          : `Pool ${adminState.keyPool?.keys.length || 0} khóa`}
                      </span>
                    </button>

                    <div className="adm-cost-box">
                      <span className="adm-field-hint">Token &amp; Ước tính chi phí</span>
                      <strong className="font-mono">
                        {(adminState.telemetry.gatewayTokens?.total || 0).toLocaleString('vi-VN')} tok · $
                        {(adminState.telemetry.estimatedCostUsd || 0).toFixed(4)}
                      </strong>
                    </div>
                  </div>

                  <form onSubmit={(e) => void handleSaveGateway(e)} className="adm-field-stack">
                    <div className="adm-limit-grid">
                      <div className="adm-field-group">
                        <div className="adm-slider-fit">
                          <SlingSlider
                            key={`adm-turn-${adminState.gateway.updatedAt ?? 'init'}-${sliderSyncVersion}`}
                            min={1}
                            max={100}
                            step={1}
                            defaultValue={clampInt(gwDailyUserLimit, 1, 100, 15)}
                            label="Hạn mức ngày mặc định (User/Khách)"
                            unit=" lượt"
                            theme={theme}
                            onChange={(val) => setGwDailyUserLimit(val)}
                          />
                        </div>
                        <label className="adm-field-group">
                          <span className="adm-field-hint">Giá trị chính xác (1–500 lượt/ngày)</span>
                          <input
                            type="number"
                            min={1}
                            max={500}
                            value={gwDailyUserLimit}
                            onChange={(e) => {
                              const raw = e.target.value;
                              const parsed = raw === '' ? 1 : Number(raw);
                              setGwDailyUserLimit(Number.isFinite(parsed) ? parsed : 15);
                              setSliderSyncVersion((v) => v + 1);
                            }}
                            className="field font-mono"
                          />
                        </label>
                      </div>

                      <div className="adm-field-group">
                        <label className="adm-field-group">
                          <span className="adm-field-label">Hạn mức ngày theo IP (1–2000)</span>
                          <input
                            type="number"
                            min={1}
                            max={2000}
                            value={gwDailyIpLimit}
                            onChange={(e) => setGwDailyIpLimit(Number(e.target.value))}
                            className="field font-mono"
                          />
                        </label>
                        <label className="adm-field-group">
                          <span className="adm-field-label">Trần token đầu ra / lượt (512–8192)</span>
                          <input
                            type="number"
                            min={512}
                            max={8192}
                            step={128}
                            value={gwMaxOutputTokens}
                            onChange={(e) => setGwMaxOutputTokens(Number(e.target.value))}
                            className="field font-mono"
                          />
                          <span className="adm-field-hint">
                            Khuyên dùng 2400–3200 để lắp ghép đủ mẫu mà không đốt tiền.
                          </span>
                        </label>
                      </div>
                    </div>

                    <div className="adm-two-col">
                      <div className="adm-field-group">
                        <span className="adm-field-label">Giao thức AI mặc định</span>
                        <SelectionList
                          items={PROTOCOL_ITEMS}
                          selectedId={gwProtocol}
                          onSelect={(id) => setGwProtocol(id as AIProtocol)}
                          ariaLabel="Chọn giao thức AI Gateway"
                        />
                      </div>

                      <div className="adm-field-group">
                        <span className="adm-field-label">Mô hình AI mặc định</span>
                        <SelectionList
                          items={
                            gwBaseUrl.toLowerCase().includes('openrouter.ai')
                              ? OPENROUTER_MODEL_PRESETS
                              : GEMINI_MODEL_PRESETS
                          }
                          selectedId={gwModel}
                          onSelect={(id) => setGwModel(id)}
                          ariaLabel="Chọn mô hình AI mặc định"
                        />
                      </div>
                    </div>

                    <div className="adm-two-col">
                      <label className="adm-field-group">
                        <span className="adm-field-label">Tên mô hình tùy chỉnh</span>
                        <input
                          type="text"
                          value={gwModel}
                          onChange={(e) => setGwModel(e.target.value)}
                          placeholder="openrouter/auto-smart"
                          className="field font-mono"
                        />
                      </label>

                      <label className="adm-field-group">
                        <span className="adm-field-label">Upstream Base URL</span>
                        <input
                          type="url"
                          value={gwBaseUrl}
                          onChange={(e) => setGwBaseUrl(e.target.value)}
                          placeholder="https://openrouter.ai/api/v1"
                          className="field font-mono"
                        />
                      </label>
                    </div>

                    <div className="adm-field-group">
                      <label htmlFor="adm-gw-apikey" className="adm-field-label">
                        Khóa API đang dùng (dán khóa mới để đổi ngay)
                      </label>
                      <div className="adm-secret-row">
                        <input
                          id="adm-gw-apikey"
                          type={showGwApiKey ? 'text' : 'password'}
                          value={gwApiKey}
                          onChange={(e) => setGwApiKey(e.target.value)}
                          placeholder={
                            adminState.gateway.maskedKey
                              ? `Đã lưu: ${adminState.gateway.maskedKey} (để trống nếu giữ nguyên)`
                              : adminState.gateway.hasCustomApiKey
                                ? 'Đã lưu khóa tùy chỉnh trên máy chủ'
                                : 'Đang dùng API Key Pool máy chủ'
                          }
                          className="field font-mono"
                        />
                        <button
                          type="button"
                          className="icon-btn"
                          aria-label={showGwApiKey ? 'Ẩn khóa API' : 'Hiện khóa API'}
                          title={showGwApiKey ? 'Ẩn khóa' : 'Hiện khóa'}
                          aria-pressed={showGwApiKey}
                          onClick={() => setShowGwApiKey((v) => !v)}
                        >
                          {showGwApiKey ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                        </button>
                        {adminState.gateway.hasCustomApiKey && (
                          <button
                            type="button"
                            disabled={gwSaving}
                            className="btn btn-line btn-sm adm-secret-clear"
                            onClick={() => void handleClearGatewayApiKey()}
                          >
                            Xóa khóa
                          </button>
                        )}
                      </div>
                    </div>

                    <label className="adm-field-group">
                      <span className="adm-field-label">Chỉ thị hệ thống bổ sung (System Prompt Suffix)</span>
                      <textarea
                        rows={2}
                        value={gwSystemPromptSuffix}
                        onChange={(e) => setGwSystemPromptSuffix(e.target.value)}
                        placeholder="Ví dụ: Luôn kiểm tra bảo mật XSS và ưu tiên tối giản..."
                        className="field"
                      />
                    </label>

                    {gwProbeNote && (
                      <div
                        className={`adm-probe-banner${gwProbeNote.ok ? ' is-ok' : ' is-err'}`}
                        role="status"
                      >
                        {gwProbeNote.text}
                      </div>
                    )}

                    <div className="adm-form-foot">
                      <span className="adm-field-hint">
                        Cập nhật cuối: {formatAdminDateTime(adminState.gateway.updatedAt)}
                      </span>
                      <div className="adm-row-actions">
                        <button
                          type="button"
                          disabled={gwTesting || gwSaving}
                          className="btn btn-line"
                          onClick={() => void handleTestActiveGateway()}
                        >
                          {gwTesting ? 'Đang thử' : 'Kiểm tra API'}
                        </button>
                        <button type="submit" disabled={gwSaving} className="btn btn-accent">
                          {gwSaving ? 'Đang lưu' : 'Lưu cấu hình'}
                        </button>
                      </div>
                    </div>
                  </form>
                </section>
                </div>

                <div className="adm-field-stack">
                  <section aria-label="Công tắc bảo trì chỉ đọc" className="adm-card">
                    <div>
                      <h2 className="adm-card-title">Chế độ Khách &amp; Bảo trì</h2>
                      <p className="adm-card-sub">
                        Khi bật Chỉ đọc, Guest Sandbox tạm dừng gọi AI để bảo vệ hạn mức Pool.
                      </p>
                    </div>

                    <div className="adm-lamp">
                      <LampSwitch
                        on={maintenanceReadOnly}
                        onToggle={(next) => void handleToggleMaintenance(next)}
                        onLabel="Chỉ đọc"
                        offLabel="Mở Guest"
                      />
                    </div>
                  </section>

                  <section aria-label="Hàng đợi kiểm duyệt nhanh" className="adm-card">
                    <div className="adm-card-head">
                      <div>
                        <h2 className="adm-card-title">Hàng đợi kiểm duyệt</h2>
                        <p className="adm-card-sub">
                          {adminState.moderationQueue.length} báo cáo từ cộng đồng.
                        </p>
                      </div>
                    </div>

                    {adminState.moderationQueue.length === 0 ? (
                      <div className="adm-empty-box adm-empty-box--inset">
                        <p className="adm-card-title">Hàng đợi sạch</p>
                        <p className="adm-card-sub">Chưa có báo cáo vi phạm nào cần xử lý.</p>
                      </div>
                    ) : (
                      <div className="adm-mod-list">
                        {adminState.moderationQueue.map((rep) => (
                          <article key={rep.id} className="adm-mod-item">
                            <div className="adm-mod-top">
                              <div className="min-w-0">
                                <strong className="adm-mod-title">{rep.targetTitle}</strong>
                                <span className="t-label">
                                  Kênh: {rep.targetChannel} · Báo cáo bởi {rep.reporterName}
                                </span>
                              </div>
                              <span
                                className={`tag ${
                                  rep.status === 'approved'
                                    ? 'tag-green'
                                    : rep.status === 'hidden'
                                      ? 'adm-tag-danger'
                                      : ''
                                }`}
                              >
                                {rep.status === 'approved'
                                  ? 'Đã duyệt'
                                  : rep.status === 'hidden'
                                    ? 'Đã ẩn'
                                    : rep.status === 'dismissed'
                                      ? 'Đã bỏ qua'
                                      : 'Chờ duyệt'}
                              </span>
                            </div>
                            <p className="adm-card-sub">{rep.reason}</p>
                            <div className="adm-banner-actions">
                              <button
                                type="button"
                                onClick={() => void handleModerate(rep.id, 'approved')}
                                className="btn btn-line btn-sm"
                              >
                                Duyệt
                              </button>
                              <button
                                type="button"
                                onClick={() => void handleModerate(rep.id, 'hidden')}
                                className="btn adm-btn-danger btn-sm"
                              >
                                Ẩn bài
                              </button>
                              <button
                                type="button"
                                onClick={() => void handleModerate(rep.id, 'dismissed')}
                                className="btn btn-ghost btn-sm"
                              >
                                Bỏ qua
                              </button>
                            </div>
                          </article>
                        ))}
                      </div>
                    )}
                  </section>

                  <section aria-label="Xuất bản nhật ký thay đổi" className="adm-card">
                    <div>
                      <h2 className="adm-card-title">Xuất bản Changelog</h2>
                      <p className="adm-card-sub">Công bố bản cập nhật mới lên trang công khai.</p>
                    </div>

                    <form onSubmit={(e) => void handlePublishChangelog(e)} className="adm-field-stack">
                      <div className="adm-cl-inputs">
                        <input
                          type="text"
                          value={clVersion}
                          onChange={(e) => setClVersion(e.target.value)}
                          placeholder="3.0.1"
                          aria-label="Phiên bản"
                          className="field font-mono"
                        />
                        <input
                          type="text"
                          value={clTitle}
                          onChange={(e) => setClTitle(e.target.value)}
                          placeholder="Tiêu đề bản cập nhật"
                          aria-label="Tiêu đề bản cập nhật"
                          className="field"
                        />
                      </div>
                      <textarea
                        rows={3}
                        value={clNotes}
                        onChange={(e) => setClNotes(e.target.value)}
                        placeholder="Mô tả thay đổi kỹ thuật đã kiểm định..."
                        aria-label="Nội dung thay đổi"
                        className="field"
                      />
                      <div className="adm-form-foot">
                        <span className="adm-field-hint">
                          {adminState.changelog.length} bản đã phát hành
                        </span>
                        <button type="submit" disabled={clSaving} className="btn btn-accent btn-sm">
                          {clSaving ? 'Đang xuất bản' : 'Xuất bản'}
                        </button>
                      </div>
                    </form>

                    {adminState.changelog.length > 0 && (
                      <div className="adm-cl-list">
                        {adminState.changelog.slice(0, 3).map((cl) => (
                          <article key={cl.id} className="adm-cl-item">
                            <div className="adm-cl-item-top">
                              <span className="tag tag-green">v{cl.version}</span>
                              <span className="t-label">{formatAdminDateTime(cl.publishedAt)}</span>
                            </div>
                            <strong className="adm-mod-title">{cl.title}</strong>
                            <p className="adm-card-sub">{cl.notes}</p>
                          </article>
                        ))}
                      </div>
                    )}
                  </section>
                </div>
              </div>
              );
            })()}

            {activeTab === 'logs' && (
              <AdminSecurityLogsPanel
                securityEvents={securityEvents}
                auditLogs={adminState.auditLogs}
                theme={theme}
                loading={loadingState}
                error={stateError}
                refreshingEvents={refreshingEvents}
                onRefreshEvents={() => void handleRefreshSecurityEvents()}
                onRetryLoad={() => void loadAdminState()}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminView;
