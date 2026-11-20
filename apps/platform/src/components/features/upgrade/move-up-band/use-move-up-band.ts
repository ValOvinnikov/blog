'use client';

import { useRouter } from '@platform/i18n/navigation';
import {
  getMoveUpQuoteAction,
  type TMoveUpQuoteResult,
} from '@platform/server/billing/get-move-up-quote-action';
import { getTenantBandAction } from '@platform/server/billing/get-tenant-band-action';
import { moveUpSubscriberBandAction } from '@platform/server/billing/move-up-band-action';
import type { TMoveUpOffer } from '@platform/utils/move-up-offer/move-up-offer';
import { adminRoutes } from '@platform/utils/routes/routes';
import { usePaidChange } from '@platform/utils/use-paid-change/use-paid-change';
import type { TMaybeNull, TMaybeUndefined } from '@shinefold/config';
import type { TPaidSubscriberBandCeiling } from '@shinefold/db/constants';
import { useState, useTransition } from 'react';

export const useMoveUpBand = (
  tenantId: string,
  { ceiling }: Pick<TMoveUpOffer, 'ceiling'>,
  publishableKey: TMaybeUndefined<string>,
) => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [quote, setQuote] = useState<TMoveUpQuoteResult>();
  const [isLoading, startLoading] = useTransition();
  const { submit, isPending, ...progress } = usePaidChange<
    TMaybeNull<TPaidSubscriberBandCeiling>
  >({
    tenantId,
    current: null,
    poll: getTenantBandAction,
    publishableKey,
    onSettled: () =>
      router.push(adminRoutes.dashboardSubscribersMovedUp(ceiling)),
  });
  const isPaying = isPending || (progress.isConfirming && !progress.isSlow);

  const requestOpenChange = (nextIsOpen: boolean) => {
    if (!nextIsOpen && isPaying) return;
    setIsOpen(nextIsOpen);
    if (!nextIsOpen) return;
    setQuote(undefined);
    startLoading(async () => {
      setQuote(await getMoveUpQuoteAction(tenantId, { ceiling }));
    });
  };

  const pay = (prorationDate: number) =>
    submit(
      () => moveUpSubscriberBandAction(tenantId, { ceiling, prorationDate }),
      ceiling,
    );

  return {
    isOpen,
    requestOpenChange,
    quote: isLoading ? undefined : quote,
    pay,
    isPending,
    isPaying,
    progress,
  };
};

export type TMoveUpBandState = ReturnType<typeof useMoveUpBand>;
