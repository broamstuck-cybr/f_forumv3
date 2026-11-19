import type {
  AttachedContextItem,
  ChatMessage,
  ChecksReport,
  ProcessItem,
  WorkspaceFile,
  WorkspaceProject,
  WorkspaceSnapshot,
} from '../src/types/index';
import { computeWorkspaceDiffs } from '../src/services/diffEngine';
import {
  isSupabaseEnabled,
  readLocalSection,
  sbDelete,
  sbSelect,
  sbUpsert,
  writeLocalSection,
} from './persistence';

interface PersistedProjectsMap {
  byUser: Record<string, Record<string, WorkspaceProject>>;
}

const memoryProjectsByUser: Record<string, Record<string, WorkspaceProject>> = {};

function getLocalProjectsForUser(userId: string): Record<string, WorkspaceProject> {
  const persisted = readLocalSection<PersistedProjectsMap>('projectStore', { byUser: {} });
  for (const [uid, map] of Object.entries(persisted.byUser || {})) {
    if (!memoryProjectsByUser[uid]) {
      memoryProjectsByUser[uid] = {};
    }
    for (const [pid, proj] of Object.entries(map || {})) {
      if (!memoryProjectsByUser[uid][pid]) {
        memoryProjectsByUser[uid][pid] = proj;
      }
    }
  }
  if (!memoryProjectsByUser[userId]) {
    memoryProjectsByUser[userId] = {};
  }
  return memoryProjectsByUser[userId];
}

function saveLocalProjects(): void {
  writeLocalSection<PersistedProjectsMap>('projectStore', { byUser: memoryProjectsByUser });
}

function normalizeProjectInput(raw: Partial<WorkspaceProject>): WorkspaceProject | null {
  const id = typeof raw.id === 'string' ? raw.id.trim() : '';
  const name = typeof raw.name === 'string' ? raw.name.trim() : '';
  if (!id || !name) return null;
  const now = new Date().toISOString();
  const files: WorkspaceFile[] = Array.isArray(raw.files) ? raw.files : [];
  const snapshots: WorkspaceSnapshot[] = Array.isArray(raw.snapshots) ? raw.snapshots : [];
  const previousFiles: WorkspaceFile[] =
    Array.isArray(raw.previousFiles) && raw.previousFiles.length > 0
      ? raw.previousFiles
      : files;
  const diffs =
    Array.isArray(raw.diffs) && raw.diffs.length > 0
      ? raw.diffs
      : computeWorkspaceDiffs(previousFiles, files);

  return {
    id,
    name,
    description: typeof raw.description === 'string' ? raw.description : '',
    createdAt: typeof raw.createdAt === 'string' && raw.createdAt ? raw.createdAt : now,
    updatedAt: typeof raw.updatedAt === 'string' && raw.updatedAt ? raw.updatedAt : now,
    activeFilePath:
      typeof raw.activeFilePath === 'string' && raw.activeFilePath
        ? raw.activeFilePath
        : files[0]?.path || 'index.html',
    files,
    previousFiles,
    snapshots,
    messages: Array.isArray(raw.messages) ? raw.messages : [],
    attachedItems: Array.isArray(raw.attachedItems) ? raw.attachedItems : [],
    diffs,
    checksReport: raw.checksReport ?? null,
    processes: Array.isArray(raw.processes) ? raw.processes : [],
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

export async function syncUserProject(
  userId: string,
  rawProject: Partial<WorkspaceProject>
): Promise<WorkspaceProject | null> {
  const normalized = normalizeProjectInput(rawProject);
  if (!normalized) return null;

  if (isSupabaseEnabled()) {
    await sbUpsert('ff_projects', [toProjectRow(userId, normalized)], 'id');
    return normalized;
  }

  const userMap = getLocalProjectsForUser(userId);
  userMap[normalized.id] = normalized;
  saveLocalProjects();
  return normalized;
}

export async function deleteUserProject(userId: string, projectId: string): Promise<boolean> {
  const cleanId = projectId.trim();
  if (!cleanId) return false;

  if (isSupabaseEnabled()) {
    const filter = `id=eq.${encodeURIComponent(cleanId)}&user_id=eq.${encodeURIComponent(userId)}`;
    return sbDelete('ff_projects', filter);
  }

  const userMap = getLocalProjectsForUser(userId);
  if (cleanId in userMap) {
    delete userMap[cleanId];
    saveLocalProjects();
  }
  return true;
}
