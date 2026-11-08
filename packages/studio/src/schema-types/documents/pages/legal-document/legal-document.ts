import { routes } from '@blog/config';
import { LEGAL_DOCUMENT_KINDS } from '@blog/config/constants';
import { PAGE_LEGAL_DOCUMENT_TYPE } from '@blog/studio/schema-types/documents/pages/legal-document/legal-document-type';
import { languageField } from '@blog/studio/schema-types/fields/language-field/language-field';
import { legalPageKindField } from '@blog/studio/schema-types/fields/legal-page-kind-field/legal-page-kind-field';
import { slugField } from '@blog/studio/schema-types/fields/slug-field/slug-field';
import { titleField } from '@blog/studio/schema-types/fields/title-field/title-field';
import { createSlugUrlPreviewInput } from '@blog/studio/schema-types/inputs/slug-url-preview/slug-url-preview-input';
import { seoField } from '@blog/studio/schema-types/objects/seo/seo-field';
import { articleTextSchema } from '@blog/studio/schema-types/portable-text/article-text/article-text';
import { legalPageKindPreview } from '@blog/studio/schema-types/preview/legal-page-kind-preview/legal-page-kind-preview';
import { validateLegalDocumentSlug } from '@blog/studio/schema-types/validation/validate-legal-document-slug/validate-legal-document-slug';
import { validateSlugUniqueInLanguage } from '@blog/studio/schema-types/validation/validate-slug-unique-in-language/validate-slug-unique-in-language';
import { Scale } from 'lucide-react';
import { defineField, defineType } from 'sanity';

const legalDocumentSlugUrlPreviewInput = createSlugUrlPreviewInput(
  routes.legalDocument(''),
);

export const legalDocumentPageSchema = defineType({
  name: PAGE_LEGAL_DOCUMENT_TYPE,
  title: 'Legal Document Page',
  type: 'document',
  description:
    "A page in the site's legal section, such as the terms or the imprint, at its own address under /legal.",
  icon: Scale,
  preview: legalPageKindPreview,
  fields: [
    languageField(),
    titleField(),
    slugField({
      description: 'URL path segment — auto-generated from title.',
      previewInput: legalDocumentSlugUrlPreviewInput,
      isUnique: validateSlugUniqueInLanguage,
      validateSlug: validateLegalDocumentSlug,
    }),
    legalPageKindField(LEGAL_DOCUMENT_KINDS),
    defineField({
      name: 'content',
      title: 'Content',
      type: articleTextSchema.name,
      description: 'The full text of the page.',
      validation: (rule) => rule.required(),
    }),
    seoField(),
  ],
});
