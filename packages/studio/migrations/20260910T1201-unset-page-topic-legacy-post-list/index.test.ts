import { faker } from '@faker-js/faker';
import { at, unset } from 'sanity/migrate';

import {
  isPageTopicTargetShapeReady,
  unsetLegacyPageTopicPostList,
} from './index';

faker.seed(1201);

const POST_LIST_MODULE_TYPE = 'module_postList';
const MOCK_PAGE_ID = faker.string.uuid();
const MOCK_POST_LIST_REF = faker.string.uuid();
const MOCK_OTHER_REF = faker.string.uuid();
const MOCK_FOLDED_MODULES = [
  {
    _key: MOCK_POST_LIST_REF,
    _type: POST_LIST_MODULE_TYPE,
    _ref: MOCK_POST_LIST_REF,
  },
];
const MOCK_UNFOLDED_MODULES = [
  { _key: MOCK_OTHER_REF, _type: 'module_cta', _ref: MOCK_OTHER_REF },
];
const MOCK_POST_LIST = { _ref: MOCK_POST_LIST_REF };

describe(isPageTopicTargetShapeReady, () => {
  it.each([
    {
      name: 'modules[] has a member matching postList',
      doc: {
        _id: MOCK_PAGE_ID,
        postList: MOCK_POST_LIST,
        modules: MOCK_FOLDED_MODULES,
      },
      expected: true,
    },
    {
      name: 'there is no postList',
      doc: { _id: MOCK_PAGE_ID, modules: MOCK_FOLDED_MODULES },
      expected: true,
    },
    {
      name: 'no member of modules[] matches postList',
      doc: {
        _id: MOCK_PAGE_ID,
        postList: MOCK_POST_LIST,
        modules: MOCK_UNFOLDED_MODULES,
      },
      expected: false,
    },
    {
      name: 'postList is set and modules[] is empty',
      doc: { _id: MOCK_PAGE_ID, postList: MOCK_POST_LIST, modules: [] },
      expected: false,
    },
  ])('is $expected when $name', ({ doc, expected }) => {
    expect(isPageTopicTargetShapeReady(doc)).toBe(expected);
  });
});

describe(unsetLegacyPageTopicPostList, () => {
  it('unsets postList once modules[] references it', () => {
    const result = unsetLegacyPageTopicPostList({
      _id: MOCK_PAGE_ID,
      postList: MOCK_POST_LIST,
      modules: MOCK_FOLDED_MODULES,
    });

    expect(result).toEqual([at('postList', unset())]);
  });

  it.each([
    { name: 'an unrelated module', modules: MOCK_UNFOLDED_MODULES },
    { name: 'an empty modules[]', modules: [] },
  ])('leaves an unfolded doc with $name alone', ({ modules }) => {
    const result = unsetLegacyPageTopicPostList({
      _id: MOCK_PAGE_ID,
      postList: MOCK_POST_LIST,
      modules,
    });

    expect(result).toBeUndefined();
  });

  it('leaves a doc alone once postList is already unset', () => {
    const result = unsetLegacyPageTopicPostList({
      _id: MOCK_PAGE_ID,
      modules: MOCK_FOLDED_MODULES,
    });

    expect(result).toBeUndefined();
  });
});
