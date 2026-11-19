import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Activity, CheckCircle2, ExternalLink, FileCheck2, ShieldAlert, X } from 'lucide-react';
import type { AdminChangelogEntry, SourceLibraryName } from '../../types/index';
import { apiClient } from '../../services/apiClient';
import { useAppStore } from '../../store/appStore';
import { LiquidTabs, ThemeSwitch } from '../pinui';

interface NoticeStatusModalProps {
  open: boolean;
  onClose: () => void;
}

const LIBRARY_ATTRIBUTIONS: Array<{
  key: SourceLibraryName;
  name: string;
  license: string;
  origin: string;
  url: string;
  usage: string;
}> = [
  {
    key: 'pinui',
    name: 'Pin UI Registry',
    license: 'MIT License (c) Rachit Thakur / Shadcn Labs',
    origin: 'sources/pinui/',
    url: 'https://www.pinui.xyz',
    usage: 'Interactive islands: PromptComposer, LiquidTabs, SearchCard, ThemeSwitch, Chips, TaskCard, FileBox, PresenceCards, DynamicDropZone, HaloSignIn, SynaisFooter.',
  },
  {
    key: 'threeui',
    name: 'ThreeUI Direction Archive',
    license: 'Reference Metadata Only (No proprietary code copied)',
    origin: 'sources/threeui/',
    url: 'https://threeui.com',
    usage: 'Spatial pacing, WebGL/3D performance budget badges, and curated showcase direction inside Explore Split Stage.',
  },
  {
    key: 'motionsites',
    name: 'MotionSites Section Briefs',
    license: 'Free Public Section Prompts',
    origin: 'sources/motionsites/',
    url: 'https://motionsites.ai',
    usage: 'Editorial narrative pacing, Skybridge 404 composition, and AI workspace viewport layout rhythm.',
  },
  {
    key: 'lucianlabs',
    name: 'lucianLabs UX/UI Elements',
    license: 'MIT License (c) 2026 Seokwoooo',
    origin: 'sources/lucianlabs/',
    url: 'https://lucianlabs.dev',
    usage: 'CommandPalette (#046) motion curves, Split Pane (#101), Diff Hunk (#127), and Streaming Log Filter (#166).',
  },
  {
    key: 'codefronts',
    name: 'CodeFronts Patterns',
    license: 'MIT License (c) CodeFronts',
    origin: 'sources/codefronts/',
    url: 'https://codefronts.com',
    usage: 'Anti-FOUC theme hydration script, Liquid Glass toast notifications, and code copy micro-controls.',
  },
];

