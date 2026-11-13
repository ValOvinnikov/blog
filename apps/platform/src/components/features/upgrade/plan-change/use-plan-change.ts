'use client';

import {
  isOutcomeRefused,
  isOutcomeSuccess,
  type TMaybeUndefined,
} from '@blog/config';
import type { TTenantPlan } from '@blog/config/constants';
import { UPGRADE_POLL } from '@platform/constants/billing';
import {
  PLAN_CHANGE_TIMING,
  type TPlanChangeRefusal,
  type TPlanChoice,
} from '@platform/constants/plan-change';
import { useRouter } from '@platform/i18n/navigation';
import { changePlanAction } from '@platform/server/billing/change-plan-action';
import { getTenantPlanAction } from '@platform/server/billing/get-tenant-plan-action';
import { usePolledValue } from '@platform/utils/use-polled-value/use-polled-value';
import { useState, useTransition } from 'react';

export const usePlanChange = (tenantId: string, currentPlan: TTenantPlan) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [refusal, setRefusal] = useState<TMaybeUndefined<TPlanChangeRefusal>>();
  const [hasFailed, setHasFailed] = useState(false);
  const [awaitedPlan, setAwaitedPlan] =
    useState<TMaybeUndefined<TTenantPlan>>();
  const isAwaiting = (plan: TTenantPlan) =>
    Boolean(awaitedPlan) && plan !== awaitedPlan;
  const { value, restart, isExhausted } = usePolledValue(
    tenantId,
    currentPlan,
    getTenantPlanAction,
    {
      intervalMs: UPGRADE_POLL.INTERVAL_MS,
      maxTicks: UPGRADE_POLL.MAX_TICKS,
      isActive: isAwaiting,
      onResult: (plan) => {
        if (plan === awaitedPlan) router.refresh();
      },
      onError: () => setHasFailed(true),
    },
  );

  const submit = (choice: TPlanChoice) => {
    setRefusal(undefined);
    setHasFailed(false);
    startTransition(async () => {
      const result = await changePlanAction(tenantId, choice);
      if (isOutcomeRefused(result)) setRefusal(result.reason);
      else if (!isOutcomeSuccess(result)) setHasFailed(true);
      else if (
        result.timing === PLAN_CHANGE_TIMING.NOW &&
        choice.plan !== currentPlan
      ) {
        setAwaitedPlan(choice.plan);
      } else router.refresh();
    });
  };

  const checkAgain = () => {
    setHasFailed(false);
    restart();
    router.refresh();
  };

  return {
    submit,
    checkAgain,
    isPending,
    refusal,
    hasFailed,
    isConfirming: isAwaiting(value),
    isSlow: isAwaiting(value) && isExhausted,
  };
};

export type TPlanChangeProgress = Omit<
  ReturnType<typeof usePlanChange>,
  'submit' | 'isPending'
>;
