import { AlertDialog } from '@base-ui/react/alert-dialog';
import { MoveUpBandQuote } from '@platform/components/features/upgrade/move-up-band/components/move-up-band-quote/move-up-band-quote';
import type { TMoveUpBandState } from '@platform/components/features/upgrade/move-up-band/use-move-up-band';
import { PlanChangeStatus } from '@platform/components/features/upgrade/plan-change-status';
import { AlertDialogShell } from '@platform/components/shared/alert-dialog-shell';
import { Button } from '@platform/components/shared/button';
import { BUTTON_VARIANT } from '@platform/constants/button';
import type { TMoveUpOffer } from '@platform/utils/move-up-offer/move-up-offer';
import { formatStripeAmount } from '@shinefold/config';
import { useLocale, useTranslations } from 'next-intl';

export type TMoveUpBandDialogProps = {
  offer: TMoveUpOffer;
  state: TMoveUpBandState;
};

export const MoveUpBandDialog = ({
  offer,
  state: { quote, pay, isPending, isPaying, progress },
}: TMoveUpBandDialogProps) => {
  const t = useTranslations('moveUpBand');
  const locale = useLocale();
  const quoted = quote?.ok ? quote.data : undefined;

  return (
    <AlertDialogShell
      title={t('title', { ceiling: offer.ceiling })}
      description={t('lead')}
      actions={
        <>
          <AlertDialog.Close
            render={
              <Button
                type="button"
                variant={BUTTON_VARIANT.SECONDARY}
                isDisabled={isPaying}
              />
            }
          >
            {t('cancel')}
          </AlertDialog.Close>
          {quoted && (
            <Button
              type="button"
              variant={BUTTON_VARIANT.PRIMARY}
              onClick={() => pay(quoted.prorationDate)}
              isDisabled={progress.isConfirming}
              isPending={isPending}
              pendingLabel={t('paying')}
            >
              {t('pay', {
                amount: formatStripeAmount(quoted.dueToday, locale),
              })}
            </Button>
          )}
        </>
      }
    >
      <MoveUpBandQuote offer={offer} quote={quote} />
      <PlanChangeStatus progress={progress} fallback={null} />
    </AlertDialogShell>
  );
};
