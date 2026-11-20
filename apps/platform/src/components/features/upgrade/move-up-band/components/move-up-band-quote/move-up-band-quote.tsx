import { Alert } from '@platform/components/shared/alert';
import { DetailList } from '@platform/components/shared/detail-list';
import { Spinner } from '@platform/components/shared/spinner';
import { Text } from '@platform/components/shared/text';
import type { TMoveUpQuoteResult } from '@platform/server/billing/get-move-up-quote-action';
import { formatStripeAmount } from '@platform/utils/format-stripe-amount/format-stripe-amount';
import type { TMoveUpOffer } from '@platform/utils/move-up-offer/move-up-offer';
import { richDate } from '@platform/utils/rich-date/rich-date';
import { ALERT_TYPE, type TMaybeUndefined } from '@shinefold/config';
import { useLocale, useTranslations } from 'next-intl';

export type TMoveUpBandQuoteProps = {
  offer: TMoveUpOffer;
  quote: TMaybeUndefined<TMoveUpQuoteResult>;
};

export const MoveUpBandQuote = ({
  offer: { ceiling, allowance, interval },
  quote,
}: TMoveUpBandQuoteProps) => {
  const t = useTranslations('moveUpBand');
  const tUpgrade = useTranslations('upgradePage');
  const locale = useLocale();

  if (!quote) return <Spinner label={t('loading')} hasLabel={true} />;
  if (!quote.ok) {
    return (
      <Alert
        type={ALERT_TYPE.ERROR}
        description={quote.error ? tUpgrade(quote.error) : t('quoteFailed')}
      />
    );
  }

  const { dueToday, renewsAt, total, card } = quote.data;
  const renewal = richDate(renewsAt, locale);

  return (
    <>
      <DetailList isBordered={true}>
        <DetailList.Row label={t('newLimitsTerm')}>
          {t('newLimits', { ceiling, allowance })}
        </DetailList.Row>
        <DetailList.Row label={t('chargedTodayTerm')}>
          {formatStripeAmount(dueToday, locale)}
        </DetailList.Row>
        <DetailList.Row label={t('renewalTerm', { date: renewal.date })}>
          {t('renewalTotal', {
            interval,
            total: formatStripeAmount(total, locale),
          })}
        </DetailList.Row>
        {card && (
          <DetailList.Row label={t('cardTerm')}>
            {t('card', card)}
          </DetailList.Row>
        )}
      </DetailList>
      <Text variant="meta">{t.rich('chargedTodayNote', renewal)}</Text>
      <Text variant="meta">{t('moveDownNote')}</Text>
    </>
  );
};
