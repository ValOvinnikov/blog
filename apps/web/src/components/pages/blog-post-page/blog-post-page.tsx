import {
  ASIDE_KIND,
  CAPABILITY,
  ICONS,
  Size,
  type TAsideKind,
  routes,
} from '@blog/config';
import { getSanityImageBaseUrl, service } from '@blog/service';
import { Icon } from '@blog/ui/atoms/icon';
import {
  Breadcrumbs,
  type IBreadcrumbItem,
} from '@blog/ui/molecules/breadcrumbs';
import { Article } from '@blog/ui/organisms/article';
import { PostsSection } from '@blog/ui/organisms/posts-section';
import { BackToTopButton } from '@web/components/shared/back-to-top-button';
import { BookmarkButton } from '@web/components/shared/bookmark-button';
import { BreadcrumbBar } from '@web/components/shared/breadcrumb-bar';
import { DepthToggle } from '@web/components/shared/depth-toggle';
import { JsonLd } from '@web/components/shared/json-ld';
import { NewsletterForm } from '@web/components/shared/newsletter-form';
import { PortableTextRenderer } from '@web/components/shared/portable-text-renderer';
import { PostContentsRail } from '@web/components/shared/post-contents-rail';
import { PostShare } from '@web/components/shared/post-share';
import { SanityImage } from '@web/components/shared/sanity-image';
import { SkimPanel } from '@web/components/shared/skim-panel';
import { SmartLink } from '@web/components/shared/smart-link';
import { DepthProvider } from '@web/context/depth-provider';
import { isCapabilityEnabled } from '@web/server/settings-features/is-capability-enabled';
import { buildBlogPostingSchema } from '@web/utils/build-blog-posting-schema';
import { buildBreadcrumbListSchema } from '@web/utils/build-breadcrumb-list-schema';
import { buildShareLinks } from '@web/utils/build-share-links';
import { env } from '@web/utils/env/env';
import {
  extractPostHeadings,
  MIN_H2_HEADINGS_FOR_RAIL,
} from '@web/utils/extract-post-headings/extract-post-headings';
import { logger } from '@web/utils/logger/logger';
import { toPostListItems } from '@web/utils/to-post-list-items';
import { toSocialIconName } from '@web/utils/to-social-icon-name';
import { notFound } from 'next/navigation';
import { getFormatter, getTranslations } from 'next-intl/server';

import { blogPostPageVariants } from './blog-post-page-variants';

type TBlogPostPageProps = { slug: string };

const s = blogPostPageVariants();

/**
 * `/blog/{slug}` composition. Site chrome (`Header`/`Footer`) stays owned by
 * `[locale]/layout.tsx`, not this component.
 */
