import type {
  AttachedContextItem,
  ChatMessage,
  ChecksReport,
  ProcessItem,
  WorkspaceFile,
  WorkspaceProject,
  WorkspaceSnapshot,
} from '../src/types/index';
import { computeWorkspaceDiffs } from '../src/services/diffEngine.js';
import {
  isSupabaseEnabled,
  readLocalSection,
  sbDelete,
  sbInsert,
  sbPatch,
  sbSelect,
  writeLocalSection,
} from './persistence.js';

interface PersistedProjectsMap {
  byUser: Record<string, Record<string, WorkspaceProject>>;
}

const RESERVED_PROTOTYPE_KEYS = new Set([
  '__proto__',
  'constructor',
  'prototype',
  'toString',
  'valueOf',
  'hasOwnProperty',
  'toLocaleString',
  'isPrototypeOf',
  'propertyIsEnumerable',
]);

const memoryProjectsByUser: Record<string, Record<string, WorkspaceProject>> = Object.create(
  null
) as Record<string, Record<string, WorkspaceProject>>;

function getLocalProjectsForUser(userId: string): Record<string, WorkspaceProject> {
  if (!userId || RESERVED_PROTOTYPE_KEYS.has(userId)) {
    return Object.create(null) as Record<string, WorkspaceProject>;
  }
  const persisted = readLocalSection<PersistedProjectsMap>('projectStore', { byUser: {} });
  for (const [uid, map] of Object.entries(persisted.byUser || {})) {
    if (!uid || RESERVED_PROTOTYPE_KEYS.has(uid)) continue;
    if (!Object.hasOwn(memoryProjectsByUser, uid)) {
      memoryProjectsByUser[uid] = Object.create(null) as Record<string, WorkspaceProject>;
    }
    for (const [pid, proj] of Object.entries(map || {})) {
      if (!pid || RESERVED_PROTOTYPE_KEYS.has(pid)) continue;
      if (!Object.hasOwn(memoryProjectsByUser[uid], pid)) {
        memoryProjectsByUser[uid][pid] = proj;
      }
    }
  }
  if (!Object.hasOwn(memoryProjectsByUser, userId)) {
    memoryProjectsByUser[userId] = Object.create(null) as Record<string, WorkspaceProject>;
  }
  return memoryProjectsByUser[userId];
}

function saveLocalProjects(): void {
  writeLocalSection<PersistedProjectsMap>('projectStore', { byUser: memoryProjectsByUser });
}

const VALID_WORKSPACE_LANGUAGES = new Set<WorkspaceFile['language']>([
  'html',
  'css',
  'javascript',
  'typescript',
  'json',
  'markdown',
]);

function inferWorkspaceLanguage(filePath: string): WorkspaceFile['language'] {
  const lower = filePath.toLowerCase();
  if (lower.endsWith('.html') || lower.endsWith('.htm')) return 'html';
  if (lower.endsWith('.css')) return 'css';
  if (lower.endsWith('.ts') || lower.endsWith('.tsx')) return 'typescript';
  if (lower.endsWith('.json')) return 'json';
  if (lower.endsWith('.md') || lower.endsWith('.markdown')) return 'markdown';
  return 'javascript';
}

function normalizeWorkspaceFileInput(raw: unknown, fallbackNow: string): WorkspaceFile | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const obj = raw as Record<string, unknown>;
  const filePath = typeof obj.path === 'string' ? obj.path.trim() : '';
  if (!filePath || filePath.length > 260) return null;
  if (typeof obj.content !== 'string') return null;
  if (
    obj.language !== undefined &&
    (typeof obj.language !== 'string' ||
      !VALID_WORKSPACE_LANGUAGES.has(obj.language as WorkspaceFile['language']))
  ) {
    return null;
  }
  if (obj.summary !== undefined && typeof obj.summary !== 'string') {
    return null;
  }
  const language =
    typeof obj.language === 'string'
      ? (obj.language as WorkspaceFile['language'])
      : inferWorkspaceLanguage(filePath);
  const updatedAt =
    typeof obj.updatedAt === 'string' && obj.updatedAt.trim() ? obj.updatedAt : fallbackNow;

  return {
    path: filePath,
    content: obj.content,
    language,
    ...(typeof obj.summary === 'string' ? { summary: obj.summary.slice(0, 500) } : {}),
    updatedAt,
  };
}

