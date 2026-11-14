'use client';

import { usePromotionCode } from '@web/context/promotion-code-provider';
import { PricingTierCard } from '@web/modules/pricing/components/pricing-tier-card/pricing-tier-card';
import { readCurrencyCookie } from '@web/utils/currency-cookie';
import type { ILivePlanPrice } from '@web/utils/to-live-plan-price';
import { toLivePricingCard } from '@web/utils/to-live-pricing-card';
import type { IPricingCardData } from '@web/utils/to-pricing-panels';
import { useLocale, useTranslations } from 'next-intl';
import { useSyncExternalStore } from 'react';

export interface ILinkedPricingTierCardProps {
  card: IPricingCardData;
  livePrice: ILivePlanPrice;
}

const subscribeToNothing = () => () => {};

export const LinkedPricingTierCard = ({
  card,
  livePrice,
}: ILinkedPricingTierCardProps) => {
  const t = useTranslations('pricingModule');
  const locale = useLocale();
  const { discount } = usePromotionCode();
  const { defaultCurrency } = livePrice;
  const currency = useSyncExternalStore(
    subscribeToNothing,
    () => readCurrencyCookie(document.cookie) ?? defaultCurrency,
    () => defaultCurrency,
  );

  return (
    <PricingTierCard
      card={toLivePricingCard({
        card,
        livePrice,
        currency,
        discount,
        locale,
        labels: {
          free: t('free'),
          compareAtLabel: t('compareAtLabel'),
          once: t('promo.once'),
          repeating: (months) => t('promo.repeating', { months }),
        },
      })}
    />
  );
};
