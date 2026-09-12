import { defineField } from 'sanity';

import { layoutSchema } from './layout';

export const layoutField = defineField({
  name: 'layout',
  title: 'Layout',
  type: layoutSchema.name,
  description:
    'Optional visual overrides — spacing, container width, dividers.',
});
