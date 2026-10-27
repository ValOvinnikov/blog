import { BRAND_VARIANT } from '@blog/config';
import { faker } from '@faker-js/faker';
import { customRender, screen } from '@web/testing/custom-render';
import { mockSanityImage } from '@web/testing/modules/hero/fixtures';
import {
  MOCK_TESTIMONIAL_QUOTE,
  MOCK_TESTIMONIAL_ROLE,
  mockTestimonialItem,
} from '@web/testing/modules/testimonial/fixtures';

import { TestimonialCard } from './testimonial-card';

vi.mock('@web/i18n/navigation');

faker.seed(21);

const MOCK_ITEM = mockTestimonialItem();
const MEMBER_INITIALS = 'JR';

const MOCK_NEW_TAB_LINK = {
  label: faker.company.name(),
  href: faker.internet.url(),
  target: '_blank',
  platform: undefined,
  ariaLabel: undefined,
} as const;

const setup = customRender(TestimonialCard, {
  item: MOCK_ITEM,
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

      expect(quote).toHaveTextContent(MOCK_TESTIMONIAL_QUOTE);
    });

    it('renders the name and role', () => {
      const name = screen.getByText(MOCK_ITEM.name, { ignore: '.sr-only' });
      const role = screen.getByText(MOCK_TESTIMONIAL_ROLE);

      expect(name).toBeVisible();
      expect(role).toBeVisible();
    });

    it('renders the initials, never an empty avatar', () => {
      const image = screen.queryByRole('img');
      const initials = screen.getByText(MEMBER_INITIALS);

      expect(image).not.toBeInTheDocument();
      expect(initials).toBeVisible();
    });

    it('renders no link', () => {
      const link = screen.queryByRole('link');

      expect(link).not.toBeInTheDocument();
    });
  });

  it('renders the image over the initials when the item has one', () => {
    setup({ item: mockTestimonialItem({ image: mockSanityImage() }) });

    const image = screen.getByRole('img');
    const initials = screen.queryByText(MEMBER_INITIALS);

    expect(image).toBeVisible();
    expect(initials).not.toBeInTheDocument();
  });

  it('links the name and opens it in a new tab when the link asks to', () => {
    setup({ item: mockTestimonialItem({ link: MOCK_NEW_TAB_LINK }) });

    const link = screen.getByRole('link', { name: MOCK_ITEM.name });

    expect(link).toHaveAttribute('href', MOCK_NEW_TAB_LINK.href);
    expect(link).toHaveAttribute('target', MOCK_NEW_TAB_LINK.target);
  });
});
