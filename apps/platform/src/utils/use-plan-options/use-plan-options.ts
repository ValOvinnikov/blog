'use client';

import { TENANT_PLAN } from '@blog/db/constants';
import { toOptions } from '@blog/utils/primitives';
import { useTranslations } from 'next-intl';

export const usePlanOptions = () => {
  const tPlan = useTranslations('planNames');

  return toOptions(TENANT_PLAN, (plan) => tPlan(plan));
};
