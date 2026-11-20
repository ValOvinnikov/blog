'use client';

import { AlertDialog } from '@base-ui/react/alert-dialog';
import { Button } from '@platform/components/shared/button';
import { BUTTON_VARIANT } from '@platform/constants/button';
import { formatStripeAmount } from '@platform/utils/format-stripe-amount/format-stripe-amount';
import type { TMoveUpOffer } from '@platform/utils/move-up-offer/move-up-offer';
import type { TMaybeUndefined } from '@shinefold/config';
import { useLocale, useTranslations } from 'next-intl';

import { MoveUpBandDialog } from './components/move-up-band-dialog/move-up-band-dialog';
import { useMoveUpBand } from './use-move-up-band';

export type TMoveUpBandProps = {
  tenantId: string;
  offer: TMoveUpOffer;
  publishableKey: TMaybeUndefined<string>;
};

export const MoveUpBand = ({
  tenantId,
  offer,
  publishableKey,
}: TMoveUpBandProps) => {
  const t = useTranslations('moveUpBand');
  const locale = useLocale();
  const state = useMoveUpBand(tenantId, offer, publishableKey);
  const { ceiling, interval, extra } = offer;

  return (
    <AlertDialog.Root
      open={state.isOpen}
      onOpenChange={state.requestOpenChange}
    >
      <AlertDialog.Trigger
        render={<Button type="button" variant={BUTTON_VARIANT.PRIMARY} />}
      >
        {t('trigger', {
          ceiling,
          interval,
          price: formatStripeAmount(extra, locale),
        })}
      </AlertDialog.Trigger>
      <MoveUpBandDialog offer={offer} state={state} />
    </AlertDialog.Root>
  );
};
