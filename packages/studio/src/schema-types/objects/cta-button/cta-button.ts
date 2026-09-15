import {
  CTA_ACTION_APPEARANCE,
  CTA_ACTION_VARIANT,
} from '@blog/config/constants';
import { linkSchema } from '@blog/studio/schema-types/documents/link/link';
import { toTitleCase } from '@blog/utils/primitives';
import { MousePointerClick } from 'lucide-react';
import { defineField, defineType } from 'sanity';

/**
 * A single button pointing at a `link` document — the reusable-link
 * counterpart to the legacy `ctaAction`, used by `ctaButtons`.
 */
export const ctaButtonSchema = defineType({
  name: 'ctaButton',
  title: 'Button',
  type: 'object',
  description:
    'A single button pointing at a reusable link, used inside a call to action.',
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
        'How this button looks: Contained (filled/bordered button) or Inline (text link). Available on both Primary and Secondary.',
      options: {
        layout: 'dropdown',
        list: Object.values(CTA_ACTION_APPEARANCE).map((value) => ({
          title: toTitleCase(value),
          value,
        })),
      },
      initialValue: CTA_ACTION_APPEARANCE.CONTAINED,
    }),
    defineField({
      name: 'link',
      title: 'Link',
      type: 'reference',
      description: 'Where this button goes.',
      to: [{ type: linkSchema.name }],
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: {
      label: 'link.label',
      variant: 'variant',
      appearance: 'appearance',
    },
    prepare({ label, variant, appearance }) {
      return {
        title: String(label ?? 'Button'),
        subtitle: `${toTitleCase(String(variant ?? ''))} · ${toTitleCase(String(appearance ?? ''))}`,
      };
    },
  },
});
