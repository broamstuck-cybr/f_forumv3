import type { SettingsState, WorkspaceProject } from '../../types/index';

const PROJECTS_KEY = 'fforum_v3_workspace_projects';
const ACTIVE_PROJECT_KEY = 'fforum_v3_active_project_id';
const SETTINGS_KEY = 'fforum_v3_settings';
const SAVED_ITEMS_KEY = 'fforum_v3_saved_items';
const THEME_KEY = 'fforum_theme';
const LOCAL_PREFIX = 'fforum_v3_';

type PortableSettings = Pick<
  SettingsState,
  'theme' | 'themeEffect' | 'reducedMotion' | 'compactDensity' | 'defaultExportTarget'
>;

export interface BackupPayload {
  exportedAt: string;
  version: string;
  savedItemIds: string[];
  settings: Partial<PortableSettings>;
  projects: WorkspaceProject[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isFileList(value: unknown): boolean {
  return (
    Array.isArray(value) &&
    value.every((file) => isRecord(file) && typeof file.path === 'string' && typeof file.content === 'string')
  );
}

function isProject(value: unknown): value is WorkspaceProject {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.description === 'string' &&
    typeof value.updatedAt === 'string' &&
    typeof value.activeFilePath === 'string' &&
    isFileList(value.files) &&
    isFileList(value.previousFiles) &&
    Array.isArray(value.snapshots) &&
    value.snapshots.every((snapshot) => isRecord(snapshot) && isFileList(snapshot.files)) &&
    Array.isArray(value.messages) &&
    value.messages.every((message) => isRecord(message) && typeof message.content === 'string') &&
    Array.isArray(value.attachedItems) &&
    Array.isArray(value.diffs) &&
    value.diffs.every((entry) => isRecord(entry) && Array.isArray(entry.hunks) && Array.isArray(entry.splitRows)) &&
    Array.isArray(value.processes) &&
    (value.checksReport === null || (isRecord(value.checksReport) && Array.isArray(value.checksReport.results)))
  );
}

function readPortableSettings(value: unknown): Partial<PortableSettings> {
  if (!isRecord(value)) return {};
  const result: Partial<PortableSettings> = {};
  if (value.theme === 'dark' || value.theme === 'light') result.theme = value.theme;
  if (
    value.themeEffect === 'droplet' ||
    value.themeEffect === 'rain' ||
    value.themeEffect === 'diwali' ||
    value.themeEffect === 'none'
  ) {
    result.themeEffect = value.themeEffect;
  }
  if (typeof value.reducedMotion === 'boolean') result.reducedMotion = value.reducedMotion;
  if (typeof value.compactDensity === 'boolean') result.compactDensity = value.compactDensity;
  if (value.defaultExportTarget === 'antigravity' || value.defaultExportTarget === 'cursor') {
    result.defaultExportTarget = value.defaultExportTarget;
  }
  return result;
}

export function buildBackup(
  settings: SettingsState,
  projects: WorkspaceProject[],
  savedItemIds: string[]
): BackupPayload {
  return {
    exportedAt: new Date().toISOString(),
    version: '3.0.0',
    savedItemIds,
    settings: {
      theme: settings.theme,
      themeEffect: settings.themeEffect,
      reducedMotion: settings.reducedMotion,
      compactDensity: settings.compactDensity,
      defaultExportTarget: settings.defaultExportTarget,
    },
    projects,
  };
}

export function downloadBackup(payload: BackupPayload): void {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `f-forum-v3-backup-${payload.exportedAt.slice(0, 10)}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function parseBackup(text: string): BackupPayload | null {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return null;
  }
  if (!isRecord(raw) || !Array.isArray(raw.projects) || raw.projects.length === 0) return null;
  if (!raw.projects.every(isProject)) return null;
  return {
    exportedAt: typeof raw.exportedAt === 'string' ? raw.exportedAt : '',
    version: typeof raw.version === 'string' ? raw.version : '',
    savedItemIds: Array.isArray(raw.savedItemIds)
      ? raw.savedItemIds.filter((id): id is string => typeof id === 'string')
      : [],
    settings: readPortableSettings(raw.settings),
    projects: raw.projects,
  };
}

export function applyBackup(payload: BackupPayload): boolean {
  try {
    const currentRaw = window.localStorage.getItem(SETTINGS_KEY);
    const current: unknown = currentRaw ? JSON.parse(currentRaw) : {};
    window.localStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify({ ...(isRecord(current) ? current : {}), ...payload.settings })
    );
    if (payload.settings.theme) window.localStorage.setItem(THEME_KEY, payload.settings.theme);
    window.localStorage.setItem(PROJECTS_KEY, JSON.stringify(payload.projects));
    window.localStorage.setItem(ACTIVE_PROJECT_KEY, payload.projects[0].id);
    window.localStorage.setItem(SAVED_ITEMS_KEY, JSON.stringify(payload.savedItemIds));
    return true;
  } catch {
    return false;
  }
}

export function clearLocalData(): void {
  const keys: string[] = [];
  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (key && (key.startsWith(LOCAL_PREFIX) || key === THEME_KEY)) keys.push(key);
  }
  for (const key of keys) window.localStorage.removeItem(key);
}
