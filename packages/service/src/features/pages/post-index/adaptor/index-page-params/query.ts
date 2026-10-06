import { q } from '@blog/service/sanity/query/query';
import { POST_IN_LOCALE_FILTER } from '@blog/service/shared/expressions/post/post-in-locale';
import { PUBLISHED_POST_FILTER } from '@blog/service/shared/expressions/post/published-post';

export const indexPageParamsQuery = q.star
  .filterByType('page_postIndex')
  // groqd's typed filterBy has no coalesce, and a page with no language is the default language's
  .filterRaw('coalesce(language, $defaultLocale) == $locale')
  .slice(0)
  .project((page) => ({
    blogPosts: q.project((sub) => ({
      total: sub
        .count(
          q.star
            .filterByType('page_post')
            .filterRaw(POST_IN_LOCALE_FILTER)
            .filterRaw(PUBLISHED_POST_FILTER),
        )
        .notNull(true),
    })),
    moduleRefs: page
      .field('template')
      .deref()
      .field('modules[]')
      .project(() => ({ _ref: true }))
      .nullable(true),
  }))
  .notNull();
