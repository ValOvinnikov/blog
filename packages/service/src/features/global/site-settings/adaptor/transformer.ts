import { SPEC_LINE_SEPARATOR_CHARS } from '@blog/config';
import { toSanityImage } from '@blog/service/shared/transformers/to-sanity-image';
import type { InferResultType } from 'groqd';

import type { siteSettingsQuery } from './query';
import type { TSiteSettings } from './types';

export type TRawSiteSettings = NonNullable<
  InferResultType<typeof siteSettingsQuery>
>;

export function toSiteSettings(raw: TRawSiteSettings): TSiteSettings {
  const specLineItems = raw.brand.specLine?.items ?? [];
  const specLineSeparator = raw.brand.specLine?.separator;
  const specLine =
    specLineItems.length && specLineSeparator
      ? specLineItems.join(` ${SPEC_LINE_SEPARATOR_CHARS[specLineSeparator]} `)
      : undefined;

  return {
    brand: {
      name: raw.brand.name,
      specLine,
      logo: toSanityImage(raw.brand.logo),
    },
    description: raw.description,
    tagline: raw.tagline ?? undefined,
  };
}