export const NoticeStatusModal: React.FC<NoticeStatusModalProps> = ({ open, onClose }) => {
  const { sourceCatalog, reducedMotion, setReducedMotion, theme, toggleTheme } = useAppStore();
  const [activeTab, setActiveTab] = useState<'attributions' | 'changelog' | 'policy'>('attributions');
  const [changelog, setChangelog] = useState<AdminChangelogEntry[]>([]);
  const [loadingLog, setLoadingLog] = useState(false);

  const countsByLib = useMemo(() => {
    const map: Record<string, number> = {};
    for (const item of sourceCatalog) {
      map[item.sourceLibrary] = (map[item.sourceLibrary] || 0) + 1;
    }
    return map;
  }, [sourceCatalog]);

  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoadingLog(true);
    apiClient
      .fetchPublicChangelog()
      .then((res) => {
        if (active && Array.isArray(res.changelog)) {
          setChangelog(res.changelog);
        }
      })
      .catch(() => {
        if (active) setChangelog([]);
      })
      .finally(() => {
        if (active) setLoadingLog(false);
      });
    return () => {
      active = false;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="ff-notice-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label="Thông tin hệ thống, Bản quyền MIT và Changelog"
          className="fixed inset-0 z-[82] flex items-center justify-center p-4"
          style={{
            backgroundColor: 'rgba(6, 8, 13, 0.72)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <motion.div
            key="ff-notice-panel"
            initial={{ opacity: 0, y: 14, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            onClick={(event) => event.stopPropagation()}
            className="flex max-h-[85vh] w-full max-w-[780px] flex-col overflow-hidden rounded-[24px] border"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-strong)',
              boxShadow: '0 32px 72px -28px rgba(0, 0, 0, 0.72)',
            }}
          >
            <div
              className="flex items-start justify-between gap-4 border-b px-6 py-5"
              style={{ borderColor: 'var(--border-subtle)' }}
            >
              <div>
                <h2 className="text-lg font-semibold" style={{ color: 'var(--ink-primary)' }}>
                  Thông tin Hệ thống & Minh bạch Nguồn mở
                </h2>
                <p className="mt-1 text-sm" style={{ color: 'var(--ink-secondary)' }}>
                  Bản quyền MIT từ 5 thư viện SOURCEOFKNOWLEDGFORAI, lịch sử cập nhật và điều khiển chuyển động.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Đóng cửa sổ thông tin"
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border focus-visible:outline-2 focus-visible:outline-offset-2"
                style={{
                  backgroundColor: 'var(--bg-panel)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--ink-secondary)',
                }}
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div
              className="flex flex-wrap items-center justify-between gap-3 border-b px-6 py-3"
              style={{
                backgroundColor: 'var(--bg-panel)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <LiquidTabs
                tabs={[
                  { id: 'attributions', label: 'Bản quyền MIT', count: 5 },
                  { id: 'changelog', label: 'Changelog', count: changelog.length },
                  { id: 'policy', label: 'Chính sách AI & Motion' },
                ]}
                activeId={activeTab}
                onChange={(id) => setActiveTab(id as 'attributions' | 'changelog' | 'policy')}
              />

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setReducedMotion(!reducedMotion)}
                  className="inline-flex h-9 items-center gap-2 rounded-full border px-3 text-xs font-medium focus-visible:outline-2 focus-visible:outline-offset-2"
                  style={{
                    backgroundColor: reducedMotion
                      ? 'color-mix(in srgb, var(--accent-verdigris) 16%, transparent)'
                      : 'var(--bg-surface)',
                    borderColor: reducedMotion ? 'var(--accent-verdigris)' : 'var(--border-subtle)',
                    color: reducedMotion ? 'var(--accent-verdigris)' : 'var(--ink-secondary)',
                  }}
                >
                  <Activity className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{reducedMotion ? 'Reduced Motion: Bật' : 'Adaptive Motion'}</span>
                </button>
                <ThemeSwitch theme={theme} onToggle={toggleTheme} compact />
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
              {activeTab === 'attributions' ? (
                <div className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
                  {LIBRARY_ATTRIBUTIONS.map((lib) => (
                    <article
                      key={lib.key}
                      className="flex flex-col gap-2 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between"
                      style={{ borderColor: 'var(--border-subtle)' }}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-semibold" style={{ color: 'var(--ink-primary)' }}>
                            {lib.name}
                          </h3>
                          <span
                            className="rounded-full px-2.5 py-0.5 font-mono text-[11px]"
                            style={{
                              backgroundColor: 'var(--bg-panel)',
                              color: 'var(--accent-primary)',
                            }}
                          >
                            {countsByLib[lib.key] || 0} mục trong Explore
                          </span>
                        </div>
                        <p className="mt-1 text-xs font-medium" style={{ color: 'var(--ink-secondary)' }}>
                          {lib.license}
                        </p>
                        <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--ink-muted)' }}>
                          {lib.usage}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2 sm:flex-col sm:items-end">
                        <code
                          className="rounded px-2 py-0.5 font-mono text-[11px]"
                          style={{
                            backgroundColor: 'var(--bg-panel)',
                            color: 'var(--ink-secondary)',
                          }}
                        >
                          {lib.origin}
                        </code>
                        <a
                          href={lib.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-medium hover:underline"
                          style={{ color: 'var(--accent-verdigris)' }}
                        >
                          <span>Nguồn gốc</span>
                          <ExternalLink className="h-3 w-3" aria-hidden="true" />
                        </a>
                      </div>
                    </article>
                  ))}
                </div>
              ) : null}

              {activeTab === 'changelog' ? (
                <div className="space-y-4">
                  {loadingLog ? (
                    <p className="py-8 text-center text-sm" style={{ color: 'var(--ink-muted)' }}>
                      Đang tải nhật ký phiên bản...
                    </p>
                  ) : changelog.length === 0 ? (
                    <div
                      className="rounded-[16px] border p-5 text-sm"
                      style={{
                        backgroundColor: 'var(--bg-panel)',
                        borderColor: 'var(--border-subtle)',
                        color: 'var(--ink-secondary)',
                      }}
                    >
                      Chưa có bản ghi Changelog công khai mới từ Admin Gateway. Hệ thống đang chạy F-FORUM v3.0.0.
                    </div>
                  ) : (
                    changelog.map((entry) => (
                      <article
                        key={entry.id}
                        className="rounded-[16px] border p-4"
                        style={{
                          backgroundColor: 'var(--bg-panel)',
                          borderColor: 'var(--border-subtle)',
                        }}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span
                              className="rounded-full px-2.5 py-0.5 font-mono text-xs font-semibold"
                              style={{
                                backgroundColor: 'color-mix(in srgb, var(--accent-primary) 16%, transparent)',
                                color: 'var(--accent-primary)',
                              }}
                            >
                              {entry.version}
                            </span>
                            <h3 className="text-sm font-semibold" style={{ color: 'var(--ink-primary)' }}>
                              {entry.title}
                            </h3>
                          </div>
                          <span className="font-mono text-xs" style={{ color: 'var(--ink-muted)' }}>
                            {new Date(entry.publishedAt).toLocaleDateString('vi-VN')}
                          </span>
                        </div>
                        <p className="mt-2 whitespace-pre-line text-sm leading-relaxed" style={{ color: 'var(--ink-secondary)' }}>
                          {entry.notes}
                        </p>
                      </article>
                    ))
                  )}
                </div>
              ) : null}

              {activeTab === 'policy' ? (
                <div className="space-y-4">
                  <div
                    className="rounded-[16px] border p-4"
                    style={{
                      backgroundColor: 'var(--bg-panel)',
                      borderColor: 'var(--border-subtle)',
                    }}
                  >
                    <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--ink-primary)' }}>
                      <FileCheck2 className="h-4 w-4" style={{ color: 'var(--accent-jade)' }} aria-hidden="true" />
                      <span>Chính sách Kiểm chứng Mã nguồn AI</span>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--ink-secondary)' }}>
                      Mọi mã nguồn do AI tổng hợp trong Work space đều chạy trong khung iframe cô lập (`sandbox="allow-scripts"`) và phải đi qua 6 lớp kiểm định thực tế: cấu trúc HTML, cú pháp JS, responsive overflow, liên kết nội bộ, quét lộ lọt bí mật (secret scan) và tiêu chuẩn tiếp cận cơ bản.
                    </p>
                  </div>

                  <div
                    className="rounded-[16px] border p-4"
                    style={{
                      backgroundColor: 'var(--bg-panel)',
                      borderColor: 'var(--border-subtle)',
                    }}
                  >
                    <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--ink-primary)' }}>
                      <ShieldAlert className="h-4 w-4" style={{ color: 'var(--accent-primary)' }} aria-hidden="true" />
                      <span>Trách nhiệm Kiểm duyệt & Minh bạch</span>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--ink-secondary)' }}>
                      AI có thể tạo sai lệch kỹ thuật hoặc phát sinh logic chưa tối ưu. Người dùng cần xem xét Diff theo từng dòng và xác minh trước khi xuất bản ra môi trường sản xuất. Khóa API BYOK không bao giờ được ghi vào tệp ZIP xuất ra.
                    </p>
                  </div>

                  <div
                    className="flex flex-col gap-3 rounded-[16px] border p-4 sm:flex-row sm:items-center sm:justify-between"
                    style={{
                      backgroundColor: 'var(--bg-panel)',
                      borderColor: 'var(--border-subtle)',
                    }}
                  >
                    <div>
                      <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--ink-primary)' }}>
                        <CheckCircle2 className="h-4 w-4" style={{ color: 'var(--accent-verdigris)' }} aria-hidden="true" />
                        <span>Adaptive Motion & Reduced-Motion</span>
                      </div>
                      <p className="mt-1 text-xs" style={{ color: 'var(--ink-secondary)' }}>
                        Tắt toàn bộ chuyển động phức tạp và nền động trên toàn ứng dụng để giảm tải GPU hoặc tránh say chuyển động.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setReducedMotion(!reducedMotion)}
                      className="inline-flex h-10 shrink-0 items-center justify-center rounded-full px-4 text-xs font-semibold focus-visible:outline-2 focus-visible:outline-offset-2"
                      style={{
                        backgroundColor: reducedMotion ? 'var(--accent-verdigris)' : 'var(--bg-surface)',
                        color: reducedMotion ? '#06080d' : 'var(--ink-primary)',
                        border: '1px solid var(--border-strong)',
                      }}
                    >
                      {reducedMotion ? 'Đang tắt chuyển động' : 'Bật chế độ giảm chuyển động'}
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};
