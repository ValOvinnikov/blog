import { PAGE_HOME_TYPE } from '@blog/studio/schema-types/documents/pages/home/home-type';
import { homeTemplateSchema } from '@blog/studio/schema-types/documents/templates/home/home';
import { languageField } from '@blog/studio/schema-types/fields/language-field/language-field';
import { templateField } from '@blog/studio/schema-types/fields/template-field/template-field';
import { titleField } from '@blog/studio/schema-types/fields/title-field/title-field';
import { headingBlockField } from '@blog/studio/schema-types/objects/heading-block/heading-block-field';
import { seoField } from '@blog/studio/schema-types/objects/seo/seo-field';
import { languagePreview } from '@blog/studio/schema-types/preview/language-preview/language-preview';
import { validateOnePerLanguage } from '@blog/studio/schema-types/validation/validate-one-per-language/validate-one-per-language';
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
    headingBlockField(),
    templateField({ type: homeTemplateSchema.name }),
    seoField(),
  ],
});
