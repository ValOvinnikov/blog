import { errorResult, okResult } from '@blog/utils';
import { faker } from '@faker-js/faker';
import { customRenderAsync, screen } from '@web/testing/custom-render';
import { mockSanityImage } from '@web/testing/modules/hero/fixtures';
import { mockPostFeaturedModuleData } from '@web/testing/modules/post-featured/fixtures';
import {
  MOCK_LEAD_POST_TITLE,
  MOCK_SECOND_POST_TITLE,
  MOCK_THIRD_POST_TITLE,
} from '@web/testing/modules/post-list/fixtures';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { mockPostCard } from '@web/testing/shared/post/fixtures';
import { MOCK_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';

import { PostFeaturedModule } from './post-featured-module';

faker.seed(6011);

const MOCK_MODULE_ID = faker.string.uuid();
const MOCK_LEAD_POST_ID = faker.string.uuid();
const MOCK_SECOND_POST_ID = faker.string.uuid();
const MOCK_THIRD_POST_ID = faker.string.uuid();
const MOCK_LEAD_IMAGE_ALT = faker.lorem.words(3);
const MOCK_TAIL_IMAGE_ALT = faker.lorem.words(3);

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
  id: MOCK_MODULE_ID,
});

describe(`<${PostFeaturedModule.name}/>`, () => {
  beforeEach(() => {
    getPostFeaturedMock.mockReset();
    getPostFeaturedMock.mockResolvedValue(
      okResult(mockPostFeaturedModuleData()),
    );
  });

  it('fetches the module by id with the resolved tenant Sanity context', async () => {
    await setup();

    expect(getPostFeaturedMock).toHaveBeenCalledWith(
      MOCK_MODULE_ID,
      MOCK_TENANT_SANITY_CONTEXT,
    );
  });

  it('renders nothing when no posts resolve', async () => {
    const { container } = await setup();

    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when the fetch fails', async () => {
    getPostFeaturedMock.mockResolvedValue(errorResult(MOCK_ERROR));

    const { container } = await setup();

    expect(container).toBeEmptyDOMElement();
  });

  it('renders the first post as a lead card and the rest in a tail grid', async () => {
    getPostFeaturedMock.mockResolvedValue(
      okResult(
        mockPostFeaturedModuleData({
          posts: [
            mockPostCard({
              id: MOCK_LEAD_POST_ID,
              title: MOCK_LEAD_POST_TITLE,
            }),
            mockPostCard({
              id: MOCK_SECOND_POST_ID,
              title: MOCK_SECOND_POST_TITLE,
            }),
            mockPostCard({
              id: MOCK_THIRD_POST_ID,
              title: MOCK_THIRD_POST_TITLE,
            }),
          ],
        }),
      ),
    );

    await setup();

    const leadTitle = screen.getByText(MOCK_LEAD_POST_TITLE);
    const secondTitle = screen.getByText(MOCK_SECOND_POST_TITLE);
    const thirdTitle = screen.getByText(MOCK_THIRD_POST_TITLE);
    const tailGrid = screen.getByTestId(
      `post-featured-module-${MOCK_MODULE_ID}-tail-grid`,
    );

    expect(leadTitle).toBeVisible();
    expect(secondTitle).toBeVisible();
    expect(thirdTitle).toBeVisible();
    expect(tailGrid).toBeVisible();
    expect(tailGrid).not.toHaveTextContent(MOCK_LEAD_POST_TITLE);
  });

  it('sizes the lead image differently from the tail card images', async () => {
    getPostFeaturedMock.mockResolvedValue(
      okResult(
        mockPostFeaturedModuleData({
          posts: [
            mockPostCard({
              id: MOCK_LEAD_POST_ID,
              title: MOCK_LEAD_POST_TITLE,
              heroImage: mockSanityImage({ alt: MOCK_LEAD_IMAGE_ALT }),
            }),
            mockPostCard({
              id: MOCK_SECOND_POST_ID,
              title: MOCK_SECOND_POST_TITLE,
              heroImage: mockSanityImage({ alt: MOCK_TAIL_IMAGE_ALT }),
            }),
          ],
          showImages: true,
        }),
      ),
    );

    await setup();

    const leadImage = screen.getByRole('img', { name: MOCK_LEAD_IMAGE_ALT });
    const tailImage = screen.getByRole('img', { name: MOCK_TAIL_IMAGE_ALT });

    expect(leadImage.getAttribute('sizes')).not.toBe(
      tailImage.getAttribute('sizes'),
    );
    expect(leadImage.getAttribute('width')).not.toBe(
      tailImage.getAttribute('width'),
    );
  });

  it('renders no post images when images are turned off', async () => {
    getPostFeaturedMock.mockResolvedValue(
      okResult(
        mockPostFeaturedModuleData({
          posts: [
            mockPostCard({
              id: MOCK_LEAD_POST_ID,
              heroImage: mockSanityImage(),
            }),
          ],
        }),
      ),
    );

    await setup();

    const image = screen.queryByRole('img');

    expect(image).not.toBeInTheDocument();
  });
});
