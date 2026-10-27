import { BRAND_VARIANT, routes } from '@blog/config';
import { faker } from '@faker-js/faker';
import { MEDIA_CARD_MEDIA_TEST_ID } from '@web/constants/media-card';
import { customRender, screen, within } from '@web/testing/custom-render';
import {
  MOCK_POST_LIST_HEADING,
  mockPostListItem,
} from '@web/testing/modules/post-list/fixtures';
import { mockHeadingBlock } from '@web/testing/shared/heading-block/fixtures';

import { PostListModuleView } from './post-list-module-view';

faker.seed(6011);

vi.mock('@web/i18n/navigation');

const MOCK_TITLE_ID = faker.string.alphanumeric(10);
const MOCK_DATA_TEST_ID = faker.string.alphanumeric(10);
const MOCK_EMPTY_MESSAGE = faker.lorem.sentence();
const MOCK_PAGER_LABEL = faker.lorem.words(2);
const MOCK_PREVIOUS_LABEL = faker.lorem.words(2);
const MOCK_NEXT_LABEL = faker.lorem.words(2);
const MOCK_ARCHIVE_SLUG = faker.lorem.slug(2);
const POST_IMAGE_TEST_ID = 'post-image';

const post = mockPostListItem();

const setup = customRender(PostListModuleView, {
  brandVariant: BRAND_VARIANT.PRIMARY,
  headingBlock: mockHeadingBlock({ heading: MOCK_POST_LIST_HEADING }),
  items: [post],
  layout: undefined,
  contentAlignment: undefined,
  titleId: MOCK_TITLE_ID,
  dataTestId: MOCK_DATA_TEST_ID,
  emptyMessage: MOCK_EMPTY_MESSAGE,
});

describe(`<${PostListModuleView.name}/>`, () => {
  describe('with default props', () => {
    beforeEach(() => {
      setup();
    });

    it('labels the section with its heading', () => {
      const section = screen.getByRole('region', {
        name: MOCK_POST_LIST_HEADING,
      });

      expect(section).toBeVisible();
    });

    it('renders a card per item, linked to its href', () => {
      const link = screen.getByRole('link', { name: post.title });
      const cardHeading = screen.getByRole('heading', {
        level: 3,
        name: post.title,
      });

      expect(link).toHaveAttribute('href', post.href);
      expect(cardHeading).toBeVisible();
    });

    it('renders no pagination nav without pagination', () => {
      const pagination = screen.queryByRole('navigation');

      expect(pagination).not.toBeInTheDocument();
    });

    it('renders no media region when hasImages is not given', () => {
      const media = screen.queryByTestId(MEDIA_CARD_MEDIA_TEST_ID);

      expect(media).not.toBeInTheDocument();
    });
  });

  it('renders the pager inside the section', () => {
    setup({
      pagination: {
        currentPage: 2,
        totalPages: 3,
        createHref: (page: number) => routes.topic(MOCK_ARCHIVE_SLUG, page),
        ariaLabel: MOCK_PAGER_LABEL,
        previousLabel: MOCK_PREVIOUS_LABEL,
        nextLabel: MOCK_NEXT_LABEL,
      },
    });

    const section = screen.getByRole('region', {
      name: MOCK_POST_LIST_HEADING,
    });
    const nav = within(section).getByRole('navigation', {
      name: MOCK_PAGER_LABEL,
    });
    const previousLink = within(nav).getByRole('link', {
      name: MOCK_PREVIOUS_LABEL,
    });
    const nextLink = within(nav).getByRole('link', { name: MOCK_NEXT_LABEL });

    expect(nav).toBeVisible();
    expect(previousLink).toHaveAttribute(
      'href',
      routes.topic(MOCK_ARCHIVE_SLUG, 1),
    );
    expect(nextLink).toHaveAttribute(
      'href',
      routes.topic(MOCK_ARCHIVE_SLUG, 3),
    );
  });

  it('renders the empty message and no cards when there are no items', () => {
    setup({ items: [] });

    const emptyMessage = screen.getByText(MOCK_EMPTY_MESSAGE);
    const link = screen.queryByRole('link');

    expect(emptyMessage).toBeVisible();
    expect(link).not.toBeInTheDocument();
  });

  it('renders a media region for each item when hasImages is true', () => {
    setup({
      hasImages: true,
      items: [{ ...post, image: <div data-testid={POST_IMAGE_TEST_ID} /> }],
    });

    const media = screen.getByTestId(MEDIA_CARD_MEDIA_TEST_ID);
    const image = screen.getByTestId(POST_IMAGE_TEST_ID);

    expect(media).toBeVisible();
    expect(image).toBeVisible();
  });
});
