import { imageWithAltSchema } from '@blog/studio/schema-types/objects/image-with-alt/image-with-alt';
import { specLineSchema } from '@blog/studio/schema-types/objects/spec-line/spec-line';
import { defineField, defineType } from 'sanity';

export const brandSchema = defineType({
  name: 'brand',
  title: 'Brand',
  type: 'object',
  description:
    'The site name, logo, and optional status line shown in the header and footer.',
  options: { collapsible: true, collapsed: false },
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      description:
        'Brand name — shown in the footer, browser tab, and RSS feed.',
      validation: (rule) => rule.required().max(60),
    }),
    defineField({
      name: 'logo',
      title: 'Logo',
      type: imageWithAltSchema.name,
      description:
        'Site logo. SVG or high-res PNG recommended. Falls back to the default mark when unset.',
    }),
    defineField({
      name: 'specLine',
      title: 'Spec Line',
      type: specLineSchema.name,
      description:
        'Optional monospace line shown below the logo — system-status/build-tag style text, e.g. "build 2026.07 · online".',
    }),
  ],
});
