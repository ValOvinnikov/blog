import { SPEC_LINE_SEPARATOR_CHARS } from '@blog/config';
import { buildImageUrl } from '@blog/service/shared/transformers/build-image-url';
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
      prefix: raw.brand.prefix,
      suffix: raw.brand.suffix ?? undefined,
      specLine,
      logoUrl: buildImageUrl(raw.brand.logo),
      variant: raw.brand.variant,
    },
    description: raw.description,
    tagline: raw.tagline ?? undefined,
    defaultOgImageUrl: buildImageUrl(raw.defaultOgImage),
  };
}
