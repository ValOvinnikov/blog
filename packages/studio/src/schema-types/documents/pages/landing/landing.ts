import { RESERVED_SLUGS, type TLocaleIsoCode } from '@blog/config/constants';
import { PAGE_LANDING_TYPE } from '@blog/studio/schema-types/documents/pages/landing/landing-type';
import {
  LANGUAGE_FIELD,
  languageField,
} from '@blog/studio/schema-types/fields/language-field/language-field';
import { slugField } from '@blog/studio/schema-types/fields/slug-field/slug-field';
import { templateField } from '@blog/studio/schema-types/fields/template-field/template-field';
import { titleField } from '@blog/studio/schema-types/fields/title-field/title-field';
import { LOCALE_LABEL } from '@blog/studio/schema-types/inputs/localization-notice-input/missing-locales';
import { createSlugUrlPreviewInput } from '@blog/studio/schema-types/inputs/slug-url-preview/slug-url-preview-input';
import { headingBlockField } from '@blog/studio/schema-types/objects/heading-block/heading-block-field';
import { seoField } from '@blog/studio/schema-types/objects/seo/seo-field';
import { validateSlugUniqueInLanguage } from '@blog/studio/schema-types/validation/validate-slug-unique-in-language/validate-slug-unique-in-language';
import { FileText } from 'lucide-react';
import { defineType } from 'sanity';

const landingSlugUrlPreviewInput = createSlugUrlPreviewInput('/');

export const landingPageSchema = defineType({
  name: PAGE_LANDING_TYPE,
  title: 'Landing Page',
  type: 'document',
  description:
    'A standalone page at its own URL, showing the hero and modules of its template — for marketing or informational content.',
  icon: FileText,
  preview: {
    select: {
      title: 'title',
      language: LANGUAGE_FIELD,
    },
    prepare: ({
      title,
      language,
    }: {
      title?: string;
      language?: TLocaleIsoCode;
    }) => ({
      title,
      subtitle: language ? LOCALE_LABEL[language] : undefined,
    }),
  },
  fields: [
    languageField(),
    titleField(),
    slugField({
      description: 'URL path segment — auto-generated from title.',
      previewInput: landingSlugUrlPreviewInput,
      isUnique: validateSlugUniqueInLanguage,
      validateSlug: (value) => {
        const current = value?.current;

        if (
          current &&
          (RESERVED_SLUGS as readonly string[]).includes(current)
        ) {
          return `"${current}" is a reserved path and can't be used as a page slug.`;
        }

        return true;
      },
    }),
    headingBlockField(),
    templateField(),
    seoField(),
  ],
});
