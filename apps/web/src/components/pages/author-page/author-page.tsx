import { Size, type ILocalizedParams, routes } from '@blog/config';
import { service } from '@blog/service';
import { Avatar, Eyebrow } from '@blog/ui/atoms';
import { ActionList, ShareLink } from '@blog/ui/molecules';
import { PostsSection } from '@blog/ui/organisms';
import { BlogPageTemplate } from '@web/components/pages/blog-page-template';
import { SmartLink } from '@web/components/shared/smart-link';
import { Link } from '@web/i18n/navigation';
import { blockTextToPlain } from '@web/utils/block-text-to-plain';
import { formatDate } from '@web/utils/format-date';
import { notFound } from 'next/navigation';

import { authorPageVariants } from './author-page-variants';

type TAuthorPageProps = ILocalizedParams & { slug: string };

const s = authorPageVariants();

/**
 * AuthorPage — `/author/[slug]` composition: fetches the author and their
 * posts together via `service.entities.author.v1.getAuthorPage`, then
 * composes the shared `BlogPageTemplate` archive shell with the author's
 * name as the page `<h1>`, their role/avatar in `introHeader`, bio as
 * `supportingText`, social links via `ShareLink`/`ActionList`, and their
 * (unpaginated) post list via `PostsSection`. Pagination is deferred — see
 * #744.
 */
export async function AuthorPage({ slug, locale }: TAuthorPageProps) {
  const result = await service.entities.author.v1.getAuthorPage(slug);

  if (!result) {
    notFound();
  }

  const { author, posts } = result;

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
        />
      }
    />
  );
}
