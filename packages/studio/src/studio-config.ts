import {
  LOCALE_ISO_CODES,
  type TCapability,
  type TLocaleIsoCode,
} from '@blog/config/constants';
import { withLandingRedirects } from '@blog/studio/document-actions/with-landing-redirects/with-landing-redirects';
import { schemaTypes } from '@blog/studio/schema-types';
import { PAGE_HOME_TYPE } from '@blog/studio/schema-types/documents/pages/home/home-type';
import { PAGE_LANDING_TYPE } from '@blog/studio/schema-types/documents/pages/landing/landing-type';
import { PAGE_POST_TYPE } from '@blog/studio/schema-types/documents/pages/post/post-type';
import { PAGE_POST_INDEX_TYPE } from '@blog/studio/schema-types/documents/pages/post-index/post-index-type';
import { PAGE_TAG_TYPE } from '@blog/studio/schema-types/documents/pages/tag/tag-type';
import { PAGE_TAG_INDEX_TYPE } from '@blog/studio/schema-types/documents/pages/tag-index/tag-index-type';
import { PAGE_TOPIC_TYPE } from '@blog/studio/schema-types/documents/pages/topic/topic-type';
import { PAGE_TOPIC_INDEX_TYPE } from '@blog/studio/schema-types/documents/pages/topic-index/topic-index-type';
import { migrationStateSchema } from '@blog/studio/schema-types/documents/system/migration-state/migration-state';
import { LANGUAGE_FIELD } from '@blog/studio/schema-types/fields/language-field/language-field';
import { createCapabilityWarningInput } from '@blog/studio/schema-types/inputs/capability-warning-input/capability-warning-input';
import { createCapabilityWarningItem } from '@blog/studio/schema-types/inputs/capability-warning-input/capability-warning-item';
import { createLanguageSwitcherField } from '@blog/studio/schema-types/inputs/language-switcher-field/language-switcher-field';
import {
  createLocalizationNoticeInput,
  type TLocalizationNoticeOptions,
} from '@blog/studio/schema-types/inputs/localization-notice-input/localization-notice-input';
import { LOCALE_LABEL } from '@blog/studio/schema-types/inputs/localization-notice-input/missing-locales';
import { createSingleLanguageInput } from '@blog/studio/schema-types/inputs/single-language-input/single-language-input';
import {
  createTranslationLinkInput,
  type TTranslationLinkOptions,
} from '@blog/studio/schema-types/inputs/translation-link-input/translation-link-input';
import { articleTextSchema } from '@blog/studio/schema-types/portable-text/article-text/article-text';
import { listedTextSchema } from '@blog/studio/schema-types/portable-text/listed-text/listed-text';
import { paragraphTextSchema } from '@blog/studio/schema-types/portable-text/paragraph-text/paragraph-text';
import { setDefaultLanguage } from '@blog/studio/schema-types/validation/default-language/default-language';
import { setLiveLanguages } from '@blog/studio/schema-types/validation/live-languages/live-languages';
import { isSingleLanguage } from '@blog/studio/structure/locales/is-single-language';
import { orderLocales } from '@blog/studio/structure/locales/order-locales';
import { codeInput } from '@sanity/code-input';
import { documentInternationalization } from '@sanity/document-internationalization';
import { visionTool } from '@sanity/vision';
import { defineConfig, definePlugin } from 'sanity';
import { structureTool } from 'sanity/structure';
import { internationalizedArray } from 'sanity-plugin-internationalized-array';
import { media, mediaAssetSource } from 'sanity-plugin-media';

import { createStudioStructure } from './studio-structure';

export type TBuildStudioConfigParams = {
  projectId: string;
  dataset: string;
  basePath?: string;
  title: string;
  enabledCapabilities?: readonly TCapability[];
  defaultLocale?: TLocaleIsoCode;
  liveLocales?: readonly TLocaleIsoCode[];
};

const ONE_PER_LANGUAGE_DOCUMENT_TYPES: string[] = [
  PAGE_HOME_TYPE,
  PAGE_POST_INDEX_TYPE,
  PAGE_TOPIC_INDEX_TYPE,
  PAGE_TAG_INDEX_TYPE,
];

const TRANSLATED_DOCUMENT_TYPES: string[] = [
  ...ONE_PER_LANGUAGE_DOCUMENT_TYPES,
  PAGE_LANDING_TYPE,
  PAGE_POST_TYPE,
  PAGE_TOPIC_TYPE,
  PAGE_TAG_TYPE,
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
  defaultLocale = LOCALE_ISO_CODES.EN,
  liveLocales,
}: TBuildStudioConfigParams) => {
  setDefaultLanguage(defaultLocale);
  setLiveLanguages(liveLocales ?? []);

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
          'text',
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
      ...(enabledCapabilities && {
        components: {
          input: createCapabilityWarningInput(enabledCapabilities),
          item: createCapabilityWarningItem(enabledCapabilities),
        },
      }),
    },

    document: {
      actions: (prev, { schemaType }) => {
        if (schemaType === migrationStateSchema.name) return [];
        if (schemaType !== PAGE_LANDING_TYPE) return prev;

        return prev.map((action) =>
          action.action === 'publish' ? withLandingRedirects(action) : action,
        );
      },
      newDocumentOptions: (prev) =>
        prev.filter((item) => item.templateId !== migrationStateSchema.name),
    },
  });
};
