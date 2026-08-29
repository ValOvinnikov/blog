import { categoriesToSingleCategory } from './transform';

describe(categoriesToSingleCategory, () => {
  it('picks the first entry of a multi-category array as the reference', () => {
    const categories = [
      { _type: 'reference', _ref: 'category-a', _key: 'a' },
      { _type: 'reference', _ref: 'category-b', _key: 'b' },
      { _type: 'reference', _ref: 'category-c', _key: 'c' },
    ];

    const result = categoriesToSingleCategory({ categories });

    expect(result).toEqual({ _type: 'reference', _ref: 'category-a' });
  });

  it('returns undefined for an empty categories array', () => {
    const result = categoriesToSingleCategory({ categories: [] });

    expect(result).toBeUndefined();
  });

  it('returns undefined for a doc with no categories field', () => {
    const result = categoriesToSingleCategory({});

    expect(result).toBeUndefined();
  });
});
