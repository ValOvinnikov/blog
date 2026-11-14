import type { TMaybeUndefined } from '@blog/config';
import {
  STRIPE_COUPON_DURATION,
  type TBillingCurrency,
} from '@blog/db/constants';
import { isUndefined } from '@blog/utils/primitives';
import { PRICING_SEARCH_PARAM } from '@web/constants/pricing';
import { formatPriceAmount } from '@web/utils/format-price-amount';
import {
  toDiscountedUnitAmount,
  type TPromotionDiscount,
} from '@web/utils/promotion-discount';
import type { ILivePlanPrice } from '@web/utils/to-live-plan-price';
import type { IPricingCardData } from '@web/utils/to-pricing-panels';
import { withSearchParam } from '@web/utils/with-search-param';

interface ILivePricingLabels {
  free: string;
  compareAtLabel: string;
  once: string;
  repeating: (months: number) => string;
}

export interface IToLivePricingCardArgs {
  card: IPricingCardData;
  livePrice: ILivePlanPrice;
  currency: TBillingCurrency;
  discount: TMaybeUndefined<TPromotionDiscount>;
  locale: string;
  labels: ILivePricingLabels;
}

const MINOR_UNITS_PER_MAJOR = 100;

const toDurationLine = (
  { duration, durationInMonths }: TPromotionDiscount,
  labels: ILivePricingLabels,
): string[] => {
  if (duration === STRIPE_COUPON_DURATION.ONCE) return [labels.once];
  if (duration === STRIPE_COUPON_DURATION.REPEATING && durationInMonths) {
    return [labels.repeating(durationInMonths)];
  }
  return [];
};

export const toLivePricingCard = ({
  card,
  livePrice: { period, defaultCurrency, amounts },
  currency,
  discount,
  locale,
  labels,
}: IToLivePricingCardArgs): IPricingCardData => {
  const shownCurrency = amounts[currency] ? currency : defaultCurrency;
  const price = amounts[shownCurrency];
  if (!price) return card;

  const formatAmount = (unitAmount: number) =>
    formatPriceAmount({
      amount: unitAmount / MINOR_UNITS_PER_MAJOR,
      locale,
      currency: shownCurrency,
      freeLabel: labels.free,
    });
  const discounted =
    discount &&
    toDiscountedUnitAmount(discount, { currency: shownCurrency, ...price });
  const fullAmount = formatAmount(price.unitAmount);

  if (!discount || isUndefined(discounted)) {
    return {
      ...card,
      headline: {
        amount: fullAmount,
        compareAt: undefined,
        period,
        prefix: undefined,
      },
    };
  }

  return {
    ...card,
    headline: {
      amount: formatAmount(discounted),
      compareAt: { amount: fullAmount, label: labels.compareAtLabel },
      period,
      prefix: undefined,
    },
    extras: [...toDurationLine(discount, labels), ...card.extras],
    ctaButtons: card.ctaButtons.map((button) => ({
      ...button,
      link: {
        ...button.link,
        href: withSearchParam(
          button.link.href,
          PRICING_SEARCH_PARAM.PROMO,
          discount.code,
        ),
      },
    })),
  };
};
