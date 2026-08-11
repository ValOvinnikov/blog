import { heroLayoutSchema } from '@cms/schema-types/objects/hero-layout';
import { layoutSchema } from '@cms/schema-types/objects/layout';
import { defineField } from 'sanity';

export const layoutField = defineField({
  name: 'layout',
  title: 'Layout',
  type: layoutSchema.name,
  description:
    'Optional visual overrides — spacing, container width, dividers.',
});

export const heroLayoutField = defineField({
  name: 'layout',
  title: 'Layout',
  type: heroLayoutSchema.name,
  description: 'Optional visual overrides — spacing, dividers.',
});
