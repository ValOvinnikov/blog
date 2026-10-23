import { BRAND_VARIANT } from '@blog/config';
import { customRender, screen, within } from '@web/testing/custom-render';
import {
  MOCK_POST_LIST_HEADING,
  mockPostListItem,
} from '@web/testing/modules/post-list/fixtures';
import { makeHeadingBlock } from '@web/testing/shared/heading-block/fixtures';

import { PostListModuleView } from './post-list-module-view';

vi.mock('@web/i18n/navigation');

const TITLE_ID = 'posts-title';
const DATA_TEST_ID = 'post-list-module-post-list-1';
const EMPTY_MESSAGE = 'No posts yet.';
const PAGER_LABEL = 'Engineering pages';

const post = mockPostListItem();

const setup = customRender(PostListModuleView, {
  brandVariant: BRAND_VARIANT.PRIMARY,
  headingBlock: makeHeadingBlock({ heading: MOCK_POST_LIST_HEADING }),
  items: [post],
  layout: undefined,
  contentAlignment: undefined,
  titleId: TITLE_ID,
  dataTestId: DATA_TEST_ID,
  emptyMessage: EMPTY_MESSAGE,
});

describe(`<${PostListModuleView.name}/>`, () => {
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

    it('renders no pagination nav without pagination', () => {
      const pagination = screen.queryByRole('navigation');
      expect(pagination).not.toBeInTheDocument();
    });
  });

  it('renders the pager inside the section', () => {
    setup({
      pagination: {
        currentPage: 2,
        totalPages: 3,
        createHref: (page: number) => `/topics/engineering/page/${page}`,
        ariaLabel: PAGER_LABEL,
        previousLabel: 'Previous',
        nextLabel: 'Next',
      },
    });

    const section = screen.getByRole('region', {
      name: MOCK_POST_LIST_HEADING,
    });
    const nav = within(section).getByRole('navigation', {
      name: PAGER_LABEL,
    });

    const previousLink = screen.getByRole('link', { name: 'Previous' });
    expect(previousLink).toHaveAttribute('href', '/topics/engineering/page/1');
    const nextLink = within(section).getByRole('link', { name: 'Next' });
    expect(nextLink).toHaveAttribute('href', '/topics/engineering/page/3');
    expect(nav).toBeVisible();
  });

  it('renders the empty message and no cards when there are no items', () => {
    setup({ items: [] });

    const emptyMessage = screen.getByText(EMPTY_MESSAGE);
    const link = screen.queryByRole('link');
    expect(emptyMessage).toBeVisible();
    expect(link).not.toBeInTheDocument();
  });

  it('renders a media region for each item when hasImages is true', () => {
    setup({
      hasImages: true,
      items: [{ ...post, image: <div data-testid="post-image" /> }],
    });

    const media = screen.getByTestId('media-card-media');
    const image = screen.getByTestId('post-image');
    expect(media).toBeVisible();
    expect(image).toBeVisible();
  });
});
