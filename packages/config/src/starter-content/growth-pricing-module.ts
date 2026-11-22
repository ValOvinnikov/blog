import {
  BRAND_VARIANT,
  CONTENT_ALIGNMENT,
  PRICE_PERIOD,
  type TLocaleIsoCode,
} from '@shinefold/config/constants';
import type {
  Module_pricing,
  PricingTier,
} from '@shinefold/config/sanity/generated/types';

import type { TStarterModule } from './starter-document';
import { localizedString, moduleHeadingBlock } from './starter-fields';
import type { TModuleInput } from './starter-modules';

const SAMPLE_MONTHLY_AMOUNT = 12;
const SAMPLE_YEARLY_AMOUNT = 120;

type TTierCopy = {
  name: string;
  description: string;
  features: readonly string[];
};

type TPricingCopy = {
  heading: string;
  footnote: string;
  free: TTierCopy & { priceLabel: string };
  pro: TTierCopy & { highlightLabel: string };
  team: TTierCopy & { priceLabel: string };
};

function pricingTier(
  locale: TLocaleIsoCode,
  key: string,
  { name, description, features }: TTierCopy,
) {
  return {
    _key: key,
    _type: 'pricingTier',
    name: localizedString(locale, name),
    description: localizedString(locale, description),
    features: features.map((text, index) => ({
      _key: `feature${index}`,
      _type: 'pricingFeature',
      text: localizedString(locale, text),
    })),
  } as const satisfies PricingTier & { _key: string };
}

export function buildPricingModule({
  id,
  title,
  locale,
  pricing: { heading, footnote, free, pro, team },
}: TModuleInput & { pricing: TPricingCopy }): TStarterModule<Module_pricing> {
  return {
    _id: id,
    _type: 'module_pricing',
    title,
    brandVariant: BRAND_VARIANT.PRIMARY,
    headingBlock: moduleHeadingBlock(locale, heading),
    contentAlignment: CONTENT_ALIGNMENT.CENTER,
    footnote: localizedString(locale, footnote),
    tiers: [
      {
        ...pricingTier(locale, 'free', free),
        priceLabel: localizedString(locale, free.priceLabel),
      },
      {
        ...pricingTier(locale, 'pro', pro),
        prices: [
          {
            _key: 'month',
            _type: 'pricingPrice',
            period: PRICE_PERIOD.MONTH,
            amount: SAMPLE_MONTHLY_AMOUNT,
          },
          {
            _key: 'year',
            _type: 'pricingPrice',
            period: PRICE_PERIOD.YEAR,
            amount: SAMPLE_YEARLY_AMOUNT,
          },
        ],
        highlightLabel: localizedString(locale, pro.highlightLabel),
      },
      {
        ...pricingTier(locale, 'team', team),
        priceLabel: localizedString(locale, team.priceLabel),
      },
    ],
  };
}
