import { ASIDE_KIND, SIZE, type TAsideKind, ICONS } from '@blog/config';
import type { TPostDetail } from '@blog/service';
import { Icon } from '@blog/ui/atoms/icon';
import type { IBlogPostPageViewProps } from '@web/components/pages/blog-post-page';
import { AUTHOR_IMAGE_URL } from '@web/testing/shared/author/fixtures';
import { buildBlogPostingSchema } from '@web/utils/build-blog-posting-schema';
import { buildBreadcrumbListSchema } from '@web/utils/build-breadcrumb-list-schema';
import { buildShareLinks } from '@web/utils/build-share-links';
import { toSocialIconName } from '@web/utils/to-social-icon-name';

export const mockPostDetail: TPostDetail = {
  id: 'post-1',
  title: 'Hello World',
  slug: 'hello-world',
  excerpt: 'A sufficiently long excerpt for the card.',
  publishedAt: '2026-01-15T00:00:00Z',
  heroImageUrl: 'https://cdn.example.com/hero.jpg',
  heroImageAlt: 'A hero image',
  heroImageSanity: undefined,
  featured: false,
  newsletterEnabled: true,
  body: [
    {
      _type: 'block',
      _key: 'b1',
      style: 'normal',
      children: [{ _type: 'span', _key: 's1', text: 'Body text.' }],
    },
  ],
  skim: undefined,
  hasAsides: false,
  seo: {
    title: 'Hello World',
    description: 'A sufficiently long excerpt for the card.',
    ogTitle: 'Hello World',
    ogDescription: 'A sufficiently long excerpt for the card.',
    ogImageUrl: 'https://cdn.example.com/hero.jpg',
  },
  author: {
    id: 'author-1',
    name: 'Jane Doe',
    profilePageSlug: 'jane-doe',
    imageUrl: AUTHOR_IMAGE_URL,
    role: 'Writer',
    bio: [
      {
        _type: 'block',
        _key: 'bio1',
        style: 'normal',
        children: [{ _type: 'span', _key: 'bio1s', text: 'A short bio.' }],
      },
    ],
    socialLinks: [],
  },
  topic: {
    id: 'topic-1',
    title: 'Engineering',
    slug: 'engineering',
    description: undefined,
  },
  tags: [],
  relatedPosts: [],
  readingTimeMinutes: 4,
};

const SITE_URL = 'https://example.com';

const DEFAULT_TRAIL = [
  { label: 'Home', href: '/' },
  { label: 'Engineering', href: '/topics/engineering' },
  { label: 'Hello World', href: '/blog/hello-world' },
];

const ASIDE_KIND_LABELS: Record<TAsideKind, string> = {
  [ASIDE_KIND.WHY_NOT]: 'Why not X',
  [ASIDE_KIND.DIGRESSION]: 'Digression',
  [ASIDE_KIND.CONTEXT]: 'Context',
};

export const makeBlogPostPageView = (
  overrides: Partial<IBlogPostPageViewProps> = {},
): IBlogPostPageViewProps => {
  const post = mockPostDetail;
  const url = `${SITE_URL}/blog/${post.slug}`;
  const shareLinks = buildShareLinks({ url, title: post.title }).map(
    (link) => ({
      ...link,
      icon: (
        <Icon
          name={toSocialIconName(link.platform) ?? ICONS.EXTERNAL_LINK}
          size={SIZE.SM}
        />
      ),
    }),
  );

  return {
    id: post.id,
    title: post.title,
    excerpt: post.excerpt,
    topic: post.topic,
    tags: post.tags,
    body: post.body,
    skim: post.skim,
    hasAsides: post.hasAsides,
    author: post.author,
    publishedAt: post.publishedAt,
    formattedDate: 'January 15, 2026',
    readingTimeMinutes: post.readingTimeMinutes,
    heroImageSanity: post.heroImageSanity,
    heroImageAlt: post.heroImageAlt,
    headings: [],
    hasContentsRail: false,
    url,
    shareLinks,
    isBookmarksEnabled: true,
    isNewsletterEnabled: post.newsletterEnabled,
    newsletterHeading: 'Get new posts by email',
    relatedPostItems: [],
    relatedReadingLabel: 'Related reading',
    breadcrumbTrail: DEFAULT_TRAIL,
    breadcrumbAriaLabel: 'Breadcrumb',
    breadcrumbListSchema: buildBreadcrumbListSchema(DEFAULT_TRAIL, SITE_URL),
    blogPostingSchema: buildBlogPostingSchema(post, SITE_URL),
    depthToggleLabels: {
      skim: '30s',
      read: 'Read',
      deep: 'Deep',
      ariaLabel: 'Reading depth',
    },
    asideKindLabels: ASIDE_KIND_LABELS,
    skimPanelLabel: '30-second summary',
    skimPanelReadFullArticleLabel: 'Read the full article',
    ...overrides,
  };
};
