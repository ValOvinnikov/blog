import {
  CTA_ACTION_APPEARANCE,
  CTA_ACTION_VARIANT,
} from '@blog/config/constants';
import { linkSchema } from '@blog/studio/schema-types/objects/link';
import { toTitleCase } from '@blog/utils/primitives';
import { MousePointerClick } from 'lucide-react';
import { defineArrayMember, defineField, defineType } from 'sanity';

export const ctaActionSchema = defineType({
  name: 'ctaAction',
  title: 'Action',
  type: 'object',
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
        layout: 'radio',
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
      type: linkSchema.name,
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
        title: String(label ?? 'Action'),
        subtitle: `${toTitleCase(String(variant ?? ''))} · ${toTitleCase(String(appearance ?? ''))}`,
      };
    },
  },
});

type TActionItem = { _key?: string; variant?: string };

export const actionGroupSchema = defineType({
  name: 'actionGroup',
  title: 'Actions',
  type: 'object',
  fields: [
    defineField({
      name: 'actions',
      title: 'Actions',
      type: 'array',
      description:
        'Up to two actions. Primary is required and comes first; Secondary is optional.',
      of: [defineArrayMember({ type: ctaActionSchema.name })],
      validation: (rule) =>
        rule.max(2).custom((value) => {
          const items = (value ?? []) as TActionItem[];
          if (items.length === 0) return true;

          const variants = items.map((item) => item?.variant);

          if (new Set(variants).size !== variants.length) {
            return 'Each action variant (Primary, Secondary) can be used only once.';
          }
          if (variants[0] !== CTA_ACTION_VARIANT.PRIMARY) {
            return 'A Primary action is required and must be first.';
          }
          return true;
        }),
    }),
  ],
  preview: {
    select: { a0: 'actions.0.link.label', a1: 'actions.1.link.label' },
    prepare({ a0, a1 }) {
      const labels = [a0, a1].filter(Boolean).map(String);

      return {
        title: labels.length ? labels.join('  ·  ') : 'No actions',
        subtitle: `${labels.length} action${labels.length === 1 ? '' : 's'}`,
      };
    },
  },
});
