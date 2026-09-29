import { CONTAINER_WIDTH } from '@blog/config/constants';
import { containerWidthField } from '@blog/studio/schema-types/fields/container-width-field/container-width-field';
import { spacingAndDividerFields } from '@blog/studio/schema-types/fields/spacing-and-divider-fields/spacing-and-divider-fields';
import { SlidersHorizontal } from 'lucide-react';
import { defineType } from 'sanity';

export const wideLayoutSchema = defineType({
  name: 'wideLayout',
  title: 'Section Layout',
  type: 'object',
  description:
    'Shared spacing, divider, and width controls for modules whose columns need the wider container widths.',
  icon: SlidersHorizontal,
  options: { collapsible: true, collapsed: true },
  fields: [
    ...spacingAndDividerFields().slice(0, 2),
    containerWidthField({
      values: [CONTAINER_WIDTH.WIDE, CONTAINER_WIDTH.FULL],
    }),
    ...spacingAndDividerFields().slice(2),
  ],
});
