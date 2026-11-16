'use client';

import { TENANT_PLAN } from '@shinefold/config/constants';
import { toOptions } from '@shinefold/utils/primitives';
import { useTranslations } from 'next-intl';

export const usePlanOptions = () => {
  const tPlan = useTranslations('planNames');

  return toOptions(TENANT_PLAN, (plan) => tPlan(plan));
};
