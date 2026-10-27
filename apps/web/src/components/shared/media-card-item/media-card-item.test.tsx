import { MEDIA_CARD_MEDIA_TEST_ID } from '@web/constants/media-card';
import { renderElement, screen } from '@web/testing/custom-render';
import { mockPostListItem } from '@web/testing/modules/post-list/fixtures';
import { MOCK_POST_IMAGE_TEST_ID } from '@web/testing/shared/post/fixtures';

import { MediaCardItem } from './media-card-item';

vi.mock('@web/i18n/navigation');

const item = mockPostListItem();
const LEAD_CARD_TEST_ID = 'lead-card';

describe(`<${MediaCardItem.name}/>`, () => {
  describe('with the base item', () => {
    beforeEach(() => {
      renderElement(<MediaCardItem item={item} />);
    });

    it('renders the title linked via SmartLink to item.href', () => {
      const link = screen.getByRole('link', { name: item.title });
      expect(link).toHaveAttribute('href', item.href);
    });

    it('defaults to heading level 3', () => {
      const heading = screen.getByRole('heading', {
        level: 3,
        name: item.title,
      });
      expect(heading).toBeVisible();
    });

    it('renders no media region when hasImage is omitted', () => {
      const media = screen.queryByTestId(MEDIA_CARD_MEDIA_TEST_ID);
      expect(media).not.toBeInTheDocument();
    });

    it('renders the formatted date and reading time', () => {
      const date = screen.getByText(item.formattedDate);
      const readingTime = screen.getByText(item.readingTime ?? '', {
        exact: false,
      });
      expect(date).toBeVisible();
      expect(readingTime).toBeVisible();
    });

    it('renders the topic in the footer', () => {
      const topic = screen.getByText(item.topic.title, { exact: false });
      expect(topic).toBeVisible();
    });

    it('renders no dataTestId on the underlying MediaCard when omitted', () => {
      const article = screen.getByRole('article');
      expect(article).not.toHaveAttribute('data-testid');
    });
  });

  it('renders the title at the given headingLevel', () => {
    renderElement(<MediaCardItem item={item} headingLevel={2} />);

    const heading = screen.getByRole('heading', {
      level: 2,
      name: item.title,
    });
    expect(heading).toBeVisible();
  });

  it('renders the pre-rendered image node inside MediaCard.Media when hasImage is true', () => {
    renderElement(
      <MediaCardItem
        item={{ ...item, image: <div data-testid={MOCK_POST_IMAGE_TEST_ID} /> }}
        hasImage={true}
      />,
    );

    const media = screen.getByTestId(MEDIA_CARD_MEDIA_TEST_ID);
    const image = screen.getByTestId(MOCK_POST_IMAGE_TEST_ID);
    expect(media).toBeVisible();
    expect(image).toBeVisible();
  });

  it('renders no media region when hasImage is true but the item has no image', () => {
    renderElement(<MediaCardItem item={item} hasImage={true} />);

    const media = screen.queryByTestId(MEDIA_CARD_MEDIA_TEST_ID);
    expect(media).not.toBeInTheDocument();
  });

  it('forwards dataTestId to the underlying MediaCard', () => {
    renderElement(<MediaCardItem item={item} dataTestId={LEAD_CARD_TEST_ID} />);

    const card = screen.getByTestId(LEAD_CARD_TEST_ID);
    expect(card).toBeVisible();
  });
});
