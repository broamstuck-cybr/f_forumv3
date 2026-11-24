import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';
import { HaloSignIn } from '../pinui/HaloSignIn';
import { apiClient } from '../../services/apiClient';
import { useAppStore } from '../../store/appStore';

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (config: {
            client_id: string;
            callback: (res: { credential?: string }) => void;
          }) => void;
          renderButton: (
            el: HTMLElement,
            options: Record<string, string | number>
          ) => void;
        };
      };
    };
  }
}

interface AuthModalProps {
  open?: boolean;
  onClose?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ open, onClose }) => {
  const {
    authModalOpen,
    setAuthModalOpen,
    login,
    register,
    navigate,
    refreshAuthAndQuota,
    addToast,
    theme,
  } = useAppStore();
  const isOpen = typeof open === 'boolean' ? open : authModalOpen;
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleClientId, setGoogleClientId] = useState<string>(
    () => (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined)?.trim() || ''
  );
  const [googleReady, setGoogleReady] = useState(false);
  const googleBtnRef = useRef<HTMLDivElement>(null);

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
    let cancelled = false;
    void apiClient
      .getGoogleAuthConfig()
      .then((cfg) => {
        if (!cancelled && cfg.enabled && cfg.clientId) {
          setGoogleClientId(cfg.clientId);
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !googleClientId) return;
    let cancelled = false;

    const initGoogleButton = () => {
      if (cancelled || !googleBtnRef.current || !window.google?.accounts?.id) return;
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: (response) => {
          const credential = response?.credential;
          if (!credential) {
            setError('Không nhận được mã xác thực từ Google.');
            return;
          }
          setError(null);
          setLoading(true);
          void apiClient
            .loginWithGoogle(credential)
            .then(async (res) => {
              await refreshAuthAndQuota();
              addToast({ title: `Đã đăng nhập Google: ${res.user.name}`, type: 'success' });
              handleClose();
            })
            .catch((err) => {
              setError(
                err instanceof Error ? err.message : 'Xác minh tài khoản Google thất bại.'
              );
            })
            .finally(() => {
              setLoading(false);
            });
        },
      });
      googleBtnRef.current.innerHTML = '';
      window.google.accounts.id.renderButton(googleBtnRef.current, {
        type: 'standard',
        theme: theme === 'dark' ? 'filled_black' : 'outline',
        size: 'large',
        shape: 'pill',
        text: 'continue_with',
        locale: 'vi',
        width: 360,
      });
      setGoogleReady(true);
    };

    if (window.google?.accounts?.id) {
      initGoogleButton();
      return () => {
        cancelled = true;
      };
    }

    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[src="https://accounts.google.com/gsi/client"]'
    );
    if (existingScript) {
      existingScript.addEventListener('load', initGoogleButton, { once: true });
      return () => {
        cancelled = true;
        existingScript.removeEventListener('load', initGoogleButton);
      };
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = initGoogleButton;
    document.head.appendChild(script);

    return () => {
      cancelled = true;
    };
  }, [isOpen, googleClientId, theme, refreshAuthAndQuota, addToast]);

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

              <div className="px-4 pb-3 pt-1">
                <div className="flex items-center gap-3 my-2 text-[11px]" style={{ color: 'var(--ink-muted)' }}>
                  <span className="h-px flex-1" style={{ backgroundColor: 'var(--border-subtle)' }} />
                  <span>hoặc xác thực qua Google</span>
                  <span className="h-px flex-1" style={{ backgroundColor: 'var(--border-subtle)' }} />
                </div>

                {googleClientId ? (
                  <div className="flex justify-center min-h-[44px]" ref={googleBtnRef}>
                    {!googleReady && (
                      <span className="text-xs self-center" style={{ color: 'var(--ink-muted)' }}>
                        Đang tải nút Google Sign-In...
                      </span>
                    )}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      setError(
                        'Chưa cấu hình GOOGLE_CLIENT_ID trên máy chủ. Thêm OAuth 2.0 Web Client ID từ Google Cloud Console vào biến môi trường GOOGLE_CLIENT_ID (và VITE_GOOGLE_CLIENT_ID) trên Vercel để bật đăng nhập Google thật.'
                      )
                    }
                    className="w-full inline-flex items-center justify-center gap-2.5 h-11 rounded-full border px-4 text-sm font-medium cursor-pointer"
                    style={{
                      backgroundColor: 'var(--bg-panel)',
                      borderColor: 'var(--line-strong)',
                      color: 'var(--ink-primary)',
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        fill="#4285F4"
                        d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.3h6.45a5.52 5.52 0 0 1-2.39 3.62v3h3.87c2.26-2.08 3.56-5.15 3.56-8.65z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 24c3.24 0 5.95-1.07 7.93-2.9l-3.87-3c-1.07.72-2.45 1.15-4.06 1.15-3.12 0-5.77-2.11-6.71-4.95H1.29v3.1A12 12 0 0 0 12 24z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.29 14.3a7.2 7.2 0 0 1 0-4.6V6.6H1.29a12 12 0 0 0 0 10.8l4-3.1z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 4.75c1.76 0 3.34.61 4.59 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.29 6.6l4 3.1c.94-2.84 3.59-4.95 6.71-4.95z"
                      />
                    </svg>
                    <span>Tiếp tục với Google</span>
                  </button>
                )}
              </div>
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
