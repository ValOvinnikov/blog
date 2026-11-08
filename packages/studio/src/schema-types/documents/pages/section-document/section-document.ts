import type { TMaybeUndefined } from '@blog/config';
import type { TLegalPageKind } from '@blog/config/constants';
import { languageField } from '@blog/studio/schema-types/fields/language-field/language-field';
import { legalPageKindField } from '@blog/studio/schema-types/fields/legal-page-kind-field/legal-page-kind-field';
import { slugField } from '@blog/studio/schema-types/fields/slug-field/slug-field';
import { titleField } from '@blog/studio/schema-types/fields/title-field/title-field';
import { createSlugUrlPreviewInput } from '@blog/studio/schema-types/inputs/slug-url-preview/slug-url-preview-input';
import { seoField } from '@blog/studio/schema-types/objects/seo/seo-field';
import { articleTextSchema } from '@blog/studio/schema-types/portable-text/article-text/article-text';
import { legalPageKindPreview } from '@blog/studio/schema-types/preview/legal-page-kind-preview/legal-page-kind-preview';
import { validateSlugUniqueInLanguage } from '@blog/studio/schema-types/validation/validate-slug-unique-in-language/validate-slug-unique-in-language';
import type { ComponentType } from 'react';
import {
  defineField,
  defineType,
  type CustomValidator,
  type SlugValue,
} from 'sanity';

type TSectionDocumentOptions<TName extends string> = {
  name: TName;
  title: string;
  description: string;
  icon: ComponentType;
  kinds: readonly TLegalPageKind[];
  routePrefix: string;
  validateSlug?: CustomValidator<TMaybeUndefined<SlugValue>>;
};

export const sectionDocumentSchema = <TName extends string>({
  name,
  title,
  description,
  icon,
  kinds,
  routePrefix,
  validateSlug,
}: TSectionDocumentOptions<TName>) =>
  defineType({
    name,
    title,
    type: 'document',
    description,
    icon,
    preview: legalPageKindPreview,
    fields: [
      languageField(),
      titleField(),
      slugField({
        description: 'URL path segment — auto-generated from title.',
        previewInput: createSlugUrlPreviewInput(routePrefix),
        isUnique: validateSlugUniqueInLanguage,
        validateSlug,
      }),
      legalPageKindField(kinds),
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
