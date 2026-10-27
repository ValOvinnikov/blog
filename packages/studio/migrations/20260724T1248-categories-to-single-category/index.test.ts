import { faker } from '@faker-js/faker';
import { at, setIfMissing, unset } from 'sanity/migrate';

import { moveCategoriesToSingleCategory } from './index';

faker.seed(2);

const MOCK_FIRST_CATEGORY_ID = faker.string.uuid();
const MOCK_SECOND_CATEGORY_ID = faker.string.uuid();

const mockCategoryRef = (ref: string) => ({
  _type: 'reference',
  _ref: ref,
  _key: faker.string.alphanumeric(6),
});

describe(moveCategoriesToSingleCategory, () => {
  it('moves the first category onto category and unsets categories', () => {
    const categories = [
      mockCategoryRef(MOCK_FIRST_CATEGORY_ID),
      mockCategoryRef(MOCK_SECOND_CATEGORY_ID),
    ];

    const result = moveCategoriesToSingleCategory({ categories });

    expect(result).toEqual([
      at(
        'category',
        setIfMissing({ _type: 'reference', _ref: MOCK_FIRST_CATEGORY_ID }),
      ),
      at('categories', unset()),
    ]);
  });

  it('leaves a doc without categories alone', () => {
    const result = moveCategoriesToSingleCategory({});

    expect(result).toBeUndefined();
  });

  it('only unsets categories when the array is empty', () => {
    const result = moveCategoriesToSingleCategory({ categories: [] });

    expect(result).toEqual([at('categories', unset())]);
  });
});
