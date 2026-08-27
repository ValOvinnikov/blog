import { ASIDE_KIND, type ISanityImage, type RichText } from '@blog/config';
import { customRender, screen, within } from '@web/testing/custom-render';
import {
  makeBlogPostPageView,
  mockPostDetail,
} from '@web/testing/pages/blog-post-page/fixtures';
import {
  richTextBlock,
  richTextSpan,
  type TRichTextBlock,
} from '@web/testing/shared/portable-text-renderer/fixtures';

import { BlogPostPageView } from './blog-post-page-view';

const { useSessionMock, getBookmarkStatusMock } = vi.hoisted(() => ({
  useSessionMock: vi.fn(),
  getBookmarkStatusMock: vi.fn(),
}));

// `NewsletterForm` imports `newsletter-actions.ts`, whose module-level
// `resolveNewsletterFromAddress(env.NEWSLETTER_FROM_ADDRESS)` call touches
// the real `@t3-oss/env-nextjs` server guard under jsdom.
vi.mock('@web/server/newsletter/newsletter-actions', () => ({
  subscribeToNewsletterAction: vi.fn(),
}));

// `BookmarkButton` renders nothing for a signed-out session — the default
// here — so the default fixture (`isBookmarksEnabled: true`) never actually
// mounts it unless a test opts in.
vi.mock('next-auth/react', () => ({ useSession: useSessionMock }));

vi.mock('@web/server/bookmarks/bookmark-actions', () => ({
  getBookmarkStatus: getBookmarkStatusMock,
  setBookmarkStatus: vi.fn(),
}));

vi.mock('@web/context/toast-provider', () => ({
  useToast: () => ({
    success: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
    promise: vi.fn(),
    dismiss: vi.fn(),
  }),
}));

