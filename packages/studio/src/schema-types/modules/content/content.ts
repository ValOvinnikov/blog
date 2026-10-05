import { brandVariantField } from '@blog/studio/schema-types/fields/brand-variant-field/brand-variant-field';
import { localizedArticleTextField } from '@blog/studio/schema-types/fields/localized-article-text-field/localized-article-text-field';
import { titleField } from '@blog/studio/schema-types/fields/title-field/title-field';
import { layoutField } from '@blog/studio/schema-types/objects/layout/layout-field';
import { moduleSubtitle } from '@blog/studio/schema-types/preview/module-subtitle/module-subtitle';
import { validateDefaultLanguageBlocksFilled } from '@blog/studio/schema-types/validation/validate-default-language-blocks-filled/validate-default-language-blocks-filled';
import { FileText } from 'lucide-react';
import { defineType } from 'sanity';

export const contentSchema = defineType({
  name: 'module_content',
  title: 'Content',
  type: 'document',
  description:
    'A section of written content — headings, paragraphs, lists, images and code — for any page that needs prose between its other modules.',
  icon: FileText,
  fields: [
    titleField(),
    brandVariantField(),
    localizedArticleTextField({
      name: 'body',
      title: 'Body',
      description:
        'The text itself, with images and code blocks as needed, per language.',
      validation: (rule) =>
        rule.custom(
          validateDefaultLanguageBlocksFilled(
            'Write the body of this section.',
          ),
        ),
    }),
    layoutField,
  ],
  preview: {
    select: {
      title: 'title',
      brandVariant: 'brandVariant',
    },
    prepare({ title, brandVariant }) {
      return {
        title: title ?? 'Unknown',
        subtitle: moduleSubtitle(brandVariant),
      };
    },
  },
});
