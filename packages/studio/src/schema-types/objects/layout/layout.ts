import { CONTAINER_WIDTH } from '@blog/config/constants';
import { spacingAndDividerFields } from '@blog/studio/schema-types/fields/spacing-and-divider-fields/spacing-and-divider-fields';
import { toTitleCase } from '@blog/utils/primitives';
import { SlidersHorizontal } from 'lucide-react';
import { defineField, defineType } from 'sanity';

export const layoutSchema = defineType({
  name: 'layout',
  title: 'Layout',
  type: 'object',
  description:
    'Shared spacing, divider, and width controls available on most modules.',
  icon: SlidersHorizontal,
  options: { collapsible: true, collapsed: true },
  fields: [
    ...spacingAndDividerFields().slice(0, 2),
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
    ...spacingAndDividerFields().slice(2),
  ],
});
