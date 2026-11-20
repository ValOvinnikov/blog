import type { TValueOf } from '@shinefold/config/utils';

export const SAMPLE_CONTENT_PATH = {
  REMOVE: '/api/sample-content/remove',
} as const;

export const SAMPLE_CONTENT_LOG = {
  REMOVAL_FAILED: 'sample_content.removal_failed',
  REMOVAL_RESPONSE_INVALID: 'sample_content.removal_response_invalid',
} as const;

export const SAMPLE_CONTENT_REFUSAL = {
  NOT_WRITABLE: 'NOT_WRITABLE',
} as const;

export type TSampleContentRefusal = TValueOf<typeof SAMPLE_CONTENT_REFUSAL>;

export const SAMPLE_KIND = {
  SECTION: 'SECTION',
  PAGE: 'PAGE',
  TEMPLATE: 'TEMPLATE',
  LINK: 'LINK',
  AUTHOR: 'AUTHOR',
  TOPIC: 'TOPIC',
  OTHER: 'OTHER',
} as const;

export type TSampleKind = TValueOf<typeof SAMPLE_KIND>;

export const SAMPLE_CONTENT_HEADING_ID = 'sample-content-heading';
