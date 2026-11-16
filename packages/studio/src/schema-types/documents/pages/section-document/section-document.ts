import type { TMaybeUndefined } from '@shinefold/config';
import type { TLegalPageKind } from '@shinefold/config/constants';
import { articleContentField } from '@shinefold/studio/schema-types/fields/article-content-field/article-content-field';
import { languageField } from '@shinefold/studio/schema-types/fields/language-field/language-field';
import { legalPageKindField } from '@shinefold/studio/schema-types/fields/legal-page-kind-field/legal-page-kind-field';
import { slugField } from '@shinefold/studio/schema-types/fields/slug-field/slug-field';
import { titleField } from '@shinefold/studio/schema-types/fields/title-field/title-field';
import { createSlugUrlPreviewInput } from '@shinefold/studio/schema-types/inputs/slug-url-preview/slug-url-preview-input';
import { pageHeadingBlockField } from '@shinefold/studio/schema-types/objects/page-heading-block/page-heading-block-field';
import { seoField } from '@shinefold/studio/schema-types/objects/seo/seo-field';
import { legalPageKindPreview } from '@shinefold/studio/schema-types/preview/legal-page-kind-preview/legal-page-kind-preview';
import { validateSlugUniqueInLanguage } from '@shinefold/studio/schema-types/validation/validate-slug-unique-in-language/validate-slug-unique-in-language';
import type { ComponentType } from 'react';
import { defineType, type CustomValidator, type SlugValue } from 'sanity';

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
      ...pageHeadingBlockField(),
      slugField({
        description: 'URL path segment — auto-generated from title.',
        previewInput: createSlugUrlPreviewInput(routePrefix),
        isUnique: validateSlugUniqueInLanguage,
        validateSlug,
      }),
      legalPageKindField(kinds),
      articleContentField('The full text of the page.'),
      seoField(),
    ],
  });
