import { BRAND_VARIANT } from '@blog/config';
import { Avatar } from '@blog/ui/components/atoms/avatar';
import { QUOTE_CARD_CAPTION_TEST_ID } from '@blog/ui/constants/quote-card';
import { customRender, screen, within } from '@blog/ui/testing/custom-render';
import { MOCK_PERSON_NAME } from '@blog/ui/testing/fixtures';
import { MOCK_LINK_TEST_ID, MockLink } from '@blog/ui/testing/mock-link';
import { faker } from '@faker-js/faker';
import type { AnchorHTMLAttributes, ReactNode } from 'react';

import { QuoteCard } from './quote-card';

faker.seed(123);

const NAME_TEST_ID = 'quote-card-name';
const IGNORING_LINK_TEST_ID = 'class-name-ignoring-link';
const MOCK_PERSON_INITIALS = 'JD';
const MOCK_ROLE = faker.person.jobTitle();
const MOCK_QUOTE = faker.lorem.sentence();
const MOCK_NAME = faker.person.fullName();
const MOCK_DUPLICATE_NAME = faker.person.fullName();
const MOCK_CASE_STUDY_HREF = `/case-studies/${faker.lorem.slug()}`;
const MOCK_AVATAR_SRC = faker.image.avatarGitHub();
const MOCK_TEAM_HREF = faker.internet.url();

const ClassNameIgnoringLink = ({
  href,
  children,
}: AnchorHTMLAttributes<HTMLAnchorElement>) => (
  <a href={href} data-testid={IGNORING_LINK_TEST_ID}>
    {children}
  </a>
);

const buildChildren = (name: ReactNode = <span>{MOCK_NAME}</span>) => [
  <QuoteCard.Quote key="quote">{MOCK_QUOTE}</QuoteCard.Quote>,
  <QuoteCard.Name key="name">{name}</QuoteCard.Name>,
];

const buildChildrenWithAvatar = (avatar: ReactNode) => [
  <QuoteCard.Quote key="quote">{MOCK_QUOTE}</QuoteCard.Quote>,
  <QuoteCard.Avatar key="avatar">{avatar}</QuoteCard.Avatar>,
  <QuoteCard.Name key="name">
    <span>{MOCK_PERSON_NAME}</span>
  </QuoteCard.Name>,
];

const setup = customRender(QuoteCard, {
  tone: BRAND_VARIANT.PRIMARY,
  children: buildChildren(),
});

describe(`<${QuoteCard.name}/>`, () => {
  it('renders a figure containing the quote and the name', () => {
    setup();

    const figure = screen.getByRole('figure');
    const blockquote = within(figure).getByRole('blockquote');
    const nameText = within(figure).getByText(MOCK_NAME);

    expect(blockquote).toHaveTextContent(MOCK_QUOTE);
    expect(nameText).toBeVisible();
  });

  it('renders the role text', () => {
    setup({ role: MOCK_ROLE });

    const roleText = screen.getByText(MOCK_ROLE);

    expect(roleText).toBeVisible();
  });

  describe('with the default props', () => {
    beforeEach(() => {
      setup();
    });

    it('does not render a role', () => {
      const roleText = screen.queryByText(MOCK_ROLE);

      expect(roleText).not.toBeInTheDocument();
    });

    it('renders the name as plain text when the caller supplies a span', () => {
      const link = screen.queryByRole('link');

      expect(link).not.toBeInTheDocument();
    });

    it('renders neither an image nor initials without an Avatar', () => {
      const image = screen.queryByRole('img');
      const initials = screen.queryByText(MOCK_PERSON_INITIALS);

      expect(image).not.toBeInTheDocument();
      expect(initials).not.toBeInTheDocument();
    });
  });

  describe('with a caller-supplied initials Avatar', () => {
    beforeEach(() => {
      setup({
        children: buildChildrenWithAvatar(
          <Avatar name={MOCK_PERSON_NAME} alt="" />,
        ),
      });
    });

    it('renders the Avatar with its initials fallback', () => {
      const image = screen.queryByRole('img');
      const initials = screen.getByText(MOCK_PERSON_INITIALS);

      expect(image).not.toBeInTheDocument();
      expect(initials).toBeVisible();
    });

    it('announces the quoted person once beside the Avatar', () => {
      const personNames = screen.getAllByText(MOCK_PERSON_NAME);

      expect(personNames).toHaveLength(1);
    });
  });

  it('renders the caller-supplied Avatar image when given a src', () => {
    setup({
      children: buildChildrenWithAvatar(
        <Avatar name={MOCK_PERSON_NAME} alt="" src={MOCK_AVATAR_SRC} />,
      ),
    });

    const avatarImage = screen.getByRole('presentation');

    expect(avatarImage).toHaveAttribute('src', MOCK_AVATAR_SRC);
  });

  it('renders the name as a link with the attributes the caller supplies', () => {
    setup({
      children: buildChildren(
        <a href={MOCK_TEAM_HREF} target="_blank" rel="noopener noreferrer">
          {MOCK_NAME}
        </a>,
      ),
    });

    const link = screen.getByRole('link', { name: MOCK_NAME });

    expect(link).toHaveAttribute('href', MOCK_TEAM_HREF);
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('renders a caller-supplied link component inside the name', () => {
    setup({
      children: buildChildren(
        <MockLink href={MOCK_CASE_STUDY_HREF}>{MOCK_NAME}</MockLink>,
      ),
    });

    const mockLink = screen.getByTestId(MOCK_LINK_TEST_ID);

    expect(mockLink).toBeVisible();
  });

  it('wraps a link that ignores className in its own focus element', () => {
    setup({
      children: [
        <QuoteCard.Quote key="quote">{MOCK_QUOTE}</QuoteCard.Quote>,
        <QuoteCard.Name key="name" dataTestId={NAME_TEST_ID}>
          <ClassNameIgnoringLink href={MOCK_CASE_STUDY_HREF}>
            {MOCK_NAME}
          </ClassNameIgnoringLink>
        </QuoteCard.Name>,
      ],
    });

    const wrapper = screen.getByTestId(NAME_TEST_ID);
    const link = within(wrapper).getByTestId(IGNORING_LINK_TEST_ID);

    expect(link).toBeVisible();
  });

  it('keeps the figcaption last, ahead of unmatched duplicate slot content', () => {
    setup({
      children: [
        ...buildChildren(),
        <QuoteCard.Name key="duplicate">
          <span>{MOCK_DUPLICATE_NAME}</span>
        </QuoteCard.Name>,
      ],
    });

    const caption = screen.getByTestId(QUOTE_CARD_CAPTION_TEST_ID);
    const unmatched = screen.getByText(MOCK_DUPLICATE_NAME);
    const captionNameText = within(caption).queryByText(MOCK_DUPLICATE_NAME);

    expect(captionNameText).not.toBeInTheDocument();
    expect(unmatched.compareDocumentPosition(caption)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });
});
