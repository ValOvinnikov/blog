import { at, setIfMissing, unset } from 'sanity/migrate';

import { moveCategoriesToSingleCategory } from './index';

describe(moveCategoriesToSingleCategory, () => {
  it('moves categories[0] onto category and unsets categories', () => {
    const categories = [
      { _type: 'reference', _ref: 'category-a', _key: 'a' },
      { _type: 'reference', _ref: 'category-b', _key: 'b' },
      { _type: 'reference', _ref: 'category-c', _key: 'c' },
    ];

    const result = moveCategoriesToSingleCategory({ categories });

    expect(result).toEqual([
      at('category', setIfMissing({ _type: 'reference', _ref: 'category-a' })),
      at('categories', unset()),
    ]);
  });

  it('is idempotent — a doc already migrated (no categories field) is left alone', () => {
    const result = moveCategoriesToSingleCategory({});

    expect(result).toBeUndefined();
  });

  it('does not clobber an already-set category on a partially-migrated doc', () => {
    // A prior run could have set `category` but failed before unsetting
    // `categories` (or the two fields could otherwise coexist transiently).
    // The mutation must use setIfMissing, never set, so a re-run never
    // overwrites a category value that's already there.
    const categories = [{ _type: 'reference', _ref: 'category-a', _key: 'a' }];

    const result = moveCategoriesToSingleCategory({ categories });

    expect(result).toEqual([
      at('category', setIfMissing({ _type: 'reference', _ref: 'category-a' })),
      at('categories', unset()),
    ]);
  });

  it('documents the known edge case: an empty categories array leaves category unset', () => {
    // The old schema required `categories` without a `.min(1)`, so an empty
    // array should never happen in practice — but if it did, this migration
    // deliberately unsets `categories` without writing a `category`,
    // producing a doc that violates the new schema's required `category`
    // field. Flagged as a non-blocking, should-never-happen edge case in
    // review of #811; asserted explicitly here so it's a visible, tested
    // decision rather than a silent gap.
    const result = moveCategoriesToSingleCategory({ categories: [] });

    expect(result).toEqual([at('categories', unset())]);
  });
});
