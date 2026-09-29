import { BRAND_VARIANT } from '@blog/config';
import { getTenantSanityContext } from '@web/server/tenant/get-tenant-sanity-context';
import { customRenderAsync, screen } from '@web/testing/custom-render';
import { makeSanityImage } from '@web/testing/modules/hero/fixtures';
import { makeHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import { DEFAULT_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';
import { logger } from '@web/utils/logger/logger';

import { PostRelatedModule } from './post-related-module';

const { getPostRelatedMock } = vi.hoisted(() => ({
  getPostRelatedMock: vi.fn(),
}));

vi.mock('@web/i18n/navigation');

vi.mock('@blog/service', () => ({
  service: {
    modules: {
      postRelated: { v1: { getPostRelated: getPostRelatedMock } },
    },
  },
}));

vi.mock('@web/server/tenant/get-tenant-sanity-context');

vi.mock('@web/utils/logger/logger');

const getTenantSanityContextMock = vi.mocked(getTenantSanityContext);
const loggerWarnMock = vi.mocked(logger.warn);

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

  it('calls getPostRelated with the module id, anchor post id and tenant context', async () => {
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

  it('renders nothing and warns once, without calling the service, with no post', async () => {
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

  it('renders nothing when no posts resolve, never an empty labelled landmark', async () => {
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

    expect(screen.getByText('First post')).toBeVisible();
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });

  it('renders each post image when showImages is true', async () => {
    const sanityImage = makeSanityImage();
    getPostRelatedMock.mockResolvedValue({
      ok: true,
      data: {
        brandVariant: BRAND_VARIANT.PRIMARY,
        headingBlock: makeHeadingBlock({ heading: 'Related reading' }),
        posts: [makePost({ heroImage: sanityImage })],
        layout: undefined,
        contentAlignment: undefined,
        showImages: true,
      },
    });

    await setup();

    expect(screen.getByRole('img', { name: sanityImage.alt })).toBeVisible();
  });

  it('renders no post images when showImages is false', async () => {
    getPostRelatedMock.mockResolvedValue({
      ok: true,
      data: {
        brandVariant: BRAND_VARIANT.PRIMARY,
        headingBlock: makeHeadingBlock({ heading: 'Related reading' }),
        posts: [makePost({ heroImage: makeSanityImage() })],
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

    expect(screen.getByText('First post')).toBeVisible();
  });
});
