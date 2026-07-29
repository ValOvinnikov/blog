import { ICONS, Size, routes } from '@blog/config';
import { service } from '@blog/service';
import { Icon } from '@blog/ui/atoms';
import { Breadcrumbs, type IBreadcrumbItem } from '@blog/ui/molecules';
import { Article, PostsSection } from '@blog/ui/organisms';
import { JsonLd } from '@web/components/shared/json-ld';
import { PortableTextRenderer } from '@web/components/shared/portable-text-renderer';
import { PostShare } from '@web/components/shared/post-share';
import { SanityImage } from '@web/components/shared/sanity-image';
import { SmartLink } from '@web/components/shared/smart-link';
import { buildBlogPostingSchema } from '@web/utils/build-blog-posting-schema';
import { buildBreadcrumbListSchema } from '@web/utils/build-breadcrumb-list-schema';
import { buildShareLinks } from '@web/utils/build-share-links';
import { env } from '@web/utils/env/env';
import { toPostListItems } from '@web/utils/to-post-list-items';
import { notFound } from 'next/navigation';
import { getFormatter, getTranslations } from 'next-intl/server';

import { blogPostPageVariants } from './blog-post-page-variants';

type TBlogPostPageProps = { slug: string };

const s = blogPostPageVariants();

/**
 * BlogPostPage — `/blog/{slug}` composition: fetches the post via
 * `service.pages.post.v1.getPost`, then renders a `Home › Category › Post`
 * `Breadcrumbs` trail (plus its `BreadcrumbList` JSON-LD) as page chrome
 * above the `Article` compound (`Article.Header` for title, `PostMeta` with
 * `PostShare` in its share slot, and cover image; `Article.Body` for the
 * rendered `PortableTextRenderer` body; `Article.Footer` for the tag chip
 * list), plus a `BlogPosting` JSON-LD tag and, when the post has any, a
 * "Related posts" `PostsSection` after the article. `Header`/`Footer` (site
 * chrome) stay owned by `[locale]/layout.tsx`.
 */
export async function BlogPostPage({ slug }: TBlogPostPageProps) {
  const result = await service.pages.post.v1.getPost(slug);

  if (!result.ok) {
    console.error(`Error to fetch post: ${result.error}`);
    notFound();
  }
  if (result.data === null) {
    notFound();
  }

  const post = result.data;
  const {
    title,
    excerpt,
    category,
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
    icon: <Icon name={ICONS.EXTERNAL_LINK} size={Size.SM} />,
  }));
  const [format, t, relatedPostItems] = await Promise.all([
    getFormatter(),
    getTranslations('breadcrumbs'),
    toPostListItems(relatedPosts),
  ]);

  const trail: IBreadcrumbItem[] = [
    { label: t('home'), href: routes.home() },
    { label: category.title, href: routes.category(category.slug) },
    { label: title, href: routes.post(slug) },
  ];
  const breadcrumbListSchema = buildBreadcrumbListSchema(trail, siteUrl);

  return (
    <main className={s.root()}>
      {schema && <JsonLd schema={schema} />}
      {breadcrumbListSchema && <JsonLd schema={breadcrumbListSchema} />}

      <Breadcrumbs
        items={trail}
        ariaLabel={t('ariaLabel')}
        linkAs={SmartLink}
      />

      <Article>
        <Article.Header
          title={title}
          lead={excerpt}
          meta={{
            author: { ...author, href: routes.author(author.slug) },
            publishedAt,
            formattedDate: format.dateTime(new Date(publishedAt), {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            }),
            readingTimeMinutes,
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
