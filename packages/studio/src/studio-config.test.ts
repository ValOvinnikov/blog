import { faker } from '@faker-js/faker';
import {
  CAPABILITY,
  LOCALE_ISO_CODES,
  MODULE_PACK,
  SANITY_DOCUMENT_ACTION,
  SANITY_LOGIN_PROVIDER,
  type TLocaleIsoCode,
  type TSanityDocumentAction,
} from '@shinefold/config/constants';
import { PREVIEW_ACTION_NAME } from '@shinefold/studio/document-actions/preview-action/preview-action';
import { SendTestAction } from '@shinefold/studio/document-actions/send-test-action/send-test-action';
import { PAGE_COOKIE_STATEMENT_TYPE } from '@shinefold/studio/schema-types/documents/pages/cookie-statement/cookie-statement-type';
import { PAGE_HOME_TYPE } from '@shinefold/studio/schema-types/documents/pages/home/home-type';
import { PAGE_LANDING_TYPE } from '@shinefold/studio/schema-types/documents/pages/landing/landing-type';
import { PAGE_POST_TYPE } from '@shinefold/studio/schema-types/documents/pages/post/post-type';
import { PAGE_POST_INDEX_TYPE } from '@shinefold/studio/schema-types/documents/pages/post-index/post-index-type';
import { PAGE_TAG_TYPE } from '@shinefold/studio/schema-types/documents/pages/tag/tag-type';
import { PAGE_TAG_INDEX_TYPE } from '@shinefold/studio/schema-types/documents/pages/tag-index/tag-index-type';
import { PAGE_TOPIC_TYPE } from '@shinefold/studio/schema-types/documents/pages/topic/topic-type';
import { PAGE_TOPIC_INDEX_TYPE } from '@shinefold/studio/schema-types/documents/pages/topic-index/topic-index-type';
import { migrationStateSchema } from '@shinefold/studio/schema-types/documents/system/migration-state/migration-state';
import { entitlementGates } from '@shinefold/studio/schema-types/inputs/requirement-warning-input/entitlement-gates/entitlement-gates';
import {
  EVERY_MODULE_PACK,
  getEntitledModulePacks,
} from '@shinefold/studio/schema-types/validation/entitled-module-packs/entitled-module-packs';
import { getCanLinkPlatformPlans } from '@shinefold/studio/schema-types/validation/platform-plan-links/platform-plan-links';
import {
  type DocumentActionComponent,
  type DocumentActionsContext,
  type TemplateItem,
} from 'sanity';

import { buildStudioConfig } from './studio-config';
import type { TBuildStudioConfigParams } from './studio-config-params';

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
const MOCK_PREVIEW_BASE_PATH = `/${faker.lorem.word()}/preview`;
const MOCK_UNTRANSLATED_TYPE = faker.lorem.word();

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

const mockAction = (name: TSanityDocumentAction) => {
  const action: DocumentActionComponent = () => null;
  action.action = name;
  return action;
};

type TResolveActions = (
  prev: DocumentActionComponent[],
  schemaType: string,
) => DocumentActionComponent[];

