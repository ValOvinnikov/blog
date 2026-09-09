import { at, unset } from 'sanity/migrate';

import { isPageBlogTargetShapeReady, unsetLegacyBlogPageFields } from './index';

const migratedModules = [
  { _key: 'postList-1', _type: 'module_postList', _ref: 'postList-1' },
];

describe(isPageBlogTargetShapeReady, () => {
  it('is ready when modules[] references module_postList and headingBlock.heading is set', () => {
    expect(
      isPageBlogTargetShapeReady({
        _id: 'page-blog',
        modules: migratedModules,
        headingBlock: { heading: 'Latest posts' },
      }),
    ).toBe(true);
  });

  it('is not ready with no headingBlock at all', () => {
    expect(
      isPageBlogTargetShapeReady({
        _id: 'page-blog',
        modules: migratedModules,
      }),
    ).toBe(false);
  });

  it('is not ready when modules[] does not reference module_postList', () => {
    expect(
      isPageBlogTargetShapeReady({
        _id: 'page-blog',
        modules: [{ _key: 'cta-1', _type: 'module_cta', _ref: 'cta-1' }],
        headingBlock: { heading: 'Latest posts' },
      }),
    ).toBe(false);
  });
});

describe(unsetLegacyBlogPageFields, () => {
  it('unsets heading, supportingText and postList once the new shape is in place', () => {
    const result = unsetLegacyBlogPageFields({
      _id: 'page-blog',
      heading: 'Blog',
      supportingText: 'Fresh posts',
      postList: { _ref: 'postList-1' },
      modules: migratedModules,
      headingBlock: { heading: 'Latest posts' },
    });

    expect(result).toEqual([
      at('heading', unset()),
      at('supportingText', unset()),
      at('postList', unset()),
    ]);
  });

  it('skips a document with no headingBlock, producing no unset patch', () => {
    const result = unsetLegacyBlogPageFields({
      _id: 'page-blog',
      heading: 'Blog',
      supportingText: 'Fresh posts',
      postList: { _ref: 'postList-1' },
      modules: migratedModules,
    });

    expect(result).toBeUndefined();
  });

  it('skips a document whose modules[] does not reference module_postList', () => {
    const result = unsetLegacyBlogPageFields({
      _id: 'page-blog',
      heading: 'Blog',
      supportingText: 'Fresh posts',
      postList: { _ref: 'postList-1' },
      modules: [{ _key: 'cta-1', _type: 'module_cta', _ref: 'cta-1' }],
      headingBlock: { heading: 'Latest posts' },
    });

    expect(result).toBeUndefined();
  });

  it('is idempotent — running twice on a document that has already had the fields unset', () => {
    const alreadyUnset = {
      _id: 'page-blog',
      modules: migratedModules,
      headingBlock: { heading: 'Latest posts' },
    };

    expect(unsetLegacyBlogPageFields(alreadyUnset)).toBeUndefined();
    expect(unsetLegacyBlogPageFields(alreadyUnset)).toBeUndefined();
  });

  it('only unsets whichever legacy field is still present', () => {
    const result = unsetLegacyBlogPageFields({
      _id: 'page-blog',
      heading: 'Blog',
      modules: migratedModules,
      headingBlock: { heading: 'Latest posts' },
    });

    expect(result).toEqual([at('heading', unset())]);
  });

  it('applies the same guard and behavior to a draft document id', () => {
    const result = unsetLegacyBlogPageFields({
      _id: 'drafts.page-blog',
      heading: 'Blog',
      supportingText: 'Fresh posts',
      postList: { _ref: 'postList-1' },
      modules: migratedModules,
      headingBlock: { heading: 'Latest posts' },
    });

    expect(result).toEqual([
      at('heading', unset()),
      at('supportingText', unset()),
      at('postList', unset()),
    ]);
  });

  it('skips a draft document that fails the guard the same way a published one would', () => {
    const result = unsetLegacyBlogPageFields({
      _id: 'drafts.page-blog',
      heading: 'Blog',
      postList: { _ref: 'postList-1' },
      modules: [],
    });

    expect(result).toBeUndefined();
  });
});
