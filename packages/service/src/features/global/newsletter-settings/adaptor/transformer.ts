import type { InferResultType } from 'groqd';

import type { newsletterSettingsQuery } from './query';
import type { TNewsletterSettings } from './types';

export type TRawNewsletterSettings = NonNullable<
  InferResultType<typeof newsletterSettingsQuery>
>;

export function toNewsletterSettings(
  raw: TRawNewsletterSettings,
): TNewsletterSettings {
  return {
    heading: raw.heading,
    description: raw.description ?? undefined,
  };
}
