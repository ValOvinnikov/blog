import { BRAND_VARIANT } from '@blog/config';
import { customRenderAsync, screen } from '@web/testing/custom-render';
import { makeSanityImage } from '@web/testing/modules/hero/fixtures';
import { makeHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import { DEFAULT_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';

import { PostFeaturedModule } from './post-featured-module';

const { getPostFeaturedMock, getTenantSanityContextMock } = vi.hoisted(() => ({
  getPostFeaturedMock: vi.fn(),
  getTenantSanityContextMock: vi.fn(),
}));

vi.mock('@blog/service', () => ({
  service: {
    modules: {
      postFeatured: { v1: { getPostFeatured: getPostFeaturedMock } },
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

const setup = customRenderAsync(PostFeaturedModule, {
  id: 'post-featured-1',
  locale: 'en',
  tenant: 'tenant-1',
});

describe(`<${PostFeaturedModule.name}/>`, () => {
  beforeEach(() => {
    getPostFeaturedMock.mockReset();
    getTenantSanityContextMock.mockReset();
    getTenantSanityContextMock.mockResolvedValue(DEFAULT_TENANT_SANITY_CONTEXT);
  });

  it('calls getPostFeatured with the module id and resolved tenant Sanity context', async () => {
    getPostFeaturedMock.mockResolvedValue({
      ok: true,
      data: {
        brandVariant: BRAND_VARIANT.PRIMARY,
        headingBlock: makeHeadingBlock({ heading: 'Featured' }),
        posts: [],
        layout: undefined,
        contentAlignment: undefined,
        showImages: false,
      },
    });

    await setup();

    expect(getPostFeaturedMock).toHaveBeenCalledWith(
      'post-featured-1',
      DEFAULT_TENANT_SANITY_CONTEXT,
    );
  });

  it('renders nothing when the fetch fails', async () => {
    getPostFeaturedMock.mockResolvedValue({
      ok: false,
      error: new Error('boom'),
    });

    const { container } = await setup();

    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when no posts resolve, never an empty landmark with a dangling aria-labelledby', async () => {
    getPostFeaturedMock.mockResolvedValue({
      ok: true,
      data: {
        brandVariant: BRAND_VARIANT.PRIMARY,
        headingBlock: makeHeadingBlock({ heading: 'Featured' }),
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
    getPostFeaturedMock.mockResolvedValue({
      ok: true,
      data: {
        brandVariant: BRAND_VARIANT.PRIMARY,
        headingBlock: makeHeadingBlock(),
        posts: [makePost()],
        layout: undefined,
        contentAlignment: undefined,
        showImages: false,
      },
    });

    await setup();

    const heading = screen.getByRole('heading', { level: 2, name: 'Featured' });
    expect(heading).toHaveClass('sr-only');
    expect(
      screen.getByRole('region', { name: 'Featured' }),
    ).toBeInTheDocument();
  });

  it('renders the first post as a lead card and the rest in a tail grid', async () => {
    getPostFeaturedMock.mockResolvedValue({
      ok: true,
      data: {
        brandVariant: BRAND_VARIANT.PRIMARY,
        headingBlock: makeHeadingBlock({ heading: 'Featured' }),
        posts: [
          makePost({ id: 'post-1', title: 'Lead post' }),
          makePost({ id: 'post-2', title: 'Second post' }),
          makePost({ id: 'post-3', title: 'Third post' }),
        ],
        layout: undefined,
        contentAlignment: undefined,
        showImages: false,
      },
    });

    const { container } = await setup();

    expect(screen.getByText('Lead post')).toBeInTheDocument();
    expect(screen.getByText('Second post')).toBeInTheDocument();
    expect(screen.getByText('Third post')).toBeInTheDocument();
    const tailGrid = container.querySelector(
      '[data-testid="post-featured-module-post-featured-1-tail-grid"]',
    );
    expect(tailGrid).toBeInTheDocument();
    expect(tailGrid).not.toHaveTextContent('Lead post');
  });

  it('renders the lead image sized differently from the tail card images', async () => {
    getPostFeaturedMock.mockResolvedValue({
      ok: true,
      data: {
        brandVariant: BRAND_VARIANT.PRIMARY,
        headingBlock: makeHeadingBlock({ heading: 'Featured' }),
        posts: [
          makePost({
            id: 'post-1',
            title: 'Lead post',
            heroImage: makeSanityImage({ alt: 'Lead image' }),
          }),
          makePost({
            id: 'post-2',
            title: 'Second post',
            heroImage: makeSanityImage({ alt: 'Tail image' }),
          }),
        ],
        layout: undefined,
        contentAlignment: undefined,
        showImages: true,
      },
    });

    await setup();

    const leadImage = screen.getByRole('img', { name: 'Lead image' });
    const tailImage = screen.getByRole('img', { name: 'Tail image' });

    expect(leadImage).toHaveAttribute(
      'sizes',
      '(min-width: 768px) 50vw, 100vw',
    );
    expect(leadImage).toHaveAttribute('width', '960');
    expect(leadImage).toHaveAttribute('height', '540');

    expect(tailImage).toHaveAttribute(
      'sizes',
      '(min-width: 768px) 33vw, (min-width: 640px) 50vw, 100vw',
    );
    expect(tailImage).toHaveAttribute('width', '640');
    expect(tailImage).toHaveAttribute('height', '360');
  });

  it('renders no post images when showImages is false', async () => {
    getPostFeaturedMock.mockResolvedValue({
      ok: true,
      data: {
        brandVariant: BRAND_VARIANT.PRIMARY,
        headingBlock: makeHeadingBlock({ heading: 'Featured' }),
        posts: [
          makePost({
            id: 'post-1',
            heroImage: makeSanityImage(),
          }),
        ],
        layout: undefined,
        contentAlignment: undefined,
        showImages: false,
      },
    });

    await setup();

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});
