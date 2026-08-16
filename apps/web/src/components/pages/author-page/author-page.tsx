import { Size, routes } from '@blog/config';
import { service } from '@blog/service';
import { Avatar, Eyebrow, Icon } from '@blog/ui/atoms';
import {
  ActionList,
  Breadcrumbs,
  ShareLink,
  type IBreadcrumbItem,
} from '@blog/ui/molecules';
import { Pagination, PostsSection } from '@blog/ui/organisms';
import { sanitizeLogMessage } from '@blog/utils';
import { BlogPageTemplate } from '@web/components/page-templates/blog-page-template';
import { BreadcrumbBar } from '@web/components/shared/breadcrumb-bar';
import { JsonLd } from '@web/components/shared/json-ld';
import { SmartLink } from '@web/components/shared/smart-link';
import { AUTHOR_ITEMS_PER_PAGE } from '@web/utils/author-items-per-page';
import { blockTextToPlain } from '@web/utils/block-text-to-plain';
import { buildBreadcrumbListSchema } from '@web/utils/build-breadcrumb-list-schema';
import { env } from '@web/utils/env/env';
import { toPostListItems } from '@web/utils/to-post-list-items';
import { toSocialIconName } from '@web/utils/to-social-icon-name';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { authorPageVariants } from './author-page-variants';

type TAuthorPageProps = { slug: string; page?: number };

const s = authorPageVariants();

/**
 * AuthorPage — shared composition for `/author/[slug]` (page 1, `page`
 * omitted) and `/author/[slug]/page/[page]` (pages ≥ 2, `page` provided):
 * fetches the author and their posts together via
 * `service.pages.author.v1.getAuthorPage`, then composes the shared
 * `BlogPageTemplate` archive shell with the author's name as the page
 * `<h1>`, their role/avatar in `introHeader`, bio as `supportingText`,
 * social links via `ShareLink`/`ActionList`, and their post list via
 * `PostsSection`. `getAuthorPage` always windows — page 1 gets the same
 * pagination metadata as any other page. Renders a `Home › Author: {name}`
 * `Breadcrumbs` trail (plus its `BreadcrumbList` JSON-LD) inside a
 * `BreadcrumbBar` sibling before `<main>`.
 */
export async function AuthorPage({ slug, page }: TAuthorPageProps) {
  const [result, t, breadcrumbsT, authorPageT] = await Promise.all([
    service.pages.author.v1.getAuthorPage(slug, {
      page,
      itemsPerPage: AUTHOR_ITEMS_PER_PAGE,
    }),
    getTranslations('pagination'),
    getTranslations('breadcrumbs'),
    getTranslations('authorPage'),
  ]);

  if (!result.ok) {
    console.error(
      `Error to fetch author page: ${sanitizeLogMessage(result.error)}`,
    );
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

  const siteUrl = env.NEXT_PUBLIC_SITE_URL ?? '';
  const trail: IBreadcrumbItem[] = [
    { label: breadcrumbsT('home'), href: routes.home() },
    {
      label: breadcrumbsT('authorPrefix', { name: author.name }),
      href: routes.author(slug),
    },
  ];
  const breadcrumbListSchema = buildBreadcrumbListSchema(trail, siteUrl);

  return (
    <>
      {breadcrumbListSchema && <JsonLd schema={breadcrumbListSchema} />}

      <BreadcrumbBar>
        <Breadcrumbs
          items={trail}
          ariaLabel={breadcrumbsT('ariaLabel')}
          linkAs={SmartLink}
        />
      </BreadcrumbBar>

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
              {author.socialLinks.map((link) => {
                const iconName = toSocialIconName(link.platform);

                return (
                  <ShareLink
                    key={link.url}
                    href={link.url}
                    label={link.platform}
                    icon={
                      iconName ? (
                        <Icon name={iconName} size={Size.SM} />
                      ) : undefined
                    }
                    as={SmartLink}
                  />
                );
              })}
            </ActionList>
          ) : undefined
        }
        posts={
          <PostsSection
            posts={items}
            title={authorPageT('title', { name: author.name })}
            titleId="author-posts-title"
            linkAs={SmartLink}
            emptyMessage={authorPageT('empty', { name: author.name })}
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
            linkAs={SmartLink}
          />
        }
      />
    </>
  );
}