export const BlogPostPage = async ({ slug }: TBlogPostPageProps) => {
  const result = await service.pages.post.v1.getPost(slug);

  if (!result.ok) {
    // ok: false covers both a real fetch failure and an ordinary missing
    // slug — no public way to tell them apart, so this always logs error.
    logger.error('blog_post_page.fetch_failed', { slug, error: result.error });
    notFound();
  }

  const post = result.data;
  const {
    id,
    title,
    excerpt,
    topic,
    tags,
    body,
    skim,
    hasAsides,
    relatedPosts,
    heroImageSanity,
    heroImageAlt,
    publishedAt,
    author,
    readingTimeMinutes,
    newsletterEnabled,
  } = post;

  const headings = extractPostHeadings(body);
  const hasContentsRail = headings.length >= MIN_H2_HEADINGS_FOR_RAIL;
  const hasSkim = Boolean(skim);
  const footerTags = tags.map((tag) => ({
    label: tag.title,
    href: routes.tag(tag.slug),
  }));

  const siteUrl = env.NEXT_PUBLIC_SITE_URL ?? '';
  const imageBaseUrl = getSanityImageBaseUrl();
  const url = `${siteUrl}${routes.post(slug)}`;
  const schema = buildBlogPostingSchema(post, siteUrl);
  const shareLinks = buildShareLinks({ url, title }).map((link) => ({
    ...link,
    icon: (
      <Icon
        name={toSocialIconName(link.platform) ?? ICONS.EXTERNAL_LINK}
        size={Size.SM}
      />
    ),
  }));
  const [
    format,
    t,
    blogPostT,
    relatedPostItems,
    newsletterSettingsResult,
    isBookmarksEnabled,
  ] = await Promise.all([
    getFormatter(),
    getTranslations('breadcrumbs'),
    getTranslations('blogPostPage'),
    toPostListItems(relatedPosts),
    service.global.newsletterSettings.v1.getNewsletterSettings(),
    isCapabilityEnabled(CAPABILITY.BOOKMARKS),
  ]);

  // Per-post opt-out (`newsletterEnabled`) gates the compact signup on this
  // page; its heading is always CMS-sourced from the `settings_newsletter`
  // singleton (never the page-builder module, never an i18n fallback). A
  // failed settings fetch is optional/global data (SPEC.md's fetch-error
  // stance): logged, and the signup is simply omitted rather than guessed at.
  if (!newsletterSettingsResult.ok) {
    logger.error('blog_post_page.newsletter_settings_fetch_failed', {
      error: newsletterSettingsResult.error,
    });
  }

  const trail: IBreadcrumbItem[] = [
    { label: t('home'), href: routes.home() },
    { label: topic.title, href: routes.topic(topic.slug) },
    { label: title, href: routes.post(slug) },
  ];
  const breadcrumbListSchema = buildBreadcrumbListSchema(trail, siteUrl);

  const depthToggleLabels = {
    skim: blogPostT('depthToggle.skim'),
    read: blogPostT('depthToggle.read'),
    deep: blogPostT('depthToggle.deep'),
    ariaLabel: blogPostT('depthToggle.ariaLabel'),
  };
  const asideKindLabels: Record<TAsideKind, string> = {
    [ASIDE_KIND.WHY_NOT]: blogPostT('asideKind.WHY_NOT'),
    [ASIDE_KIND.DIGRESSION]: blogPostT('asideKind.DIGRESSION'),
    [ASIDE_KIND.CONTEXT]: blogPostT('asideKind.CONTEXT'),
  };

  // Both render as `Article.Body`'s own last children — genuine article
  // content sharing the article's real content column, not a page-level
  // sibling mimicking its width from outside. Hoisted so the rail/no-rail
  // branches below can't drift.
  const footer = (
    <Article.Footer
      className={hasContentsRail ? s.footerInRail() : s.footer()}
      tags={footerTags}
      linkAs={SmartLink}
    />
  );
  const newsletterForm = newsletterEnabled && newsletterSettingsResult.ok && (
    <NewsletterForm
      variant="compact"
      heading={newsletterSettingsResult.data.heading}
      className={hasContentsRail ? s.newsletterInRail() : s.newsletter()}
    />
  );

  return (
    <>
      {schema && <JsonLd schema={schema} />}
      {breadcrumbListSchema && <JsonLd schema={breadcrumbListSchema} />}

      <BreadcrumbBar>
        <Breadcrumbs
          items={trail}
          ariaLabel={t('ariaLabel')}
          linkAs={SmartLink}
        />
      </BreadcrumbBar>

      <main className={s.root()}>
        <DepthProvider hasSkim={hasSkim} hasDeep={hasAsides}>
          <DepthToggle
            hasSkim={hasSkim}
            hasDeep={hasAsides}
            labels={depthToggleLabels}
            className={s.depthToggle()}
          />

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
                  ...author,
                  href: author.profilePageSlug
                    ? routes.genericPage(author.profilePageSlug)
                    : undefined,
                },
                publishedAt,
                formattedDate: format.dateTime(new Date(publishedAt), {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                }),
                readingTimeMinutes,
                linkAs: SmartLink,
                share: (
                  <div className={s.metaActions()}>
                    {isBookmarksEnabled && <BookmarkButton postId={id} />}
                    <PostShare url={url} title={title} links={shareLinks} />
                  </div>
                ),
              }}
              coverMedia={
                heroImageSanity ? (
                  <SanityImage
                    image={heroImageSanity}
                    baseUrl={imageBaseUrl}
                    width={1200}
                    height={675}
                    sizes="(min-width: 1024px) 800px, 100vw"
                    priority={true}
                    alt={heroImageAlt}
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
                      baseUrl={imageBaseUrl}
                      headings={headings}
                      asideKindLabels={asideKindLabels}
                    />
                  </div>
                </>
              ) : (
                <PortableTextRenderer
                  value={body}
                  baseUrl={imageBaseUrl}
                  headings={headings}
                  asideKindLabels={asideKindLabels}
                />
              )}
              {footer}
              {newsletterForm}
            </Article.Body>
          </Article>

          <SkimPanel
            skim={skim}
            label={blogPostT('skimPanel.label')}
            readFullArticleLabel={blogPostT('skimPanel.readFullArticle')}
          />
        </DepthProvider>

        {relatedPostItems.length > 0 && (
          <PostsSection
            posts={relatedPostItems}
            title={blogPostT('relatedReading')}
            titleId="related-posts-title"
            linkAs={SmartLink}
            isTinted={true}
          />
        )}
      </main>

      <BackToTopButton />
    </>
  );
};
