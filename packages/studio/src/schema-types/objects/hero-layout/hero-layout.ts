import { HERO_VARIANT } from '@blog/config/constants';
import { spacingAndDividerFields } from '@blog/studio/schema-types/fields/spacing-and-divider-fields/spacing-and-divider-fields';
import { isVariantDocument } from '@blog/studio/schema-types/fields/variant-field/variant-predicate';
import { SlidersHorizontal } from 'lucide-react';
import { defineType } from 'sanity';

// Sanity fixes a named object type's fields at registration, so each layout field set is its own registered type.
export const heroLayoutSchema = defineType({
  name: 'heroLayout',
  title: 'Spacing and Dividers',
  type: 'object',
  description: 'Spacing and divider controls for a hero module.',
  icon: SlidersHorizontal,
  options: { collapsible: true, collapsed: true },
  fields: spacingAndDividerFields({
    spacingDescriptionSuffix: ' On a Banner, this sets the Banner’s height.',
    dividerHidden: isVariantDocument(HERO_VARIANT.BANNER),
  }),
});
