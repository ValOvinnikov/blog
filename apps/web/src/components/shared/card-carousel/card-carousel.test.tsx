import { customRender, screen, within } from '@web/testing/custom-render';
import { mockPostListItem } from '@web/testing/modules/post-list/fixtures';

import { CardCarousel } from './card-carousel';

vi.mock('@web/i18n/navigation');

const MEDIA_TEST_ID = 'media-card-media';

const items = [
  mockPostListItem({ id: 'post-1', title: 'First post' }),
  mockPostListItem({ id: 'post-2', title: 'Second post' }),
];

const setup = customRender(CardCarousel, {
  items,
  title: 'Latest posts',
});

describe(`<${CardCarousel.name}/>`, () => {
  describe('with default props', () => {
    beforeEach(() => {
      setup();
    });

    it('renders a labelled carousel with one card per item', async () => {
      const region = screen.getByRole('region', {
        name: 'Latest posts carousel',
      });
      const cards = within(region).getAllByRole('article');
      expect(cards).toHaveLength(items.length);
      items.forEach((item, index) => {
        expect(cards[index]).toHaveTextContent(item.title);
      });
      const previousButton = await screen.findByRole('button', {
        name: 'Previous slide',
      });
      const nextButton = screen.getByRole('button', { name: 'Next slide' });
      expect(previousButton).toBeVisible();
      expect(nextButton).toBeVisible();
    });

    it('renders no media region when images are not requested', () => {
      const media = screen.queryByTestId(MEDIA_TEST_ID);
      expect(media).not.toBeInTheDocument();
    });
  });

  it('renders a media region with the item image when images are requested', () => {
    setup({
      items: [mockPostListItem({ image: <div data-testid="image-1" /> })],
      hasImages: true,
    });

    const media = screen.getByTestId(MEDIA_TEST_ID);
    const image = screen.getByTestId('image-1');
    expect(media).toBeVisible();
    expect(image).toBeVisible();
  });

  it('renders no media frame when an item has no image', () => {
    setup({ items: [mockPostListItem()], hasImages: true });

    const media = screen.queryByTestId(MEDIA_TEST_ID);
    expect(media).not.toBeInTheDocument();
  });
});
