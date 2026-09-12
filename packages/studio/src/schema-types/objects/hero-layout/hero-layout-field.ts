import { defineField } from 'sanity';

import { heroLayoutSchema } from './hero-layout';

export const heroLayoutField = defineField({
  name: 'layout',
  title: 'Layout',
  type: heroLayoutSchema.name,
  description: 'Optional visual overrides — spacing, dividers.',
});
