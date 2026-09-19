import { TAXONOMY_KIND } from '@blog/config/constants';
import { at, set, type MigrationContext } from 'sanity/migrate';

import migration, {
  backfillHeadingBlock,
  foldTaxonomyListIntoModules,
  migrateTagIndexPage,
  toTaxonomyListModuleKey,
  type TTagIndexPageDoc,
} from './index';

const baseDoc = {
  _id: 'page_tagIndex',
  _type: 'page_tagIndex',
  _createdAt: '2026-01-01T00:00:00Z',
  _updatedAt: '2026-01-01T00:00:00Z',
  _rev: 'rev-1',
};

describe('migrateTagIndexPage', () => {
  it('applies both the fold and the backfill for a fully legacy document', () => {
    const doc = {
      ...baseDoc,
      taxonomyList: { _ref: 'list-1' },
      heading: 'Tags',
      supportingText: 'Browse every tag.',
    };

    expect(migrateTagIndexPage(doc)).toEqual([
      ...(foldTaxonomyListIntoModules(doc) ?? []),
      ...(backfillHeadingBlock(doc) ?? []),
    ]);
    expect(migrateTagIndexPage(doc)).toHaveLength(3);
  });

  it('is idempotent — running it twice produces no further patches the second time', () => {
    const doc = {
      ...baseDoc,
      taxonomyList: { _ref: 'list-1' },
      heading: 'Tags',
      supportingText: 'Browse every tag.',
    };

    const alreadyMigrated = {
      ...doc,
      modules: [
        {
          _key: toTaxonomyListModuleKey('list-1'),
          _type: 'module_taxonomyList',
          _ref: 'list-1',
        },
      ],
      headingBlock: {
        heading: 'Tags',
        supportingText: 'Browse every tag.',
      },
    };

    expect(migrateTagIndexPage(alreadyMigrated)).toBeUndefined();
  });

  it('produces no patches for a document with neither legacy field populated', () => {
    const doc = { ...baseDoc } as TTagIndexPageDoc;

    expect(migrateTagIndexPage(doc)).toBeUndefined();
  });
});

const createMockContext = (
  pageDocs: {
    taxonomyRef?: string | null;
    moduleRefs?: (string | null)[] | null;
  }[],
): MigrationContext => {
  const fetch = async () => pageDocs;

  return { client: { fetch } } as unknown as MigrationContext;
};

describe('fold-page-tag-index-into-modules migration', () => {
  it('is scoped to page_tagIndex and module_taxonomyList', () => {
    expect(migration.documentTypes).toEqual([
      'page_tagIndex',
      'module_taxonomyList',
    ]);
  });

  it('delegates a page_tagIndex document to migrateTagIndexPage', async () => {
    const doc = {
      ...baseDoc,
      taxonomyList: { _ref: 'list-1' },
    };
    const context = createMockContext([]);

    await expect(migration.migrate.document(doc, context)).resolves.toEqual(
      migrateTagIndexPage(doc),
    );
  });

  it('authors taxonomy on a referenced module_taxonomyList document', async () => {
    const moduleDoc = {
      _id: 'list-1',
      _type: 'module_taxonomyList',
      _createdAt: '2026-01-01T00:00:00Z',
      _updatedAt: '2026-01-01T00:00:00Z',
      _rev: 'rev-1',
    };
    const context = createMockContext([
      { taxonomyRef: 'list-1', moduleRefs: [] },
    ]);

    await expect(
      migration.migrate.document(moduleDoc, context),
    ).resolves.toEqual([at('taxonomy', set(TAXONOMY_KIND.TAGS))]);
  });

  it('does not author taxonomy on a module_taxonomyList document no page references', async () => {
    const moduleDoc = {
      _id: 'list-2',
      _type: 'module_taxonomyList',
      _createdAt: '2026-01-01T00:00:00Z',
      _updatedAt: '2026-01-01T00:00:00Z',
      _rev: 'rev-1',
    };
    const context = createMockContext([
      { taxonomyRef: 'list-1', moduleRefs: [] },
    ]);

    await expect(
      migration.migrate.document(moduleDoc, context),
    ).resolves.toEqual([]);
  });

  it('is idempotent across a whole run — the fold and the module patch both settle', async () => {
    const pageDoc = {
      ...baseDoc,
      taxonomyList: { _ref: 'list-1' },
      heading: 'Tags',
      supportingText: 'Browse every tag.',
    };
    const moduleDoc = {
      _id: 'list-1',
      _type: 'module_taxonomyList',
      _createdAt: '2026-01-01T00:00:00Z',
      _updatedAt: '2026-01-01T00:00:00Z',
      _rev: 'rev-1',
    };
    const context = createMockContext([
      { taxonomyRef: 'list-1', moduleRefs: [] },
    ]);

    const firstPagePatch = await migration.migrate.document(pageDoc, context);
    const firstModulePatch = await migration.migrate.document(
      moduleDoc,
      context,
    );

    const migratedPageDoc = {
      ...pageDoc,
      modules: [
        {
          _key: toTaxonomyListModuleKey('list-1'),
          _type: 'module_taxonomyList',
          _ref: 'list-1',
        },
      ],
      headingBlock: {
        heading: 'Tags',
        supportingText: 'Browse every tag.',
      },
    };
    const migratedModuleDoc = { ...moduleDoc, taxonomy: TAXONOMY_KIND.TAGS };
    const secondContext = createMockContext([
      { taxonomyRef: 'list-1', moduleRefs: ['list-1'] },
    ]);

    expect(firstPagePatch).toBeDefined();
    expect(firstModulePatch).toEqual([at('taxonomy', set(TAXONOMY_KIND.TAGS))]);

    await expect(
      migration.migrate.document(migratedPageDoc, secondContext),
    ).resolves.toEqual([]);
    await expect(
      migration.migrate.document(migratedModuleDoc, secondContext),
    ).resolves.toEqual([]);
  });
});
