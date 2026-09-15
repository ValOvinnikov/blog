import {
  CTA_ACTION_VARIANT,
  type TCtaActionVariant,
} from '@blog/config/constants';
import { ctaButtonSchema } from '@blog/studio/schema-types/objects/cta-button/cta-button';
import { toTitleCase } from '@blog/utils/primitives';
import { defineArrayMember, defineField } from 'sanity';

type TCtaButtonItem = { variant?: string };

/**
 * Builds the `ctaButtons` array field — up to two `ctaButton` entries, with
 * a Primary (if present) required to lead the list and never duplicated.
 */
export const ctaButtonsField = ({
  title = 'Buttons',
  description,
  min = 0,
  max = 2,
  allowVariants = Object.values(CTA_ACTION_VARIANT),
}: {
  title?: string;
  description?: string;
  min?: number;
  max?: number;
  allowVariants?: TCtaActionVariant[];
} = {}) =>
  defineField({
    name: 'ctaButtons',
    title,
    type: 'array',
    description:
      description ??
      'The buttons offered here — Primary drives the main click, Secondary offers an alternative alongside it.',
    of: [defineArrayMember({ type: ctaButtonSchema.name })],
    validation: (rule) =>
      rule
        .min(min)
        .max(max)
        .custom((value) => {
          const items = (value ?? []) as TCtaButtonItem[];
          if (items.length === 0) return true;

          const disallowed = items.some(
            (item) =>
              item.variant &&
              !allowVariants.includes(item.variant as TCtaActionVariant),
          );
          if (disallowed) {
            return `Only ${allowVariants.map((variant) => toTitleCase(variant)).join(' and ')} buttons are allowed here.`;
          }

          const primaryCount = items.filter(
            (item) => item.variant === CTA_ACTION_VARIANT.PRIMARY,
          ).length;
          if (primaryCount > 1) {
            return 'Only one Primary button is allowed.';
          }

          const primaryIndex = items.findIndex(
            (item) => item.variant === CTA_ACTION_VARIANT.PRIMARY,
          );
          if (primaryIndex > 0) {
            return 'A Primary button must be listed first.';
          }

          return true;
        }),
  });
