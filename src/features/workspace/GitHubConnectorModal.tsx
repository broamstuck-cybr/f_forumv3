import React, { useMemo, useState } from 'react';
import { X } from 'lucide-react';
import type { AttachedContextItem, WorkspaceProject } from '../../types/index';
import { Modal } from './Modal';

export interface GitHubConnectorModalProps {
  open: boolean;
  onClose: () => void;
  project: WorkspaceProject;
  onInjectFiles: (files: Array<{ path: string; content: string; summary?: string }>) => void;
  onAttachRepo: (item: AttachedContextItem) => void;
}

interface GitHubRepoSummary {
  full_name: string;
  description: string | null;
  default_branch: string;
  stargazers_count: number;
  html_url: string;
  language: string | null;
}

interface GitHubContentItem {
  name: string;
  path: string;
  type: 'file' | 'dir';
  size: number;
  download_url: string | null;
}

const IMPORTABLE_EXT = /\.(html|css|js|mjs|ts|tsx|json|md)$/i;

function parseRepoSlug(raw: string): { owner: string; repo: string } | null {
  const cleaned = raw.trim().replace(/^https?:\/\/github\.com\//i, '').replace(/\.git$/i, '');
  const parts = cleaned.split('/').filter(Boolean);
  if (parts.length < 2) return null;
  const owner = parts[0].replace(/[^A-Za-z0-9_.-]/g, '');
  const repo = parts[1].replace(/[^A-Za-z0-9_.-]/g, '');
  if (!owner || !repo) return null;
  return { owner, repo };
}

function buildDeployWorkflow(projectName: string): string {
  const safeName = projectName.replace(/[^\w\s-]/g, '').trim() || 'workspace-site';
  return [
    `name: Deploy ${safeName}`,
    '',
    'on:',
    '  push:',
    '    branches: [main]',
    '  workflow_dispatch:',
    '',
    'permissions:',
    '  contents: read',
    '  pages: write',
    '  id-token: write',
    '',
    'jobs:',
    '  deploy:',
    '    environment:',
    '      name: github-pages',
    '      url: ${{ steps.deployment.outputs.page_url }}',
    '    runs-on: ubuntu-latest',
    '    steps:',
    '      - uses: actions/checkout@v4',
    '      - uses: actions/configure-pages@v5',
    '      - uses: actions/upload-pages-artifact@v3',
    '        with:',
    "          path: '.'",
    '      - id: deployment',
    '        uses: actions/deploy-pages@v4',
  ].join('\n');
}

export const GitHubConnectorModal: React.FC<GitHubConnectorModalProps> = ({
  open,
  onClose,
  project,
  onInjectFiles,
  onAttachRepo,
}) => {
  const [tab, setTab] = useState<'import' | 'deploy'>('import');
  const [repoInput, setRepoInput] = useState('broamstuck-cybr/SOURCEOFKNOWLEDGFORAI');
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [repoInfo, setRepoInfo] = useState<GitHubRepoSummary | null>(null);
  const [repoFiles, setRepoFiles] = useState<GitHubContentItem[]>([]);
  const [selectedPaths, setSelectedPaths] = useState<string[]>([]);
  const [copiedCmd, setCopiedCmd] = useState(false);

  const workflowContent = useMemo(() => buildDeployWorkflow(project.name), [project.name]);
  const gitPushCommands = useMemo(() => {
    const slug =
      project.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || 'fforum-project';
    return [
      `mkdir ${slug} && cd ${slug}`,
      'git init -b main',
      'git add .',
      'git commit -m "chore: initial workspace export"',
      `gh repo create ${slug} --public --source=. --push`,
    ].join('\n');
  }, [project.name]);

  const handleFetchRepo = async (event: React.FormEvent) => {
    event.preventDefault();
    const parsed = parseRepoSlug(repoInput);
    if (!parsed) {
      setErrorMsg('Nhập đúng định dạng owner/repo hoặc URL GitHub công khai.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      const base = `https://api.github.com/repos/${parsed.owner}/${parsed.repo}`;
      const [metaRes, treeRes] = await Promise.all([
        fetch(base, { headers: { accept: 'application/vnd.github+json' } }),
        fetch(`${base}/contents`, { headers: { accept: 'application/vnd.github+json' } }),
      ]);

      if (!metaRes.ok) {
        throw new Error(`Không truy cập được kho (${metaRes.status}).`);
      }

      const meta = (await metaRes.json()) as GitHubRepoSummary;
      const contents = treeRes.ok ? ((await treeRes.json()) as GitHubContentItem[]) : [];
      const importable = Array.isArray(contents)
        ? contents.filter(
            (item) =>
              item.type === 'file' &&
              item.download_url &&
              item.size <= 180000 &&
              IMPORTABLE_EXT.test(item.name)
          )
        : [];

      setRepoInfo(meta);
      setRepoFiles(importable);
      setSelectedPaths(importable.slice(0, 4).map((f) => f.path));
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Không kết nối được GitHub API.');
      setRepoInfo(null);
      setRepoFiles([]);
      setSelectedPaths([]);
    } finally {
      setLoading(false);
    }
  };

  const togglePath = (path: string) => {
    setSelectedPaths((prev) =>
      prev.includes(path) ? prev.filter((item) => item !== path) : [...prev, path]
    );
  };

  const handleImportSelected = async () => {
    if (!repoInfo || selectedPaths.length === 0) return;
    setImporting(true);
    setErrorMsg(null);
    try {
      const targets = repoFiles.filter((file) => selectedPaths.includes(file.path) && file.download_url);
      const fetched = await Promise.all(
        targets.map(async (file) => {
          const res = await fetch(file.download_url!);
          if (!res.ok) {
            throw new Error(`Không tải được tệp ${file.path}.`);
          }
          const content = await res.text();
          return {
            path: file.path,
            content,
            summary: `Nạp từ ${repoInfo.full_name}`,
          };
        })
      );

      onInjectFiles(fetched);
      onAttachRepo({
        id: `gh-${repoInfo.full_name}`,
        kind: 'resource',
        title: repoInfo.full_name,
        summary: repoInfo.description || `GitHub ${repoInfo.language || 'Repository'}`,
        payload: `GitHub: ${repoInfo.html_url} (${repoInfo.default_branch})`,
        tags: ['GitHub', repoInfo.language || 'OpenSource'],
      });
      onClose();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Nạp tệp từ GitHub thất bại.');
    } finally {
      setImporting(false);
    }
  };

  const handleInjectWorkflow = () => {
    onInjectFiles([
      {
        path: '.github/workflows/deploy.yml',
        content: workflowContent,
        summary: 'GitHub Pages deploy workflow',
      },
    ]);
    onClose();
  };

  const handleCopyCommands = async () => {
    try {
      await navigator.clipboard.writeText(gitPushCommands);
      setCopiedCmd(true);
      window.setTimeout(() => setCopiedCmd(false), 1800);
    } catch {
      return;
    }
  };

  return (
    <Modal open={open} onClose={onClose} label="Kết nối GitHub" className="ws-modal ws-modal-right">
      <div className="ws-setup">
        <header className="ws-head">
          <h2 className="ws-head-title">GitHub</h2>
          <div className="ws-seg" role="group" aria-label="Chức năng GitHub">
            <button
              type="button"
              className="ws-seg-item"
              aria-pressed={tab === 'import'}
              onClick={() => setTab('import')}
            >
              Nạp kho
            </button>
            <button
              type="button"
              className="ws-seg-item"
              aria-pressed={tab === 'deploy'}
              onClick={() => setTab('deploy')}
            >
              Xuất Pages
            </button>
          </div>
          <button type="button" className="icon-btn" aria-label="Đóng" title="Đóng" onClick={onClose}>
            <X size={18} aria-hidden="true" />
          </button>
        </header>

        {tab === 'import' ? (
          <div className="ws-gh-body">
            <form className="ws-gh-form" onSubmit={(e) => void handleFetchRepo(e)}>
              <label htmlFor="ws-gh-repo" className="t-label">
                kho công khai (owner/repo)
              </label>
              <div className="ws-gh-input-row">
                <input
                  id="ws-gh-repo"
                  type="text"
                  className="field"
                  value={repoInput}
                  onChange={(e) => setRepoInput(e.target.value)}
                  placeholder="owner/repository"
                />
                <button type="submit" className="btn btn-red btn-sm" disabled={loading}>
                  {loading ? 'Đang tải' : 'Kiểm tra'}
                </button>
              </div>
            </form>

            {errorMsg && (
              <p className="ws-gh-error" role="alert">
                {errorMsg}
              </p>
            )}

            {repoInfo && (
              <div className="ws-gh-card">
                <div className="ws-gh-card-head">
                  <div>
                    <h3 className="ws-gh-repo-name">{repoInfo.full_name}</h3>
                    <p className="t-label">
                      {repoInfo.language || 'Code'} · {repoInfo.stargazers_count.toLocaleString('vi-VN')} sao · nhánh{' '}
                      {repoInfo.default_branch}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-solid btn-sm"
                    disabled={importing || selectedPaths.length === 0}
                    onClick={() => void handleImportSelected()}
                  >
                    {importing ? 'Đang nạp' : 'Nạp tệp'}
                  </button>
                </div>
                {repoInfo.description && <p className="ws-gh-desc">{repoInfo.description}</p>}

                {repoFiles.length === 0 ? (
                  <p className="ws-empty">Không có tệp HTML/CSS/JS/MD ở thư mục gốc.</p>
                ) : (
                  <ul className="ws-gh-files">
                    {repoFiles.map((file) => {
                      const checked = selectedPaths.includes(file.path);
                      return (
                        <li key={file.path}>
                          <label className="ws-gh-file-row">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => togglePath(file.path)}
                            />
                            <span className="ws-row-path">{file.path}</span>
                            <span className="t-label">{Math.max(1, Math.round(file.size / 1024))} KB</span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="ws-gh-body">
            <div className="ws-gh-card">
              <div className="ws-gh-card-head">
                <div>
                  <h3 className="ws-gh-repo-name">GitHub Pages Workflow</h3>
                  <p className="t-label">.github/workflows/deploy.yml</p>
                </div>
                <button type="button" className="btn btn-red btn-sm" onClick={handleInjectWorkflow}>
                  Nạp tệp
                </button>
              </div>
              <pre className="ws-setup-code ws-gh-pre">{workflowContent}</pre>
            </div>

            <div className="ws-gh-card">
              <div className="ws-gh-card-head">
                <div>
                  <h3 className="ws-gh-repo-name">Đẩy mã từ gói ZIP</h3>
                  <p className="t-label">Lệnh CLI sau khi giải nén</p>
                </div>
                <button type="button" className="btn btn-line btn-sm" onClick={() => void handleCopyCommands()}>
                  {copiedCmd ? 'Đã chép' : 'Sao chép'}
                </button>
              </div>
              <pre className="ws-setup-code ws-gh-pre">{gitPushCommands}</pre>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
