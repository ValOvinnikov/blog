import {
  mockMigrationContext,
  mockMigrationDocument,
  runDocumentMigration,
} from '@blog/studio/testing/migrations/migration-document';
import { faker } from '@faker-js/faker';
import { at, createIfNotExists, patch, set, unset } from 'sanity/migrate';

import migration from './index';

faker.seed(19001);

const MOCK_HERO = { _type: 'reference', _ref: faker.string.uuid() };
const MOCK_MODULES = [
  {
    _key: faker.string.alphanumeric(12),
    _type: 'module_postList',
    _ref: faker.string.uuid(),
  },
];
const MOCK_TITLE = faker.lorem.words(2);

describe('move-blog-page-layout-into-templates', () => {
  it.each([
    ['page_postIndex', 'template_postIndex'],
    ['page_topicIndex', 'template_topicIndex'],
    ['page_tagIndex', 'template_tagIndex'],
    ['page_topic', 'template_topic'],
    ['page_tag', 'template_tag'],
  ])(
    'moves a %s hero and modules into a %s of its own',
    async (pageType, templateType) => {
      const page = mockMigrationDocument({
        _type: pageType,
        title: MOCK_TITLE,
        hero: MOCK_HERO,
        modules: MOCK_MODULES,
      });
      const templateId = `template-${page._id}`;

      const mutations = await runDocumentMigration(
        migration,
        page,
        mockMigrationContext([page]),
      );

      expect(mutations).toEqual([
        createIfNotExists({
          _id: templateId,
          _type: templateType,
          title: MOCK_TITLE,
          hero: MOCK_HERO,
          modules: MOCK_MODULES,
        }),
        patch(page._id, [
          at('template', set({ _type: 'reference', _ref: templateId })),
          at('hero', unset()),
          at('modules', unset()),
        ]),
      ]);
    },
  );

  it('gives each Topic page its own template', async () => {
    const design = mockMigrationDocument({
      _type: 'page_topic',
      title: MOCK_TITLE,
      hero: MOCK_HERO,
      modules: MOCK_MODULES,
    });
    const travel = mockMigrationDocument({
      _type: 'page_topic',
      title: MOCK_TITLE,
      hero: MOCK_HERO,
      modules: MOCK_MODULES,
    });
    const context = mockMigrationContext([design, travel]);

    const [designCreate] = (await runDocumentMigration(
      migration,
      design,
      context,
    )) as unknown[];
    const [travelCreate] = (await runDocumentMigration(
      migration,
      travel,
      context,
    )) as unknown[];

    expect([designCreate, travelCreate]).toEqual([
      createIfNotExists({
        _id: `template-${design._id}`,
        _type: 'template_topic',
        title: MOCK_TITLE,
        hero: MOCK_HERO,
        modules: MOCK_MODULES,
      }),
      createIfNotExists({
        _id: `template-${travel._id}`,
        _type: 'template_topic',
        title: MOCK_TITLE,
        hero: MOCK_HERO,
        modules: MOCK_MODULES,
      }),
    ]);
  });
});
