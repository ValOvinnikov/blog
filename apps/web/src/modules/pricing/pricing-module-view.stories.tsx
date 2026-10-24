import { BRAND_VARIANT, CONTENT_ALIGNMENT, PRICE_PERIOD } from '@blog/config';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { MOCK_CTA_ACTIONS } from '@web/testing/modules/cta/fixtures';
import {
  mockPricingPrice,
  mockPricingTier,
  MOCK_PRICING_LABELS,
} from '@web/testing/modules/pricing/fixtures';
import { mockHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import { toPricingPanels } from '@web/utils/to-pricing-panels';

import { PricingModuleView } from './pricing-module-view';

const features = ['Unlimited posts', 'Custom domain', 'Email support'];

const tiers = [
  mockPricingTier({
    id: 'free',
    name: 'Free',
    description: 'For trying things out.',
    prices: [mockPricingPrice({ amount: 0 })],
    features,
    ctaButtons: MOCK_CTA_ACTIONS.slice(0, 1),
  }),
  mockPricingTier({
    id: 'pro',
    name: 'Pro',
    description: 'For growing publications.',
    prices: [
      mockPricingPrice({ period: PRICE_PERIOD.MONTH, amount: 49.99 }),
      mockPricingPrice({
        period: PRICE_PERIOD.YEAR,
        amount: 490,
        compareAtAmount: 599.88,
      }),
      mockPricingPrice({ period: PRICE_PERIOD.ONE_TIME, amount: 99 }),
    ],
    features,
    highlightLabel: 'Most popular',
    ctaButtons: MOCK_CTA_ACTIONS.slice(0, 1),
    footnote: 'Billed in GBP.',
  }),
  mockPricingTier({
    id: 'team',
    name: 'Team',
    description: 'For teams.',
    prices: [
      mockPricingPrice({
        period: PRICE_PERIOD.MONTH,
        amount: 149,
        isStartingAt: true,
      }),
      mockPricingPrice({ period: PRICE_PERIOD.YEAR, amount: 1490 }),
    ],
    features,
    ctaButtons: MOCK_CTA_ACTIONS.slice(0, 1),
  }),
  mockPricingTier({
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Custom contracts.',
    prices: [],
    priceLabel: 'Contact us',
    features,
    ctaButtons: MOCK_CTA_ACTIONS.slice(1),
  }),
];

const panelsFor = (selected: typeof tiers) =>
  toPricingPanels({
    tiers: selected,
    locale: 'en-GB',
    currency: 'GBP',
    labels: MOCK_PRICING_LABELS,
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
      options: [CONTENT_ALIGNMENT.LEFT, CONTENT_ALIGNMENT.CENTER],
    },
  },
  args: {
    brandVariant: BRAND_VARIANT.PRIMARY,
    headingBlock: mockHeadingBlock({ heading: 'Simple pricing' }),
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
      mockPricingTier({
        id: 'one-time',
        name: 'Workshop',
        prices: [
          mockPricingPrice({ period: PRICE_PERIOD.SESSION, amount: 120 }),
          mockPricingPrice({ period: PRICE_PERIOD.HOUR, amount: 40 }),
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
    ctaButtons: MOCK_CTA_ACTIONS,
  },
};

export const CenterAligned: TStory = {
  args: { contentAlignment: CONTENT_ALIGNMENT.CENTER },
};

export const Secondary: TStory = {
  args: { brandVariant: BRAND_VARIANT.SECONDARY },
};

export const SidebarColumn: TStory = {
  args: { panels: panelsFor(tiers.slice(0, 3)) },
  decorators: [
    (Story) => (
      <div className="max-w-[37.5rem]">
        <Story />
      </div>
    ),
  ],
};

export const TabletTwoByTwo: TStory = {
  globals: { viewport: 'tablet' },
};

export const PhoneStacked: TStory = {
  globals: { viewport: 'mobile' },
};

export const ThreeTiersPhone: TStory = {
  args: { panels: panelsFor(tiers.slice(0, 3)) },
  globals: { viewport: 'mobile' },
};
