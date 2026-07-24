import { routes, type ILocalizedParams } from '@blog/config';
import { service } from '@blog/service';
import { Article, PostsSection } from '@blog/ui/organisms';
import { JsonLd } from '@web/components/shared/json-ld';
import { PortableTextRenderer } from '@web/components/shared/portable-text-renderer';
import { PostShare } from '@web/components/shared/post-share';
import { SanityImage } from '@web/components/shared/sanity-image';
import { SmartLink } from '@web/components/shared/smart-link';
import { buildBlogPostingSchema } from '@web/utils/build-blog-posting-schema';
import { buildShareLinks } from '@web/utils/build-share-links';
import { env } from '@web/utils/env/env';
import { formatDate } from '@web/utils/format-date';
import { toPostListItems } from '@web/utils/to-post-list-items';
import { ExternalLink } from 'lucide-react';
import { notFound } from 'next/navigation';

import { blogPostPageVariants } from './blog-post-page-variants';

type TBlogPostPageProps = ILocalizedParams & { slug: string };

const s = blogPostPageVariants();

/**
 * BlogPostPage — `/blog/{slug}` composition: fetches the post via
 * `service.pages.post.v1.getPost`, then composes it through the `Article`
 * compound (`Article.Header` for category eyebrow links, title, `PostMeta`
 * with `PostShare` in its share slot, and cover image; `Article.Body` for
 * the rendered `PortableTextRenderer` body; `Article.Footer` for the tag
 * chip list), plus a `BlogPosting` JSON-LD tag and, when the post has any,
 * a "Related posts" `PostsSection` after the article. `Header`/`Footer`
 * (site chrome) stay owned by `[locale]/layout.tsx`.
 */
export async function BlogPostPage({ slug, locale }: TBlogPostPageProps) {
  const post = await service.pages.post.v1.getPost(slug);

  if (!post) {
    notFound();
  }

  const {
    title,
    excerpt,
    categories,
    tags,
    body,
    relatedPosts,
    heroImageSanity,
    heroImageAlt,
    publishedAt,
    author,
    readingTimeMinutes,
  } = post;

  const siteUrl = env.NEXT_PUBLIC_SITE_URL ?? '';
  const url = `${siteUrl}${routes.post(slug)}`;
  const schema = buildBlogPostingSchema(post, siteUrl);
  const shareLinks = buildShareLinks({ url, title }).map((link) => ({
    ...link,
    icon: <ExternalLink size={16} strokeWidth={1.6} aria-hidden="true" />,
  }));
  const primaryCategory = categories[0];
  const relatedPostItems = toPostListItems(relatedPosts, locale);

  return (
    <main className={s.root()}>
      {schema && <JsonLd schema={schema} />}

      <Article>
        <Article.Header
          categories={
            primaryCategory
              ? [
                  {
                    label: primaryCategory.title,
                    href: routes.category(primaryCategory.slug),
                  },
                ]
              : []
          }
          linkAs={SmartLink}
          title={title}
          lead={excerpt}
          meta={{
            author: { ...author, href: routes.author(author.slug) },
            publishedAt,
            formattedDate: formatDate(publishedAt, locale),
            readingTimeMinutes,
            categories: categories.slice(1).map((category) => ({
              label: category.title,
              href: routes.category(category.slug),
            })),
            linkAs: SmartLink,
            share: <PostShare url={url} title={title} links={shareLinks} />,
          }}
          coverMedia={
            heroImageSanity ? (
              <SanityImage
                image={heroImageSanity}
                width={1200}
                height={675}
                sizes="(min-width: 1024px) 800px, 100vw"
                alt={heroImageAlt}
                className={s.coverImage()}
              />
            ) : undefined
          }
        />

        <Article.Body className={s.body()}>
          <PortableTextRenderer value={body} />
        </Article.Body>

        <Article.Footer
          tags={tags.map((tag) => ({
            label: tag.title,
            href: routes.tag(tag.slug),
          }))}
          linkAs={SmartLink}
        />
      </Article>

      {relatedPostItems.length > 0 && (
        <PostsSection
          posts={relatedPostItems}
          title="Related posts"
          titleId="related-posts-title"
          linkAs={SmartLink}
        />
      )}
    </main>
  );
}
