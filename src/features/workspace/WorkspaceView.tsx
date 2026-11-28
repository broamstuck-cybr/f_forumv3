import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { KineticLogo } from '../../components/brand/KineticLogo';
import { triggerPinuiThemeToggle } from '../../components/layout/GlobalThemeAtmosphere';
import { handleLiquidPointerLeave, handleLiquidPointerMove } from '../../utils/liquidGlassPointer';
import {
  AGENT_SHOWCASE_15,
  getShowcaseBlueprintById,
} from '../../data/agentShowcase15';
import {
  composeWithAgent,
  createInitialBlueprint,
  type ComposerBlueprint,
} from '../../engine/repoWebComposer';
import {
  bundleProjectFiles,
  createStarterFileContent,
  detectLanguageFromPath,
  sanitizeVirtualPath,
  sortProjectFiles,
  splitHtmlToProjectFiles,
} from '../../engine/workspaceBundler';
import { apiClient } from '../../services/apiClient';
import { useAppStore } from '../../store/appStore';
import type { AppRoute, WorkspaceFile } from '../../types/index';
import type {
  AgentChatMessage,
  AgentShowcaseProduct,
  AgentTraceStep,
  MatchedVaultResource,
  OnboardingDomain,
  OnboardingProfile,
  PublishedPageCategory,
} from '../../types/workspaceV4';
import { AgentChatPane } from './AgentChatPane';
import { ArenaRunnerPane } from './ArenaRunnerPane';
import { OnboardingWizard } from './OnboardingWizard';
import { Showcase15Drawer } from './Showcase15Drawer';
import { SplitDivider } from './SplitDivider';
import './workspace.css';

const NAV_ITEMS: Array<{ id: AppRoute; label: string }> = [
  { id: 'home', label: 'Trang chủ' },
  { id: 'explore', label: 'Khám phá' },
  { id: 'workspace', label: 'Workspace' },
  { id: 'community', label: 'Cộng đồng' },
];

interface HistorySnapshot {
  files: WorkspaceFile[];
  blueprint: ComposerBlueprint | null;
  activeFilePath: string;
}

function mapDomainToCategory(domain: OnboardingDomain): PublishedPageCategory {
  if (domain === 'education') return 'presentation';
  return domain;
}

function domainFromCategory(category: PublishedPageCategory): OnboardingDomain {
  if (category === 'presentation') return 'education';
  return category;
}

function buildDefaultProfile(partial?: Partial<OnboardingProfile>): OnboardingProfile {
  return {
    role: partial?.role ?? 'student',
    siteName: partial?.siteName ?? 'Trang Web Mới',
    domain: partial?.domain ?? 'education',
    goal: partial?.goal ?? 'present',
    personality: partial?.personality ?? 'modern',
    sections:
      partial?.sections && partial.sections.length > 0
        ? partial.sections
        : ['hero', 'stats', 'showcase', 'timeline', 'register'],
    completedAt: partial?.completedAt,
  };
}

function buildAutoPromptFromProfile(profile: OnboardingProfile): string {
  const domainNames: Record<OnboardingDomain, string> = {
    education: 'học tập & thuyết trình',
    event: 'CLB & sự kiện',
    portfolio: 'hồ sơ cá nhân',
    business: 'sản phẩm & dịch vụ',
    tech: 'công nghệ & 3D',
  };
  return `Tạo trang "${profile.siteName}" cho lĩnh vực ${domainNames[profile.domain]}, có sẵn ${profile.sections.length} phần nội dung đã chọn.`;
}

function userInitials(name?: string | null): string {
  const clean = (name || '').trim();
  if (!clean) return 'K';
  return (
    clean
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? '')
      .join('') || 'K'
  );
}

function readUrlSeedParams(): { remixSlug: string | null; showcaseId: string | null } {
  if (typeof window === 'undefined') return { remixSlug: null, showcaseId: null };
  try {
    const params = new URLSearchParams(window.location.search);
    return {
      remixSlug: params.get('remix')?.trim() || null,
      showcaseId: params.get('showcase')?.trim() || null,
    };
  } catch {
    return { remixSlug: null, showcaseId: null };
  }
}

function pickInitialOpenTabs(projectFiles: WorkspaceFile[]): {
  activePath: string;
  tabs: string[];
} {
  const paths = projectFiles.map((f) => f.path);
  const preferred = [
    paths.find((p) => /^(src\/)?app\.(tsx|jsx)$/i.test(p)),
    paths.find((p) => p.toLowerCase() === 'index.html'),
    paths.find((p) => /^(src\/)?styles\.css$/i.test(p)),
    paths.find((p) => /^(src\/)?(app\.js|data\.ts)$/i.test(p)),
  ].filter((p): p is string => Boolean(p));

  const tabs = Array.from(new Set(preferred)).slice(0, 4);
  if (tabs.length === 0 && paths[0]) {
    tabs.push(paths[0]);
  }
  return {
    activePath: tabs[0] || '',
    tabs,
  };
}

