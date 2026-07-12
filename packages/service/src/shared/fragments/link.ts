import { q } from '@blog/service/sanity/query';

export const linkFragment = q.fragmentForType<'link'>().project((sub) => ({
  label: sub.field('label').notNull(),
  linkType: sub.field('linkType').notNull(),
  url: sub.field('url'),
  internalReference: sub
    .field('internalReference')
    .deref()
    .project((ref) => ({
      _type: true,
      slug: ref.field('slug.current'),
    })),
  openInNewTab: sub.field('openInNewTab'),
  platform: sub.field('platform'),
}));
