import {
  CAPABILITY,
  LOCALE_ISO_CODES,
  MODULE_PACK,
  SANITY_LOGIN_PROVIDER,
  type TLocaleIsoCode,
} from '@blog/config/constants';
import { PAGE_HOME_TYPE } from '@blog/studio/schema-types/documents/pages/home/home-type';
import { PAGE_LANDING_TYPE } from '@blog/studio/schema-types/documents/pages/landing/landing-type';
import { PAGE_POST_TYPE } from '@blog/studio/schema-types/documents/pages/post/post-type';
import { PAGE_POST_INDEX_TYPE } from '@blog/studio/schema-types/documents/pages/post-index/post-index-type';
import { PAGE_TAG_TYPE } from '@blog/studio/schema-types/documents/pages/tag/tag-type';
import { PAGE_TAG_INDEX_TYPE } from '@blog/studio/schema-types/documents/pages/tag-index/tag-index-type';
import { PAGE_TOPIC_TYPE } from '@blog/studio/schema-types/documents/pages/topic/topic-type';
import { PAGE_TOPIC_INDEX_TYPE } from '@blog/studio/schema-types/documents/pages/topic-index/topic-index-type';
import { migrationStateSchema } from '@blog/studio/schema-types/documents/system/migration-state/migration-state';
import { entitlementGates } from '@blog/studio/schema-types/inputs/requirement-warning-input/entitlement-gates';
import {
  EVERY_MODULE_PACK,
  getEntitledModulePacks,
} from '@blog/studio/schema-types/validation/entitled-module-packs/entitled-module-packs';
import { faker } from '@faker-js/faker';
import {
  type DocumentActionComponent,
  type DocumentActionsContext,
  type TemplateItem,
} from 'sanity';

import {
  buildStudioConfig,
  type TBuildStudioConfigParams,
} from './studio-config';

vi.mock('sanity/structure');
vi.mock('sanity-plugin-media');
vi.mock('@sanity/vision');
vi.mock('@sanity/code-input', () => ({
  codeInput: () => ({ name: 'codeInput' }),
}));

faker.seed(6017);

const MOCK_PROJECT_ID = faker.string.alphanumeric(8);
const MOCK_DATASET = faker.lorem.word();
const MOCK_TITLE = faker.company.name();
const MOCK_BASE_PATH = `/${faker.lorem.word()}/studio`;
const MOCK_DOCUMENT_ID = faker.string.uuid();
const MOCK_UNTRANSLATED_TYPE = faker.lorem.word();

const PUBLISH_ACTION = 'publish';
const TRANSLATIONS_PLUGIN_NAME = '@sanity/document-internationalization';
const ENTITLEMENT_GATES_NAME = entitlementGates({
  entitledModulePacks: EVERY_MODULE_PACK,
}).name;

const buildConfig = (overrides: Partial<TBuildStudioConfigParams> = {}) =>
  buildStudioConfig({
    projectId: MOCK_PROJECT_ID,
    dataset: MOCK_DATASET,
    title: MOCK_TITLE,
    ...overrides,
  });

const hasEntitlementGates = (overrides: Partial<TBuildStudioConfigParams>) =>
  buildConfig(overrides).plugins?.some(
    (plugin) =>
      typeof plugin === 'object' && plugin.name === ENTITLEMENT_GATES_NAME,
  );

