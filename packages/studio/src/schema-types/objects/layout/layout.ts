import { containerWidthField } from '@blog/studio/schema-types/fields/container-width-field/container-width-field';
import { spacingAndDividerFields } from '@blog/studio/schema-types/fields/spacing-and-divider-fields/spacing-and-divider-fields';
import { SlidersHorizontal } from 'lucide-react';
import { defineType } from 'sanity';

export const layoutSchema = defineType({
  name: 'layout',
  title: 'Spacing, Dividers and Width',
  type: 'object',
  description:
    'Spacing, divider and width controls for single-column modules, from the narrow reading measure to full width.',
  icon: SlidersHorizontal,
  options: { collapsible: true, collapsed: true },
  fields: [
    ...spacingAndDividerFields().slice(0, 2),
    containerWidthField(),
    ...spacingAndDividerFields().slice(2),
  ],
});
