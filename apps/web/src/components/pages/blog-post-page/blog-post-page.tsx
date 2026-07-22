import { routes, type ILocalizedParams } from '@blog/config';
import { service } from '@blog/service';
import { ArticleBody, ArticleHeader } from '@blog/ui';
import { JsonLd } from '@web/components/shared/json-ld';
import { PortableTextRenderer } from '@web/components/shared/portable-text-renderer';
import { PostShare } from '@web/components/shared/post-share';
import { SanityImage } from '@web/components/shared/sanity-image';
import { SmartLink } from '@web/components/shared/smart-link';
import { buildBlogPostingSchema } from '@web/utils/build-blog-posting-schema';
import { buildShareLinks } from '@web/utils/build-share-links';
import { env } from '@web/utils/env/env';
import { formatDate } from '@web/utils/format-date';
import { ExternalLink } from 'lucide-react';
import { notFound } from 'next/navigation';

import { blogPostPageVariants } from './blog-post-page-variants';

type TBlogPostPageProps = ILocalizedParams & { slug: string };

const s = blogPostPageVariants();

/**
 * BlogPostPage — `/blog/{slug}` composition: fetches the post via
 * `service.pages.post.v1.getPost`, then composes `ArticleHeader` (category
 * eyebrow links, title, `PostMeta` with `PostShare` in its share slot, lead,
 * cover image) and `ArticleBody` (rendered `PortableTextRenderer` body)
 * around the fetched view model, plus a `BlogPosting` JSON-LD tag.
 * `Header`/`Footer` stay owned by `[locale]/layout.tsx`.
 */
export async function BlogPostPage({ slug, locale }: TBlogPostPageProps) {
  const post = await service.pages.post.v1.getPost(slug);

  if (!post) {
    notFound();
  }

  const siteUrl = env.NEXT_PUBLIC_SITE_URL ?? '';
  const url = `${siteUrl}${routes.post(slug)}`;
  const schema = buildBlogPostingSchema(post, siteUrl);
  const shareLinks = buildShareLinks({ url, title: post.title }).map(
    (link) => ({
      ...link,
      icon: <ExternalLink size={16} strokeWidth={1.6} aria-hidden="true" />,
    }),
  );

  return (
    <main className={s.root()}>
      {schema && <JsonLd schema={schema} />}

      <article>
        <ArticleHeader
          categories={post.categories.map((category) => ({
            label: category.title,
            href: routes.category(category.slug),
          }))}
          linkAs={SmartLink}
          title={post.title}
          lead={post.excerpt}
          meta={
            post.author
              ? {
                  author: post.author,
                  publishedAt: post.publishedAt,
                  formattedDate: formatDate(post.publishedAt, locale),
                  share: (
                    <PostShare
                      url={url}
                      title={post.title}
                      links={shareLinks}
                    />
                  ),
                }
              : undefined
          }
          coverMedia={
            post.heroImageSanity ? (
              <SanityImage
                image={post.heroImageSanity}
                width={1200}
                height={675}
                sizes="(min-width: 1024px) 800px, 100vw"
                alt={post.heroImageAlt}
              />
            ) : undefined
          }
        />

        <ArticleBody className={s.body()}>
          <PortableTextRenderer value={post.body} />
        </ArticleBody>
      </article>
    </main>
  );
}
