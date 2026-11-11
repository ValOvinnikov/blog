import type { TValueOf } from '@blog/config/utils';

// The spec's part selectors (`[data-part=post-card]`) fix these values to lowercase.
export const SAMPLE_PART = {
  HEADER: 'header',
  FOOTER: 'footer',
  BRAND: 'site-brand',
  POST_CARD: 'post-card',
  POST_IMAGE: 'post-image',
  FAQ_ITEM: 'faq-item',
  FORM_FIELD: 'form-field',
  QUOTE_CARD: 'quote-card',
  CTA_BOX: 'cta-box',
  BUTTON: 'action-button',
  BUSY_BUTTON: 'busy-button',
} as const;
export type TSamplePart = TValueOf<typeof SAMPLE_PART>;

export const SAMPLE_PART_ATTRIBUTE = 'data-part';
