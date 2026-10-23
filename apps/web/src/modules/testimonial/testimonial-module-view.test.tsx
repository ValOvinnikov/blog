import { BRAND_VARIANT, CONTENT_ALIGNMENT, DISPLAY_MODE } from '@blog/config';
import { customRender, screen } from '@web/testing/custom-render';
import {
  MOCK_CTA_PRIMARY_ACTION,
  MOCK_CTA_SECONDARY_ACTION,
  MOCK_CTA_SECONDARY_ACTION_ARIA_LABEL,
  MOCK_CTA_ACTIONS,
} from '@web/testing/modules/cta/fixtures';
import {
  MOCK_TESTIMONIAL_HEADING,
  MOCK_TESTIMONIAL_ITEMS,
  mockTestimonialItem,
} from '@web/testing/modules/testimonial/fixtures';
import { makeHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import type { ReactElement } from 'react';

import type { ITestimonialCarouselProps } from './components/testimonial-carousel/testimonial-carousel';
import { TestimonialModuleView } from './testimonial-module-view';

const { TestimonialCarousel } = vi.hoisted(() => ({
  TestimonialCarousel: vi.fn<
    (props: ITestimonialCarouselProps) => ReactElement
  >(() => <div data-testid="testimonial-carousel-stub" />),
}));

vi.mock('@web/i18n/navigation');

vi.mock('./components/testimonial-carousel/testimonial-carousel', () => ({
  TestimonialCarousel,
}));

const TITLE_ID = 'testimonial-title';

const dataTestId = 'testimonial-module-testimonial-1';

const setup = customRender(TestimonialModuleView, {
  brandVariant: BRAND_VARIANT.PRIMARY,
  headingBlock: makeHeadingBlock({ heading: MOCK_TESTIMONIAL_HEADING }),
  testimonials: MOCK_TESTIMONIAL_ITEMS,
  ctaButtons: [],
  displayMode: DISPLAY_MODE.GRID,
  contentAlignment: undefined,
  cardAlignment: CONTENT_ALIGNMENT.LEFT,
  layout: undefined,
  titleId: TITLE_ID,
  dataTestId,
});

describe(`<${TestimonialModuleView.name}/>`, () => {
  describe('two testimonials in a grid with no actions', () => {
    beforeEach(() => {
      setup();
    });

    it('labels the section with its h2 heading', () => {
      const heading = screen.getByRole('heading', {
        level: 2,
        name: MOCK_TESTIMONIAL_HEADING,
      });
      const section = screen.getByRole('region', {
        name: MOCK_TESTIMONIAL_HEADING,
      });
      expect(heading).toHaveAttribute('id', TITLE_ID);
      expect(section).toHaveAttribute('aria-labelledby', TITLE_ID);
      expect(section).toHaveAttribute('data-testid', dataTestId);
    });

    it('renders several testimonials as blockquotes in a grid', () => {
      const quotes = screen.getAllByRole('blockquote');
      expect(quotes).toHaveLength(2);
      MOCK_TESTIMONIAL_ITEMS.forEach((item) => {
        const name = screen.getByText(item.name, { ignore: '.sr-only' });
        expect(name).toBeVisible();
      });
      expect(TestimonialCarousel).not.toHaveBeenCalled();
    });

    it('renders no action group when there are no cta buttons', () => {
      const links = screen.queryAllByRole('link');
      expect(links).toHaveLength(0);
    });
  });

  it('renders a single testimonial as the spotlight, never the carousel', () => {
    setup({
      testimonials: [mockTestimonialItem()],
      displayMode: DISPLAY_MODE.CAROUSEL,
    });

    const quotes = screen.getAllByRole('blockquote');
    expect(quotes).toHaveLength(1);
    expect(TestimonialCarousel).not.toHaveBeenCalled();
  });

  it('renders several testimonials in a carousel in carousel mode', () => {
    setup({ displayMode: DISPLAY_MODE.CAROUSEL });

    expect(TestimonialCarousel).toHaveBeenCalledTimes(1);
    const carousel = screen.getByTestId('testimonial-carousel-stub');
    const quote = screen.queryByRole('blockquote');
    expect(carousel).toBeVisible();
    expect(quote).not.toBeInTheDocument();
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

      const { contentAlignment: trackAlignment } =
        TestimonialCarousel.mock.calls[0]![0];
      expect(trackAlignment).toBe(expectedAlignment);
    },
  );

  it('renders the resolved cta buttons when present', () => {
    setup({ ctaButtons: MOCK_CTA_ACTIONS });

    const primaryLink = screen.getByRole('link', {
      name: MOCK_CTA_PRIMARY_ACTION.link.label,
    });
    const secondaryLink = screen.getByRole('link', {
      name: MOCK_CTA_SECONDARY_ACTION_ARIA_LABEL,
    });
    expect(primaryLink).toHaveAttribute(
      'href',
      MOCK_CTA_PRIMARY_ACTION.link.href,
    );
    expect(secondaryLink).toHaveAttribute(
      'href',
      MOCK_CTA_SECONDARY_ACTION.link.href,
    );
  });
});
