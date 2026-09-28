import { defineField } from 'sanity';

import { wideLayoutSchema } from './wide-layout';

export const wideLayoutField = defineField({
  name: 'layout',
  title: 'Layout',
  type: wideLayoutSchema.name,
  description:
    'Optional visual overrides — spacing, container width, dividers.',
});
