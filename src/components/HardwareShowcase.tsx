import React, { useState } from 'react';
import {
  Smartphone,
  Laptop,
  CheckCircle2,
  RotateCcw,
  Compass,
  Lock,
  Terminal,
  Folder,
  Layers,
  Code2,
  BookOpenCheck,
  Sparkles,
} from 'lucide-react';
import type { DimensionView } from '../types/index';

interface HardwareShowcaseProps {
  onNavigate?: (view: DimensionView) => void;
  className?: string;
}

export const HardwareShowcase: React.FC<HardwareShowcaseProps> = ({
  onNavigate,
  className = '',
}) => {
  const [deviceType, setDeviceType] = useState<'iphone' | 'macbook'>('macbook');
  const [isMacWindowOpen, setIsMacWindowOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'workspace' | 'explore' | 'qa' | 'clubs'>('workspace');
  const [selectedChoice, setSelectedChoice] = useState<number>(0);

  return (
    <div className={`hardware-showcase-wrapper relative flex flex-col items-center justify-center w-full ${className}`}>
      <div className="mb-4 flex items-center justify-center gap-2 p-1.5 rounded-2xl bg-[#121722]/90 border border-white/10 shadow-lg z-20 backdrop-blur-md">
        <button
          type="button"
          onClick={() => setDeviceType('macbook')}
          title="Chế độ Desktop Workbench"
          aria-label="Chế độ Desktop Workbench"
          className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
            deviceType === 'macbook'
              ? 'bg-amber-400 text-[#0b0d12] font-bold shadow-md'
              : 'text-white/65 hover:text-white hover:bg-white/5'
          }`}
        >
          <Laptop className="w-4 h-4" aria-hidden="true" />
          <span>Desktop</span>
        </button>

        <button
          type="button"
          onClick={() => setDeviceType('iphone')}
          title="Chế độ Di động Responsive"
          aria-label="Chế độ Di động Responsive"
          className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
            deviceType === 'iphone'
              ? 'bg-amber-400 text-[#0b0d12] font-bold shadow-md'
              : 'text-white/65 hover:text-white hover:bg-white/5'
          }`}
        >
          <Smartphone className="w-4 h-4" aria-hidden="true" />
          <span>Mobile</span>
        </button>
      </div>

      {deviceType === 'iphone' ? (
        <div className="relative w-[310px] sm:w-[330px] rounded-[40px] border-[6px] border-[#272c38] bg-[#080c14] shadow-2xl overflow-hidden select-none">
          <div className="mx-auto mt-2.5 h-5 w-28 rounded-full bg-black border border-white/10 flex items-center justify-center">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          </div>
          <div className="p-4 space-y-3 text-left text-white">
            <div className="flex items-center justify-between">
              <span className="font-serif italic font-bold text-amber-300 text-base">F-Forum v3</span>
              <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-mono text-emerald-300">
                390px Ready
              </span>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#121722] p-3.5 space-y-2">
              <div className="flex items-center gap-2 text-[11px] font-mono text-amber-300">
                <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Home Launchpad</span>
              </div>
              <p className="text-[12.5px] font-semibold text-white leading-snug">
                Dựng giao diện Web/UI và xem trực tiếp Live Preview ngay trên trình duyệt.
              </p>
              <button
                type="button"
                onClick={() => onNavigate?.('home')}
                className="w-full rounded-xl bg-amber-400 py-2 text-[12px] font-bold text-[#090b10] cursor-pointer"
              >
                Mở Home Launchpad
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onNavigate?.('explore')}
                className="rounded-xl border border-white/10 bg-white/5 p-3 text-left cursor-pointer"
              >
                <Layers className="w-4 h-4 text-teal-300 mb-1.5" aria-hidden="true" />
                <div className="text-[12px] font-semibold">Explore</div>
                <div className="text-[10.5px] text-white/60">121 mẫu UI</div>
              </button>
              <button
                type="button"
                onClick={() => onNavigate?.('workspace')}
                className="rounded-xl border border-white/10 bg-white/5 p-3 text-left cursor-pointer"
              >
                <Code2 className="w-4 h-4 text-amber-300 mb-1.5" aria-hidden="true" />
                <div className="text-[12px] font-semibold">Work space</div>
                <div className="text-[10.5px] text-white/60">Diff &amp; Checks</div>
              </button>
            </div>

            <div className="rounded-xl border border-white/10 bg-[#0d121c] p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpenCheck className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                <span className="text-[11.5px] text-white/85">Source of Knowledge</span>
              </div>
              <button
                type="button"
                onClick={() => onNavigate?.('community')}
                className="text-[11px] font-mono text-amber-300 bg-transparent border-0 cursor-pointer"
              >
                Xem
              </button>
            </div>
          </div>
          <div className="mx-auto my-3 h-1 w-24 rounded-full bg-white/25" />
        </div>
      ) : (
        <div className="macbook-showcase-container flex flex-col items-center justify-center w-full max-w-[560px] select-none">
          <div
            className="macbook-lid relative w-full h-[360px] rounded-t-2xl p-[10px] flex flex-col overflow-hidden"
            style={{
              background: 'linear-gradient(180deg, #323741 0%, #191d26 100%)',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.55), inset 0 1px 1px rgba(255, 255, 255, 0.16)',
              border: '1px solid #444a57',
            }}
          >
            <div className="absolute top-[3px] left-1/2 -translate-x-1/2 w-24 h-3 bg-black rounded-b-md flex items-center justify-center z-30">
              <div className="w-1.5 h-1.5 rounded-full bg-[#1b354b] border border-white/20" />
            </div>

            <div className="macbook-screen flex-1 rounded-lg overflow-hidden bg-gradient-to-br from-[#080d17] via-[#0c1424] to-[#06080d] flex flex-col relative border border-black/80">
              <div className="h-5 w-full bg-[#151b28]/90 border-b border-white/10 px-3 flex items-center justify-between text-[9px] font-sans text-white/80 z-20">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-amber-300">F-FORUM</span>
                  <span className="text-white/60">Home</span>
                  <span className="text-white/60">Explore</span>
                  <span className="text-white/60">Work space</span>
                </div>
                <div className="flex items-center gap-2 font-mono text-[9px] text-white/65">
                  <span>Sandbox</span>
                  <span>v3.0</span>
                </div>
              </div>

              <div className="flex-1 p-2 relative flex flex-col overflow-hidden">
                {isMacWindowOpen ? (
                  <div className="macbook-browser-window flex-1 rounded-xl bg-[#0d121c] border border-white/15 flex flex-col overflow-hidden shadow-2xl">
                    <div className="h-7 bg-[#141a26] border-b border-white/10 px-2.5 flex items-center justify-between shrink-0">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setIsMacWindowOpen(false)}
                          className="w-2.5 h-2.5 rounded-full bg-rose-500 cursor-pointer border-0"
                          aria-label="Thu gọn cửa sổ mô phỏng"
                        />
                        <button
                          type="button"
                          onClick={() => setIsMacWindowOpen(false)}
                          className="w-2.5 h-2.5 rounded-full bg-amber-500 cursor-pointer border-0"
                          aria-label="Ẩn cửa sổ mô phỏng"
                        />
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      </div>

                      <div className="flex-1 max-w-[260px] mx-auto h-5 rounded-md bg-black/40 border border-white/10 px-2 flex items-center justify-center gap-1.5 text-[9px] font-mono text-white/70">
                        <Lock className="w-2.5 h-2.5 text-emerald-400" aria-hidden="true" />
                        <span className="text-amber-200">f-forum.dev/workspace</span>
                      </div>

                      <div className="w-8 flex justify-end text-white/40 text-[9px]">
                        <RotateCcw className="w-2.5 h-2.5" aria-hidden="true" />
                      </div>
                    </div>

                    <div className="p-2 bg-[#111622] border-b border-white/10 flex items-center justify-between text-[10px]">
                      <div className="flex items-center gap-1.5 bg-black/30 p-0.5 rounded-lg border border-white/10 font-mono text-[9px]">
                        {(
                          [
                            ['workspace', 'Work space'],
                            ['explore', 'Explore'],
                            ['qa', 'Dev Q&A'],
                            ['clubs', 'Club Hub'],
                          ] as const
                        ).map(([id, label]) => (
                          <button
                            key={id}
                            type="button"
                            onClick={() => setActiveTab(id)}
                            className={`px-2 py-0.5 rounded cursor-pointer border-0 transition-colors ${
                              activeTab === id
                                ? 'bg-amber-400 text-[#090b10] font-bold'
                                : 'bg-transparent text-white/65 hover:text-white'
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>

                      <span className="text-[9px] text-emerald-400 font-mono font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" aria-hidden="true" /> Checks OK
                      </span>
                    </div>

                    <div className="flex-1 p-3 overflow-y-auto ff-scrollbar text-left text-white space-y-2.5">
                      {activeTab === 'workspace' && (
                        <div className="p-3 rounded-xl bg-[#161d2b] border border-white/10 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono text-amber-300 font-bold">
                              Arena 3-Column · Live Sandbox
                            </span>
                            <span className="text-[10px] font-mono text-teal-300">+42 -6 diff</span>
                          </div>
                          <p className="text-xs font-semibold text-slate-100 leading-relaxed">
                            Chọn chế độ kiểm thử tự động trước khi xuất mã nguồn ZIP sạch bí mật:
                          </p>
                          <div className="grid grid-cols-2 gap-1.5 pt-1">
                            {[
                              'HTML Structure',
                              'JS Syntax Parse',
                              'Responsive 390px',
                              'Secret Leak Scan',
                            ].map((item, idx) => (
                              <button
                                key={item}
                                type="button"
                                onClick={() => setSelectedChoice(idx)}
                                className={`p-1.5 rounded-lg border text-[10px] font-mono text-left cursor-pointer transition-colors ${
                                  selectedChoice === idx
                                    ? 'bg-amber-400/20 border-amber-400 text-amber-200 font-bold'
                                    : 'bg-black/30 border-white/10 text-white/75 hover:bg-white/5'
                                }`}
                              >
                                {item}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {activeTab === 'explore' && (
                        <div className="p-3 rounded-xl bg-[#161d2b] border border-white/10 space-y-1.5">
                          <span className="text-[10px] font-mono text-teal-300 font-bold">
                            Thư viện 121 Template UI/UX
                          </span>
                          <h4 className="text-xs font-bold text-white">
                            Split Stage 60/40 với Live Preview và 1-click Mở vào Work space
                          </h4>
                          <p className="text-[10.5px] text-white/70">
                            Tổng hợp PinUI, ThreeUI direction, MotionSites, lucianLabs và CodeFronts với bản quyền MIT rõ ràng.
                          </p>
                        </div>
                      )}

                      {activeTab === 'qa' && (
                        <div className="p-3 rounded-xl bg-[#161d2b] border border-white/10 space-y-1.5">
                          <span className="text-[10px] font-mono text-emerald-300 font-bold">
                            Source of Knowledge · Dev Q&amp;A
                          </span>
                          <h4 className="text-xs font-bold text-white">
                            Phản biện kiến trúc, chỉnh sửa prompt và chọn Accepted Solution
                          </h4>
                          <p className="text-[10.5px] text-white/70">
                            Chia sẻ lập luận kỹ thuật và fork ngay Prompt Blueprint vào dự án của bạn.
                          </p>
                        </div>
                      )}

                      {activeTab === 'clubs' && (
                        <div className="p-3 rounded-xl bg-[#141f26] border border-teal-500/30 space-y-1.5">
                          <span className="text-xs font-bold text-teal-300 block">
                            Club Hub · Project Continuity Dossier
                          </span>
                          <p className="text-[10.5px] text-white/75">
                            Lưu giữ mục tiêu, kiến trúc, danh sách mốc tiếp theo và người phụ trách để chuyển giao qua các thế hệ CLB.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                    <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md space-y-2">
                      <span className="text-xs font-bold text-white block">F-FORUM Workbench</span>
                      <p className="text-[10.5px] text-white/65">
                        Bấm vào biểu tượng F dưới thanh Dock để mở lại cửa sổ mô phỏng.
                      </p>
                    </div>
                  </div>
                )}

                <div className="h-9 self-center rounded-2xl bg-white/10 backdrop-blur-xl border border-white/15 px-3 flex items-center gap-2 mt-auto shadow-xl z-20">
                  <div className="w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300">
                    <Folder className="w-3.5 h-3.5" aria-hidden="true" />
                  </div>
                  <div className="w-6 h-6 rounded-lg bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300">
                    <Compass className="w-3.5 h-3.5" aria-hidden="true" />
                  </div>
                  <div className="w-6 h-6 rounded-lg bg-black/60 border border-white/15 flex items-center justify-center text-emerald-400">
                    <Terminal className="w-3.5 h-3.5" aria-hidden="true" />
                  </div>

                  <div className="w-[1px] h-4 bg-white/20 mx-0.5" />

                  <button
                    type="button"
                    onClick={() => setIsMacWindowOpen(true)}
                    className={`w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-500 to-amber-200 flex items-center justify-center text-[#090b10] font-serif font-black text-xs shadow-md border-0 cursor-pointer transition-transform hover:scale-105 relative ${
                      isMacWindowOpen ? 'ring-2 ring-amber-400' : ''
                    }`}
                    aria-label="Mở cửa sổ F-Forum"
                  >
                    <span>F</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div
            className="macbook-base relative w-full max-w-[600px] h-3.5 rounded-b-xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(180deg, #4b505c 0%, #242831 100%)',
              boxShadow: '0 10px 20px rgba(0, 0, 0, 0.45)',
              borderTop: '1px solid #606776',
            }}
          >
            <div className="w-16 h-1 rounded-full bg-[#1a1d24]" />
          </div>
        </div>
      )}
    </div>
  );
};

export default HardwareShowcase;
