import { faker } from '@faker-js/faker';

import { formatLanguageChanges } from './format-language-changes';

faker.seed(6006);

const MOCK_FIRST_LANGUAGE = `a-${faker.word.noun()}`;
const MOCK_SECOND_LANGUAGE = `b-${faker.word.noun()}`;

describe(formatLanguageChanges, () => {
  it('lists each language with its count', () => {
    const formatted = formatLanguageChanges([
      { language: MOCK_FIRST_LANGUAGE, count: 2 },
      { language: MOCK_SECOND_LANGUAGE, count: 1 },
    ]);

    expect(formatted).toBe(
      `${MOCK_FIRST_LANGUAGE} 2 · ${MOCK_SECOND_LANGUAGE} 1`,
    );
  });

  it('leaves out languages with no changes', () => {
    const formatted = formatLanguageChanges([
      { language: MOCK_FIRST_LANGUAGE, count: 0 },
      { language: MOCK_SECOND_LANGUAGE, count: 3 },
    ]);

    expect(formatted).toBe(`${MOCK_SECOND_LANGUAGE} 3`);
  });

  it('returns an empty string when nothing changed', () => {
    expect(formatLanguageChanges([])).toBe('');
  });
});
