import {
  CTA_ACTION_APPEARANCE,
  CTA_ACTION_VARIANT,
  type TPortableText,
} from '@blog/config';
import type { TCtaButton } from '@blog/service';
import {
  portableTextBlock,
  portableTextSpan,
} from '@web/testing/shared/portable-text/fixtures';

export const ctaActionsDemo: TCtaButton[] = [
  {
    variant: CTA_ACTION_VARIANT.PRIMARY,
    appearance: CTA_ACTION_APPEARANCE.CONTAINED,
    link: {
      label: 'Subscribe now',
      href: '/blog',
      target: undefined,
      platform: undefined,
      ariaLabel: undefined,
    },
  },
  {
    variant: CTA_ACTION_VARIANT.SECONDARY,
    appearance: CTA_ACTION_APPEARANCE.CONTAINED,
    link: {
      label: 'Learn more',
      href: '/about-us',
      target: undefined,
      platform: undefined,
      ariaLabel: 'Learn more about our subscription plans',
    },
  },
];

export const ctaContentDemo: TPortableText[] = [
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
