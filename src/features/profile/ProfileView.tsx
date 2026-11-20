import React, { useMemo, useState } from 'react';
import { Magnify, ReaderCard } from '../../components/pinui';
import { BROAMSTUCK_REPOS, SOURCE_KNOWLEDGE_BREAKDOWN } from '../../data/realShowcaseData';
import { useAppStore } from '../../store/appStore';
import { Mark } from '../../ui/Mark';
import { Media, previewFor } from '../../ui/Media';
import './profile.css';

interface PlateSpecimen {
  id: string;
  origin: string;
  title: string;
  subtitle: string;
  summary: string;
  paragraphs: string[];
  previewId?: string;
  projectId?: string;
  savedId?: string;
}

const FAN_TILTS = ['-1.6deg', '0.9deg', '-0.8deg', '1.4deg', '-1.1deg', '0.6deg'];

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
    theme,
    navigate,
  } = useAppStore();

  const displayName = currentUser?.name?.trim() || 'Không gian kiến tạo';
  const { cap, rest } = useMemo(() => splitOrnateGrapheme(displayName), [displayName]);

  const totalFilesCount = useMemo(
    () => projects.reduce((sum, proj) => sum + proj.files.length, 0),
    [projects]
  );

  const specimens = useMemo<PlateSpecimen[]>(() => {
    const list: PlateSpecimen[] = [];

    for (const savedId of savedItemIds) {
      const tpl = sourceCatalog.find((item) => item.id === savedId);
      if (tpl) {
        list.push({
          id: `saved-${tpl.id}`,
          origin: tpl.sourceLibrary,
          title: tpl.title,
          subtitle: tpl.category,
          summary: tpl.description,
          paragraphs: [
            tpl.description,
            `Thuộc thư viện ${tpl.sourceLibrary} với giấy phép ${tpl.license}. Đường dẫn lưu trữ: ${tpl.archivePath}.`,
          ],
          previewId: tpl.id,
          savedId: tpl.id,
        });
        continue;
      }

      const res = resourceLibrary.find((item) => item.id === savedId);
      if (res) {
        list.push({
          id: `saved-${res.id}`,
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

    projects.forEach((proj) => {
      const fileNames = proj.files.map((f) => f.path).join(', ');
      list.push({
        id: `proj-${proj.id}`,
        origin: 'Workspace',
        title: proj.name,
        subtitle: `${proj.files.length} tệp mã nguồn`,
        summary: proj.description || 'Bản dựng đang mở trong Workspace.',
        paragraphs: [
          proj.description || 'Bản dựng web cô lập trong Workspace, sẵn sàng kiểm chứng qua Live View và Diff & Check.',
          fileNames
            ? `Cấu trúc tệp hiện tại gồm ${fileNames}. Mọi thay đổi đều đi qua Diff & Check trước khi tải về.`
            : 'Chưa có tệp mã nguồn trong phiên làm việc này.',
        ],
        projectId: proj.id,
      });
    });

    for (const repo of BROAMSTUCK_REPOS.slice(0, 3)) {
      list.push({
        id: `repo-${repo.id}`,
        origin: repo.language,
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

  const [selectedId, setSelectedId] = useState<string>(() => specimens[0]?.id || '');

  const selectedSpecimen = useMemo(
    () => specimens.find((item) => item.id === selectedId) || specimens[0] || null,
    [specimens, selectedId]
  );

  return (
    <div className="pf">
      <section aria-label="Trang bìa hồ sơ" className="pf-hero">
        <div className="wrap-wide pf-hero-grid">
          <div className="pf-hero-copy">
            <div className="pf-meta t-label">
              <span>trang bìa</span>
              <span>{currentUser ? `@${currentUser.username}` : 'phiên cục bộ'}</span>
              {currentUser?.role === 'admin' && <span className="tag tag-green">quản trị</span>}
            </div>

            <h1 className="pf-title">
              <span className="t-script pf-cap">{cap}</span>
              {rest}
            </h1>

            <p className="pf-lead">
              Lưu giữ các bản dựng đang đi qua Live View, số liệu thực của phiên và những tấm mẫu đã chọn từ bàn soi.
            </p>

            <div className="pf-actions">
              <button type="button" className="btn btn-red" onClick={() => navigate('workspace')}>
                Workspace
              </button>
              <button type="button" className="btn btn-line" onClick={() => navigate('settings')}>
                Cài đặt
              </button>
              <button type="button" className="btn btn-line" onClick={() => navigate('explore')}>
                Khám phá
              </button>
              {currentUser ? (
                <button type="button" className="btn btn-ghost" onClick={() => void logout()}>
                  Đăng xuất
                </button>
              ) : (
                <button type="button" className="btn btn-ghost" onClick={() => setAuthModalOpen(true)}>
                  Đăng nhập
                </button>
              )}
            </div>
          </div>

          <div className="pf-loupe">
            <Magnify
              glyph={cap}
              microText="F-FORUM   LIVE VIEW   DIFF & CHECK   PINUI   THREEUI   MOTIONSITES   "
              hintText="Di chuyển để soi chi tiết"
              theme={theme}
              size={300}
            />
          </div>
        </div>
      </section>

      <section aria-label="Bảng ấn ký số liệu thực" className="pf-colophon-band">
        <div className="wrap-wide">
          <dl className="pf-colophon">
            <div>
              <dt className="t-label">dự án workspace</dt>
              <dd>{projects.length}</dd>
            </div>
            <div>
              <dt className="t-label">tệp mã nguồn</dt>
              <dd>{totalFilesCount}</dd>
            </div>
            <div>
              <dt className="t-label">mẫu đã lưu</dt>
              <dd className="pf-colophon-red">{savedItemIds.length}</dd>
            </div>
            <div>
              <dt className="t-label">{quota.unlimited ? 'bài viết tòa soạn' : 'lượt AI còn lại'}</dt>
              <dd>{quota.unlimited ? communityPosts.length : `${quota.remaining ?? 0}/${quota.limit ?? 15}`}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section aria-label="Bản in đã lưu và dự án" className="pf-plates-band">
        <div className="wrap-wide pf-plates-head">
          <div>
            <p className="t-label">tập bản in</p>
            <h2 className="t-title">
              Mẫu đã lưu và <Mark kind="underline">bản dựng</Mark>
            </h2>
          </div>
          <span className="t-label">{activeProject.files.length} tệp đang mở</span>
        </div>

        {savedItemIds.length === 0 && (
          <div className="wrap-wide">
            <div className="pf-empty-note">
              <p className="t-lead" style={{ fontSize: 'var(--text-sm)' }}>
                Chưa có mẫu nào được lưu từ Bàn soi. Các dự án Workspace và kho tham chiếu cốt lõi đang hiển thị bên
                dưới.
              </p>
              <button type="button" className="btn btn-line btn-sm" onClick={() => navigate('explore')}>
                Mở bàn soi
              </button>
            </div>
          </div>
        )}

        <div className="pf-fan no-scrollbar" role="list" aria-label="Các tấm bản in">
          {specimens.map((item, idx) => {
            const isSelected = selectedSpecimen?.id === item.id;
            const preview = item.previewId ? previewFor(item.previewId) : null;
            return (
              <button
                key={item.id}
                type="button"
                role="listitem"
                aria-pressed={isSelected}
                onClick={() => setSelectedId(item.id)}
                className="pf-card"
                style={{ '--pf-tilt': FAN_TILTS[idx % FAN_TILTS.length] } as React.CSSProperties}
              >
                <div className="plate pf-card-media">
                  {preview ? (
                    <Media preview={preview} title={item.title} />
                  ) : (
                    <div className="pf-typo-plate">
                      <span className="t-label">{item.origin}</span>
                      <span className="pf-typo-title">{item.title}</span>
                    </div>
                  )}
                </div>
                <div className="pf-card-meta">
                  <span className="pf-card-name">{item.title}</span>
                  <span className="t-label">{item.origin}</span>
                </div>
              </button>
            );
          })}
        </div>

        {selectedSpecimen && (
          <div className="wrap-wide">
            <div className="pf-focus">
              <div className="pf-focus-info">
                <p className="t-label">{selectedSpecimen.origin}</p>
                <h3 className="t-title" style={{ fontSize: 'var(--text-2xl)' }}>
                  {selectedSpecimen.title}
                </h3>
                <p className="t-lead" style={{ fontSize: 'var(--text-sm)' }}>
                  {selectedSpecimen.subtitle}
                </p>
                <div className="pf-actions">
                  <button
                    type="button"
                    className="btn btn-solid"
                    onClick={() => {
                      if (selectedSpecimen.projectId) {
                        selectProject(selectedSpecimen.projectId);
                      }
                      navigate('workspace');
                    }}
                  >
                    Workspace
                  </button>
                  {selectedSpecimen.savedId && (
                    <button
                      type="button"
                      className="btn btn-line"
                      onClick={() => toggleSavedItem(selectedSpecimen.savedId!)}
                    >
                      Bỏ lưu
                    </button>
                  )}
                </div>
              </div>

              <div className="min-w-0">
                <ReaderCard
                  title={selectedSpecimen.title}
                  subtitle={selectedSpecimen.origin}
                  paragraphs={selectedSpecimen.paragraphs}
                  openLabel="Đọc sâu"
                  theme={theme}
                />
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default ProfileView;
