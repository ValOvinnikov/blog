'use client';

import { usePromotionCode } from '@web/context/promotion-code-provider';
import { useVisitorCurrency } from '@web/hooks/use-visitor-currency';
import { PricingTierCard } from '@web/modules/pricing/components/pricing-tier-card/pricing-tier-card';
import type { ILivePlanPrice } from '@web/utils/to-live-plan-price';
import { toLivePricingCard } from '@web/utils/to-live-pricing-card';
import type { IPricingCardData } from '@web/utils/to-pricing-panels';
import { useLocale, useTranslations } from 'next-intl';

const PRICE_PLACEHOLDER = '\u00a0';

export interface ILinkedPricingTierCardProps {
  card: IPricingCardData;
  livePrice: ILivePlanPrice;
}

export const LinkedPricingTierCard = ({
  card,
  livePrice,
}: ILinkedPricingTierCardProps) => {
  const t = useTranslations('pricingModule');
  const locale = useLocale();
  const { discount } = usePromotionCode();
  const currency = useVisitorCurrency(livePrice.defaultCurrency);

  if (!currency) {
    return (
      <PricingTierCard
        card={{
          ...card,
          headline: {
            amount: PRICE_PLACEHOLDER,
            compareAt: undefined,
            period: undefined,
            prefix: undefined,
          },
        }}
      />
    );
  }

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
