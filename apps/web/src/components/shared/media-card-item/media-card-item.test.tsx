import { MEDIA_CARD_MEDIA_TEST_ID } from '@web/constants/media-card';
import { customRender, screen } from '@web/testing/custom-render';
import { mockPostListItem } from '@web/testing/modules/post-list/fixtures';
import { MOCK_POST_IMAGE_TEST_ID } from '@web/testing/shared/post/fixtures';

import { MediaCardItem } from './media-card-item';

vi.mock('@web/i18n/navigation');

const MOCK_ITEM = mockPostListItem();

const setup = customRender(MediaCardItem, { item: MOCK_ITEM });

describe(`<${MediaCardItem.name}/>`, () => {
  describe('with the base item', () => {
    beforeEach(() => {
      setup();
    });

    it('links the title to the item href', () => {
      const link = screen.getByRole('link', { name: MOCK_ITEM.title });

      expect(link).toHaveAttribute('href', MOCK_ITEM.href);
    });

    it('defaults to heading level 3', () => {
      const heading = screen.getByRole('heading', {
        level: 3,
        name: MOCK_ITEM.title,
      });

      expect(heading).toBeVisible();
    });

    it('renders no media region when hasImage is omitted', () => {
      const media = screen.queryByTestId(MEDIA_CARD_MEDIA_TEST_ID);

      expect(media).not.toBeInTheDocument();
    });

    it('renders the formatted date and reading time', () => {
      const date = screen.getByText(MOCK_ITEM.formattedDate);
      const readingTime = screen.getByText(MOCK_ITEM.readingTime ?? '', {
        exact: false,
      });

      expect(date).toBeVisible();
      expect(readingTime).toBeVisible();
    });

    it('renders the topic in the footer', () => {
      const topic = screen.getByText(MOCK_ITEM.topic.title, { exact: false });

      expect(topic).toBeVisible();
    });
  });

  it('renders the title at the given headingLevel', () => {
    setup({ headingLevel: 2 });

    const heading = screen.getByRole('heading', {
      level: 2,
      name: MOCK_ITEM.title,
    });

    expect(heading).toBeVisible();
  });

  it('renders the item image in a media region when hasImage is set', () => {
    setup({
      item: {
        ...MOCK_ITEM,
        image: <div data-testid={MOCK_POST_IMAGE_TEST_ID} />,
      },
      hasImage: true,
    });

    const media = screen.getByTestId(MEDIA_CARD_MEDIA_TEST_ID);
    const image = screen.getByTestId(MOCK_POST_IMAGE_TEST_ID);

    expect(media).toBeVisible();
    expect(image).toBeVisible();
  });

  it('renders no media region when hasImage is set but the item has no image', () => {
    setup({ hasImage: true });

    const media = screen.queryByTestId(MEDIA_CARD_MEDIA_TEST_ID);

    expect(media).not.toBeInTheDocument();
  });
});
