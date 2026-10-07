import { CTA_VARIANT } from '@blog/config/constants';
import { containerWidthField } from '@blog/studio/schema-types/fields/container-width-field/container-width-field';
import { spacingAndDividerFields } from '@blog/studio/schema-types/fields/spacing-and-divider-fields/spacing-and-divider-fields';
import { isVariantDocument } from '@blog/studio/schema-types/fields/variant-field/variant-predicate';
import { SlidersHorizontal } from 'lucide-react';
import { defineType } from 'sanity';

const isBannerDocument = isVariantDocument(CTA_VARIANT.BANNER);

const ctaSpacingAndDividerFields = spacingAndDividerFields({
  spacingDescriptionSuffix: ' On a Banner, this sets the Banner’s height.',
  dividerHidden: isBannerDocument,
});

export const ctaLayoutSchema = defineType({
  name: 'ctaLayout',
  title: 'Call to Action Spacing, Dividers and Width',
  type: 'object',
  description:
    'Spacing, divider and width controls for a call to action. A Banner spans the page, so it takes no width or dividers.',
  icon: SlidersHorizontal,
  options: { collapsible: true, collapsed: true },
  fields: [
    ...ctaSpacingAndDividerFields.slice(0, 2),
    containerWidthField({ hidden: isBannerDocument }),
    ...ctaSpacingAndDividerFields.slice(2),
  ],
});
