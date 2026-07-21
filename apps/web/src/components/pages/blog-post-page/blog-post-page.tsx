import { routes, type ILocalizedParams } from '@blog/config';
import { service } from '@blog/service';
import { AuthorByline, Heading, PostMeta, TagList } from '@blog/ui';
import { JsonLd } from '@web/components/shared/json-ld';
import { PortableTextRenderer } from '@web/components/shared/portable-text-renderer';
import { PostShareButtons } from '@web/components/shared/post-share-buttons';
import { SanityImage } from '@web/components/shared/sanity-image';
import { SmartLink } from '@web/components/shared/smart-link';
import { blockTextToPlain } from '@web/utils/block-text-to-plain';
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
 * `service.pages.post.v1.getPost`, then composes `PostMeta`, `AuthorByline`,
 * `PortableTextRenderer`, and `PostShareButtons` around the fetched view
 * model, plus a `BlogPosting` JSON-LD tag. `Header`/`Footer` stay owned by
 * `[locale]/layout.tsx`.
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

      {post.heroImageSanity && (
        <div className={s.hero()}>
          <SanityImage
            image={post.heroImageSanity}
            width={1200}
            height={675}
            sizes="(min-width: 1024px) 800px, 100vw"
            className={s.heroImage()}
            alt={post.heroImageAlt}
          />
        </div>
      )}

      <Heading level={1} visual="post" className={s.heading()}>
        {post.title}
      </Heading>

      {post.categories.length > 0 && (
        <TagList
          tags={post.categories.map((category) => ({
            label: category.title,
            href: routes.category(category.slug),
          }))}
          linkAs={SmartLink}
          className={s.tags()}
        />
      )}

      {post.author && (
        <PostMeta
          className={s.meta()}
          author={{ name: post.author.name, avatarUrl: post.author.imageUrl }}
          publishedAt={post.publishedAt}
          formattedDate={formatDate(post.publishedAt, locale)}
        />
      )}

      <div className={s.body()}>
        <PortableTextRenderer value={post.body} />
      </div>

      <div className={s.share()}>
        <PostShareButtons links={shareLinks} url={url} />
      </div>

      {/* TODO: Check design-reference.html for existing design, if no, remove it */}
      {post.author && (
        <AuthorByline
          className={s.byline()}
          name={post.author.name}
          bio={blockTextToPlain(post.author.bio)}
          avatarUrl={post.author.imageUrl}
        />
      )}
    </main>
  );
}
