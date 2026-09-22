import { q } from '@blog/service/sanity/query';
import { linkDocumentFragment } from '@blog/service/shared/fragments/link/link-document/link-document';

export const socialProfileFragment = q
  .fragmentForType<'socialProfile'>()
  .project((sub) => ({
    platform: sub.field('platform').notNull(),
    link: sub.field('link').deref().project(linkDocumentFragment).notNull(),
  }));
