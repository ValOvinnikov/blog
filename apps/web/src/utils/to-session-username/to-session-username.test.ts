import { faker } from '@faker-js/faker';

import { toSessionUsername } from './to-session-username';

faker.seed(6012);

const MOCK_FIRST_NAME = faker.person.firstName();
const MOCK_LAST_NAME = faker.person.lastName();
const MOCK_FULL_NAME = `${MOCK_FIRST_NAME} ${MOCK_LAST_NAME}`;
const MOCK_NAME_HANDLE = `${MOCK_FIRST_NAME}${MOCK_LAST_NAME}`.toLowerCase();
const MOCK_EMAIL_LOCAL_PART = faker.lorem.word();
const MOCK_EMAIL = `${MOCK_EMAIL_LOCAL_PART}@${faker.internet.domainName()}`;
const MOCK_EMAIL_WITHOUT_LOCAL_PART = `@${faker.internet.domainName()}`;
const MOCK_BLANK_NAME = '   ';
const GENERIC_USERNAME = 'user';

describe(toSessionUsername, () => {
  it('prefers the email local part', () => {
    expect(toSessionUsername(MOCK_FULL_NAME, MOCK_EMAIL)).toBe(
      MOCK_EMAIL_LOCAL_PART,
    );
  });

  it.each([
    { case: 'email is absent', email: undefined },
    {
      case: 'the email has an empty local part',
      email: MOCK_EMAIL_WITHOUT_LOCAL_PART,
    },
  ])('falls back to the lowercased name when $case', ({ email }) => {
    expect(toSessionUsername(MOCK_FULL_NAME, email)).toBe(MOCK_NAME_HANDLE);
  });

  it.each([
    { case: 'both are absent', name: undefined, email: undefined },
    {
      case: 'the email local part is empty and name is absent',
      name: undefined,
      email: MOCK_EMAIL_WITHOUT_LOCAL_PART,
    },
    {
      case: 'name is blank and email is absent',
      name: MOCK_BLANK_NAME,
      email: undefined,
    },
    {
      case: 'name is blank and the email local part is empty',
      name: MOCK_BLANK_NAME,
      email: MOCK_EMAIL_WITHOUT_LOCAL_PART,
    },
  ])('falls back to the generic username when $case', ({ name, email }) => {
    expect(toSessionUsername(name, email)).toBe(GENERIC_USERNAME);
  });
});
