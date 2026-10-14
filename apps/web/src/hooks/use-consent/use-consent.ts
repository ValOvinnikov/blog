'use client';

import { CONSENT_CATEGORY, type TConsentCategory } from '@blog/config';
import { useConsentStore } from '@web/hooks/use-consent-store';

type TCategoryConsentStatus = 'unknown' | 'unanswered' | 'granted' | 'denied';

export const useConsent = (
  category: TConsentCategory,
): { status: TCategoryConsentStatus; grant: () => void } => {
  const { status, granted, save } = useConsentStore();

  const grant = () => {
    if (category === CONSENT_CATEGORY.NECESSARY) return;
    save([...new Set([...granted, category])]);
  };

  if (status !== 'answered') return { status, grant };

  const isGranted =
    category === CONSENT_CATEGORY.NECESSARY || granted.includes(category);
  return { status: isGranted ? 'granted' : 'denied', grant };
};
