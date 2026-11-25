import { codeInput } from '@sanity/code-input';
import { documentInternationalization } from '@sanity/document-internationalization';
import { visionTool } from '@sanity/vision';
import {
  LOCALE_ISO_CODES,
  type TLocaleIsoCode,
} from '@shinefold/config/constants';
import { buildLoginProviderAuth } from '@shinefold/studio/auth/login-provider-auth';
import { buildDocumentOptions } from '@shinefold/studio/document-actions/document-options/document-options';
import { LOCALIZED_FIELD_TYPES } from '@shinefold/studio/localized-field-types';
import { schemaTypes } from '@shinefold/studio/schema-types';
import { LANGUAGE_FIELD } from '@shinefold/studio/schema-types/fields/language-field/language-field';
import { createLanguageSwitcherField } from '@shinefold/studio/schema-types/inputs/language-switcher-field/language-switcher-field';
import {
  createLocalizationNoticeInput,
  type TLocalizationNoticeOptions,
} from '@shinefold/studio/schema-types/inputs/localization-notice-input/localization-notice-input';
import { LOCALE_LABEL } from '@shinefold/studio/schema-types/inputs/localization-notice-input/missing-locales';
import { entitlementGates } from '@shinefold/studio/schema-types/inputs/requirement-warning-input/entitlement-gates/entitlement-gates';
import { createSingleLanguageInput } from '@shinefold/studio/schema-types/inputs/single-language-input/single-language-input';
import {
  createTranslationLinkInput,
  type TTranslationLinkOptions,
} from '@shinefold/studio/schema-types/inputs/translation-link-input/translation-link-input';
import { setDefaultLanguage } from '@shinefold/studio/schema-types/validation/default-language/default-language';
import {
  EVERY_MODULE_PACK,
  setEntitledModulePacks,
} from '@shinefold/studio/schema-types/validation/entitled-module-packs/entitled-module-packs';
import { setLiveLanguages } from '@shinefold/studio/schema-types/validation/live-languages/live-languages';
import { setCanLinkPlatformPlans } from '@shinefold/studio/schema-types/validation/platform-plan-links/platform-plan-links';
import { isSingleLanguage } from '@shinefold/studio/structure/locales/is-single-language';
import { orderLocales } from '@shinefold/studio/structure/locales/order-locales';
import { defineConfig, definePlugin } from 'sanity';
import { structureTool } from 'sanity/structure';
import { internationalizedArray } from 'sanity-plugin-internationalized-array';
import { media, mediaAssetSource } from 'sanity-plugin-media';

import type { TBuildStudioConfigParams } from './studio-config-params';
import { createStudioStructure } from './studio-structure';
import {
  ONE_PER_LANGUAGE_DOCUMENT_TYPES,
  TRANSLATED_DOCUMENT_TYPES,
} from './translated-document-types';

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
  previewBasePath,
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
        fieldTypes: LOCALIZED_FIELD_TYPES,
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

    document: buildDocumentOptions(previewBasePath),
  });
};
