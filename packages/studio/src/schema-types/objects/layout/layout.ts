import { containerWidthField } from '@blog/studio/schema-types/fields/container-width-field/container-width-field';
import { spacingAndDividerFields } from '@blog/studio/schema-types/fields/spacing-and-divider-fields/spacing-and-divider-fields';
import { SlidersHorizontal } from 'lucide-react';
import { defineType } from 'sanity';

export const layoutSchema = defineType({
  name: 'layout',
  title: 'Section Layout',
  type: 'object',
  description:
    'Shared spacing, divider, and width controls available on most modules.',
  icon: SlidersHorizontal,
  options: { collapsible: true, collapsed: true },
  fields: [
    ...spacingAndDividerFields().slice(0, 2),
    containerWidthField(),
    ...spacingAndDividerFields().slice(2),
  ],
});
