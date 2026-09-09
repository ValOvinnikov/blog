import { BRAND_VARIANT } from '@blog/config';
import { customRenderAsync, screen } from '@web/testing/custom-render';
import { makeSanityImage } from '@web/testing/modules/hero/fixtures';
import { makeHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import { DEFAULT_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';

import { PostRelatedModule } from './post-related-module';

const { getPostRelatedMock, getTenantSanityContextMock, loggerWarnMock } =
  vi.hoisted(() => ({
    getPostRelatedMock: vi.fn(),
    getTenantSanityContextMock: vi.fn(),
    loggerWarnMock: vi.fn(),
  }));

vi.mock('@blog/service', () => ({
  service: {
    modules: {
      postRelated: { v1: { getPostRelated: getPostRelatedMock } },
    },
  },
}));

vi.mock('@web/server/tenant/get-tenant-sanity-context', () => ({
  getTenantSanityContext: getTenantSanityContextMock,
}));

vi.mock('@web/utils/logger/logger', () => ({
  logger: {
    warn: loggerWarnMock,
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
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

const makePost = (overrides: Record<string, unknown> = {}) => ({
  id: 'post-1',
  slug: 'first-post',
  title: 'First post',
  excerpt: 'An excerpt',
  publishedAt: '2026-01-01T00:00:00.000Z',
  topic: { id: 'topic-1', title: 'News', slug: 'news' },
  readingTimeMinutes: 2,
  ...overrides,
});

const setup = customRenderAsync(PostRelatedModule, {
  id: 'post-related-1',
  locale: 'en',
  tenant: 'tenant-1',
  context: { post: { id: 'anchor-post-1' } },
});

describe(`<${PostRelatedModule.name}/>`, () => {
  beforeEach(() => {
    getPostRelatedMock.mockReset();
    getTenantSanityContextMock.mockReset();
    getTenantSanityContextMock.mockResolvedValue(DEFAULT_TENANT_SANITY_CONTEXT);
    loggerWarnMock.mockReset();
  });

  it('calls getPostRelated with the module id, the anchor post id, and the resolved tenant Sanity context', async () => {
    getPostRelatedMock.mockResolvedValue({
      ok: true,
      data: {
        brandVariant: BRAND_VARIANT.PRIMARY,
        headingBlock: makeHeadingBlock({ heading: 'Related reading' }),
        posts: [],
        layout: undefined,
        contentAlignment: undefined,
        showImages: false,
      },
    });

    await setup();

    expect(getPostRelatedMock).toHaveBeenCalledWith(
      'post-related-1',
      'anchor-post-1',
      DEFAULT_TENANT_SANITY_CONTEXT,
    );
  });

  it('renders nothing and warns once, without calling the service, when context.post is absent', async () => {
    const { container } = await setup({ context: undefined });

    expect(container).toBeEmptyDOMElement();
    expect(getPostRelatedMock).not.toHaveBeenCalled();
    expect(loggerWarnMock).toHaveBeenCalledTimes(1);
    expect(loggerWarnMock).toHaveBeenCalledWith(
      'post_related_module.missing_post_context',
      { id: 'post-related-1' },
    );
  });

  it('renders nothing when the fetch fails', async () => {
    getPostRelatedMock.mockResolvedValue({
      ok: false,
      error: new Error('boom'),
    });

    const { container } = await setup();

    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when no posts resolve, never an empty landmark with a dangling aria-labelledby', async () => {
    getPostRelatedMock.mockResolvedValue({
      ok: true,
      data: {
        brandVariant: BRAND_VARIANT.PRIMARY,
        headingBlock: makeHeadingBlock({ heading: 'Related reading' }),
        posts: [],
        layout: undefined,
        contentAlignment: undefined,
        showImages: false,
      },
    });

    const { container } = await setup();

    expect(container).toBeEmptyDOMElement();
    expect(container.querySelector('section')).not.toBeInTheDocument();
  });

  it("resolves the module's own translated fallback heading (never a hardcoded string) when headingBlock.heading is undefined", async () => {
    getPostRelatedMock.mockResolvedValue({
      ok: true,
      data: {
        brandVariant: BRAND_VARIANT.PRIMARY,
        headingBlock: makeHeadingBlock({ heading: undefined }),
        posts: [makePost()],
        layout: undefined,
        contentAlignment: undefined,
        showImages: false,
      },
    });

    await setup();

    const heading = screen.getByRole('heading', {
      level: 2,
      name: 'Related reading',
    });
    expect(heading).toHaveClass('sr-only');
    expect(
      screen.getByRole('region', { name: 'Related reading' }),
    ).toBeInTheDocument();
  });

  it('renders the resolved posts and no pagination nav', async () => {
    getPostRelatedMock.mockResolvedValue({
      ok: true,
      data: {
        brandVariant: BRAND_VARIANT.PRIMARY,
        headingBlock: makeHeadingBlock({ heading: 'Related reading' }),
        posts: [makePost()],
        layout: undefined,
        contentAlignment: undefined,
        showImages: false,
      },
    });

    await setup();

    expect(screen.getByText('First post')).toBeInTheDocument();
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });

  it('renders each post image when showImages is true', async () => {
    const sanityImage = makeSanityImage();
    getPostRelatedMock.mockResolvedValue({
      ok: true,
      data: {
        brandVariant: BRAND_VARIANT.PRIMARY,
        headingBlock: makeHeadingBlock({ heading: 'Related reading' }),
        posts: [makePost({ heroImageSanity: sanityImage })],
        layout: undefined,
        contentAlignment: undefined,
        showImages: true,
      },
    });

    await setup();

    expect(
      screen.getByRole('img', { name: sanityImage.alt }),
    ).toBeInTheDocument();
  });

  it('renders no post images when showImages is false', async () => {
    getPostRelatedMock.mockResolvedValue({
      ok: true,
      data: {
        brandVariant: BRAND_VARIANT.PRIMARY,
        headingBlock: makeHeadingBlock({ heading: 'Related reading' }),
        posts: [makePost({ heroImageSanity: makeSanityImage() })],
        layout: undefined,
        contentAlignment: undefined,
        showImages: false,
      },
    });

    await setup();

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('renders a related post whose excerpt is absent, without throwing', async () => {
    getPostRelatedMock.mockResolvedValue({
      ok: true,
      data: {
        brandVariant: BRAND_VARIANT.PRIMARY,
        headingBlock: makeHeadingBlock({ heading: 'Related reading' }),
        posts: [makePost({ excerpt: undefined })],
        layout: undefined,
        contentAlignment: undefined,
        showImages: false,
      },
    });

    await setup();

    expect(screen.getByText('First post')).toBeInTheDocument();
  });
});
