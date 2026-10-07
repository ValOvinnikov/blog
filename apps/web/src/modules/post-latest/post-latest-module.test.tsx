import { BRAND_VARIANT } from '@blog/config';
import { getRequestContext } from '@web/server/request-context/request-context';
import { customRenderAsync, screen } from '@web/testing/custom-render';
import { makeSanityImage } from '@web/testing/modules/hero/fixtures';
import { makeHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import {
  DEFAULT_REQUEST_CONTEXT,
  DEFAULT_TENANT_SANITY_CONTEXT,
} from '@web/testing/shared/tenant/fixtures';

import { PostLatestModule } from './post-latest-module';

const { getPostLatestMock } = vi.hoisted(() => ({
  getPostLatestMock: vi.fn(),
}));

vi.mock('@web/i18n/navigation');

vi.mock('@blog/service', () => ({
  service: {
    modules: {
      postLatest: { v1: { getPostLatest: getPostLatestMock } },
    },
  },
}));

vi.mock('@web/server/request-context/request-context');

const getRequestContextMock = vi.mocked(getRequestContext);

const setup = customRenderAsync(PostLatestModule, {
  id: 'post-latest-1',
});

describe(`<${PostLatestModule.name}/>`, () => {
  beforeEach(() => {
    getPostLatestMock.mockReset();
    getRequestContextMock.mockReset();
    getRequestContextMock.mockResolvedValue(DEFAULT_REQUEST_CONTEXT);
    getPostLatestMock.mockResolvedValue({
      ok: true,
      data: {
        brandVariant: BRAND_VARIANT.PRIMARY,
        headingBlock: makeHeadingBlock(),
        posts: [],
        layout: undefined,
        contentAlignment: undefined,
      },
    });
  });

  it('calls getPostLatest with the module id and resolved tenant Sanity context', async () => {
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
    getRequestContextMock.mockResolvedValue({
      ...DEFAULT_REQUEST_CONTEXT,
      sanityContext: tenant,
    });
    await setup();

    expect(getPostLatestMock).toHaveBeenCalledWith('post-latest-1', tenant);
  });

  it('renders nothing when the fetch fails', async () => {
    getPostLatestMock.mockResolvedValue({
      ok: false,
      error: new Error('boom'),
    });

    const { container } = await setup();

    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when no posts resolve, never an empty labelled landmark', async () => {
    const { container } = await setup();

    expect(container).toBeEmptyDOMElement();
  });

  it('renders the resolved posts and no pagination nav', async () => {
    getPostLatestMock.mockResolvedValue({
      ok: true,
      data: {
        brandVariant: BRAND_VARIANT.PRIMARY,
        headingBlock: makeHeadingBlock(),
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

    expect(screen.getByText('First post')).toBeVisible();
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });

  it('renders each post image when showImages is true', async () => {
    const sanityImage = makeSanityImage();
    getPostLatestMock.mockResolvedValue({
      ok: true,
      data: {
        brandVariant: BRAND_VARIANT.PRIMARY,
        headingBlock: makeHeadingBlock(),
        posts: [
          {
            id: 'post-1',
            slug: 'first-post',
            title: 'First post',
            excerpt: 'An excerpt',
            publishedAt: '2026-01-01T00:00:00.000Z',
            topic: { id: 'topic-1', title: 'News', slug: 'news' },
            readingTimeMinutes: 2,
            heroImage: sanityImage,
          },
        ],
        layout: undefined,
        contentAlignment: undefined,
        showImages: true,
      },
    });

    await setup();

    expect(screen.getByRole('img', { name: sanityImage.alt })).toBeVisible();
  });

  it('renders no post images when showImages is false', async () => {
    getPostLatestMock.mockResolvedValue({
      ok: true,
      data: {
        brandVariant: BRAND_VARIANT.PRIMARY,
        headingBlock: makeHeadingBlock(),
        posts: [
          {
            id: 'post-1',
            slug: 'first-post',
            title: 'First post',
            excerpt: 'An excerpt',
            publishedAt: '2026-01-01T00:00:00.000Z',
            topic: { id: 'topic-1', title: 'News', slug: 'news' },
            readingTimeMinutes: 2,
            heroImage: makeSanityImage(),
          },
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
