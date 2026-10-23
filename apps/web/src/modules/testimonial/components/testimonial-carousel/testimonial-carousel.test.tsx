import { BRAND_VARIANT } from '@blog/config';
import { customRender, screen, within } from '@web/testing/custom-render';
import {
  MOCK_TESTIMONIAL_HEADING,
  MOCK_TESTIMONIAL_ITEMS,
} from '@web/testing/modules/testimonial/fixtures';

import { TestimonialCarousel } from './testimonial-carousel';

vi.mock('@web/i18n/navigation');

const setup = customRender(TestimonialCarousel, {
  items: MOCK_TESTIMONIAL_ITEMS,
  align: 'left',
  tone: BRAND_VARIANT.PRIMARY,
  title: MOCK_TESTIMONIAL_HEADING,
});

describe(`<${TestimonialCarousel.name}/>`, () => {
  it('renders a labelled carousel with one testimonial per item', async () => {
    setup();

    const region = screen.getByRole('region', {
      name: `${MOCK_TESTIMONIAL_HEADING} carousel`,
    });
    const quotes = within(region).getAllByRole('blockquote');
    expect(quotes).toHaveLength(MOCK_TESTIMONIAL_ITEMS.length);
    MOCK_TESTIMONIAL_ITEMS.forEach((item) => {
      const name = within(region).getByText(item.name, { ignore: '.sr-only' });
      expect(name).toBeVisible();
    });
    const previousButton = await screen.findByRole('button', {
      name: 'Previous slide',
    });
    const nextButton = screen.getByRole('button', { name: 'Next slide' });
    expect(previousButton).toBeVisible();
    expect(nextButton).toBeVisible();
  });
});