function buildFileTraceRows(projectFiles: WorkspaceFile[], action: 'create' | 'edit' = 'create'): AgentTraceStep[] {
  return projectFiles
    .filter((f) => f.path !== 'metadata.json')
    .map((f, idx) => ({
      id: `tr-f-${Date.now()}-${idx}`,
      kind: action === 'edit' ? 'file_edit' : 'file_create',
      label: `${action === 'edit' ? 'Edited' : 'Created'} ${f.path}`,
      detail: f.path,
      added: f.content.split('\n').length,
      removed: 0,
      status: 'done' as const,
    }));
}

export const WorkspaceView: React.FC = () => {
  const {
    currentUser,
    aiRuntime,
    theme,
    navigate,
    addToast,
    setAuthModalOpen,
    settings,
    updateSettings,
    pendingWorkspaceSeed,
    clearWorkspaceSeed,
    onboardingProfile,
    setOnboardingProfile,
    behaviorScores,
    recordSignal,
  } = useAppStore();

  const initialUrlSeed = useRef(readUrlSeedParams());
  const hasAnySeedOnMount = Boolean(
    pendingWorkspaceSeed ||
      initialUrlSeed.current.remixSlug ||
      initialUrlSeed.current.showcaseId
  );

  const [showOnboarding, setShowOnboarding] = useState<boolean>(
    () => !onboardingProfile && !hasAnySeedOnMount
  );
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<'chat' | 'preview'>('chat');
  const [splitRatio, setSplitRatio] = useState(0.39);
  const [draggingSplit, setDraggingSplit] = useState(false);
  const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview');

  const [messages, setMessages] = useState<AgentChatMessage[]>([]);
  const [files, setFiles] = useState<WorkspaceFile[]>([]);
  const [debouncedFiles, setDebouncedFiles] = useState<WorkspaceFile[]>([]);
  const [activeFilePath, setActiveFilePath] = useState<string>('');
  const [openTabs, setOpenTabs] = useState<string[]>([]);
  const [modifiedPaths, setModifiedPaths] = useState<Set<string>>(() => new Set());

  const [blueprint, setBlueprint] = useState<ComposerBlueprint | null>(null);
  const [history, setHistory] = useState<HistorySnapshot[]>([]);
  const [matchedResources, setMatchedResources] = useState<MatchedVaultResource[]>([]);
  const [activeShowcaseId, setActiveShowcaseId] = useState<string | null>(null);
  const [publishedSlug, setPublishedSlug] = useState<string | null>(null);

  const [busy, setBusy] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastPrompt, setLastPrompt] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>(() =>
    settings.byok?.enabled && settings.byok.model.trim()
      ? settings.byok.model.trim()
      : aiRuntime?.defaultModel || 'openrouter/auto-smart'
  );

  // Sync default server model when Admin switches OpenRouter <-> Gemini and BYOK is off
  useEffect(() => {
    if (settings.byok?.enabled && settings.byok.apiKey.trim()) return;
    if (!aiRuntime?.defaultModel) return;
    setSelectedModel((prev) => {
      const stillValid = aiRuntime.availableModels.some((m) => m.id === prev);
      return stillValid ? prev : aiRuntime.defaultModel;
    });
  }, [aiRuntime, settings.byok?.enabled, settings.byok?.apiKey]);

  const splitContainerRef = useRef<HTMLDivElement | null>(null);
  const urlSeedHandledRef = useRef(false);
  const debounceTimerRef = useRef<number | null>(null);

  const commitProjectFilesImmediate = useCallback((nextFiles: WorkspaceFile[], focusPath?: string) => {
    if (debounceTimerRef.current !== null) {
      window.clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    const sorted = sortProjectFiles(nextFiles);
    setFiles(sorted);
    setDebouncedFiles(sorted);
    setModifiedPaths(new Set());
    const initTabs = pickInitialOpenTabs(sorted);
    const chosen = focusPath && sorted.some((f) => f.path === focusPath) ? focusPath : initTabs.activePath;
    setActiveFilePath(chosen);
    setOpenTabs(
      chosen && !initTabs.tabs.includes(chosen)
        ? [chosen, ...initTabs.tabs].slice(0, 5)
        : initTabs.tabs
    );
  }, []);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current !== null) {
        window.clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const bundleResult = useMemo(
    () => bundleProjectFiles(debouncedFiles, { enableConsoleBridge: true, previewId: activeShowcaseId || 'ws' }),
    [debouncedFiles, activeShowcaseId]
  );

  const loadShowcaseProduct = useCallback(
    (product: AgentShowcaseProduct) => {
      setShowOnboarding(false);
      setActiveShowcaseId(product.id);
      setPublishedSlug(null);
      setErrorMessage(null);
      setOnboardingProfile(product.profile);

      const bp = getShowcaseBlueprintById(product.id);
      const projectFiles = splitHtmlToProjectFiles(product.html, {
        title: product.title,
        domain: product.profile.domain,
        personality: product.profile.personality,
        motionSignature: product.motionSignature,
        sources: product.sourceRefs,
      });

      setBlueprint(bp);
      commitProjectFilesImmediate(projectFiles);
      setHistory([
        {
          files: projectFiles,
          blueprint: bp,
          activeFilePath: projectFiles[0]?.path || 'index.html',
        },
      ]);
      setMatchedResources(product.sourceRefs);
      setLastPrompt(product.userPrompt);

      const nonFileTrace = product.trace.filter(
        (step) => step.kind !== 'file_create' && step.kind !== 'file_edit'
      );
      const multiFileTrace: AgentTraceStep[] = [
        ...nonFileTrace.filter((s) => s.kind !== 'check'),
        ...buildFileTraceRows(projectFiles, 'create'),
        ...nonFileTrace.filter((s) => s.kind === 'check'),
      ];

      const now = new Date().toISOString();
      setMessages([
        {
          id: `u-${Date.now()}`,
          role: 'user',
          text: product.userPrompt,
          createdAt: now,
        },
        {
          id: `a-${Date.now() + 1}`,
          role: 'assistant',
          text: `Đã mở mẫu "${product.title}" (${product.categoryLabel}) gồm ${projectFiles.length} tệp. Chuyển sang Code để chỉnh trực tiếp từng tệp hoặc nhắn bên dưới để đổi giao diện.`,
          createdAt: now,
          trace: multiFileTrace,
          matchedResources: product.sourceRefs,
          motionSignature: product.motionSignature,
          fileCreated: 'index.html',
          durationMs: 420,
        },
      ]);

      product.sourceRefs.forEach((ref) => recordSignal(ref.id, 'use', ref.library));
      setMobileTab('preview');
    },
    [commitProjectFilesImmediate, recordSignal, setOnboardingProfile]
  );

  const canUseAi = Boolean(currentUser) || Boolean(settings.byok?.enabled && settings.byok.apiKey.trim());

  const runCompose = useCallback(
    async (
      promptText: string,
      opts?: {
        profileOverride?: OnboardingProfile;
        resetCurrent?: boolean;
        forceVariation?: boolean;
        excludeIds?: string[];
        seedItemId?: string;
        allowGuestPreview?: boolean;
      }
    ) => {
      const cleanPrompt = promptText.trim();
      if (!cleanPrompt) return;

      if (!canUseAi && !opts?.allowGuestPreview) {
        addToast({
          type: 'info',
          title: 'Cần đăng nhập để dùng AI',
          message:
            'Tính năng AI tạo và chỉnh sửa dự án chỉ mở cho tài khoản đã đăng nhập. Bạn vẫn có thể xem trước 15 mẫu và sửa mã trong mục Code.',
        });
        setAuthModalOpen(true);
        return;
      }

      const activeProfile = opts?.profileOverride ?? onboardingProfile ?? buildDefaultProfile();
      const now = new Date().toISOString();

      setShowOnboarding(false);
      setBusy(true);
      setErrorMessage(null);
      setLastPrompt(cleanPrompt);
      if (!opts?.forceVariation) {
        setMessages((prev) => [
          ...(opts?.resetCurrent ? [] : prev),
          {
            id: `u-${Date.now()}`,
            role: 'user',
            text: cleanPrompt,
            createdAt: now,
          },
        ]);
      }

      try {
        const recentChatHistory = messages
          .slice(-4)
          .map((m) => ({ role: m.role, content: m.text }));

        const result = await composeWithAgent({
          prompt: cleanPrompt,
          profile: activeProfile,
          previousHtml: opts?.resetCurrent ? null : bundleResult.standaloneHtml || null,
          previousFiles: opts?.resetCurrent ? [] : files,
          previousBlueprint: opts?.resetCurrent ? null : blueprint,
          behaviorScores,
          excludeIds: opts?.excludeIds,
          seedItemId: opts?.seedItemId,
          forceVariation: opts?.forceVariation,
          isAuthenticated: Boolean(currentUser),
          byok: settings.byok,
          model: selectedModel,
          chatHistory: recentChatHistory,
        });

        if (result.mode === 'assistant') {
          setMessages((prev) => [
            ...prev,
            {
              id: `a-${Date.now()}`,
              role: 'assistant',
              mode: 'assistant',
              text: result.summaryText,
              createdAt: new Date().toISOString(),
              modelUsed: result.modelUsed,
              tokensTotal: result.tokensTotal,
              estimatedCostUsd: result.estimatedCostUsd,
              suggestedResources: result.suggestedResources,
              trace: result.trace,
              matchedResources: result.matchedResources,
              durationMs: result.durationMs,
            },
          ]);
          setMobileTab('chat');
          return;
        }

        const preferredFocus =
          result.changedFiles.find((d) => /\.(tsx|jsx|html|css|js)$/i.test(d.path))?.path ||
          result.files[0]?.path;

        commitProjectFilesImmediate(result.files, preferredFocus);
        setBlueprint(result.blueprint);
        setMatchedResources(result.matchedResources);
        setPublishedSlug(null);
        setHistory((prev) => [
          ...(opts?.resetCurrent ? [] : prev.slice(-14)),
          {
            files: result.files,
            blueprint: result.blueprint,
            activeFilePath: preferredFocus || 'index.html',
          },
        ]);

        setMessages((prev) => [
          ...prev,
          {
            id: `a-${Date.now()}`,
            role: 'assistant',
            mode: 'build',
            text: result.summaryText,
            createdAt: new Date().toISOString(),
            modelUsed: result.modelUsed,
            tokensTotal: result.tokensTotal,
            estimatedCostUsd: result.estimatedCostUsd,
            trace: result.trace,
            matchedResources: result.matchedResources,
            motionSignature: result.motionSignature,
            fileCreated: preferredFocus || 'index.html',
            durationMs: result.durationMs,
          },
        ]);

        result.matchedResources.forEach((m) => recordSignal(m.id, 'use', m.library));
        setMobileTab('preview');
      } catch (err) {
        const msg =
          err instanceof Error && err.message
            ? err.message
            : 'Không dựng được dự án. Vui lòng thử lại.';
        setErrorMessage(msg);
      } finally {
        setBusy(false);
      }
    },
    [
      addToast,
      behaviorScores,
      blueprint,
      bundleResult.standaloneHtml,
      canUseAi,
      commitProjectFilesImmediate,
      currentUser,
      files,
      messages,
      onboardingProfile,
      recordSignal,
      setAuthModalOpen,
      settings.byok,
      selectedModel,
    ]
  );

  // Consume pendingWorkspaceSeed pushed by Explore / Community / Showcase cards
  useEffect(() => {
    if (!pendingWorkspaceSeed) return;
    const seed = pendingWorkspaceSeed;
    clearWorkspaceSeed();
    setShowOnboarding(false);
    setActiveShowcaseId(null);

    if (seed.kind === 'showcase-15') {
      const found = AGENT_SHOWCASE_15.find(
        (item) => item.id === seed.id || item.slug === seed.id
      );
      if (found) {
        loadShowcaseProduct(found);
        return;
      }
    }

    if (seed.kind === 'remix-page') {
      const hydrateRemix = async () => {
        setBusy(true);
        setErrorMessage(null);
        try {
          let remixHtml = seed.html || '';
          let remixTitle = seed.title;
          let remixProfile = buildDefaultProfile({
            ...seed.profile,
            siteName: seed.title,
          });
          if (!remixHtml && seed.id) {
            try {
              const res = await apiClient.getPublishedPage(seed.id);
              if (res?.page) {
                remixHtml = res.page.html;
                remixTitle = res.page.title;
                remixProfile = buildDefaultProfile({
                  siteName: res.page.title,
                  domain: domainFromCategory(res.page.category),
                  personality: res.page.personality,
                });
              }
            } catch {
              const fallbackShowcase = AGENT_SHOWCASE_15.find(
                (item) => item.slug === seed.id || item.id === seed.id
              );
              if (fallbackShowcase) {
                loadShowcaseProduct(fallbackShowcase);
                return;
              }
            }
          }
          if (remixHtml) {
            const bp = createInitialBlueprint(remixProfile, seed.prompt || remixTitle, []);
            const projectFiles = splitHtmlToProjectFiles(remixHtml, {
              title: remixTitle,
              domain: remixProfile.domain,
              personality: remixProfile.personality,
            });
            setOnboardingProfile(remixProfile);
            commitProjectFilesImmediate(projectFiles);
            setBlueprint(bp);
            setHistory([
              {
                files: projectFiles,
                blueprint: bp,
                activeFilePath: projectFiles[0]?.path || 'index.html',
              },
            ]);
            setPublishedSlug(null);
            const now = new Date().toISOString();
            setMessages([
              {
                id: `u-${Date.now()}`,
                role: 'user',
                text: seed.prompt || `Nhân bản và tùy biến từ "${remixTitle}"`,
                createdAt: now,
              },
              {
                id: `a-${Date.now() + 1}`,
                role: 'assistant',
                text: `Đã tách bản gốc "${remixTitle}" thành ${projectFiles.length} tệp trong Workspace. Bạn có thể sửa mã trực tiếp hoặc nhắn yêu cầu mới.`,
                createdAt: now,
                trace: buildFileTraceRows(projectFiles, 'create'),
                fileCreated: 'index.html',
                durationMs: 300,
              },
            ]);
            recordSignal(seed.id, 'use', seed.sourceLibrary);
            setMobileTab('preview');
          } else {
            await runCompose(seed.prompt || `Tạo trang "${seed.title}"`, {
              profileOverride: remixProfile,
              resetCurrent: true,
              allowGuestPreview: true,
            });
          }
        } finally {
          setBusy(false);
        }
      };
      void hydrateRemix();
      return;
    }

    const mergedProfile = buildDefaultProfile({
      ...(onboardingProfile ?? {}),
      ...(seed.profile ?? {}),
      siteName: seed.profile?.siteName || seed.title,
    });
    setOnboardingProfile(mergedProfile);
    void runCompose(
      seed.prompt || `Dựng trang web lấy cảm hứng từ mẫu "${seed.title}"`,
      {
        profileOverride: mergedProfile,
        resetCurrent: true,
        seedItemId: seed.id,
        allowGuestPreview: true,
      }
    );
  }, [
    clearWorkspaceSeed,
    commitProjectFilesImmediate,
    loadShowcaseProduct,
    onboardingProfile,
    pendingWorkspaceSeed,
    recordSignal,
    runCompose,
    setOnboardingProfile,
  ]);

  // Handle direct URL query seeds (?remix=<slug> or ?showcase=<id>) once on mount
  useEffect(() => {
    if (urlSeedHandledRef.current || pendingWorkspaceSeed) return;
    const { remixSlug, showcaseId } = initialUrlSeed.current;
    if (!remixSlug && !showcaseId) return;
    urlSeedHandledRef.current = true;

    if (showcaseId) {
      const target = AGENT_SHOWCASE_15.find(
        (item) => item.id === showcaseId || item.slug === showcaseId
      );
      if (target) {
        loadShowcaseProduct(target);
        return;
      }
    }

    if (remixSlug) {
      const loadFromSlug = async () => {
        setShowOnboarding(false);
        setBusy(true);
        try {
          const res = await apiClient.getPublishedPage(remixSlug);
          if (res?.page) {
            const prof = buildDefaultProfile({
              siteName: res.page.title,
              domain: domainFromCategory(res.page.category),
              personality: res.page.personality,
            });
            const bp = createInitialBlueprint(prof, res.page.summary || res.page.title, []);
            const projectFiles = splitHtmlToProjectFiles(res.page.html, {
              title: res.page.title,
              domain: prof.domain,
              personality: prof.personality,
            });
            setOnboardingProfile(prof);
            commitProjectFilesImmediate(projectFiles);
            setBlueprint(bp);
            setHistory([
              {
                files: projectFiles,
                blueprint: bp,
                activeFilePath: projectFiles[0]?.path || 'index.html',
              },
            ]);
            setMessages([
              {
                id: `u-${Date.now()}`,
                role: 'user',
                text: `Remix trang "${res.page.title}" (/p/${remixSlug})`,
                createdAt: new Date().toISOString(),
              },
              {
                id: `a-${Date.now() + 1}`,
                role: 'assistant',
                text: `Đã nạp bản sao "${res.page.title}" gồm ${projectFiles.length} tệp. Bạn có thể sửa mã trực tiếp hoặc nhắn bên dưới để tùy biến.`,
                createdAt: new Date().toISOString(),
                trace: buildFileTraceRows(projectFiles, 'create'),
                fileCreated: 'index.html',
                durationMs: 320,
              },
            ]);
            setMobileTab('preview');
            void apiClient.remixPublishedPage(remixSlug).catch(() => undefined);
            return;
          }
        } catch {
          const localMatch = AGENT_SHOWCASE_15.find((s) => s.slug === remixSlug);
          if (localMatch) {
            loadShowcaseProduct(localMatch);
            return;
          }
          addToast({
            type: 'warning',
            title: 'Không tìm thấy bản Remix',
            message: 'Bạn có thể tạo mới hoặc chọn trong 15 mẫu Agent.',
          });
        } finally {
          setBusy(false);
        }
      };
      void loadFromSlug();
    }
  }, [addToast, commitProjectFilesImmediate, loadShowcaseProduct, pendingWorkspaceSeed, setOnboardingProfile]);

  const handleCompleteOnboarding = (profile: OnboardingProfile) => {
    setOnboardingProfile(profile);
    setShowOnboarding(false);
    setActiveShowcaseId(null);
    void runCompose(buildAutoPromptFromProfile(profile), {
      profileOverride: profile,
      resetCurrent: true,
      allowGuestPreview: true,
    });
  };

  const handleSkipOnboarding = () => {
    setShowOnboarding(false);
  };

  const handleSelectFile = useCallback((filePath: string) => {
    setActiveFilePath(filePath);
    setOpenTabs((prev) => (prev.includes(filePath) ? prev : [...prev, filePath]));
  }, []);

  const handleCloseTab = useCallback(
    (filePath: string) => {
      setOpenTabs((prev) => {
        const next = prev.filter((p) => p !== filePath);
        if (next.length === 0) return prev;
        if (activeFilePath === filePath) {
          setActiveFilePath(next[next.length - 1]);
        }
        return next;
      });
    },
    [activeFilePath]
  );

  const handleChangeFileContent = useCallback((filePath: string, nextContent: string) => {
    const now = new Date().toISOString();
    setFiles((prev) => {
      const updated = prev.map((f) =>
        f.path === filePath ? { ...f, content: nextContent, updatedAt: now } : f
      );
      if (debounceTimerRef.current !== null) {
        window.clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = window.setTimeout(() => {
        setDebouncedFiles(updated);
        debounceTimerRef.current = null;
      }, 280);
      return updated;
    });
    setModifiedPaths((prev) => {
      const next = new Set(prev);
      next.add(filePath);
      return next;
    });
    setPublishedSlug(null);
  }, []);

  const handleCreateFile = useCallback(
    (rawPath: string) => {
      const safePath = sanitizeVirtualPath(rawPath);
      if (!safePath) return;
      if (files.some((f) => f.path.toLowerCase() === safePath.toLowerCase())) {
        addToast({ type: 'warning', title: 'Tệp đã tồn tại', message: safePath });
        return;
      }
      const newFile: WorkspaceFile = {
        path: safePath,
        content: createStarterFileContent(safePath),
        language: detectLanguageFromPath(safePath),
        summary: 'Tạo thủ công trong Workspace',
        updatedAt: new Date().toISOString(),
      };
      const nextFiles = sortProjectFiles([...files, newFile]);
      setFiles(nextFiles);
      setDebouncedFiles(nextFiles);
      setActiveFilePath(safePath);
      setOpenTabs((prev) => (prev.includes(safePath) ? prev : [...prev, safePath]));
      setHistory((prev) => [
        ...prev.slice(-14),
        { files: nextFiles, blueprint, activeFilePath: safePath },
      ]);
      addToast({ type: 'success', title: `Đã tạo tệp ${safePath}` });
    },
    [addToast, blueprint, files]
  );

  const handleDeleteFile = useCallback(
    (filePath: string) => {
      if (files.length <= 1 || filePath.toLowerCase() === 'index.html') return;
      const nextFiles = files.filter((f) => f.path !== filePath);
      setFiles(nextFiles);
      setDebouncedFiles(nextFiles);
      setOpenTabs((prev) => {
        const nextTabs = prev.filter((p) => p !== filePath);
        return nextTabs.length > 0 ? nextTabs : [nextFiles[0].path];
      });
      if (activeFilePath === filePath) {
        setActiveFilePath(nextFiles[0]?.path || '');
      }
      setModifiedPaths((prev) => {
        const next = new Set(prev);
        next.delete(filePath);
        return next;
      });
      setHistory((prev) => [
        ...prev.slice(-14),
        { files: nextFiles, blueprint, activeFilePath: nextFiles[0]?.path || '' },
      ]);
      addToast({ type: 'info', title: `Đã xóa ${filePath}` });
    },
    [activeFilePath, addToast, blueprint, files]
  );

  const handleInspectFile = useCallback(
    (targetPath?: string) => {
      if (targetPath) {
        const matched = files.find(
          (f) => f.path === targetPath || f.path.endsWith(`/${targetPath}`)
        );
        if (matched) {
          handleSelectFile(matched.path);
        }
      }
      setViewMode('code');
      setMobileTab('preview');
    },
    [files, handleSelectFile]
  );

  const handleUndo = () => {
    if (history.length <= 1) return;
    const trimmed = history.slice(0, -1);
    const prevSnap = trimmed[trimmed.length - 1];
    setHistory(trimmed);
    commitProjectFilesImmediate(prevSnap.files, prevSnap.activeFilePath);
    setBlueprint(prevSnap.blueprint);
    setPublishedSlug(null);
    addToast({ type: 'info', title: 'Đã quay lại bản trước' });
  };

  const handleFeedback = (messageId: string, value: 'yes' | 'no' | 'keep_working') => {
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, feedback: value } : m))
    );
    if (value === 'yes') {
      matchedResources.forEach((m) => recordSignal(m.id, 'satisfied', m.library));
      addToast({
        type: 'success',
        title: 'Đã ghi nhận đánh giá',
        message: 'Hệ thống ưu tiên các bố cục tương tự cho lần dựng sau.',
      });
    } else if (value === 'no') {
      matchedResources.forEach((m) => recordSignal(m.id, 'unsatisfied', m.library));
      void runCompose(
        lastPrompt || 'Tạo phương án trình bày mới gọn và rõ hơn',
        {
          forceVariation: true,
          excludeIds: matchedResources.map((m) => m.id),
        }
      );
    }
  };

  const handlePublish = async () => {
    const htmlToPublish = bundleResult.standaloneHtml;
    if (!htmlToPublish || publishing) return;
    setPublishing(true);
    const activeProfile = blueprint?.profile ?? onboardingProfile ?? buildDefaultProfile();
    const title = blueprint?.heroTitle || activeProfile.siteName || 'Trang Web F-Forum';
    const summary =
      blueprint?.heroSubtitle ||
      `Dự án dựng trên F-Forum Workspace (${activeProfile.domain}).`;

    try {
      const res = await apiClient.publishPage({
        title,
        summary,
        category: mapDomainToCategory(activeProfile.domain),
        personality: activeProfile.personality,
        html: htmlToPublish,
        sourceIds: matchedResources.map((m) => m.id),
        authorName: currentUser?.name || 'Thành viên F-Forum',
        authorRole: activeProfile.role,
        slug: publishedSlug || undefined,
      });

      const slug = res.page.slug;
      setPublishedSlug(slug);
      matchedResources.forEach((m) => recordSignal(m.id, 'publish', m.library));

      const fullUrl =
        typeof window !== 'undefined'
          ? `${window.location.origin}/p/${slug}`
          : `https://fforum3.vercel.app/p/${slug}`;
      try {
        await navigator.clipboard.writeText(fullUrl);
      } catch {
        // Ignore clipboard denial on non-HTTPS or headless contexts
      }

      addToast({
        type: 'success',
        title: 'Đã xuất bản trang công khai',
        message: fullUrl,
      });
    } catch {
      const fallbackSlug =
        title
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/đ/g, 'd')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '')
          .slice(0, 42) || 'trang-moi';
      addToast({
        type: 'warning',
        title: 'Máy chủ xuất bản tạm bận',
        message: `Bạn vẫn có thể bấm Xuất ZIP để tải gói ${fallbackSlug}.zip về máy.`,
      });
    } finally {
      setPublishing(false);
    }
  };

  if (showOnboarding) {
    return (
      <>
        <OnboardingWizard
          initialProfile={onboardingProfile}
          theme={theme}
          onComplete={handleCompleteOnboarding}
          onSkip={handleSkipOnboarding}
          onNavigateHome={() => navigate('home')}
          onOpenShowcase={() => setDrawerOpen(true)}
        />
        <Showcase15Drawer
          open={drawerOpen}
          activeId={activeShowcaseId}
          onClose={() => setDrawerOpen(false)}
          onSelect={loadShowcaseProduct}
        />
      </>
    );
  }

  return (
    <div className="ws-shell">
      <header
        className="ws-topbar lg-chrome"
        onPointerMove={handleLiquidPointerMove}
        onPointerLeave={handleLiquidPointerLeave}
      >
        <div className="ws-topbar__left">
          <button
            type="button"
            className="ws-brandBtn"
            onClick={() => navigate('home')}
            aria-label="F-Forum, về trang chủ"
            title="Trang chủ"
          >
            <KineticLogo size={22} activity={busy ? 'streaming' : 'idle'} showWordmark />
          </button>

          <nav className="ws-nav" aria-label="Điều hướng chính">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`ws-nav__link${item.id === 'workspace' ? ' is-active' : ''}`}
                aria-current={item.id === 'workspace' ? 'page' : undefined}
                onClick={() => navigate(item.id)}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="ws-topbar__right">
          <button
            type="button"
            className="ws-pillBtn"
            onClick={() => setDrawerOpen(true)}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="3" width="7" height="7" rx="1.5" />
              <rect x="14" y="3" width="7" height="7" rx="1.5" />
              <rect x="3" y="14" width="7" height="7" rx="1.5" />
              <rect x="14" y="14" width="7" height="7" rx="1.5" />
            </svg>
            <span>15 mẫu<span className="ws-hideSm"> Agent</span></span>
          </button>

          <button
            type="button"
            className="ws-iconBtn ws-hideMobileTopbar"
            onClick={() => setShowOnboarding(true)}
            aria-label="Thiết lập lại 5 bước"
            title="Thiết lập 5 bước"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="4" y1="21" x2="4" y2="14" />
              <line x1="4" y1="10" x2="4" y2="3" />
              <line x1="12" y1="21" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12" y2="3" />
              <line x1="20" y1="21" x2="20" y2="16" />
              <line x1="20" y1="12" x2="20" y2="3" />
              <line x1="2" y1="14" x2="6" y2="14" />
              <line x1="10" y1="8" x2="14" y2="8" />
              <line x1="18" y1="16" x2="22" y2="16" />
            </svg>
          </button>

          <button
            type="button"
            className="ws-iconBtn ws-hideMobileTopbar"
            onClick={(e) => triggerPinuiThemeToggle(e.currentTarget)}
            aria-label={theme === 'dark' ? 'Chuyển sang nền sáng' : 'Chuyển sang nền tối'}
            title={theme === 'dark' ? 'Nền sáng' : 'Nền tối'}
          >
            {theme === 'dark' ? (
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
              </svg>
            ) : (
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>

          <button
            type="button"
            className="ws-avatarBtn"
            onClick={() => (currentUser ? navigate('profile') : setAuthModalOpen(true))}
            aria-label={currentUser ? `Hồ sơ ${currentUser.name}` : 'Đăng nhập tài khoản'}
            title={currentUser ? currentUser.name : 'Đăng nhập'}
          >
            {userInitials(currentUser?.name)}
          </button>

          <button
            type="button"
            className="ws-iconBtn ws-mobileMenuBtn"
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-expanded={mobileMenuOpen}
            aria-label="Mở menu điều hướng"
            title="Menu"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="4" y1="7" x2="20" y2="7" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="17" x2="20" y2="17" />
            </svg>
          </button>
        </div>
      </header>

      {mobileMenuOpen && (
        <nav className="ws-mobileNav" aria-label="Điều hướng di động">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`ws-nav__link${item.id === 'workspace' ? ' is-active' : ''}`}
              onClick={() => {
                setMobileMenuOpen(false);
                navigate(item.id);
              }}
            >
              {item.label}
            </button>
          ))}
          <button
            type="button"
            className="ws-nav__link"
            onClick={() => {
              setMobileMenuOpen(false);
              setShowOnboarding(true);
            }}
          >
            Thiết lập 5 bước
          </button>
          <button
            type="button"
            className="ws-nav__link"
            onClick={(e) => {
              setMobileMenuOpen(false);
              triggerPinuiThemeToggle(e.currentTarget);
            }}
          >
            {theme === 'dark' ? 'Nền sáng' : 'Nền tối'}
          </button>
        </nav>
      )}

      <div className="ws-mobileTabs" role="tablist" aria-label="Chuyển khung làm việc">
        <button
          type="button"
          role="tab"
          aria-selected={mobileTab === 'chat'}
          className={`ws-mobileTab${mobileTab === 'chat' ? ' is-active' : ''}`}
          onClick={() => setMobileTab('chat')}
        >
          Chat AI
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mobileTab === 'preview'}
          className={`ws-mobileTab${mobileTab === 'preview' ? ' is-active' : ''}`}
          onClick={() => setMobileTab('preview')}
        >
          Preview / Code
        </button>
      </div>

      <div className="ws-split" ref={splitContainerRef}>
        <div
          className={`ws-pane ws-pane--left lg-bento-shell${mobileTab === 'preview' ? ' is-mobileHidden' : ''}`}
          style={{ width: `${splitRatio * 100}%` }}
        >
          <AgentChatPane
            profile={blueprint?.profile ?? onboardingProfile}
            messages={messages}
            busy={busy}
            errorMessage={errorMessage}
            canUndo={history.length > 1}
            hasGeneratedHtml={files.length > 0}
            canUseAi={canUseAi}
            selectedModel={selectedModel}
            aiRuntime={aiRuntime}
            byok={settings.byok}
            onChangeModel={setSelectedModel}
            onSaveByok={(nextByok) => {
              updateSettings({ byok: nextByok });
              addToast({
                type: 'success',
                title: nextByok.enabled ? 'Đã lưu API Key riêng' : 'Đã chuyển về khóa mặc định',
                message: nextByok.enabled
                  ? `Model: ${nextByok.model}`
                  : `Đang dùng máy chủ mặc định (${aiRuntime?.activeProfile === 'gemini' ? 'Gemini' : 'OpenRouter'}).`,
              });
            }}
            onRequireAuth={() => setAuthModalOpen(true)}
            onSendPrompt={(text) => void runCompose(text)}
            onUseSuggestedResource={(item) =>
              void runCompose(`Lắp ghép trang web sử dụng mẫu "${item.title}" từ thư viện ${item.library}`, {
                seedItemId: item.id,
              })
            }
            onRetryLast={() => void runCompose(lastPrompt || 'Tạo lại dự án web')}
            onUndo={handleUndo}
            onFeedback={handleFeedback}
            onEditOnboarding={() => setShowOnboarding(true)}
            onInspectFile={handleInspectFile}
          />
        </div>

        <SplitDivider
          ratio={splitRatio}
          containerRef={splitContainerRef}
          onChangeRatio={setSplitRatio}
          onDraggingChange={setDraggingSplit}
        />

        <div
          className={`ws-pane ws-pane--right lg-bento-shell${mobileTab === 'chat' ? ' is-mobileHidden' : ''}`}
        >
          <ArenaRunnerPane
            files={files}
            activeFilePath={activeFilePath}
            openTabs={openTabs}
            modifiedPaths={modifiedPaths}
            previewHtml={bundleResult.previewHtml}
            standaloneHtml={bundleResult.standaloneHtml}
            projectMode={bundleResult.mode}
            bundleDiagnostics={bundleResult.diagnostics}
            pageTitle={blueprint?.heroTitle || onboardingProfile?.siteName || 'Dự án mới'}
            publishedSlug={publishedSlug}
            publishing={publishing}
            busy={busy}
            viewMode={viewMode}
            pointerShield={draggingSplit}
            onChangeViewMode={setViewMode}
            onSelectFile={handleSelectFile}
            onCloseTab={handleCloseTab}
            onCreateFile={handleCreateFile}
            onDeleteFile={handleDeleteFile}
            onChangeFileContent={handleChangeFileContent}
            onPublish={() => void handlePublish()}
            onOpenShowcase={() => setDrawerOpen(true)}
            onNotify={(title, message) => addToast({ type: 'info', title, message })}
          />
        </div>
      </div>

      <Showcase15Drawer
        open={drawerOpen}
        activeId={activeShowcaseId}
        onClose={() => setDrawerOpen(false)}
        onSelect={loadShowcaseProduct}
      />
    </div>
  );
};
