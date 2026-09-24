import { faqBlockSchema } from '@blog/studio/schema-types/documents/blocks/faq/faq';
import { alignmentFields } from '@blog/studio/schema-types/fields/alignment-fields/alignment-fields';
import { brandVariantField } from '@blog/studio/schema-types/fields/brand-variant-field/brand-variant-field';
import { ctaButtonsField } from '@blog/studio/schema-types/fields/cta-buttons-field/cta-buttons-field';
import { titleField } from '@blog/studio/schema-types/fields/title-field/title-field';
import { headingBlockField } from '@blog/studio/schema-types/objects/heading-block/heading-block-field';
import { layoutField } from '@blog/studio/schema-types/objects/layout/layout-field';
import { moduleSubtitle } from '@blog/studio/schema-types/preview/module-subtitle/module-subtitle';
import { MessageCircleQuestion } from 'lucide-react';
import { defineArrayMember, defineField, defineType } from 'sanity';

export const faqSchema = defineType({
  name: 'module_faq',
  title: 'FAQ',
  type: 'document',
  description:
    'The questions a visitor asks before getting in touch, gathered here with their answers.',
  icon: MessageCircleQuestion,
  fields: [
    titleField(),
    brandVariantField(),
    headingBlockField(),
    defineField({
      name: 'questions',
      title: 'Questions',
      type: 'array',
      description:
        'The questions shown in this section, in the order they should be read.',
      of: [
        defineArrayMember({
          type: 'reference',
          to: [{ type: faqBlockSchema.name }],
        }),
      ],
      validation: (rule) => [
        rule.required().error('Add at least two questions.'),
        rule.unique().error('Each question can only appear once.'),
        rule.min(2).error('An FAQ needs at least two questions.'),
        rule
          .max(20)
          .error(
            'An FAQ holds at most twenty questions — split it into two sections.',
          ),
      ],
    }),
    ctaButtonsField(),
    ...alignmentFields([]),
    layoutField,
  ],
  preview: {
    select: {
      title: 'title',
      brandVariant: 'brandVariant',
      questions: 'questions',
    },
    prepare({ title, brandVariant, questions }) {
      const count = Array.isArray(questions) ? questions.length : 0;

      return {
        title: title ?? 'Unknown',
        subtitle: moduleSubtitle(
          brandVariant,
          `${String(count)} question${count === 1 ? '' : 's'}`,
        ),
      };
    },
  },
});
