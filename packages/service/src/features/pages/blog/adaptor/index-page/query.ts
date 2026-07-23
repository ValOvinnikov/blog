import { q } from '@blog/service/sanity/query';
import { archivePostCardFragment } from '@blog/service/shared/fragments/archive-post-card';
import { seoFragment } from '@blog/service/shared/fragments/seo';

const blogPosts = q.star.filterByType('blog_post');

export const blogPageQuery = q.star
  .filterByType('page_blog')
  .slice(0)
  .project((sub) => ({
    heading: sub.field('heading').notNull(),
    supportingText: sub.field('supportingText').nullable(true),
    itemsPerPage: sub.field('itemsPerPage').notNull(),
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
