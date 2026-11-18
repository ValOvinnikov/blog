import { cardModuleAppearance } from '@shinefold/studio/schema-types/fields/appearance-fields/appearance-fields';
import { ctaButtonsField } from '@shinefold/studio/schema-types/fields/cta-buttons-field/cta-buttons-field';
import { localizedOneLineTextField } from '@shinefold/studio/schema-types/fields/localized-one-line-text-field/localized-one-line-text-field';
import { titleField } from '@shinefold/studio/schema-types/fields/title-field/title-field';
import { moduleHeadingBlockField } from '@shinefold/studio/schema-types/objects/module-heading-block/module-heading-block-field';
import { pricingTierSchema } from '@shinefold/studio/schema-types/objects/pricing-tier/pricing-tier';
import { moduleSubtitle } from '@shinefold/studio/schema-types/preview/module-subtitle/module-subtitle';
import { validateLocalizedMaxLength } from '@shinefold/studio/schema-types/validation/validate-localized-max-length/validate-localized-max-length';
import { validatePricingSingleHighlightedTier } from '@shinefold/studio/schema-types/validation/validate-pricing-single-highlighted-tier/validate-pricing-single-highlighted-tier';
import { DollarSign } from 'lucide-react';
import { defineArrayMember, defineField, defineType } from 'sanity';

const FOOTNOTE_MAX_LENGTH = 160;
const NO_TIERS_ERROR = 'Add at least one tier.';

export const pricingSchema = defineType({
  name: 'module_pricing',
  title: 'Pricing',
  type: 'document',
  description: 'A table of plans and their prices, used to sell an offer.',
  icon: DollarSign,
  ...cardModuleAppearance({
    content: [
      titleField(),
      moduleHeadingBlockField(),
      defineField({
        name: 'tiers',
        title: 'Tiers',
        type: 'array',
        description:
          'The tiers, left to right. Prices use the currency set in Site Settings (change it there).',
        of: [defineArrayMember({ type: pricingTierSchema.name })],
        validation: (rule) => [
          rule.required().error(NO_TIERS_ERROR),
          rule.min(1).error(NO_TIERS_ERROR),
          rule.max(4).error('Pricing holds at most four tiers.'),
          rule.custom(validatePricingSingleHighlightedTier),
        ],
      }),
      localizedOneLineTextField({
        name: 'footnote',
        title: 'Footnote',
        description:
          'One line under the tiers — the currency, taxes, or a caveat.',
        validation: (rule) =>
          rule.custom(
            validateLocalizedMaxLength(
              FOOTNOTE_MAX_LENGTH,
              'A footnote is one line, not a paragraph.',
            ),
          ),
      }),
      ctaButtonsField(),
    ],
    headingAlignment: { hasActions: true },
    hasColumns: false,
  }),
  preview: {
    select: {
      title: 'title',
      brandVariant: 'brandVariant',
      tiers: 'tiers',
    },
    prepare({ title, brandVariant, tiers }) {
      const count = Array.isArray(tiers) ? tiers.length : 0;

      return {
        title: title ?? 'Unknown',
        subtitle: moduleSubtitle(
          brandVariant,
          `${String(count)} tier${count === 1 ? '' : 's'}`,
        ),
      };
    },
  },
});