vi.mock('@web/components/shared/smart-link', () => ({
  SmartLink: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const setup = customRender(BlogPostPageView, makeBlogPostPageView());

describe(BlogPostPageView, () => {
  beforeEach(() => {
    useSessionMock.mockReset();
    useSessionMock.mockReturnValue({ data: null, status: 'unauthenticated' });
    getBookmarkStatusMock.mockReset();
  });

  afterEach(() => {
    document.cookie =
      'newsletter_subscribed=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
  });

  it('renders the reading time and formatted date in the meta strip', () => {
    setup();

    expect(screen.getByText('4 min read')).toBeVisible();
    expect(screen.getByText('January 15, 2026')).toBeVisible();
  });

  it('links the author name to routes.genericPage(profilePageSlug)', () => {
    setup();

    expect(screen.getByRole('link', { name: 'Jane Doe' })).toHaveAttribute(
      'href',
      '/jane-doe',
    );
  });

  it('renders the author name as plain text when profilePageSlug is absent', () => {
    setup({
      author: { ...mockPostDetail.author, profilePageSlug: undefined },
    });

    expect(
      screen.queryByRole('link', { name: 'Jane Doe' }),
    ).not.toBeInTheDocument();
    expect(screen.getByText('Jane Doe')).toBeVisible();
  });

  it('renders the Home › Topic › Post breadcrumbs trail', () => {
    setup();

    const nav = screen.getByRole('navigation', { name: 'Breadcrumb' });

    const homeLink = within(nav).getByRole('link', { name: 'Home' });
    expect(homeLink).toHaveAttribute('href', '/');

    const topicLink = within(nav).getByRole('link', { name: 'Engineering' });
    expect(topicLink).toHaveAttribute('href', '/topics/engineering');

    const current = within(nav).getByText('Hello World');
    expect(current).toHaveAttribute('aria-current', 'page');
    expect(current.tagName).not.toBe('A');
  });

  it('renders the breadcrumb nav as a sibling before <main>, not nested inside it', () => {
    setup();

    const nav = screen.getByRole('navigation', { name: 'Breadcrumb' });
    const main = screen.getByRole('main');

    expect(main.contains(nav)).toBe(false);
    expect(
      nav.compareDocumentPosition(main) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('renders the topic eyebrow linked to the topic archive page, in addition to the breadcrumbs trail', () => {
    setup();

    const topicLinks = screen.getAllByRole('link', { name: 'Engineering' });
    expect(topicLinks).toHaveLength(2);
    topicLinks.forEach((link) => {
      expect(link).toHaveAttribute('href', '/topics/engineering');
    });
  });

  it('renders exactly one <h1> on the page (the post title), even when the body authors an h1-style block', () => {
    const body: RichText = [
      // The generated `style` union no longer includes 'h1' (Studio can't
      // author one anymore), but the renderer still defends against a
      // legacy/malformed one reaching this component via another write path.
      richTextBlock('h1' as TRichTextBlock['style'], [
        richTextSpan('An authored h1.'),
      ]),
      richTextBlock('normal', [richTextSpan('Body text.')]),
    ];

    setup({ body });

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });

  it('sets fetchpriority="high" on the hero image (confirmed LCP element) when heroImageSanity is present', () => {
    const heroImageSanity: ISanityImage = {
      assetId: 'image-abc123-1600x1200-jpg',
      alt: 'A scenic mountain range',
      hotspot: { x: 0.5, y: 0.5, width: 1, height: 1 },
      crop: undefined,
      lqip: undefined,
      dimensions: { width: 1600, height: 1200, aspectRatio: 1600 / 1200 },
    };

    setup({ heroImageSanity, heroImageAlt: 'A scenic mountain range' });

    expect(
      screen.getByRole('img', { name: 'A scenic mountain range' }),
    ).toHaveAttribute('fetchpriority', 'high');
  });

  it('renders no PostContentsRail (and stays single-column) when hasContentsRail is false', () => {
    setup();

    expect(
      screen.queryByRole('navigation', { name: 'Topics' }),
    ).not.toBeInTheDocument();
  });

  it('renders PostContentsRail once hasContentsRail is true', () => {
    setup({
      hasContentsRail: true,
      headings: [
        { id: 'getting-started', text: 'Getting started', level: 2, key: 'h1' },
        { id: 'configuration', text: 'Configuration', level: 2, key: 'h2' },
        { id: 'deployment', text: 'Deployment', level: 2, key: 'h3' },
      ],
    });

    const rail = screen.getByRole('navigation', { name: 'Topics' });
    expect(
      within(rail).getByRole('link', { name: 'Configuration' }),
    ).toHaveAttribute('href', '#configuration');
  });

  it('renders the post tags as links to routes.tag(slug)', () => {
    setup({
      tags: [
        { id: 'tag-1', title: 'TypeScript', slug: 'typescript' },
        { id: 'tag-2', title: 'React', slug: 'react' },
      ],
    });

    expect(screen.getByRole('link', { name: 'TypeScript' })).toHaveAttribute(
      'href',
      '/tags/typescript',
    );
    expect(screen.getByRole('link', { name: 'React' })).toHaveAttribute(
      'href',
      '/tags/react',
    );
  });

  it('renders no tag chips when the post has no tags', () => {
    setup({ tags: [] });

    expect(
      screen.queryByRole('link', { name: 'TypeScript' }),
    ).not.toBeInTheDocument();
  });

  it('renders the post tags when the post has both a contents rail and tags', () => {
    setup({
      hasContentsRail: true,
      headings: [
        { id: 'getting-started', text: 'Getting started', level: 2, key: 'h1' },
        { id: 'configuration', text: 'Configuration', level: 2, key: 'h2' },
        { id: 'deployment', text: 'Deployment', level: 2, key: 'h3' },
      ],
      tags: [{ id: 'tag-1', title: 'TypeScript', slug: 'typescript' }],
    });

    expect(screen.getByRole('navigation', { name: 'Topics' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'TypeScript' })).toHaveAttribute(
      'href',
      '/tags/typescript',
    );
  });

  it('renders a "Related reading" section when relatedPostItems is non-empty', () => {
    setup({
      relatedPostItems: [
        {
          id: 'related-1',
          href: '/blog/a-related-post',
          title: 'A Related Post',
          excerpt: 'A related excerpt.',
          publishedAt: '2026-01-10T00:00:00.000Z',
          formattedDate: 'January 10, 2026',
          readingTime: '3 min',
          topic: { title: 'Design' },
        },
      ],
    });

    expect(screen.getByText('Related reading')).toBeVisible();
    const link = screen.getByRole('link', { name: 'A Related Post' });
    expect(link).toHaveAttribute('href', '/blog/a-related-post');
  });

  it('omits the "Related reading" section when relatedPostItems is empty', () => {
    setup({ relatedPostItems: [] });

    expect(screen.queryByText('Related reading')).not.toBeInTheDocument();
  });

  it("renders no reading-depth control when the post has neither a skim nor asides (today's behavior)", () => {
    setup();

    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument();
  });

  it('renders the reading-depth control with the 30s option once the post has an approved skim', () => {
    setup({
      skim: {
        takeaways: ['First.', 'Second.', 'Third.'],
        generatedAt: '2026-01-01T00:00:00.000Z',
        model: 'claude-haiku-4-5',
      },
    });

    expect(
      screen.getByRole('radiogroup', { name: 'Reading depth' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: '30s' })).toBeInTheDocument();
    expect(
      screen.queryByRole('radio', { name: 'Deep' }),
    ).not.toBeInTheDocument();
  });

  it('renders the reading-depth control with the Deep option once the post has asides', () => {
    setup({ hasAsides: true });

    expect(screen.getByRole('radio', { name: 'Deep' })).toBeInTheDocument();
    expect(
      screen.queryByRole('radio', { name: '30s' }),
    ).not.toBeInTheDocument();
  });

  it('renders an aside block from the body as a deep-dive aside with its translated kind label', () => {
    const body: RichText = [
      richTextBlock('normal', [richTextSpan('Body text.')]),
      {
        _type: 'aside',
        _key: 'aside-1',
        kind: ASIDE_KIND.WHY_NOT,
        body: [richTextBlock('normal', [richTextSpan('Because Y.')])],
      },
    ];

    setup({ body, hasAsides: true });

    expect(screen.getByRole('note')).toBeInTheDocument();
    expect(screen.getByText('Why not X')).toBeVisible();
    expect(screen.getByText('Because Y.')).toBeVisible();
  });

  it('renders the newsletter signup inside the article, not as a page-level sibling', () => {
    setup();

    const article = screen.getByRole('article');
    expect(
      within(article).getByRole('textbox', { name: 'Email address' }),
    ).toBeVisible();
  });

  it('omits the newsletter signup when isNewsletterEnabled is false', () => {
    setup({ isNewsletterEnabled: false });

    expect(
      screen.queryByRole('textbox', { name: 'Email address' }),
    ).not.toBeInTheDocument();
  });

  it('omits the newsletter signup when no newsletterHeading is given', () => {
    setup({ newsletterHeading: undefined });

    expect(
      screen.queryByRole('textbox', { name: 'Email address' }),
    ).not.toBeInTheDocument();
  });

  it('hides the newsletter signup for an already-subscribed reader (cookie gate)', () => {
    document.cookie = 'newsletter_subscribed=1';

    setup();

    expect(
      screen.queryByRole('textbox', { name: 'Email address' }),
    ).not.toBeInTheDocument();
  });

  it('renders the JSON-LD scripts when schemas are given', () => {
    const { container } = setup();

    const scripts = container.querySelectorAll(
      'script[type="application/ld+json"]',
    );
    expect(
      Array.from(scripts).some((script) =>
        script.textContent?.includes('"@type":"BlogPosting"'),
      ),
    ).toBe(true);
    expect(
      Array.from(scripts).some((script) =>
        script.textContent?.includes('"@type":"BreadcrumbList"'),
      ),
    ).toBe(true);
  });

  it('renders no JSON-LD scripts when no schemas are given', () => {
    const { container } = setup({
      breadcrumbListSchema: undefined,
      blogPostingSchema: undefined,
    });

    expect(
      container.querySelector('script[type="application/ld+json"]'),
    ).not.toBeInTheDocument();
  });
});
