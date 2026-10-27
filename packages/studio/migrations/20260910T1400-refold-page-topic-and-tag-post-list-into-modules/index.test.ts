import { faker } from '@faker-js/faker';
import { at, prepend, setIfMissing, unset } from 'sanity/migrate';

import { toPostListModuleKey } from '../lib/post-list-module-key';

import { refoldPostListIntoModules, type TFoldableDoc } from './index';

faker.seed(5102);

const MOCK_POST_LIST_ID = faker.string.uuid();
const MOCK_CTA_ID = faker.string.uuid();

const MOCK_POST_LIST_MODULE = {
  _key: toPostListModuleKey(MOCK_POST_LIST_ID),
  _type: 'module_postList',
  _ref: MOCK_POST_LIST_ID,
};

const MOCK_REFOLD_PATCHES = [
  at('modules', setIfMissing([])),
  at('modules', prepend([MOCK_POST_LIST_MODULE])),
  at('postList', unset()),
];

describe(refoldPostListIntoModules, () => {
  let unfoldedDoc: TFoldableDoc;

  beforeEach(() => {
    unfoldedDoc = { postList: { _ref: MOCK_POST_LIST_ID } };
  });

  it('folds a document without modules and unsets postList', () => {
    const result = refoldPostListIntoModules(unfoldedDoc);

    expect(result).toEqual(MOCK_REFOLD_PATCHES);
  });

  it('inserts ahead of existing modules and unsets postList', () => {
    const result = refoldPostListIntoModules({
      ...unfoldedDoc,
      modules: [{ _key: MOCK_CTA_ID, _type: 'module_cta', _ref: MOCK_CTA_ID }],
    });

    expect(result).toEqual(MOCK_REFOLD_PATCHES);
  });

  it('produces no patch when modules already reference the post list', () => {
    const result = refoldPostListIntoModules({
      ...unfoldedDoc,
      modules: [MOCK_POST_LIST_MODULE],
    });

    expect(result).toBeUndefined();
  });

  it.each([
    ['no postList', {}],
    ['an empty postList', { postList: {} }],
  ])('produces no patch for a document with %s', (_name, doc) => {
    const result = refoldPostListIntoModules(doc);

    expect(result).toBeUndefined();
  });
});
