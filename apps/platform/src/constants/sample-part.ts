import type { TValueOf } from '@blog/config/utils';

// Lowercase because the values are `data-part` markup and the selectors that find it.
export const SAMPLE_PART = {
  HEADER: 'header',
  FOOTER: 'footer',
  BRAND: 'brand',
  POST_CARD: 'post-card',
  POST_IMAGE: 'post-image',
  FAQ_ITEM: 'faq-item',
  FORM_FIELD: 'form-field',
  QUOTE_CARD: 'quote-card',
  CTA_BOX: 'cta-box',
  BUTTON: 'button',
  BUSY_BUTTON: 'busy-button',
} as const;
export type TSamplePart = TValueOf<typeof SAMPLE_PART>;

export const SAMPLE_PART_ATTRIBUTE = 'data-part';
export const SAMPLE_PART_ITEMS_ATTRIBUTE = 'data-part-items';
