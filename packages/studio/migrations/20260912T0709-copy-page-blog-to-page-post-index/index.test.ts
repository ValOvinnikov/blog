import { mockReference } from '@blog/studio/testing/mock-documents';
import { MOCK_SYSTEM_FIELDS } from '@blog/studio/testing/mock-migration';
import { faker } from '@faker-js/faker';
import { at, patch, set, type createOrReplace } from 'sanity/migrate';

import { PAGE_BLOG_TYPE, PAGE_POST_INDEX_TYPE } from './ids';

import migration from './index';

faker.seed(6018);

type TCreateOrReplaceMutation = ReturnType<typeof createOrReplace>;

const DRAFTS_PREFIX = 'drafts.';
const MOCK_HERO_ID = faker.string.uuid();
const MOCK_POST_LIST_ID = faker.string.uuid();
const MOCK_CTA_ID = faker.string.uuid();
const MOCK_HERO_MODULE_ID = faker.string.uuid();
const MOCK_AUTHOR_ID = faker.string.uuid();
const MOCK_ACTION_KEY = faker.string.uuid();
const MOCK_TITLE = faker.lorem.words();
const MOCK_HEADING_BLOCK = {
  _type: 'headingBlock',
  heading: faker.lorem.words(),
};
const MOCK_SEO = { _type: 'seo', metaTitle: faker.lorem.words() };
const MOCK_MODULES = [
  { ...mockReference(MOCK_POST_LIST_ID), _key: faker.string.uuid() },
  { ...mockReference(MOCK_CTA_ID), _key: faker.string.uuid() },
];

const isCreateOrReplace = (
  mutation: unknown,
): mutation is TCreateOrReplaceMutation =>
  Boolean(
    mutation &&
    typeof mutation === 'object' &&
    'type' in mutation &&
    mutation.type === 'createOrReplace',
  );

const getCreateOrReplace = (
  mutations: unknown[],
): TCreateOrReplaceMutation | undefined => mutations.find(isCreateOrReplace);

const pageBlogDoc = {
  ...MOCK_SYSTEM_FIELDS,
  _id: PAGE_BLOG_TYPE,
  _type: PAGE_BLOG_TYPE,
  title: MOCK_TITLE,
  headingBlock: MOCK_HEADING_BLOCK,
  hero: mockReference(MOCK_HERO_ID),
  modules: MOCK_MODULES,
  seo: MOCK_SEO,
};

const postIndexDocument = {
  _id: PAGE_POST_INDEX_TYPE,
  _type: PAGE_POST_INDEX_TYPE,
  title: MOCK_TITLE,
  headingBlock: MOCK_HEADING_BLOCK,
  hero: mockReference(MOCK_HERO_ID),
  modules: MOCK_MODULES,
  seo: MOCK_SEO,
};

describe('copy-page-blog-to-page-post-index migration', () => {
  describe('page_blog documents', () => {
    it('creates page_postIndex with the content fields copied over', async () => {
      const mutations = (await migration.migrate.document(
        pageBlogDoc,
      )) as unknown[];

      expect(getCreateOrReplace(mutations)?.document).toEqual(
        postIndexDocument,
      );
    });

    it('maps a draft page_blog onto a draft page_postIndex', async () => {
      const draftDoc = {
        ...pageBlogDoc,
        _id: `${DRAFTS_PREFIX}${PAGE_BLOG_TYPE}`,
      };

      const mutations = (await migration.migrate.document(
        draftDoc,
      )) as unknown[];

      expect(getCreateOrReplace(mutations)?.document._id).toBe(
        `${DRAFTS_PREFIX}${PAGE_POST_INDEX_TYPE}`,
      );
    });

    it('rewrites a page_blog self-reference inside a copied field', async () => {
      const docWithSelfRef = {
        ...pageBlogDoc,
        hero: mockReference(PAGE_BLOG_TYPE),
      };

      const mutations = (await migration.migrate.document(
        docWithSelfRef,
      )) as unknown[];

      expect(getCreateOrReplace(mutations)?.document).toEqual({
        ...postIndexDocument,
        hero: mockReference(PAGE_POST_INDEX_TYPE),
      });
    });

    it('returns the same mutations on a second run', async () => {
      const firstRun = await migration.migrate.document(pageBlogDoc);
      const secondRun = await migration.migrate.document(pageBlogDoc);

      expect(secondRun).toEqual(firstRun);
    });
  });

  describe('reference rewriting', () => {
    it('rewrites a link internalReference pointing at page_blog', async () => {
      const ctaDoc = {
        ...MOCK_SYSTEM_FIELDS,
        _id: MOCK_CTA_ID,
        _type: 'module_cta',
        actions: [
          {
            _type: 'link',
            _key: MOCK_ACTION_KEY,
            linkType: 'INTERNAL',
            internalReference: mockReference(PAGE_BLOG_TYPE),
          },
        ],
      };

      const mutations = await migration.migrate.document(ctaDoc);

      expect(mutations).toEqual([
        patch(MOCK_CTA_ID, [
          at(
            ['actions', { _key: MOCK_ACTION_KEY }, 'internalReference', '_ref'],
            set(PAGE_POST_INDEX_TYPE),
          ),
        ]),
      ]);
    });

    it('rewrites a reference pointing at the draft page_blog', async () => {
      const heroDoc = {
        ...MOCK_SYSTEM_FIELDS,
        _id: MOCK_HERO_MODULE_ID,
        _type: 'module_hero',
        featuredPage: mockReference(`${DRAFTS_PREFIX}${PAGE_BLOG_TYPE}`),
      };

      const mutations = await migration.migrate.document(heroDoc);

      expect(mutations).toEqual([
        patch(MOCK_HERO_MODULE_ID, [
          at(
            ['featuredPage', '_ref'],
            set(`${DRAFTS_PREFIX}${PAGE_POST_INDEX_TYPE}`),
          ),
        ]),
      ]);
    });

    it('produces no mutations for a document with no matching references', async () => {
      const otherDoc = {
        ...MOCK_SYSTEM_FIELDS,
        _id: MOCK_AUTHOR_ID,
        _type: 'blog_author',
        name: faker.person.fullName(),
      };

      const mutations = await migration.migrate.document(otherDoc);

      expect(mutations).toEqual([]);
    });
  });
});
