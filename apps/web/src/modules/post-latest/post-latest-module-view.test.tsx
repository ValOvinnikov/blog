import { BRAND_VARIANT, DISPLAY_MODE } from '@blog/config';
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

const TITLE_ID = 'latest-posts-title';
const DATA_TEST_ID = 'post-latest-module-post-latest-1';
const CAROUSEL_LABEL = 'Latest posts carousel';

const post = mockPostListItem();

const setup = customRender(PostLatestModuleView, {
  brandVariant: BRAND_VARIANT.PRIMARY,
  headingBlock: mockHeadingBlock({ heading: MOCK_POST_LIST_HEADING }),
  items: [post],
  layout: undefined,
  contentAlignment: undefined,
  titleId: TITLE_ID,
  dataTestId: DATA_TEST_ID,
  displayMode: DISPLAY_MODE.GRID,
});

describe(`<${PostLatestModuleView.name}/>`, () => {
  describe('with default props', () => {
    beforeEach(() => {
      setup();
    });

    it('labels the section with the given titleId', () => {
      const heading = screen.getByRole('heading', {
        level: 2,
        name: MOCK_POST_LIST_HEADING,
      });
      expect(heading).toHaveAttribute('id', TITLE_ID);

      const section = screen.getByRole('region', {
        name: MOCK_POST_LIST_HEADING,
      });
      expect(section).toBeVisible();
      expect(section).toHaveAttribute('aria-labelledby', TITLE_ID);
      expect(section).toHaveAttribute('data-testid', DATA_TEST_ID);
    });

    it('renders a card per item, linked to its href', () => {
      const link = screen.getByRole('link', { name: post.title });
      expect(link).toHaveAttribute('href', post.href);
      const cardHeading = screen.getByRole('heading', {
        level: 3,
        name: post.title,
      });
      expect(cardHeading).toBeVisible();
    });

    it('never renders a pagination nav', () => {
      const pagination = screen.queryByRole('navigation');
      expect(pagination).not.toBeInTheDocument();
    });

    it('renders no media region when hasImages is not given', () => {
      const media = screen.queryByTestId(MEDIA_CARD_MEDIA_TEST_ID);
      expect(media).not.toBeInTheDocument();
    });

    it('renders no carousel when displayMode is GRID', () => {
      const carousel = screen.queryByRole('region', {
        name: CAROUSEL_LABEL,
      });
      expect(carousel).not.toBeInTheDocument();
    });
  });

  it('renders a media region for each item when hasImages is true', () => {
    setup({
      hasImages: true,
      items: [{ ...post, image: <div data-testid="post-image" /> }],
    });

    const media = screen.getByTestId(MEDIA_CARD_MEDIA_TEST_ID);
    const image = screen.getByTestId('post-image');
    expect(media).toBeVisible();
    expect(image).toBeVisible();
  });

  it('renders the items as a labelled carousel when displayMode is CAROUSEL', async () => {
    const secondPost = mockPostListItem({
      id: 'post-2',
      title: MOCK_SECOND_POST_TITLE,
    });
    setup({ items: [post, secondPost], displayMode: DISPLAY_MODE.CAROUSEL });

    const region = screen.getByRole('region', {
      name: CAROUSEL_LABEL,
    });
    const articles = within(region).getAllByRole('article');
    expect(articles).toHaveLength(2);
    const previousButton = await screen.findByRole('button', {
      name: 'Previous slide',
    });
    const nextButton = screen.getByRole('button', { name: 'Next slide' });
    expect(previousButton).toBeVisible();
    expect(nextButton).toBeVisible();
  });
});
