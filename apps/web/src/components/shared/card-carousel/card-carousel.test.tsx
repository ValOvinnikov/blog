import { BRAND_VARIANT } from '@blog/config';
import { Carousel } from '@blog/ui/organisms/carousel';
import {
  customRender,
  renderElement,
  screen,
} from '@web/testing/custom-render';
import { makePostListItem } from '@web/testing/modules/post-list/fixtures';
import { SmartLinkMock } from '@web/testing/shared/smart-link/smart-link-mock';

import { CardCarousel } from './card-carousel';

vi.mock('@web/components/shared/smart-link', () => ({
  SmartLink: SmartLinkMock,
}));

vi.mock('@blog/ui/organisms/carousel', () => ({
  Carousel: vi.fn(() => null),
}));

const items = [
  makePostListItem({ id: 'post-1', title: 'First post' }),
  makePostListItem({ id: 'post-2', title: 'Second post' }),
];

const setup = customRender(CardCarousel, {
  items,
  title: 'Latest posts',
});

const getCarouselProps = () => {
  const props = vi.mocked(Carousel).mock.calls.at(-1)?.[0];
  if (!props) {
    throw new Error('Carousel was not called');
  }
  return props;
};

describe(`<${CardCarousel.name}/>`, () => {
  it('composes the region label from the carousel.regionLabel Voice key rather than passing the title straight through, with the Voice-fixed previous/next labels', () => {
    setup();

    expect(getCarouselProps()).toMatchObject({
      ariaLabel: 'Latest posts carousel',
      previousLabel: 'Previous slide',
      nextLabel: 'Next slide',
    });
  });

  it('renderItem renders exactly one MediaCardItem per item', () => {
    setup();
    const { renderItem } = getCarouselProps();

    items.forEach((item, index) => {
      const { unmount } = renderElement(<>{renderItem({ item, index })}</>);

      const article = screen.getByRole('article');
      expect(article).toHaveTextContent(item.title);

      unmount();
    });
  });

  it('derives getItemKey from the item id', () => {
    setup();
    const { getItemKey } = getCarouselProps();

    items.forEach((item, index) => {
      expect(getItemKey?.({ item, index })).toBe(item.id);
    });
  });

  it('passes tone through to Carousel unchanged', () => {
    setup({ tone: BRAND_VARIANT.BRAND_PRIMARY });

    expect(getCarouselProps().tone).toBe(BRAND_VARIANT.BRAND_PRIMARY);
  });

  it('renderItem renders a media region with the image node when hasImages is set', () => {
    const itemsWithImages = [
      makePostListItem({
        id: 'post-1',
        title: 'First post',
        image: <div data-testid="image-1" />,
      }),
    ];
    setup({ items: itemsWithImages, hasImages: true });
    const { renderItem } = getCarouselProps();

    renderElement(<>{renderItem({ item: itemsWithImages[0], index: 0 })}</>);

    expect(screen.getByTestId('media-card-media')).toBeInTheDocument();
    expect(screen.getByTestId('image-1')).toBeInTheDocument();
  });

  it('renderItem renders an empty media frame when hasImages is set but the item has no image', () => {
    setup({ hasImages: true });
    const { renderItem } = getCarouselProps();

    renderElement(<>{renderItem({ item: items[0], index: 0 })}</>);

    expect(screen.getByTestId('media-card-media')).toBeEmptyDOMElement();
  });

  it('renderItem renders no media region when hasImages is omitted', () => {
    setup();
    const { renderItem } = getCarouselProps();

    renderElement(<>{renderItem({ item: items[0], index: 0 })}</>);

    expect(screen.queryByTestId('media-card-media')).not.toBeInTheDocument();
  });
});
