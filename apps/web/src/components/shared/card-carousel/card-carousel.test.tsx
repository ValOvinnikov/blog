import { customRender, screen, within } from '@web/testing/custom-render';
import { makePostListItem } from '@web/testing/modules/post-list/fixtures';

import { CardCarousel } from './card-carousel';

vi.mock('@web/i18n/navigation');

const items = [
  makePostListItem({ id: 'post-1', title: 'First post' }),
  makePostListItem({ id: 'post-2', title: 'Second post' }),
];

const setup = customRender(CardCarousel, {
  items,
  title: 'Latest posts',
});

describe(`<${CardCarousel.name}/>`, () => {
  it('renders a labelled carousel with one card per item', async () => {
    setup();

    const region = screen.getByRole('region', {
      name: 'Latest posts carousel',
    });
    const cards = within(region).getAllByRole('article');
    expect(cards).toHaveLength(items.length);
    items.forEach((item, index) => {
      expect(cards[index]).toHaveTextContent(item.title);
    });
    expect(
      await screen.findByRole('button', { name: 'Previous slide' }),
    ).toBeVisible();
    expect(screen.getByRole('button', { name: 'Next slide' })).toBeVisible();
  });

  it('renders a media region with the image node when hasImages is set', () => {
    setup({
      items: [makePostListItem({ image: <div data-testid="image-1" /> })],
      hasImages: true,
    });

    expect(screen.getByTestId('media-card-media')).toBeVisible();
    expect(screen.getByTestId('image-1')).toBeVisible();
  });

  it('renders an empty media frame when an item has no image', () => {
    setup({ items: [makePostListItem()], hasImages: true });

    expect(screen.getByTestId('media-card-media')).toBeEmptyDOMElement();
  });

  it('renders no media region when hasImages is omitted', () => {
    setup();

    expect(screen.queryByTestId('media-card-media')).not.toBeInTheDocument();
  });
});
