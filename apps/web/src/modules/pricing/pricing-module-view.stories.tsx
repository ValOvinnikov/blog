import { BRAND_VARIANT, CONTENT_ALIGNMENT, PRICE_PERIOD } from '@blog/config';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ctaActionsDemo } from '@web/testing/modules/cta/fixtures';
import {
  makePricingPrice,
  makePricingTier,
} from '@web/testing/modules/pricing/fixtures';
import { makeHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import { toPricingPanels } from '@web/utils/to-pricing-panels';

import { PricingModuleView } from './pricing-module-view';

const labels = {
  free: 'Free',
  from: 'From',
  periods: {
    [PRICE_PERIOD.ONE_TIME]: 'one-time',
    [PRICE_PERIOD.HOUR]: '/ hour',
    [PRICE_PERIOD.SESSION]: '/ session',
    [PRICE_PERIOD.MONTH]: '/ month',
    [PRICE_PERIOD.YEAR]: '/ year',
  },
};

const features = ['Unlimited posts', 'Custom domain', 'Email support'];

const tiers = [
  makePricingTier({
    id: 'free',
    name: 'Free',
    description: 'For trying things out.',
    prices: [makePricingPrice({ amount: 0 })],
    features,
    ctaButtons: ctaActionsDemo.slice(0, 1),
  }),
  makePricingTier({
    id: 'pro',
    name: 'Pro',
    description: 'For growing publications.',
    prices: [
      makePricingPrice({ period: PRICE_PERIOD.MONTH, amount: 49.99 }),
      makePricingPrice({
        period: PRICE_PERIOD.YEAR,
        amount: 490,
        compareAtAmount: 599.88,
      }),
      makePricingPrice({ period: PRICE_PERIOD.ONE_TIME, amount: 99 }),
    ],
    features,
    highlightLabel: 'Most popular',
    ctaButtons: ctaActionsDemo.slice(0, 1),
    footnote: 'Billed in GBP.',
  }),
  makePricingTier({
    id: 'team',
    name: 'Team',
    description: 'For teams.',
    prices: [
      makePricingPrice({
        period: PRICE_PERIOD.MONTH,
        amount: 149,
        isStartingAt: true,
      }),
      makePricingPrice({ period: PRICE_PERIOD.YEAR, amount: 1490 }),
    ],
    features,
    ctaButtons: ctaActionsDemo.slice(0, 1),
  }),
  makePricingTier({
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Custom contracts.',
    prices: [],
    priceLabel: 'Contact us',
    features,
    ctaButtons: ctaActionsDemo.slice(1),
  }),
];

const panelsFor = (selected: typeof tiers) =>
  toPricingPanels({
    tiers: selected,
    locale: 'en-GB',
    currency: 'GBP',
    labels,
  });

const meta = {
  title: 'Modules/PricingModule',
  component: PricingModuleView,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  argTypes: {
    brandVariant: {
      control: 'select',
      options: [BRAND_VARIANT.PRIMARY, BRAND_VARIANT.SECONDARY],
    },
    contentAlignment: {
      control: 'select',
      options: Object.values(CONTENT_ALIGNMENT),
    },
  },
  args: {
    brandVariant: BRAND_VARIANT.PRIMARY,
    headingBlock: makeHeadingBlock({ heading: 'Simple pricing' }),
    panels: panelsFor(tiers),
    footnote: undefined,
    ctaButtons: [],
    contentAlignment: undefined,
    layout: undefined,
    titleId: 'pricing-title',
    dataTestId: 'pricing-module-pricing-1',
  },
} satisfies Meta<typeof PricingModuleView>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const FourTiersWithSwitch: TStory = {};

export const ThreeTiersWithSwitch: TStory = {
  args: { panels: panelsFor(tiers.slice(0, 3)) },
};

export const TwoTiersWithSwitch: TStory = {
  args: { panels: panelsFor(tiers.slice(1, 3)) },
};

export const OneTierCentred: TStory = {
  args: { panels: panelsFor([tiers[0]!]) },
};

export const SinglePeriodNoSwitch: TStory = {
  args: {
    panels: panelsFor([
      tiers[0]!,
      makePricingTier({
        id: 'one-time',
        name: 'Workshop',
        prices: [
          makePricingPrice({ period: PRICE_PERIOD.SESSION, amount: 120 }),
          makePricingPrice({ period: PRICE_PERIOD.HOUR, amount: 40 }),
        ],
        features,
      }),
      tiers[3]!,
    ]),
  },
};

export const WithFootnoteAndActions: TStory = {
  args: {
    footnote: 'Prices include VAT where applicable.',
    ctaButtons: ctaActionsDemo,
  },
};

export const CenterAligned: TStory = {
  args: { contentAlignment: CONTENT_ALIGNMENT.CENTER },
};

export const Secondary: TStory = {
  args: { brandVariant: BRAND_VARIANT.SECONDARY },
};

export const TabletTwoByTwo: TStory = {
  globals: { viewport: 'tablet' },
};

export const PhoneStacked: TStory = {
  globals: { viewport: 'mobile' },
};
