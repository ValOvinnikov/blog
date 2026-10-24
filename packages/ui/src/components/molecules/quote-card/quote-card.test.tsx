import { BRAND_VARIANT } from '@blog/config';
import { Avatar } from '@blog/ui/components/atoms/avatar';
import { QUOTE_CARD_CAPTION_TEST_ID } from '@blog/ui/constants/quote-card';
import { customRender, screen, within } from '@blog/ui/testing/custom-render';
import { MOCK_LINK_TEST_ID, MockLink } from '@blog/ui/testing/mock-link';
import { faker } from '@faker-js/faker';
import type { AnchorHTMLAttributes, ReactNode } from 'react';

import { QuoteCard } from './quote-card';

const ROLE = 'Head of Product';
const NAME_TEST_ID = 'quote-card-name';
const IGNORING_LINK_TEST_ID = 'class-name-ignoring-link';
const CASE_STUDY_HREF = '/case-studies/ada';
const AVATAR_NAME = 'Ada Lovelace';
const AVATAR_INITIALS = 'AL';
const AVATAR_SRC = 'https://example.com/avatar.jpg';
const TEAM_HREF = 'https://example.com/team/ada';

const ClassNameIgnoringLink = ({
  href,
  children,
}: AnchorHTMLAttributes<HTMLAnchorElement>) => (
  <a href={href} data-testid={IGNORING_LINK_TEST_ID}>
    {children}
  </a>
);

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
    <span>{AVATAR_NAME}</span>
  </QuoteCard.Name>,
];

const buildChildrenWithMockLink = () => [
  <QuoteCard.Quote key="quote">{faker.lorem.sentence()}</QuoteCard.Quote>,
  <QuoteCard.Name key="name">
    <MockLink href={CASE_STUDY_HREF}>{faker.person.fullName()}</MockLink>
  </QuoteCard.Name>,
];

const buildChildrenWithClassNameIgnoringLink = () => [
  <QuoteCard.Quote key="quote">{faker.lorem.sentence()}</QuoteCard.Quote>,
  <QuoteCard.Name key="name" dataTestId={NAME_TEST_ID}>
    <ClassNameIgnoringLink href={CASE_STUDY_HREF}>
      {faker.person.fullName()}
    </ClassNameIgnoringLink>
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
    const quoteText = within(figure).getByText(quote);
    const nameText = within(figure).getByText(name);
    expect(quoteText).toBeVisible();
    expect(nameText).toBeVisible();
  });

  it('renders the quote slot content inside the blockquote', () => {
    setup({ children: buildChildren({ quote }) });

    const blockquote = screen.getByRole('blockquote');
    expect(blockquote).toHaveTextContent(quote);
  });

  it('renders the role text when provided', () => {
    setup({ role: ROLE });
    const roleText = screen.getByText(ROLE);
    expect(roleText).toBeVisible();
  });

  describe('with the default props', () => {
    beforeEach(() => {
      setup();
    });

    it('does not render a role element when omitted', () => {
      const roleText = screen.queryByText(/head of/i);
      expect(roleText).not.toBeInTheDocument();
    });

    it('renders the name as plain text, not a link, when the caller supplies a span', () => {
      const link = screen.queryByRole('link');
      expect(link).not.toBeInTheDocument();
    });

    it('renders neither an image nor initials when QuoteCard.Avatar is omitted', () => {
      const image = screen.queryByRole('img');
      const initials = screen.queryByText(AVATAR_INITIALS);
      expect(image).not.toBeInTheDocument();
      expect(initials).not.toBeInTheDocument();
    });
  });

  describe('with a caller-supplied initials Avatar', () => {
    beforeEach(() => {
      setup({
        children: buildChildrenWithAvatar(<Avatar name={AVATAR_NAME} alt="" />),
      });
    });

    it('renders the caller-supplied Avatar with its initials fallback', () => {
      const image = screen.queryByRole('img');
      const initials = screen.getByText(AVATAR_INITIALS);
      expect(image).not.toBeInTheDocument();
      expect(initials).toBeVisible();
    });

    it('announces the quoted person once beside the caller-supplied Avatar', () => {
      const personNames = screen.getAllByText(AVATAR_NAME);
      expect(personNames).toHaveLength(1);
    });
  });

  it('renders the caller-supplied Avatar image when given a src', () => {
    setup({
      children: buildChildrenWithAvatar(
        <Avatar name={AVATAR_NAME} alt="" src={AVATAR_SRC} />,
      ),
    });
    const avatarImage = screen.getByRole('presentation');
    expect(avatarImage).toHaveAttribute('src', AVATAR_SRC);
  });

  it('renders the name as a link with whatever attributes the caller supplies', () => {
    setup({
      children: [
        <QuoteCard.Quote key="quote">{faker.lorem.sentence()}</QuoteCard.Quote>,
        <QuoteCard.Name key="name">
          <a href={TEAM_HREF} target="_blank" rel="noopener noreferrer">
            {name}
          </a>
        </QuoteCard.Name>,
      ],
    });

    const link = screen.getByRole('link', { name });
    expect(link).toHaveAttribute('href', TEAM_HREF);
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('renders a caller-supplied custom link component inside QuoteCard.Name', () => {
    setup({ children: buildChildrenWithMockLink() });
    const mockLink = screen.getByTestId(MOCK_LINK_TEST_ID);
    expect(mockLink).toBeVisible();
  });

  it('wraps a link that ignores className in its own focus element', () => {
    setup({ children: buildChildrenWithClassNameIgnoringLink() });
    const wrapper = screen.getByTestId(NAME_TEST_ID);
    const link = within(wrapper).getByTestId(IGNORING_LINK_TEST_ID);
    expect(link).toBeVisible();
  });

  it('renders unmatched duplicate slot content before the figcaption, keeping it last', () => {
    const duplicateName = faker.person.fullName();
    setup({
      children: [
        <QuoteCard.Quote key="quote">{faker.lorem.sentence()}</QuoteCard.Quote>,
        <QuoteCard.Name key="name1">
          <span>{name}</span>
        </QuoteCard.Name>,
        <QuoteCard.Name key="name2">
          <span>{duplicateName}</span>
        </QuoteCard.Name>,
      ],
    });
    const caption = screen.getByTestId(QUOTE_CARD_CAPTION_TEST_ID);
    const unmatched = screen.getByText(duplicateName);
    const captionNameText = within(caption).queryByText(duplicateName);
    expect(captionNameText).not.toBeInTheDocument();
    expect(unmatched.compareDocumentPosition(caption)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });
});
