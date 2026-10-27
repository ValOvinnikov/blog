import { faker } from '@faker-js/faker';
import { FIELD_ERROR } from '@web/constants/field-error';

import { validateContactMessage } from './validate-contact-message';

faker.seed(6012);

const NAME_MAX_LENGTH = 100;
const MESSAGE_MIN_LENGTH = 10;
const MESSAGE_MAX_LENGTH = 5_000;

const MOCK_VALID_FIELDS = {
  name: faker.person.fullName(),
  email: faker.internet.email(),
  message: faker.lorem.sentences(2),
};

describe(validateContactMessage, () => {
  it('accepts a complete message and trims each field', () => {
    const { name, email, message } = MOCK_VALID_FIELDS;

    expect(
      validateContactMessage({
        name: `  ${name} `,
        email: ` ${email} `,
        message: ` ${message} `,
      }),
    ).toEqual({ ok: true, data: MOCK_VALID_FIELDS });
  });

  it('joins the lines of a multi-line name', () => {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();

    expect(
      validateContactMessage({
        ...MOCK_VALID_FIELDS,
        name: `${firstName}\r\n${lastName}`,
      }),
    ).toEqual({
      ok: true,
      data: { ...MOCK_VALID_FIELDS, name: `${firstName} ${lastName}` },
    });
  });

  it.each([
    { case: 'an empty name', overrides: { name: '   ' }, field: 'name' },
    {
      case: 'a name over the limit',
      overrides: { name: faker.string.alpha(NAME_MAX_LENGTH + 1) },
      field: 'name',
    },
    {
      case: 'a malformed email',
      overrides: { email: `${faker.internet.username()}@` },
      field: 'email',
    },
    {
      case: 'a message under the minimum',
      overrides: { message: faker.string.alpha(MESSAGE_MIN_LENGTH - 1) },
      field: 'message',
    },
    {
      case: 'a message over the limit',
      overrides: { message: faker.string.alpha(MESSAGE_MAX_LENGTH + 1) },
      field: 'message',
    },
  ])('rejects $case', ({ overrides, field }) => {
    expect(
      validateContactMessage({ ...MOCK_VALID_FIELDS, ...overrides }),
    ).toEqual({
      ok: false,
      error: { [field]: { reason: FIELD_ERROR.INVALID } },
    });
  });

  it.each([
    {
      case: 'a name at the limit',
      overrides: { name: faker.string.alpha(NAME_MAX_LENGTH) },
    },
    {
      case: 'a message at the minimum',
      overrides: { message: faker.string.alpha(MESSAGE_MIN_LENGTH) },
    },
    {
      case: 'a message at the limit',
      overrides: { message: faker.string.alpha(MESSAGE_MAX_LENGTH) },
    },
  ])('accepts $case', ({ overrides }) => {
    const result = validateContactMessage({
      ...MOCK_VALID_FIELDS,
      ...overrides,
    });

    expect(result.ok).toBe(true);
  });
});
