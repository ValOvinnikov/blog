import { defineField } from 'sanity';

export const imageHotspotOptions = { hotspot: true } as const;

export const imageAltField = () =>
  defineField({
    name: 'alt',
    title: 'Alternative Text',
    type: 'string',
    description: 'Describe the image for screen readers and search engines.',
    validation: (rule) => rule.required(),
  });
