import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Activity,
  BookOpen,
  Compass,
  FolderCode,
  Home,
  Info,
  Layers,
  LogIn,
  Moon,
  Search,
  Settings,
  Sparkles,
  Sun,
  Terminal,
} from 'lucide-react';
import { useAppStore } from '../../store/appStore';

interface CommandPaletteProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onOpenNotice?: () => void;
}

interface PaletteItem {
  id: string;
  group: string;
  label: string;
  subtitle?: string;
  shortcut?: string;
  accent?: 'primary' | 'verdigris' | 'jade' | 'copper' | 'plain';
  icon: React.ReactNode;
  run: () => void;
}

function renderHighlighted(text: string, query: string): React.ReactNode {
  const q = query.trim().toLowerCase();
  if (!q) return text;
  const idx = text.toLowerCase().indexOf(q);
  if (idx < 0) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark
        style={{
          backgroundColor: 'transparent',
          color: 'var(--accent-primary)',
          fontWeight: 700,
        }}
      >
        {text.slice(idx, idx + q.length)}
      </mark>
      {text.slice(idx + q.length)}
    </>
  );
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  open,
  onOpenChange,
  onOpenNotice,
}) => {
  const {
    navigate,
    projects,
    selectProject,
    sourceCatalog,
    createProject,
    attachItemToWorkspace,
    theme,
    toggleTheme,
    reducedMotion,
    setReducedMotion,
    currentUser,
    setAuthModalOpen,
  } = useAppStore();

  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = typeof open === 'boolean' ? open : internalOpen;
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [feedback, setFeedback] = useState('');

  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [highlightY, setHighlightY] = useState(0);

  const setOpenState = useCallback(
    (next: boolean) => {
      if (onOpenChange) {
        onOpenChange(next);
      } else {
        setInternalOpen(next);
      }
      if (!next) {
        setQuery('');
        setActiveIndex(0);
        setFeedback('');
      }
    },
    [onOpenChange]
  );

  useEffect(() => {
    const onGlobalKeyDown = (event: KeyboardEvent) => {
      const keyLower = event.key.toLowerCase();
      if ((event.ctrlKey || event.metaKey) && (keyLower === 'k' || keyLower === 'e')) {
        event.preventDefault();
        setOpenState(!isOpen);
      } else if (event.key === 'Escape' && isOpen) {
        event.preventDefault();
        setOpenState(false);
      }
    };
    window.addEventListener('keydown', onGlobalKeyDown);
    return () => window.removeEventListener('keydown', onGlobalKeyDown);
  }, [isOpen, setOpenState]);

  useEffect(() => {
    if (!isOpen) return;
    const timer = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 30);
    return () => window.clearTimeout(timer);
  }, [isOpen]);

  const items = useMemo<PaletteItem[]>(() => {
    const navItems: PaletteItem[] = [
      {
        id: 'nav-home',
        group: 'Điều hướng',
        label: 'Home Launchpad',
        subtitle: 'Trung tâm khởi tạo prompt và dòng thời gian dự án',
        shortcut: 'G H',
        accent: 'primary',
        icon: <Home className="h-4 w-4" aria-hidden="true" />,
        run: () => navigate('home'),
      },
      {
        id: 'nav-explore',
        group: 'Điều hướng',
        label: 'Explore — Thư viện & Kho Template',
        subtitle: '8 nhóm tài nguyên, 121 mẫu UI/UX và bảng xếp hạng Repo',
        shortcut: 'G E',
        accent: 'verdigris',
        icon: <Compass className="h-4 w-4" aria-hidden="true" />,
        run: () => navigate('explore'),
      },
      {
        id: 'nav-workspace',
        group: 'Điều hướng',
        label: 'Work space Arena',
        subtitle: 'AI Builder 3 cột, Live Preview, Diff & Checks',
        shortcut: 'G W',
        accent: 'copper',
        icon: <Terminal className="h-4 w-4" aria-hidden="true" />,
        run: () => navigate('workspace'),
      },
      {
        id: 'nav-community',
        group: 'Điều hướng',
        label: 'Source of Knowledge',
        subtitle: 'Dev Q&A, Project Showcase, Drops và Club Hub',
        shortcut: 'G C',
        accent: 'jade',
        icon: <BookOpen className="h-4 w-4" aria-hidden="true" />,
        run: () => navigate('community'),
      },
      {
        id: 'nav-settings',
        group: 'Điều hướng',
        label: 'Cài đặt & Hồ sơ Maker',
        subtitle: 'BYOK, Workspace defaults, Quota và Dữ liệu cục bộ',
        shortcut: 'G S',
        accent: 'plain',
        icon: <Settings className="h-4 w-4" aria-hidden="true" />,
        run: () => navigate('settings'),
      },
      {
        id: 'nav-landing',
        group: 'Điều hướng',
        label: 'Trang giới thiệu (Landing)',
        subtitle: 'Quay lại màn hình giới thiệu nền tảng F-FORUM',
        accent: 'plain',
        icon: <Sparkles className="h-4 w-4" aria-hidden="true" />,
        run: () => navigate('landing'),
      },
    ];

    const projectItems: PaletteItem[] = projects.slice(0, 5).map((project) => ({
      id: `proj-${project.id}`,
      group: 'Dự án gần đây',
      label: project.name,
      subtitle: `${project.files.length} tệp / ${project.description.slice(0, 56)}`,
      accent: 'plain',
      icon: <FolderCode className="h-4 w-4" aria-hidden="true" />,
      run: () => {
        selectProject(project.id);
        navigate('workspace');
      },
    }));

    const templateItems: PaletteItem[] = sourceCatalog.slice(0, 8).map((tpl) => ({
      id: `tpl-${tpl.id}`,
      group: 'Mẫu Explore nổi bật',
      label: tpl.title,
      subtitle: `${tpl.sourceLibrary} / ${tpl.style}`,
      accent: 'verdigris',
      icon: <Layers className="h-4 w-4" aria-hidden="true" />,
      run: () => {
        createProject(tpl.title, tpl.description);
        attachItemToWorkspace(
          {
            id: tpl.id,
            kind: 'template',
            title: tpl.title,
            sourceLibrary: tpl.sourceLibrary,
            summary: tpl.description,
            payload: tpl.promptSpec || tpl.archivePath,
            tags: tpl.tags,
          },
          true
        );
      },
    }));

    const systemItems: PaletteItem[] = [
      {
        id: 'sys-theme',
        group: 'Hệ thống',
        label: theme === 'dark' ? 'Chuyển sang giao diện Sáng (Editorial Stone)' : 'Chuyển sang giao diện Tối (Obsidian Foundry)',
        shortcut: 'Theme',
        accent: 'primary',
        icon: theme === 'dark' ? <Sun className="h-4 w-4" aria-hidden="true" /> : <Moon className="h-4 w-4" aria-hidden="true" />,
        run: () => toggleTheme(),
      },
      {
        id: 'sys-motion',
        group: 'Hệ thống',
        label: reducedMotion ? 'Bật lại chuyển động tương tác' : 'Bật chế độ Giảm chuyển động (Reduced Motion)',
        shortcut: reducedMotion ? 'On' : 'Off',
        accent: 'plain',
        icon: <Activity className="h-4 w-4" aria-hidden="true" />,
        run: () => setReducedMotion(!reducedMotion),
      },
      {
        id: 'sys-auth',
        group: 'Hệ thống',
        label: currentUser ? `Tài khoản: ${currentUser.name}` : 'Đăng nhập / Đăng ký tài khoản',
        accent: 'plain',
        icon: <LogIn className="h-4 w-4" aria-hidden="true" />,
        run: () => {
          if (currentUser) {
            navigate('settings');
          } else {
            setAuthModalOpen(true);
          }
        },
      },
    ];

    if (onOpenNotice) {
      systemItems.push({
        id: 'sys-notice',
        group: 'Hệ thống',
        label: 'Bản quyền MIT, Changelog & Chính sách AI',
        accent: 'plain',
        icon: <Info className="h-4 w-4" aria-hidden="true" />,
        run: () => onOpenNotice(),
      });
    }

    return [...navItems, ...projectItems, ...templateItems, ...systemItems];
  }, [
    navigate,
    projects,
    selectProject,
    sourceCatalog,
    createProject,
    attachItemToWorkspace,
    theme,
    toggleTheme,
    reducedMotion,
    setReducedMotion,
    currentUser,
    setAuthModalOpen,
    onOpenNotice,
  ]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.group.toLowerCase().includes(q) ||
        (item.subtitle && item.subtitle.toLowerCase().includes(q))
    );
  }, [items, query]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    const node = itemRefs.current[activeIndex];
    if (!node) return;
    setHighlightY(node.offsetTop);
    const container = listRef.current;
    if (!container) return;
    const itemBottom = node.offsetTop + node.offsetHeight;
    if (itemBottom > container.scrollTop + container.clientHeight) {
      container.scrollTo({
        top: itemBottom - container.clientHeight + 8,
        behavior: reducedMotion ? 'auto' : 'smooth',
      });
    } else if (node.offsetTop < container.scrollTop + 28) {
      container.scrollTo({
        top: activeIndex === 0 ? 0 : Math.max(0, node.offsetTop - 28),
        behavior: reducedMotion ? 'auto' : 'smooth',
      });
    }
  }, [activeIndex, filtered.length, isOpen, reducedMotion]);

  const executeItem = useCallback(
    (item: PaletteItem | undefined) => {
      if (!item) return;
      setFeedback(`Đã chạy: ${item.label}`);
      item.run();
      window.setTimeout(() => {
        setOpenState(false);
      }, 120);
    },
    [setOpenState]
  );

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (filtered.length > 0) {
        setActiveIndex((prev) => (prev + 1) % filtered.length);
      }
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (filtered.length > 0) {
        setActiveIndex((prev) => (prev - 1 + filtered.length) % filtered.length);
      }
    } else if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
      event.preventDefault();
      executeItem(filtered[activeIndex]);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      setOpenState(false);
    }
  };

  const accentBadgeStyle = (accent: PaletteItem['accent']): React.CSSProperties => {
    if (accent === 'primary') {
      return {
        backgroundColor: 'color-mix(in srgb, var(--accent-primary) 16%, transparent)',
        color: 'var(--accent-primary)',
      };
    }
    if (accent === 'verdigris') {
      return {
        backgroundColor: 'color-mix(in srgb, var(--accent-verdigris) 16%, transparent)',
        color: 'var(--accent-verdigris)',
      };
    }
    if (accent === 'jade') {
      return {
        backgroundColor: 'color-mix(in srgb, var(--accent-jade) 16%, transparent)',
        color: 'var(--accent-jade)',
      };
    }
    if (accent === 'copper') {
      return {
        backgroundColor: 'color-mix(in srgb, var(--accent-copper) 16%, transparent)',
        color: 'var(--accent-copper)',
      };
    }
    return {
      backgroundColor: 'var(--bg-panel)',
      color: 'var(--ink-secondary)',
    };
  };

  let lastGroup = '';

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          key="ff-cmd-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: [0.2, 0.8, 0.2, 1] }}
          onClick={() => setOpenState(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Bảng lệnh nhanh F-FORUM"
          className="fixed inset-0 z-[85] flex items-start justify-center px-4 pt-[10vh] sm:pt-[14vh]"
          style={{
            backgroundColor: 'rgba(6, 8, 13, 0.68)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <motion.div
            key="ff-cmd-panel"
            initial={{ opacity: 0, clipPath: 'inset(0 0 82% 0 round 24px)', y: -8 }}
            animate={{ opacity: 1, clipPath: 'inset(0 0 0% 0 round 24px)', y: 0 }}
            exit={{ opacity: 0, clipPath: 'inset(0 0 86% 0 round 24px)', y: -6 }}
            transition={{ duration: 0.36, ease: [0.2, 0.8, 0.2, 1] }}
            onClick={(event) => event.stopPropagation()}
            className="flex max-h-[72vh] w-full max-w-[580px] flex-col overflow-hidden rounded-[24px] border"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-strong)',
              boxShadow: '0 34px 70px -28px rgba(0, 0, 0, 0.72)',
            }}
          >
            <label
              className="flex h-14 shrink-0 items-center gap-3 border-b px-5"
              style={{ borderColor: 'var(--border-subtle)' }}
            >
              <Search className="h-4 w-4 shrink-0" style={{ color: 'var(--ink-muted)' }} aria-hidden="true" />
              <input
                ref={inputRef}
                type="text"
                role="combobox"
                aria-expanded={true}
                aria-autocomplete="list"
                aria-controls="ff-cmd-listbox"
                aria-activedescendant={filtered[activeIndex] ? `ff-cmd-opt-${filtered[activeIndex].id}` : undefined}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={handleInputKeyDown}
                placeholder="Tìm trang, dự án, mẫu UI hoặc lệnh hệ thống..."
                className="min-w-0 flex-1 bg-transparent text-[15px] font-medium outline-none"
                style={{ color: 'var(--ink-primary)' }}
              />
              <kbd
                className="inline-flex h-6 items-center rounded-[7px] border px-2 font-mono text-[11px] font-semibold"
                style={{
                  backgroundColor: 'var(--bg-panel)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--ink-muted)',
                }}
              >
                Esc
              </kbd>
            </label>

            <div
              ref={listRef}
              id="ff-cmd-listbox"
              role="listbox"
              aria-label="Danh sách lệnh"
              className="relative min-h-0 flex-1 overflow-y-auto px-2 py-2"
            >
              {filtered.length > 0 ? (
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute right-2 left-2 rounded-[13px]"
                  style={{
                    height: '50px',
                    transform: `translateY(${highlightY}px)`,
                    backgroundColor: 'color-mix(in srgb, var(--accent-primary) 12%, transparent)',
                    boxShadow: 'inset 3px 0 0 var(--accent-primary)',
                    transition: reducedMotion
                      ? 'none'
                      : 'transform 280ms cubic-bezier(0.34, 1.45, 0.64, 1), opacity 180ms ease',
                  }}
                />
              ) : null}

              {filtered.length === 0 ? (
                <div className="px-4 py-12 text-center text-sm" style={{ color: 'var(--ink-muted)' }}>
                  <p className="font-semibold" style={{ color: 'var(--ink-primary)' }}>
                    Không tìm thấy kết quả cho "{query.trim()}"
                  </p>
                  <p className="mt-1">Thử từ khóa khác như Explore, Workspace, Theme hoặc tên mẫu UI.</p>
                </div>
              ) : (
                <div className="relative flex flex-col">
                  {filtered.map((item, idx) => {
                    const showGroup = item.group !== lastGroup;
                    lastGroup = item.group;
                    const isSelected = idx === activeIndex;
                    return (
                      <React.Fragment key={item.id}>
                        {showGroup ? (
                          <div
                            role="presentation"
                            className="px-3 pt-3 pb-1.5 text-xs font-semibold"
                            style={{ color: 'var(--ink-muted)' }}
                          >
                            {item.group}
                          </div>
                        ) : null}
                        <button
                          ref={(el) => {
                            itemRefs.current[idx] = el;
                          }}
                          id={`ff-cmd-opt-${item.id}`}
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          onPointerMove={() => {
                            if (activeIndex !== idx) setActiveIndex(idx);
                          }}
                          onClick={() => executeItem(item)}
                          className="relative flex h-[50px] w-full items-center gap-3 rounded-[13px] px-3 text-left focus-visible:outline-2 focus-visible:outline-offset-[-2px]"
                          style={{
                            color: isSelected ? 'var(--ink-primary)' : 'var(--ink-secondary)',
                          }}
                        >
                          <span
                            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px]"
                            style={accentBadgeStyle(item.accent)}
                          >
                            {item.icon}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold">
                              {renderHighlighted(item.label, query)}
                            </span>
                            {item.subtitle ? (
                              <span
                                className="block truncate text-xs"
                                style={{ color: 'var(--ink-muted)' }}
                              >
                                {item.subtitle}
                              </span>
                            ) : null}
                          </span>
                          {item.shortcut ? (
                            <kbd
                              className="shrink-0 rounded-[7px] border px-2 py-0.5 font-mono text-[11px] font-medium"
                              style={{
                                backgroundColor: 'var(--bg-panel)',
                                borderColor: 'var(--border-subtle)',
                                color: 'var(--ink-muted)',
                              }}
                            >
                              {item.shortcut}
                            </kbd>
                          ) : null}
                        </button>
                      </React.Fragment>
                    );
                  })}
                </div>
              )}
            </div>

            <div
              className="flex h-11 shrink-0 items-center justify-between gap-4 border-t px-4 text-xs"
              style={{
                borderColor: 'var(--border-subtle)',
                backgroundColor: 'var(--bg-panel)',
                color: 'var(--ink-muted)',
              }}
            >
              <div className="flex items-center gap-3">
                <span>
                  <kbd className="mr-1 rounded border px-1.5 py-0.5 font-mono text-[11px]" style={{ borderColor: 'var(--border-subtle)' }}>
                    ↑↓
                  </kbd>
                  Di chuyển
                </span>
                <span>
                  <kbd className="mr-1 rounded border px-1.5 py-0.5 font-mono text-[11px]" style={{ borderColor: 'var(--border-subtle)' }}>
                    Enter
                  </kbd>
                  Thực thi
                </span>
                <span className="hidden sm:inline">
                  <kbd className="mr-1 rounded border px-1.5 py-0.5 font-mono text-[11px]" style={{ borderColor: 'var(--border-subtle)' }}>
                    Ctrl+E
                  </kbd>
                  Bật / Tắt
                </span>
              </div>
              {feedback ? (
                <span className="truncate font-semibold" style={{ color: 'var(--accent-jade)' }}>
                  {feedback}
                </span>
              ) : null}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};
