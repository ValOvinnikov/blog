import { BRAND_VARIANT } from '@blog/config';
import { Carousel } from '@blog/ui/organisms/carousel';
import {
  customRender,
  renderElement,
  screen,
} from '@web/testing/custom-render';
import { makeTestimonialCardItem } from '@web/testing/modules/testimonial/fixtures';
import { SmartLinkMock } from '@web/testing/shared/smart-link/smart-link-mock';

import { TestimonialCarousel } from './testimonial-carousel';

vi.mock('@web/components/shared/smart-link', () => ({
  SmartLink: SmartLinkMock,
}));

vi.mock('@blog/ui/organisms/carousel', () => ({
  Carousel: vi.fn(() => null),
}));

const items = [
  makeTestimonialCardItem({ id: 'testimonial-1', name: 'Ada Lovelace' }),
  makeTestimonialCardItem({ id: 'testimonial-2', name: 'Grace Hopper' }),
];

const setup = customRender(TestimonialCarousel, {
  items,
  align: 'left',
  tone: BRAND_VARIANT.PRIMARY,
  title: 'What our clients say',
});

const getCarouselProps = () => {
  const props = vi.mocked(Carousel).mock.calls.at(-1)?.[0];
  if (!props) {
    throw new Error('Carousel was not called');
  }
  return props;
};

describe(`<${TestimonialCarousel.name}/>`, () => {
  it('composes the region label from the carousel.regionLabel Voice key rather than passing the title straight through, with the Voice-fixed previous/next labels', () => {
    setup();

    expect(getCarouselProps()).toMatchObject({
      ariaLabel: 'What our clients say carousel',
      previousLabel: 'Previous slide',
      nextLabel: 'Next slide',
    });
  });

  it('renderItem renders exactly one TestimonialCard per item', () => {
    setup();
    const { renderItem } = getCarouselProps();

    items.forEach((item, index) => {
      const { unmount } = renderElement(<>{renderItem({ item, index })}</>);

      expect(screen.getByText(item.quote)).toBeInTheDocument();
      expect(screen.getAllByText(item.name).length).toBeGreaterThan(0);

      unmount();
    });
  });
});
