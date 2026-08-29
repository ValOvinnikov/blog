import {
  CTA_ACTION_APPEARANCE,
  CTA_ACTION_VARIANT,
  type BasicText,
} from '@blog/config';
import type { TCtaModule } from '@blog/service';

type TCtaAction = NonNullable<TCtaModule['actions']>[number];

export const ctaActionsDemo: TCtaAction[] = [
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

export const ctaContentDemo: BasicText = [
  {
    _type: 'block',
    _key: 'cta-content-b1',
    style: 'normal',
    children: [
      {
        _type: 'span',
        _key: 'cta-content-s1',
        text: 'Cancel anytime — no credit card required to start your ',
      },
      {
        _type: 'span',
        _key: 'cta-content-s2',
        text: '14-day trial',
        marks: ['strong'],
      },
      { _type: 'span', _key: 'cta-content-s3', text: '.' },
    ],
  },
  {
    _type: 'block',
    _key: 'cta-content-b2',
    style: 'normal',
    listItem: 'bullet',
    children: [
      {
        _type: 'span',
        _key: 'cta-content-s4',
        text: 'Unlimited posts and drafts',
      },
    ],
  },
  {
    _type: 'block',
    _key: 'cta-content-b3',
    style: 'normal',
    listItem: 'bullet',
    children: [
      { _type: 'span', _key: 'cta-content-s5', text: 'Priority support' },
    ],
  },
];
