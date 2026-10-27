import { mockGroqFetch } from '@blog/studio/testing/mock-groq-fetch';
import {
  mockMigrationContext,
  mockMigrationDocument,
  runDocumentMigration,
} from '@blog/studio/testing/mock-migration';
import { faker } from '@faker-js/faker';
import type { SanityDocument } from 'sanity';
import { at, createOrReplace, patch, set } from 'sanity/migrate';

import migration from './index';

faker.seed(8352);

const MOCK_AUTHOR_ID = faker.string.uuid();
const MOCK_PERSON_ID = `person-${MOCK_AUTHOR_ID}`;
const MOCK_DRAFT_AUTHOR_ID = `drafts.${MOCK_AUTHOR_ID}`;
const MOCK_OTHER_AUTHOR_ID = faker.string.uuid();
const MOCK_AUTHOR_FIELDS = {
  name: faker.person.fullName(),
  image: { _type: 'imageWithAlt', alt: faker.lorem.words(2) },
  bio: [{ _type: 'block' }],
  role: faker.person.jobTitle(),
  socialLinks: [{ _type: 'socialProfile', url: faker.internet.url() }],
};

const mockAuthor = (_id: string) =>
  mockMigrationDocument({
    _id,
    _type: 'blog_author',
    ...MOCK_AUTHOR_FIELDS,
  });

const mockAuthorReferrer = (type: string, authorId: string) =>
  mockMigrationDocument({
    _type: type,
    author: { _type: 'reference', _ref: authorId },
  });

const referrerPatch = (document: SanityDocument, personId: string) =>
  patch(document._id, [at(['author', '_ref'], set(personId))]);

describe('create-person-from-blog-author', () => {
  describe('blog_author documents', () => {
    it('creates the matching person, carrying every field across', async () => {
      const author = mockAuthor(MOCK_AUTHOR_ID);
      const context = mockMigrationContext({ fetch: mockGroqFetch([author]) });

      const mutations = await runDocumentMigration(migration, author, context);

      expect(mutations).toEqual([
        createOrReplace({
          _id: MOCK_PERSON_ID,
          _type: 'person',
          ...MOCK_AUTHOR_FIELDS,
        }),
      ]);
    });

    it('maps a draft blog_author onto a draft person', async () => {
      const author = mockAuthor(MOCK_DRAFT_AUTHOR_ID);
      const context = mockMigrationContext({ fetch: mockGroqFetch([author]) });

      const mutations = await runDocumentMigration(migration, author, context);

      expect(mutations).toEqual([
        createOrReplace({
          _id: `drafts.${MOCK_PERSON_ID}`,
          _type: 'person',
          ...MOCK_AUTHOR_FIELDS,
        }),
      ]);
    });

    it('returns the same mutations when run twice against the same input', async () => {
      const author = mockAuthor(MOCK_AUTHOR_ID);

      const firstRun = await runDocumentMigration(
        migration,
        author,
        mockMigrationContext({ fetch: mockGroqFetch([author]) }),
      );
      const secondRun = await runDocumentMigration(
        migration,
        author,
        mockMigrationContext({ fetch: mockGroqFetch([author]) }),
      );

      expect(secondRun).toEqual(firstRun);
    });
  });

  describe('reference rewriting', () => {
    const context = mockMigrationContext({
      fetch: mockGroqFetch([mockAuthor(MOCK_AUTHOR_ID)]),
    });

    it.each(['page_post', 'blog_post', 'module_heroProfile'])(
      'rewrites %s.author pointing at a migrated author',
      async (type) => {
        const referrer = mockAuthorReferrer(type, MOCK_AUTHOR_ID);

        const mutations = await runDocumentMigration(
          migration,
          referrer,
          context,
        );

        expect(mutations).toEqual([referrerPatch(referrer, MOCK_PERSON_ID)]);
      },
    );

    it('produces no mutations for a document with no matching references', async () => {
      const topic = mockMigrationDocument({
        _type: 'blog_topic',
        name: faker.lorem.word(),
      });

      const mutations = await runDocumentMigration(migration, topic, context);

      expect(mutations).toEqual([]);
    });

    it('produces no mutations for a reference already pointing at its person', async () => {
      const migratedPost = mockAuthorReferrer('page_post', MOCK_PERSON_ID);

      const mutations = await runDocumentMigration(
        migration,
        migratedPost,
        context,
      );

      expect(mutations).toEqual([]);
    });

    it('keeps the author id map scoped to its own migration run', async () => {
      const post = mockAuthorReferrer('page_post', MOCK_AUTHOR_ID);
      await runDocumentMigration(migration, post, context);

      const otherRunMutations = await runDocumentMigration(
        migration,
        post,
        mockMigrationContext({
          fetch: mockGroqFetch([mockAuthor(MOCK_OTHER_AUTHOR_ID)]),
        }),
      );

      expect(otherRunMutations).toEqual([]);
    });
  });
});
