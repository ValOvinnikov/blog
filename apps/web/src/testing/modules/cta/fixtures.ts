import { CTA_ACTION_APPEARANCE, CTA_ACTION_VARIANT } from '@blog/config';
import type { TCtaContent, TCtaModule } from '@blog/service';

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
    },
  },
];

export const ctaContentDemo: TCtaContent = [
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
    markDefs: undefined,
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
    markDefs: undefined,
  },
  {
    _type: 'block',
    _key: 'cta-content-b3',
    style: 'normal',
    listItem: 'bullet',
    children: [
      { _type: 'span', _key: 'cta-content-s5', text: 'Priority support' },
    ],
    markDefs: undefined,
  },
];
