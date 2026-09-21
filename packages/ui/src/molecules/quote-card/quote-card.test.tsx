import { customRender, screen } from '@blog/ui/testing/custom-render';
import { faker } from '@faker-js/faker';
import type { ReactNode } from 'react';

import { QuoteCard } from './quote-card';

faker.seed(123);

const setup = customRender(QuoteCard, {
  quote: faker.lorem.sentence(),
  name: faker.person.fullName(),
});

describe(`<${QuoteCard.name}/>`, () => {
  it('renders a figure containing a blockquote and a figcaption', () => {
    const quote = faker.lorem.sentence();
    const { container } = setup({ quote });

    const figure = screen.getByRole('figure');
    const blockquote = container.querySelector('blockquote');
    const figcaption = container.querySelector('figcaption');

    expect(figure).toContainElement(blockquote);
    expect(figure).toContainElement(figcaption);
    expect(blockquote).toHaveTextContent(quote);
  });

  it('renders the role text when provided', () => {
    setup({ role: 'Head of Product' });
    expect(screen.getByText('Head of Product')).toBeVisible();
  });

  it('does not render a role element when omitted', () => {
    setup({ role: undefined });
    expect(screen.queryByText(/head of/i)).not.toBeInTheDocument();
  });

  it('shows the initials fallback via Avatar when no avatarSrc is given', () => {
    setup({ name: 'Ada Lovelace', avatarSrc: undefined });
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByText('AL')).toBeInTheDocument();
  });

  it('renders the avatar image when avatarSrc is given', () => {
    setup({ avatarSrc: 'https://example.com/avatar.jpg' });
    expect(screen.getByRole('img')).toHaveAttribute(
      'src',
      'https://example.com/avatar.jpg',
    );
  });

  it('renders neither an image nor initials when hasAvatar is false', () => {
    setup({
      name: 'Ada Lovelace',
      hasAvatar: false,
      avatarSrc: 'https://example.com/avatar.jpg',
    });
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.queryByText('AL')).not.toBeInTheDocument();
  });

  it('renders the name as plain text, not a link, when no href is given', () => {
    setup({ href: undefined });
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('renders the name as a link to href when href is given', () => {
    const name = faker.person.fullName();
    setup({ name, href: 'https://example.com/team/ada' });

    const link = screen.getByRole('link', { name });
    expect(link).toHaveAttribute('href', 'https://example.com/team/ada');
  });

  it('renders the link via linkAs when provided', () => {
    const CustomLink = ({
      href,
      children,
    }: {
      href: string;
      children?: ReactNode;
    }) => (
      <a href={href} data-testid="custom-link">
        {children}
      </a>
    );
    setup({ href: '/case-studies/ada', linkAs: CustomLink });
    expect(screen.getByTestId('custom-link')).toBeVisible();
  });

  it('forwards data-testid to the root element', () => {
    setup({ dataTestId: 'quote-card' });
    expect(screen.getByTestId('quote-card')).toBeVisible();
  });
});
