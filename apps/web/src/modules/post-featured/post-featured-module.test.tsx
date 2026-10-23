import { BRAND_VARIANT } from '@blog/config';
import { errorResult, okResult } from '@blog/utils';
import { customRenderAsync, screen } from '@web/testing/custom-render';
import { mockSanityImage } from '@web/testing/modules/hero/fixtures';
import { MOCK_POST_FEATURED_HEADING } from '@web/testing/modules/post-featured/fixtures';
import {
  MOCK_LEAD_POST_TITLE,
  MOCK_SECOND_POST_TITLE,
  MOCK_THIRD_POST_TITLE,
} from '@web/testing/modules/post-list/fixtures';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { makeHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import { makePostCard } from '@web/testing/shared/post/fixtures';
import { DEFAULT_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';

import { PostFeaturedModule } from './post-featured-module';

const MODULE_ID = 'post-featured-1';
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

const setup = customRenderAsync(PostFeaturedModule, {
  id: MODULE_ID,
});

const mockPostFeaturedResult = (
  posts: ReturnType<typeof makePostCard>[],
  showImages = false,
) =>
  okResult({
    brandVariant: BRAND_VARIANT.PRIMARY,
    headingBlock: makeHeadingBlock({ heading: MOCK_POST_FEATURED_HEADING }),
    posts,
    layout: undefined,
    contentAlignment: undefined,
    showImages,
  });

describe(`<${PostFeaturedModule.name}/>`, () => {
  beforeEach(() => {
    getPostFeaturedMock.mockReset();
  });

  describe('when the module has no posts', () => {
    let container: HTMLElement;

    beforeEach(async () => {
      getPostFeaturedMock.mockResolvedValue(mockPostFeaturedResult([]));
      ({ container } = await setup());
    });

    it('fetches the module by id with the resolved tenant Sanity context', () => {
      expect(getPostFeaturedMock).toHaveBeenCalledWith(
        MODULE_ID,
        DEFAULT_TENANT_SANITY_CONTEXT,
      );
    });

    it('renders nothing, not even an empty landmark, when no posts resolve', () => {
      expect(container).toBeEmptyDOMElement();
    });
  });

  it('renders nothing when the fetch fails', async () => {
    getPostFeaturedMock.mockResolvedValue(errorResult(MOCK_ERROR));

    const { container } = await setup();

    expect(container).toBeEmptyDOMElement();
  });

  it('renders the first post as a lead card and the rest in a tail grid', async () => {
    getPostFeaturedMock.mockResolvedValue(
      mockPostFeaturedResult([
        makePostCard({ id: 'post-1', title: MOCK_LEAD_POST_TITLE }),
        makePostCard({ id: 'post-2', title: MOCK_SECOND_POST_TITLE }),
        makePostCard({ id: 'post-3', title: MOCK_THIRD_POST_TITLE }),
      ]),
    );

    await setup();

    const leadTitle = screen.getByText(MOCK_LEAD_POST_TITLE);
    const secondTitle = screen.getByText(MOCK_SECOND_POST_TITLE);
    const thirdTitle = screen.getByText(MOCK_THIRD_POST_TITLE);
    const tailGrid = screen.getByTestId(
      'post-featured-module-post-featured-1-tail-grid',
    );
    expect(leadTitle).toBeVisible();
    expect(secondTitle).toBeVisible();
    expect(thirdTitle).toBeVisible();
    expect(tailGrid).toBeVisible();
    expect(tailGrid).not.toHaveTextContent(MOCK_LEAD_POST_TITLE);
  });

  it('sizes the lead image differently from the tail card images', async () => {
    getPostFeaturedMock.mockResolvedValue(
      mockPostFeaturedResult(
        [
          makePostCard({
            id: 'post-1',
            title: MOCK_LEAD_POST_TITLE,
            heroImage: mockSanityImage({ alt: LEAD_IMAGE_ALT }),
          }),
          makePostCard({
            id: 'post-2',
            title: MOCK_SECOND_POST_TITLE,
            heroImage: mockSanityImage({ alt: TAIL_IMAGE_ALT }),
          }),
        ],
        true,
      ),
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

  it('renders no post images when images are turned off', async () => {
    getPostFeaturedMock.mockResolvedValue(
      mockPostFeaturedResult([
        makePostCard({
          id: 'post-1',
          heroImage: mockSanityImage(),
        }),
      ]),
    );

    await setup();

    const image = screen.queryByRole('img');
    expect(image).not.toBeInTheDocument();
  });
});
