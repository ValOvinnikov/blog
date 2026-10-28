import { q } from '@blog/service/sanity/query/query';
import { sanityImageOptionalFragment } from '@blog/service/shared/fragments/image/image';
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
        logo: b
          .field('logo')
          .project(sanityImageOptionalFragment)
          .nullable(true),
      }))
      .notNull(),
    currency: sub.field('currency').notNull(),
  }))
  .notNull();
