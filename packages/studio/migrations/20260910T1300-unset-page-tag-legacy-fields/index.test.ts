import { faker } from '@faker-js/faker';
import { at, unset } from 'sanity/migrate';

import { isPageTagPostListFolded, unsetLegacyTagPageFields } from './index';

faker.seed(5101);

const MOCK_PAGE_ID = faker.string.uuid();
const MOCK_POST_LIST_ID = faker.string.uuid();
const MOCK_OTHER_MODULE_ID = faker.string.uuid();

const MOCK_POST_LIST = { _ref: MOCK_POST_LIST_ID };
const MOCK_FOLDED_MODULES = [
  {
    _key: MOCK_POST_LIST_ID,
    _type: 'module_postList',
    _ref: MOCK_POST_LIST_ID,
  },
];
const MOCK_UNRELATED_MODULES = [
  {
    _key: MOCK_OTHER_MODULE_ID,
    _type: 'module_cta',
    _ref: MOCK_OTHER_MODULE_ID,
  },
];

describe(isPageTagPostListFolded, () => {
  it('is folded when a module references the post list', () => {
    const folded = isPageTagPostListFolded({
      _id: MOCK_PAGE_ID,
      postList: MOCK_POST_LIST,
      modules: MOCK_FOLDED_MODULES,
    });

    expect(folded).toBe(true);
  });

  it.each([
    ['postList is unset', { modules: MOCK_FOLDED_MODULES }],
    [
      'no module references the post list',
      { postList: MOCK_POST_LIST, modules: MOCK_UNRELATED_MODULES },
    ],
    ['modules is empty', { postList: MOCK_POST_LIST, modules: [] }],
  ])('is not folded when %s', (_name, fields) => {
    const folded = isPageTagPostListFolded({ _id: MOCK_PAGE_ID, ...fields });

    expect(folded).toBe(false);
  });
});

describe(unsetLegacyTagPageFields, () => {
  it.each([
    ['a published document', MOCK_PAGE_ID],
    ['a draft document', `drafts.${MOCK_PAGE_ID}`],
  ])('unsets postList once modules reference it on %s', (_name, _id) => {
    const result = unsetLegacyTagPageFields({
      _id,
      postList: MOCK_POST_LIST,
      modules: MOCK_FOLDED_MODULES,
    });

    expect(result).toEqual([at('postList', unset())]);
  });

  it.each([
    ['postList is already unset', { modules: MOCK_FOLDED_MODULES }],
    [
      'modules do not reference the post list',
      { postList: MOCK_POST_LIST, modules: MOCK_UNRELATED_MODULES },
    ],
    ['modules is empty', { postList: MOCK_POST_LIST, modules: [] }],
    ['modules is missing', { postList: MOCK_POST_LIST }],
  ])('produces no patch when %s', (_name, fields) => {
    const result = unsetLegacyTagPageFields({ _id: MOCK_PAGE_ID, ...fields });

    expect(result).toBeUndefined();
  });

  it('produces no patch for a draft that fails the fold guard', () => {
    const result = unsetLegacyTagPageFields({
      _id: `drafts.${MOCK_PAGE_ID}`,
      postList: MOCK_POST_LIST,
      modules: [],
    });

    expect(result).toBeUndefined();
  });
});
