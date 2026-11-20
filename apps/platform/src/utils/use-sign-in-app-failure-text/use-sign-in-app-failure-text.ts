'use client';

import type { TSignInAppRefusal } from '@platform/constants/sign-in-apps';
import {
  isOutcomeRefused,
  type ACTION_OUTCOME,
  type TActionOutcome,
  type TOutcome,
  type TReasonedFailure,
} from '@shinefold/config';
import { useTranslations } from 'next-intl';

type TRefused = typeof ACTION_OUTCOME.REFUSED;

type TSignInAppFailure =
  | TOutcome<Exclude<TActionOutcome, TRefused>>
  | (TOutcome<TRefused> & TReasonedFailure<TSignInAppRefusal>);

export const useSignInAppFailureText = () => {
  const t = useTranslations('signInAppsPage');

  return (result: TSignInAppFailure, fallback: string): string =>
    isOutcomeRefused(result) ? t(`refusal.${result.reason}`) : fallback;
};