function normalizeWorkspaceSnapshotInput(
  raw: unknown,
  fallbackNow: string
): WorkspaceSnapshot | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const obj = raw as Record<string, unknown>;
  const id = typeof obj.id === 'string' ? obj.id.trim() : '';
  if (!id || id.length > 128 || RESERVED_PROTOTYPE_KEYS.has(id)) return null;
  if (typeof obj.label !== 'string' || obj.label.length > 200) return null;
  if (!Array.isArray(obj.files)) return null;
  const files: WorkspaceFile[] = [];
  for (const item of obj.files.slice(0, 50)) {
    const normalizedFile = normalizeWorkspaceFileInput(item, fallbackNow);
    if (!normalizedFile) return null;
    files.push(normalizedFile);
  }
  return {
    id,
    label: obj.label,
    createdAt:
      typeof obj.createdAt === 'string' && obj.createdAt.trim() ? obj.createdAt : fallbackNow,
    files,
  };
}

function normalizeProjectInput(raw: Partial<WorkspaceProject>): WorkspaceProject | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const id = typeof raw.id === 'string' ? raw.id.trim() : '';
  const name = typeof raw.name === 'string' ? raw.name.trim() : '';
  if (!id || !name || id.length > 128 || name.length > 160 || RESERVED_PROTOTYPE_KEYS.has(id)) {
    return null;
  }
  const now = new Date().toISOString();

  if (raw.files !== undefined && !Array.isArray(raw.files)) return null;
  const files: WorkspaceFile[] = [];
  if (Array.isArray(raw.files)) {
    for (const item of raw.files.slice(0, 50)) {
      const normalizedFile = normalizeWorkspaceFileInput(item, now);
      if (!normalizedFile) return null;
      files.push(normalizedFile);
    }
  }

  if (raw.snapshots !== undefined && !Array.isArray(raw.snapshots)) return null;
  const snapshots: WorkspaceSnapshot[] = [];
  if (Array.isArray(raw.snapshots)) {
    for (const snap of raw.snapshots.slice(0, 30)) {
      const normalizedSnap = normalizeWorkspaceSnapshotInput(snap, now);
      if (!normalizedSnap) return null;
      snapshots.push(normalizedSnap);
    }
  }

  if (raw.previousFiles !== undefined && !Array.isArray(raw.previousFiles)) return null;
  let previousFiles: WorkspaceFile[] = files;
  if (Array.isArray(raw.previousFiles) && raw.previousFiles.length > 0) {
    previousFiles = [];
    for (const item of raw.previousFiles.slice(0, 50)) {
      const normalizedFile = normalizeWorkspaceFileInput(item, now);
      if (!normalizedFile) return null;
      previousFiles.push(normalizedFile);
    }
  }

  const diffs =
    Array.isArray(raw.diffs) && raw.diffs.length > 0
      ? raw.diffs
      : computeWorkspaceDiffs(previousFiles, files);

  return {
    id,
    name,
    description: typeof raw.description === 'string' ? raw.description.slice(0, 1000) : '',
    createdAt: typeof raw.createdAt === 'string' && raw.createdAt ? raw.createdAt : now,
    updatedAt: typeof raw.updatedAt === 'string' && raw.updatedAt ? raw.updatedAt : now,
    activeFilePath:
      typeof raw.activeFilePath === 'string' && raw.activeFilePath
        ? raw.activeFilePath.slice(0, 260)
        : files[0]?.path || 'index.html',
    files,
    previousFiles,
    snapshots,
    messages: Array.isArray(raw.messages) ? raw.messages.slice(0, 200) : [],
    attachedItems: Array.isArray(raw.attachedItems) ? raw.attachedItems.slice(0, 50) : [],
    diffs,
    checksReport: raw.checksReport ?? null,
    processes: Array.isArray(raw.processes) ? raw.processes.slice(0, 50) : [],
    pinned: Boolean(raw.pinned),
    archived: Boolean(raw.archived),
  };
}

function toProjectRow(userId: string, project: WorkspaceProject): Record<string, unknown> {
  return {
    id: project.id,
    user_id: userId,
    title: project.name,
    description: project.description || '',
    pinned: Boolean(project.pinned),
    archived: Boolean(project.archived),
    active_file_path: project.activeFilePath || 'index.html',
    files: project.files,
    messages: project.messages,
    attached_items: project.attachedItems,
    snapshots: project.snapshots,
    processes: project.processes,
    checks: project.checksReport,
    created_at: project.createdAt,
    updated_at: project.updatedAt,
  };
}

