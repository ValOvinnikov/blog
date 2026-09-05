import { BRAND_VARIANT } from '@blog/config';
import { customRenderAsync, screen } from '@web/testing/custom-render';
import { DEFAULT_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';

import { PostLatestModule } from './post-latest-module';

const { getPostLatestMock, getTenantSanityContextMock } = vi.hoisted(() => ({
  getPostLatestMock: vi.fn(),
  getTenantSanityContextMock: vi.fn(),
}));

vi.mock('@blog/service', () => ({
  service: {
    modules: {
      postLatest: { v1: { getPostLatest: getPostLatestMock } },
    },
  },
}));

vi.mock('@web/server/tenant/get-tenant-sanity-context', () => ({
  getTenantSanityContext: getTenantSanityContextMock,
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

const setup = customRenderAsync(PostLatestModule, {
  id: 'post-latest-1',
  locale: 'en',
  tenant: 'tenant-1',
});

describe(PostLatestModule, () => {
  beforeEach(() => {
    getPostLatestMock.mockReset();
    getTenantSanityContextMock.mockReset();
    getTenantSanityContextMock.mockResolvedValue(DEFAULT_TENANT_SANITY_CONTEXT);
  });

  it('calls getPostLatest with the module id and resolved tenant Sanity context', async () => {
    getPostLatestMock.mockResolvedValue({
      ok: true,
      data: {
        brandVariant: BRAND_VARIANT.PRIMARY,
        sectionHeader: {
          heading: 'Latest posts',
          supportingText: undefined,
        },
        posts: [],
        layout: undefined,
        contentAlignment: undefined,
      },
    });

    await setup();

    expect(getPostLatestMock).toHaveBeenCalledWith(
      'post-latest-1',
      DEFAULT_TENANT_SANITY_CONTEXT,
    );
  });

  it('forwards the resolved tenant Sanity context to getPostLatest', async () => {
    const tenant = {
      projectId: 'tenant-project',
      dataset: 'production',
      token: 'tenant-token',
    };
    getTenantSanityContextMock.mockResolvedValue(tenant);
    getPostLatestMock.mockResolvedValue({
      ok: true,
      data: {
        brandVariant: BRAND_VARIANT.PRIMARY,
        sectionHeader: {
          heading: 'Latest posts',
          supportingText: undefined,
        },
        posts: [],
        layout: undefined,
        contentAlignment: undefined,
      },
    });

    await setup();

    expect(getPostLatestMock).toHaveBeenCalledWith('post-latest-1', tenant);
    expect(getTenantSanityContextMock).toHaveBeenCalledWith('tenant-1');
  });

  it('renders nothing when the fetch fails', async () => {
    getPostLatestMock.mockResolvedValue({
      ok: false,
      error: new Error('boom'),
    });

    const { container } = await setup();

    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when no posts resolve, never an empty landmark with a dangling aria-labelledby', async () => {
    getPostLatestMock.mockResolvedValue({
      ok: true,
      data: {
        brandVariant: BRAND_VARIANT.PRIMARY,
        sectionHeader: {
          heading: 'Latest posts',
          supportingText: undefined,
        },
        posts: [],
        layout: undefined,
        contentAlignment: undefined,
      },
    });

    const { container } = await setup();

    expect(container).toBeEmptyDOMElement();
    expect(container.querySelector('section')).not.toBeInTheDocument();
  });

  it("resolves the module's own translated fallback heading (never a hardcoded string) when sectionHeader.heading is undefined", async () => {
    getPostLatestMock.mockResolvedValue({
      ok: true,
      data: {
        brandVariant: BRAND_VARIANT.PRIMARY,
        sectionHeader: {
          heading: undefined,
          supportingText: undefined,
        },
        posts: [
          {
            id: 'post-1',
            slug: 'first-post',
            title: 'First post',
            excerpt: 'An excerpt',
            publishedAt: '2026-01-01T00:00:00.000Z',
            topic: { id: 'topic-1', title: 'News', slug: 'news' },
            readingTimeMinutes: 2,
          },
        ],
        layout: undefined,
        contentAlignment: undefined,
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

  it('renders the resolved posts and no pagination nav', async () => {
    getPostLatestMock.mockResolvedValue({
      ok: true,
      data: {
        brandVariant: BRAND_VARIANT.PRIMARY,
        sectionHeader: {
          heading: 'Latest posts',
          supportingText: undefined,
        },
        posts: [
          {
            id: 'post-1',
            slug: 'first-post',
            title: 'First post',
            excerpt: 'An excerpt',
            publishedAt: '2026-01-01T00:00:00.000Z',
            topic: { id: 'topic-1', title: 'News', slug: 'news' },
            readingTimeMinutes: 2,
          },
        ],
        layout: undefined,
        contentAlignment: undefined,
      },
    });

    await setup();

    expect(screen.getByText('First post')).toBeInTheDocument();
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });
});
