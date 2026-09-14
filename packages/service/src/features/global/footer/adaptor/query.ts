import { q } from '@blog/service/sanity/query';
import { socialLinkRefFragment } from '@blog/service/shared/fragments/social-link';

export const footerQuery = q.star
  .filterByType('settings_footer')
  .slice(0)
  .project((sub) => ({
    social: sub.field('social[]').project(socialLinkRefFragment).nullable(true),
  }))
  .notNull();
