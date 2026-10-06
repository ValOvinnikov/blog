import { PAGE_POST_INDEX_TYPE } from '@blog/studio/schema-types/documents/pages/post-index/post-index-type';
import { postIndexTemplateSchema } from '@blog/studio/schema-types/documents/templates/post-index/post-index';
import { languageField } from '@blog/studio/schema-types/fields/language-field/language-field';
import { templateField } from '@blog/studio/schema-types/fields/template-field/template-field';
import { titleField } from '@blog/studio/schema-types/fields/title-field/title-field';
import { headingBlockField } from '@blog/studio/schema-types/objects/heading-block/heading-block-field';
import { seoField } from '@blog/studio/schema-types/objects/seo/seo-field';
import { languagePreview } from '@blog/studio/schema-types/preview/language-preview/language-preview';
import { validateOnePerLanguage } from '@blog/studio/schema-types/validation/validate-one-per-language/validate-one-per-language';
import { Newspaper } from 'lucide-react';
import { defineType } from 'sanity';

export const postIndexPageSchema = defineType({
  name: PAGE_POST_INDEX_TYPE,
  title: 'Post Index Page',
  type: 'document',
  description:
    "The page that lists posts, built from its heading and its template's hero and modules.",
  icon: Newspaper,
  preview: languagePreview,
  validation: (rule) => rule.custom(validateOnePerLanguage),
  fields: [
    languageField(),
    titleField(),
    headingBlockField(),
    templateField({ type: postIndexTemplateSchema.name }),
    seoField(),
  ],
});
