'use client';

import type { TRemoveSignInAppResult } from '@platform/server/sign-in-apps/remove-sign-in-app-action';
import type { TSaveSignInAppResult } from '@platform/server/sign-in-apps/save-sign-in-app-action';
import { isOutcomeRefused } from '@shinefold/config';
import { useTranslations } from 'next-intl';

export const useSignInAppFailureText = () => {
  const t = useTranslations('signInAppsPage');

  return (
    result: TSaveSignInAppResult | TRemoveSignInAppResult,
    fallback: string,
  ): string =>
    isOutcomeRefused(result) ? t(`refusal.${result.reason}`) : fallback;
};
