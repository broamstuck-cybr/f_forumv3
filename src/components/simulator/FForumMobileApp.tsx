import React, { useMemo, useState } from 'react';
import { ArrowUpRight, Check, X } from 'lucide-react';
import type { DimensionView } from '../../types/index';
import sourceCatalogJson from '../../data/sourceCatalog.json';
import communitySeedJson from '../../data/communitySeed.json';

interface FForumMobileAppProps {
  onNavigate?: (view: DimensionView) => void;
  onGoHome: () => void;
  onActivityPulse?: (label: string) => void;
}

type MobileAppTab = 'prompt' | 'explore' | 'diff' | 'knowledge';

const QUICK_CHIPS = [
  {
    id: 'landing',
    label: 'Trang đích',
    prompt: 'Xây dựng trang giới thiệu tối giản với độ tương phản cao và Live View cô lập.',
  },
  {
    id: 'dashboard',
    label: 'Dữ liệu',
    prompt: 'Thiết kế bảng chỉ số trực quan với thẻ số liệu và kiểm định responsive 390px.',
  },
  {
    id: 'club',
    label: 'Hội nhóm',
    prompt: 'Tạo hồ sơ chuyển giao dự án CLB kèm lộ trình mốc và thành viên phụ trách.',
  },
  {
    id: 'critique',
    label: 'Phản biện',
    prompt: 'Dựng giao diện đối thoại Socratic tách rõ giả định, bằng chứng và đối chiếu.',
  },
  {
    id: 'code',
    label: 'Mã nguồn',
    prompt: 'Chuyển bản đặc tả thành HTML/CSS/JS sạch không phụ thuộc thư viện ngoài.',
  },
];

const STATIC_CHECKS = [
  { id: 'html', label: 'HTML5 Semantic', pass: true, note: 'Landmarks chuẩn' },
  { id: 'js', label: 'JS Syntax Clean', pass: true, note: '0 lỗi cú pháp' },
  { id: 'vp390', label: 'Viewport 390px', pass: true, note: 'Không tràn ngang' },
  { id: 'links', label: 'Nguồn trích dẫn', pass: true, note: 'MIT verified' },
  { id: 'secrets', label: 'Quét khóa bí mật', pass: true, note: '0 rò rỉ' },
  { id: 'a11y', label: 'Focus & Aria', pass: true, note: 'Đủ nhãn nút' },
];

