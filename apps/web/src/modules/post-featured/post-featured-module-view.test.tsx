import { BRAND_VARIANT, DISPLAY_MODE } from '@blog/config';
import { customRender, screen, within } from '@web/testing/custom-render';
import { MOCK_POST_FEATURED_HEADING } from '@web/testing/modules/post-featured/fixtures';
import {
  MOCK_LEAD_POST_TITLE,
  MOCK_SECOND_POST_TITLE,
  MOCK_THIRD_POST_TITLE,
  mockPostListItem,
} from '@web/testing/modules/post-list/fixtures';
import { makeHeadingBlock } from '@web/testing/shared/heading-block/fixtures';

import { PostFeaturedModuleView } from './post-featured-module-view';

vi.mock('@web/i18n/navigation');

const TITLE_ID = 'featured-posts-title';
const DATA_TEST_ID = 'post-featured-module-featured-1';
const LEAD_TEST_ID = `${DATA_TEST_ID}-lead`;
const TAIL_TEST_ID = `${DATA_TEST_ID}-tail`;
const TAIL_GRID_TEST_ID = `${DATA_TEST_ID}-tail-grid`;
const MEDIA_TEST_ID = 'media-card-media';

const leadPost = mockPostListItem({
  id: 'post-1',
  title: MOCK_LEAD_POST_TITLE,
  excerpt: 'Lead excerpt',
  image: <div data-testid="lead-image" />,
});
const secondPost = mockPostListItem({
  id: 'post-2',
  title: MOCK_SECOND_POST_TITLE,
  excerpt: 'Second excerpt',
  image: <div data-testid="second-image" />,
});
const thirdPost = mockPostListItem({
  id: 'post-3',
  title: MOCK_THIRD_POST_TITLE,
  excerpt: 'Third excerpt',
});

const setup = customRender(PostFeaturedModuleView, {
  brandVariant: BRAND_VARIANT.PRIMARY,
  headingBlock: makeHeadingBlock({ heading: MOCK_POST_FEATURED_HEADING }),
  items: [leadPost],
  layout: undefined,
  contentAlignment: undefined,
  titleId: TITLE_ID,
  dataTestId: DATA_TEST_ID,
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
      const section = screen.getByTestId(DATA_TEST_ID);
      const region = screen.getByRole('region', {
        name: MOCK_POST_FEATURED_HEADING,
      });
      expect(heading).toHaveAttribute('id', TITLE_ID);
      expect(section).toHaveAttribute('aria-labelledby', TITLE_ID);
      expect(region).toBeVisible();
    });

    it('renders the first item as a lead card with a level-3 heading link', () => {
      const link = screen.getByRole('link', { name: MOCK_LEAD_POST_TITLE });
      const heading = screen.getByRole('heading', {
        level: 3,
        name: MOCK_LEAD_POST_TITLE,
      });
      expect(link).toHaveAttribute('href', leadPost.href);
      expect(heading).toBeVisible();
    });

    it('renders no card media by default', () => {
      const media = screen.queryByTestId(MEDIA_TEST_ID);
      expect(media).not.toBeInTheDocument();
    });

    it('renders no carousel in grid mode', () => {
      const carousel = screen.queryByRole('region', {
        name: `${MOCK_POST_FEATURED_HEADING} carousel`,
      });
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
    setup({ items: [leadPost] });

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
    setup({ items: [leadPost, secondPost], hasImages: true });

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
    setup({ items: [leadPost, secondPost, thirdPost] });

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

    const media = screen.getByTestId(MEDIA_TEST_ID);
    const leadImage = screen.getByTestId('lead-image');
    expect(media).toBeVisible();
    expect(leadImage).toBeVisible();
  });

  it('renders the items as a labelled carousel in carousel mode', async () => {
    setup({
      items: [leadPost, secondPost, thirdPost],
      displayMode: DISPLAY_MODE.CAROUSEL,
    });

    const region = screen.getByRole('region', {
      name: `${MOCK_POST_FEATURED_HEADING} carousel`,
    });
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
