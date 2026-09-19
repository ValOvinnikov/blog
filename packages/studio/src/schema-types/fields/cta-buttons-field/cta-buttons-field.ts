import { CTA_ACTION_VARIANT } from '@blog/config/constants';
import { ctaButtonSchema } from '@blog/studio/schema-types/objects/cta-button/cta-button';
import { toTitleCase } from '@blog/utils/primitives';
import { defineArrayMember, defineField } from 'sanity';

type TCtaButtonItem = { variant?: string };

export const ctaButtonsField = ({
  title = 'Actions',
  description = 'A list of actions associated with this content, such as links to other pages or external sites.',
  min = 0,
  max = 2,
}: {
  title?: string;
  description?: string;
  min?: number;
  max?: number;
} = {}) =>
  defineField({
    name: 'ctaButtons',
    title,
    description,
    type: 'array',
    of: [defineArrayMember({ type: ctaButtonSchema.name })],
    validation: (rule) =>
      rule
        .min(min)
        .max(max)
        .custom((value) => {
          const items = (value ?? []) as TCtaButtonItem[];
          if (items.length === 0) return true;

          const seenVariants = new Set<string>();
          for (const item of items) {
            if (!item.variant) continue;
            if (seenVariants.has(item.variant)) {
              return `Only one ${toTitleCase(item.variant)} action is allowed.`;
            }
            seenVariants.add(item.variant);
          }

          const primaryIndex = items.findIndex(
            (item) => item.variant === CTA_ACTION_VARIANT.PRIMARY,
          );
          if (primaryIndex > 0) {
            return 'A Primary action must be listed first.';
          }

          return true;
        }),
  });
