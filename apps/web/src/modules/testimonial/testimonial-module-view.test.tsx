import { BRAND_VARIANT, CONTENT_ALIGNMENT, DISPLAY_MODE } from '@blog/config';
import { customRender, screen, within } from '@web/testing/custom-render';
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

import { TestimonialModuleView } from './testimonial-module-view';

vi.mock('@web/i18n/navigation');

const TITLE_ID = 'testimonial-title';
const CAROUSEL_LABEL = `${MOCK_TESTIMONIAL_HEADING} carousel`;

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
      const carousel = screen.queryByRole('region', { name: CAROUSEL_LABEL });
      expect(carousel).not.toBeInTheDocument();
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
    const carousel = screen.queryByRole('region', { name: CAROUSEL_LABEL });
    expect(quotes).toHaveLength(1);
    expect(carousel).not.toBeInTheDocument();
  });

  it('renders several testimonials in a carousel in carousel mode', () => {
    setup({ displayMode: DISPLAY_MODE.CAROUSEL });

    const carousel = screen.getByRole('region', { name: CAROUSEL_LABEL });
    const quotes = within(carousel).getAllByRole('blockquote');
    expect(quotes).toHaveLength(MOCK_TESTIMONIAL_ITEMS.length);
  });

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
