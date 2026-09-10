import { at, unset } from 'sanity/migrate';

import { isPageTagPostListFolded, unsetLegacyTagPageFields } from './index';

const foldedModules = [
  { _key: 'postList-1', _type: 'module_postList', _ref: 'postList-1' },
];

describe(isPageTagPostListFolded, () => {
  it('is folded when modules[] contains a member referencing postList._ref', () => {
    expect(
      isPageTagPostListFolded({
        _id: 'page-tag',
        postList: { _ref: 'postList-1' },
        modules: foldedModules,
      }),
    ).toBe(true);
  });

  it('is not folded when postList is unset', () => {
    expect(
      isPageTagPostListFolded({
        _id: 'page-tag',
        modules: foldedModules,
      }),
    ).toBe(false);
  });

  it('is not folded when modules[] has no member referencing postList._ref', () => {
    expect(
      isPageTagPostListFolded({
        _id: 'page-tag',
        postList: { _ref: 'postList-1' },
        modules: [{ _key: 'cta-1', _type: 'module_cta', _ref: 'cta-1' }],
      }),
    ).toBe(false);
  });

  it('is not folded when modules[] is empty', () => {
    expect(
      isPageTagPostListFolded({
        _id: 'page-tag',
        postList: { _ref: 'postList-1' },
        modules: [],
      }),
    ).toBe(false);
  });
});

describe(unsetLegacyTagPageFields, () => {
  it('unsets postList once modules[] already references it', () => {
    const result = unsetLegacyTagPageFields({
      _id: 'page-tag',
      postList: { _ref: 'postList-1' },
      modules: foldedModules,
    });

    expect(result).toEqual([at('postList', unset())]);
  });

  it('produces no patch when postList is already unset', () => {
    const result = unsetLegacyTagPageFields({
      _id: 'page-tag',
      modules: foldedModules,
    });

    expect(result).toBeUndefined();
  });

  it('skips (does not unset) a document whose modules[] does not yet reference postList', () => {
    const result = unsetLegacyTagPageFields({
      _id: 'page-tag',
      postList: { _ref: 'postList-1' },
      modules: [{ _key: 'cta-1', _type: 'module_cta', _ref: 'cta-1' }],
    });

    expect(result).toBeUndefined();
  });

  it('skips a document with no modules[] at all', () => {
    const result = unsetLegacyTagPageFields({
      _id: 'page-tag',
      postList: { _ref: 'postList-1' },
    });

    expect(result).toBeUndefined();
  });

  it('is idempotent — running twice on an already-unset document', () => {
    const alreadyUnset = {
      _id: 'page-tag',
      modules: foldedModules,
    };

    expect(unsetLegacyTagPageFields(alreadyUnset)).toBeUndefined();
    expect(unsetLegacyTagPageFields(alreadyUnset)).toBeUndefined();
  });

  it('applies the same guard and behavior to a draft document id', () => {
    const result = unsetLegacyTagPageFields({
      _id: 'drafts.page-tag',
      postList: { _ref: 'postList-1' },
      modules: foldedModules,
    });

    expect(result).toEqual([at('postList', unset())]);
  });

  it('skips a draft document that fails the guard the same way a published one would', () => {
    const result = unsetLegacyTagPageFields({
      _id: 'drafts.page-tag',
      postList: { _ref: 'postList-1' },
      modules: [],
    });

    expect(result).toBeUndefined();
  });

  /**
   * Regression guard: `postList` must not be unset merely because it is still
   * defined — `modules[]` must actually reference it.
   */
  it('never unsets an unfolded document just because postList is still defined', () => {
    const result = unsetLegacyTagPageFields({
      _id: 'page-tag',
      postList: { _ref: 'postList-1' },
      modules: [],
    });

    expect(result).toBeUndefined();
  });
});
