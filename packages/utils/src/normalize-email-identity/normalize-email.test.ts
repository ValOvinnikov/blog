import { normalizeEmail } from './normalize-email';

const ADDRESS = 'foo@example.com';

describe(normalizeEmail, () => {
  it.each([
    ['trims surrounding whitespace', `  ${ADDRESS}  `, ADDRESS],
    ['lower-cases the address', ' Foo@Example.com ', ADDRESS],
    ['keeps a +tag', 'Foo+News@Example.com', 'foo+news@example.com'],
    ['leaves a normalised address alone', ADDRESS, ADDRESS],
  ])('%s (%j)', (_label, email, expected) => {
    expect(normalizeEmail(email)).toBe(expected);
  });
});
