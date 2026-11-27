import React, { useId, useState, type FormEvent } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { IconEye, IconEyeOff, IconLock, IconMail, IconUser } from '../../ui/icons';
import { KineticLogo } from '../brand/KineticLogo';

export interface HaloSignInPayload {
  identifier: string;
  email?: string;
  password: string;
  name?: string;
}

export interface HaloSignInProps {
  mode: 'login' | 'register';
  onModeChange: (mode: 'login' | 'register') => void;
  onSubmit: (payload: HaloSignInPayload) => Promise<void>;
  error?: string | null;
  loading?: boolean;
  onAdminLink?: () => void;
  onGuestContinue?: () => void;
  embedded?: boolean;
}

const HALO_RINGS = [
  { r: 34, n: 16 },
  { r: 44, n: 22 },
  { r: 54, n: 28 },
];

export const HaloSignIn: React.FC<HaloSignInProps> = ({
  mode,
  onModeChange,
  onSubmit,
  error,
  loading = false,
  onGuestContinue,
  embedded = false,
}) => {
  const reduced = Boolean(useReducedMotion());
  const uid = useId();
  const [identifier, setIdentifier] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const displayError = error || localError;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return;
    setLocalError(null);

    const cleanId = identifier.trim();
    const cleanEmail = email.trim();
    if (!cleanId) {
      setLocalError(mode === 'login' ? 'Vui lòng nhập tên đăng nhập hoặc email.' : 'Vui lòng nhập tên đăng nhập.');
      return;
    }
    if (mode === 'register' && (!cleanEmail || !cleanEmail.includes('@'))) {
      setLocalError('Vui lòng nhập địa chỉ email hợp lệ.');
      return;
    }
    if (password.length < 6) {
      setLocalError('Mật khẩu cần ít nhất 6 ký tự.');
      return;
    }

    await onSubmit({
      identifier: cleanId,
      email: mode === 'register' ? cleanEmail : undefined,
      name: mode === 'register' ? name.trim() || cleanId : undefined,
      password,
    });
  };

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 12, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      className={`hsi-tray${embedded ? ' hsi-tray--modal' : ''} w-full max-w-[430px] mx-auto`}
    >
      <div className={`hsi-card${embedded ? ' hsi-card--modal' : ''}`}>
        <div
          className={`relative mx-auto flex items-center justify-center ${
            embedded ? 'mb-2.5 h-14 w-14' : 'mb-4 h-20 w-20'
          }`}
        >
          <svg
            viewBox="-60 -60 120 120"
            className="absolute inset-0 h-full w-full opacity-35"
            style={{ color: 'var(--accent)' }}
            aria-hidden="true"
          >
            {HALO_RINGS.flatMap(({ r, n }, ri) =>
              Array.from({ length: n }, (_, i) => {
                const a = (i / n) * Math.PI * 2 + ri * 0.35;
                const cx = Math.round(Math.cos(a) * r * 1000) / 1000;
                const cy = Math.round(Math.sin(a) * r * 1000) / 1000;
                return <circle key={`${ri}-${i}`} cx={cx} cy={cy} r={1} fill="currentColor" />;
              })
            )}
          </svg>
          <div className="relative z-10 rounded-2xl p-1.5" style={{ background: 'var(--bg-raised)' }}>
            <KineticLogo size={embedded ? 30 : 36} activity={loading ? 'thinking' : displayError ? 'error' : 'idle'} />
          </div>
        </div>

        <header className={`text-center ${embedded ? 'mb-3.5' : 'mb-5'}`}>
          <h2 className="text-[19px] font-bold tracking-tight" style={{ color: 'var(--fg)', fontFamily: 'var(--font-ui)' }}>
            {mode === 'login' ? 'Đăng nhập F-Forum' : 'Tạo tài khoản mới'}
          </h2>
          <p className="mt-1 text-[13px]" style={{ color: 'var(--fg-muted)' }}>
            {mode === 'login'
              ? 'Lưu dự án Workspace và mẫu yêu thích của bạn.'
              : 'Đăng ký nhanh bằng tài khoản, email và mật khẩu.'}
          </p>
        </header>

        <div
          className="grid grid-cols-2 gap-1 p-1 rounded-xl mb-3.5 border"
          style={{ background: 'var(--bg-sunken)', borderColor: 'var(--line)' }}
          role="tablist"
          aria-label="Chọn hình thức xác thực"
        >
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'login'}
            onClick={() => {
              setLocalError(null);
              onModeChange('login');
            }}
            className={`hsi-tab${mode === 'login' ? ' is-active' : ''}`}
          >
            Đăng nhập
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'register'}
            onClick={() => {
              setLocalError(null);
              onModeChange('register');
            }}
            className={`hsi-tab${mode === 'register' ? ' is-active' : ''}`}
          >
            Đăng ký
          </button>
        </div>

        {displayError && (
          <div
            role="alert"
            className="mb-4 rounded-xl border px-3.5 py-2.5 text-[12.5px] leading-relaxed"
            style={{
              background: 'var(--danger-soft)',
              borderColor: 'var(--danger)',
              color: 'var(--danger)',
            }}
          >
            {displayError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3" noValidate>
          {mode === 'register' && (
            <div>
              <label htmlFor={`${uid}-name`} className="block text-[12px] font-medium mb-1" style={{ color: 'var(--fg-muted)' }}>
                Tên hiển thị
              </label>
              <div
                className="flex items-center gap-2.5 rounded-xl border px-3 h-11"
                style={{ background: 'var(--bg-sunken)', borderColor: 'var(--line)' }}
              >
                <IconUser className="h-4 w-4 shrink-0" style={{ color: 'var(--fg-faint)' }} aria-hidden="true" />
                <input
                  id={`${uid}-name`}
                  name="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ví dụ: Minh Khoa"
                  autoComplete="name"
                  className="w-full bg-transparent border-0 outline-none text-[14px]"
                  style={{ color: 'var(--fg)' }}
                />
              </div>
            </div>
          )}

          <div>
            <label htmlFor={`${uid}-id`} className="block text-[12px] font-medium mb-1" style={{ color: 'var(--fg-muted)' }}>
              {mode === 'login' ? 'Tên đăng nhập hoặc Email' : 'Tên đăng nhập'}
            </label>
            <div
              className="flex items-center gap-2.5 rounded-xl border px-3 h-11"
              style={{ background: 'var(--bg-sunken)', borderColor: 'var(--line)' }}
            >
              <IconUser className="h-4 w-4 shrink-0" style={{ color: 'var(--fg-faint)' }} aria-hidden="true" />
              <input
                id={`${uid}-id`}
                name="username"
                type="text"
                required
                value={identifier}
                onChange={(e) => {
                  setLocalError(null);
                  setIdentifier(e.target.value);
                }}
                placeholder={mode === 'login' ? 'Nhập tên đăng nhập hoặc email' : 'minhkhoa'}
                autoComplete="username"
                className="w-full bg-transparent border-0 outline-none text-[14px]"
                style={{ color: 'var(--fg)' }}
              />
            </div>
          </div>

          {mode === 'register' && (
            <div>
              <label htmlFor={`${uid}-email`} className="block text-[12px] font-medium mb-1" style={{ color: 'var(--fg-muted)' }}>
                Email
              </label>
              <div
                className="flex items-center gap-2.5 rounded-xl border px-3 h-11"
                style={{ background: 'var(--bg-sunken)', borderColor: 'var(--line)' }}
              >
                <IconMail className="h-4 w-4 shrink-0" style={{ color: 'var(--fg-faint)' }} aria-hidden="true" />
                <input
                  id={`${uid}-email`}
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setLocalError(null);
                    setEmail(e.target.value);
                  }}
                  placeholder="ban@example.com"
                  autoComplete="email"
                  className="w-full bg-transparent border-0 outline-none text-[14px]"
                  style={{ color: 'var(--fg)' }}
                />
              </div>
            </div>
          )}

          <div>
            <label htmlFor={`${uid}-pw`} className="block text-[12px] font-medium mb-1" style={{ color: 'var(--fg-muted)' }}>
              Mật khẩu
            </label>
            <div
              className="flex items-center gap-2.5 rounded-xl border px-3 h-11"
              style={{ background: 'var(--bg-sunken)', borderColor: 'var(--line)' }}
            >
              <IconLock className="h-4 w-4 shrink-0" style={{ color: 'var(--fg-faint)' }} aria-hidden="true" />
              <input
                id={`${uid}-pw`}
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={password}
                onChange={(e) => {
                  setLocalError(null);
                  setPassword(e.target.value);
                }}
                placeholder="Tối thiểu 6 ký tự"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                className="w-full bg-transparent border-0 outline-none text-[14px]"
                style={{ color: 'var(--fg)' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                className="inline-grid place-items-center h-9 w-9 rounded-lg cursor-pointer bg-transparent border-0 shrink-0"
                style={{ color: 'var(--fg-faint)' }}
              >
                {showPassword ? <IconEyeOff className="h-4 w-4" /> : <IconEye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex h-11 w-full items-center justify-center rounded-xl border-0 text-[14px] font-semibold cursor-pointer disabled:opacity-60"
            style={{
              background: 'var(--accent-fill)',
              color: 'var(--on-accent)',
              transition: 'opacity 160ms ease, transform 120ms ease',
            }}
          >
            <span>{loading ? 'Đang xử lý...' : mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}</span>
          </button>

          {onGuestContinue && (
            <button
              type="button"
              onClick={onGuestContinue}
              className="flex h-11 w-full items-center justify-center rounded-xl border text-[13px] font-medium cursor-pointer"
              style={{
                background: 'transparent',
                borderColor: 'var(--line-strong)',
                color: 'var(--fg-muted)',
                transition: 'border-color 160ms ease, color 160ms ease',
              }}
            >
              Dùng chế độ khách
            </button>
          )}
        </form>
      </div>

      <div className="flex items-center justify-center px-4 py-2.5 text-[12px]" style={{ color: 'var(--fg-faint)' }}>
        <span>
          {mode === 'login' ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}{' '}
          <button
            type="button"
            onClick={() => {
              setLocalError(null);
              onModeChange(mode === 'login' ? 'register' : 'login');
            }}
            className="bg-transparent border-0 p-0 font-semibold cursor-pointer"
            style={{ color: 'var(--accent)' }}
          >
            {mode === 'login' ? 'Đăng ký' : 'Đăng nhập'}
          </button>
        </span>
      </div>
    </motion.div>
  );
};

export default HaloSignIn;
