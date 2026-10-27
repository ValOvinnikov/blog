import { PAGE_POST_TYPE } from '@blog/studio/schema-types/documents/pages/post/post-type';
import { mockReference } from '@blog/studio/testing/mock-documents';
import {
  MOCK_SYSTEM_FIELDS,
  mockMigrationContext,
} from '@blog/studio/testing/mock-migration';
import { faker } from '@faker-js/faker';
import {
  at,
  createIfNotExists,
  createOrReplace,
  patch,
  set,
} from 'sanity/migrate';

import {
  SHARED_MODULE_IDS,
  sharedNewsletterModule,
  sharedPostRelatedModule,
} from './shared-modules';

import migration from './index';

faker.seed(11);

const MOCK_POST_ID = faker.string.uuid();
const MOCK_DRAFT_POST_ID = `drafts.${MOCK_POST_ID}`;
const MOCK_HERO_ID = faker.string.uuid();
const MOCK_AUTHOR_ID = faker.string.uuid();
const MOCK_TOPIC_ID = faker.string.uuid();
const MOCK_TITLE = faker.lorem.words();
const MOCK_EXCERPT = faker.lorem.sentence();
const MOCK_SLUG = faker.lorem.slug();
const MOCK_SEO_TITLE = faker.lorem.words();
const MOCK_PUBLISHED_AT = faker.date
  .past({ refDate: '2026-03-01T00:00:00Z' })
  .toISOString();
const MOCK_PAGE_POST_ID = `page_post-${MOCK_POST_ID}`;
const MOCK_DRAFT_PAGE_POST_ID = `drafts.page_post-${MOCK_POST_ID}`;

type TExistingPagePost = {
  title?: string;
  slug?: { _type: 'slug'; current?: string };
  publishedAt?: string;
  seo?: unknown;
};

const mockContext = ({
  blogPostIds = [MOCK_POST_ID],
  existingPagePosts = {},
}: {
  blogPostIds?: string[];
  existingPagePosts?: Record<string, TExistingPagePost>;
} = {}) =>
  mockMigrationContext({
    fetch: async (query: string, params: { id?: string }) => {
      if (query.includes('_type == $type')) {
        return blogPostIds;
      }

      return existingPagePosts[params.id ?? ''] ?? null;
    },
  });

const mockPostDoc = (fields: Record<string, unknown> = {}) => ({
  ...MOCK_SYSTEM_FIELDS,
  _id: MOCK_POST_ID,
  _type: 'blog_post',
  title: MOCK_TITLE,
  slug: { _type: 'slug' as const, current: MOCK_SLUG },
  excerpt: MOCK_EXCERPT,
  author: mockReference(MOCK_AUTHOR_ID),
  topic: mockReference(MOCK_TOPIC_ID),
  publishedAt: MOCK_PUBLISHED_AT,
  body: [],
  featured: true,
  newsletterEnabled: true,
  seo: { metaTitle: MOCK_SEO_TITLE },
  ...fields,
});

type TCreateOrReplaceMutation = ReturnType<typeof createOrReplace>;

const isCreateOrReplace = (
  mutation: unknown,
): mutation is TCreateOrReplaceMutation =>
  Boolean(
    mutation &&
    typeof mutation === 'object' &&
    'type' in mutation &&
    mutation.type === 'createOrReplace',
  );

const getCreateOrReplace = (mutations: unknown[]): TCreateOrReplaceMutation => {
  const mutation = mutations.find(isCreateOrReplace);

  if (!mutation) {
    throw new Error('Expected a createOrReplace mutation.');
  }

  return mutation;
};

describe('absorb-blog-post-into-page-post migration', () => {
  describe('blog_post documents', () => {
    it('creates the shared modules and the page_post', async () => {
      const mutations = await migration.migrate.document(
        mockPostDoc(),
        mockContext(),
      );

      expect(mutations).toEqual([
        createIfNotExists(sharedPostRelatedModule),
        createIfNotExists(sharedNewsletterModule),
        createOrReplace({
          _id: MOCK_PAGE_POST_ID,
          _type: PAGE_POST_TYPE,
          author: mockReference(MOCK_AUTHOR_ID),
          topic: mockReference(MOCK_TOPIC_ID),
          content: [],
          featured: true,
          title: MOCK_TITLE,
          sectionHeader: {
            _type: 'requiredHeadingSectionHeader',
            heading: MOCK_TITLE,
            supportingText: MOCK_EXCERPT,
          },
          slug: { _type: 'slug', current: MOCK_SLUG },
          publishedAt: MOCK_PUBLISHED_AT,
          seo: { metaTitle: MOCK_SEO_TITLE },
          modules: [
            {
              _type: 'reference',
              _key: 'postRelated',
              _ref: SHARED_MODULE_IDS.POST_RELATED,
            },
            {
              _type: 'reference',
              _key: 'newsletter',
              _ref: SHARED_MODULE_IDS.NEWSLETTER,
            },
          ],
        }),
      ]);
    });

    it('keeps the title an existing page_post already carries', async () => {
      const existingTitle = faker.lorem.words();
      const context = mockContext({
        existingPagePosts: {
          [MOCK_PAGE_POST_ID]: { title: existingTitle },
        },
      });

      const mutations = (await migration.migrate.document(
        mockPostDoc(),
        context,
      )) as unknown[];
      const { document } = getCreateOrReplace(mutations);

      expect(document).toHaveProperty('title', existingTitle);
    });

    it('maps a draft blog_post onto a draft page_post', async () => {
      const context = mockContext({ blogPostIds: [MOCK_DRAFT_POST_ID] });

      const mutations = (await migration.migrate.document(
        mockPostDoc({ _id: MOCK_DRAFT_POST_ID }),
        context,
      )) as unknown[];
      const { document } = getCreateOrReplace(mutations);

      expect(document._id).toBe(MOCK_DRAFT_PAGE_POST_ID);
    });

    it('returns the same mutations when run again over its own output', async () => {
      const postDoc = mockPostDoc();
      const firstRun = await migration.migrate.document(postDoc, mockContext());
      const secondContext = mockContext({
        existingPagePosts: {
          [MOCK_PAGE_POST_ID]: {
            title: postDoc.title,
            slug: postDoc.slug,
            publishedAt: postDoc.publishedAt,
            seo: postDoc.seo,
          },
        },
      });

      const secondRun = await migration.migrate.document(
        postDoc,
        secondContext,
      );

      expect(secondRun).toEqual(firstRun);
    });
  });

  describe('reference rewriting', () => {
    it('repoints a featured post reference at the migrated page_post', async () => {
      const heroDoc = {
        ...MOCK_SYSTEM_FIELDS,
        _id: MOCK_HERO_ID,
        _type: 'module_hero',
        featuredPost: mockReference(MOCK_POST_ID),
      };

      const mutations = await migration.migrate.document(
        heroDoc,
        mockContext(),
      );

      expect(mutations).toEqual([
        patch(MOCK_HERO_ID, [
          at(['featuredPost', '_ref'], set(MOCK_PAGE_POST_ID)),
        ]),
      ]);
    });

    it('produces no mutations for a document without matching references', async () => {
      const authorDoc = {
        ...MOCK_SYSTEM_FIELDS,
        _id: MOCK_AUTHOR_ID,
        _type: 'blog_author',
        name: faker.person.fullName(),
      };

      const mutations = await migration.migrate.document(
        authorDoc,
        mockContext(),
      );

      expect(mutations).toEqual([]);
    });
  });
});
