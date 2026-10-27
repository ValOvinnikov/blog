import { faker } from '@faker-js/faker';
import { at, prepend, set, setIfMissing } from 'sanity/migrate';

import { backfillHeadingBlock, foldPostListIntoModules } from './index';

faker.seed(2010);

const POST_LIST_MODULE_TYPE = 'module_postList';
const HEADING_BLOCK_TYPE = 'headingBlock';
const MOCK_PAGE_ID = faker.string.uuid();
const MOCK_POST_LIST_REF = faker.string.uuid();
const MOCK_MODULE_REF = faker.string.uuid();
const MOCK_POST_LIST_KEY = `postList-${MOCK_POST_LIST_REF}`;
const MOCK_HEADING = faker.lorem.words();
const MOCK_SUPPORTING_TEXT = faker.lorem.words();
const MOCK_MIGRATED_HEADING = faker.lorem.words();

describe(foldPostListIntoModules, () => {
  it.each([
    {
      name: 'other modules',
      modules: [
        { _key: MOCK_MODULE_REF, _type: 'module_cta', _ref: MOCK_MODULE_REF },
      ],
    },
    { name: 'no modules[] at all', modules: undefined },
  ])('prepends the post list reference to $name', ({ modules }) => {
    const result = foldPostListIntoModules({
      _id: MOCK_PAGE_ID,
      postList: { _ref: MOCK_POST_LIST_REF },
      modules,
    });

    expect(result).toEqual([
      at('modules', setIfMissing([])),
      at(
        'modules',
        prepend([
          {
            _type: POST_LIST_MODULE_TYPE,
            _key: MOCK_POST_LIST_KEY,
            _ref: MOCK_POST_LIST_REF,
          },
        ]),
      ),
    ]);
  });

  it('leaves a doc alone when modules[] already references the post list', () => {
    const result = foldPostListIntoModules({
      _id: MOCK_PAGE_ID,
      postList: { _ref: MOCK_POST_LIST_REF },
      modules: [
        {
          _key: MOCK_POST_LIST_KEY,
          _type: POST_LIST_MODULE_TYPE,
          _ref: MOCK_POST_LIST_REF,
        },
      ],
    });

    expect(result).toBeUndefined();
  });

  it.each([
    { name: 'no postList', postList: undefined },
    { name: 'a postList without a _ref', postList: {} },
  ])('is a no-op for a doc with $name', ({ postList }) => {
    const result = foldPostListIntoModules({ _id: MOCK_PAGE_ID, postList });

    expect(result).toBeUndefined();
  });
});

describe(backfillHeadingBlock, () => {
  it.each([
    {
      name: 'heading and supportingText',
      legacy: { heading: MOCK_HEADING, supportingText: MOCK_SUPPORTING_TEXT },
    },
    { name: 'heading alone', legacy: { heading: MOCK_HEADING } },
  ])('sets headingBlock from $name', ({ legacy }) => {
    const result = backfillHeadingBlock({ _id: MOCK_PAGE_ID, ...legacy });

    expect(result).toEqual([
      at('headingBlock', set({ _type: HEADING_BLOCK_TYPE, ...legacy })),
    ]);
  });

  it('leaves a doc alone when headingBlock is already set', () => {
    const result = backfillHeadingBlock({
      _id: MOCK_PAGE_ID,
      heading: MOCK_HEADING,
      headingBlock: {
        _type: HEADING_BLOCK_TYPE,
        heading: MOCK_MIGRATED_HEADING,
      },
    });

    expect(result).toBeUndefined();
  });

  it('is a no-op for a doc with neither heading nor supportingText', () => {
    const result = backfillHeadingBlock({ _id: MOCK_PAGE_ID });

    expect(result).toBeUndefined();
  });
});
