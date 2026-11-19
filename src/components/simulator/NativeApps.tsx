import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { DimensionView } from '../../types/index';
import type { SimulatorAppId } from './simulatorTypes';

interface NativeAppViewProps {
  appId: Exclude<SimulatorAppId, 'fforum'>;
  onGoHome: () => void;
  onOpenFForum: () => void;
  onNavigate?: (view: DimensionView) => void;
}

export const NativeAppView: React.FC<NativeAppViewProps> = ({
  appId,
  onGoHome,
  onOpenFForum,
  onNavigate,
}) => {
  const [noteText, setNoteText] = useState(
    'Nguyên tắc kiểm định: Luôn đối chiếu Diff trước khi xuất bản, giữ nguyên 1px hairline và độ tương phản AA.'
  );
  const [playing, setPlaying] = useState(true);

  const meta: Record<Exclude<SimulatorAppId, 'fforum'>, { title: string; subtitle: string }> = {
    explore: { title: 'Explore', subtitle: '6.770 mẫu từ 5 thư viện' },
    workspace: { title: 'Live View', subtitle: 'Sandbox cô lập 390px' },
    community: { title: 'Tri thức', subtitle: 'Phản biện Socratic' },
    notes: { title: 'Ghi chú', subtitle: 'Sổ tay phản biện' },
    camera: { title: 'Camera', subtitle: 'Khung ngắm quang học' },
    settings: { title: 'Cài đặt', subtitle: 'iOS 26 · Titan Pro' },
    calendar: { title: 'Lịch học', subtitle: 'Chu kỳ học thuật' },
    weather: { title: 'Thời tiết', subtitle: 'Hà Nội · 24°' },
    safari: { title: 'Trình duyệt', subtitle: 'f-forum.dev' },
    messages: { title: 'Thảo luận', subtitle: 'Nhóm thiết kế' },
    music: { title: 'Nhịp tập trung', subtitle: 'Ambient Lo-Fi · 48kHz' },
    phone: { title: 'Liên hệ', subtitle: 'Mạng lưới học thuật' },
  };

  const current = meta[appId];

  return (
    <div
      className="relative flex h-full w-full flex-col bg-[#0c0e14] text-[#f4f1ea]"
      style={{ paddingTop: '54px', paddingBottom: '28px' }}
    >
      <header className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div>
          <div className="text-[15px] font-semibold text-[#f4f1ea]">{current.title}</div>
          <div className="text-[10.5px] font-mono text-[#8891a2]">{current.subtitle}</div>
        </div>
        <button
          type="button"
          onClick={onGoHome}
          aria-label="Đóng ứng dụng"
          title="Đóng ứng dụng"
          className="grid h-8 w-8 place-items-center rounded-full border border-white/15 bg-white/5 text-[#adb3bf] cursor-pointer"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 ff-scrollbar">
        {appId === 'notes' && (
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            rows={8}
            aria-label="Nội dung ghi chú"
            className="w-full rounded-2xl border border-amber-400/25 bg-[#141720] p-3.5 text-[13px] leading-relaxed text-[#f4f1ea] outline-none"
          />
        )}

        {appId === 'camera' && (
          <div className="flex h-full flex-col justify-between rounded-3xl border border-white/15 bg-[#06070a] p-4">
            <div className="flex justify-between font-mono text-[10px] text-[#c89b54]">
              <span>RAW 48MP</span>
              <span>f/1.78</span>
            </div>
            <div className="mx-auto my-8 h-44 w-44 rounded-3xl border border-dashed border-[#c89b54]/45 grid place-items-center">
              <div className="h-3 w-3 rounded-full border border-[#c89b54]" />
            </div>
            <div className="flex justify-center">
              <button
                type="button"
                onClick={onOpenFForum}
                aria-label="Mở F-Forum"
                title="Mở F-Forum"
                className="h-14 w-14 rounded-full border-4 border-white/80 bg-white/15 cursor-pointer"
              />
            </div>
          </div>
        )}

        {appId === 'music' && (
          <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-[#2b101b] to-[#0c0e14] p-5 text-center space-y-4">
            <div className="mx-auto h-40 w-40 rounded-2xl border border-white/15 bg-[#1a1017] grid place-items-center font-serif text-3xl text-[#e5c384]">
              F
            </div>
            <div>
              <div className="text-[15px] font-semibold">Obsidian Focus</div>
              <div className="text-[11.5px] text-[#adb3bf]">Studio Ambient · 2027</div>
            </div>
            <button
              type="button"
              onClick={() => setPlaying((p) => !p)}
              className="rounded-full border border-white/20 bg-white/10 px-5 py-2 text-[12px] font-medium text-[#f4f1ea] cursor-pointer"
            >
              {playing ? 'Tạm dừng' : 'Phát tiếp'}
            </button>
          </div>
        )}

        {appId !== 'notes' && appId !== 'camera' && appId !== 'music' && (
          <div className="rounded-2xl border border-white/10 bg-[#121620] p-4 space-y-3">
            <div className="text-[12px] font-mono text-[#c89b54]">F-Forum Ecosystem</div>
            <p className="m-0 text-[13px] leading-relaxed text-[#adb3bf]">
              Trải nghiệm đầy đủ bộ công cụ Live View, Diff &amp; Check và thư viện 6.770 mẫu thực chiến ngay trong ứng dụng F-Forum.
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              <button
                type="button"
                onClick={onOpenFForum}
                className="rounded-full border-0 px-4 py-2 text-[12px] font-semibold text-[#090a0d] cursor-pointer"
                style={{ background: 'linear-gradient(135deg, #e5c384 0%, #c89b54 100%)' }}
              >
                Mở F-Forum
              </button>
              {onNavigate && (appId === 'explore' || appId === 'workspace' || appId === 'community') && (
                <button
                  type="button"
                  onClick={() => onNavigate(appId)}
                  className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-[12px] font-medium text-[#f4f1ea] cursor-pointer"
                >
                  Mở web
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NativeAppView;
