import { faker } from '@faker-js/faker';
import { customRender, screen } from '@platform/testing/custom-render';

import { Avatar } from './avatar';

faker.seed(5995);

const AVATAR_TEST_ID = 'avatar';

const MOCK_FIRST_NAME = faker.person.firstName();
const MOCK_MIDDLE_NAME = faker.person.middleName();
const MOCK_LAST_NAME = faker.person.lastName();
const MOCK_FULL_NAME = `${MOCK_FIRST_NAME} ${MOCK_LAST_NAME}`;
const MOCK_INITIALS =
  `${MOCK_FIRST_NAME.charAt(0)}${MOCK_LAST_NAME.charAt(0)}`.toUpperCase();

const setup = customRender(Avatar, { name: MOCK_FULL_NAME, variant: 'table' });

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
  ])('renders initials for %s', (_case, name, expected) => {
    setup({ name });

    const initials = screen.getByText(expected);

    expect(initials).toBeVisible();
  });

  it('renders no initials for an empty name', () => {
    setup({ name: '' });

    const avatar = screen.getByTestId(AVATAR_TEST_ID);

    expect(avatar).toBeEmptyDOMElement();
  });

  it('is hidden from assistive tech', () => {
    setup();

    const initials = screen.getByText(MOCK_INITIALS);

    expect(initials).toHaveAttribute('aria-hidden', 'true');
  });
});
