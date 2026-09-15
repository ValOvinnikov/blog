import { q } from '@blog/service/sanity/query';

// Both fields are projected unconditionally, not gated behind a
// `linkType`-keyed `sub.conditional()` — groqd's conditional parser union
// silently drops the matching branch's own field at parse time, so
// `toLinkDocument` discriminates on `linkType` at the transform layer instead.
/** Projects a `link` document down to the fields `toLinkDocument` needs to resolve it. */
export const linkDocumentFragment = q
  .fragmentForType<'link'>()
  .project((sub) => ({
    label: sub.field('label').notNull(),
    linkType: sub.field('linkType').notNull(),
    openInNewTab: sub.field('openInNewTab').nullable(true),
    internalReference: sub
      .field('internalReference')
      .deref()
      .project((ref) => ({
        _type: true,
        slug: ref.raw<string | null>('slug.current'),
      }))
      .nullable(true),
    url: sub.field('url').nullable(true),
  }));
