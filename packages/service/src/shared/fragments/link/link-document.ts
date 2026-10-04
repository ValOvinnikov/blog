import { q } from '@blog/service/sanity/query';
import { getLocalizedField } from '@blog/service/shared/localization/get-localized-field/get-localized-field';
import type { TLocaleParams } from '@blog/service/shared/localization/locale-params/locale-params';
import { translatedReference } from '@blog/service/shared/localization/translated-reference/translated-reference';
import { TRANSLATION_METADATA_TYPE } from '@blog/service/shared/localization/translation-metadata/translation-metadata-type';

const localeQ = q.parameters<TLocaleParams>();

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
              .filterByType(TRANSLATION_METADATA_TYPE)
              .filterBy('references(^._id)')
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
        .asCombined()
        .project((ref) => ({
          _type: true,
          slug: ref.field('slug.current').nullable(true),
        })),
    ),
    url: getLocalizedField(sub, 'url'),
  }));
