import {
  mockMigrationContext,
  mockMigrationDocument,
  runDocumentMigration,
} from '@blog/studio/testing/migrations/migration-document';
import { faker } from '@faker-js/faker';
import { del } from 'sanity/migrate';

import migration from './index';

faker.seed(8400);

const MOCK_AUTHOR_ID = faker.string.uuid();
const MOCK_DRAFT_AUTHOR_ID = `drafts.${MOCK_AUTHOR_ID}`;
const MOCK_PERSON_ID = `person-${MOCK_AUTHOR_ID}`;
const MOCK_DRAFT_PERSON_ID = `drafts.${MOCK_PERSON_ID}`;
const MOCK_NAME = faker.person.fullName();

const mockAuthor = (_id: string) =>
  mockMigrationDocument({ _id, _type: 'blog_author' });

const mockPerson = (_id: string, name?: string) =>
  mockMigrationDocument({ _id, _type: 'person', name });

describe('retire-blog-author', () => {
  it('deletes a blog_author once its person counterpart is verified deletable', async () => {
    const author = mockAuthor(MOCK_AUTHOR_ID);
    const context = mockMigrationContext([
      author,
      mockPerson(MOCK_PERSON_ID, MOCK_NAME),
    ]);

    const mutations = await runDocumentMigration(migration, author, context);

    expect(mutations).toEqual([del(MOCK_AUTHOR_ID)]);
  });

  it('deletes a draft blog_author when its draft person counterpart exists', async () => {
    const author = mockAuthor(MOCK_DRAFT_AUTHOR_ID);
    const context = mockMigrationContext([
      author,
      mockPerson(MOCK_DRAFT_PERSON_ID, MOCK_NAME),
    ]);

    const mutations = await runDocumentMigration(migration, author, context);

    expect(mutations).toEqual([del(MOCK_DRAFT_AUTHOR_ID)]);
  });

  it('rejects when the person counterpart does not exist', async () => {
    const author = mockAuthor(MOCK_AUTHOR_ID);
    const context = mockMigrationContext([author]);

    await expect(
      runDocumentMigration(migration, author, context),
    ).rejects.toThrow(
      `Cannot delete blog_author "${MOCK_AUTHOR_ID}": its person counterpart "${MOCK_PERSON_ID}" does not exist.`,
    );
  });

  it('rejects when only the published person exists for a draft blog_author', async () => {
    const author = mockAuthor(MOCK_DRAFT_AUTHOR_ID);
    const context = mockMigrationContext([
      author,
      mockPerson(MOCK_PERSON_ID, MOCK_NAME),
    ]);

    await expect(
      runDocumentMigration(migration, author, context),
    ).rejects.toThrow(
      `Cannot delete blog_author "${MOCK_DRAFT_AUTHOR_ID}": its person counterpart "${MOCK_DRAFT_PERSON_ID}" does not exist.`,
    );
  });

  it('leaves unrelated document types untouched', async () => {
    const person = mockPerson(MOCK_PERSON_ID, MOCK_NAME);

    const mutations = await runDocumentMigration(
      migration,
      person,
      mockMigrationContext([person]),
    );

    expect(mutations).toEqual([]);
  });
});
