import { titleField } from '@blog/studio/schema-types/fields/title-field/title-field';
import { listedTextSchema } from '@blog/studio/schema-types/portable-text/listed-text/listed-text';
import { CircleHelp } from 'lucide-react';
import { defineField, defineType } from 'sanity';

export const faqBlockSchema = defineType({
  name: 'block_faq',
  title: 'FAQ Item',
  type: 'document',
  description:
    'A question and its answer — reusable across every FAQ module on the site.',
  icon: CircleHelp,
  fields: [
    titleField(),
    defineField({
      name: 'question',
      title: 'Question',
      type: 'string',
      description: 'The question as a visitor would ask it.',
      validation: (rule) => rule.required().error('Write the question.'),
    }),
    defineField({
      name: 'answer',
      title: 'Answer',
      type: listedTextSchema.name,
      description: 'The answer, with bold, italics, lists and links.',
      validation: (rule) => rule.required().error('Write the answer.'),
    }),
  ],
  preview: {
    select: {
      title: 'title',
      question: 'question',
    },
    prepare({ title, question }) {
      return {
        title: String(title ?? 'Unknown'),
        subtitle: typeof question === 'string' ? question : 'No question yet',
      };
    },
  },
});
