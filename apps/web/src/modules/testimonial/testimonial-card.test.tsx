import { BRAND_VARIANT } from '@blog/config';
import { customRender, screen } from '@web/testing/custom-render';
import { makeSanityImage } from '@web/testing/modules/hero/fixtures';
import { makeTestimonialItem } from '@web/testing/modules/testimonial/fixtures';
import { SmartLinkMock } from '@web/testing/shared/smart-link/smart-link-mock';

import { TestimonialCard } from './testimonial-card';

vi.mock('@web/components/shared/smart-link', () => ({
  SmartLink: SmartLinkMock,
}));

const item = makeTestimonialItem();

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
      expect(
        screen.getByText(item.name, { ignore: '.sr-only' }),
      ).toBeInTheDocument();
      expect(screen.getByText(item.role!)).toBeInTheDocument();
    });

    it('renders the initials, never an empty avatar, when the item has no image', () => {
      expect(screen.queryByRole('img')).not.toBeInTheDocument();
      expect(screen.getByText('JR')).toBeInTheDocument();
    });

    it('renders no link when the item has none', () => {
      expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });
  });

  it('renders the image over the initials when the item has one', () => {
    setup({ item: makeTestimonialItem({ image: makeSanityImage() }) });

    expect(screen.getByRole('img')).toBeInTheDocument();
    expect(screen.queryByText('JR')).not.toBeInTheDocument();
  });

  it('links the name and forwards target to the anchor when the item link opens in a new tab', () => {
    setup({
      item: makeTestimonialItem({
        link: {
          label: 'Visit site',
          href: 'https://example.com',
          target: '_blank',
          platform: undefined,
          ariaLabel: undefined,
        },
      }),
    });

    const link = screen.getByRole('link', { name: item.name });
    expect(link).toHaveAttribute('href', 'https://example.com');
    expect(link).toHaveAttribute('target', '_blank');
  });
});
