import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';
import { HaloSignIn } from '../pinui';
import { useAppStore } from '../../store/appStore';

interface AuthModalProps {
  open?: boolean;
  onClose?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ open, onClose }) => {
  const { authModalOpen, setAuthModalOpen, login, register, navigate } = useAppStore();
  const isOpen = typeof open === 'boolean' ? open : authModalOpen;
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleClose = () => {
    setError(null);
    if (onClose) {
      onClose();
    } else {
      setAuthModalOpen(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        handleClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen]);

  const handleSubmit = async (payload: {
    identifier: string;
    email?: string;
    password: string;
    name?: string;
  }) => {
    setError(null);
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(payload.identifier.trim(), payload.password);
      } else {
        await register({
          username: payload.identifier.trim(),
          email: (payload.email || '').trim(),
          password: payload.password,
          name: payload.name?.trim() || payload.identifier.trim(),
        });
      }
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể xác thực phiên làm việc.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminPortal = () => {
    handleClose();
    navigate('admin');
  };

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          key="ff-auth-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
          onClick={handleClose}
          role="dialog"
          aria-modal="true"
          aria-label="Xác thực tài khoản F-FORUM"
          className="fixed inset-0 z-[80] flex items-center justify-center p-4"
          style={{
            backgroundColor: 'var(--bg-veil)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <motion.div
            key="ff-auth-card"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            onClick={(event) => event.stopPropagation()}
            className="relative w-full max-w-[440px] overflow-hidden rounded-[8px] border"
            style={{
              backgroundColor: 'var(--bg-raised)',
              borderColor: 'var(--line-strong)',
              boxShadow: 'var(--shadow-3)',
            }}
          >
            <button
              type="button"
              onClick={handleClose}
              aria-label="Đóng cửa sổ đăng nhập"
              title="Đóng"
              className="absolute top-4 right-4 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full border focus-visible:outline-2 focus-visible:outline-offset-2"
              style={{
                backgroundColor: 'var(--bg-panel)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--ink-secondary)',
                transition: 'transform 160ms cubic-bezier(0.2, 0.8, 0.2, 1), color 160ms ease',
              }}
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>

            <div className="p-2 sm:p-3">
              <HaloSignIn
                mode={mode}
                onModeChange={(nextMode) => {
                  setError(null);
                  setMode(nextMode);
                }}
                onSubmit={handleSubmit}
                error={error}
                loading={loading}
                onAdminLink={handleAdminPortal}
              />
            </div>

            <div
              className="flex items-center justify-between gap-3 border-t px-6 py-3.5 text-xs"
              style={{
                backgroundColor: 'var(--bg-panel)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--ink-muted)',
              }}
            >
              <span>Phiên tiêu chuẩn: 15 lượt AI miễn phí</span>
              <button
                type="button"
                onClick={handleAdminPortal}
                className="inline-flex items-center font-medium underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2"
                style={{ color: 'var(--ink-secondary)' }}
              >
                <span>Quản trị</span>
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};
