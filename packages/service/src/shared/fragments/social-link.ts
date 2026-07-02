import { q } from '#/sanity/query';

export const socialLinkFragment = q
  .fragmentForType<'socialLink'>()
  .project((sub) => ({
    platform: sub.field('platform').notNull(),
    url: sub.field('url').notNull(),
  }));
