import { at, prepend, set, setIfMissing } from 'sanity/migrate';

import { backfillHeadingBlock, foldPostListIntoModules } from './index';

describe(foldPostListIntoModules, () => {
  it('prepends a reference to modules[] when postList is not yet referenced', () => {
    const result = foldPostListIntoModules({
      _id: 'page-blog',
      postList: { _ref: 'postList-1' },
      modules: [{ _key: 'cta-1', _type: 'module_cta', _ref: 'cta-1' }],
    });

    expect(result).toEqual([
      at('modules', setIfMissing([])),
      at(
        'modules',
        prepend([
          {
            _type: 'module_postList',
            _key: 'postList-postList-1',
            _ref: 'postList-1',
          },
        ]),
      ),
    ]);
  });

  it('sets modules[] when it is entirely absent', () => {
    const result = foldPostListIntoModules({
      _id: 'page-blog',
      postList: { _ref: 'postList-1' },
    });

    expect(result).toEqual([
      at('modules', setIfMissing([])),
      at(
        'modules',
        prepend([
          {
            _type: 'module_postList',
            _key: 'postList-postList-1',
            _ref: 'postList-1',
          },
        ]),
      ),
    ]);
  });

  it('is idempotent — a document whose modules[] already references postList is left alone', () => {
    const result = foldPostListIntoModules({
      _id: 'page-blog',
      postList: { _ref: 'postList-1' },
      modules: [
        {
          _key: 'postList-postList-1',
          _type: 'module_postList',
          _ref: 'postList-1',
        },
      ],
    });

    expect(result).toBeUndefined();
  });

  it('is a no-op for a document with no postList reference at all', () => {
    const result = foldPostListIntoModules({ _id: 'page-blog' });

    expect(result).toBeUndefined();
  });

  it('is a no-op when postList is present but carries no _ref', () => {
    const result = foldPostListIntoModules({
      _id: 'page-blog',
      postList: {},
    });

    expect(result).toBeUndefined();
  });
});

describe(backfillHeadingBlock, () => {
  it('sets headingBlock from the inline heading and supportingText', () => {
    const result = backfillHeadingBlock({
      _id: 'page-blog',
      heading: 'Latest posts',
      supportingText: 'Fresh from the blog',
    });

    expect(result).toEqual([
      at(
        'headingBlock',
        set({
          _type: 'headingBlock',
          heading: 'Latest posts',
          supportingText: 'Fresh from the blog',
        }),
      ),
    ]);
  });

  it('sets headingBlock from heading alone when supportingText is absent', () => {
    const result = backfillHeadingBlock({
      _id: 'page-blog',
      heading: 'Latest posts',
    });

    expect(result).toEqual([
      at(
        'headingBlock',
        set({ _type: 'headingBlock', heading: 'Latest posts' }),
      ),
    ]);
  });

  it('is idempotent — a document that already carries headingBlock is left alone', () => {
    const result = backfillHeadingBlock({
      _id: 'page-blog',
      heading: 'Latest posts',
      headingBlock: { _type: 'headingBlock', heading: 'Already moved' },
    });

    expect(result).toBeUndefined();
  });

  it('is a no-op for a document with neither heading nor supportingText', () => {
    const result = backfillHeadingBlock({ _id: 'page-blog' });

    expect(result).toBeUndefined();
  });
});
