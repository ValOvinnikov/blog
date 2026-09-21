import { BRAND_VARIANT } from '@blog/config';
import { customRender, screen } from '@web/testing/custom-render';
import { makeTestimonialCardItem } from '@web/testing/modules/testimonial/fixtures';
import { SmartLinkMock } from '@web/testing/shared/smart-link/smart-link-mock';

import { TestimonialCard } from './testimonial-card';

vi.mock('@web/components/shared/smart-link', () => ({
  SmartLink: SmartLinkMock,
}));

const item = makeTestimonialCardItem();

const setup = customRender(TestimonialCard, {
  item,
  align: 'left',
  tone: BRAND_VARIANT.PRIMARY,
});

describe(`<${TestimonialCard.name}/>`, () => {
  it('renders the quote and the name', () => {
    setup();

    expect(screen.getByText(item.quote)).toBeInTheDocument();
    expect(screen.getAllByText(item.name).length).toBeGreaterThan(0);
  });

  it('renders initials when there is no avatarSrc', () => {
    setup();

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByText('AL')).toBeInTheDocument();
  });

  it('renders the avatar image when avatarSrc is given', () => {
    setup({
      item: makeTestimonialCardItem({
        avatarSrc: 'https://cdn.example.com/ada-112.jpg',
      }),
    });

    expect(screen.getByRole('img')).toHaveAttribute(
      'src',
      'https://cdn.example.com/ada-112.jpg',
    );
  });

  it('renders no link when the item has none', () => {
    setup();

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('links the name through SmartLink when the item has a link', () => {
    setup({
      item: makeTestimonialCardItem({
        link: {
          label: 'Read the case study',
          href: '/case-studies/ada',
          target: undefined,
          platform: undefined,
          ariaLabel: undefined,
        },
      }),
    });

    const link = screen.getByRole('link', { name: item.name });
    expect(link).toHaveAttribute('href', '/case-studies/ada');
  });

  it('forwards the link target to SmartLink when the item opens in a new tab', () => {
    setup({
      item: makeTestimonialCardItem({
        link: {
          label: 'Read the case study',
          href: '/case-studies/ada',
          target: '_blank',
          platform: undefined,
          ariaLabel: undefined,
        },
      }),
    });

    const link = screen.getByRole('link', { name: item.name });
    expect(link).toHaveAttribute('target', '_blank');
  });
});
