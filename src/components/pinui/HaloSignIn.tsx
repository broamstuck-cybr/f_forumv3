import React, { useId, useState, type FormEvent } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Eye, EyeOff, Lock, Mail, User } from 'lucide-react';
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
  onAdminLink,
}) => {
  const reduced = Boolean(useReducedMotion());
  const uid = useId();
  const [identifier, setIdentifier] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return;
    await onSubmit({
      identifier: identifier.trim(),
      email: mode === 'register' ? email.trim() : undefined,
      name: mode === 'register' ? name.trim() || identifier.trim() : undefined,
      password,
    });
  };

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="hsi-tray w-full max-w-[430px] mx-auto"
    >
      <div className="hsi-card">
        <div className="relative mx-auto mb-5 flex h-24 w-24 items-center justify-center">
          <motion.svg
            viewBox="-60 -60 120 120"
            className="absolute inset-0 h-full w-full opacity-35"
            style={{ color: 'var(--accent-primary)' }}
            animate={reduced ? undefined : { rotate: 360 }}
            transition={{ duration: 80, ease: 'linear', repeat: Infinity }}
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
          </motion.svg>
          <div className="relative z-10 rounded-2xl p-1.5" style={{ background: 'var(--bg-canvas)' }}>
            <KineticLogo size={38} activity={loading ? 'thinking' : error ? 'error' : 'idle'} />
          </div>
        </div>

        <header className="text-center mb-6">
          <h2 className="text-[20px] font-bold tracking-tight" style={{ color: 'var(--ink-primary)' }}>
            {mode === 'login' ? 'Đăng nhập F-FORUM v3' : 'Tạo tài khoản Maker'}
          </h2>
          <p className="mt-1 text-[13px]" style={{ color: 'var(--ink-secondary)' }}>
            {mode === 'login'
              ? 'Đồng bộ dự án Workspace, bộ sưu tập đã lưu và lượt AI.'
              : 'Bắt đầu kiến tạo giao diện với 15 lượt AI miễn phí và kho tài nguyên mở.'}
          </p>
        </header>

        <div
          className="grid grid-cols-2 gap-1 p-1 rounded-xl mb-5 border"
          style={{ background: 'var(--bg-panel)', borderColor: 'var(--border-subtle)' }}
        >
          <button
            type="button"
            onClick={() => onModeChange('login')}
            className="rounded-lg py-2 text-[13px] font-semibold cursor-pointer transition-colors"
            style={{
              background: mode === 'login' ? 'var(--bg-surface)' : 'transparent',
              color: mode === 'login' ? 'var(--ink-primary)' : 'var(--ink-muted)',
            }}
          >
            Đăng nhập
          </button>
          <button
            type="button"
            onClick={() => onModeChange('register')}
            className="rounded-lg py-2 text-[13px] font-semibold cursor-pointer transition-colors"
            style={{
              background: mode === 'register' ? 'var(--bg-surface)' : 'transparent',
              color: mode === 'register' ? 'var(--ink-primary)' : 'var(--ink-muted)',
            }}
          >
            Đăng ký
          </button>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-4 rounded-xl border px-3.5 py-2.5 text-[12.5px]"
            style={{
              background: 'var(--accent-danger-soft)',
              borderColor: 'var(--accent-danger)',
              color: 'var(--accent-danger)',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'register' && (
            <div>
              <label htmlFor={`${uid}-name`} className="block text-[12px] font-medium mb-1" style={{ color: 'var(--ink-secondary)' }}>
                Tên hiển thị
              </label>
              <div
                className="flex items-center gap-2.5 rounded-xl border px-3 h-11"
                style={{ background: 'var(--bg-panel)', borderColor: 'var(--border-subtle)' }}
              >
                <User className="h-4 w-4 shrink-0" style={{ color: 'var(--ink-muted)' }} aria-hidden="true" />
                <input
                  id={`${uid}-name`}
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ví dụ: Minh Khoa"
                  className="w-full bg-transparent border-0 outline-none text-[13.5px]"
                  style={{ color: 'var(--ink-primary)' }}
                />
              </div>
            </div>
          )}

          <div>
            <label htmlFor={`${uid}-id`} className="block text-[12px] font-medium mb-1" style={{ color: 'var(--ink-secondary)' }}>
              {mode === 'login' ? 'Tên đăng nhập hoặc Email' : 'Tên đăng nhập'}
            </label>
            <div
              className="flex items-center gap-2.5 rounded-xl border px-3 h-11"
              style={{ background: 'var(--bg-panel)', borderColor: 'var(--border-subtle)' }}
            >
              <User className="h-4 w-4 shrink-0" style={{ color: 'var(--ink-muted)' }} aria-hidden="true" />
              <input
                id={`${uid}-id`}
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={mode === 'login' ? 'username hoặc email' : 'minhkhoa_dev'}
                autoComplete="username"
                className="w-full bg-transparent border-0 outline-none text-[13.5px]"
                style={{ color: 'var(--ink-primary)' }}
              />
            </div>
          </div>

          {mode === 'register' && (
            <div>
              <label htmlFor={`${uid}-email`} className="block text-[12px] font-medium mb-1" style={{ color: 'var(--ink-secondary)' }}>
                Email
              </label>
              <div
                className="flex items-center gap-2.5 rounded-xl border px-3 h-11"
                style={{ background: 'var(--bg-panel)', borderColor: 'var(--border-subtle)' }}
              >
                <Mail className="h-4 w-4 shrink-0" style={{ color: 'var(--ink-muted)' }} aria-hidden="true" />
                <input
                  id={`${uid}-email`}
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="maker@example.com"
                  autoComplete="email"
                  className="w-full bg-transparent border-0 outline-none text-[13.5px]"
                  style={{ color: 'var(--ink-primary)' }}
                />
              </div>
            </div>
          )}

          <div>
            <label htmlFor={`${uid}-pw`} className="block text-[12px] font-medium mb-1" style={{ color: 'var(--ink-secondary)' }}>
              Mật khẩu
            </label>
            <div
              className="flex items-center gap-2.5 rounded-xl border px-3 h-11"
              style={{ background: 'var(--bg-panel)', borderColor: 'var(--border-subtle)' }}
            >
              <Lock className="h-4 w-4 shrink-0" style={{ color: 'var(--ink-muted)' }} aria-hidden="true" />
              <input
                id={`${uid}-pw`}
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Tối thiểu 6 ký tự"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                className="w-full bg-transparent border-0 outline-none text-[13.5px]"
                style={{ color: 'var(--ink-primary)' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                className="inline-grid place-items-center h-7 w-7 rounded-lg cursor-pointer bg-transparent border-0"
                style={{ color: 'var(--ink-muted)' }}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex h-11 w-full items-center justify-center rounded-xl border-0 text-[13.5px] font-semibold cursor-pointer transition-opacity disabled:opacity-60"
            style={{
              background: 'var(--accent-gradient)',
              color: 'var(--ink-inverse)',
            }}
          >
            <span>{loading ? 'Đang xử lý' : mode === 'login' ? 'Đăng nhập' : 'Đăng ký'}</span>
          </button>
        </form>
      </div>

      <div className="flex items-center justify-between px-4 py-3 text-[12px]" style={{ color: 'var(--ink-muted)' }}>
        <span>
          {mode === 'login' ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}{' '}
          <button
            type="button"
            onClick={() => onModeChange(mode === 'login' ? 'register' : 'login')}
            className="bg-transparent border-0 p-0 font-semibold cursor-pointer"
            style={{ color: 'var(--accent-primary)' }}
          >
            {mode === 'login' ? 'Đăng ký' : 'Đăng nhập'}
          </button>
        </span>
      </div>
    </motion.div>
  );
};

export default HaloSignIn;
