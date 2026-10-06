import { q } from '@blog/service/sanity/query/query';
import { sanityImageFragment } from '@blog/service/shared/fragments/image/image';
import { getLocalizedField } from '@blog/service/shared/localization/get-localized-field/get-localized-field';
import type { TLocaleParams } from '@blog/service/shared/localization/locale-params/locale-params';

export const siteSettingsQuery = q
  .parameters<TLocaleParams>()
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
        logo: b.field('logo').project(sanityImageFragment).nullable(true),
      }))
      .notNull(),
    currency: sub.field('currency').notNull(),
  }))
  .notNull();
