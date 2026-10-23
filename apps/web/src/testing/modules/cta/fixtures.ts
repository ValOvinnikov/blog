import {
  BRAND_VARIANT,
  CTA_ACTION_APPEARANCE,
  CTA_ACTION_VARIANT,
  CTA_VARIANT,
  type TPortableTextBlock,
} from '@blog/config';
import type { TCtaButton, TCtaModule } from '@blog/service';
import { faker } from '@faker-js/faker';
import { makeHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import {
  portableTextBlock,
  portableTextSpan,
} from '@web/testing/shared/portable-text/fixtures';

export const MOCK_CTA_SECONDARY_ACTION_ARIA_LABEL =
  'Learn more about our subscription plans';

export const MOCK_CTA_PRIMARY_ACTION: TCtaButton = {
  variant: CTA_ACTION_VARIANT.PRIMARY,
  appearance: CTA_ACTION_APPEARANCE.CONTAINED,
  link: {
    label: 'Subscribe now',
    href: '/blog',
    target: undefined,
    platform: undefined,
    ariaLabel: undefined,
  },
};

export const MOCK_CTA_SECONDARY_ACTION: TCtaButton = {
  variant: CTA_ACTION_VARIANT.SECONDARY,
  appearance: CTA_ACTION_APPEARANCE.CONTAINED,
  link: {
    label: 'Learn more',
    href: '/about-us',
    target: undefined,
    platform: undefined,
    ariaLabel: MOCK_CTA_SECONDARY_ACTION_ARIA_LABEL,
  },
};

export const MOCK_CTA_ACTIONS: TCtaButton[] = [
  MOCK_CTA_PRIMARY_ACTION,
  MOCK_CTA_SECONDARY_ACTION,
];

export const MOCK_CTA_CONTENT: TPortableTextBlock[] = [
  portableTextBlock([
    portableTextSpan('Cancel anytime — no credit card required to start your '),
    portableTextSpan('14-day trial', ['strong']),
    portableTextSpan('.'),
  ]),
  portableTextBlock([portableTextSpan('Unlimited posts and drafts')], {
    listItem: 'bullet',
  }),
  portableTextBlock([portableTextSpan('Priority support')], {
    listItem: 'bullet',
  }),
];

export const mockCtaModuleData = (
  overrides: Partial<TCtaModule> = {},
): TCtaModule => ({
  variant: CTA_VARIANT.CALLOUT,
  brandVariant: BRAND_VARIANT.PRIMARY,
  bandTone: BRAND_VARIANT.SECONDARY,
  eyebrow: undefined,
  headingBlock: makeHeadingBlock({ heading: 'Get started' }),
  content: undefined,
  image: undefined,
  contentPosition: undefined,
  contentAlignment: undefined,
  mobileMediaOrder: undefined,
  ctaButtons: [],
  footnote: undefined,
  layout: undefined,
  ...overrides,
});

export const MOCK_CTA_MODULE_ID = faker.string.uuid();
