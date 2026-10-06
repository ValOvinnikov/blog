import { PAGE_TOPIC_TYPE } from '@blog/studio/schema-types/documents/pages/topic/topic-type';
import { localizedMultilineTextField } from '@blog/studio/schema-types/fields/localized-multiline-text-field/localized-multiline-text-field';
import { localizedOneLineTextField } from '@blog/studio/schema-types/fields/localized-one-line-text-field/localized-one-line-text-field';
import { defaultLanguageValue } from '@blog/studio/schema-types/validation/default-language-value/default-language-value';
import { validateDefaultLanguageFilled } from '@blog/studio/schema-types/validation/validate-default-language-filled/validate-default-language-filled';
import { validateHasPage } from '@blog/studio/schema-types/validation/validate-has-page/validate-has-page';
import { validateLocalizedMaxLength } from '@blog/studio/schema-types/validation/validate-localized-max-length/validate-localized-max-length';
import { Tags } from 'lucide-react';
import { defineType } from 'sanity';

const TITLE_MAX_LENGTH = 60;
const DESCRIPTION_MAX_LENGTH = 300;

const MISSING_PAGE_ERROR = 'No Topic Page references this topic yet.';

export const topicSchema = defineType({
  name: 'blog_topic',
  title: 'Topic',
  type: 'document',
  description:
    'A subject category used to classify posts, powering topic filters and the topic archive page.',
  icon: Tags,
  validation: (rule) =>
    rule.custom(validateHasPage(PAGE_TOPIC_TYPE, 'topic', MISSING_PAGE_ERROR)),
  fields: [
    localizedOneLineTextField({
      name: 'title',
      title: 'Title',
      description: 'Topic name shown in filters and navigation.',
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
    localizedMultilineTextField({
      name: 'description',
      title: 'Description',
      description:
        'Brief explanation of what this topic covers, shown on the topic page.',
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
