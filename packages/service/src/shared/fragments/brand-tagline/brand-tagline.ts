import { q } from '@blog/service/sanity/query/query';
import { getLocalizedField } from '@blog/service/shared/localization/get-localized-field/get-localized-field';
import type { TLocaleQueryParams } from '@blog/service/shared/localization/locale-query-params/locale-query-params';

export const brandTaglineFragment = q
  .parameters<TLocaleQueryParams>()
  .fragmentForType<'brandTagline'>()
  .project((sub) => ({
    items: sub
      .field('items[]')
      .project((item) => ({
        _key: true,
        text: getLocalizedField(item, 'text'),
      }))
      .nullable(true),
    separator: sub.field('separator').notNull(),
  }));
