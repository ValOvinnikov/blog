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
import type { IBreadcrumbItem } from '@blog/ui/molecules/breadcrumbs';
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

import { BlogPostPageView } from './blog-post-page-view';

type TBlogPostPageProps = { slug: string };

/**
 * `/blog/{slug}` composition. Site chrome (`Header`/`Footer`) stays owned by
 * `[locale]/layout.tsx`, not this component. Resolves every async concern
 * (the post fetch, next-intl translations/formatting, the newsletter
 * settings + bookmarks-capability checks) and hands the result to the pure
 * `BlogPostPageView`.
 */
export const BlogPostPage = async ({ slug }: TBlogPostPageProps) => {
  const result = await service.pages.post.v1.getPost(slug);

  if (!result.ok) {
    logger.error('blog_post_page.fetch_failed', { slug, error: result.error });
    notFound();
  }

  if (!result.data) {
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
  const siteUrl = env.NEXT_PUBLIC_SITE_URL ?? '';
  const imageBaseUrl = getSanityImageBaseUrl();
  const url = `${siteUrl}${routes.post(slug)}`;
  const blogPostingSchema = buildBlogPostingSchema(post, siteUrl);
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
  const newsletterHeading = newsletterSettingsResult.ok
    ? newsletterSettingsResult.data.heading
    : undefined;

  const breadcrumbTrail: IBreadcrumbItem[] = [
    { label: t('home'), href: routes.home() },
    { label: topic.title, href: routes.topic(topic.slug) },
    { label: title, href: routes.post(slug) },
  ];
  const breadcrumbListSchema = buildBreadcrumbListSchema(
    breadcrumbTrail,
    siteUrl,
  );

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
  const formattedDate = format.dateTime(new Date(publishedAt), {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <BlogPostPageView
      id={id}
      title={title}
      excerpt={excerpt}
      topic={topic}
      tags={tags}
      body={body}
      skim={skim}
      hasAsides={hasAsides}
      author={author}
      publishedAt={publishedAt}
      formattedDate={formattedDate}
      readingTimeMinutes={readingTimeMinutes}
      heroImageSanity={heroImageSanity}
      heroImageAlt={heroImageAlt}
      imageBaseUrl={imageBaseUrl}
      headings={headings}
      hasContentsRail={hasContentsRail}
      url={url}
      shareLinks={shareLinks}
      isBookmarksEnabled={isBookmarksEnabled}
      isNewsletterEnabled={newsletterEnabled}
      newsletterHeading={newsletterHeading}
      relatedPostItems={relatedPostItems}
      relatedReadingLabel={blogPostT('relatedReading')}
      breadcrumbTrail={breadcrumbTrail}
      breadcrumbAriaLabel={t('ariaLabel')}
      breadcrumbListSchema={breadcrumbListSchema}
      blogPostingSchema={blogPostingSchema}
      depthToggleLabels={depthToggleLabels}
      asideKindLabels={asideKindLabels}
      skimPanelLabel={blogPostT('skimPanel.label')}
      skimPanelReadFullArticleLabel={blogPostT('skimPanel.readFullArticle')}
    />
  );
};
