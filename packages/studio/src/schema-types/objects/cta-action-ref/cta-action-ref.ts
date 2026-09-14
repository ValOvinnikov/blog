import {
  CTA_ACTION_APPEARANCE,
  CTA_ACTION_VARIANT,
} from '@blog/config/constants';
import { linkRefFields } from '@blog/studio/schema-types/fields/link-ref-fields/link-ref-fields';
import { toTitleCase } from '@blog/utils/primitives';
import { MousePointerClick } from 'lucide-react';
import { defineField, defineType } from 'sanity';

export const ctaActionRefSchema = defineType({
  name: 'ctaActionRef',
  title: 'Action',
  type: 'object',
  description:
    'A single button or text link, authored by choosing a shared link, used inside a call to action or action group.',
  icon: MousePointerClick,
  initialValue: {
    variant: CTA_ACTION_VARIANT.PRIMARY,
    appearance: CTA_ACTION_APPEARANCE.CONTAINED,
  },
  fields: [
    defineField({
      name: 'variant',
      title: 'Variant',
      type: 'string',
      description:
        'Primary is the main action. Secondary is the supporting action.',
      options: {
        layout: 'radio',
        list: Object.values(CTA_ACTION_VARIANT).map((value) => ({
          title: toTitleCase(value),
          value,
        })),
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'appearance',
      title: 'Appearance',
      type: 'string',
      description:
        'How this action looks: Contained (filled/bordered button) or Inline (text link). Available on both Primary and Secondary.',
      options: {
        layout: 'dropdown',
        list: Object.values(CTA_ACTION_APPEARANCE).map((value) => ({
          title: toTitleCase(value),
          value,
        })),
      },
      initialValue: CTA_ACTION_APPEARANCE.CONTAINED,
    }),
    ...linkRefFields(),
  ],
  preview: {
    select: {
      labelOverride: 'labelOverride',
      linkLabel: 'link.label',
      variant: 'variant',
      appearance: 'appearance',
    },
    prepare({ labelOverride, linkLabel, variant, appearance }) {
      return {
        title: String(labelOverride ?? linkLabel ?? 'Action'),
        subtitle: `${toTitleCase(String(variant ?? ''))} · ${toTitleCase(String(appearance ?? ''))}`,
      };
    },
  },
});