describe(buildStudioConfig, () => {
  let config: ReturnType<typeof buildStudioConfig>;

  beforeEach(() => {
    config = buildConfig();
  });

  it('builds a config from the given project, dataset and title', () => {
    const { projectId, dataset, title, basePath } = config;

    expect({ projectId, dataset, title, basePath }).toEqual({
      projectId: MOCK_PROJECT_ID,
      dataset: MOCK_DATASET,
      title: MOCK_TITLE,
      basePath: undefined,
    });
  });

  it('mounts the Studio under the given base path', () => {
    const { basePath } = buildConfig({ basePath: MOCK_BASE_PATH });

    expect(basePath).toBe(MOCK_BASE_PATH);
  });

  it('keeps every login provider when none is chosen', () => {
    expect(config.auth).toBeUndefined();
  });

  it('limits login to the chosen provider', () => {
    const { auth } = buildConfig({
      loginProvider: SANITY_LOGIN_PROVIDER.GITHUB,
    });

    expect(auth?.redirectOnSingle).toBe(true);
  });

  describe('document actions', () => {
    let actions: (
      prev: DocumentActionComponent[],
      schemaType: string,
    ) => DocumentActionComponent[];

    beforeEach(() => {
      const resolver = config.document?.actions;
      if (typeof resolver !== 'function') {
        throw new Error('expected config.document.actions to be a function');
      }
      actions = (prev, schemaType) =>
        resolver(prev, { schemaType } as DocumentActionsContext);
    });

    it('offers no document actions on the migration ledger', () => {
      expect(actions([], migrationStateSchema.name)).toEqual([]);
    });

    it('wraps only the landing page publish action', () => {
      const publish: DocumentActionComponent = () => null;
      publish.action = PUBLISH_ACTION;
      const discard: DocumentActionComponent = () => null;
      discard.action = 'discardChanges';

      const [landingPublish, landingDiscard] = actions(
        [publish, discard],
        PAGE_LANDING_TYPE,
      );
      const [topicPublish] = actions([publish], PAGE_TOPIC_TYPE);

      expect(landingPublish).not.toBe(publish);
      expect(landingPublish?.action).toBe(PUBLISH_ACTION);
      expect(landingDiscard).toBe(discard);
      expect(topicPublish).toBe(publish);
    });
  });

  it('hides the migration ledger from the new-document menu', () => {
    const newDocumentOptions = config.document?.newDocumentOptions;
    if (typeof newDocumentOptions !== 'function') {
      throw new Error('expected config.document.newDocumentOptions');
    }
    const ledgerItem = {
      templateId: migrationStateSchema.name,
    } as TemplateItem;
    const otherItem = { templateId: MOCK_UNTRANSLATED_TYPE } as TemplateItem;

    const options = newDocumentOptions([ledgerItem, otherItem]);

    expect(options).toEqual([otherItem]);
  });

  it.each([
    PAGE_HOME_TYPE,
    PAGE_LANDING_TYPE,
    PAGE_POST_INDEX_TYPE,
    PAGE_TOPIC_INDEX_TYPE,
    PAGE_TAG_INDEX_TYPE,
    PAGE_POST_TYPE,
    PAGE_TOPIC_TYPE,
    PAGE_TAG_TYPE,
  ])('creates a %s only through a language template', (type) => {
    const templates = config.schema?.templates;
    if (typeof templates !== 'function') {
      throw new Error('expected config.schema.templates to be a function');
    }
    const template = (id: string, schemaType: string) => ({
      id,
      title: id,
      schemaType,
      value: {},
    });
    const languageTemplateId = `${type}-${LOCALE_ISO_CODES.EN}`;

    const ids = templates([
      template(type, type),
      template(languageTemplateId, type),
      template(MOCK_UNTRANSLATED_TYPE, MOCK_UNTRANSLATED_TYPE),
    ]).map(({ id }) => id);

    expect(ids).toEqual([languageTemplateId, MOCK_UNTRANSLATED_TYPE]);
  });

  describe('translations menu', () => {
    const getLanguageFilterEntries = (liveLocales: TLocaleIsoCode[]) => {
      const plugin = buildConfig({ liveLocales }).plugins?.find(
        (entry) =>
          typeof entry === 'object' && entry.name === TRANSLATIONS_PLUGIN_NAME,
      );
      const filter =
        typeof plugin === 'object'
          ? plugin.document?.unstable_languageFilter
          : undefined;
      if (typeof filter !== 'function') {
        throw new Error('expected the translations plugin language filter');
      }

      return filter([], {
        schemaType: PAGE_HOME_TYPE,
        documentId: MOCK_DOCUMENT_ID,
      } as Parameters<typeof filter>[1]);
    };

    it.each([
      { languages: 'one', liveLocales: [LOCALE_ISO_CODES.EN], entries: 0 },
      {
        languages: 'two',
        liveLocales: [LOCALE_ISO_CODES.EN, LOCALE_ISO_CODES.NL],
        entries: 1,
      },
    ])(
      'offers $entries Translations menu entries with $languages live languages',
      ({ liveLocales, entries }) => {
        expect(getLanguageFilterEntries(liveLocales)).toHaveLength(entries);
      },
    );
  });

  describe('entitlement gates', () => {
    it.each([
      { given: 'nothing', overrides: {}, registered: false },
      {
        given: 'enabled capabilities',
        overrides: { enabledCapabilities: [CAPABILITY.NEWSLETTER] },
        registered: true,
      },
      {
        given: 'module packs',
        overrides: { entitlements: { modulePacks: [MODULE_PACK.CORE] } },
        registered: true,
      },
    ])(
      'registers the gates when given $given: $registered',
      ({ overrides, registered }) => {
        expect(hasEntitlementGates(overrides)).toBe(registered);
      },
    );

    it('hands the entitled module packs to validation', () => {
      buildConfig({ entitlements: { modulePacks: [MODULE_PACK.CORE] } });

      expect(getEntitledModulePacks()).toEqual([MODULE_PACK.CORE]);
    });

    it('entitles every module pack when none are given', () => {
      buildConfig({ entitlements: {} });

      expect(getEntitledModulePacks()).toEqual(EVERY_MODULE_PACK);
    });
  });
});
