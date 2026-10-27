import { faker } from '@faker-js/faker';

import { categoriesToSingleCategory } from './transform';

faker.seed(3);

const MOCK_FIRST_CATEGORY_ID = faker.string.uuid();
const MOCK_SECOND_CATEGORY_ID = faker.string.uuid();

const mockCategoryRef = (ref: string) => ({
  _type: 'reference',
  _ref: ref,
  _key: faker.string.alphanumeric(6),
});

describe(categoriesToSingleCategory, () => {
  it('picks the first category as the reference', () => {
    const categories = [
      mockCategoryRef(MOCK_FIRST_CATEGORY_ID),
      mockCategoryRef(MOCK_SECOND_CATEGORY_ID),
    ];

    const result = categoriesToSingleCategory({ categories });

    expect(result).toEqual({
      _type: 'reference',
      _ref: MOCK_FIRST_CATEGORY_ID,
    });
  });

  it.each([
    ['an empty categories array', { categories: [] }],
    ['a doc without categories', {}],
  ])('returns undefined for %s', (_label, doc) => {
    const result = categoriesToSingleCategory(doc);

    expect(result).toBeUndefined();
  });
});
