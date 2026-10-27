import { BRAND_VARIANT, DISPLAY_MODE } from '@blog/config';
import { faker } from '@faker-js/faker';
import { MEDIA_CARD_MEDIA_TEST_ID } from '@web/constants/media-card';
import { customRender, screen, within } from '@web/testing/custom-render';
import { MOCK_POST_FEATURED_HEADING } from '@web/testing/modules/post-featured/fixtures';
import {
  MOCK_LEAD_POST_TITLE,
  MOCK_SECOND_POST_TITLE,
  MOCK_THIRD_POST_TITLE,
  mockPostListItem,
} from '@web/testing/modules/post-list/fixtures';
import { mockHeadingBlock } from '@web/testing/shared/heading-block/fixtures';

import { PostFeaturedModuleView } from './post-featured-module-view';

vi.mock('@web/i18n/navigation');

faker.seed(6011);

const MOCK_TITLE_ID = faker.lorem.slug();
const MOCK_DATA_TEST_ID = faker.lorem.slug();
const LEAD_TEST_ID = `${MOCK_DATA_TEST_ID}-lead`;
const TAIL_TEST_ID = `${MOCK_DATA_TEST_ID}-tail`;
const TAIL_GRID_TEST_ID = `${MOCK_DATA_TEST_ID}-tail-grid`;
const LEAD_IMAGE_TEST_ID = 'lead-image';
const CAROUSEL_LABEL = `${MOCK_POST_FEATURED_HEADING} carousel`;
const MOCK_LEAD_POST = mockPostListItem({
  id: faker.string.uuid(),
  title: MOCK_LEAD_POST_TITLE,
  image: <div data-testid={LEAD_IMAGE_TEST_ID} />,
});
const MOCK_SECOND_POST = mockPostListItem({
  id: faker.string.uuid(),
  title: MOCK_SECOND_POST_TITLE,
});
const MOCK_THIRD_POST = mockPostListItem({
  id: faker.string.uuid(),
  title: MOCK_THIRD_POST_TITLE,
});

const setup = customRender(PostFeaturedModuleView, {
  brandVariant: BRAND_VARIANT.PRIMARY,
  headingBlock: mockHeadingBlock({ heading: MOCK_POST_FEATURED_HEADING }),
  items: [MOCK_LEAD_POST],
  layout: undefined,
  contentAlignment: undefined,
  titleId: MOCK_TITLE_ID,
  dataTestId: MOCK_DATA_TEST_ID,
  displayMode: DISPLAY_MODE.GRID,
});

describe(`<${PostFeaturedModuleView.name}/>`, () => {
  describe('with the default props', () => {
    beforeEach(() => {
      setup();
    });

    it('labels the section by its level-2 heading', () => {
      const heading = screen.getByRole('heading', {
        level: 2,
        name: MOCK_POST_FEATURED_HEADING,
      });
      const region = screen.getByRole('region', {
        name: MOCK_POST_FEATURED_HEADING,
      });

      expect(heading).toHaveAttribute('id', MOCK_TITLE_ID);
      expect(region).toHaveAttribute('aria-labelledby', MOCK_TITLE_ID);
      expect(region).toBeVisible();
    });

    it('renders the first item as a lead card with a level-3 heading link', () => {
      const link = screen.getByRole('link', { name: MOCK_LEAD_POST_TITLE });
      const heading = screen.getByRole('heading', {
        level: 3,
        name: MOCK_LEAD_POST_TITLE,
      });

      expect(link).toHaveAttribute('href', MOCK_LEAD_POST.href);
      expect(heading).toBeVisible();
    });

    it('renders no card media by default', () => {
      const media = screen.queryByTestId(MEDIA_CARD_MEDIA_TEST_ID);

      expect(media).not.toBeInTheDocument();
    });

    it('renders no carousel in grid mode', () => {
      const carousel = screen.queryByRole('region', { name: CAROUSEL_LABEL });

      expect(carousel).not.toBeInTheDocument();
    });
  });

  it('renders no lead group or cards without items', () => {
    setup({ items: [] });

    const articles = screen.queryAllByRole('article');
    const leadGroup = screen.queryByTestId(LEAD_TEST_ID);

    expect(articles).toHaveLength(0);
    expect(leadGroup).not.toBeInTheDocument();
  });

  it('renders only the lead card when exactly one item resolves', () => {
    setup({ items: [MOCK_LEAD_POST] });

    const articles = screen.getAllByRole('article');
    const leadGroup = screen.getByTestId(LEAD_TEST_ID);
    const tail = screen.queryByTestId(TAIL_TEST_ID);
    const tailGrid = screen.queryByTestId(TAIL_GRID_TEST_ID);

    expect(articles).toHaveLength(1);
    expect(leadGroup).toBeVisible();
    expect(tail).not.toBeInTheDocument();
    expect(tailGrid).not.toBeInTheDocument();
  });

  it('renders exactly one tail card when two items resolve', () => {
    setup({ items: [MOCK_LEAD_POST, MOCK_SECOND_POST], hasImages: true });

    const leadTitle = screen.getByText(MOCK_LEAD_POST_TITLE);
    const secondTitle = screen.getByText(MOCK_SECOND_POST_TITLE);
    const articles = screen.getAllByRole('article');
    const tailGrid = screen.queryByTestId(TAIL_GRID_TEST_ID);
    const tail = screen.getByTestId(TAIL_TEST_ID);

    expect(leadTitle).toBeVisible();
    expect(secondTitle).toBeVisible();
    expect(articles).toHaveLength(2);
    expect(tailGrid).not.toBeInTheDocument();
    expect(tail).toBeVisible();
  });

  it('renders the remaining posts in a grid when three or more resolve', () => {
    setup({ items: [MOCK_LEAD_POST, MOCK_SECOND_POST, MOCK_THIRD_POST] });

    const tailGrid = screen.getByTestId(TAIL_GRID_TEST_ID);
    const secondTitle = within(tailGrid).getByText(MOCK_SECOND_POST_TITLE);
    const thirdTitle = within(tailGrid).getByText(MOCK_THIRD_POST_TITLE);
    const leadTitle = within(tailGrid).queryByText(MOCK_LEAD_POST_TITLE);
    const articles = screen.getAllByRole('article');

    expect(secondTitle).toBeVisible();
    expect(thirdTitle).toBeVisible();
    expect(leadTitle).not.toBeInTheDocument();
    expect(articles).toHaveLength(3);
  });

  it('renders the lead card media when images are enabled', () => {
    setup({ hasImages: true });

    const media = screen.getByTestId(MEDIA_CARD_MEDIA_TEST_ID);
    const leadImage = screen.getByTestId(LEAD_IMAGE_TEST_ID);

    expect(media).toBeVisible();
    expect(leadImage).toBeVisible();
  });

  it('renders the items as a labelled carousel in carousel mode', async () => {
    setup({
      items: [MOCK_LEAD_POST, MOCK_SECOND_POST, MOCK_THIRD_POST],
      displayMode: DISPLAY_MODE.CAROUSEL,
    });

    const region = screen.getByRole('region', { name: CAROUSEL_LABEL });
    const articles = within(region).getAllByRole('article');
    const leadGroup = screen.queryByTestId(LEAD_TEST_ID);
    const previousButton = await screen.findByRole('button', {
      name: 'Previous slide',
    });
    const nextButton = screen.getByRole('button', { name: 'Next slide' });

    expect(articles).toHaveLength(3);
    expect(leadGroup).not.toBeInTheDocument();
    expect(previousButton).toBeVisible();
    expect(nextButton).toBeVisible();
  });
});
