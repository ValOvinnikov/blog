import { BRAND_VARIANT } from '@blog/config';
import { errorResult, okResult } from '@blog/utils';
import { getRequestContext } from '@web/server/request-context/request-context';
import { customRenderAsync, screen } from '@web/testing/custom-render';
import { makeSanityImage } from '@web/testing/modules/hero/fixtures';
import { makeHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import {
  DEFAULT_REQUEST_CONTEXT,
  DEFAULT_TENANT_SANITY_CONTEXT,
} from '@web/testing/shared/tenant/fixtures';
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

vi.mock('@web/server/request-context/request-context');

const getRequestContextMock = vi.mocked(getRequestContext);
const loggerWarnMock = vi.mocked(logger.warn);

const FIRST_POST_TITLE = 'First post';
const POST_RELATED_ID = 'post-related-1';
const ANCHOR_POST_ID = 'anchor-post-1';
const MODULE_HEADING = 'Related reading';

const makePost = (overrides: Record<string, unknown> = {}) => ({
  id: 'post-1',
  slug: 'first-post',
  title: FIRST_POST_TITLE,
  excerpt: 'An excerpt',
  publishedAt: '2026-01-01T00:00:00.000Z',
  topic: { id: 'topic-1', title: 'News', slug: 'news' },
  readingTimeMinutes: 2,
  ...overrides,
});

const setup = customRenderAsync(PostRelatedModule, {
  id: POST_RELATED_ID,
  context: { post: { id: ANCHOR_POST_ID } },
});

describe(`<${PostRelatedModule.name}/>`, () => {
  beforeEach(() => {
    getPostRelatedMock.mockReset();
    getRequestContextMock.mockReset();
    getRequestContextMock.mockResolvedValue(DEFAULT_REQUEST_CONTEXT);
    loggerWarnMock.mockReset();
    getPostRelatedMock.mockResolvedValue(
      okResult({
        brandVariant: BRAND_VARIANT.PRIMARY,
        headingBlock: makeHeadingBlock({ heading: MODULE_HEADING }),
        posts: [],
        layout: undefined,
        contentAlignment: undefined,
        showImages: false,
      }),
    );
  });

  it('calls getPostRelated with the module id, anchor post id and tenant context', async () => {
    await setup();

    expect(getPostRelatedMock).toHaveBeenCalledWith(
      POST_RELATED_ID,
      ANCHOR_POST_ID,
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
      { id: POST_RELATED_ID },
    );
  });

  it('renders nothing when the fetch fails', async () => {
    getPostRelatedMock.mockResolvedValue(errorResult(new Error('boom')));

    const { container } = await setup();

    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when no posts resolve, never an empty labelled landmark', async () => {
    const { container } = await setup();

    expect(container).toBeEmptyDOMElement();
  });

  it('renders the resolved posts and no pagination nav', async () => {
    getPostRelatedMock.mockResolvedValue(
      okResult({
        brandVariant: BRAND_VARIANT.PRIMARY,
        headingBlock: makeHeadingBlock({ heading: MODULE_HEADING }),
        posts: [makePost()],
        layout: undefined,
        contentAlignment: undefined,
        showImages: false,
      }),
    );

    await setup();

    expect(screen.getByText(FIRST_POST_TITLE)).toBeVisible();
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });

  it('renders each post image when showImages is true', async () => {
    const sanityImage = makeSanityImage();
    getPostRelatedMock.mockResolvedValue(
      okResult({
        brandVariant: BRAND_VARIANT.PRIMARY,
        headingBlock: makeHeadingBlock({ heading: MODULE_HEADING }),
        posts: [makePost({ heroImage: sanityImage })],
        layout: undefined,
        contentAlignment: undefined,
        showImages: true,
      }),
    );

    await setup();

    expect(screen.getByRole('img', { name: sanityImage.alt })).toBeVisible();
  });

  it('renders no post images when showImages is false', async () => {
    getPostRelatedMock.mockResolvedValue(
      okResult({
        brandVariant: BRAND_VARIANT.PRIMARY,
        headingBlock: makeHeadingBlock({ heading: MODULE_HEADING }),
        posts: [makePost({ heroImage: makeSanityImage() })],
        layout: undefined,
        contentAlignment: undefined,
        showImages: false,
      }),
    );

    await setup();

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('renders a related post whose excerpt is absent, without throwing', async () => {
    getPostRelatedMock.mockResolvedValue(
      okResult({
        brandVariant: BRAND_VARIANT.PRIMARY,
        headingBlock: makeHeadingBlock({ heading: MODULE_HEADING }),
        posts: [makePost({ excerpt: undefined })],
        layout: undefined,
        contentAlignment: undefined,
        showImages: false,
      }),
    );

    await setup();

    expect(screen.getByText(FIRST_POST_TITLE)).toBeVisible();
  });
});
