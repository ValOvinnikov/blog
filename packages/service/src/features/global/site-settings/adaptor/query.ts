import { q } from '@blog/service/sanity/query/query';
import { sanityImageFragment } from '@blog/service/shared/fragments/image/image';
import { optionalImage } from '@blog/service/shared/fragments/image/optional-image';
import { getLocalizedField } from '@blog/service/shared/localization/get-localized-field/get-localized-field';
import type { TLocaleQueryParams } from '@blog/service/shared/localization/locale-query-params/locale-query-params';

export const siteSettingsQuery = q
  .parameters<TLocaleQueryParams>()
  .star.filterByType('settings_site')
  .slice(0)
  .project((sub) => ({
    brand: sub
      .field('brand')
      .project((b) => ({
        name: b.field('name').notNull(),
        tagline: b
          .field('tagline')
          .project((t) => ({
            items: t
              .field('items[]')
              .project((item) => ({
                _key: true,
                text: getLocalizedField(item, 'text'),
              }))
              .nullable(true),
            separator: t.field('separator').notNull(),
          }))
          .nullable(true),
        logo: optionalImage(b, 'logo', sanityImageFragment),
      }))
      .notNull(),
    currency: sub.field('currency').notNull(),
  }))
  .notNull();
