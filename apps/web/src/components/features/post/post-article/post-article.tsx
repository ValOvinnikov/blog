import { ASIDE_KIND, routes, type TAsideKind } from '@shinefold/config';
import {
  type TImageTransformOptions,
  urlForSanityImage,
} from '@shinefold/service';
import { Prose } from '@shinefold/ui/components/atoms/prose';
import { Article } from '@shinefold/ui/components/organisms/article';
import { PostSummaryCard } from '@web/components/features/post/post-summary-card';
import { ContentsRailLayout } from '@web/components/shared/contents-rail-layout';
import {
  createPostBodyOverride,
  PortableText,
} from '@web/components/shared/portable-text';
import { SanityImage } from '@web/components/shared/sanity-image';
import { SmartLink } from '@web/components/shared/smart-link';
import { PostSummaryProvider } from '@web/context/post-summary-provider';
import { getPostPage } from '@web/server/post/get-post-page/get-post-page';
import { getRequestContext } from '@web/server/request-context/request-context';
import { guardPageLoaderResult } from '@web/utils/guard-page-loader-result';
import { getFormatter, getTranslations } from 'next-intl/server';

import { ArticleBodyFocusTarget } from './components/article-body-focus-target';
import { PostArticleActions } from './components/post-article-actions';
import { postArticleVariants } from './post-article-variants';

export type TPostArticleProps = {
  slug: string;
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

export const PostArticle = async ({ slug }: TPostArticleProps) => {
  const result = await getPostPage(slug);
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
    postTakeaways,
  } = post;

  const [format, blogPostT, { sanityContext }] = await Promise.all([
    getFormatter(),
    getTranslations('blogPostPage'),
    getRequestContext(),
  ]);
  const authorImageUrl = author.image
    ? urlForSanityImage(author.image, sanityContext, AUTHOR_AVATAR_TRANSFORM)
    : undefined;

  const readingTime = blogPostT('readingTime', { count: readingTimeMinutes });
  const formattedDate = format.dateTime(new Date(publishedAt), {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const asideKindLabels: Record<TAsideKind, string> = {
    [ASIDE_KIND.WHY_NOT]: blogPostT('asideKind.WHY_NOT'),
    [ASIDE_KIND.DIGRESSION]: blogPostT('asideKind.DIGRESSION'),
    [ASIDE_KIND.CONTEXT]: blogPostT('asideKind.CONTEXT'),
  };
  const footerTags = tags.flatMap(({ title: label, slug: tagSlug }) =>
    tagSlug ? [{ label, href: routes.tag(tagSlug) }] : [],
  );
  const components = createPostBodyOverride(asideKindLabels);

  return (
    <PostSummaryProvider>
      <Article>
        <Article.Header
          className={s.hero()}
          dataTestId="post-article-header"
          title={title}
          topic={{
            label: topic.title,
            href: topic.slug ? routes.topic(topic.slug) : undefined,
            linkAs: SmartLink,
          }}
          lead={excerpt}
          meta={{
            author: {
              name: author.name,
              imageUrl: authorImageUrl,
              href: author.profileUrl,
            },
            publishedAt,
            formattedDate,
            readingTime,
            linkAs: SmartLink,
            actions: (
              <PostArticleActions
                postId={id}
                slug={slug}
                title={title}
                hasSummary={Boolean(postTakeaways)}
              />
            ),
          }}
          belowMeta={
            postTakeaways && (
              <PostSummaryCard
                takeaways={postTakeaways}
                readingTimeMinutes={readingTimeMinutes}
              />
            )
          }
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

        <Article.Body className={s.body()}>
          <ArticleBodyFocusTarget>
            <ContentsRailLayout
              body={body}
              footer={<Article.Footer tags={footerTags} linkAs={SmartLink} />}
            >
              <Prose className={s.prose()}>
                <PortableText value={body} components={components} />
              </Prose>
            </ContentsRailLayout>
          </ArticleBodyFocusTarget>
        </Article.Body>
      </Article>
    </PostSummaryProvider>
  );
};
