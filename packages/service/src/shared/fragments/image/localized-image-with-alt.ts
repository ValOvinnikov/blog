import { q } from '@blog/service/sanity/query/query';
import { sanityImageAssetFragment } from '@blog/service/shared/fragments/image/image';
import { getLocalizedField } from '@blog/service/shared/localization/get-localized-field/get-localized-field';
import type { TLocaleQueryParams } from '@blog/service/shared/localization/locale-query-params/locale-query-params';

export const localizedImageWithAltFragment = q
  .parameters<TLocaleQueryParams>()
  .fragmentForType<'localizedImageWithAlt'>()
  .project((sub) => ({
    alt: getLocalizedField(sub, 'alt').notNull(),
    hotspot: true,
    crop: true,
    asset: sub
      .field('asset')
      .deref()
      .project(sanityImageAssetFragment)
      .notNull(),
  }));

export const localizedImageWithAltOptionalFragment = q
  .parameters<TLocaleQueryParams>()
  .fragmentForType<'localizedImageWithAlt'>()
  .project((sub) => ({
    alt: getLocalizedField(sub, 'alt'),
    hotspot: true,
    crop: true,
    asset: sub
      .field('asset')
      .deref()
      .project(sanityImageAssetFragment)
      .nullable(true),
  }));
