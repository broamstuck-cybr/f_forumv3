import React, { useMemo, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import { Magnify, ReaderCard } from '../../components/pinui';
import { BROAMSTUCK_REPOS, SOURCE_KNOWLEDGE_BREAKDOWN } from '../../data/realShowcaseData';
import { useAppStore } from '../../store/appStore';

interface SpecimenEntry {
  id: string;
  indexLabel: string;
  origin: string;
  title: string;
  subtitle: string;
  summary: string;
  paragraphs: string[];
  projectId?: string;
  savedId?: string;
}

function splitOrnateGrapheme(raw: string): { cap: string; rest: string } {
  const text = raw.trim() || 'Không gian kiến tạo';
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    const segmenter = new Intl.Segmenter('vi', { granularity: 'grapheme' });
    const first = segmenter.segment(text)[Symbol.iterator]().next().value;
    const cap = first ? first.segment : text.slice(0, 1);
    return { cap, rest: text.slice(cap.length) };
  }
  const match = text.match(/^[\p{L}\p{N}]\p{M}*/u);
  const cap = match ? match[0] : text.slice(0, 1);
  return { cap, rest: text.slice(cap.length) };
}

export const ProfileView: React.FC = () => {
  const {
    currentUser,
    setAuthModalOpen,
    logout,
    projects,
    activeProject,
    selectProject,
    savedItemIds,
    toggleSavedItem,
    sourceCatalog,
    resourceLibrary,
    communityPosts,
    quota,
    navigate,
  } = useAppStore();

  const reduced = Boolean(useReducedMotion());
  const railRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<{ active: boolean; startX: number; startScrollLeft: number }>({
    active: false,
    startX: 0,
    startScrollLeft: 0,
  });

  const displayName = currentUser?.name?.trim() || 'Không gian kiến tạo';
  const { cap, rest } = useMemo(() => splitOrnateGrapheme(displayName), [displayName]);

  const totalFilesCount = useMemo(
    () => projects.reduce((sum, proj) => sum + proj.files.length, 0),
    [projects]
  );

  const specimens = useMemo<SpecimenEntry[]>(() => {
    const list: SpecimenEntry[] = [];

    projects.forEach((proj) => {
      const fileNames = proj.files.map((f) => f.path).join(', ');
      list.push({
        id: `proj-${proj.id}`,
        indexLabel: String(list.length + 1).padStart(2, '0'),
        origin: 'Workspace',
        title: proj.name,
        subtitle: `${proj.files.length} tệp mã nguồn`,
        summary: proj.description || 'Bản dựng đang mở trong Workspace.',
        paragraphs: [
          proj.description || 'Bản dựng web cô lập trong Workspace, sẵn sàng đối chiếu qua Live View và Diff & Check.',
          fileNames
            ? `Cấu trúc tệp hiện tại gồm ${fileNames}. Mỗi thay đổi đều được tính diff theo từng dòng và kiểm định tự động trước khi xuất bản.`
            : 'Chưa có tệp mã nguồn trong phiên làm việc này.',
        ],
        projectId: proj.id,
      });
    });

    for (const savedId of savedItemIds) {
      const tpl = sourceCatalog.find((item) => item.id === savedId);
      if (tpl) {
        list.push({
          id: `saved-${tpl.id}`,
          indexLabel: String(list.length + 1).padStart(2, '0'),
          origin: tpl.sourceLibrary,
          title: tpl.title,
          subtitle: tpl.category,
          summary: tpl.description,
          paragraphs: [
            tpl.description,
            `Thuộc thư viện ${tpl.sourceLibrary} với giấy phép ${tpl.license}. Đường dẫn lưu trữ: ${tpl.archivePath}.`,
          ],
          savedId: tpl.id,
        });
        continue;
      }

      const res = resourceLibrary.find((item) => item.id === savedId);
      if (res) {
        list.push({
          id: `saved-${res.id}`,
          indexLabel: String(list.length + 1).padStart(2, '0'),
          origin: res.group,
          title: res.title,
          subtitle: res.category,
          summary: res.description,
          paragraphs: [
            res.description,
            `Nhóm tài nguyên ${res.group}, tương thích ${res.compatibility}, giấy phép ${res.license}.`,
          ],
          savedId: res.id,
        });
      }
    }

    for (const repo of BROAMSTUCK_REPOS.slice(0, 4)) {
      list.push({
        id: `repo-${repo.id}`,
        indexLabel: String(list.length + 1).padStart(2, '0'),
        origin: repo.name === 'SOURCEOFKNOWLEDGFORAI' ? 'SOURCEOFKNOWLEDGFORAI' : repo.language,
        title: repo.name,
        subtitle: repo.fullName,
        summary: repo.summaryVi,
        paragraphs: [
          repo.summaryVi,
          `Các tệp trọng tâm gồm ${repo.keyPaths.join(', ')}. ${
            repo.name === 'SOURCEOFKNOWLEDGFORAI'
              ? `Tổng hợp ${SOURCE_KNOWLEDGE_BREAKDOWN.totalItems.toLocaleString('vi-VN')} thành phần từ ThreeUI, PinUI, MotionSites, LucianLabs và CodeFronts.`
              : `Cập nhật gần nhất vào ${new Date(repo.pushedAt).toLocaleDateString('vi-VN')}.`
          }`,
        ],
      });
    }

    return list;
  }, [projects, savedItemIds, sourceCatalog, resourceLibrary]);

  const [selectedSpecimenId, setSelectedSpecimenId] = useState<string>(
    () => specimens[0]?.id || ''
  );

  const selectedSpecimen = useMemo(
    () => specimens.find((item) => item.id === selectedSpecimenId) || specimens[0] || null,
    [specimens, selectedSpecimenId]
  );

  const handleRailPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = railRef.current;
    if (!el) return;
    if ((e.target as HTMLElement).closest('button')) return;
    el.setPointerCapture(e.pointerId);
    dragStateRef.current = {
      active: true,
      startX: e.clientX,
      startScrollLeft: el.scrollLeft,
    };
  };

  const handleRailPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = railRef.current;
    if (!el || !dragStateRef.current.active) return;
    const dx = e.clientX - dragStateRef.current.startX;
    el.scrollLeft = dragStateRef.current.startScrollLeft - dx;
  };

  const handleRailPointerEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = railRef.current;
    if (el && el.hasPointerCapture(e.pointerId)) {
      el.releasePointerCapture(e.pointerId);
    }
    dragStateRef.current.active = false;
  };

  return (
    <main
      aria-label="Hồ sơ kiến tạo"
      className="w-full flex-1 flex flex-col overflow-x-clip"
      style={{ background: 'var(--bg-canvas)', color: 'var(--ink-primary)' }}
    >
      <section
        className="w-full border-b"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        <div className="ff-container py-12 sm:py-16 lg:py-24 grid grid-cols-1 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)] gap-10 lg:gap-16 items-center">
          <div className="min-w-0 space-y-6">
            <div className="flex flex-wrap items-baseline gap-4 text-[13px]" style={{ color: 'var(--ink-muted)' }}>
              <span>Hồ sơ kiến tạo</span>
              <span className="font-mono">
                {currentUser ? `@${currentUser.username}` : 'Phiên cục bộ'}
              </span>
              {currentUser?.role === 'admin' && (
                <span className="font-mono" style={{ color: 'var(--accent-jade)' }}>
                  Quản trị
                </span>
              )}
            </div>

            <h1
              className="m-0 font-semibold tracking-tight leading-[1.04]"
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'clamp(2.5rem, 5.2vw, 4.6rem)',
                color: 'var(--ink-primary)',
                overflowWrap: 'break-word',
              }}
            >
              <span className="ornate-cap">{cap}</span>
              {rest}
            </h1>

            <p
              className="m-0 max-w-xl text-base sm:text-lg leading-relaxed"
              style={{
                fontFamily: 'var(--font-editorial)',
                color: 'var(--ink-secondary)',
              }}
            >
              Giữ lại những nhịp điệu bề mặt, bản dựng đang đi qua Live View và các mẫu từ PinUI, ThreeUI cùng MotionSites đã chọn lọc qua từng phiên.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => navigate('workspace')}
                className="rounded-full px-5 py-2.5 text-xs font-semibold cursor-pointer transition-opacity hover:opacity-90"
                style={{
                  background: 'var(--accent-primary)',
                  color: 'var(--ink-inverse)',
                }}
              >
                Workspace
              </button>
              <button
                type="button"
                onClick={() => navigate('settings')}
                className="rounded-full border px-5 py-2.5 text-xs font-medium cursor-pointer transition-colors"
                style={{
                  borderColor: 'var(--border-strong)',
                  color: 'var(--ink-primary)',
                  background: 'transparent',
                }}
              >
                Cài đặt
              </button>
              <button
                type="button"
                onClick={() => navigate('explore')}
                className="rounded-full border px-5 py-2.5 text-xs font-medium cursor-pointer transition-colors"
                style={{
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--ink-secondary)',
                  background: 'transparent',
                }}
              >
                Khám phá
              </button>
              {currentUser ? (
                <button
                  type="button"
                  onClick={() => void logout()}
                  className="rounded-full border px-5 py-2.5 text-xs font-medium cursor-pointer transition-colors"
                  style={{
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--ink-muted)',
                    background: 'transparent',
                  }}
                >
                  Đăng xuất
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setAuthModalOpen(true)}
                  className="rounded-full border px-5 py-2.5 text-xs font-medium cursor-pointer transition-colors"
                  style={{
                    borderColor: 'var(--border-accent)',
                    color: 'var(--accent-primary)',
                    background: 'transparent',
                  }}
                >
                  Đăng nhập
                </button>
              )}
            </div>
          </div>

          <div className="flex justify-center lg:justify-end">
            <Magnify
              glyph={cap}
              microText="F-FORUM   LIVE VIEW   DIFF & CHECK   PINUI   THREEUI   MOTIONSITES   "
              hintText="Di chuyển để soi chi tiết"
              size={320}
            />
          </div>
        </div>
      </section>

      <section
        aria-label="Chỉ số thực tế"
        className="w-full border-b"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        <div
          className="ff-container grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <div className="py-7 lg:pr-8 space-y-1.5" style={{ borderColor: 'var(--border-subtle)' }}>
            <div className="text-xs" style={{ color: 'var(--ink-muted)' }}>
              Dự án Workspace
            </div>
            <div
              className="text-3xl sm:text-4xl font-mono font-semibold tracking-tight"
              style={{ color: 'var(--ink-primary)' }}
            >
              {projects.length}
            </div>
          </div>

          <div className="py-7 lg:px-8 space-y-1.5" style={{ borderColor: 'var(--border-subtle)' }}>
            <div className="text-xs" style={{ color: 'var(--ink-muted)' }}>
              Tệp mã nguồn
            </div>
            <div
              className="text-3xl sm:text-4xl font-mono font-semibold tracking-tight"
              style={{ color: 'var(--ink-primary)' }}
            >
              {totalFilesCount}
            </div>
          </div>

          <div className="py-7 lg:px-8 space-y-1.5" style={{ borderColor: 'var(--border-subtle)' }}>
            <div className="text-xs" style={{ color: 'var(--ink-muted)' }}>
              Mẫu đã lưu
            </div>
            <div
              className="text-3xl sm:text-4xl font-mono font-semibold tracking-tight"
              style={{ color: 'var(--accent-primary)' }}
            >
              {savedItemIds.length}
            </div>
          </div>

          <div className="py-7 lg:pl-8 space-y-1.5" style={{ borderColor: 'var(--border-subtle)' }}>
            <div className="text-xs" style={{ color: 'var(--ink-muted)' }}>
              {quota.unlimited ? 'Bài viết cộng đồng' : 'Lượt AI còn lại'}
            </div>
            <div
              className="text-3xl sm:text-4xl font-mono font-semibold tracking-tight"
              style={{ color: 'var(--ink-primary)' }}
            >
              {quota.unlimited ? communityPosts.length : `${quota.remaining ?? 0}/${quota.limit ?? 15}`}
            </div>
          </div>
        </div>
      </section>

      <section aria-label="Trưng bày mẫu và bản dựng" className="w-full py-12 sm:py-16 space-y-8">
        <div className="ff-container flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1.5">
            <h2
              className="m-0 text-2xl sm:text-3xl font-semibold tracking-tight"
              style={{ fontFamily: 'var(--font-serif)', color: 'var(--ink-primary)' }}
            >
              Giải phẫu mẫu dựng
            </h2>
            <p className="m-0 text-sm" style={{ color: 'var(--ink-secondary)' }}>
              Kéo ngang để chọn bản dựng hoặc mẫu lưu trữ và soi cấu trúc chi tiết.
            </p>
          </div>
          <span className="font-mono text-xs" style={{ color: 'var(--ink-muted)' }}>
            {activeProject.files.length} tệp đang mở
          </span>
        </div>

        <div
          ref={railRef}
          onPointerDown={handleRailPointerDown}
          onPointerMove={handleRailPointerMove}
          onPointerUp={handleRailPointerEnd}
          onPointerCancel={handleRailPointerEnd}
          className="w-full overflow-x-auto ff-scrollbar px-4 sm:px-8 lg:px-12 pb-4 cursor-grab active:cursor-grabbing select-none"
          style={{ scrollSnapType: reduced ? 'none' : 'x proximity' }}
        >
          <div className="flex items-stretch gap-8 min-w-max border-t border-b py-6" style={{ borderColor: 'var(--border-subtle)' }}>
            {specimens.map((item) => {
              const isSelected = selectedSpecimen?.id === item.id;
              return (
                <article
                  key={item.id}
                  style={{
                    scrollSnapAlign: 'start',
                    borderColor: isSelected ? 'var(--accent-primary)' : 'var(--border-subtle)',
                  }}
                  className="w-[280px] sm:w-[320px] shrink-0 border-l pl-6 pr-2 flex flex-col justify-between gap-5 transition-colors"
                >
                  <div className="space-y-3">
                    <div className="flex items-baseline justify-between gap-3">
                      <span
                        className="font-mono text-xs"
                        style={{ color: isSelected ? 'var(--accent-primary)' : 'var(--ink-muted)' }}
                      >
                        {item.indexLabel}
                      </span>
                      <span className="font-mono text-[11px]" style={{ color: 'var(--ink-muted)' }}>
                        {item.origin}
                      </span>
                    </div>

                    <h3
                      className="m-0 text-xl font-semibold leading-snug"
                      style={{ fontFamily: 'var(--font-serif)', color: 'var(--ink-primary)' }}
                    >
                      {item.title}
                    </h3>

                    <p
                      className="m-0 text-xs leading-relaxed line-clamp-3"
                      style={{ color: 'var(--ink-secondary)' }}
                    >
                      {item.summary}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setSelectedSpecimenId(item.id)}
                      aria-pressed={isSelected}
                      className="text-xs font-semibold cursor-pointer"
                      style={{
                        color: isSelected ? 'var(--accent-primary)' : 'var(--ink-primary)',
                      }}
                    >
                      {isSelected ? 'Đang xem' : 'Soi mẫu'}
                    </button>
                    {item.projectId && (
                      <button
                        type="button"
                        onClick={() => {
                          selectProject(item.projectId!);
                          navigate('workspace');
                        }}
                        className="text-xs font-medium cursor-pointer"
                        style={{ color: 'var(--accent-verdigris)' }}
                      >
                        Workspace
                      </button>
                    )}
                    {item.savedId && (
                      <button
                        type="button"
                        onClick={() => toggleSavedItem(item.savedId!)}
                        className="text-xs cursor-pointer"
                        style={{ color: 'var(--ink-muted)' }}
                      >
                        Bỏ lưu
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        {selectedSpecimen && (
          <div className="ff-container pt-4 grid grid-cols-1 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-10 lg:gap-14 items-start">
            <div className="space-y-5 pt-2">
              <div className="font-mono text-xs" style={{ color: 'var(--accent-primary)' }}>
                {selectedSpecimen.origin}
              </div>
              <h3
                className="m-0 text-2xl sm:text-3xl font-semibold leading-tight"
                style={{ fontFamily: 'var(--font-serif)', color: 'var(--ink-primary)' }}
              >
                {selectedSpecimen.title}
              </h3>
              <p className="m-0 text-sm leading-relaxed" style={{ color: 'var(--ink-secondary)' }}>
                {selectedSpecimen.subtitle}
              </p>
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (selectedSpecimen.projectId) {
                      selectProject(selectedSpecimen.projectId);
                    }
                    navigate('workspace');
                  }}
                  className="rounded-full px-5 py-2 text-xs font-semibold cursor-pointer"
                  style={{
                    background: 'var(--accent-primary)',
                    color: 'var(--ink-inverse)',
                  }}
                >
                  Workspace
                </button>
                <button
                  type="button"
                  onClick={() => navigate('settings')}
                  className="rounded-full border px-5 py-2 text-xs font-medium cursor-pointer"
                  style={{
                    borderColor: 'var(--border-strong)',
                    color: 'var(--ink-primary)',
                    background: 'transparent',
                  }}
                >
                  Cài đặt
                </button>
              </div>
            </div>

            <div className="min-w-0">
              <ReaderCard
                title={selectedSpecimen.title}
                subtitle={selectedSpecimen.origin}
                paragraphs={selectedSpecimen.paragraphs}
                openLabel="Đọc sâu"
              />
            </div>
          </div>
        )}
      </section>
    </main>
  );
};
