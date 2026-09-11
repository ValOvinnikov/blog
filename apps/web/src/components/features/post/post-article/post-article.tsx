import { ASIDE_KIND, routes, type TAsideKind } from '@blog/config';
import { type TImageTransformOptions, urlForSanityImage } from '@blog/service';
import { Article } from '@blog/ui/organisms/article';
import { BookmarkButtonGate } from '@web/components/features/post/bookmark-button-gate';
import { PortableTextRenderer } from '@web/components/shared/portable-text-renderer';
import { PostContentsRail } from '@web/components/shared/post-contents-rail';
import { PostShareLinks } from '@web/components/shared/post-share-links';
import { SanityImage } from '@web/components/shared/sanity-image';
import { SmartLink } from '@web/components/shared/smart-link';
import { getPostPage } from '@web/server/post/get-post-page';
import { getTenantBaseUrl } from '@web/server/tenant/get-tenant-base-url';
import { getTenantSanityContext } from '@web/server/tenant/get-tenant-sanity-context';
import {
  extractPostHeadings,
  MIN_H2_HEADINGS_FOR_RAIL,
} from '@web/utils/extract-post-headings/extract-post-headings';
import { guardPageLoaderResult } from '@web/utils/guard-page-loader-result';
import { getFormatter, getTranslations } from 'next-intl/server';

import { postArticleVariants } from './post-article-variants';

export type TPostArticleProps = {
  slug: string;
  tenant: string;
};

const s = postArticleVariants();

// `PostMeta` renders the author avatar at `SIZE.SM` (32px,
// `avatar-variants.ts`) — 64px covers a 2x DPR display without serving the
// source asset's full natural resolution.
const AUTHOR_AVATAR_SIZE_PX = 64;
const AUTHOR_AVATAR_TRANSFORM: TImageTransformOptions = {
  width: AUTHOR_AVATAR_SIZE_PX,
  height: AUTHOR_AVATAR_SIZE_PX,
  fit: 'crop',
  quality: 75,
};

/**
 * PostArticle — the post detail's `Article.Header`/`Body`/`Footer` shell:
 * hero image, topic eyebrow, meta strip (bookmark + share), body with an
 * optional contents rail, and the tags footer. Fetches the cached post
 * itself.
 */
export const PostArticle = async ({ slug, tenant }: TPostArticleProps) => {
  const result = await getPostPage(slug, tenant);
  const post = guardPageLoaderResult(result, 'post_article.fetch_failed', {
    slug,
  });
  const {
    id,
    title,
    excerpt,
    topic,
    tags,
    body,
    author,
    publishedAt,
    readingTimeMinutes,
    heroImage,
  } = post;

  const [format, blogPostT, siteUrl, tenantContext] = await Promise.all([
    getFormatter(),
    getTranslations('blogPostPage'),
    getTenantBaseUrl(tenant),
    getTenantSanityContext(tenant),
  ]);
  const authorImageUrl = author.image
    ? urlForSanityImage(author.image, tenantContext, AUTHOR_AVATAR_TRANSFORM)
    : undefined;

  const formattedDate = format.dateTime(new Date(publishedAt), {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const headings = extractPostHeadings(body);
  const hasContentsRail = headings.length >= MIN_H2_HEADINGS_FOR_RAIL;
  const url = `${siteUrl ?? ''}${routes.post(slug)}`;
  const asideKindLabels: Record<TAsideKind, string> = {
    [ASIDE_KIND.WHY_NOT]: blogPostT('asideKind.WHY_NOT'),
    [ASIDE_KIND.DIGRESSION]: blogPostT('asideKind.DIGRESSION'),
    [ASIDE_KIND.CONTEXT]: blogPostT('asideKind.CONTEXT'),
  };
  const footerTags = tags.map((tag) => ({
    label: tag.title,
    href: routes.tag(tag.slug),
  }));

  return (
    <Article>
      <Article.Header
        className={s.hero()}
        title={title}
        topic={{
          label: topic.title,
          href: routes.topic(topic.slug),
          linkAs: SmartLink,
        }}
        lead={excerpt}
        meta={{
          author: {
            name: author.name,
            imageUrl: authorImageUrl,
            href: author.profilePageSlug
              ? routes.landingPage(author.profilePageSlug)
              : undefined,
          },
          publishedAt,
          formattedDate,
          readingTimeMinutes,
          linkAs: SmartLink,
          share: (
            <div className={s.metaActions()}>
              <BookmarkButtonGate postId={id} tenant={tenant} />
              <PostShareLinks url={url} title={title} />
            </div>
          ),
        }}
        coverMedia={
          heroImage ? (
            <SanityImage
              image={heroImage}
              width={1200}
              height={675}
              sizes="(min-width: 1024px) 800px, 100vw"
              priority={true}
              className={s.coverImage()}
            />
          ) : undefined
        }
      />

      <Article.Body className={s.body({ withRail: hasContentsRail })}>
        {hasContentsRail ? (
          <>
            <PostContentsRail className={s.rail()} headings={headings} />
            <div className={s.content({ withRail: true })}>
              <PortableTextRenderer
                value={body}
                headings={headings}
                asideKindLabels={asideKindLabels}
              />
            </div>
          </>
        ) : (
          <PortableTextRenderer
            value={body}
            headings={headings}
            asideKindLabels={asideKindLabels}
          />
        )}
        <Article.Footer
          className={hasContentsRail ? s.footerInRail() : s.footer()}
          tags={footerTags}
          linkAs={SmartLink}
        />
      </Article.Body>
    </Article>
  );
};
