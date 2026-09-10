import { at, unset } from 'sanity/migrate';

import {
  isPageTopicTargetShapeReady,
  unsetLegacyPageTopicPostList,
} from './index';

const foldedModules = [
  { _key: 'postList-1', _type: 'module_postList', _ref: 'postList-1' },
];

describe(isPageTopicTargetShapeReady, () => {
  it('is ready when modules[] has a member whose _ref matches postList._ref', () => {
    expect(
      isPageTopicTargetShapeReady({
        _id: 'page-topic',
        postList: { _ref: 'postList-1' },
        modules: foldedModules,
      }),
    ).toBe(true);
  });

  it('is ready when there is no postList to begin with', () => {
    expect(
      isPageTopicTargetShapeReady({
        _id: 'page-topic',
        modules: foldedModules,
      }),
    ).toBe(true);
  });

  it('is not ready when modules[] has no member whose _ref matches postList._ref', () => {
    expect(
      isPageTopicTargetShapeReady({
        _id: 'page-topic',
        postList: { _ref: 'postList-1' },
        modules: [{ _key: 'cta-1', _type: 'module_cta', _ref: 'cta-1' }],
      }),
    ).toBe(false);
  });

  it('is not ready when postList is set and modules[] is empty', () => {
    expect(
      isPageTopicTargetShapeReady({
        _id: 'page-topic',
        postList: { _ref: 'postList-1' },
        modules: [],
      }),
    ).toBe(false);
  });
});

describe(unsetLegacyPageTopicPostList, () => {
  it('unsets postList once modules[] references it', () => {
    const result = unsetLegacyPageTopicPostList({
      _id: 'page-topic',
      postList: { _ref: 'postList-1' },
      modules: foldedModules,
    });

    expect(result).toEqual([at('postList', unset())]);
  });

  it('skips an unfolded document — postList is not unset, not reported as a patch', () => {
    const result = unsetLegacyPageTopicPostList({
      _id: 'page-topic',
      postList: { _ref: 'postList-1' },
      modules: [{ _key: 'cta-1', _type: 'module_cta', _ref: 'cta-1' }],
    });

    expect(result).toBeUndefined();
  });

  it('skips an unfolded document even with an empty modules[]', () => {
    const result = unsetLegacyPageTopicPostList({
      _id: 'page-topic',
      postList: { _ref: 'postList-1' },
      modules: [],
    });

    expect(result).toBeUndefined();
  });

  it('produces no patch for a document with no postList field', () => {
    const result = unsetLegacyPageTopicPostList({
      _id: 'page-topic',
      modules: foldedModules,
    });

    expect(result).toBeUndefined();
  });

  it('is idempotent — running twice on an already-unset document', () => {
    const alreadyUnset = {
      _id: 'page-topic',
      modules: foldedModules,
    };

    expect(unsetLegacyPageTopicPostList(alreadyUnset)).toBeUndefined();
    expect(unsetLegacyPageTopicPostList(alreadyUnset)).toBeUndefined();
  });

  it('applies the same guard and behavior to a draft document id', () => {
    const result = unsetLegacyPageTopicPostList({
      _id: 'drafts.page-topic',
      postList: { _ref: 'postList-1' },
      modules: foldedModules,
    });

    expect(result).toEqual([at('postList', unset())]);
  });

  it('skips a draft document that fails the guard the same way a published one would', () => {
    const result = unsetLegacyPageTopicPostList({
      _id: 'drafts.page-topic',
      postList: { _ref: 'postList-1' },
      modules: [],
    });

    expect(result).toBeUndefined();
  });

  it('does not match against an unrelated module referencing a different document', () => {
    const result = unsetLegacyPageTopicPostList({
      _id: 'page-topic',
      postList: { _ref: 'postList-1' },
      modules: [
        { _key: 'postList-2', _type: 'module_postList', _ref: 'postList-2' },
      ],
    });

    expect(result).toBeUndefined();
  });
});
