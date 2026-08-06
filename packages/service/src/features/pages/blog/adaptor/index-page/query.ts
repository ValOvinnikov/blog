import { q } from '@blog/service/sanity/query';
import { PUBLISHED_POST_FILTER } from '@blog/service/shared/filters/published-post';
import { archivePostCardFragment } from '@blog/service/shared/fragments/archive-post-card';
import { moduleFragment } from '@blog/service/shared/fragments/module';
import { seoFragment } from '@blog/service/shared/fragments/seo';

const blogPosts = q.star
  .filterByType('blog_post')
  .filterRaw(PUBLISHED_POST_FILTER);

export const blogPageQuery = q.star
  .filterByType('page_blog')
  .slice(0)
  .project((sub) => ({
    heading: sub.field('heading').notNull(),
    supportingText: sub.field('supportingText').nullable(true),
    itemsPerPage: sub.field('itemsPerPage').notNull(),
    // Page-builder placement (`postList`/`cta`/`newsletter`), mirroring
    // `page_home`/`page_generic`'s own thin `modules[]` ref projection —
    // resolved to a real component by `ModuleRenderer` (`apps/web`).
    modules: sub
      .field('modules[]')
      .deref()
      .project(moduleFragment)
      .nullable(true),
    seo: sub.field('seo').project(seoFragment).nullable(true),
  }))
  .notNull();

export const buildIndexPageQuery = (start: number, end: number) =>
  q
    .project((sub) => ({
      posts: blogPosts
        .order('publishedAt desc')
        .slice(start, end)
        .project(archivePostCardFragment)
        .notNull(true),
      total: sub.count(blogPosts).notNull(true),
    }))
    .notNull(true);
