import { type ILocalizedParams, routes } from '@blog/config';
import { service } from '@blog/service';
import {
  ActionList,
  AuthorByline,
  Eyebrow,
  PostsSection,
  ShareLink,
} from '@blog/ui';
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
 * renders their profile (role, name/bio/avatar via `AuthorByline`, social
 * links via `ShareLink`/`ActionList`), followed by their (unpaginated) post
 * list via `PostsSection`.
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
    <main className={s.root()}>
      {author.role && <Eyebrow className={s.eyebrow()}>{author.role}</Eyebrow>}

      <AuthorByline
        className={s.byline()}
        name={author.name}
        bio={blockTextToPlain(author.bio)}
        avatarUrl={author.imageUrl}
      />

      {author.socialLinks.length > 0 && (
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
      )}

      <PostsSection
        className={s.posts()}
        posts={items}
        title={`Posts by ${author.name}`}
        titleId="author-posts-title"
        linkAs={Link}
      />
    </main>
  );
}
