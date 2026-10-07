import { defineField } from 'sanity';

import { ctaLayoutSchema } from './cta-layout';

export const ctaLayoutField = defineField({
  name: 'layout',
  title: 'Layout',
  type: ctaLayoutSchema.name,
  description:
    'Optional visual overrides — spacing, container width, dividers.',
});
