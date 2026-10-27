import { TAXONOMY_KIND } from '@blog/config/constants';
import { mockDocument } from '@blog/studio/testing/mock-documents';
import {
  MOCK_SYSTEM_FIELDS,
  mockMigrationContext,
} from '@blog/studio/testing/mock-migration';
import { faker } from '@faker-js/faker';
import {
  at,
  prepend,
  set,
  setIfMissing,
  type MigrationContext,
} from 'sanity/migrate';

import migration, {
  migrateTagIndexPage,
  toTaxonomyListModuleKey,
  type TTagIndexPageDoc,
} from './index';

faker.seed(1200);

const PAGE_TYPE = 'page_tagIndex';
const TAXONOMY_LIST_MODULE_TYPE = 'module_taxonomyList';
const MOCK_PAGE_ID = faker.string.uuid();
const MOCK_LIST_ID = faker.string.uuid();
const MOCK_UNREFERENCED_LIST_ID = faker.string.uuid();
const MOCK_HEADING = faker.lorem.words();
const MOCK_SUPPORTING_TEXT = faker.lorem.words();
const MOCK_MIGRATED_MODULES = [
  {
    _key: toTaxonomyListModuleKey(MOCK_LIST_ID),
    _type: TAXONOMY_LIST_MODULE_TYPE,
    _ref: MOCK_LIST_ID,
  },
];
const MOCK_MIGRATED_HEADING_BLOCK = {
  heading: MOCK_HEADING,
  supportingText: MOCK_SUPPORTING_TEXT,
};
const EXPECTED_PAGE_PATCHES = [
  at('modules', setIfMissing([])),
  at('modules', prepend([MOCK_MIGRATED_MODULES[0]])),
  at('headingBlock', setIfMissing(MOCK_MIGRATED_HEADING_BLOCK)),
];

describe(migrateTagIndexPage, () => {
  let doc: TTagIndexPageDoc;

  beforeEach(() => {
    doc = {
      taxonomyList: { _ref: MOCK_LIST_ID },
      heading: MOCK_HEADING,
      supportingText: MOCK_SUPPORTING_TEXT,
    };
  });

  it('folds the taxonomy list into modules[] and backfills headingBlock', () => {
    const result = migrateTagIndexPage(doc);

    expect(result).toEqual(EXPECTED_PAGE_PATCHES);
  });

  it('leaves an already migrated doc alone', () => {
    const result = migrateTagIndexPage({
      ...doc,
      modules: MOCK_MIGRATED_MODULES,
      headingBlock: MOCK_MIGRATED_HEADING_BLOCK,
    });

    expect(result).toBeUndefined();
  });

  it('leaves a doc with neither legacy field alone', () => {
    const result = migrateTagIndexPage({});

    expect(result).toBeUndefined();
  });
});

const mockContext = (
  pageDocs: {
    taxonomyRef?: string | null;
    moduleRefs?: (string | null)[] | null;
  }[],
): MigrationContext =>
  mockMigrationContext({ fetch: vi.fn().mockResolvedValue(pageDocs) });

describe('fold-page-tag-index-into-modules migration', () => {
  let context: MigrationContext;

  beforeEach(() => {
    context = mockContext([{ taxonomyRef: MOCK_LIST_ID, moduleRefs: [] }]);
  });

  it('migrates a legacy page document', async () => {
    const pageDoc = mockDocument({
      _id: MOCK_PAGE_ID,
      _type: PAGE_TYPE,
      ...MOCK_SYSTEM_FIELDS,
      taxonomyList: { _ref: MOCK_LIST_ID },
      heading: MOCK_HEADING,
      supportingText: MOCK_SUPPORTING_TEXT,
    });

    await expect(migration.migrate.document(pageDoc, context)).resolves.toEqual(
      EXPECTED_PAGE_PATCHES,
    );
  });

  it('leaves a migrated page document alone', async () => {
    const pageDoc = mockDocument({
      _id: MOCK_PAGE_ID,
      _type: PAGE_TYPE,
      ...MOCK_SYSTEM_FIELDS,
      taxonomyList: { _ref: MOCK_LIST_ID },
      heading: MOCK_HEADING,
      supportingText: MOCK_SUPPORTING_TEXT,
      modules: MOCK_MIGRATED_MODULES,
      headingBlock: MOCK_MIGRATED_HEADING_BLOCK,
    });

    await expect(migration.migrate.document(pageDoc, context)).resolves.toEqual(
      [],
    );
  });

  describe('with a taxonomy list module', () => {
    let moduleDoc: ReturnType<typeof mockDocument>;

    beforeEach(() => {
      moduleDoc = mockDocument({
        _id: MOCK_LIST_ID,
        _type: TAXONOMY_LIST_MODULE_TYPE,
        ...MOCK_SYSTEM_FIELDS,
      });
    });

    it('authors the taxonomy on a module a page references', async () => {
      await expect(
        migration.migrate.document(moduleDoc, context),
      ).resolves.toEqual([at('taxonomy', set(TAXONOMY_KIND.TAGS))]);
    });

    it('leaves a module no page references alone', async () => {
      const unreferencedModuleDoc = mockDocument({
        ...moduleDoc,
        _id: MOCK_UNREFERENCED_LIST_ID,
      });

      await expect(
        migration.migrate.document(unreferencedModuleDoc, context),
      ).resolves.toEqual([]);
    });

    it('leaves a module that already has a taxonomy alone', async () => {
      const migratedModuleDoc = mockDocument({
        ...moduleDoc,
        taxonomy: TAXONOMY_KIND.TAGS,
      });

      await expect(
        migration.migrate.document(migratedModuleDoc, context),
      ).resolves.toEqual([]);
    });
  });
});
