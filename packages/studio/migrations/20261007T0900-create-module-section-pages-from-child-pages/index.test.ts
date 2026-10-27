import {
  BRAND_VARIANT,
  CONTENT_ALIGNMENT,
  SPACING_SCALE,
} from '@blog/config/constants';
import {
  mockMigrationDocument,
  runDocumentMigration,
} from '@blog/studio/testing/migrations/migration-document';
import { faker } from '@faker-js/faker';
import { at, createIfNotExists, set } from 'sanity/migrate';

import migration from './index';

faker.seed(9001);

const MOCK_CHILD_PAGES_ID = faker.string.uuid();
const MOCK_OTHER_CHILD_PAGES_ID = faker.string.uuid();
const MOCK_SECTION_PAGES_ID = `sectionPages-${MOCK_CHILD_PAGES_ID}`;
const MOCK_CHILD_PAGES_FIELDS = {
  title: faker.lorem.words(2),
  brandVariant: BRAND_VARIANT.PRIMARY,
  headingBlock: {
    _type: 'moduleHeadingBlock',
    heading: faker.lorem.words(3),
  },
  alignment: CONTENT_ALIGNMENT.CENTER,
  layout: { _type: 'wideLayout', spacingTop: SPACING_SCALE.MD },
};
const MOCK_CTA_ITEM = {
  _key: faker.string.alphanumeric(12),
  _type: 'module_cta',
  _ref: faker.string.uuid(),
};
const MOCK_CHILD_PAGES_KEY = faker.string.alphanumeric(12);
const MOCK_WEAK_CHILD_PAGES_KEY = faker.string.alphanumeric(12);

const mockChildPages = (_id: string) =>
  mockMigrationDocument({
    _id,
    _type: 'module_childPages',
    ...MOCK_CHILD_PAGES_FIELDS,
  });

const mockLandingTemplate = (modules?: unknown[]) =>
  mockMigrationDocument({ _type: 'template_landing', modules });

describe('create-module-section-pages-from-child-pages', () => {
  describe('module_childPages documents', () => {
    it('creates a module_sectionPages carrying every field across', async () => {
      const mutations = await runDocumentMigration(
        migration,
        mockChildPages(MOCK_CHILD_PAGES_ID),
      );

      expect(mutations).toEqual([
        createIfNotExists({
          _id: MOCK_SECTION_PAGES_ID,
          _type: 'module_sectionPages',
          ...MOCK_CHILD_PAGES_FIELDS,
        }),
      ]);
    });

    it('lands a draft module_childPages on the draft module_sectionPages', async () => {
      const mutations = await runDocumentMigration(
        migration,
        mockChildPages(`drafts.${MOCK_CHILD_PAGES_ID}`),
      );

      expect(mutations).toEqual([
        createIfNotExists({
          _id: `drafts.${MOCK_SECTION_PAGES_ID}`,
          _type: 'module_sectionPages',
          ...MOCK_CHILD_PAGES_FIELDS,
        }),
      ]);
    });
  });

  describe('template_landing documents', () => {
    it('repoints every module_childPages item in modules[], leaving other modules alone', async () => {
      const template = mockLandingTemplate([
        {
          _key: MOCK_CHILD_PAGES_KEY,
          _type: 'module_childPages',
          _ref: MOCK_CHILD_PAGES_ID,
        },
        MOCK_CTA_ITEM,
        {
          _key: MOCK_WEAK_CHILD_PAGES_KEY,
          _type: 'module_childPages',
          _ref: MOCK_OTHER_CHILD_PAGES_ID,
          _weak: true,
          _strengthenOnPublish: { type: 'module_childPages' },
        },
      ]);

      const mutations = await runDocumentMigration(migration, template);

      expect(mutations).toEqual([
        at(
          ['modules', { _key: MOCK_CHILD_PAGES_KEY }],
          set({
            _key: MOCK_CHILD_PAGES_KEY,
            _type: 'module_sectionPages',
            _ref: MOCK_SECTION_PAGES_ID,
          }),
        ),
        at(
          ['modules', { _key: MOCK_WEAK_CHILD_PAGES_KEY }],
          set({
            _key: MOCK_WEAK_CHILD_PAGES_KEY,
            _type: 'module_sectionPages',
            _ref: `sectionPages-${MOCK_OTHER_CHILD_PAGES_ID}`,
            _weak: true,
            _strengthenOnPublish: { type: 'module_sectionPages' },
          }),
        ),
      ]);
    });

    it.each([
      { title: 'without a module_childPages item', modules: [MOCK_CTA_ITEM] },
      { title: 'with no modules field', modules: undefined },
      {
        title: 'whose items already point at module_sectionPages',
        modules: [
          {
            _key: MOCK_CHILD_PAGES_KEY,
            _type: 'module_sectionPages',
            _ref: MOCK_SECTION_PAGES_ID,
          },
        ],
      },
    ])('leaves a template $title alone', async ({ modules }) => {
      const mutations = await runDocumentMigration(
        migration,
        mockLandingTemplate(modules),
      );

      expect(mutations).toBeUndefined();
    });
  });
});
