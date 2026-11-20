'use client';

import { useWebhookWait } from '@platform/components/features/upgrade/webhook-wait-status';
import {
  PLAN_CHANGE_TIMING,
  type TPlanChangeRefusal,
} from '@platform/constants/plan-change';
import { useRouter } from '@platform/i18n/navigation';
import type { TChangePlanResult } from '@platform/server/billing/plan-change-outcome';
import { confirmPlanPayment } from '@platform/utils/confirm-plan-payment/confirm-plan-payment';
import {
  isOutcomeRefused,
  isOutcomeSuccess,
  type TMaybeUndefined,
} from '@shinefold/config';
import { useState, useTransition } from 'react';

type TUsePaidChangeArgs<TValue> = {
  tenantId: string;
  current: TValue;
  poll: (tenantId: string) => Promise<TMaybeUndefined<TValue>>;
  publishableKey: TMaybeUndefined<string>;
  onSettled?: () => void;
};

export const usePaidChange = <TValue>({
  tenantId,
  current,
  poll,
  publishableKey,
  onSettled,
}: TUsePaidChangeArgs<TValue>) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [refusal, setRefusal] = useState<TMaybeUndefined<TPlanChangeRefusal>>();
  const [hasFailed, setHasFailed] = useState(false);
  const [awaited, setAwaited] = useState<{ value: TValue }>();
  const isAwaiting = (value: TValue) =>
    Boolean(awaited) && value !== awaited?.value;
  const { value, isSlow, checkAgain } = useWebhookWait(
    tenantId,
    current,
    poll,
    isAwaiting,
    onSettled,
  );

  const submit = (change: () => Promise<TChangePlanResult>, target: TValue) => {
    setRefusal(undefined);
    setHasFailed(false);
    startTransition(async () => {
      const result = await change();
      if (isOutcomeRefused(result)) return setRefusal(result.reason);
      if (!isOutcomeSuccess(result)) return setHasFailed(true);
      const { timing, clientSecret } = result;
      const paymentRefusal =
        clientSecret &&
        (await confirmPlanPayment(publishableKey, clientSecret));
      if (paymentRefusal) setRefusal(paymentRefusal);
      else if (timing === PLAN_CHANGE_TIMING.NOW && target !== current) {
        setAwaited({ value: target });
      } else router.refresh();
    });
  };

  return {
    submit,
    isPending,
    refusal,
    hasFailed,
    isConfirming: isAwaiting(value),
    isSlow,
    checkAgain,
  };
};

export type TPaidChangeProgress = Omit<
  ReturnType<typeof usePaidChange>,
  'submit' | 'isPending'
>;
