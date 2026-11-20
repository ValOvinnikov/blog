import { faker } from '@faker-js/faker';
import { validateMaxWords } from '@shinefold/studio/schema-types/validation/validate-max-words/validate-max-words';

faker.seed(7731);

const MOCK_MAX_WORDS = faker.number.int({ min: 3, max: 10 });

const mockBlockOfWords = (count: number) => ({
  children: [{ text: faker.lorem.words(count) }],
});

describe(validateMaxWords, () => {
  const validate = validateMaxWords(MOCK_MAX_WORDS);

  it.each([
    ['passes at the limit', [mockBlockOfWords(MOCK_MAX_WORDS)]],
    ['passes when the field is not set', undefined],
  ])('%s', (_description, value) => {
    expect(validate(value)).toBe(true);
  });

  it('fails with the count when the blocks together run over', () => {
    const value = [mockBlockOfWords(MOCK_MAX_WORDS), mockBlockOfWords(1)];

    expect(validate(value)).toContain(String(MOCK_MAX_WORDS + 1));
  });
});
