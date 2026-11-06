import { q } from '@blog/service/sanity/query/query';
import type { TLocaleQueryParams } from '@blog/service/shared/localization/locale-query-params/locale-query-params';

export const siteSettingsQuery = q
  .parameters<TLocaleQueryParams>()
  .star.filterByType('settings_site')
  .slice(0)
  .project((sub) => ({
    currency: sub.field('currency').notNull(),
  }))
  .notNull();
