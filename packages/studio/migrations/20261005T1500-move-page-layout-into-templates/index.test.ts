import { LOCALE_ISO_CODES } from '@blog/config/constants';
import {
  mockMigrationContext,
  mockMigrationDocument,
  runDocumentMigration,
} from '@blog/studio/testing/migrations/migration-document';
import { faker } from '@faker-js/faker';
import { at, createIfNotExists, patch, set, unset } from 'sanity/migrate';

import migration from './index';

faker.seed(15000);

const MOCK_HERO = { _type: 'reference', _ref: faker.string.uuid() };
const MOCK_MODULES = [
  {
    _key: faker.string.alphanumeric(12),
    _type: 'module_cta',
    _ref: faker.string.uuid(),
  },
];
const MOCK_ENGLISH_TITLE = faker.lorem.words(2);
const MOCK_DUTCH_TITLE = faker.lorem.words(2);
const MOCK_ENGLISH_ID = faker.string.uuid();
const MOCK_DUTCH_ID = faker.string.uuid();
const MOCK_TEMPLATE_ID = `template-${MOCK_ENGLISH_ID}`;

const mockReference = (ref: string) => ({ _type: 'reference', _ref: ref });

const mockTranslationGroup = (...pageIds: string[]) =>
  mockMigrationDocument({
    _type: 'translation.metadata',
    translations: pageIds.map((id) => ({ value: mockReference(id) })),
  });

const mockEnglishPage = () =>
  mockMigrationDocument({
    _id: MOCK_ENGLISH_ID,
    _type: 'page_landing',
    language: LOCALE_ISO_CODES.EN,
    title: MOCK_ENGLISH_TITLE,
    hero: MOCK_HERO,
    modules: MOCK_MODULES,
  });

const mockDutchPage = (fields: Record<string, unknown> = {}) =>
  mockMigrationDocument({
    _id: MOCK_DUTCH_ID,
    _type: 'page_landing',
    language: LOCALE_ISO_CODES.NL,
    title: MOCK_DUTCH_TITLE,
    modules: [],
    ...fields,
  });

const expectedTemplateCreate = createIfNotExists({
  _id: MOCK_TEMPLATE_ID,
  _type: 'template_landing',
  title: MOCK_ENGLISH_TITLE,
  hero: MOCK_HERO,
  modules: MOCK_MODULES,
});

const expectedPagePatch = (pageId: string, withHero: boolean) =>
  patch(pageId, [
    at('template', set(mockReference(MOCK_TEMPLATE_ID))),
    ...(withHero ? [at('hero', unset())] : []),
    at('modules', unset()),
  ]);

describe('move-page-layout-into-templates', () => {
  const english = mockEnglishPage();
  const dutch = mockDutchPage();
  const group = mockTranslationGroup(MOCK_ENGLISH_ID, MOCK_DUTCH_ID);

  it("points a translated page at its default-language page's template", async () => {
    const context = mockMigrationContext([english, dutch, group]);

    const mutations = await runDocumentMigration(migration, dutch, context);

    expect(mutations).toEqual([
      expectedTemplateCreate,
      expectedPagePatch(MOCK_DUTCH_ID, false),
    ]);
  });

  it('moves the default-language page onto the same template', async () => {
    const context = mockMigrationContext([english, dutch, group]);

    const mutations = await runDocumentMigration(migration, english, context);

    expect(mutations).toEqual([
      expectedTemplateCreate,
      expectedPagePatch(MOCK_ENGLISH_ID, true),
    ]);
  });

  it('builds a standalone page a template of its own', async () => {
    const home = mockMigrationDocument({
      _type: 'page_home',
      title: MOCK_ENGLISH_TITLE,
      hero: MOCK_HERO,
      modules: MOCK_MODULES,
    });
    const templateId = `template-${home._id}`;

    const mutations = await runDocumentMigration(
      migration,
      home,
      mockMigrationContext([home]),
    );

    expect(mutations).toEqual([
      createIfNotExists({
        _id: templateId,
        _type: 'template_home',
        title: MOCK_ENGLISH_TITLE,
        hero: MOCK_HERO,
        modules: MOCK_MODULES,
      }),
      patch(home._id, [
        at('template', set(mockReference(templateId))),
        at('hero', unset()),
        at('modules', unset()),
      ]),
    ]);
  });

  it('leaves an already-migrated page untouched on a second run', async () => {
    const migrated = mockDutchPage({
      modules: undefined,
      template: mockReference(MOCK_TEMPLATE_ID),
    });

    const mutations = await runDocumentMigration(
      migration,
      migrated,
      mockMigrationContext([migrated, group]),
    );

    expect(mutations).toEqual([]);
  });

  it('keeps a template an editor already chose while clearing the old layout', async () => {
    const chosen = mockDutchPage({
      template: mockReference(faker.string.uuid()),
    });

    const mutations = await runDocumentMigration(
      migration,
      chosen,
      mockMigrationContext([english, chosen, group]),
    );

    expect(mutations).toEqual([patch(MOCK_DUTCH_ID, [at('modules', unset())])]);
  });
});
