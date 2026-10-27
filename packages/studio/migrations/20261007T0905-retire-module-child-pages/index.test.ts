import {
  mockMigrationContext,
  mockMigrationDocument,
  runDocumentMigration,
} from '@blog/studio/testing/migrations/migration-document';
import { faker } from '@faker-js/faker';
import { del } from 'sanity/migrate';

import migration from './index';

faker.seed(9050);

const MOCK_CHILD_PAGES_ID = faker.string.uuid();
const MOCK_DRAFT_CHILD_PAGES_ID = `drafts.${MOCK_CHILD_PAGES_ID}`;
const MOCK_SECTION_PAGES_ID = `sectionPages-${MOCK_CHILD_PAGES_ID}`;
const MOCK_DRAFT_SECTION_PAGES_ID = `drafts.${MOCK_SECTION_PAGES_ID}`;
const MOCK_TITLE = faker.lorem.words(2);

const mockChildPages = (_id: string) =>
  mockMigrationDocument({ _id, _type: 'module_childPages' });

const mockSectionPages = (_id: string, title?: string) =>
  mockMigrationDocument({ _id, _type: 'module_sectionPages', title });

describe('retire-module-child-pages', () => {
  it('deletes child pages once their section-pages counterpart is safe to delete', async () => {
    const childPages = mockChildPages(MOCK_CHILD_PAGES_ID);
    const context = mockMigrationContext([
      childPages,
      mockSectionPages(MOCK_SECTION_PAGES_ID, MOCK_TITLE),
    ]);

    const mutations = await runDocumentMigration(
      migration,
      childPages,
      context,
    );

    expect(mutations).toEqual([del(MOCK_CHILD_PAGES_ID)]);
  });

  it('deletes a draft module_childPages when its draft counterpart exists', async () => {
    const childPages = mockChildPages(MOCK_DRAFT_CHILD_PAGES_ID);
    const context = mockMigrationContext([
      childPages,
      mockSectionPages(MOCK_DRAFT_SECTION_PAGES_ID, MOCK_TITLE),
    ]);

    const mutations = await runDocumentMigration(
      migration,
      childPages,
      context,
    );

    expect(mutations).toEqual([del(MOCK_DRAFT_CHILD_PAGES_ID)]);
  });

  it('rejects when the counterpart does not exist', async () => {
    const childPages = mockChildPages(MOCK_CHILD_PAGES_ID);
    const context = mockMigrationContext([childPages]);

    await expect(
      runDocumentMigration(migration, childPages, context),
    ).rejects.toThrow(
      `Cannot delete module_childPages "${MOCK_CHILD_PAGES_ID}": its module_sectionPages counterpart "${MOCK_SECTION_PAGES_ID}" does not exist.`,
    );
  });

  it('rejects while a document still references it', async () => {
    const childPages = mockChildPages(MOCK_CHILD_PAGES_ID);
    const referrer = mockMigrationDocument({
      _type: 'template_landing',
      modules: [{ _type: 'module_childPages', _ref: MOCK_CHILD_PAGES_ID }],
    });
    const context = mockMigrationContext([
      childPages,
      mockSectionPages(MOCK_SECTION_PAGES_ID, MOCK_TITLE),
      referrer,
    ]);

    await expect(
      runDocumentMigration(migration, childPages, context),
    ).rejects.toThrow(
      `Cannot delete module_childPages "${MOCK_CHILD_PAGES_ID}": still referenced by 1 document(s).`,
    );
  });

  it('leaves unrelated document types untouched', async () => {
    const sectionPages = mockSectionPages(MOCK_SECTION_PAGES_ID, MOCK_TITLE);

    const mutations = await runDocumentMigration(
      migration,
      sectionPages,
      mockMigrationContext([sectionPages]),
    );

    expect(mutations).toEqual([]);
  });
});
