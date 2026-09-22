import { q } from '@blog/service/sanity/query';

// Projected unconditionally — groqd's `sub.conditional()` union silently drops the matching branch's own field at parse time.
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
