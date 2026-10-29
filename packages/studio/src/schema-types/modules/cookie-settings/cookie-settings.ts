import { brandVariantField } from '@blog/studio/schema-types/fields/brand-variant-field/brand-variant-field';
import { titleField } from '@blog/studio/schema-types/fields/title-field/title-field';
import { layoutField } from '@blog/studio/schema-types/objects/layout/layout-field';
import { moduleHeadingBlockField } from '@blog/studio/schema-types/objects/module-heading-block/module-heading-block-field';
import { moduleSubtitle } from '@blog/studio/schema-types/preview/module-subtitle/module-subtitle';
import { Cookie } from 'lucide-react';
import { defineType } from 'sanity';

export const cookieSettingsSchema = defineType({
  name: 'module_cookieSettings',
  title: 'Cookie Settings',
  type: 'document',
  description:
    'A section where readers switch optional cookies on or off and save their choice, for example on your privacy page.',
  icon: Cookie,
  fields: [
    titleField(),
    brandVariantField(),
    moduleHeadingBlockField({ isRequired: false }),
    layoutField,
  ],
  preview: {
    select: {
      title: 'title',
      brandVariant: 'brandVariant',
    },
    prepare({ title, brandVariant }) {
      return {
        title: title ?? 'Unknown',
        subtitle: moduleSubtitle(brandVariant),
      };
    },
  },
});
