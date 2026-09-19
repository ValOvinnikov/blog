import { CARD_IMAGE_SHAPE } from '@blog/config';
import { Carousel } from '@blog/ui/organisms/carousel';
import {
  customRender,
  renderElement,
  screen,
} from '@web/testing/custom-render';
import { makeFeatureListItem } from '@web/testing/modules/feature-list/fixtures';

import { FeatureListCarousel } from './feature-list-carousel';

vi.mock('@web/components/shared/smart-link', () => ({
  SmartLink: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock('@blog/ui/organisms/carousel', () => ({
  Carousel: vi.fn(() => null),
}));

const items = [
  makeFeatureListItem({
    id: 'feature-1',
    headingBlock: { heading: 'Fast by default' },
  }),
  makeFeatureListItem({
    id: 'feature-2',
    headingBlock: { heading: 'Built for scale' },
  }),
];

const setup = customRender(FeatureListCarousel, {
  items,
  imageShape: CARD_IMAGE_SHAPE.WIDE,
  align: 'left',
  imageSizes: '100vw',
  title: 'Why choose us',
});

const getCarouselProps = () => {
  const props = vi.mocked(Carousel).mock.calls.at(-1)?.[0];
  if (!props) {
    throw new Error('Carousel was not called');
  }
  return props;
};

describe(`<${FeatureListCarousel.name}/>`, () => {
  it('composes the region label from the carousel.regionLabel Voice key rather than passing the title straight through, with the Voice-fixed previous/next labels', () => {
    setup();

    expect(getCarouselProps()).toMatchObject({
      ariaLabel: 'Why choose us carousel',
      previousLabel: 'Previous slide',
      nextLabel: 'Next slide',
    });
  });

  it('renderItem renders exactly one FeatureListCard per item', () => {
    setup();
    const { renderItem } = getCarouselProps();

    items.forEach((item, index) => {
      const { unmount } = renderElement(<>{renderItem({ item, index })}</>);

      expect(
        screen.getByRole('heading', {
          level: 3,
          name: item.headingBlock.heading,
        }),
      ).toBeInTheDocument();

      unmount();
    });
  });
});
