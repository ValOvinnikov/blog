import { CONTAINER_WIDTH, SPACING_SCALE } from '@blog/config/constants';
import { EnabledStateBooleanInput } from '@blog/studio/schema-types/components/enabled-state-boolean-input';
import { toTitleCase } from '@blog/utils/primitives';
import { SlidersHorizontal } from 'lucide-react';
import { defineField, defineType } from 'sanity';

const spacingOptions = [
  { title: 'None', value: SPACING_SCALE.NONE },
  { title: 'Small', value: SPACING_SCALE.SM },
  { title: 'Medium', value: SPACING_SCALE.MD },
  { title: 'Large', value: SPACING_SCALE.LG },
  { title: 'Extra large', value: SPACING_SCALE.XL },
];

/**
 * Shared spacing + divider fields for both `layoutSchema` (below) and
 * `heroLayoutSchema` (`hero-layout.ts`) — the two types differ only in
 * whether `containerWidth` is present, so the overlapping fields are built
 * once here rather than duplicated (same pattern as `imageAltField()` shared
 * between `imageWithAlt`/`bodyImage`).
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

export const layoutSchema = defineType({
  name: 'layout',
  title: 'Layout',
  type: 'object',
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
