import { ASIDE_KIND, ICONS, Size, type TAsideKind, routes } from '@blog/config';
import { service } from '@blog/service';
import { Icon } from '@blog/ui/atoms';
import { Breadcrumbs, type IBreadcrumbItem } from '@blog/ui/molecules';
import { Article, PostsSection } from '@blog/ui/organisms';
import { BackToTopButton } from '@web/components/shared/back-to-top-button';
import { BookmarkButton } from '@web/components/shared/bookmark-button';
import { BreadcrumbBar } from '@web/components/shared/breadcrumb-bar';
import { DepthProvider } from '@web/components/shared/depth-provider';
import { DepthToggle } from '@web/components/shared/depth-toggle';
import { JsonLd } from '@web/components/shared/json-ld';
import { NewsletterForm } from '@web/components/shared/newsletter-form';
import { PortableTextRenderer } from '@web/components/shared/portable-text-renderer';
import { PostContentsRail } from '@web/components/shared/post-contents-rail';
import { PostShare } from '@web/components/shared/post-share';
import { SanityImage } from '@web/components/shared/sanity-image';
import { SkimPanel } from '@web/components/shared/skim-panel';
import { SmartLink } from '@web/components/shared/smart-link';
import { buildBlogPostingSchema } from '@web/utils/build-blog-posting-schema';
import { buildBreadcrumbListSchema } from '@web/utils/build-breadcrumb-list-schema';
import { buildShareLinks } from '@web/utils/build-share-links';
import { env } from '@web/utils/env/env';
import {
  extractPostHeadings,
  MIN_H2_HEADINGS_FOR_RAIL,
} from '@web/utils/extract-post-headings/extract-post-headings';
import { sanitizeLogMessage } from '@web/utils/sanitize-log-message';
import { toPostListItems } from '@web/utils/to-post-list-items';
import { toSocialIconName } from '@web/utils/to-social-icon-name';
import { notFound } from 'next/navigation';
import { getFormatter, getTranslations } from 'next-intl/server';

import { blogPostPageVariants } from './blog-post-page-variants';

type TBlogPostPageProps = { slug: string };

const s = blogPostPageVariants();

/**
 * BlogPostPage — `/blog/{slug}` composition: fetches the post via
 * `service.pages.post.v1.getPost` and renders it as an `Article` compound
 * with a `Home › Category › Post` breadcrumb trail, `BlogPosting` JSON-LD,
 * an optional `PostContentsRail` once the body has enough headings, and a
 * "Related reading" section when related posts exist. Site chrome
 * (`Header`/`Footer`) stays owned by `[locale]/layout.tsx`.
 */
export async function BlogPostPage({ slug }: TBlogPostPageProps) {
  const result = await service.pages.post.v1.getPost(slug);

  if (!result.ok) {
    console.error(`Error to fetch post: ${sanitizeLogMessage(result.error)}`);
    notFound();
  }
  if (result.data === null) {
    notFound();
  }

  const post = result.data;
  const {
    id,
    title,
    excerpt,
    category,
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
  const [format, t, blogPostT, relatedPostItems, newsletterSettingsResult] =
    await Promise.all([
      getFormatter(),
      getTranslations('breadcrumbs'),
      getTranslations('blogPostPage'),
      toPostListItems(relatedPosts),
      service.global.newsletterSettings.v1.getNewsletterSettings(),
    ]);

  // Per-post opt-out (`newsletterEnabled`) gates the compact signup on this
  // page; its heading is always CMS-sourced from the `settings_newsletter`
  // singleton (never the page-builder module, never an i18n fallback —
  // #1200). A failed settings fetch is optional/global data (SPEC.md's
  // fetch-error stance): logged, and the signup is simply omitted rather
  // than guessed at.
  let newsletterHeading: string | undefined;
  if (newsletterSettingsResult.ok) {
    newsletterHeading = newsletterSettingsResult.data.heading ?? '';
  } else {
    console.error(
      `Error to fetch newsletter settings: ${sanitizeLogMessage(newsletterSettingsResult.error)}`,
    );
  }

  const trail: IBreadcrumbItem[] = [
    { label: t('home'), href: routes.home() },
    { label: category.title, href: routes.category(category.slug) },
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

  // Rendered in one of two structural positions below (nested inside
  // `Article.Body`'s grid when the rail is present, or as `Article`'s
  // direct sibling otherwise) — hoisted so the two branches can't drift.
  const footer = (
    <Article.Footer
      className={hasContentsRail ? s.footerInRail() : s.footer()}
      tags={footerTags}
      linkAs={SmartLink}
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
              category={{
                label: category.title,
                href: routes.category(category.slug),
                linkAs: SmartLink,
              }}
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
                share: (
                  <div className={s.metaActions()}>
                    <BookmarkButton postId={id} />
                    <PostShare url={url} title={title} links={shareLinks} />
                  </div>
                ),
              }}
              coverMedia={
                heroImageSanity ? (
                  <SanityImage
                    image={heroImageSanity}
                    projectId={env.NEXT_PUBLIC_SANITY_PROJECT_ID}
                    dataset={env.NEXT_PUBLIC_SANITY_DATASET}
                    width={1200}
                    height={675}
                    sizes="(min-width: 1024px) 800px, 100vw"
                    priority
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
                      headings={headings}
                      asideKindLabels={asideKindLabels}
                    />
                  </div>
                  {footer}
                </>
              ) : (
                <PortableTextRenderer
                  value={body}
                  headings={headings}
                  asideKindLabels={asideKindLabels}
                />
              )}
            </Article.Body>

            {!hasContentsRail && footer}
          </Article>

          <SkimPanel
            skim={skim}
            label={blogPostT('skimPanel.label')}
            readFullArticleLabel={blogPostT('skimPanel.readFullArticle')}
          />
        </DepthProvider>

        {newsletterEnabled && newsletterHeading !== undefined && (
          <div className={s.newsletter()}>
            <NewsletterForm variant="compact" heading={newsletterHeading} />
          </div>
        )}

        {relatedPostItems.length > 0 && (
          <PostsSection
            posts={relatedPostItems}
            title={blogPostT('relatedReading')}
            titleId="related-posts-title"
            linkAs={SmartLink}
            tinted
          />
        )}
      </main>

      <BackToTopButton />
    </>
  );
}
