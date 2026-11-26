import React, { useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { IconCheck, IconUpload } from '../../ui/icons';

export interface DroppedFilePayload {
  name: string;
  content: string;
}

export interface DynamicDropZoneProps {
  onFilesAdded: (files: DroppedFilePayload[]) => void;
  label?: string;
  hintText?: string;
  accept?: string;
  multiple?: boolean;
  compact?: boolean;
  className?: string;
}

export const DynamicDropZone: React.FC<DynamicDropZoneProps> = ({
  onFilesAdded,
  label = 'Kéo thả hoặc chọn tệp để nạp',
  hintText = 'HTML · CSS · JS · Markdown · JSON',
  accept = '.html,.css,.js,.ts,.tsx,.json,.md,.txt,.svg,image/*',
  multiple = true,
  compact = false,
  className = '',
}) => {
  const reduced = Boolean(useReducedMotion());
  const inputRef = useRef<HTMLInputElement>(null);
  const dragDepthRef = useRef(0);
  const [over, setOver] = useState(false);
  const [phase, setPhase] = useState<'idle' | 'done'>('idle');
  const [lastCount, setLastCount] = useState(0);

  const readFileList = async (list: FileList | File[]) => {
    const items = Array.from(list).slice(0, multiple ? 6 : 1);
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
          return { name: file.name, content: text.slice(0, 60000) };
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

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    dragDepthRef.current += 1;
    setOver(true);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    if (!over) setOver(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
    if (dragDepthRef.current === 0 || !e.currentTarget.contains(e.relatedTarget as Node)) {
      dragDepthRef.current = 0;
      setOver(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    dragDepthRef.current = 0;
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

  const buttonLabel = phase === 'done' ? 'Đã nạp' : over ? 'Thả tệp' : 'Chọn tệp';

  return (
    <div
      data-over={over}
      role="button"
      tabIndex={0}
      aria-label={`${label}. ${hintText}`}
      className={`pdz-zone ${compact ? 'px-3 py-2.5' : 'px-5 py-5'} ${className}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      onClick={(e) => {
        if ((e.target as HTMLElement).tagName !== 'BUTTON') {
          inputRef.current?.click();
        }
      }}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        multiple={multiple}
        accept={accept}
        className="sr-only"
        onChange={handleInputChange}
      />

      {!compact && (
        <div
          className="pointer-events-none absolute inset-2 rounded-[14px] border border-dashed transition-opacity"
          style={{
            borderColor: over ? 'var(--accent-primary)' : 'var(--border-strong)',
            opacity: over ? 0.85 : 0.35,
          }}
          aria-hidden="true"
        />
      )}

      <motion.div
        animate={reduced ? undefined : over ? { scale: 1.03 } : { scale: 1 }}
        transition={{ type: 'spring', stiffness: 320, damping: 24 }}
        className="relative z-10 flex flex-wrap items-center justify-center gap-3 w-full"
      >
        <span
          className="inline-grid place-items-center rounded-full shrink-0"
          aria-hidden="true"
          style={{
            width: compact ? 28 : 38,
            height: compact ? 28 : 38,
            background: phase === 'done' ? 'var(--accent-jade-soft)' : 'var(--accent-soft)',
            color: phase === 'done' ? 'var(--accent-jade)' : 'var(--accent-primary)',
          }}
        >
          {phase === 'done' ? (
            <IconCheck className="h-4 w-4" aria-hidden="true" />
          ) : (
            <IconUpload className="h-4 w-4" aria-hidden="true" />
          )}
        </span>
        <div className="text-left min-w-0 flex-1">
          <div className="text-[13px] font-medium" style={{ color: 'var(--ink-primary)' }}>
            {phase === 'done' ? `Đã nạp ${lastCount} tệp hợp lệ` : label}
          </div>
          {!compact && hintText && (
            <div className="text-[11.5px] font-mono mt-0.5" style={{ color: 'var(--ink-muted)' }}>
              {hintText}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            inputRef.current?.click();
          }}
          className="shrink-0 rounded-full border px-4 py-1.5 text-[12px] font-semibold cursor-pointer transition-colors"
          style={{
            background: phase === 'done' ? 'var(--accent-jade-soft)' : 'var(--bg-surface)',
            borderColor: phase === 'done' ? 'var(--accent-jade)' : 'var(--border-accent)',
            color: phase === 'done' ? 'var(--accent-jade)' : 'var(--accent-primary)',
          }}
        >
          {buttonLabel}
        </button>
      </motion.div>
    </div>
  );
};

export default DynamicDropZone;
