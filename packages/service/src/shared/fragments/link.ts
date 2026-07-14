import { q } from '@blog/service/sanity/query';

export const linkFragment = q.fragmentForType<'link'>().project((sub) => ({
  label: sub.field('label').notNull(),
  linkType: sub.field('linkType').notNull(),
  url: sub.field('url').nullable(true),
  internalReference: sub
    .field('internalReference')
    .deref()
    .project((ref) => ({
      _type: true,
      slug: ref.field('slug.current').nullable(true),
    }))
    .nullable(true),
  openInNewTab: sub.field('openInNewTab').nullable(true),
  platform: sub.field('platform').nullable(true),
}));
