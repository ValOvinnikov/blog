import { BRAND_VARIANT } from '@blog/config';
import { Avatar } from '@blog/ui/components/atoms/avatar';
import { customRender, screen, within } from '@blog/ui/testing/custom-render';
import { MOCK_LINK_TEST_ID, MockLink } from '@blog/ui/testing/mock-link';
import { faker } from '@faker-js/faker';
import type { ReactNode } from 'react';

import { QuoteCard } from './quote-card';

const ROLE = 'Head of Product';
const NAME_TEST_ID = 'quote-card-name';
const QUOTE_CARD_TEST_ID = 'quote-card';

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

const buildChildrenWithMockLink = (nameProps?: { dataTestId?: string }) => [
  <QuoteCard.Quote key="quote">{faker.lorem.sentence()}</QuoteCard.Quote>,
  <QuoteCard.Name key="name" dataTestId={nameProps?.dataTestId}>
    <MockLink href="/case-studies/ada">{faker.person.fullName()}</MockLink>
  </QuoteCard.Name>,
];

const setup = customRender(QuoteCard, {
  tone: BRAND_VARIANT.PRIMARY,
  children: buildChildren(),
});

describe(`<${QuoteCard.name}/>`, () => {
  let quote: string;
  let name: string;

  beforeEach(() => {
    quote = faker.lorem.sentence();
    name = faker.person.fullName();
  });

  it('renders a figure containing the quote and the name', () => {
    setup({ children: buildChildren({ quote, name }) });

    const figure = screen.getByRole('figure');
    expect(within(figure).getByText(quote)).toBeVisible();
    expect(within(figure).getByText(name)).toBeVisible();
  });

  it('renders the quote slot content inside the blockquote', () => {
    setup({ children: buildChildren({ quote }) });

    expect(screen.getByRole('blockquote')).toHaveTextContent(quote);
  });

  it('renders the role text when provided', () => {
    setup({ role: ROLE });
    expect(screen.getByText(ROLE)).toBeVisible();
  });

  describe('with the default props', () => {
    beforeEach(() => {
      setup();
    });

    it('does not render a role element when omitted', () => {
      expect(screen.queryByText(/head of/i)).not.toBeInTheDocument();
    });

    it('renders neither an image nor initials when QuoteCard.Avatar is omitted', () => {
      expect(screen.queryByRole('img')).not.toBeInTheDocument();
      expect(screen.queryByText('AL')).not.toBeInTheDocument();
    });
  });

  describe('with a caller-supplied initials Avatar', () => {
    beforeEach(() => {
      setup({
        children: buildChildrenWithAvatar(
          <Avatar name="Ada Lovelace" alt="" />,
        ),
      });
    });

    it('renders the caller-supplied Avatar with its initials fallback', () => {
      expect(screen.queryByRole('img')).not.toBeInTheDocument();
      expect(screen.getByText('AL')).toBeVisible();
    });

    it('announces the quoted person once beside the caller-supplied Avatar', () => {
      expect(screen.getAllByText('Ada Lovelace')).toHaveLength(1);
    });
  });

  it('renders the caller-supplied Avatar image when given a src', () => {
    setup({
      children: buildChildrenWithAvatar(
        <Avatar
          name="Ada Lovelace"
          alt=""
          src="https://example.com/avatar.jpg"
        />,
      ),
    });
    expect(screen.getByRole('presentation')).toHaveAttribute(
      'src',
      'https://example.com/avatar.jpg',
    );
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
    setup({ children: buildChildrenWithMockLink() });
    expect(screen.getByTestId(MOCK_LINK_TEST_ID)).toBeVisible();
  });

  it('wraps a custom link component in its own focus-treatment element', () => {
    setup({
      children: buildChildrenWithMockLink({ dataTestId: NAME_TEST_ID }),
    });
    const wrapper = screen.getByTestId(NAME_TEST_ID);
    const link = screen.getByTestId(MOCK_LINK_TEST_ID);
    expect(link.parentElement).toBe(wrapper);
  });

  it('keeps figcaption last in the figure when duplicate slot content is unmatched', () => {
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
    setup({ dataTestId: QUOTE_CARD_TEST_ID });
    expect(screen.getByTestId(QUOTE_CARD_TEST_ID)).toBeVisible();
  });
});
