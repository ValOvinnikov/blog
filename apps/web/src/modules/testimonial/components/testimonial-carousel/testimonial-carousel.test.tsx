import { BRAND_VARIANT } from '@blog/config';
import { customRender, screen, within } from '@web/testing/custom-render';
import { makeTestimonialItem } from '@web/testing/modules/testimonial/fixtures';

import { TestimonialCarousel } from './testimonial-carousel';

vi.mock('@web/i18n/navigation');

const items = [
  makeTestimonialItem({ id: 'testimonial-1', name: 'Jordan Reyes' }),
  makeTestimonialItem({ id: 'testimonial-2', name: 'Priya Nair' }),
];

const setup = customRender(TestimonialCarousel, {
  items,
  align: 'left',
  tone: BRAND_VARIANT.PRIMARY,
  title: 'What our customers say',
});

describe(`<${TestimonialCarousel.name}/>`, () => {
  it('renders a labelled carousel with one testimonial per item', async () => {
    setup();

    const region = screen.getByRole('region', {
      name: 'What our customers say carousel',
    });
    expect(within(region).getAllByRole('blockquote')).toHaveLength(
      items.length,
    );
    items.forEach((item) => {
      expect(
        within(region).getByText(item.name, { ignore: '.sr-only' }),
      ).toBeVisible();
    });
    expect(
      await screen.findByRole('button', { name: 'Previous slide' }),
    ).toBeVisible();
    expect(screen.getByRole('button', { name: 'Next slide' })).toBeVisible();
  });
});
