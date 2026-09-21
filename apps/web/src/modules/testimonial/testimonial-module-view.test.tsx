import { BRAND_VARIANT, CONTENT_ALIGNMENT, DISPLAY_MODE } from '@blog/config';
import { customRender, screen } from '@web/testing/custom-render';
import { ctaActionsDemo } from '@web/testing/modules/cta/fixtures';
import { makeTestimonialCardItem } from '@web/testing/modules/testimonial/fixtures';
import { makeHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import { SmartLinkMock } from '@web/testing/shared/smart-link/smart-link-mock';

import { TestimonialModuleView } from './testimonial-module-view';

vi.mock('@web/components/shared/smart-link', () => ({
  SmartLink: SmartLinkMock,
}));

const { TestimonialCarousel } = vi.hoisted(() => ({
  TestimonialCarousel: vi.fn(() => (
    <div data-testid="testimonial-carousel-stub" />
  )),
}));

vi.mock('./testimonial-carousel', () => ({ TestimonialCarousel }));

const testimonials = [
  makeTestimonialCardItem({ id: 'testimonial-1', name: 'Ada Lovelace' }),
  makeTestimonialCardItem({ id: 'testimonial-2', name: 'Grace Hopper' }),
];

const dataTestId = 'testimonial-module-testimonial-1';

const setup = customRender(TestimonialModuleView, {
  brandVariant: BRAND_VARIANT.PRIMARY,
  headingBlock: makeHeadingBlock({ heading: 'What our clients say' }),
  testimonials,
  ctaButtons: [],
  showImages: true,
  displayMode: DISPLAY_MODE.GRID,
  contentAlignment: undefined,
  cardAlignment: CONTENT_ALIGNMENT.LEFT,
  layout: undefined,
  titleId: 'testimonial-title',
  dataTestId,
});

describe(`<${TestimonialModuleView.name}/>`, () => {
  it('labels the section with the given titleId', () => {
    setup();

    const label = screen.getByText('What our clients say');
    expect(label).toHaveAttribute('id', 'testimonial-title');
    expect(label.tagName).toBe('H2');

    const section = label.closest('section');
    expect(section).toHaveAttribute('aria-labelledby', 'testimonial-title');
    expect(section).toHaveAttribute('data-testid', dataTestId);
  });

  it('renders nothing when testimonials is empty, never an empty landmark with a dangling aria-labelledby', () => {
    const { container } = setup({ testimonials: [] });

    expect(container).toBeEmptyDOMElement();
    expect(container.querySelector('section')).not.toBeInTheDocument();
  });

  it('renders a single spotlight quote when there is exactly one testimonial', () => {
    const [only] = testimonials;
    setup({ testimonials: [only!] });

    expect(screen.getAllByRole('figure')).toHaveLength(1);
    expect(screen.getByText(only!.quote)).toBeInTheDocument();
    expect(TestimonialCarousel).not.toHaveBeenCalled();
  });

  it('renders a card grid for two to eight testimonials in grid mode', () => {
    setup();

    expect(screen.getAllByRole('figure')).toHaveLength(2);
    expect(TestimonialCarousel).not.toHaveBeenCalled();
  });

  it('renders the carousel instead of the grid when displayMode is CAROUSEL and there is more than one testimonial', () => {
    setup({ displayMode: DISPLAY_MODE.CAROUSEL });

    expect(TestimonialCarousel).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('testimonial-carousel-stub')).toBeInTheDocument();
    expect(screen.queryByRole('figure')).not.toBeInTheDocument();
  });

  it('ignores displayMode CAROUSEL for a single testimonial and still renders the spotlight', () => {
    const [only] = testimonials;
    setup({ testimonials: [only!], displayMode: DISPLAY_MODE.CAROUSEL });

    expect(TestimonialCarousel).not.toHaveBeenCalled();
    expect(screen.getAllByRole('figure')).toHaveLength(1);
  });

  it('renders the avatar image when a testimonial has a photo and Show Photos is on', () => {
    setup({
      testimonials: [
        makeTestimonialCardItem({
          id: 'testimonial-1',
          avatarSrc: 'https://cdn.example.com/ada-112.jpg',
        }),
      ],
    });

    expect(screen.getByRole('img')).toHaveAttribute(
      'src',
      'https://cdn.example.com/ada-112.jpg',
    );
  });

  it('falls back to initials when Show Photos is on but a testimonial has no photo', () => {
    setup({
      testimonials: [
        makeTestimonialCardItem({ id: 'testimonial-1', name: 'Ada Lovelace' }),
      ],
    });

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByText('AL')).toBeInTheDocument();
  });

  it('shows initials, never hides the avatar, when Show Photos is off', () => {
    setup({
      testimonials: [
        makeTestimonialCardItem({ id: 'testimonial-1', name: 'Ada Lovelace' }),
      ],
      showImages: false,
    });

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByText('AL')).toBeInTheDocument();
  });

  it('links a testimonial name through SmartLink when the item has a link', () => {
    setup({
      testimonials: [
        makeTestimonialCardItem({
          id: 'testimonial-1',
          name: 'Ada Lovelace',
          link: {
            label: 'Read the case study',
            href: '/case-studies/ada',
            target: undefined,
            platform: undefined,
            ariaLabel: undefined,
          },
        }),
      ],
    });

    const link = screen.getByRole('link', { name: 'Ada Lovelace' });
    expect(link).toHaveAttribute('href', '/case-studies/ada');
  });

  it('renders no action group when there are no cta buttons', () => {
    setup();

    expect(screen.queryAllByRole('link')).toHaveLength(0);
  });

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
