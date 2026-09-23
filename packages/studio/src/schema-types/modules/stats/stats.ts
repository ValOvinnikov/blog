import { alignmentFields } from '@blog/studio/schema-types/fields/alignment-fields/alignment-fields';
import { brandVariantField } from '@blog/studio/schema-types/fields/brand-variant-field/brand-variant-field';
import { ctaButtonsField } from '@blog/studio/schema-types/fields/cta-buttons-field/cta-buttons-field';
import { titleField } from '@blog/studio/schema-types/fields/title-field/title-field';
import { headingBlockField } from '@blog/studio/schema-types/objects/heading-block/heading-block-field';
import { layoutField } from '@blog/studio/schema-types/objects/layout/layout-field';
import { statSchema } from '@blog/studio/schema-types/objects/stat/stat';
import { moduleSubtitle } from '@blog/studio/schema-types/preview/module-subtitle/module-subtitle';
import { ChartBar } from 'lucide-react';
import { defineArrayMember, defineField, defineType } from 'sanity';

export const statsSchema = defineType({
  name: 'module_stats',
  title: 'Stats',
  type: 'document',
  description:
    'A band of figures — signups, uptime, ratings — used to back up a claim with numbers.',
  icon: ChartBar,
  fields: [
    titleField(),
    brandVariantField(),
    headingBlockField(),
    defineField({
      name: 'stats',
      title: 'Stats',
      type: 'array',
      description: 'The figures, in the order they should read.',
      of: [defineArrayMember({ type: statSchema.name })],
      validation: (rule) => [
        rule.required().error('Add at least two figures.'),
        rule.min(2).error('A stats band needs at least two figures.'),
        rule.max(6).error('A stats band holds at most six figures.'),
      ],
    }),
    defineField({
      name: 'footnote',
      title: 'Footnote',
      type: 'string',
      description:
        'One line under the figures — the period, the source, or a caveat.',
      validation: (rule) =>
        rule.max(160).warning('A footnote is one line, not a paragraph.'),
    }),
    ctaButtonsField(),
    ...alignmentFields([], {
      description:
        'Horizontal alignment of the heading, supporting text, figures and actions.',
    }),
    layoutField,
  ],
  preview: {
    select: {
      title: 'title',
      brandVariant: 'brandVariant',
      stats: 'stats',
    },
    prepare({ title, brandVariant, stats }) {
      const count = Array.isArray(stats) ? stats.length : 0;

      return {
        title: title ?? 'Unknown',
        subtitle: moduleSubtitle(
          brandVariant,
          `${String(count)} stat${count === 1 ? '' : 's'}`,
        ),
      };
    },
  },
});
