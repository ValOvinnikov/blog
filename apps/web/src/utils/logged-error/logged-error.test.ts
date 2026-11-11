import { faker } from '@faker-js/faker';

import { isErrorLogged, markErrorLogged } from './logged-error';

faker.seed(1880);

const MOCK_MESSAGE = faker.lorem.sentence();

describe(markErrorLogged, () => {
  it('marks the same Error instance as logged', () => {
    const error = new Error(MOCK_MESSAGE);

    expect(markErrorLogged(error)).toBe(error);
    expect(isErrorLogged(error)).toBe(true);
  });

  it('wraps a thrown non-Error value, keeping it as the cause', () => {
    const marked = markErrorLogged(MOCK_MESSAGE);

    expect(marked.cause).toBe(MOCK_MESSAGE);
    expect(isErrorLogged(marked)).toBe(true);
  });
});

describe(isErrorLogged, () => {
  it.each([new Error(MOCK_MESSAGE), MOCK_MESSAGE, undefined])(
    'reports an unmarked %s as not logged',
    (value) => {
      expect(isErrorLogged(value)).toBe(false);
    },
  );
});
