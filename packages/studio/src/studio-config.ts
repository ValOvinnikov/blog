import {
  LOCALE_ISO_CODES,
  type TCapability,
  type TLocaleIsoCode,
} from '@blog/config/constants';
import { schemaTypes } from '@blog/studio/schema-types';
import { PAGE_HOME_TYPE } from '@blog/studio/schema-types/documents/pages/home/home-type';
import { PAGE_LANDING_TYPE } from '@blog/studio/schema-types/documents/pages/landing/landing-type';
import { migrationStateSchema } from '@blog/studio/schema-types/documents/system/migration-state/migration-state';
import { LANGUAGE_FIELD } from '@blog/studio/schema-types/fields/language-field/language-field';
import { createCapabilityWarningInput } from '@blog/studio/schema-types/inputs/capability-warning-input/capability-warning-input';
import { createLanguageSwitcherField } from '@blog/studio/schema-types/inputs/language-switcher-field/language-switcher-field';
import {
  createLocalizationNoticeInput,
  type TLocalizationNoticeOptions,
} from '@blog/studio/schema-types/inputs/localization-notice-input/localization-notice-input';
import { LOCALE_LABEL } from '@blog/studio/schema-types/inputs/localization-notice-input/missing-locales';
import { articleTextSchema } from '@blog/studio/schema-types/portable-text/article-text/article-text';
import { listedTextSchema } from '@blog/studio/schema-types/portable-text/listed-text/listed-text';
import { paragraphTextSchema } from '@blog/studio/schema-types/portable-text/paragraph-text/paragraph-text';
import { setDefaultLanguage } from '@blog/studio/schema-types/validation/default-language/default-language';
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

const TRANSLATED_DOCUMENT_TYPES: string[] = [PAGE_HOME_TYPE, PAGE_LANDING_TYPE];

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

/**
 * Builds the full Studio config — schema, desk structure and plugins — shared
 * by every entry point (`sanity.config.ts` for the CLI, and the mount
 * component for `apps/platform`). Kept directive-free so it can be called
 * from both a plain Sanity CLI context and from behind a `'use client'`
 * boundary without duplicating the desk structure.
 */
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
        },
      }),
    },

    document: {
      actions: (prev, { schemaType }) =>
        schemaType === migrationStateSchema.name ? [] : prev,
      newDocumentOptions: (prev) =>
        prev.filter((item) => item.templateId !== migrationStateSchema.name),
    },
  });
};
