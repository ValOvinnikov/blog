import { q } from '@blog/service/sanity/query';

/** Projects a `link` document down to the fields `toLinkDocument` needs to resolve it. */
export const linkDocumentFragment = q
  .fragmentForType<'link'>()
  .project((sub) => ({
    label: sub.field('label').notNull(),
    linkType: sub.field('linkType').notNull(),
    url: sub.field('url').nullable(true),
    internalReference: sub
      .field('internalReference')
      .deref()
      .project((ref) => ({
        _type: true,
        slug: ref.raw<string | null>('slug.current'),
      }))
      .nullable(true),
    openInNewTab: sub.field('openInNewTab').nullable(true),
  }));
