import { q } from '@blog/service/sanity/query';

export const homeLanguagesQuery = q.star
  .filterByType('page_home')
  .project((home) => ({
    language: home.field('language').nullable(true),
  }));
