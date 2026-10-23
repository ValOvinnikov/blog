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

import { PostFeaturedModule } from './post-featured-module';

const MODULE_ID = 'post-featured-1';
const SECOND_POST_TITLE = 'Second post';
const THIRD_POST_TITLE = 'Third post';
const LEAD_IMAGE_ALT = 'Lead image';
const TAIL_IMAGE_ALT = 'Tail image';

const { getPostFeaturedMock } = vi.hoisted(() => ({
  getPostFeaturedMock: vi.fn(),
}));

vi.mock('@web/i18n/navigation');

vi.mock('@blog/service', () => ({
  service: {
    modules: {
      postFeatured: { v1: { getPostFeatured: getPostFeaturedMock } },
    },
  },
}));

vi.mock('@web/server/request-context/request-context');

const getRequestContextMock = vi.mocked(getRequestContext);

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
  id: MODULE_ID,
});

describe(`<${PostFeaturedModule.name}/>`, () => {
  beforeEach(() => {
    getPostFeaturedMock.mockReset();
    getRequestContextMock.mockReset();
    getRequestContextMock.mockResolvedValue(DEFAULT_REQUEST_CONTEXT);
  });

  describe('when the module has no posts', () => {
    beforeEach(() => {
      getPostFeaturedMock.mockResolvedValue(
        okResult({
          brandVariant: BRAND_VARIANT.PRIMARY,
          headingBlock: makeHeadingBlock({ heading: 'Featured' }),
          posts: [],
          layout: undefined,
          contentAlignment: undefined,
          showImages: false,
        }),
      );
    });

    it('calls getPostFeatured with the module id and resolved tenant Sanity context', async () => {
      await setup();

      expect(getPostFeaturedMock).toHaveBeenCalledWith(
        MODULE_ID,
        DEFAULT_TENANT_SANITY_CONTEXT,
      );
    });

    it('renders nothing when no posts resolve, never an empty labelled landmark', async () => {
      const { container } = await setup();

      expect(container).toBeEmptyDOMElement();
    });
  });

  it('renders nothing when the fetch fails', async () => {
    getPostFeaturedMock.mockResolvedValue(errorResult(new Error('boom')));

    const { container } = await setup();

    expect(container).toBeEmptyDOMElement();
  });

  it('renders the first post as a lead card and the rest in a tail grid', async () => {
    getPostFeaturedMock.mockResolvedValue(
      okResult({
        brandVariant: BRAND_VARIANT.PRIMARY,
        headingBlock: makeHeadingBlock({ heading: 'Featured' }),
        posts: [
          makePost({ id: 'post-1', title: 'Lead post' }),
          makePost({ id: 'post-2', title: SECOND_POST_TITLE }),
          makePost({ id: 'post-3', title: THIRD_POST_TITLE }),
        ],
        layout: undefined,
        contentAlignment: undefined,
        showImages: false,
      }),
    );

    await setup();

    expect(screen.getByText('Lead post')).toBeVisible();
    expect(screen.getByText(SECOND_POST_TITLE)).toBeVisible();
    expect(screen.getByText(THIRD_POST_TITLE)).toBeVisible();
    const tailGrid = screen.getByTestId(
      'post-featured-module-post-featured-1-tail-grid',
    );
    expect(tailGrid).toBeVisible();
    expect(tailGrid).not.toHaveTextContent('Lead post');
  });

  it('renders the lead image sized differently from the tail card images', async () => {
    getPostFeaturedMock.mockResolvedValue(
      okResult({
        brandVariant: BRAND_VARIANT.PRIMARY,
        headingBlock: makeHeadingBlock({ heading: 'Featured' }),
        posts: [
          makePost({
            id: 'post-1',
            title: 'Lead post',
            heroImage: makeSanityImage({ alt: LEAD_IMAGE_ALT }),
          }),
          makePost({
            id: 'post-2',
            title: SECOND_POST_TITLE,
            heroImage: makeSanityImage({ alt: TAIL_IMAGE_ALT }),
          }),
        ],
        layout: undefined,
        contentAlignment: undefined,
        showImages: true,
      }),
    );

    await setup();

    const leadImage = screen.getByRole('img', { name: LEAD_IMAGE_ALT });
    const tailImage = screen.getByRole('img', { name: TAIL_IMAGE_ALT });

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
    getPostFeaturedMock.mockResolvedValue(
      okResult({
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
      }),
    );

    await setup();

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});
