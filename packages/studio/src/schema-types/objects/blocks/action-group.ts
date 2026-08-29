import { CTA_ACTION_APPEARANCE } from '@blog/config/constants';
import { linkSchema } from '@blog/studio/schema-types/objects/link';
import { toTitleCase } from '@blog/utils/primitives';
import { MousePointerClick } from 'lucide-react';
import { defineField, defineType } from 'sanity';

type TActionGroupValue = {
  primary?: unknown;
  secondary?: unknown;
};

export const actionGroupSchema = defineType({
  name: 'actionGroup',
  title: 'Actions',
  type: 'object',
  icon: MousePointerClick,
  fields: [
    defineField({
      name: 'primary',
      title: 'Primary Action',
      type: linkSchema.name,
      description: 'The main action — always a filled button.',
    }),
    defineField({
      name: 'secondary',
      title: 'Secondary Action',
      type: linkSchema.name,
      description: 'Optional supporting action. Requires a primary action.',
    }),
    defineField({
      name: 'secondaryAppearance',
      title: 'Secondary Appearance',
      type: 'string',
      description:
        'How the secondary action looks: Contained (bordered button) or Inline (text link).',
      options: {
        layout: 'radio',
        list: Object.values(CTA_ACTION_APPEARANCE).map((value) => ({
          title: toTitleCase(value),
          value,
        })),
      },
      initialValue: CTA_ACTION_APPEARANCE.CONTAINED,
      hidden: ({ parent }) =>
        !(parent as TActionGroupValue | undefined)?.secondary,
    }),
  ],
  validation: (rule) =>
    rule.custom((value: TActionGroupValue | undefined) =>
      value?.secondary && !value?.primary
        ? 'A secondary action needs a primary action. Add a primary action first.'
        : true,
    ),
  preview: {
    select: { primary: 'primary.label', secondary: 'secondary.label' },
    prepare({ primary, secondary }: { primary?: string; secondary?: string }) {
      const labels = [primary, secondary].filter(Boolean);

      return {
        title: labels.length ? labels.join('  ·  ') : 'No actions',
        subtitle: `${labels.length} action${labels.length === 1 ? '' : 's'}`,
      };
    },
  },
});
