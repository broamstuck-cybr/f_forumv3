import React from 'react';
import type { AppRoute } from '../../../types/index';
import { AppFooter } from '../../layout/AppFooter';

interface LandingFooterProps {
  onNavigate: (route: AppRoute) => void;
  onOpenNotice: () => void;
}

export const LandingFooter: React.FC<LandingFooterProps> = ({ onNavigate, onOpenNotice }) => {
  return <AppFooter onNavigate={onNavigate} onOpenNotice={onOpenNotice} />;
};

export default LandingFooter;
