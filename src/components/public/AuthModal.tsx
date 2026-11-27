import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { IconX } from '../../ui/icons';
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

function formatAuthError(err: unknown, mode: 'login' | 'register'): string {
  if (err instanceof Error && err.message) {
    const raw = err.message.trim();
    if (/^HTTP 401/i.test(raw)) return 'Tên đăng nhập hoặc mật khẩu chưa đúng.';
    if (/^HTTP 409/i.test(raw)) return 'Tên đăng nhập hoặc email này đã được đăng ký.';
    if (/^HTTP 400/i.test(raw)) return 'Thông tin chưa hợp lệ. Kiểm tra lại email và mật khẩu.';
    if (/Failed to fetch|NetworkError/i.test(raw)) {
      return 'Không kết nối được máy chủ. Bạn vẫn có thể tiếp tục dùng ngay ở chế độ khách.';
    }
    return raw;
  }
  return mode === 'login'
    ? 'Đăng nhập chưa thành công. Vui lòng kiểm tra lại thông tin.'
    : 'Chưa tạo được tài khoản. Vui lòng thử lại.';
}

export const AuthModal: React.FC<AuthModalProps> = ({ open, onClose }) => {
  const {
    authModalOpen,
    setAuthModalOpen,
    login,
    register,
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
        if (cancelled) return;
        const nextId = cfg.enabled && typeof cfg.clientId === 'string' ? cfg.clientId.trim() : '';
        if (nextId) {
          setGoogleClientId(nextId);
        } else {
          setGoogleClientId('');
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !googleClientId) {
      setGoogleReady(false);
      return;
    }
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
              addToast({ title: `Đã đăng nhập: ${res.user.name}`, type: 'success' });
              handleClose();
            })
            .catch((err) => {
              setError(
                err instanceof Error ? err.message : 'Xác minh tài khoản Google chưa thành công.'
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
        width: 340,
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
      setError(formatAuthError(err, mode));
    } finally {
      setLoading(false);
    }
  };

  const handleGuestContinue = () => {
    handleClose();
    addToast({
      type: 'info',
      title: 'Đang dùng chế độ khách',
      message: 'Bạn có thể tạo trang, xuất bản và tải file .zip ngay mà không cần tài khoản.',
    });
  };

  const hasGoogleAuth = Boolean(googleClientId.trim());

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
          aria-label="Đăng nhập tài khoản F-Forum"
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
            transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
            onClick={(event) => event.stopPropagation()}
            className="relative w-full max-w-[440px] max-h-[92dvh] overflow-y-auto rounded-[16px] border"
            style={{
              backgroundColor: 'var(--bg-raised)',
              borderColor: 'var(--line-strong)',
              boxShadow: 'var(--shadow-3)',
            }}
          >
            <button
              type="button"
              onClick={handleClose}
              aria-label="Đóng"
              title="Đóng"
              className="absolute top-3.5 right-3.5 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full border cursor-pointer"
              style={{
                backgroundColor: 'var(--bg-sunken)',
                borderColor: 'var(--line)',
                color: 'var(--fg-muted)',
                transition: 'transform 160ms cubic-bezier(0.2, 0.8, 0.2, 1), color 160ms ease',
              }}
            >
              <IconX className="h-4 w-4" aria-hidden="true" />
            </button>

            <div className="pt-2 px-1 pb-1">
              <HaloSignIn
                embedded
                mode={mode}
                onModeChange={(nextMode) => {
                  setError(null);
                  setMode(nextMode);
                }}
                onSubmit={handleSubmit}
                onGuestContinue={handleGuestContinue}
                error={error}
                loading={loading}
              />

              {hasGoogleAuth ? (
                <div className="px-4 pb-3 pt-1">
                  <div className="flex items-center gap-3 my-2 text-[11px]" style={{ color: 'var(--fg-faint)' }}>
                    <span className="h-px flex-1" style={{ backgroundColor: 'var(--line)' }} />
                    <span>hoặc đăng nhập qua Google</span>
                    <span className="h-px flex-1" style={{ backgroundColor: 'var(--line)' }} />
                  </div>

                  <div className="flex justify-center min-h-[44px]" ref={googleBtnRef}>
                    {!googleReady && (
                      <span className="text-xs self-center" style={{ color: 'var(--fg-faint)' }}>
                        Đang tải nút Google...
                      </span>
                    )}
                  </div>
                </div>
              ) : null}
            </div>

            <div
              className="flex items-center justify-center border-t px-5 py-3 text-xs text-center"
              style={{
                backgroundColor: 'var(--bg-sunken)',
                borderColor: 'var(--line)',
                color: 'var(--fg-muted)',
              }}
            >
              <span>Đăng nhập để giữ dự án lâu dài, hoặc dùng ngay không cần tài khoản.</span>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};
