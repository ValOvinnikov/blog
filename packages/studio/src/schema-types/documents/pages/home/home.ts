import { PAGE_HOME_TYPE } from '@shinefold/studio/schema-types/documents/pages/home/home-type';
import { homeTemplateSchema } from '@shinefold/studio/schema-types/documents/templates/home/home';
import { languageField } from '@shinefold/studio/schema-types/fields/language-field/language-field';
import { templateField } from '@shinefold/studio/schema-types/fields/template-field/template-field';
import { titleField } from '@shinefold/studio/schema-types/fields/title-field/title-field';
import { pageHeadingBlockField } from '@shinefold/studio/schema-types/objects/page-heading-block/page-heading-block-field';
import { seoField } from '@shinefold/studio/schema-types/objects/seo/seo-field';
import { languagePreview } from '@shinefold/studio/schema-types/preview/language-preview/language-preview';
import { validateOnePerLanguage } from '@shinefold/studio/schema-types/validation/validate-one-per-language/validate-one-per-language';
import { House } from 'lucide-react';
import { defineType } from 'sanity';

export const homePageSchema = defineType({
  name: PAGE_HOME_TYPE,
  title: 'Home Page',
  type: 'document',
  description:
    "The home page — the first thing readers see, built from its heading and its template's hero and modules.",
  icon: House,
  preview: languagePreview,
  validation: (rule) => rule.custom(validateOnePerLanguage),
  fields: [
    languageField(),
    titleField(),
    ...pageHeadingBlockField(),
    templateField({ type: homeTemplateSchema.name }),
    seoField(),
  ],
});