export const FForumMobileApp: React.FC<FForumMobileAppProps> = ({
  onNavigate,
  onGoHome,
  onActivityPulse,
}) => {
  const [activeTab, setActiveTab] = useState<MobileAppTab>('prompt');
  const [promptInput, setPromptInput] = useState(QUICK_CHIPS[0].prompt);
  const [selectedChip, setSelectedChip] = useState(QUICK_CHIPS[0].id);
  const [selectedSpecimenIdx, setSelectedSpecimenIdx] = useState(0);
  const [checksState, setChecksState] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(STATIC_CHECKS.map((c) => [c.id, c.pass]))
  );
  const [upvotedIds, setUpvotedIds] = useState<Record<string, boolean>>({});

  const featuredSpecimens = useMemo(() => {
    const raw = sourceCatalogJson as Array<{
      id: string;
      title: string;
      sourceLibrary: string;
      category: string;
      description: string;
      license: string;
    }>;
    return raw.slice(0, 6);
  }, []);

  const qaThreads = useMemo(() => {
    const raw = communitySeedJson as {
      channels?: {
        qa?: Array<{
          id: string;
          title: string;
          category: string;
          votes: number;
          author: { name: string };
          acceptedAnswer?: { content: string };
        }>;
      };
    };
    return raw.channels?.qa ?? [];
  }, []);

  const passCount = useMemo(
    () => Object.values(checksState).filter(Boolean).length,
    [checksState]
  );

  const activeSpecimen = featuredSpecimens[selectedSpecimenIdx] ?? featuredSpecimens[0];

  return (
    <div
      className="relative flex h-full w-full flex-col bg-[#090a0d] text-[#f4f1ea]"
      style={{ paddingTop: '54px', paddingBottom: '26px' }}
    >
      <header className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="min-w-0">
          <div
            className="text-[16px] font-semibold tracking-tight text-[#f4f1ea]"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            F-Forum
          </div>
          <div className="text-[10.5px] font-mono text-[#c89b54]">
            Live View · Diff &amp; Check
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('workspace')}
              aria-label="Mở trên Web"
              title="Mở trên Web"
              className="grid h-8 w-8 place-items-center rounded-full border border-white/15 bg-white/5 text-[#e5c384] cursor-pointer"
            >
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          )}
          <button
            type="button"
            onClick={onGoHome}
            aria-label="Đóng ứng dụng"
            title="Đóng ứng dụng"
            className="grid h-8 w-8 place-items-center rounded-full border border-white/15 bg-white/5 text-[#adb3bf] cursor-pointer"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 pt-3 pb-24 ff-scrollbar">
        {activeTab === 'prompt' && (
          <div className="space-y-3.5">
            <div className="rounded-2xl border border-[#c89b54]/30 bg-[#12151e] p-3.5 space-y-2.5">
              <div className="flex items-center justify-between text-[10.5px] font-mono text-[#c89b54]">
                <span>PinUI Prompt</span>
                <span>0-token</span>
              </div>
              <textarea
                value={promptInput}
                onChange={(e) => setPromptInput(e.target.value)}
                rows={3}
                aria-label="Nhập mô tả giao diện"
                className="w-full resize-none rounded-xl border border-white/10 bg-[#090a0d] p-2.5 text-[12px] leading-relaxed text-[#f4f1ea] outline-none"
              />
              <div className="flex flex-wrap gap-1.5">
                {QUICK_CHIPS.map((chip) => {
                  const active = selectedChip === chip.id;
                  return (
                    <button
                      key={chip.id}
                      type="button"
                      onClick={() => {
                        setSelectedChip(chip.id);
                        setPromptInput(chip.prompt);
                        onActivityPulse?.(chip.label);
                      }}
                      className="rounded-full border px-2.5 py-1 text-[10.5px] font-medium cursor-pointer transition-colors"
                      style={{
                        borderColor: active ? 'rgba(200,155,84,0.6)' : 'rgba(255,255,255,0.12)',
                        background: active ? 'rgba(200,155,84,0.18)' : 'rgba(255,255,255,0.04)',
                        color: active ? '#e5c384' : '#adb3bf',
                      }}
                    >
                      {chip.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#10131c] p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-[#2dd4bf]">Live View</span>
                <span className="text-[10px] font-mono text-[#8891a2]">390px sandbox</span>
              </div>
              <div className="rounded-xl border border-white/10 bg-[#090a0d] p-3 space-y-2">
                <div className="text-[12px] font-semibold text-[#f4f1ea] leading-snug">
                  {QUICK_CHIPS.find((c) => c.id === selectedChip)?.label ?? 'Bản phác'}
                </div>
                <p className="m-0 text-[11px] leading-relaxed text-[#adb3bf] line-clamp-3">
                  {promptInput}
                </p>
              </div>
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('diff')}
                  className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-medium text-[#f4f1ea] cursor-pointer"
                >
                  Diff &amp; Check
                </button>
                {onNavigate && (
                  <button
                    type="button"
                    onClick={() => onNavigate('workspace')}
                    className="rounded-full border-0 px-3.5 py-1.5 text-[11px] font-semibold text-[#090a0d] cursor-pointer"
                    style={{ background: 'linear-gradient(135deg, #e5c384 0%, #c89b54 100%)' }}
                  >
                    Mở Workspace
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'explore' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-[#2dd4bf]">6.770 mẫu xác thực</span>
              {onNavigate && (
                <button
                  type="button"
                  onClick={() => onNavigate('explore')}
                  className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[10.5px] font-medium text-[#e5c384] cursor-pointer"
                >
                  Mở web
                </button>
              )}
            </div>

            {activeSpecimen && (
              <div className="rounded-2xl border border-[#c89b54]/35 bg-[#121620] p-3.5 space-y-2">
                <div className="flex items-center justify-between text-[10px] font-mono text-[#c89b54]">
                  <span>{activeSpecimen.sourceLibrary}</span>
                  <span>{activeSpecimen.category}</span>
                </div>
                <div className="text-[14px] font-semibold text-[#f4f1ea]">
                  {activeSpecimen.title}
                </div>
                <p className="m-0 text-[11.5px] leading-relaxed text-[#adb3bf]">
                  {activeSpecimen.description}
                </p>
                <div className="text-[10px] font-mono text-[#8891a2] pt-1 border-t border-white/10">
                  {activeSpecimen.license}
                </div>
              </div>
            )}

            <div className="space-y-2">
              {featuredSpecimens.map((item, idx) => {
                const selected = idx === selectedSpecimenIdx;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedSpecimenIdx(idx)}
                    className="w-full rounded-xl border p-2.5 text-left cursor-pointer transition-colors"
                    style={{
                      borderColor: selected ? 'rgba(45,212,191,0.45)' : 'rgba(255,255,255,0.08)',
                      background: selected ? 'rgba(45,212,191,0.1)' : 'rgba(255,255,255,0.03)',
                    }}
                  >
                    <div className="text-[12px] font-medium text-[#f4f1ea] truncate">
                      {item.title}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'diff' && (
          <div className="space-y-3">
            <div className="rounded-2xl border border-white/10 bg-[#11141d] p-3 font-mono text-[10.5px] space-y-1.5">
              <div className="flex items-center justify-between text-[#adb3bf] pb-1 border-b border-white/10">
                <span>landing.css</span>
                <span className="text-[#34d399]">+18 / -4</span>
              </div>
              <div className="rounded bg-rose-500/15 px-2 py-1 text-rose-300">
                - overflow: hidden;
              </div>
              <div className="rounded bg-emerald-500/15 px-2 py-1 text-emerald-300">
                + overflow-x: clip;
              </div>
              <div className="rounded bg-emerald-500/15 px-2 py-1 text-emerald-300">
                + sandbox=&quot;allow-scripts&quot;
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#11141d] p-3 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-[#c89b54]">Kiểm định tĩnh</span>
                <span className="text-[#34d399]">
                  {passCount}/{STATIC_CHECKS.length} đạt
                </span>
              </div>
              <div className="space-y-1.5">
                {STATIC_CHECKS.map((chk) => {
                  const ok = Boolean(checksState[chk.id]);
                  return (
                    <div
                      key={chk.id}
                      className="flex items-center justify-between rounded-xl border border-white/10 bg-[#090a0d] px-2.5 py-2"
                    >
                      <div className="min-w-0">
                        <div className="text-[11.5px] font-medium text-[#f4f1ea]">{chk.label}</div>
                        <div className="text-[10px] font-mono text-[#8891a2]">{chk.note}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setChecksState((prev) => ({ ...prev, [chk.id]: !prev[chk.id] }))
                        }
                        aria-label={`Chuyển trạng thái ${chk.label}`}
                        title={chk.label}
                        className="grid h-7 w-7 place-items-center rounded-full border cursor-pointer"
                        style={{
                          borderColor: ok ? 'rgba(52,211,153,0.45)' : 'rgba(244,63,94,0.45)',
                          background: ok ? 'rgba(52,211,153,0.16)' : 'rgba(244,63,94,0.16)',
                          color: ok ? '#34d399' : '#f43f5e',
                        }}
                      >
                        {ok ? (
                          <Check className="h-3.5 w-3.5" aria-hidden="true" />
                        ) : (
                          <X className="h-3.5 w-3.5" aria-hidden="true" />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'knowledge' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-[#6ee7b7]">Source of Knowledge</span>
              {onNavigate && (
                <button
                  type="button"
                  onClick={() => onNavigate('community')}
                  className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[10.5px] font-medium text-[#e5c384] cursor-pointer"
                >
                  Đọc tiếp
                </button>
              )}
            </div>

            {qaThreads.map((thread) => {
              const upvoted = Boolean(upvotedIds[thread.id]);
              return (
                <article
                  key={thread.id}
                  className="rounded-2xl border border-white/10 bg-[#11151f] p-3.5 space-y-2"
                >
                  <div className="flex items-center justify-between text-[10px] font-mono text-[#8891a2]">
                    <span className="text-[#c89b54]">{thread.category}</span>
                    <span>{thread.author.name}</span>
                  </div>
                  <h4 className="m-0 text-[12.5px] font-semibold leading-snug text-[#f4f1ea]">
                    {thread.title}
                  </h4>
                  {thread.acceptedAnswer && (
                    <p className="m-0 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-2 text-[11px] leading-relaxed text-[#d1fae5] line-clamp-3">
                      {thread.acceptedAnswer.content}
                    </p>
                  )}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10.5px] font-mono text-[#8891a2]">
                      {thread.votes + (upvoted ? 1 : 0)} tán thành
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setUpvotedIds((prev) => ({ ...prev, [thread.id]: !prev[thread.id] }))
                      }
                      className="rounded-full border px-2.5 py-1 text-[10.5px] font-medium cursor-pointer"
                      style={{
                        borderColor: upvoted ? 'rgba(200,155,84,0.55)' : 'rgba(255,255,255,0.14)',
                        background: upvoted ? 'rgba(200,155,84,0.2)' : 'rgba(255,255,255,0.05)',
                        color: upvoted ? '#e5c384' : '#adb3bf',
                      }}
                    >
                      {upvoted ? 'Đã chọn' : 'Tán thành'}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      <nav
        aria-label="Điều hướng F-Forum di động"
        className="ios-lg-bar absolute inset-x-3 bottom-6 z-30 flex items-center justify-between rounded-full p-1"
      >
        {(
          [
            ['prompt', 'Prompt'],
            ['explore', 'Explore'],
            ['diff', 'Diff & Check'],
            ['knowledge', 'Tri thức'],
          ] as const
        ).map(([id, label]) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className="flex-1 rounded-full border-0 py-2 text-[10.5px] font-medium cursor-pointer transition-colors whitespace-nowrap"
              style={{
                background: active ? 'rgba(200,155,84,0.24)' : 'transparent',
                color: active ? '#e5c384' : '#adb3bf',
              }}
            >
              {label}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default FForumMobileApp;
