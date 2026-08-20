import { BRAND_VARIANT } from '@blog/config';
import { customRenderAsync, screen } from '@web/testing/custom-render';

import { PostListModule } from './post-list-module';

const { getPostListMock } = vi.hoisted(() => ({
  getPostListMock: vi.fn(),
}));

vi.mock('@blog/service', () => ({
  service: {
    modules: {
      postList: { v1: { getPostList: getPostListMock } },
    },
  },
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

const setup = customRenderAsync(PostListModule, {
  id: 'post-list-1',
  locale: 'en',
});

describe(PostListModule, () => {
  beforeEach(() => {
    getPostListMock.mockReset();
  });

  it('renders nothing when the fetch fails', async () => {
    getPostListMock.mockResolvedValue({ ok: false, error: new Error('boom') });

    const { container } = await setup();

    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when no posts resolve, never an empty landmark with a dangling aria-labelledby', async () => {
    getPostListMock.mockResolvedValue({
      ok: true,
      data: {
        brandVariant: BRAND_VARIANT.PRIMARY,
        sectionHeader: {
          heading: 'Latest posts',
          supportingText: undefined,
          align: undefined,
        },
        posts: [],
        layout: undefined,
      },
    });

    const { container } = await setup();

    expect(container).toBeEmptyDOMElement();
    expect(container.querySelector('section')).not.toBeInTheDocument();
  });

  it("resolves the module's own translated fallback heading (never a hardcoded string) when sectionHeader.heading is undefined", async () => {
    getPostListMock.mockResolvedValue({
      ok: true,
      data: {
        brandVariant: BRAND_VARIANT.PRIMARY,
        sectionHeader: {
          heading: undefined,
          supportingText: undefined,
          align: undefined,
        },
        posts: [
          {
            id: 'post-1',
            slug: 'first-post',
            title: 'First post',
            excerpt: 'An excerpt',
            publishedAt: '2026-01-01T00:00:00.000Z',
            topic: { id: 'cat-1', title: 'News', slug: 'news' },
            readingTimeMinutes: 2,
          },
        ],
        layout: undefined,
      },
    });

    await setup();

    const heading = screen.getByRole('heading', {
      level: 2,
      name: 'Latest posts',
    });
    expect(heading).toHaveClass('sr-only');
    expect(
      screen.getByRole('region', { name: 'Latest posts' }),
    ).toBeInTheDocument();
  });
});
