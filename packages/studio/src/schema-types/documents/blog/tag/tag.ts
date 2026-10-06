import { PAGE_TAG_TYPE } from '@blog/studio/schema-types/documents/pages/tag/tag-type';
import { localizedMultilineTextField } from '@blog/studio/schema-types/fields/localized-multiline-text-field/localized-multiline-text-field';
import { localizedOneLineTextField } from '@blog/studio/schema-types/fields/localized-one-line-text-field/localized-one-line-text-field';
import { slugField } from '@blog/studio/schema-types/fields/slug-field/slug-field';
import { defaultLanguageValue } from '@blog/studio/schema-types/validation/default-language-value/default-language-value';
import { validateDefaultLanguageFilled } from '@blog/studio/schema-types/validation/validate-default-language-filled/validate-default-language-filled';
import { validateHasPage } from '@blog/studio/schema-types/validation/validate-has-page/validate-has-page';
import { validateLocalizedMaxLength } from '@blog/studio/schema-types/validation/validate-localized-max-length/validate-localized-max-length';
import { Tag } from 'lucide-react';
import { defineType } from 'sanity';

const TITLE_MAX_LENGTH = 60;
const DESCRIPTION_MAX_LENGTH = 300;

const MISSING_PAGE_ERROR =
  'No Tag Page references this tag yet — /tags/{slug} will 404 until one is created.';

export const tagSchema = defineType({
  name: 'blog_tag',
  title: 'Tag',
  type: 'document',
  description:
    'A keyword used to label posts, powering tag chips, related posts, and the tag archive page.',
  icon: Tag,
  validation: (rule) =>
    rule.custom(validateHasPage(PAGE_TAG_TYPE, 'tag', MISSING_PAGE_ERROR)),
  fields: [
    localizedOneLineTextField({
      name: 'title',
      title: 'Title',
      description: 'Topic label shown on tag chips and the tag archive page.',
      validation: (rule) =>
        rule
          .custom(validateDefaultLanguageFilled('Enter a title.'))
          .custom(
            validateLocalizedMaxLength(
              TITLE_MAX_LENGTH,
              `Keep the title under ${TITLE_MAX_LENGTH} characters.`,
            ),
          ),
    }),
    slugField({
      description:
        'URL path segment for the tag page — auto-generated from the default-language title.',
      source: (doc) => defaultLanguageValue(doc.title) ?? '',
    }),
    localizedMultilineTextField({
      name: 'description',
      title: 'Description',
      description:
        'Brief topic summary — shown on the tag archive page and used as its meta description.',
      validation: (rule) =>
        rule.custom(
          validateLocalizedMaxLength(
            DESCRIPTION_MAX_LENGTH,
            `Keep the description under ${DESCRIPTION_MAX_LENGTH} characters.`,
          ),
        ),
    }),
  ],
  preview: {
    select: {
      title: 'title',
    },
    prepare({ title }: { title?: unknown }) {
      return {
        title: defaultLanguageValue(title) ?? 'Untitled',
      };
    },
  },
});
