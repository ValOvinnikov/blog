'use client';

import type { TConsentCategory } from '@blog/config';
import type { IWithChildren } from '@blog/config/react';
import { CONSENT_STATUS } from '@web/constants/consent';
import { useConsent } from '@web/hooks/use-consent';
import type { ReactNode } from 'react';

export interface IConsentGateProps extends IWithChildren {
  category: TConsentCategory;
  fallback: ReactNode;
  pending: ReactNode;
}

export const ConsentGate = ({
  category,
  fallback,
  pending,
  children,
}: IConsentGateProps) => {
  const { status } = useConsent(category);

  if (status === CONSENT_STATUS.GRANTED) return children;
  if (status === CONSENT_STATUS.UNKNOWN) return pending;
  return fallback;
};
