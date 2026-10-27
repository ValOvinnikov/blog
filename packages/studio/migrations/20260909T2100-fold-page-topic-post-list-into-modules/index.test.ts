import { faker } from '@faker-js/faker';
import { at, prepend } from 'sanity/migrate';

import { toPostListModuleKey } from '../lib/post-list-module-key';

import { foldPostListIntoModules, type TPageTopicDoc } from './index';

faker.seed(2100);

const POST_LIST_MODULE_TYPE = 'module_postList';
const MOCK_POST_LIST_REF = faker.string.uuid();
const MOCK_MODULE_REF = faker.string.uuid();

describe(foldPostListIntoModules, () => {
  it.each([
    { name: 'no modules', modules: undefined },
    {
      name: 'existing modules',
      modules: [
        { _key: MOCK_MODULE_REF, _type: 'module_cta', _ref: MOCK_MODULE_REF },
      ],
    },
  ])('prepends the post list reference ahead of $name', ({ modules }) => {
    const doc: TPageTopicDoc = {
      postList: { _ref: MOCK_POST_LIST_REF },
      modules,
    };

    const result = foldPostListIntoModules(doc);

    expect(result).toEqual([
      at(
        'modules',
        prepend({
          _key: toPostListModuleKey(MOCK_POST_LIST_REF),
          _type: POST_LIST_MODULE_TYPE,
          _ref: MOCK_POST_LIST_REF,
        }),
      ),
    ]);
  });

  it('leaves a doc alone when modules[] already references the post list', () => {
    const doc: TPageTopicDoc = {
      postList: { _ref: MOCK_POST_LIST_REF },
      modules: [
        {
          _key: toPostListModuleKey(MOCK_POST_LIST_REF),
          _type: POST_LIST_MODULE_TYPE,
          _ref: MOCK_POST_LIST_REF,
        },
      ],
    };

    const result = foldPostListIntoModules(doc);

    expect(result).toBeUndefined();
  });

  it.each([
    { name: 'no postList', doc: {} },
    { name: 'a postList without a _ref', doc: { postList: {} } },
  ])('is a no-op for a doc with $name', ({ doc }) => {
    const result = foldPostListIntoModules(doc);

    expect(result).toBeUndefined();
  });
});
