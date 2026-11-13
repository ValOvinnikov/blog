import { LOCALE_ISO_CODES, type TLocaleIsoCode } from '@blog/config/constants';
import { buildLoginProviderAuth } from '@blog/studio/auth/login-provider-auth';
import { documentOptions } from '@blog/studio/document-actions/document-options/document-options';
import { schemaTypes } from '@blog/studio/schema-types';
import { PAGE_COOKIE_STATEMENT_TYPE } from '@blog/studio/schema-types/documents/pages/cookie-statement/cookie-statement-type';
import { PAGE_HOME_TYPE } from '@blog/studio/schema-types/documents/pages/home/home-type';
import { PAGE_LANDING_TYPE } from '@blog/studio/schema-types/documents/pages/landing/landing-type';
import { PAGE_LEGAL_DOCUMENT_TYPE } from '@blog/studio/schema-types/documents/pages/legal-document/legal-document-type';
import { PAGE_LEGAL_INDEX_TYPE } from '@blog/studio/schema-types/documents/pages/legal-index/legal-index-type';
import { PAGE_POST_TYPE } from '@blog/studio/schema-types/documents/pages/post/post-type';
import { PAGE_POST_INDEX_TYPE } from '@blog/studio/schema-types/documents/pages/post-index/post-index-type';
import { PAGE_PRIVACY_DOCUMENT_TYPE } from '@blog/studio/schema-types/documents/pages/privacy-document/privacy-document-type';
import { PAGE_PRIVACY_INDEX_TYPE } from '@blog/studio/schema-types/documents/pages/privacy-index/privacy-index-type';
import { PAGE_TAG_TYPE } from '@blog/studio/schema-types/documents/pages/tag/tag-type';
import { PAGE_TAG_INDEX_TYPE } from '@blog/studio/schema-types/documents/pages/tag-index/tag-index-type';
import { PAGE_TOPIC_TYPE } from '@blog/studio/schema-types/documents/pages/topic/topic-type';
import { PAGE_TOPIC_INDEX_TYPE } from '@blog/studio/schema-types/documents/pages/topic-index/topic-index-type';
import { LANGUAGE_FIELD } from '@blog/studio/schema-types/fields/language-field/language-field';
import { createLanguageSwitcherField } from '@blog/studio/schema-types/inputs/language-switcher-field/language-switcher-field';
import {
  createLocalizationNoticeInput,
  type TLocalizationNoticeOptions,
} from '@blog/studio/schema-types/inputs/localization-notice-input/localization-notice-input';
import { LOCALE_LABEL } from '@blog/studio/schema-types/inputs/localization-notice-input/missing-locales';
import { entitlementGates } from '@blog/studio/schema-types/inputs/requirement-warning-input/entitlement-gates/entitlement-gates';
import { createSingleLanguageInput } from '@blog/studio/schema-types/inputs/single-language-input/single-language-input';
import {
  createTranslationLinkInput,
  type TTranslationLinkOptions,
} from '@blog/studio/schema-types/inputs/translation-link-input/translation-link-input';
import { articleTextSchema } from '@blog/studio/schema-types/portable-text/article-text/article-text';
import { listedTextSchema } from '@blog/studio/schema-types/portable-text/listed-text/listed-text';
import { paragraphTextSchema } from '@blog/studio/schema-types/portable-text/paragraph-text/paragraph-text';
import { setDefaultLanguage } from '@blog/studio/schema-types/validation/default-language/default-language';
import {
  EVERY_MODULE_PACK,
  setEntitledModulePacks,
} from '@blog/studio/schema-types/validation/entitled-module-packs/entitled-module-packs';
import { setLiveLanguages } from '@blog/studio/schema-types/validation/live-languages/live-languages';
import { setCanLinkPlatformPlans } from '@blog/studio/schema-types/validation/platform-plan-links/platform-plan-links';
import { isSingleLanguage } from '@blog/studio/structure/locales/is-single-language';
import { orderLocales } from '@blog/studio/structure/locales/order-locales';
import { codeInput } from '@sanity/code-input';
import { documentInternationalization } from '@sanity/document-internationalization';
import { visionTool } from '@sanity/vision';
import { defineConfig, defineField, definePlugin } from 'sanity';
import { structureTool } from 'sanity/structure';
import { internationalizedArray } from 'sanity-plugin-internationalized-array';
import { media, mediaAssetSource } from 'sanity-plugin-media';

import type { TBuildStudioConfigParams } from './studio-config-params';
import { createStudioStructure } from './studio-structure';

