import { SPACING_SCALE } from '@blog/config/constants';
import { EnabledStateBooleanInput } from '@blog/studio/schema-types/inputs/enabled-state-boolean-input';
import { type ConditionalProperty, defineField } from 'sanity';

const spacingOptions = [
  { title: 'None', value: SPACING_SCALE.NONE },
  { title: 'Small', value: SPACING_SCALE.SM },
  { title: 'Medium', value: SPACING_SCALE.MD },
  { title: 'Large', value: SPACING_SCALE.LG },
  { title: 'Extra large', value: SPACING_SCALE.XL },
];

type TSpacingAndDividerFieldsOptions = {
  spacingDescriptionSuffix?: string;
  dividerHidden?: ConditionalProperty;
};

export const spacingAndDividerFields = ({
  spacingDescriptionSuffix = '',
  dividerHidden,
}: TSpacingAndDividerFieldsOptions = {}) => [
  defineField({
    name: 'spacingTop',
    title: 'Spacing Top',
    type: 'string',
    description: `Space above this section. Leave unset to use the default (Medium).${spacingDescriptionSuffix}`,
    options: { list: spacingOptions },
  }),
  defineField({
    name: 'spacingBottom',
    title: 'Spacing Bottom',
    type: 'string',
    description: `Space below this section. Leave unset to use the default (Medium).${spacingDescriptionSuffix}`,
    options: { list: spacingOptions },
  }),
  defineField({
    name: 'dividerTop',
    title: 'Divider Top',
    type: 'boolean',
    description:
      'Shows a hairline border above this section when enabled; hidden when disabled.',
    components: { input: EnabledStateBooleanInput },
    hidden: dividerHidden,
  }),
  defineField({
    name: 'dividerBottom',
    title: 'Divider Bottom',
    type: 'boolean',
    description:
      'Shows a hairline border below this section when enabled; hidden when disabled.',
    components: { input: EnabledStateBooleanInput },
    hidden: dividerHidden,
  }),
];