const actionsOf = (
  built: ReturnType<typeof buildStudioConfig>,
): TResolveActions => {
  const resolver = built.document?.actions;
  if (typeof resolver !== 'function') {
    throw new Error('expected config.document.actions to be a function');
  }
  return (prev, schemaType) =>
    resolver(prev, { schemaType } as DocumentActionsContext);
};

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
    const publish = mockAction(SANITY_DOCUMENT_ACTION.PUBLISH);
    let actions: TResolveActions;

    beforeEach(() => {
      actions = actionsOf(config);
    });

    it('offers no document actions on the migration ledger', () => {
      expect(actions([], migrationStateSchema.name)).toEqual([]);
    });

    it('wraps only the landing page publish action', () => {
      const discard = mockAction(SANITY_DOCUMENT_ACTION.DISCARD_CHANGES);

      const [landingPublish, landingDiscard] = actions(
        [publish, discard],
        PAGE_LANDING_TYPE,
      );
      const [topicPublish] = actions([publish], PAGE_TOPIC_TYPE);

      expect(landingPublish).not.toBe(publish);
      expect(landingPublish?.action).toBe(SANITY_DOCUMENT_ACTION.PUBLISH);
      expect(landingDiscard).toBe(discard);
      expect(topicPublish).toBe(publish);
    });

    it('leads a post’s menu with the test send, after the primary action', () => {
      const duplicate = mockAction(SANITY_DOCUMENT_ACTION.DUPLICATE);
      const remove = mockAction(SANITY_DOCUMENT_ACTION.DELETE);

      expect(actions([publish, duplicate, remove], PAGE_POST_TYPE)).toEqual([
        publish,
        SendTestAction,
        duplicate,
        remove,
      ]);
    });

    it('offers the test send on posts only', () => {
      expect(actions([publish], PAGE_TOPIC_TYPE)).toEqual([publish]);
    });

    it('offers no delete, duplicate or unpublish action on the cookie statement', () => {
      const prev = Object.values(SANITY_DOCUMENT_ACTION).map(mockAction);

      const names = actions(prev, PAGE_COOKIE_STATEMENT_TYPE).map(
        ({ action }) => action,
      );

      expect(names).toEqual([
        SANITY_DOCUMENT_ACTION.PUBLISH,
        SANITY_DOCUMENT_ACTION.DISCARD_CHANGES,
      ]);
    });

    describe('with a preview base path', () => {
      beforeEach(() => {
        actions = actionsOf(
          buildConfig({ previewBasePath: MOCK_PREVIEW_BASE_PATH }),
        );
      });

      it.each([PAGE_POST_TYPE, PAGE_LANDING_TYPE])(
        'adds a preview action after the others on %s',
        (schemaType) => {
          const resolved = actions([publish], schemaType);

          expect(resolved.at(-1)?.displayName).toBe(PREVIEW_ACTION_NAME);
        },
      );

      it('adds no preview action to other document types', () => {
        expect(actions([publish], PAGE_TOPIC_TYPE)).toEqual([publish]);
      });
    });

    it('adds no preview action without a preview base path', () => {
      expect(actions([publish], PAGE_POST_TYPE)).toEqual([
        publish,
        SendTestAction,
      ]);
    });
  });

  const getNewDocumentOptions = () => {
    const newDocumentOptions = config.document?.newDocumentOptions;
    if (typeof newDocumentOptions !== 'function') {
      throw new Error('expected config.document.newDocumentOptions');
    }
    return newDocumentOptions;
  };

  describe('the new-document menu', () => {
    let newDocumentOptions: ReturnType<typeof getNewDocumentOptions>;

    beforeEach(() => {
      newDocumentOptions = getNewDocumentOptions();
    });

    it('hides the migration ledger from the new-document menu', () => {
      const ledgerItem = {
        templateId: migrationStateSchema.name,
      } as TemplateItem;
      const otherItem = { templateId: MOCK_UNTRANSLATED_TYPE } as TemplateItem;

      const options = newDocumentOptions([ledgerItem, otherItem]);

      expect(options).toEqual([otherItem]);
    });

    it('hides the cookie statement from the new-document menu in every language', () => {
      const cookieStatementItems = Object.values(LOCALE_ISO_CODES).map(
        (locale) =>
          ({
            templateId: `${PAGE_COOKIE_STATEMENT_TYPE}-${locale}`,
          }) as TemplateItem,
      );
      const otherItem = { templateId: MOCK_UNTRANSLATED_TYPE } as TemplateItem;

      const options = newDocumentOptions([...cookieStatementItems, otherItem]);

      expect(options).toEqual([otherItem]);
    });
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
    PAGE_COOKIE_STATEMENT_TYPE,
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

  it.each([
    ['lets a pricing tier link a platform plan when asked', true, true],
    ['withholds platform plan links by default', undefined, false],
  ])('%s', (_description, canLinkPlatformPlans, expected) => {
    buildConfig({ canLinkPlatformPlans });

    expect(getCanLinkPlatformPlans()).toBe(expected);
  });
});