const ONE_PER_LANGUAGE_DOCUMENT_TYPES: string[] = [
  PAGE_HOME_TYPE,
  PAGE_POST_INDEX_TYPE,
  PAGE_TOPIC_INDEX_TYPE,
  PAGE_TAG_INDEX_TYPE,
  PAGE_PRIVACY_INDEX_TYPE,
  PAGE_LEGAL_INDEX_TYPE,
  PAGE_COOKIE_STATEMENT_TYPE,
];

const TRANSLATED_DOCUMENT_TYPES: string[] = [
  ...ONE_PER_LANGUAGE_DOCUMENT_TYPES,
  PAGE_LANDING_TYPE,
  PAGE_POST_TYPE,
  PAGE_TOPIC_TYPE,
  PAGE_TAG_TYPE,
  PAGE_PRIVACY_DOCUMENT_TYPE,
  PAGE_LEGAL_DOCUMENT_TYPE,
];

const translationLinks = definePlugin<TTranslationLinkOptions>((options) => ({
  name: 'translation-links',
  form: {
    components: { input: createTranslationLinkInput(options) },
  },
}));

const localizationNotices = definePlugin<TLocalizationNoticeOptions>(
  (options) => ({
    name: 'localization-notices',
    form: {
      components: { input: createLocalizationNoticeInput(options) },
    },
  }),
);

const languageSwitcherVisibility = definePlugin<{
  liveLocales: readonly TLocaleIsoCode[];
}>(({ liveLocales }) => ({
  name: 'language-switcher-visibility',
  form: {
    components: { field: createLanguageSwitcherField(liveLocales) },
  },
}));

const singleLanguageFields = definePlugin<{
  liveLocales: readonly TLocaleIsoCode[];
  defaultLocale: TLocaleIsoCode;
}>(({ liveLocales, defaultLocale }) => ({
  name: 'single-language-fields',
  form: {
    components: {
      input: createSingleLanguageInput(liveLocales, defaultLocale),
    },
  },
}));

// Directive-free: both the Sanity CLI and the `'use client'` mount call it.
export const buildStudioConfig = ({
  projectId,
  dataset,
  basePath,
  title,
  enabledCapabilities,
  entitlements,
  canLinkPlatformPlans = false,
  defaultLocale = LOCALE_ISO_CODES.EN,
  liveLocales,
  loginProvider,
}: TBuildStudioConfigParams) => {
  const entitledModulePacks = entitlements?.modulePacks ?? EVERY_MODULE_PACK;
  setDefaultLanguage(defaultLocale);
  setLiveLanguages(liveLocales ?? []);
  setEntitledModulePacks(entitledModulePacks);
  setCanLinkPlatformPlans(canLinkPlatformPlans);

  const offeredLocales = orderLocales(defaultLocale, liveLocales);
  const languages = offeredLocales.map((locale) => ({
    id: locale,
    title: LOCALE_LABEL[locale] ?? locale,
  }));

  return defineConfig({
    name: 'default',
    title,
    projectId,
    dataset,
    basePath,
    ...(loginProvider && { auth: buildLoginProviderAuth(loginProvider) }),

    plugins: [
      structureTool({ structure: createStudioStructure(offeredLocales) }),
      visionTool(),
      codeInput(),
      media(),
      documentInternationalization({
        supportedLanguages: languages,
        schemaTypes: TRANSLATED_DOCUMENT_TYPES,
        languageField: LANGUAGE_FIELD,
        hideLanguageFilter: isSingleLanguage(offeredLocales),
      }),
      translationLinks({
        schemaTypes: ONE_PER_LANGUAGE_DOCUMENT_TYPES,
        defaultLocale,
      }),
      internationalizedArray({
        languages,
        defaultLanguages: [defaultLocale],
        fieldTypes: [
          'string',
          defineField({ name: 'text', type: 'text', rows: 3 }),
          listedTextSchema.name,
          paragraphTextSchema.name,
          articleTextSchema.name,
        ],
      }),
      ...(liveLocales
        ? [
            localizationNotices({ liveLocales, defaultLocale }),
            languageSwitcherVisibility({ liveLocales }),
            singleLanguageFields({ liveLocales, defaultLocale }),
          ]
        : []),
      ...(enabledCapabilities || entitlements?.modulePacks
        ? [entitlementGates({ enabledCapabilities, entitledModulePacks })]
        : []),
    ],

    schema: {
      types: schemaTypes,
      // The plugin adds one template per language; the bare one would create a page with no language.
      templates: (prev) =>
        prev.filter(
          (template) => !TRANSLATED_DOCUMENT_TYPES.includes(template.id),
        ),
    },

    form: {
      image: { assetSources: [mediaAssetSource] },
      file: { assetSources: [mediaAssetSource] },
    },

    document: documentOptions,
  });
};
