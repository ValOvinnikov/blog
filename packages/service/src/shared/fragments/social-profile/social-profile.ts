import { q } from '@shinefold/service/sanity/query/query';
import { linkDocumentFragment } from '@shinefold/service/shared/fragments/link/link-document';

export const socialProfileFragment = q
  .fragmentForType<'socialProfile'>()
  .project((sub) => ({
    platform: sub.field('platform').notNull(),
    link: sub.field('link').deref().project(linkDocumentFragment).notNull(),
  }));
