'use client';

import { CONSENT_CATEGORY, type TConsentCategory } from '@blog/config';
import { CONSENT_STATUS, type TConsentStatus } from '@web/constants/consent';
import { useConsentStore } from '@web/hooks/use-consent-store';

type TCategoryConsentStatus = Exclude<
  TConsentStatus,
  typeof CONSENT_STATUS.ANSWERED
>;

export const useConsent = (
  category: TConsentCategory,
): { status: TCategoryConsentStatus; grant: () => void } => {
  const { status, granted, save } = useConsentStore();

  const grant = () => {
    if (category === CONSENT_CATEGORY.NECESSARY) return;
    save([...new Set([...granted, category])]);
  };

  if (status !== CONSENT_STATUS.ANSWERED) return { status, grant };

  const isGranted =
    category === CONSENT_CATEGORY.NECESSARY || granted.includes(category);
  return {
    status: isGranted ? CONSENT_STATUS.GRANTED : CONSENT_STATUS.DENIED,
    grant,
  };
};
