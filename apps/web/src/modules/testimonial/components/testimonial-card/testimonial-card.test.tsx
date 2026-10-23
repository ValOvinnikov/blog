import { BRAND_VARIANT } from '@blog/config';
import { customRender, screen } from '@web/testing/custom-render';
import { mockSanityImage } from '@web/testing/modules/hero/fixtures';
import { mockTestimonialItem } from '@web/testing/modules/testimonial/fixtures';

import { TestimonialCard } from './testimonial-card';

vi.mock('@web/i18n/navigation');

const item = mockTestimonialItem();

const NEW_TAB_LINK = {
  label: 'Visit site',
  href: 'https://example.com',
  target: '_blank',
  platform: undefined,
  ariaLabel: undefined,
} as const;

const setup = customRender(TestimonialCard, {
  item,
  align: 'left',
  tone: BRAND_VARIANT.PRIMARY,
});

describe(`<${TestimonialCard.name}/>`, () => {
  describe('a testimonial with no image or link', () => {
    beforeEach(() => {
      setup();
    });

    it("renders the quote's portable text as a blockquote", () => {
      const quote = screen.getByRole('blockquote');
      expect(quote).toHaveTextContent(
        'This product changed how our team ships.',
      );
    });

    it('renders the name and role', () => {
      const name = screen.getByText(item.name, { ignore: '.sr-only' });
      const role = screen.getByText(item.role!);
      expect(name).toBeVisible();
      expect(role).toBeVisible();
    });

    it('renders the initials, never an empty avatar, without an image', () => {
      const image = screen.queryByRole('img');
      const initials = screen.getByText('JR');
      expect(image).not.toBeInTheDocument();
      expect(initials).toBeVisible();
    });

    it('renders no link when the item has none', () => {
      const link = screen.queryByRole('link');
      expect(link).not.toBeInTheDocument();
    });
  });

  it('renders the image over the initials when the item has one', () => {
    setup({ item: mockTestimonialItem({ image: mockSanityImage() }) });

    const image = screen.getByRole('img');
    const initials = screen.queryByText('JR');
    expect(image).toBeVisible();
    expect(initials).not.toBeInTheDocument();
  });

  it('links the name and opens it in a new tab when the link asks to', () => {
    setup({
      item: mockTestimonialItem({
        link: NEW_TAB_LINK,
      }),
    });

    const link = screen.getByRole('link', { name: item.name });
    expect(link).toHaveAttribute('href', NEW_TAB_LINK.href);
    expect(link).toHaveAttribute('target', NEW_TAB_LINK.target);
  });
});
