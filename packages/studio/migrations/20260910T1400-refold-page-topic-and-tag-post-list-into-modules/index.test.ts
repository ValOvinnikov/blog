import { at, prepend, setIfMissing, unset } from 'sanity/migrate';

import { toPostListModuleKey } from '../lib/post-list-module-key';

import { refoldPostListIntoModules, type TFoldableDoc } from './index';

describe(refoldPostListIntoModules, () => {
  let unfoldedDoc: TFoldableDoc;
  let foldedDoc: TFoldableDoc;

  beforeEach(() => {
    unfoldedDoc = { postList: { _ref: 'postList-1' } };
    foldedDoc = {
      postList: { _ref: 'postList-1' },
      modules: [
        {
          _key: toPostListModuleKey('postList-1'),
          _type: 'module_postList',
          _ref: 'postList-1',
        },
      ],
    };
  });

  it('folds a document whose modules field is entirely absent, and unsets postList', () => {
    const result = refoldPostListIntoModules(unfoldedDoc);

    expect(result).toEqual([
      at('modules', setIfMissing([])),
      at(
        'modules',
        prepend([
          {
            _key: toPostListModuleKey('postList-1'),
            _type: 'module_postList',
            _ref: 'postList-1',
          },
        ]),
      ),
      at('postList', unset()),
    ]);
  });

  it('inserts ahead of any existing modules, leaving them untouched, and unsets postList', () => {
    const doc: TFoldableDoc = {
      postList: { _ref: 'postList-1' },
      modules: [{ _key: 'cta-1', _type: 'module_cta', _ref: 'cta-doc-1' }],
    };

    const result = refoldPostListIntoModules(doc);

    expect(result).toEqual([
      at('modules', setIfMissing([])),
      at(
        'modules',
        prepend([
          {
            _key: toPostListModuleKey('postList-1'),
            _type: 'module_postList',
            _ref: 'postList-1',
          },
        ]),
      ),
      at('postList', unset()),
    ]);
  });

  it('is idempotent — a doc already referencing the post list in modules[] produces no patch', () => {
    expect(refoldPostListIntoModules(foldedDoc)).toBeUndefined();
  });

  it('never unsets postList for a document it skips (already folded)', () => {
    expect(refoldPostListIntoModules(foldedDoc)).toBeUndefined();
  });

  it('is a no-op, not an error, for a doc with no postList reference', () => {
    expect(refoldPostListIntoModules({})).toBeUndefined();
    expect(refoldPostListIntoModules({ postList: {} })).toBeUndefined();
  });

  it('running it twice produces the same result — the derived _key is stable', () => {
    expect(refoldPostListIntoModules(unfoldedDoc)).toEqual(
      refoldPostListIntoModules(unfoldedDoc),
    );
  });
});
