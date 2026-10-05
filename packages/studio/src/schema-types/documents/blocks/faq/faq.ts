import { localizedListedTextField } from '@blog/studio/schema-types/fields/localized-listed-text-field/localized-listed-text-field';
import { localizedOneLineTextField } from '@blog/studio/schema-types/fields/localized-one-line-text-field/localized-one-line-text-field';
import { titleField } from '@blog/studio/schema-types/fields/title-field/title-field';
import { defaultLanguageValue } from '@blog/studio/schema-types/validation/default-language-value/default-language-value';
import { validateDefaultLanguageBlocksFilled } from '@blog/studio/schema-types/validation/validate-default-language-blocks-filled/validate-default-language-blocks-filled';
import { validateDefaultLanguageFilled } from '@blog/studio/schema-types/validation/validate-default-language-filled/validate-default-language-filled';
import { CircleHelp } from 'lucide-react';
import { defineType } from 'sanity';

export const faqBlockSchema = defineType({
  name: 'block_faq',
  title: 'FAQ Item',
  type: 'document',
  description:
    'A question a visitor might ask, answered plainly — process, timelines, pricing, scope.',
  icon: CircleHelp,
  fields: [
    titleField(),
    localizedOneLineTextField({
      name: 'question',
      title: 'Question',
      description: 'The question as a visitor would ask it, per language.',
      validation: (rule) =>
        rule.custom(validateDefaultLanguageFilled('Enter the question.')),
    }),
    localizedListedTextField({
      name: 'answer',
      title: 'Answer',
      description:
        'The answer, with bold, italics, lists and links, per language.',
      validation: (rule) =>
        rule.custom(
          validateDefaultLanguageBlocksFilled('Answer the question.'),
        ),
    }),
  ],
  preview: {
    select: {
      title: 'title',
      question: 'question',
    },
    prepare({ title, question }: { title?: unknown; question?: unknown }) {
      return {
        title: String(title ?? 'Unknown'),
        subtitle: defaultLanguageValue(question) ?? 'No question yet',
      };
    },
  },
});
