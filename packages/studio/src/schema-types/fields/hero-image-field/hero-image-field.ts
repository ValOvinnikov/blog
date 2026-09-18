import { HERO_VARIANT } from '@blog/config/constants';
import { imageWithAltSchema } from '@blog/studio/schema-types/objects/image-with-alt/image-with-alt';
import { defineField } from 'sanity';

type THeroImageFieldParent = { variant?: string };

export const heroImageField = () =>
  defineField({
    name: 'image',
    title: 'Image',
    type: imageWithAltSchema.name,
    description:
      "The hero's image — sits beside the copy for Split, below the copy for Stacked, or behind the copy as a full-bleed background for Banner.",
    validation: (rule) =>
      rule.custom((value, context) => {
        const variant = (context.parent as THeroImageFieldParent | undefined)
          ?.variant;

        if (
          !value &&
          (variant === HERO_VARIANT.SPLIT || variant === HERO_VARIANT.BANNER)
        ) {
          return 'Image is required for the Split and Banner variants.';
        }

        return true;
      }),
  });
