import { appearanceSchema } from '@cms/schema-types/objects/appearance';
import { defineField } from 'sanity';

export const appearanceField = defineField({
  name: 'appearance',
  title: 'Appearance',
  type: appearanceSchema.name,
  description:
    'Optional visual overrides — background, spacing, container width, alignment, divider.',
});
