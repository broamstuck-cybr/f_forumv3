import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import './site-rail.css';

export interface SiteRailLink {
  id: string;
  label: string;
  href?: string;
  onClick?: () => void;
  active?: boolean;
}

export interface SiteRailProps {
  links: SiteRailLink[];
  visible?: boolean;
  onBrandClick?: () => void;
  githubUrl?: string;
  theme?: 'light' | 'dark';
  className?: string;
}

export const SiteRail: React.FC<SiteRailProps> = ({
  links,
  visible = true,
  onBrandClick,
  githubUrl,
  theme,
  className = '',
}) => {
  const reduced = Boolean(useReducedMotion());

  if (!visible) return null;

  return (
    <motion.nav
      aria-label="Điều hướng chương"
      className={`rail ${className}`}
      data-theme={theme}
      initial={reduced ? false : { opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.36, ease: [0.16, 1, 0.3, 1] }}
    >
      <button
        type="button"
        className="rail__brand"
        onClick={onBrandClick}
        aria-label="F-Forum"
      >
        F-Forum
      </button>

      <span className="rail__sep" aria-hidden="true" />

      {links.map((link) =>
        link.href ? (
          <a
            key={link.id}
            href={link.href}
            className="rail__link"
            data-active={Boolean(link.active)}
            onClick={link.onClick}
          >
            {link.label}
          </a>
        ) : (
          <button
            key={link.id}
            type="button"
            className="rail__link"
            data-active={Boolean(link.active)}
            aria-current={link.active ? 'true' : undefined}
            onClick={link.onClick}
          >
            {link.label}
          </button>
        )
      )}

      {githubUrl ? null : null}
    </motion.nav>
  );
};

export default SiteRail;
