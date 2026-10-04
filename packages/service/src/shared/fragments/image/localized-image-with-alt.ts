import { q } from '@blog/service/sanity/query';
import { sanityImageAssetFragment } from '@blog/service/shared/fragments/image/image';
import { getLocalizedField } from '@blog/service/shared/localization/get-localized-field/get-localized-field';
import type { TLocaleParams } from '@blog/service/shared/localization/locale-params/locale-params';

export const localizedImageWithAltFragment = q
  .parameters<TLocaleParams>()
  .fragmentForType<'localizedImageWithAlt'>()
  .project((sub) => ({
    alt: getLocalizedField(sub, (filter) =>
      sub.field('alt[]').filterBy(filter).slice(0).field('value'),
    ).notNull(),
    hotspot: true,
    crop: true,
    asset: sub
      .field('asset')
      .deref()
      .project(sanityImageAssetFragment)
      .notNull(),
  }));
