import { Size, routes } from '@blog/config';
import { service } from '@blog/service';
import { Avatar, Eyebrow } from '@blog/ui/atoms';
import { ActionList, ShareLink } from '@blog/ui/molecules';
import { Pagination, PostsSection } from '@blog/ui/organisms';
import { BlogPageTemplate } from '@web/components/pages/blog-page-template';
import { SmartLink } from '@web/components/shared/smart-link';
import { Link } from '@web/i18n/navigation';
import { AUTHOR_ITEMS_PER_PAGE } from '@web/utils/author-items-per-page';
import { blockTextToPlain } from '@web/utils/block-text-to-plain';
import { toPostListItems } from '@web/utils/to-post-list-items';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { authorPageVariants } from './author-page-variants';

type TAuthorPageProps = { slug: string; page?: number };

const s = authorPageVariants();

/**
 * AuthorPage — shared composition for `/author/[slug]` (page 1, `page`
 * omitted) and `/author/[slug]/page/[page]` (pages ≥ 2, `page` provided):
 * fetches the author and their posts together via
 * `service.entities.author.v1.getAuthorPage`, then composes the shared
 * `BlogPageTemplate` archive shell with the author's name as the page
 * `<h1>`, their role/avatar in `introHeader`, bio as `supportingText`,
 * social links via `ShareLink`/`ActionList`, and their post list via
 * `PostsSection`. `getAuthorPage` always windows — page 1 gets the same
 * pagination metadata as any other page.
 */
export async function AuthorPage({ slug, page }: TAuthorPageProps) {
  const [result, t] = await Promise.all([
    service.entities.author.v1.getAuthorPage(slug, {
      page,
      itemsPerPage: AUTHOR_ITEMS_PER_PAGE,
    }),
    getTranslations('pagination'),
  ]);

  if (!result.ok) {
    console.error(`Error to fetch author page: ${result.error}`);
    notFound();
  }
  if (result.data === null) {
    notFound();
  }

  const { author, posts, currentPage, totalPages } = result.data;

  // Out-of-range page (corpus shrank or hand-typed URL) → hard 404, never a
  // soft-404 or a redirect to the last page (spec SEO rules).
  if (page !== undefined && page > totalPages) {
    notFound();
  }

  const items = await toPostListItems(posts);

  return (
    <BlogPageTemplate
      heading={author.name}
      introHeader={
        <div className={s.introHeader()}>
          {author.role && <Eyebrow>{author.role}</Eyebrow>}
          <Avatar
            name={author.name}
            alt={author.name}
            src={author.imageUrl}
            size={Size.LG}
          />
        </div>
      }
      supportingText={blockTextToPlain(author.bio)}
      socialLinks={
        author.socialLinks.length > 0 ? (
          <ActionList className={s.socialLinks()}>
            {author.socialLinks.map((link) => (
              <ShareLink
                key={link.url}
                href={link.url}
                label={link.platform}
                as={SmartLink}
              />
            ))}
          </ActionList>
        ) : undefined
      }
      posts={
        <PostsSection
          posts={items}
          title={`Posts by ${author.name}`}
          titleId="author-posts-title"
          linkAs={Link}
          emptyMessage={`${author.name} hasn't published any posts yet.`}
        />
      }
      pagination={
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          createHref={(pageNumber) => routes.author(slug, pageNumber)}
          ariaLabel={t('ariaLabel', { pageType: 'Author' })}
          previousLabel={t('previous')}
          nextLabel={t('next')}
          linkAs={Link}
        />
      }
    />
  );
}
