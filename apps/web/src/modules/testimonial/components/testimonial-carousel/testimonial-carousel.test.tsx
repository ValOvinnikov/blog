import { BRAND_VARIANT } from '@blog/config';
import { customRender, screen, within } from '@web/testing/custom-render';
import {
  MOCK_TESTIMONIAL_HEADING,
  MOCK_TESTIMONIAL_ITEMS,
} from '@web/testing/modules/testimonial/fixtures';

import { TestimonialCarousel } from './testimonial-carousel';

vi.mock('@web/i18n/navigation');

const CAROUSEL_LABEL = `${MOCK_TESTIMONIAL_HEADING} carousel`;

const setup = customRender(TestimonialCarousel, {
  items: MOCK_TESTIMONIAL_ITEMS,
  align: 'left',
  tone: BRAND_VARIANT.PRIMARY,
  title: MOCK_TESTIMONIAL_HEADING,
});

describe(`<${TestimonialCarousel.name}/>`, () => {
  beforeEach(() => {
    setup();
  });

  it('renders one testimonial per item in the labelled carousel', () => {
    const region = screen.getByRole('region', { name: CAROUSEL_LABEL });
    const quotes = within(region).getAllByRole('blockquote');

    expect(quotes).toHaveLength(MOCK_TESTIMONIAL_ITEMS.length);
  });

  it.each(MOCK_TESTIMONIAL_ITEMS.map(({ name }) => name))(
    'renders the name %s in the carousel',
    (itemName) => {
      const region = screen.getByRole('region', { name: CAROUSEL_LABEL });
      const name = within(region).getByText(itemName, { ignore: '.sr-only' });

      expect(name).toBeVisible();
    },
  );

  it('renders previous and next slide controls', async () => {
    const previousButton = await screen.findByRole('button', {
      name: 'Previous slide',
    });
    const nextButton = screen.getByRole('button', { name: 'Next slide' });

    expect(previousButton).toBeVisible();
    expect(nextButton).toBeVisible();
  });
});
