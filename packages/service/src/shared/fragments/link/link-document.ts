import { q } from '@blog/service/sanity/query/query';
import { PAGE_PATH_EXPRESSION } from '@blog/service/shared/expressions/landing-page/landing-page-path';
import { getLocalizedField } from '@blog/service/shared/localization/get-localized-field/get-localized-field';
import type { TLocaleQueryParams } from '@blog/service/shared/localization/locale-query-params/locale-query-params';
import { translatedReference } from '@blog/service/shared/localization/translated-reference/translated-reference';

const localeQ = q.parameters<TLocaleQueryParams>();

// Projected unconditionally — groqd's `sub.conditional()` union silently drops the matching branch's own field at parse time.
export const linkDocumentFragment = localeQ
  .fragmentForType<'link'>()
  .project((sub) => ({
    label: getLocalizedField(sub, 'label'),
    linkType: sub.field('linkType').notNull(),
    openInNewTab: sub.field('openInNewTab').nullable(true),
    internalReference: translatedReference(
      sub,
      (filter) =>
        sub
          .field('internalReference')
          .deref()
          .asCombined()
          .project((page) => ({
            translated: page.star
              .filterByType('translation.metadata')
              .filterBy('references(^._id)')
              .slice(0)
              .field('translations[]')
              .filterBy(filter)
              .slice(0)
              .field('value')
              .deref()
              .asCombined()
              .project((target) => ({
                _type: true,
                slug: target.raw<string | null>(PAGE_PATH_EXPRESSION),
              })),
          }))
          .field('translated'),
      sub
        .field('internalReference')
        .deref()
        .asCombined()
        .project((ref) => ({
          _type: true,
          slug: ref.raw<string | null>(PAGE_PATH_EXPRESSION),
        })),
    ),
    url: getLocalizedField(sub, 'url'),
  }));
