import { BRAND_VARIANT } from '@blog/config';
import { Avatar } from '@blog/ui/atoms/avatar';
import { renderElement, screen } from '@blog/ui/testing/custom-render';
import { faker } from '@faker-js/faker';
import type { ReactNode } from 'react';

import { QuoteCard } from './quote-card';

faker.seed(123);

describe(`<${QuoteCard.name}/>`, () => {
  it('renders a figure containing a blockquote and a figcaption', () => {
    const quote = faker.lorem.sentence();
    const name = faker.person.fullName();
    const { container } = renderElement(
      <QuoteCard quote={quote} tone={BRAND_VARIANT.PRIMARY}>
        <QuoteCard.Name>
          <span>{name}</span>
        </QuoteCard.Name>
      </QuoteCard>,
    );

    const figure = screen.getByRole('figure');
    const blockquote = container.querySelector('blockquote');
    const figcaption = container.querySelector('figcaption');

    expect(figure).toContainElement(blockquote);
    expect(figure).toContainElement(figcaption);
    expect(blockquote).toHaveTextContent(quote);
  });

  it('renders the role text when provided', () => {
    renderElement(
      <QuoteCard
        quote={faker.lorem.sentence()}
        tone={BRAND_VARIANT.PRIMARY}
        role="Head of Product"
      >
        <QuoteCard.Name>
          <span>{faker.person.fullName()}</span>
        </QuoteCard.Name>
      </QuoteCard>,
    );
    expect(screen.getByText('Head of Product')).toBeVisible();
  });

  it('does not render a role element when omitted', () => {
    renderElement(
      <QuoteCard quote={faker.lorem.sentence()} tone={BRAND_VARIANT.PRIMARY}>
        <QuoteCard.Name>
          <span>{faker.person.fullName()}</span>
        </QuoteCard.Name>
      </QuoteCard>,
    );
    expect(screen.queryByText(/head of/i)).not.toBeInTheDocument();
  });

  it('renders the caller-supplied Avatar with its initials fallback', () => {
    renderElement(
      <QuoteCard quote={faker.lorem.sentence()} tone={BRAND_VARIANT.PRIMARY}>
        <QuoteCard.Avatar>
          <Avatar name="Ada Lovelace" alt="Ada Lovelace" />
        </QuoteCard.Avatar>
        <QuoteCard.Name>
          <span>Ada Lovelace</span>
        </QuoteCard.Name>
      </QuoteCard>,
    );
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByText('AL')).toBeInTheDocument();
  });

  it('renders the caller-supplied Avatar image when given a src', () => {
    renderElement(
      <QuoteCard quote={faker.lorem.sentence()} tone={BRAND_VARIANT.PRIMARY}>
        <QuoteCard.Avatar>
          <Avatar
            name="Ada Lovelace"
            alt="Ada Lovelace"
            src="https://example.com/avatar.jpg"
          />
        </QuoteCard.Avatar>
        <QuoteCard.Name>
          <span>Ada Lovelace</span>
        </QuoteCard.Name>
      </QuoteCard>,
    );
    expect(screen.getByRole('img')).toHaveAttribute(
      'src',
      'https://example.com/avatar.jpg',
    );
  });

  it('renders neither an image nor initials when QuoteCard.Avatar is omitted', () => {
    renderElement(
      <QuoteCard quote={faker.lorem.sentence()} tone={BRAND_VARIANT.PRIMARY}>
        <QuoteCard.Name>
          <span>Ada Lovelace</span>
        </QuoteCard.Name>
      </QuoteCard>,
    );
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.queryByText('AL')).not.toBeInTheDocument();
  });

  it('renders the name as plain text, not a link, when the caller supplies a span', () => {
    renderElement(
      <QuoteCard quote={faker.lorem.sentence()} tone={BRAND_VARIANT.PRIMARY}>
        <QuoteCard.Name>
          <span>{faker.person.fullName()}</span>
        </QuoteCard.Name>
      </QuoteCard>,
    );
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('renders the name as a link with whatever attributes the caller supplies', () => {
    const name = faker.person.fullName();
    renderElement(
      <QuoteCard quote={faker.lorem.sentence()} tone={BRAND_VARIANT.PRIMARY}>
        <QuoteCard.Name>
          <a
            href="https://example.com/team/ada"
            target="_blank"
            rel="noopener noreferrer"
          >
            {name}
          </a>
        </QuoteCard.Name>
      </QuoteCard>,
    );

    const link = screen.getByRole('link', { name });
    expect(link).toHaveAttribute('href', 'https://example.com/team/ada');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('renders a caller-supplied custom link component inside QuoteCard.Name', () => {
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
    renderElement(
      <QuoteCard quote={faker.lorem.sentence()} tone={BRAND_VARIANT.PRIMARY}>
        <QuoteCard.Name>
          <CustomLink href="/case-studies/ada">
            {faker.person.fullName()}
          </CustomLink>
        </QuoteCard.Name>
      </QuoteCard>,
    );
    expect(screen.getByTestId('custom-link')).toBeVisible();
  });

  it('forwards data-testid to the root element', () => {
    renderElement(
      <QuoteCard
        quote={faker.lorem.sentence()}
        tone={BRAND_VARIANT.PRIMARY}
        dataTestId="quote-card"
      >
        <QuoteCard.Name>
          <span>{faker.person.fullName()}</span>
        </QuoteCard.Name>
      </QuoteCard>,
    );
    expect(screen.getByTestId('quote-card')).toBeVisible();
  });
});
