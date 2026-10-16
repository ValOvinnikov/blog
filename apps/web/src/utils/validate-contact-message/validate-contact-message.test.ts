import { validateContactMessage } from './validate-contact-message';

const VALID = {
  name: 'Priya Nair',
  email: 'priya@example.com',
  message: 'Could we talk next week?',
};

describe('validateContactMessage', () => {
  it('accepts a complete message and trims each field', () => {
    expect(
      validateContactMessage({
        name: '  Priya Nair ',
        email: ' priya@example.com ',
        message: ' Could we talk next week? ',
      }),
    ).toEqual({ ok: true, data: VALID });
  });

  it('joins the lines of a multi-line name', () => {
    expect(validateContactMessage({ ...VALID, name: 'Priya\r\nNair' })).toEqual(
      { ok: true, data: { ...VALID, name: 'Priya Nair' } },
    );
  });

  it.each([
    ['an empty name', { name: '   ' }, ['name']],
    ['a 101-character name', { name: 'a'.repeat(101) }, ['name']],
    ['a malformed email', { email: 'priya@' }, ['email']],
    ['a 9-character message', { message: '123456789' }, ['message']],
    ['a 5,001-character message', { message: 'a'.repeat(5_001) }, ['message']],
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
        name: 'a'.repeat(100),
        message: 'a'.repeat(5_000),
      }).ok,
    ).toBe(true);
    expect(
      validateContactMessage({ ...VALID, message: 'a'.repeat(10) }).ok,
    ).toBe(true);
  });
});
