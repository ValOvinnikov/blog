import { faker } from '@faker-js/faker';

import { validateContactMessage } from './validate-contact-message';

const VALID = {
  name: faker.person.fullName(),
  email: faker.internet.email(),
  message: faker.lorem.sentences(2),
};

describe('validateContactMessage', () => {
  it('accepts a complete message and trims each field', () => {
    expect(
      validateContactMessage({
        name: `  ${VALID.name} `,
        email: ` ${VALID.email} `,
        message: ` ${VALID.message} `,
      }),
    ).toEqual({ ok: true, data: VALID });
  });

  it('joins the lines of a multi-line name', () => {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();

    expect(
      validateContactMessage({ ...VALID, name: `${firstName}\r\n${lastName}` }),
    ).toEqual({
      ok: true,
      data: { ...VALID, name: `${firstName} ${lastName}` },
    });
  });

  it.each([
    ['an empty name', { name: '   ' }, ['name']],
    ['a 101-character name', { name: faker.string.alpha(101) }, ['name']],
    [
      'a malformed email',
      { email: `${faker.internet.username()}@` },
      ['email'],
    ],
    ['a 9-character message', { message: faker.string.alpha(9) }, ['message']],
    [
      'a 5,001-character message',
      { message: faker.string.alpha(5_001) },
      ['message'],
    ],
  ])('rejects %s', (_, overrides, invalidFields) => {
    expect(validateContactMessage({ ...VALID, ...overrides })).toEqual({
      ok: false,
      invalidFields,
    });
  });

  it('accepts the length limits themselves', () => {
    expect(
      validateContactMessage({
        ...VALID,
        name: faker.string.alpha(100),
        message: faker.string.alpha(5_000),
      }).ok,
    ).toBe(true);
    expect(
      validateContactMessage({ ...VALID, message: faker.string.alpha(10) }).ok,
    ).toBe(true);
  });
});
