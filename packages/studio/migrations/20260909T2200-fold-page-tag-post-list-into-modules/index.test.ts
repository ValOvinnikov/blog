import { at, prepend } from 'sanity/migrate';

import { toPostListModuleKey } from './module-key';

import { foldPostListIntoModules, type TPageTagDoc } from './index';

describe(foldPostListIntoModules, () => {
  it('inserts the post list as a module_postList reference at index 0', () => {
    const doc: TPageTagDoc = {
      postList: { _ref: 'postList-1' },
    };

    const result = foldPostListIntoModules(doc);

    expect(result).toEqual([
      at(
        'modules',
        prepend({
          _key: toPostListModuleKey('postList-1'),
          _type: 'module_postList',
          _ref: 'postList-1',
        }),
      ),
    ]);
  });

  it('inserts ahead of any existing modules, leaving them untouched', () => {
    const doc: TPageTagDoc = {
      postList: { _ref: 'postList-1' },
      modules: [{ _key: 'cta-1', _type: 'module_cta', _ref: 'cta-doc-1' }],
    };

    const result = foldPostListIntoModules(doc);

    expect(result).toEqual([
      at(
        'modules',
        prepend({
          _key: toPostListModuleKey('postList-1'),
          _type: 'module_postList',
          _ref: 'postList-1',
        }),
      ),
    ]);
  });

  it('is idempotent — a doc already referencing the post list in modules[] is left alone', () => {
    const doc: TPageTagDoc = {
      postList: { _ref: 'postList-1' },
      modules: [
        {
          _key: toPostListModuleKey('postList-1'),
          _type: 'module_postList',
          _ref: 'postList-1',
        },
      ],
    };

    expect(foldPostListIntoModules(doc)).toBeUndefined();
  });

  it('running it twice produces the same result — the derived _key is stable', () => {
    const doc: TPageTagDoc = { postList: { _ref: 'postList-1' } };

    expect(foldPostListIntoModules(doc)).toEqual(foldPostListIntoModules(doc));
  });

  it('is a no-op, not an error, for a doc with no postList reference', () => {
    expect(foldPostListIntoModules({})).toBeUndefined();
    expect(foldPostListIntoModules({ postList: {} })).toBeUndefined();
  });
});
