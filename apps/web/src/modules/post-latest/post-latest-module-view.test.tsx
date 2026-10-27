import { BRAND_VARIANT, DISPLAY_MODE } from '@blog/config';
import { faker } from '@faker-js/faker';
import { MEDIA_CARD_MEDIA_TEST_ID } from '@web/constants/media-card';
import { customRender, screen, within } from '@web/testing/custom-render';
import {
  MOCK_POST_LIST_HEADING,
  MOCK_SECOND_POST_TITLE,
  mockPostListItem,
} from '@web/testing/modules/post-list/fixtures';
import { mockHeadingBlock } from '@web/testing/shared/heading-block/fixtures';

import { PostLatestModuleView } from './post-latest-module-view';

vi.mock('@web/i18n/navigation');

faker.seed(6011);

const MOCK_TITLE_ID = faker.lorem.slug();
const MOCK_DATA_TEST_ID = faker.lorem.slug();
const CAROUSEL_LABEL = `${MOCK_POST_LIST_HEADING} carousel`;
const POST_IMAGE_TEST_ID = 'post-image';

const MOCK_POST_ITEM = mockPostListItem({ id: faker.string.uuid() });

const setup = customRender(PostLatestModuleView, {
  brandVariant: BRAND_VARIANT.PRIMARY,
  headingBlock: mockHeadingBlock({ heading: MOCK_POST_LIST_HEADING }),
  items: [MOCK_POST_ITEM],
  layout: undefined,
  contentAlignment: undefined,
  titleId: MOCK_TITLE_ID,
  dataTestId: MOCK_DATA_TEST_ID,
  displayMode: DISPLAY_MODE.GRID,
});

describe(`<${PostLatestModuleView.name}/>`, () => {
  describe('with default props', () => {
    beforeEach(() => {
      setup();
    });

    it('labels the section with its heading', () => {
      const heading = screen.getByRole('heading', {
        level: 2,
        name: MOCK_POST_LIST_HEADING,
      });
      const section = screen.getByRole('region', {
        name: MOCK_POST_LIST_HEADING,
      });

      expect(heading).toHaveAttribute('id', MOCK_TITLE_ID);
      expect(section).toBeVisible();
      expect(section).toHaveAttribute('aria-labelledby', MOCK_TITLE_ID);
    });

    it('renders a card per item, linked to its href', () => {
      const link = screen.getByRole('link', { name: MOCK_POST_ITEM.title });
      const cardHeading = screen.getByRole('heading', {
        level: 3,
        name: MOCK_POST_ITEM.title,
      });

      expect(link).toHaveAttribute('href', MOCK_POST_ITEM.href);
      expect(cardHeading).toBeVisible();
    });

    it('never renders a pagination nav', () => {
      const pagination = screen.queryByRole('navigation');

      expect(pagination).not.toBeInTheDocument();
    });

    it('renders no media region by default', () => {
      const media = screen.queryByTestId(MEDIA_CARD_MEDIA_TEST_ID);

      expect(media).not.toBeInTheDocument();
    });

    it('renders no carousel in grid mode', () => {
      const carousel = screen.queryByRole('region', { name: CAROUSEL_LABEL });

      expect(carousel).not.toBeInTheDocument();
    });
  });

  it('renders a media region for each item when images are enabled', () => {
    setup({
      hasImages: true,
      items: [
        { ...MOCK_POST_ITEM, image: <div data-testid={POST_IMAGE_TEST_ID} /> },
      ],
    });

    const media = screen.getByTestId(MEDIA_CARD_MEDIA_TEST_ID);
    const image = screen.getByTestId(POST_IMAGE_TEST_ID);

    expect(media).toBeVisible();
    expect(image).toBeVisible();
  });

  it('renders the items as a labelled carousel in carousel mode', async () => {
    const secondPost = mockPostListItem({
      id: faker.string.uuid(),
      title: MOCK_SECOND_POST_TITLE,
    });
    setup({
      items: [MOCK_POST_ITEM, secondPost],
      displayMode: DISPLAY_MODE.CAROUSEL,
    });

    const region = screen.getByRole('region', { name: CAROUSEL_LABEL });
    const articles = within(region).getAllByRole('article');
    const previousButton = await screen.findByRole('button', {
      name: 'Previous slide',
    });
    const nextButton = screen.getByRole('button', { name: 'Next slide' });

    expect(articles).toHaveLength(2);
    expect(previousButton).toBeVisible();
    expect(nextButton).toBeVisible();
  });
});
