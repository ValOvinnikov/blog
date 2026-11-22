import type { TValueOf } from '@shinefold/config/utils';

export const STARTER_DOCUMENT_ID_PREFIX = 'starter.';

export const STARTER_PLACEHOLDER_IMAGE = {
  LOGO: 'LOGO',
  ILLUSTRATION: 'ILLUSTRATION',
} as const;

export type TStarterPlaceholderImage = TValueOf<
  typeof STARTER_PLACEHOLDER_IMAGE
>;
