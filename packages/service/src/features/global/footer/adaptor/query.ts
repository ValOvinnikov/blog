import { q } from '#/sanity/query';
import { socialLinkFragment } from '#/shared/fragments/social-link';

export const footerQuery = q.star
  .filterByType('settings_footer')
  .slice(0)
  .project((sub) => ({
    social: sub.field('social[]').project(socialLinkFragment).nullable(true),
  }))
  .notNull();
