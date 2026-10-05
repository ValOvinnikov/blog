import { BRAND_VARIANT, FULL_BRAND_VARIANT_LIST } from '@blog/config/constants';
import { alignmentFields } from '@blog/studio/schema-types/fields/alignment-fields/alignment-fields';
import { brandVariantField } from '@blog/studio/schema-types/fields/brand-variant-field/brand-variant-field';
import { ctaButtonsField } from '@blog/studio/schema-types/fields/cta-buttons-field/cta-buttons-field';
import { localizedOneLineTextField } from '@blog/studio/schema-types/fields/localized-one-line-text-field/localized-one-line-text-field';
import { titleField } from '@blog/studio/schema-types/fields/title-field/title-field';
import { localizedHeadingBlockField } from '@blog/studio/schema-types/objects/localized-heading-block/localized-heading-block-field';
import { statSchema } from '@blog/studio/schema-types/objects/stat/stat';
import { wideLayoutField } from '@blog/studio/schema-types/objects/wide-layout/wide-layout-field';
import { moduleSubtitle } from '@blog/studio/schema-types/preview/module-subtitle/module-subtitle';
import { validateLocalizedMaxLength } from '@blog/studio/schema-types/validation/validate-localized-max-length/validate-localized-max-length';
import { ChartBar } from 'lucide-react';
import { defineArrayMember, defineField, defineType } from 'sanity';

const FOOTNOTE_MAX_LENGTH = 160;

export const statsSchema = defineType({
  name: 'module_stats',
  title: 'Stats',
  type: 'document',
  description:
    'A band of figures — signups, uptime, ratings — used to back up a claim with numbers.',
  icon: ChartBar,
  fields: [
    titleField(),
    brandVariantField({
      list: FULL_BRAND_VARIANT_LIST,
      initialValue: BRAND_VARIANT.PRIMARY,
    }),
    localizedHeadingBlockField(),
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
    localizedOneLineTextField({
      name: 'footnote',
      title: 'Footnote',
      description:
        'One line under the figures, per language — the period, the source, or a caveat.',
      validation: (rule) =>
        rule
          .custom(
            validateLocalizedMaxLength(
              FOOTNOTE_MAX_LENGTH,
              'A footnote is one line, not a paragraph.',
            ),
          )
          .warning(),
    }),
    ctaButtonsField(),
    ...alignmentFields([], {
      description:
        'Horizontal alignment of the heading, supporting text, figures and actions.',
    }),
    wideLayoutField,
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
