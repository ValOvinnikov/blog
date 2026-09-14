import {
  CTA_ACTION_APPEARANCE,
  CTA_ACTION_VARIANT,
} from '@blog/config/constants';
import { toTitleCase } from '@blog/utils/primitives';
import { defineField } from 'sanity';

/**
 * The variant/appearance fields shared by every action-shaped type — how
 * the action ranks (Primary/Secondary) and how it looks (Contained/Inline).
 * Shared by the legacy `ctaAction` object and `ctaActionRef` so the two stay
 * behaviourally identical.
 */
export const ctaActionFields = () => [
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
];
