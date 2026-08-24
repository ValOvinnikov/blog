import {
  ASIDE_KIND,
  ICONS,
  type ISanityImage,
  type RichText,
  Size,
} from '@blog/config';
import { Icon } from '@blog/ui/atoms/icon';
import userEvent from '@testing-library/user-event';
import {
  customRenderAsync,
  renderElement,
  screen,
  within,
} from '@web/testing/custom-render';
import { mockPostDetail } from '@web/testing/pages/blog-post-page/fixtures';
import {
  richTextBlock,
  richTextSpan,
  type TRichTextBlock,
} from '@web/testing/shared/portable-text-renderer/fixtures';
import { notFound } from 'next/navigation';

import { BlogPostPage } from './blog-post-page';

const {
  getPostMock,
  useSessionMock,
  getBookmarkStatusMock,
  getNewsletterSettingsMock,
  isCapabilityEnabledMock,
} = vi.hoisted(() => ({
  getPostMock: vi.fn(),
  useSessionMock: vi.fn(),
  getBookmarkStatusMock: vi.fn(),
  getNewsletterSettingsMock: vi.fn(),
  isCapabilityEnabledMock: vi.fn(),
}));

vi.mock('@blog/service', () => ({
  getSanityImageBaseUrl: () =>
    'https://cdn.sanity.io/images/test-project/test-dataset/',
  service: {
    pages: {
      post: { v1: { getPost: getPostMock } },
    },
    global: {
      newsletterSettings: {
        v1: { getNewsletterSettings: getNewsletterSettingsMock },
      },
    },
  },
}));

// `NewsletterForm` imports `newsletter-actions.ts`, whose module-level
// `resolveNewsletterFromAddress(env.NEWSLETTER_FROM_ADDRESS)` call touches
// the real `@t3-oss/env-nextjs` server guard under jsdom — mocked out the
// same way `newsletter-form.test.tsx` does; this suite doesn't exercise the
// submit flow itself.
vi.mock('@web/server/newsletter/newsletter-actions', () => ({
  subscribeToNewsletterAction: vi.fn(),
}));

// `BookmarkButton` (article header meta strip) renders nothing for a
// signed-out session — the default here — so every existing assertion below
// (none of which concerns bookmarking) is unaffected; the "authenticated"
// describe block further down opts in per-test.
vi.mock('next-auth/react', () => ({ useSession: useSessionMock }));

vi.mock('@web/server/bookmarks/bookmark-actions', () => ({
  getBookmarkStatus: getBookmarkStatusMock,
  setBookmarkStatus: vi.fn(),
}));

vi.mock('@web/server/settings-features/is-capability-enabled', () => ({
  isCapabilityEnabled: isCapabilityEnabledMock,
}));

// `BookmarkButton` calls `useToast()` unconditionally (it's a hook), so any
// composition that renders it — signed in or not — needs this mocked; no
// assertions here exercise the toast calls themselves (see
// bookmark-button.test.tsx for those).
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

const setup = customRenderAsync(BlogPostPage, {
  slug: 'hello-world',
});

