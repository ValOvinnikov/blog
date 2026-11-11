import type { TValueOf } from '@blog/config/utils';

export const SAMPLE_PART = {
  HEADER: 'header',
  FOOTER: 'footer',
  SITE_BRAND: 'site-brand',
  POST_CARD: 'post-card',
  POST_IMAGE: 'post-image',
  FAQ_ITEM: 'faq-item',
  FORM_FIELD: 'form-field',
  QUOTE_CARD: 'quote-card',
  CTA_BOX: 'cta-box',
  ACTION_BUTTON: 'action-button',
  BUSY_BUTTON: 'busy-button',
} as const;
export type TSamplePart = TValueOf<typeof SAMPLE_PART>;

export const SAMPLE_PART_ATTRIBUTE = 'data-part';
export const SAMPLE_PART_ITEMS_ATTRIBUTE = 'data-part-items';
