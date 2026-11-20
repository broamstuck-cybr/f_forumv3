import React, { useEffect, useId, useRef, useState } from 'react';

interface PopoverProps {
  label: string;
  icon: React.ReactNode;
  children: (close: () => void) => React.ReactNode;
}

export const Popover: React.FC<PopoverProps> = ({ label, icon, children }) => {
  const [open, setOpen] = useState(false);
  const hostRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (hostRef.current && !hostRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  const close = () => {
    setOpen(false);
    buttonRef.current?.focus();
  };

  return (
    <div
      ref={hostRef}
      className="ws-pop"
      onKeyDown={(event) => {
        if (event.key !== 'Escape' || !open) return;
        event.stopPropagation();
        close();
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        className="icon-btn"
        aria-label={label}
        title={label}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
      >
        {icon}
      </button>
      {open && (
        <div id={panelId} className="ws-pop-panel">
          {children(close)}
        </div>
      )}
    </div>
  );
};
