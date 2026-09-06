import {
  routes,
  type ISanityImage,
  type TAsideKind,
  type TMaybeUndefined,
  type TPortableTextBody,
} from '@blog/config';
import type { TPostDetailAuthor, TPostSkim, TTag, TTopic } from '@blog/service';
import {
  Breadcrumbs,
  type IBreadcrumbItem,
} from '@blog/ui/molecules/breadcrumbs';
import type { IShareLinkItem } from '@blog/ui/molecules/share-link';
import { Article } from '@blog/ui/organisms/article';
import {
  PostsSection,
  type IPostCardData,
} from '@blog/ui/organisms/posts-section';
import { BackToTopButton } from '@web/components/shared/back-to-top-button';
import { BookmarkButton } from '@web/components/shared/bookmark-button';
import { BreadcrumbBar } from '@web/components/shared/breadcrumb-bar';
import {
  DepthToggle,
  type IDepthToggleLabels,
} from '@web/components/shared/depth-toggle';
import { JsonLd } from '@web/components/shared/json-ld';
import { NewsletterForm } from '@web/components/shared/newsletter-form';
import { PortableTextRenderer } from '@web/components/shared/portable-text-renderer';
import { PostContentsRail } from '@web/components/shared/post-contents-rail';
import { PostShare } from '@web/components/shared/post-share';
import { SanityImage } from '@web/components/shared/sanity-image';
import { SkimPanel } from '@web/components/shared/skim-panel';
import { SmartLink } from '@web/components/shared/smart-link';
import { DepthProvider } from '@web/context/depth-provider';
import type { buildBlogPostingSchema } from '@web/utils/build-blog-posting-schema';
import type { buildBreadcrumbListSchema } from '@web/utils/build-breadcrumb-list-schema';
import type { TPostHeading } from '@web/utils/extract-post-headings/extract-post-headings';

import { blogPostPageVariants } from './blog-post-page-variants';

export interface IBlogPostPageViewProps {
  id: string;
  title: string;
  excerpt: string;
  topic: TTopic;
  tags: TTag[];
  body: TPortableTextBody;
  skim: TMaybeUndefined<TPostSkim>;
  hasAsides: boolean;
  author: TPostDetailAuthor;
  publishedAt: string;
  formattedDate: string;
  readingTimeMinutes: number;
  heroImageSanity: TMaybeUndefined<ISanityImage>;
  heroImageAlt: TMaybeUndefined<string>;
  headings: TPostHeading[];
  hasContentsRail: boolean;
  url: string;
  shareLinks: IShareLinkItem[];
  isBookmarksEnabled: boolean;
  isNewsletterEnabled: boolean;
  newsletterHeading: TMaybeUndefined<string>;
  relatedPostItems: IPostCardData[];
  relatedReadingLabel: string;
  breadcrumbTrail: IBreadcrumbItem[];
  breadcrumbAriaLabel: string;
  breadcrumbListSchema?: ReturnType<typeof buildBreadcrumbListSchema>;
  blogPostingSchema?: ReturnType<typeof buildBlogPostingSchema>;
  depthToggleLabels: IDepthToggleLabels;
  asideKindLabels: Record<TAsideKind, string>;
  skimPanelLabel: string;
  skimPanelReadFullArticleLabel: string;
}

const s = blogPostPageVariants();

/**
 * Pure view for `BlogPostPage` — everything below the fetch/guard boundary:
 * the breadcrumb trail + JSON-LD, and the article shell itself (header,
 * body with an optional contents rail, footer tags, newsletter signup,
 * related-reading section). `BlogPostPage` resolves every async concern
 * (the post fetch, next-intl translations/formatting, the newsletter
 * settings + bookmarks-capability checks) and hands this component
 * already-typed, already-formatted data.
 */
export const BlogPostPageView = ({
  id,
  title,
  excerpt,
  topic,
  tags,
  body,
  skim,
  hasAsides,
  author,
  publishedAt,
  formattedDate,
  readingTimeMinutes,
  heroImageSanity,
  heroImageAlt,
  headings,
  hasContentsRail,
  url,
  shareLinks,
  isBookmarksEnabled,
  isNewsletterEnabled,
  newsletterHeading,
  relatedPostItems,
  relatedReadingLabel,
  breadcrumbTrail,
  breadcrumbAriaLabel,
  breadcrumbListSchema,
  blogPostingSchema,
  depthToggleLabels,
  asideKindLabels,
  skimPanelLabel,
  skimPanelReadFullArticleLabel,
}: IBlogPostPageViewProps) => {
  const hasSkim = Boolean(skim);
  const footerTags = tags.map((tag) => ({
    label: tag.title,
    href: routes.tag(tag.slug),
  }));

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
  const newsletterForm = isNewsletterEnabled && newsletterHeading && (
    <NewsletterForm
      variant="compact"
      heading={newsletterHeading}
      className={hasContentsRail ? s.newsletterInRail() : s.newsletter()}
    />
  );

  return (
    <>
      {blogPostingSchema && <JsonLd schema={blogPostingSchema} />}
      {breadcrumbListSchema && <JsonLd schema={breadcrumbListSchema} />}

      <BreadcrumbBar>
        <Breadcrumbs
          items={breadcrumbTrail}
          ariaLabel={breadcrumbAriaLabel}
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
                formattedDate,
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
              {footer}
              {newsletterForm}
            </Article.Body>
          </Article>

          <SkimPanel
            skim={skim}
            label={skimPanelLabel}
            readFullArticleLabel={skimPanelReadFullArticleLabel}
          />
        </DepthProvider>

        {relatedPostItems.length > 0 && (
          <PostsSection
            posts={relatedPostItems}
            title={relatedReadingLabel}
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
