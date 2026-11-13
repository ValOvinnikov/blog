'use client';

import type { TMaybeUndefined } from '@blog/config';
import { UPGRADE_POLL } from '@platform/constants/billing';
import { useRouter } from '@platform/i18n/navigation';
import { usePolledValue } from '@platform/utils/use-polled-value/use-polled-value';
import { useState } from 'react';

export const useWebhookWait = <TValue>(
  tenantId: string,
  initialValue: TValue,
  poll: (tenantId: string) => Promise<TMaybeUndefined<TValue>>,
  isAwaiting: (value: TValue) => boolean,
) => {
  const router = useRouter();
  const [hasFailed, setHasFailed] = useState(false);
  const { value, restart, isExhausted } = usePolledValue(
    tenantId,
    initialValue,
    poll,
    {
      intervalMs: UPGRADE_POLL.INTERVAL_MS,
      maxTicks: UPGRADE_POLL.MAX_TICKS,
      isActive: isAwaiting,
      onResult: (next) => {
        if (!isAwaiting(next)) router.refresh();
      },
      onError: () => setHasFailed(true),
    },
  );

  const checkAgain = () => {
    setHasFailed(false);
    restart();
    router.refresh();
  };

  return { value, isSlow: hasFailed || isExhausted, checkAgain };
};
