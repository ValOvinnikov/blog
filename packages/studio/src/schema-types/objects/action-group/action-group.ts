import { CTA_ACTION_VARIANT } from '@blog/config/constants';
import { linksField } from '@blog/studio/schema-types/fields/links-field/links-field';
import { ctaActionRefSchema } from '@blog/studio/schema-types/objects/cta-action-ref/cta-action-ref';
import { defineType } from 'sanity';

type TActionItem = { _key?: string; variant?: string };

const validatePrimaryFirst = (value: unknown) => {
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
};

export const actionGroupSchema = defineType({
  name: 'actionGroup',
  title: 'Actions',
  type: 'object',
  description:
    'Up to two actions — a required primary and an optional secondary — offered together.',
  fields: [
    linksField({
      name: 'actions',
      title: 'Actions',
      description:
        'The buttons or links offered here — Primary drives the main click, Secondary offers an alternative alongside it.',
      of: [ctaActionRefSchema.name],
      max: 2,
      validateCustom: (rule) => rule.custom(validatePrimaryFirst),
    }),
  ],
  preview: {
    select: {
      a0Override: 'actions.0.labelOverride',
      a0Link: 'actions.0.link.label',
      a1Override: 'actions.1.labelOverride',
      a1Link: 'actions.1.link.label',
    },
    prepare({ a0Override, a0Link, a1Override, a1Link }) {
      const labels = [a0Override ?? a0Link, a1Override ?? a1Link]
        .filter(Boolean)
        .map(String);

      return {
        title: labels.length ? labels.join('  ·  ') : 'No actions',
        subtitle: `${labels.length} action${labels.length === 1 ? '' : 's'}`,
      };
    },
  },
});
