import { BRAND_VARIANT, SPACING_SCALE } from '@blog/config/constants';
import { mockHomePage } from '@blog/studio/testing/mock-documents';
import { MOCK_SYSTEM_FIELDS } from '@blog/studio/testing/mock-migration';
import { faker } from '@faker-js/faker';
import { at, createIfNotExists, set } from 'sanity/migrate';

import migration from './index';

faker.seed(13);

const MOCK_POST_LIST_ID = faker.string.uuid();
const MOCK_PAGE_ID = faker.string.uuid();
const MOCK_TITLE = faker.lorem.words();
const MOCK_SECTION_HEADER = { heading: faker.lorem.words() };
const MOCK_LAYOUT = { spacing: SPACING_SCALE.MD };
const MOCK_FIRST_ITEM_KEY = faker.string.alphanumeric(6);
const MOCK_SECOND_ITEM_KEY = faker.string.alphanumeric(6);
const MOCK_THIRD_ITEM_KEY = faker.string.alphanumeric(6);
const MOCK_FIRST_POST_LIST_ID = faker.string.uuid();
const MOCK_SECOND_POST_LIST_ID = faker.string.uuid();
const MOCK_CTA_ID = faker.string.uuid();

const LIMIT = 3;
const POST_LATEST_LIMIT_MAX = 12;
const OVER_MAX_LIMIT = 24;

const mockModuleItem = (key: string, type: string, ref: string) => ({
  _key: key,
  _type: type,
  _ref: ref,
});

const mockPostList = (fields: Record<string, unknown>) => ({
  ...MOCK_SYSTEM_FIELDS,
  _id: MOCK_POST_LIST_ID,
  _type: 'module_postList',
  title: MOCK_TITLE,
  ...fields,
});

const mockRepointedItem = (key: string, postListId: string) =>
  at(
    ['modules', { _key: key }],
    set(mockModuleItem(key, 'module_postLatest', `postLatest-${postListId}`)),
  );

describe('create-module-post-latest-from-post-list migration', () => {
  describe('module_postList documents', () => {
    it('creates a module_postLatest carrying the postList fields', () => {
      const postList = mockPostList({
        brandVariant: BRAND_VARIANT.PRIMARY,
        sectionHeader: MOCK_SECTION_HEADER,
        limit: LIMIT,
        layout: MOCK_LAYOUT,
      });

      const result = migration.migrate.document(postList);

      expect(result).toEqual([
        createIfNotExists({
          _id: `postLatest-${MOCK_POST_LIST_ID}`,
          _type: 'module_postLatest',
          title: MOCK_TITLE,
          brandVariant: BRAND_VARIANT.PRIMARY,
          sectionHeader: MOCK_SECTION_HEADER,
          limit: LIMIT,
          layout: MOCK_LAYOUT,
        }),
      ]);
    });

    it('clamps a limit above the target schema max', () => {
      const postList = mockPostList({ limit: OVER_MAX_LIMIT });

      const result = migration.migrate.document(postList);

      expect(result).toEqual([
        createIfNotExists({
          _id: `postLatest-${MOCK_POST_LIST_ID}`,
          _type: 'module_postLatest',
          title: MOCK_TITLE,
          limit: POST_LATEST_LIMIT_MAX,
        }),
      ]);
    });
  });

  describe('page_home documents', () => {
    it('repoints every module_postList item in modules', () => {
      const page = mockHomePage({
        _id: MOCK_PAGE_ID,
        modules: [
          mockModuleItem(
            MOCK_FIRST_ITEM_KEY,
            'module_postList',
            MOCK_FIRST_POST_LIST_ID,
          ),
          mockModuleItem(MOCK_SECOND_ITEM_KEY, 'module_cta', MOCK_CTA_ID),
          mockModuleItem(
            MOCK_THIRD_ITEM_KEY,
            'module_postList',
            MOCK_SECOND_POST_LIST_ID,
          ),
        ],
      });

      const result = migration.migrate.document(page);

      expect(result).toEqual([
        mockRepointedItem(MOCK_FIRST_ITEM_KEY, MOCK_FIRST_POST_LIST_ID),
        mockRepointedItem(MOCK_THIRD_ITEM_KEY, MOCK_SECOND_POST_LIST_ID),
      ]);
    });

    it.each([
      [
        'only other modules',
        [mockModuleItem(MOCK_SECOND_ITEM_KEY, 'module_cta', MOCK_CTA_ID)],
      ],
      [
        'only migrated module_postLatest items',
        [
          mockModuleItem(
            MOCK_FIRST_ITEM_KEY,
            'module_postLatest',
            `postLatest-${MOCK_FIRST_POST_LIST_ID}`,
          ),
        ],
      ],
      ['no modules field', undefined],
    ])('leaves a page_home with %s alone', (_label, modules) => {
      const page = mockHomePage({ _id: MOCK_PAGE_ID, modules });

      const result = migration.migrate.document(page);

      expect(result).toBeUndefined();
    });
  });
});
