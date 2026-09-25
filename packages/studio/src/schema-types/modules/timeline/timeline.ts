import {
  CONTENT_ALIGNMENT,
  TIMELINE_MARKER_STYLE,
  TIMELINE_ORIENTATION,
} from '@blog/config/constants';
import { alignmentFields } from '@blog/studio/schema-types/fields/alignment-fields/alignment-fields';
import { brandVariantField } from '@blog/studio/schema-types/fields/brand-variant-field/brand-variant-field';
import { ctaButtonsField } from '@blog/studio/schema-types/fields/cta-buttons-field/cta-buttons-field';
import { titleField } from '@blog/studio/schema-types/fields/title-field/title-field';
import { headingBlockField } from '@blog/studio/schema-types/objects/heading-block/heading-block-field';
import { layoutField } from '@blog/studio/schema-types/objects/layout/layout-field';
import { timelineItemSchema } from '@blog/studio/schema-types/objects/timeline-item/timeline-item';
import { moduleSubtitle } from '@blog/studio/schema-types/preview/module-subtitle/module-subtitle';
import { validateTimelineHorizontalItemCap } from '@blog/studio/schema-types/validation/validate-timeline-horizontal-item-cap/validate-timeline-horizontal-item-cap';
import { toTitleCase } from '@blog/utils/primitives';
import { Milestone } from 'lucide-react';
import { defineArrayMember, defineField, defineType } from 'sanity';

export const timelineSchema = defineType({
  name: 'module_timeline',
  title: 'Timeline',
  type: 'document',
  description:
    'A step-by-step process or a milestone history — items shown as points on one connected line, used to walk a reader through how something happens or has happened.',
  icon: Milestone,
  fields: [
    titleField(),
    brandVariantField(),
    headingBlockField(),
    defineField({
      name: 'markerStyle',
      title: 'Marker Style',
      type: 'string',
      description: 'How each item on the timeline is marked.',
      options: {
        layout: 'dropdown',
        list: Object.values(TIMELINE_MARKER_STYLE).map((value) => ({
          title: toTitleCase(value),
          value,
        })),
      },
      initialValue: TIMELINE_MARKER_STYLE.NUMBERED,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'items',
      title: 'Items',
      type: 'array',
      description: 'The steps or milestones, in the order they happen.',
      of: [defineArrayMember({ type: timelineItemSchema.name })],
      validation: (rule) => [
        rule.required().error('Add at least two items.'),
        rule.min(2).error('A timeline needs at least two items.'),
        rule.max(8).error('A timeline holds at most eight items.'),
        rule.custom(validateTimelineHorizontalItemCap),
      ],
    }),
    defineField({
      name: 'orientation',
      title: 'Orientation',
      type: 'string',
      description: 'How the timeline is laid out on the page.',
      options: {
        layout: 'dropdown',
        list: Object.values(TIMELINE_ORIENTATION).map((value) => ({
          title: toTitleCase(value),
          value,
        })),
      },
      initialValue: TIMELINE_ORIENTATION.VERTICAL,
      validation: (rule) => rule.required(),
    }),
    ctaButtonsField(),
    ...alignmentFields([
      {
        name: 'itemAlignment',
        title: 'Item Alignment',
        description: 'Aligns the marker and text within each timeline item.',
        allow: [CONTENT_ALIGNMENT.LEFT, CONTENT_ALIGNMENT.CENTER],
        initialValue: CONTENT_ALIGNMENT.LEFT,
        validation: (rule) => rule.required(),
      },
    ]),
    layoutField,
  ],
  preview: {
    select: {
      title: 'title',
      brandVariant: 'brandVariant',
      items: 'items',
    },
    prepare({ title, brandVariant, items }) {
      const count = Array.isArray(items) ? items.length : 0;

      return {
        title: title ?? 'Unknown',
        subtitle: moduleSubtitle(
          brandVariant,
          `${String(count)} item${count === 1 ? '' : 's'}`,
        ),
      };
    },
  },
});