describe(`<${BlogPostPage.name}/>`, () => {
  beforeEach(() => {
    getPostMock.mockReset();
    useSessionMock.mockReset();
    useSessionMock.mockReturnValue({ data: null, status: 'unauthenticated' });
    getBookmarkStatusMock.mockReset();
    getNewsletterSettingsMock.mockReset();
    getNewsletterSettingsMock.mockResolvedValue({
      ok: true,
      data: { heading: 'Get new posts by email', description: undefined },
    });
    isCapabilityEnabledMock.mockReset();
    isCapabilityEnabledMock.mockResolvedValue(true);
  });

  afterEach(() => {
    // jsdom's `document.cookie` jar persists across `it`s in the same file —
    // expire anything a test set so it never leaks into the next one.
    document.cookie =
      'newsletter_subscribed=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
  });

  it('calls notFound() when no page_post matches the slug', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    getPostMock.mockResolvedValue({
      ok: false,
      error: new Error('No page_post found for slug "missing"'),
    });

    await expect(setup({ slug: 'missing' })).rejects.toThrow('NEXT_NOT_FOUND');

    expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);
    errorSpy.mockRestore();
  });

  it('calls notFound() when the fetch fails', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    getPostMock.mockResolvedValue({ ok: false, error: new Error('boom') });

    await expect(setup()).rejects.toThrow('NEXT_NOT_FOUND');

    expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);
    errorSpy.mockRestore();
  });

  it('renders the post title, meta, body, and share links', async () => {
    getPostMock.mockResolvedValue({ ok: true, data: mockPostDetail });

    await setup();

    expect(
      screen.getByRole('heading', { level: 1, name: 'Hello World' }),
    ).toBeVisible();
    expect(
      screen.getByText('A sufficiently long excerpt for the card.'),
    ).toBeVisible();
    expect(screen.getByText('Body text.')).toBeVisible();
    expect(screen.getByText('Jane Doe')).toBeVisible();

    await userEvent.click(screen.getByRole('button', { name: /Share/ }));
    const xShareLink = screen.getByRole('menuitem', { name: /Share on X/ });
    expect(xShareLink).toBeVisible();
    expect(xShareLink.querySelector('svg')).toBeInTheDocument();
    expect(
      screen.getByRole('menuitem', { name: /Share on LinkedIn/ }),
    ).toBeVisible();
  });

  it('renders no bookmark toggle in the meta strip when signed out', async () => {
    getPostMock.mockResolvedValue({ ok: true, data: mockPostDetail });

    await setup();

    expect(
      screen.queryByRole('button', { name: 'Save post' }),
    ).not.toBeInTheDocument();
  });

  it("renders BookmarkButton beside the share widget, reflecting the post's saved state, when signed in", async () => {
    useSessionMock.mockReturnValue({
      data: { user: { id: 'user-1' } },
      status: 'authenticated',
    });
    getBookmarkStatusMock.mockResolvedValue(true);
    getPostMock.mockResolvedValue({ ok: true, data: mockPostDetail });

    await setup();

    const bookmarkButton = await screen.findByRole('button', {
      name: 'Remove bookmark',
    });
    expect(bookmarkButton).toHaveAttribute('aria-pressed', 'true');
    expect(getBookmarkStatusMock).toHaveBeenCalledWith(mockPostDetail.id);
  });

  it('renders no BookmarkButton at all, signed in or not, when the BOOKMARKS capability is not entitled/enabled', async () => {
    isCapabilityEnabledMock.mockResolvedValue(false);
    useSessionMock.mockReturnValue({
      data: { user: { id: 'user-1' } },
      status: 'authenticated',
    });
    getBookmarkStatusMock.mockResolvedValue(true);
    getPostMock.mockResolvedValue({ ok: true, data: mockPostDetail });

    await setup();

    expect(
      screen.queryByRole('button', { name: 'Save post' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Remove bookmark' }),
    ).not.toBeInTheDocument();
    expect(getBookmarkStatusMock).not.toHaveBeenCalled();
  });

  it('renders the X icon on the X share link and the LinkedIn icon on the LinkedIn share link, not the generic external-link glyph', async () => {
    getPostMock.mockResolvedValue({ ok: true, data: mockPostDetail });

    await setup();
    await userEvent.click(screen.getByRole('button', { name: /Share/ }));

    const xSvg = screen
      .getByRole('menuitem', { name: /Share on X/ })
      .querySelector('svg');
    const linkedInSvg = screen
      .getByRole('menuitem', { name: /Share on LinkedIn/ })
      .querySelector('svg');
    const { container: fallbackContainer } = renderElement(
      <Icon name={ICONS.EXTERNAL_LINK} size={Size.SM} />,
    );
    const fallbackSvg = fallbackContainer.querySelector('svg');

    expect(xSvg?.outerHTML).not.toBe(linkedInSvg?.outerHTML);
    expect(xSvg?.outerHTML).not.toBe(fallbackSvg?.outerHTML);
    expect(linkedInSvg?.outerHTML).not.toBe(fallbackSvg?.outerHTML);
  });

  it('renders the reading time in the post meta strip', async () => {
    getPostMock.mockResolvedValue({ ok: true, data: mockPostDetail });

    await setup();

    expect(screen.getByText('4 min read')).toBeVisible();
  });

  it('renders the published date formatted via next-intl (year/month/day)', async () => {
    getPostMock.mockResolvedValue({ ok: true, data: mockPostDetail });

    await setup();

    expect(screen.getByText('January 15, 2026')).toBeVisible();
  });

  it('links the author name to routes.genericPage(profilePageSlug)', async () => {
    getPostMock.mockResolvedValue({ ok: true, data: mockPostDetail });

    await setup();

    expect(screen.getByRole('link', { name: 'Jane Doe' })).toHaveAttribute(
      'href',
      '/jane-doe',
    );
  });

  it('renders the author name as plain text when profilePageSlug is absent', async () => {
    getPostMock.mockResolvedValue({
      ok: true,
      data: {
        ...mockPostDetail,
        author: { ...mockPostDetail.author, profilePageSlug: undefined },
      },
    });

    await setup();

    expect(
      screen.queryByRole('link', { name: 'Jane Doe' }),
    ).not.toBeInTheDocument();
    expect(screen.getByText('Jane Doe')).toBeVisible();
  });

  it('renders the Home › Topic › Post breadcrumbs trail', async () => {
    getPostMock.mockResolvedValue({ ok: true, data: mockPostDetail });

    await setup();

    const nav = screen.getByRole('navigation', { name: 'Breadcrumb' });

    const homeLink = within(nav).getByRole('link', { name: 'Home' });
    expect(homeLink).toHaveAttribute('href', '/');

    const topicLink = within(nav).getByRole('link', { name: 'Engineering' });
    expect(topicLink).toHaveAttribute('href', '/topics/engineering');

    const current = within(nav).getByText('Hello World');
    expect(current).toHaveAttribute('aria-current', 'page');
    expect(current.tagName).not.toBe('A');
  });

  it('renders the breadcrumb nav as a sibling before <main>, not nested inside it', async () => {
    getPostMock.mockResolvedValue({ ok: true, data: mockPostDetail });

    await setup();

    const nav = screen.getByRole('navigation', { name: 'Breadcrumb' });
    const main = screen.getByRole('main');

    expect(main.contains(nav)).toBe(false);
    expect(
      nav.compareDocumentPosition(main) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('renders the topic eyebrow linked to the topic archive page, in addition to the breadcrumbs trail', async () => {
    getPostMock.mockResolvedValue({ ok: true, data: mockPostDetail });

    await setup();

    const topicLinks = screen.getAllByRole('link', { name: 'Engineering' });
    expect(topicLinks).toHaveLength(2);
    topicLinks.forEach((link) => {
      expect(link).toHaveAttribute('href', '/topics/engineering');
    });
  });

  it('renders exactly one <h1> on the page (the post title), even when the body authors an h1-style block', async () => {
    const body: RichText = [
      // The generated `style` union no longer includes 'h1' (Studio can't
      // author one anymore), but the renderer still defends against a
      // legacy/malformed one reaching this component via another write path.
      richTextBlock('h1' as TRichTextBlock['style'], [
        richTextSpan('An authored h1.'),
      ]),
      ...mockPostDetail.body,
    ];
    getPostMock.mockResolvedValue({
      ok: true,
      data: { ...mockPostDetail, body },
    });

    await setup();

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });

  it('sets fetchpriority="high" on the hero image (confirmed LCP element) when heroImageSanity is present', async () => {
    const heroImageSanity: ISanityImage = {
      assetId: 'image-abc123-1600x1200-jpg',
      alt: 'A scenic mountain range',
      hotspot: { x: 0.5, y: 0.5, width: 1, height: 1 },
      crop: undefined,
      lqip: undefined,
      dimensions: { width: 1600, height: 1200, aspectRatio: 1600 / 1200 },
    };
    getPostMock.mockResolvedValue({
      ok: true,
      data: { ...mockPostDetail, heroImageSanity },
    });

    await setup();

    expect(
      screen.getByRole('img', { name: mockPostDetail.heroImageAlt }),
    ).toHaveAttribute('fetchpriority', 'high');
  });

  it('resolves baseUrl via getSanityImageBaseUrl and forwards it into the rendered hero image src', async () => {
    const heroImageSanity: ISanityImage = {
      assetId: 'image-abc123-1600x1200-jpg',
      alt: 'A scenic mountain range',
      hotspot: { x: 0.5, y: 0.5, width: 1, height: 1 },
      crop: undefined,
      lqip: undefined,
      dimensions: { width: 1600, height: 1200, aspectRatio: 1600 / 1200 },
    };
    getPostMock.mockResolvedValue({
      ok: true,
      data: { ...mockPostDetail, heroImageSanity },
    });

    await setup();

    const img = screen.getByRole('img', { name: mockPostDetail.heroImageAlt });
    expect(img.getAttribute('src')).toContain('test-project/test-dataset');
  });

  it('renders no PostContentsRail (and stays single-column) when the body has fewer than 3 H2 headings', async () => {
    getPostMock.mockResolvedValue({ ok: true, data: mockPostDetail });

    await setup();

    expect(
      screen.queryByRole('navigation', { name: 'Topics' }),
    ).not.toBeInTheDocument();
  });

  it('renders PostContentsRail once the body has 3+ H2 headings', async () => {
    const body: RichText = [
      richTextBlock('h2', [richTextSpan('Getting started')]),
      richTextBlock('normal', [richTextSpan('Intro.')]),
      richTextBlock('h2', [richTextSpan('Configuration')]),
      richTextBlock('h2', [richTextSpan('Deployment')]),
    ];
    getPostMock.mockResolvedValue({
      ok: true,
      data: { ...mockPostDetail, body },
    });

    await setup();

    const rail = screen.getByRole('navigation', { name: 'Topics' });
    expect(
      within(rail).getByRole('link', { name: 'Configuration' }),
    ).toHaveAttribute('href', '#configuration');
  });

  it('renders the post tags when the post has both a contents rail and tags', async () => {
    const body: RichText = [
      richTextBlock('h2', [richTextSpan('Getting started')]),
      richTextBlock('normal', [richTextSpan('Intro.')]),
      richTextBlock('h2', [richTextSpan('Configuration')]),
      richTextBlock('h2', [richTextSpan('Deployment')]),
    ];
    getPostMock.mockResolvedValue({
      ok: true,
      data: {
        ...mockPostDetail,
        body,
        tags: [{ id: 'tag-1', title: 'TypeScript', slug: 'typescript' }],
      },
    });

    await setup();

    expect(screen.getByRole('navigation', { name: 'Topics' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'TypeScript' })).toHaveAttribute(
      'href',
      '/tags/typescript',
    );
  });

  it('renders the JSON-LD BlogPosting schema script', async () => {
    getPostMock.mockResolvedValue({ ok: true, data: mockPostDetail });

    const { container } = await setup();

    const script = container.querySelector(
      'script[type="application/ld+json"]',
    );
    expect(script).not.toBeNull();
    expect(script?.textContent).toContain('"@type":"BlogPosting"');
  });

  it('renders the JSON-LD BreadcrumbList schema script', async () => {
    getPostMock.mockResolvedValue({ ok: true, data: mockPostDetail });

    const { container } = await setup();

    const scripts = container.querySelectorAll(
      'script[type="application/ld+json"]',
    );
    const breadcrumbScript = Array.from(scripts).find((script) =>
      script.textContent?.includes('"@type":"BreadcrumbList"'),
    );
    expect(breadcrumbScript).toBeDefined();
    expect(breadcrumbScript?.textContent).toContain(
      '"item":"https://example.com/topics/engineering"',
    );
  });

  it('renders the post tags as links to routes.tag(slug)', async () => {
    getPostMock.mockResolvedValue({
      ok: true,
      data: {
        ...mockPostDetail,
        tags: [
          { id: 'tag-1', title: 'TypeScript', slug: 'typescript' },
          { id: 'tag-2', title: 'React', slug: 'react' },
        ],
      },
    });

    await setup();

    expect(screen.getByRole('link', { name: 'TypeScript' })).toHaveAttribute(
      'href',
      '/tags/typescript',
    );
    expect(screen.getByRole('link', { name: 'React' })).toHaveAttribute(
      'href',
      '/tags/react',
    );
  });

  it('renders no tag chips when the post has no tags', async () => {
    getPostMock.mockResolvedValue({
      ok: true,
      data: { ...mockPostDetail, tags: [] },
    });

    await setup();

    expect(
      screen.queryByRole('link', { name: 'TypeScript' }),
    ).not.toBeInTheDocument();
  });

  it('renders a "Related reading" section when relatedPosts is non-empty, even when a related post is in a different topic (tag-matched, not topic-scoped)', async () => {
    getPostMock.mockResolvedValue({
      ok: true,
      data: {
        ...mockPostDetail,
        relatedPosts: [
          {
            id: 'related-1',
            title: 'A Related Post',
            slug: 'a-related-post',
            excerpt: 'A related excerpt.',
            publishedAt: '2026-01-10T00:00:00.000Z',
            heroImageUrl: undefined,
            heroImageAlt: undefined,
            heroImageSanity: undefined,
            featured: false,
            author: {
              id: 'author-1',
              name: 'Jane Doe',
              profilePageSlug: 'jane-doe',
              imageUrl: undefined,
            },
            topic: {
              id: 'topic-2',
              title: 'Design',
              slug: 'design',
            },
          },
        ],
      },
    });

    await setup();

    expect(screen.getByText('Related reading')).toBeVisible();
    const link = screen.getByRole('link', { name: 'A Related Post' });
    expect(link).toHaveAttribute('href', '/blog/a-related-post');
  });

  it('omits the "Related reading" section when relatedPosts is empty', async () => {
    getPostMock.mockResolvedValue({
      ok: true,
      data: { ...mockPostDetail, relatedPosts: [] },
    });

    await setup();

    expect(screen.queryByText('Related reading')).not.toBeInTheDocument();
  });

  it("renders no reading-depth control when the post has neither a skim nor asides (today's behavior)", async () => {
    getPostMock.mockResolvedValue({ ok: true, data: mockPostDetail });

    await setup();

    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument();
  });

  it('renders the reading-depth control with the 30s option once the post has an approved skim', async () => {
    getPostMock.mockResolvedValue({
      ok: true,
      data: {
        ...mockPostDetail,
        skim: {
          takeaways: ['First.', 'Second.', 'Third.'],
          generatedAt: '2026-01-01T00:00:00.000Z',
          model: 'claude-haiku-4-5',
        },
      },
    });

    await setup();

    expect(
      screen.getByRole('radiogroup', { name: 'Reading depth' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: '30s' })).toBeInTheDocument();
    expect(
      screen.queryByRole('radio', { name: 'Deep' }),
    ).not.toBeInTheDocument();
  });

  it('renders the reading-depth control with the Deep option once the post has asides', async () => {
    getPostMock.mockResolvedValue({
      ok: true,
      data: { ...mockPostDetail, hasAsides: true },
    });

    await setup();

    expect(screen.getByRole('radio', { name: 'Deep' })).toBeInTheDocument();
    expect(
      screen.queryByRole('radio', { name: '30s' }),
    ).not.toBeInTheDocument();
  });

  it('renders an aside block from the body as a deep-dive aside with its translated kind label', async () => {
    const body: RichText = [
      ...mockPostDetail.body,
      {
        _type: 'aside',
        _key: 'aside-1',
        kind: ASIDE_KIND.WHY_NOT,
        body: [richTextBlock('normal', [richTextSpan('Because Y.')])],
      },
    ];
    getPostMock.mockResolvedValue({
      ok: true,
      data: { ...mockPostDetail, body, hasAsides: true },
    });

    await setup();

    expect(screen.getByRole('note')).toBeInTheDocument();
    expect(screen.getByText('Why not X')).toBeVisible();
    expect(screen.getByText('Because Y.')).toBeVisible();
  });

  describe('newsletter signup', () => {
    it('renders the compact newsletter signup, sourced from the newsletter settings singleton, when newsletterEnabled is true', async () => {
      getPostMock.mockResolvedValue({
        ok: true,
        data: { ...mockPostDetail, newsletterEnabled: true },
      });
      getNewsletterSettingsMock.mockResolvedValue({
        ok: true,
        data: { heading: 'Get new posts by email', description: undefined },
      });

      await setup();

      expect(screen.getByText('Get new posts by email')).toBeVisible();
      expect(
        screen.getByRole('textbox', { name: 'Email address' }),
      ).toBeVisible();
    });

    it('renders the newsletter signup inside the article, not as a page-level sibling (#1307)', async () => {
      getPostMock.mockResolvedValue({
        ok: true,
        data: { ...mockPostDetail, newsletterEnabled: true },
      });

      await setup();

      const article = screen.getByRole('article');
      expect(
        within(article).getByRole('textbox', { name: 'Email address' }),
      ).toBeVisible();
    });

    it('omits the newsletter signup when the post opts out (newsletterEnabled: false)', async () => {
      getPostMock.mockResolvedValue({
        ok: true,
        data: { ...mockPostDetail, newsletterEnabled: false },
      });

      await setup();

      expect(
        screen.queryByRole('textbox', { name: 'Email address' }),
      ).not.toBeInTheDocument();
    });

    it('omits the newsletter signup when the settings fetch fails, even though newsletterEnabled is true', async () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      getPostMock.mockResolvedValue({
        ok: true,
        data: { ...mockPostDetail, newsletterEnabled: true },
      });
      getNewsletterSettingsMock.mockResolvedValue({
        ok: false,
        error: new Error('boom'),
      });

      await setup();

      expect(
        screen.queryByRole('textbox', { name: 'Email address' }),
      ).not.toBeInTheDocument();
      expect(errorSpy).toHaveBeenCalled();
      errorSpy.mockRestore();
    });

    it('hides the newsletter signup for an already-subscribed reader (cookie gate)', async () => {
      document.cookie = 'newsletter_subscribed=1';
      getPostMock.mockResolvedValue({
        ok: true,
        data: { ...mockPostDetail, newsletterEnabled: true },
      });

      await setup();

      expect(
        screen.queryByRole('textbox', { name: 'Email address' }),
      ).not.toBeInTheDocument();
    });
  });
});
