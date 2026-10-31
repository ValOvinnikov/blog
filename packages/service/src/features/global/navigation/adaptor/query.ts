import { q } from '@blog/service/sanity/query/query';
import { brandTaglineFragment } from '@blog/service/shared/fragments/brand-tagline/brand-tagline';
import { linkDocumentFragment } from '@blog/service/shared/fragments/link/link-document';
import { linkRefFragment } from '@blog/service/shared/fragments/link/link-ref';
import type { TLocaleQueryParams } from '@blog/service/shared/localization/locale-query-params/locale-query-params';

export const navigationQuery = q
  .parameters<TLocaleQueryParams>()
  .star.filterByType('settings_navigation')
  .slice(0)
  .project((sub) => ({
    items: sub
      .field('items[]')
      .project((item) => ({
        link: item
          .field('link')
          .deref()
          .project(linkDocumentFragment)
          .notNull(),
        ...item.conditionalByType({
          linkRefWithSubItems: (group) => ({
            subItems: group
              .field('subItems[]')
              .project(linkRefFragment)
              .notNull(),
          }),
        }),
      }))
      .nullable(true),
    tagline: sub.field('tagline').project(brandTaglineFragment).nullable(true),
    showLanguageSwitcher: sub.field('showLanguageSwitcher').nullable(true),
  }))
  .notNull();
