import {
  ALIGN,
  BACKGROUND_TONE,
  CONTAINER_WIDTH,
  SPACING_SCALE,
} from '@blog/config/constants';
import { toTitleCase } from '@blog/utils';
import { EnabledStateBooleanInput } from '@cms/schema-types/components/enabled-state-boolean-input';
import { SlidersHorizontal } from 'lucide-react';
import { defineField, defineType } from 'sanity';

const spacingOptions = [
  { title: 'None', value: SPACING_SCALE.NONE },
  { title: 'Small', value: SPACING_SCALE.SM },
  { title: 'Medium', value: SPACING_SCALE.MD },
  { title: 'Large', value: SPACING_SCALE.LG },
  { title: 'Extra large', value: SPACING_SCALE.XL },
];

export const appearanceSchema = defineType({
  name: 'appearance',
  title: 'Appearance',
  type: 'object',
  icon: SlidersHorizontal,
  options: { collapsible: true, collapsed: true },
  fields: [
    defineField({
      name: 'background',
      title: 'Background',
      type: 'string',
      description:
        'Background tone for this section. Leave unset for the default page background.',
      options: {
        list: Object.values(BACKGROUND_TONE).map((value) => ({
          title: toTitleCase(value),
          value,
        })),
      },
    }),
    defineField({
      name: 'spacingTop',
      title: 'Spacing Top',
      type: 'string',
      description:
        'Space above this section. Leave unset for the default spacing.',
      options: { list: spacingOptions },
    }),
    defineField({
      name: 'spacingBottom',
      title: 'Spacing Bottom',
      type: 'string',
      description:
        'Space below this section. Leave unset for the default spacing.',
      options: { list: spacingOptions },
    }),
    defineField({
      name: 'containerWidth',
      title: 'Container Width',
      type: 'string',
      description:
        "How wide this section's content can grow. Leave unset for the default width.",
      options: {
        list: Object.values(CONTAINER_WIDTH).map((value) => ({
          title: toTitleCase(value),
          value,
        })),
      },
    }),
    defineField({
      name: 'align',
      title: 'Align',
      type: 'string',
      description:
        "Horizontal alignment of this section's content. Leave unset for the default (left-aligned).",
      options: {
        list: Object.values(ALIGN).map((value) => ({
          title: toTitleCase(value),
          value,
        })),
      },
    }),
    defineField({
      name: 'divider',
      title: 'Divider',
      type: 'boolean',
      description:
        'Shows a hairline border above this section when enabled; hidden when disabled.',
      components: { input: EnabledStateBooleanInput },
    }),
  ],
});
