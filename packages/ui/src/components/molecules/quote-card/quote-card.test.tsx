import { BRAND_VARIANT } from '@blog/config';
import { Avatar } from '@blog/ui/components/atoms/avatar';
import { customRender, screen, within } from '@blog/ui/testing/custom-render';
import { faker } from '@faker-js/faker';
import type { ReactNode } from 'react';

import { QuoteCard } from './quote-card';

faker.seed(123);

const buildChildren = ({
  quote = faker.lorem.sentence(),
  name = faker.person.fullName(),
}: {
  quote?: string;
  name?: string;
} = {}) => [
  <QuoteCard.Quote key="quote">{quote}</QuoteCard.Quote>,
  <QuoteCard.Name key="name">
    <span>{name}</span>
  </QuoteCard.Name>,
];

const buildChildrenWithAvatar = (avatar: ReactNode) => [
  <QuoteCard.Quote key="quote">{faker.lorem.sentence()}</QuoteCard.Quote>,
  <QuoteCard.Avatar key="avatar">{avatar}</QuoteCard.Avatar>,
  <QuoteCard.Name key="name">
    <span>Ada Lovelace</span>
  </QuoteCard.Name>,
];

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

const buildChildrenWithCustomLink = (nameProps?: { dataTestId?: string }) => [
  <QuoteCard.Quote key="quote">{faker.lorem.sentence()}</QuoteCard.Quote>,
  <QuoteCard.Name key="name" dataTestId={nameProps?.dataTestId}>
    <CustomLink href="/case-studies/ada">{faker.person.fullName()}</CustomLink>
  </QuoteCard.Name>,
];

const setup = customRender(QuoteCard, {
  tone: BRAND_VARIANT.PRIMARY,
  children: buildChildren(),
});

describe(`<${QuoteCard.name}/>`, () => {
  it('renders a figure containing the quote and the name', () => {
    const quote = faker.lorem.sentence();
    const name = faker.person.fullName();
    setup({ children: buildChildren({ quote, name }) });

    const figure = screen.getByRole('figure');
    expect(within(figure).getByText(quote)).toBeVisible();
    expect(within(figure).getByText(name)).toBeVisible();
  });

  it('renders the quote slot content inside the blockquote', () => {
    const quote = faker.lorem.sentence();
    setup({ children: buildChildren({ quote }) });

    expect(screen.getByRole('blockquote')).toHaveTextContent(quote);
  });

  it('renders the role text when provided', () => {
    setup({ role: 'Head of Product' });
    expect(screen.getByText('Head of Product')).toBeVisible();
  });

  it('does not render a role element when omitted', () => {
    setup();
    expect(screen.queryByText(/head of/i)).not.toBeInTheDocument();
  });

  it('renders the caller-supplied Avatar with its initials fallback', () => {
    setup({
      children: buildChildrenWithAvatar(
        <Avatar name="Ada Lovelace" alt="Ada Lovelace" />,
      ),
    });
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByText('AL')).toBeInTheDocument();
  });

  it('renders the caller-supplied Avatar image when given a src', () => {
    setup({
      children: buildChildrenWithAvatar(
        <Avatar
          name="Ada Lovelace"
          alt="Ada Lovelace"
          src="https://example.com/avatar.jpg"
        />,
      ),
    });
    expect(screen.getByRole('img')).toHaveAttribute(
      'src',
      'https://example.com/avatar.jpg',
    );
  });

  it('renders neither an image nor initials when QuoteCard.Avatar is omitted', () => {
    setup();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.queryByText('AL')).not.toBeInTheDocument();
  });

  it('renders the name as plain text, not a link, when the caller supplies a span', () => {
    setup({
      children: [
        <QuoteCard.Quote key="quote">{faker.lorem.sentence()}</QuoteCard.Quote>,
        <QuoteCard.Name key="name">
          <span>{faker.person.fullName()}</span>
        </QuoteCard.Name>,
      ],
    });
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('renders the name as a link with whatever attributes the caller supplies', () => {
    const name = faker.person.fullName();
    setup({
      children: [
        <QuoteCard.Quote key="quote">{faker.lorem.sentence()}</QuoteCard.Quote>,
        <QuoteCard.Name key="name">
          <a
            href="https://example.com/team/ada"
            target="_blank"
            rel="noopener noreferrer"
          >
            {name}
          </a>
        </QuoteCard.Name>,
      ],
    });

    const link = screen.getByRole('link', { name });
    expect(link).toHaveAttribute('href', 'https://example.com/team/ada');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('renders a caller-supplied custom link component inside QuoteCard.Name', () => {
    setup({ children: buildChildrenWithCustomLink() });
    expect(screen.getByTestId('custom-link')).toBeVisible();
  });

  it('wraps a custom link component that ignores className in its own focus-treatment element, instead of relying on the child to forward it', () => {
    setup({
      children: buildChildrenWithCustomLink({ dataTestId: 'quote-card-name' }),
    });
    const wrapper = screen.getByTestId('quote-card-name');
    const link = screen.getByTestId('custom-link');
    expect(link.parentElement).toBe(wrapper);
  });

  it('keeps figcaption as the last child of the figure even when duplicate slot content is unmatched', () => {
    setup({
      children: [
        <QuoteCard.Quote key="quote">{faker.lorem.sentence()}</QuoteCard.Quote>,
        <QuoteCard.Name key="name1">
          <span>{faker.person.fullName()}</span>
        </QuoteCard.Name>,
        <QuoteCard.Name key="name2">
          <span>{faker.person.fullName()}</span>
        </QuoteCard.Name>,
      ],
    });
    const figure = screen.getByRole('figure');
    const figcaption = figure.querySelector('figcaption');
    expect(figure.lastElementChild).toBe(figcaption);
  });

  it('forwards data-testid to the root element', () => {
    setup({ dataTestId: 'quote-card' });
    expect(screen.getByTestId('quote-card')).toBeVisible();
  });
});
