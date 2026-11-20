import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';
import type { AdminChangelogEntry, SourceLibraryName } from '../../types/index';
import { apiClient } from '../../services/apiClient';
import { useAppStore } from '../../store/appStore';
import { LiquidTabs } from '../pinui';

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
    name: 'PinUI Registry',
    license: 'MIT License (c) Rachit Thakur / Shadcn Labs',
    origin: 'sources/pinui/',
    url: 'https://www.pinui.xyz',
    usage:
      'PromptComposer, ThemeSwitch, LampSwitch, ReaderCard, Magnify, LiquidTabs, Chips, ChatRoom, SelectionList, SiteRail, SynaisFooter.',
  },
  {
    key: 'threeui',
    name: 'ThreeUI Archive',
    license: 'Reference Metadata Only',
    origin: 'sources/threeui/',
    url: 'https://threeui.com',
    usage: 'Không gian 3D, WebGL và nhịp bố cục cho Khám phá và Hồ sơ.',
  },
  {
    key: 'motionsites',
    name: 'MotionSites Briefs',
    license: 'Public Section Specs',
    origin: 'sources/motionsites/',
    url: 'https://motionsites.ai',
    usage: 'Nhịp kể chuyện Scrollytelling, 20+ GIF thực tế và cấu trúc trang đích.',
  },
  {
    key: 'lucianlabs',
    name: 'LucianLabs Elements',
    license: 'MIT License (c) 2026 Seokwoooo',
    origin: 'sources/lucianlabs/',
    url: 'https://lucianlabs.dev',
    usage: 'Hệ biến --ux-* và 400 vi chuyển động chuẩn xác.',
  },
  {
    key: 'codefronts',
    name: 'CodeFronts Patterns',
    license: 'MIT License (c) CodeFronts',
    origin: 'sources/codefronts/',
    url: 'https://codefronts.com',
    usage: '5.047 mẫu CSS thuần và kỹ thuật anti-FOUC.',
  },
];

export const NoticeStatusModal: React.FC<NoticeStatusModalProps> = ({ open, onClose }) => {
  const { sourceCatalog, reducedMotion, setReducedMotion } = useAppStore();
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
          aria-label="Minh bạch nguồn mở"
          className="fixed inset-0 z-[82] flex items-center justify-center p-4"
          style={{
            backgroundColor: 'var(--bg-veil)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <motion.div
            key="ff-notice-panel"
            initial={{ opacity: 0, y: 14, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            onClick={(event) => event.stopPropagation()}
            className="flex max-h-[85vh] w-full max-w-[760px] flex-col overflow-hidden rounded-[8px] border"
            style={{
              backgroundColor: 'var(--bg-raised)',
              borderColor: 'var(--line-strong)',
              boxShadow: 'var(--shadow-3)',
            }}
          >
            <div
              className="flex items-start justify-between gap-4 border-b px-6 py-5"
              style={{ borderColor: 'var(--border-subtle)' }}
            >
              <div>
                <h2 className="text-lg font-semibold" style={{ color: 'var(--ink-primary)' }}>
                  Minh bạch Nguồn mở
                </h2>
                <p className="mt-1 text-sm" style={{ color: 'var(--ink-secondary)' }}>
                  Bản quyền từ 5 thư viện SOURCEOFKNOWLEDGFORAI, nhật ký cập nhật và chuẩn kiểm định.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Đóng"
                title="Đóng"
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border cursor-pointer"
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
                  { id: 'attributions', label: 'Bản quyền', count: 5 },
                  { id: 'changelog', label: 'Nhật ký', count: changelog.length },
                  { id: 'policy', label: 'Chính sách' },
                ]}
                activeId={activeTab}
                onChange={(id) => setActiveTab(id as 'attributions' | 'changelog' | 'policy')}
              />

              <button
                type="button"
                onClick={() => setReducedMotion(!reducedMotion)}
                className="inline-flex h-9 items-center rounded-full border px-3.5 text-xs font-medium cursor-pointer"
                style={{
                  backgroundColor: reducedMotion
                    ? 'color-mix(in srgb, var(--accent-verdigris) 16%, transparent)'
                    : 'var(--bg-surface)',
                  borderColor: reducedMotion ? 'var(--accent-verdigris)' : 'var(--border-subtle)',
                  color: reducedMotion ? 'var(--accent-verdigris)' : 'var(--ink-secondary)',
                }}
              >
                {reducedMotion ? 'Giảm động' : 'Chuyển động'}
              </button>
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
                            {countsByLib[lib.key] || 0} mục
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
                          className="text-xs font-medium hover:underline"
                          style={{ color: 'var(--accent-verdigris)' }}
                        >
                          Mở nguồn
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
                      Đang tải nhật ký...
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
                      Hệ thống vận hành ổn định trên F-Forum v3.0.0.
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
                    <div className="text-sm font-semibold" style={{ color: 'var(--ink-primary)' }}>
                      Kiểm chứng Live View &amp; Diff &amp; Check
                    </div>
                    <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--ink-secondary)' }}>
                      Mọi mã nguồn trong Workspace được chạy trong khung cô lập (`sandbox="allow-scripts"`) và kiểm định tự động qua 6 lớp: cấu trúc HTML, cú pháp JS, hiển thị đa màn hình, liên kết nội bộ, quét bí mật và khả năng tiếp cận.
                    </p>
                  </div>

                  <div
                    className="rounded-[16px] border p-4"
                    style={{
                      backgroundColor: 'var(--bg-panel)',
                      borderColor: 'var(--border-subtle)',
                    }}
                  >
                    <div className="text-sm font-semibold" style={{ color: 'var(--ink-primary)' }}>
                      Bảo mật Khóa Cá nhân
                    </div>
                    <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--ink-secondary)' }}>
                      Khóa API BYOK không bao giờ được ghi vào tệp nén xuất ra. Mọi thay đổi mã nguồn đều hiển thị rõ trên Diff &amp; Check để người dùng kiểm duyệt trước khi xuất bản.
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
                      <div className="text-sm font-semibold" style={{ color: 'var(--ink-primary)' }}>
                        Chế độ Giảm chuyển động
                      </div>
                      <p className="mt-1 text-xs" style={{ color: 'var(--ink-secondary)' }}>
                        Tắt hiệu ứng phức tạp trên toàn hệ thống để giữ sự tĩnh tại tối đa.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setReducedMotion(!reducedMotion)}
                      className="inline-flex h-10 shrink-0 items-center justify-center rounded-full px-4 text-xs font-semibold cursor-pointer"
                      style={{
                        backgroundColor: reducedMotion ? 'var(--accent-verdigris)' : 'var(--bg-surface)',
                        color: reducedMotion ? '#06080d' : 'var(--ink-primary)',
                        border: '1px solid var(--border-strong)',
                      }}
                    >
                      {reducedMotion ? 'Đang bật' : 'Giảm động'}
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