function fromProjectRow(row: Record<string, unknown>): WorkspaceProject | null {
  const id = typeof row.id === 'string' ? row.id.trim() : '';
  if (!id) return null;
  const files: WorkspaceFile[] = Array.isArray(row.files) ? (row.files as WorkspaceFile[]) : [];
  const snapshots: WorkspaceSnapshot[] = Array.isArray(row.snapshots)
    ? (row.snapshots as WorkspaceSnapshot[])
    : [];
  const baselineFiles = snapshots[0]?.files || files;
  const diffs = computeWorkspaceDiffs(baselineFiles, files);
  const now = new Date().toISOString();

  return {
    id,
    name: typeof row.title === 'string' && row.title.trim() ? row.title.trim() : 'Untitled Project',
    description: typeof row.description === 'string' ? row.description : '',
    createdAt: typeof row.created_at === 'string' && row.created_at ? row.created_at : now,
    updatedAt: typeof row.updated_at === 'string' && row.updated_at ? row.updated_at : now,
    activeFilePath:
      typeof row.active_file_path === 'string' && row.active_file_path
        ? row.active_file_path
        : files[0]?.path || 'index.html',
    files,
    previousFiles: baselineFiles,
    snapshots,
    messages: Array.isArray(row.messages) ? (row.messages as ChatMessage[]) : [],
    attachedItems: Array.isArray(row.attached_items)
      ? (row.attached_items as AttachedContextItem[])
      : [],
    diffs,
    checksReport: (row.checks as ChecksReport | null) ?? null,
    processes: Array.isArray(row.processes) ? (row.processes as ProcessItem[]) : [],
    pinned: Boolean(row.pinned),
    archived: Boolean(row.archived),
  };
}

export async function listUserProjects(userId: string): Promise<WorkspaceProject[]> {
  if (isSupabaseEnabled()) {
    const query = `select=*&user_id=eq.${encodeURIComponent(userId)}&order=updated_at.desc`;
    const rows = await sbSelect<Record<string, unknown>>('ff_projects', query);
    const list: WorkspaceProject[] = [];
    for (const row of rows) {
      const parsed = fromProjectRow(row);
      if (parsed) list.push(parsed);
    }
    return list;
  }

  const userMap = getLocalProjectsForUser(userId);
  return Object.values(userMap).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export type SyncProjectResult =
  | { ok: true; project: WorkspaceProject }
  | { ok: false; reason: 'invalid' | 'forbidden' | 'persistence_error' };

export async function syncUserProject(
  userId: string,
  rawProject: Partial<WorkspaceProject>
): Promise<SyncProjectResult> {
  const normalized = normalizeProjectInput(rawProject);
  if (!normalized) return { ok: false, reason: 'invalid' };

  if (isSupabaseEnabled()) {
    const existing = await sbSelect<{ id: string; user_id: string }>(
      'ff_projects',
      `select=id,user_id&id=eq.${encodeURIComponent(normalized.id)}&limit=1`
    );
    if (existing.length > 0) {
      if (existing[0].user_id !== userId) {
        return { ok: false, reason: 'forbidden' };
      }
      const patched = await sbPatch(
        'ff_projects',
        `id=eq.${encodeURIComponent(normalized.id)}&user_id=eq.${encodeURIComponent(userId)}`,
        toProjectRow(userId, normalized)
      );
      if (!patched) {
        return { ok: false, reason: 'persistence_error' };
      }
      return { ok: true, project: normalized };
    }

    const inserted = await sbInsert('ff_projects', [toProjectRow(userId, normalized)]);
    if (!inserted) {
      const recheck = await sbSelect<{ id: string; user_id: string }>(
        'ff_projects',
        `select=id,user_id&id=eq.${encodeURIComponent(normalized.id)}&limit=1`
      );
      if (recheck.length > 0 && recheck[0].user_id !== userId) {
        return { ok: false, reason: 'forbidden' };
      }
      return { ok: false, reason: 'persistence_error' };
    }
    return { ok: true, project: normalized };
  }

  const userMap = getLocalProjectsForUser(userId);
  for (const [ownerId, ownerProjects] of Object.entries(memoryProjectsByUser)) {
    if (ownerId !== userId && Object.hasOwn(ownerProjects, normalized.id)) {
      return { ok: false, reason: 'forbidden' };
    }
  }
  userMap[normalized.id] = normalized;
  saveLocalProjects();
  return { ok: true, project: normalized };
}

export async function deleteUserProject(userId: string, projectId: string): Promise<boolean> {
  const cleanId = projectId.trim();
  if (!cleanId || RESERVED_PROTOTYPE_KEYS.has(cleanId)) return false;

  if (isSupabaseEnabled()) {
    const filter = `id=eq.${encodeURIComponent(cleanId)}&user_id=eq.${encodeURIComponent(userId)}`;
    return sbDelete('ff_projects', filter);
  }

  const userMap = getLocalProjectsForUser(userId);
  if (Object.hasOwn(userMap, cleanId)) {
    delete userMap[cleanId];
    saveLocalProjects();
  }
  return true;
}
