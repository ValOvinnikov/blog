import { q } from '@blog/service/sanity/query';
import { postCardFragment } from '@blog/service/shared/fragments/post';
import { seoFragment } from '@blog/service/shared/fragments/seo';

const blogPosts = q.star.filterByType('blog_post');

// `page_blog` is a singleton and may be unauthored — `.nullable(true)` at the
// end (rather than `.notNull()`, as page_home uses) lets the loader fall back
// instead of throwing.
export const blogPageQuery = q.star
  .filterByType('page_blog')
  .slice(0)
  .project((sub) => ({
    heading: sub.field('heading').notNull(),
    supportingText: sub.field('supportingText').nullable(true),
    itemsPerPage: sub.field('itemsPerPage').notNull(),
    seo: sub.field('seo').project(seoFragment).nullable(true),
  }))
  .nullable(true);

export const buildIndexPageQuery = (start: number, end: number) =>
  q.project((sub) => ({
    posts: blogPosts
      .order('publishedAt desc')
      .slice(start, end)
      .project(postCardFragment),
    total: sub.count(blogPosts),
  }));
