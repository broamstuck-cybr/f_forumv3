import React from 'react';
import type { AppRoute } from '../../../types/index';
import { SynaisFooter } from '../../pinui';

interface LandingFooterProps {
  onNavigate: (route: AppRoute) => void;
  onOpenNotice: () => void;
}

export const LandingFooter: React.FC<LandingFooterProps> = ({
  onNavigate,
  onOpenNotice,
}) => {
  return <SynaisFooter onNavigate={onNavigate} onOpenNotice={onOpenNotice} />;
};

export default LandingFooter;
