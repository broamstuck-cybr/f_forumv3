import React, { useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Check, Upload } from 'lucide-react';

export interface DroppedFilePayload {
  name: string;
  content: string;
}

export interface DynamicDropZoneProps {
  onFilesAdded: (files: DroppedFilePayload[]) => void;
  label?: string;
  compact?: boolean;
  className?: string;
}

export const DynamicDropZone: React.FC<DynamicDropZoneProps> = ({
  onFilesAdded,
  label = 'Kéo thả tệp HTML/CSS/JS/MD hoặc bấm để chọn',
  compact = false,
  className = '',
}) => {
  const reduced = Boolean(useReducedMotion());
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [phase, setPhase] = useState<'idle' | 'done'>('idle');
  const [lastCount, setLastCount] = useState(0);

  const readFileList = async (list: FileList | File[]) => {
    const items = Array.from(list).slice(0, 6);
    if (items.length === 0) return;

    const payloads: DroppedFilePayload[] = await Promise.all(
      items.map(async (file) => {
        if (file.type.startsWith('image/')) {
          return {
            name: file.name,
            content: `[Design reference image: ${file.name} (${Math.max(1, Math.round(file.size / 1024))} KB)]`,
          };
        }
        try {
          const text = await file.text();
          return { name: file.name, content: text.slice(0, 24000) };
        } catch {
          return { name: file.name, content: `[Attached file: ${file.name}]` };
        }
      })
    );

    onFilesAdded(payloads);
    setLastCount(payloads.length);
    setPhase('done');
    window.setTimeout(() => setPhase('idle'), 1800);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    if (!over) setOver(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setOver(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      void readFileList(e.dataTransfer.files);
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      void readFileList(e.target.files);
      e.target.value = '';
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={label}
      data-over={over}
      className={`pdz-zone ${compact ? 'px-3 py-2.5' : 'px-5 py-6'} ${className}`}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".html,.css,.js,.ts,.tsx,.json,.md,.txt,.svg,image/*"
        className="sr-only"
        onChange={handleInputChange}
      />

      {!compact && (
        <div className="pointer-events-none absolute inset-2 rounded-[14px] border border-dashed opacity-30" style={{ borderColor: over ? 'var(--accent-primary)' : 'var(--border-strong)' }} aria-hidden="true" />
      )}

      <motion.div
        animate={reduced ? undefined : over ? { scale: 1.06 } : { scale: 1 }}
        transition={{ type: 'spring', stiffness: 320, damping: 24 }}
        className="relative z-10 flex items-center gap-2.5"
      >
        <span
          className="inline-grid place-items-center rounded-full shrink-0"
          style={{
            width: compact ? 28 : 36,
            height: compact ? 28 : 36,
            background: phase === 'done' ? 'var(--accent-jade-soft)' : 'var(--accent-soft)',
            color: phase === 'done' ? 'var(--accent-jade)' : 'var(--accent-primary)',
          }}
        >
          {phase === 'done' ? (
            <Check className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Upload className="h-4 w-4" aria-hidden="true" />
          )}
        </span>
        <div className="text-left min-w-0">
          <div className="text-[12.5px] font-medium" style={{ color: 'var(--ink-primary)' }}>
            {phase === 'done' ? `Đã thêm ${lastCount} tệp vào ngữ cảnh` : over ? 'Thả tệp để nạp vào Work space' : label}
          </div>
          {!compact && phase === 'idle' && (
            <div className="text-[11px] font-mono mt-0.5" style={{ color: 'var(--ink-muted)' }}>
              HTML · CSS · JS · Markdown · Design screenshot
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default DynamicDropZone;
