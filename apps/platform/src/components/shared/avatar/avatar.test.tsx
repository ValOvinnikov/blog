import { faker } from '@faker-js/faker';
import {
  AVATAR_UNKNOWN_INITIAL,
  AVATAR_VARIANT,
} from '@platform/constants/avatar';
import { ARIA_HIDDEN } from '@platform/testing/aria';
import { customRender, screen } from '@platform/testing/custom-render';

import { Avatar } from './avatar';

faker.seed(5995);

const AVATAR_TEST_ID = 'avatar';

const MOCK_FIRST_NAME = faker.person.firstName();
const MOCK_MIDDLE_NAME = faker.person.middleName();
const MOCK_LAST_NAME = faker.person.lastName();
const MOCK_FULL_NAME = `${MOCK_FIRST_NAME} ${MOCK_LAST_NAME}`;
const MOCK_EMAIL = faker.internet.email({ firstName: MOCK_LAST_NAME });
const MOCK_INITIALS =
  `${MOCK_FIRST_NAME.charAt(0)}${MOCK_LAST_NAME.charAt(0)}`.toUpperCase();
const MOCK_PUNCTUATION_ONLY_NAME = '!!!';

const setup = customRender(Avatar, {
  name: MOCK_FULL_NAME,
  variant: AVATAR_VARIANT.TABLE,
});

describe(`<${Avatar.name}/>`, () => {
  it.each([
    ['a first and last name', MOCK_FULL_NAME, MOCK_INITIALS],
    [
      'a name with a middle name',
      `${MOCK_FIRST_NAME} ${MOCK_MIDDLE_NAME} ${MOCK_LAST_NAME}`,
      MOCK_INITIALS,
    ],
    ['a lowercase name', MOCK_FULL_NAME.toLowerCase(), MOCK_INITIALS],
    [
      'a name padded with extra whitespace',
      `  ${MOCK_FIRST_NAME}    ${MOCK_LAST_NAME}  `,
      MOCK_INITIALS,
    ],
    [
      'a single-word name',
      MOCK_LAST_NAME,
      MOCK_LAST_NAME.slice(0, 2).toUpperCase(),
    ],
    [
      'a name with a bracketed word',
      `${MOCK_FIRST_NAME} (${MOCK_LAST_NAME})`,
      MOCK_INITIALS,
    ],
    [
      'a name with a standalone dash',
      `${MOCK_FIRST_NAME} — ${MOCK_LAST_NAME}`,
      MOCK_INITIALS,
    ],
    [
      'a single bracketed word',
      `(${MOCK_LAST_NAME})`,
      MOCK_LAST_NAME.slice(0, 2).toUpperCase(),
    ],
  ])('renders initials for %s', (_case, name, expected) => {
    setup({ name });

    const initials = screen.getByText(expected);

    expect(initials).toBeVisible();
  });

  it('shows a question mark with neither a name nor an email', () => {
    setup({ name: '' });

    const avatar = screen.getByTestId(AVATAR_TEST_ID);

    expect(avatar).toHaveTextContent(AVATAR_UNKNOWN_INITIAL);
  });

  it("shows the email's first letter when there is no name", () => {
    setup({ name: '', email: MOCK_EMAIL });

    const initial = screen.getByText(MOCK_EMAIL.charAt(0).toUpperCase());

    expect(initial).toBeVisible();
  });

  it("shows the email's first letter when the name has no letters or digits", () => {
    setup({ name: MOCK_PUNCTUATION_ONLY_NAME, email: MOCK_EMAIL });

    const initial = screen.getByText(MOCK_EMAIL.charAt(0).toUpperCase());

    expect(initial).toBeVisible();
  });

  it('keeps the name initials when an email is passed too', () => {
    setup({ name: MOCK_FULL_NAME, email: MOCK_EMAIL });

    const initials = screen.getByText(MOCK_INITIALS);

    expect(initials).toBeVisible();
  });

  it('is hidden from assistive tech', () => {
    setup();

    const initials = screen.getByText(MOCK_INITIALS);

    expect(initials).toHaveAttribute(ARIA_HIDDEN, 'true');
  });
});
