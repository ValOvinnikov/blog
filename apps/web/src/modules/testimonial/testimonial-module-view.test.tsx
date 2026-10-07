import { BRAND_VARIANT, CONTENT_ALIGNMENT, DISPLAY_MODE } from '@blog/config';
import { customRender, screen } from '@web/testing/custom-render';
import { ctaActionsDemo } from '@web/testing/modules/cta/fixtures';
import { makeTestimonialItem } from '@web/testing/modules/testimonial/fixtures';
import { makeHeadingBlock } from '@web/testing/shared/heading-block/fixtures';

import { TestimonialModuleView } from './testimonial-module-view';

const { TestimonialCarousel } = vi.hoisted(() => ({
  TestimonialCarousel: vi.fn(() => (
    <div data-testid="testimonial-carousel-stub" />
  )),
}));

vi.mock('@web/i18n/navigation');

vi.mock('./components/testimonial-carousel/testimonial-carousel', () => ({
  TestimonialCarousel,
}));

const items = [
  makeTestimonialItem({ id: 'testimonial-1', name: 'Jordan Reyes' }),
  makeTestimonialItem({ id: 'testimonial-2', name: 'Priya Nair' }),
];

const dataTestId = 'testimonial-module-testimonial-1';

const setup = customRender(TestimonialModuleView, {
  brandVariant: BRAND_VARIANT.PRIMARY,
  headingBlock: makeHeadingBlock({ heading: 'What our customers say' }),
  testimonials: items,
  ctaButtons: [],
  displayMode: DISPLAY_MODE.GRID,
  contentAlignment: undefined,
  cardAlignment: CONTENT_ALIGNMENT.LEFT,
  layout: undefined,
  titleId: 'testimonial-title',
  dataTestId,
});

describe(`<${TestimonialModuleView.name}/>`, () => {
  describe('two testimonials in a grid with no actions', () => {
    beforeEach(() => {
      setup();
    });

    it('labels the section with the given titleId', () => {
      const label = screen.getByText('What our customers say');
      expect(label).toHaveAttribute('id', 'testimonial-title');
      expect(label.tagName).toBe('H2');

      const section = label.closest('section');
      expect(section).toHaveAttribute('aria-labelledby', 'testimonial-title');
      expect(section).toHaveAttribute('data-testid', dataTestId);
    });

    it('renders every testimonial as a blockquote in a grid when there is more than one', () => {
      expect(screen.getAllByRole('blockquote')).toHaveLength(2);
      items.forEach((item) => {
        expect(
          screen.getByText(item.name, { ignore: '.sr-only' }),
        ).toBeVisible();
      });
      expect(TestimonialCarousel).not.toHaveBeenCalled();
    });

    it('renders no action group when there are no cta buttons', () => {
      expect(screen.queryAllByRole('link')).toHaveLength(0);
    });
  });

  it('renders a single testimonial as the spotlight, never the grid or the carousel', () => {
    setup({
      testimonials: [makeTestimonialItem({ id: 'testimonial-1' })],
      displayMode: DISPLAY_MODE.CAROUSEL,
    });

    expect(screen.getAllByRole('blockquote')).toHaveLength(1);
    expect(TestimonialCarousel).not.toHaveBeenCalled();
  });

  it('renders the carousel instead of the grid for CAROUSEL with several testimonials', () => {
    setup({ displayMode: DISPLAY_MODE.CAROUSEL });

    expect(TestimonialCarousel).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('testimonial-carousel-stub')).toBeVisible();
    expect(screen.queryByRole('blockquote')).not.toBeInTheDocument();
  });

  it.each([
    [CONTENT_ALIGNMENT.LEFT, CONTENT_ALIGNMENT.LEFT],
    [CONTENT_ALIGNMENT.CENTER, CONTENT_ALIGNMENT.CENTER],
    [CONTENT_ALIGNMENT.RIGHT, CONTENT_ALIGNMENT.LEFT],
    [undefined, CONTENT_ALIGNMENT.LEFT],
  ])(
    'lines the carousel track up %s as %s',
    (contentAlignment, expectedAlignment) => {
      setup({ displayMode: DISPLAY_MODE.CAROUSEL, contentAlignment });

      expect(TestimonialCarousel).toHaveBeenCalledWith(
        expect.objectContaining({ contentAlignment: expectedAlignment }),
        undefined,
      );
    },
  );

  it('renders the resolved cta buttons when present', () => {
    setup({ ctaButtons: ctaActionsDemo });

    expect(screen.getByRole('link', { name: 'Subscribe now' })).toHaveAttribute(
      'href',
      '/blog',
    );
    expect(
      screen.getByRole('link', {
        name: 'Learn more about our subscription plans',
      }),
    ).toHaveAttribute('href', '/about-us');
  });
});
