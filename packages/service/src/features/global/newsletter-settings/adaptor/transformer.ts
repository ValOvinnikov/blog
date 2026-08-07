import type { InferResultType } from 'groqd';

import type { newsletterSettingsQuery } from './query';
import type { TNewsletterSettings } from './types';

export type TRawNewsletterSettings = NonNullable<
  InferResultType<typeof newsletterSettingsQuery>
>;

export function toNewsletterSettings(
  raw: TRawNewsletterSettings | null,
): TNewsletterSettings {
  if (!raw) {
    return { heading: undefined, description: undefined };
  }

  return {
    heading: raw.heading ?? undefined,
    description: raw.description ?? undefined,
  };
}
