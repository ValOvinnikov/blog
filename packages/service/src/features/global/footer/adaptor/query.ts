import { q } from '@blog/service/sanity/query';
import { socialProfileFragment } from '@blog/service/shared/fragments/social-profile';

export const footerQuery = q.star
  .filterByType('settings_footer')
  .slice(0)
  .project((sub) => ({
    social: sub.field('social[]').project(socialProfileFragment).nullable(true),
  }))
  .notNull();
