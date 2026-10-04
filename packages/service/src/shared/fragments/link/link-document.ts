import { q } from '@blog/service/sanity/query';
import { getLocalizedField } from '@blog/service/shared/localization/get-localized-field/get-localized-field';
import type { TLocaleParams } from '@blog/service/shared/localization/locale-params/locale-params';
import { translatedReference } from '@blog/service/shared/localization/translated-reference/translated-reference';

const localeQ = q.parameters<TLocaleParams>();

// Projected unconditionally — groqd's `sub.conditional()` union silently drops the matching branch's own field at parse time.
export const linkDocumentFragment = localeQ
  .fragmentForType<'link'>()
  .project((sub) => ({
    label: getLocalizedField(sub, (filter) =>
      sub.field('label[]').filterBy(filter).slice(0).field('value'),
    ),
    linkType: sub.field('linkType').notNull(),
    openInNewTab: sub.field('openInNewTab').nullable(true),
    internalReference: translatedReference(
      sub,
      (filter) =>
        sub
          .field('internalReference')
          .deref()
          .project(() => ({
            translated: localeQ.star
              .filterByType('translation.metadata')
              // groqd's typed filterBy rejects `references(^._id)` when the parent is a union of page types
              .filterRaw('references(^._id)')
              .slice(0)
              .field('translations[]')
              .filterBy(filter)
              .slice(0)
              .field('value')
              .deref()
              .project((target) => ({
                _type: true,
                slug: target.field('slug.current').nullable(true),
              })),
          }))
          .field('translated'),
      sub
        .field('internalReference')
        .deref()
        .project((page) => ({
          _type: true,
          slug: page.selectByType({
            page_landing: (s) => s.field('slug.current'),
            page_post: (s) => s.field('slug.current'),
            page_tag: (s) => s.field('slug.current'),
            page_topic: (s) => s.field('slug.current'),
          }),
        })),
    ),
    url: getLocalizedField(sub, (filter) =>
      sub.field('url[]').filterBy(filter).slice(0).field('value'),
    ),
  }));
