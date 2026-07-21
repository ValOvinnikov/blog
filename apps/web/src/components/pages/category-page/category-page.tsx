import { routes, type ILocalizedParams } from '@blog/config';
import { service } from '@blog/service';
import { PostsSection } from '@blog/ui';
import { BlogPageTemplate } from '@web/components/pages/blog-page-template';
import { Link } from '@web/i18n/navigation';
import { formatDate } from '@web/utils/format-date';
import { notFound } from 'next/navigation';

type TCategoryPageProps = ILocalizedParams & { slug: string };

/**
 * CategoryPage — `/category/[slug]` composition: fetches a single
 * unpaginated window of posts for the category and renders them through the
 * same pure ui organisms as `BlogListPage`. Pagination is out of scope here
 * (tracked separately as #588/#589).
 */
export async function CategoryPage({ slug, locale }: TCategoryPageProps) {
  const page = await service.pages.category.v1.getCategoryPage(slug);

  if (!page) {
    notFound();
  }

  const { category, posts } = page;

  const items = posts.map((post) => ({
    id: post.id,
    href: routes.post(post.slug),
    title: post.title,
    excerpt: post.excerpt,
    publishedAt: post.publishedAt,
    formattedDate: formatDate(post.publishedAt, locale),
    categories: post.categories,
  }));

  return (
    <BlogPageTemplate
      heading={category.title}
      supportingText={category.description}
      posts={
        <PostsSection
          posts={items}
          title={`Posts in ${category.title}`}
          titleId="category-posts-title"
          linkAs={Link}
        />
      }
    />
  );
}
