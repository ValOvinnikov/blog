import { SPACING_SCALE } from '@blog/config/constants';
import { EnabledStateBooleanInput } from '@blog/studio/schema-types/inputs/enabled-state-boolean-input';
import { defineField } from 'sanity';

const spacingOptions = [
  { title: 'None', value: SPACING_SCALE.NONE },
  { title: 'Small', value: SPACING_SCALE.SM },
  { title: 'Medium', value: SPACING_SCALE.MD },
  { title: 'Large', value: SPACING_SCALE.LG },
  { title: 'Extra large', value: SPACING_SCALE.XL },
];

/**
 * Shared spacing + divider fields for both `layoutSchema` and
 * `heroLayoutSchema` — the two types differ only in whether `containerWidth`
 * is present, so the overlapping fields are built once here rather than
 * duplicated (same pattern as `imageAltField()` shared between
 * `imageWithAlt`/`bodyImage`).
 */
export const spacingAndDividerFields = () => [
  defineField({
    name: 'spacingTop',
    title: 'Spacing Top',
    type: 'string',
    description:
      'Space above this section. Leave unset to use the default (Medium).',
    options: { list: spacingOptions },
  }),
  defineField({
    name: 'spacingBottom',
    title: 'Spacing Bottom',
    type: 'string',
    description:
      'Space below this section. Leave unset to use the default (Medium).',
    options: { list: spacingOptions },
  }),
  defineField({
    name: 'dividerTop',
    title: 'Divider Top',
    type: 'boolean',
    description:
      'Shows a hairline border above this section when enabled; hidden when disabled.',
    components: { input: EnabledStateBooleanInput },
  }),
  defineField({
    name: 'dividerBottom',
    title: 'Divider Bottom',
    type: 'boolean',
    description:
      'Shows a hairline border below this section when enabled; hidden when disabled.',
    components: { input: EnabledStateBooleanInput },
  }),
];
