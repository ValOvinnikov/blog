import { HERO_SCHEMA_TYPES } from '@blog/studio/schema-types/modules';
import { defineField } from 'sanity';

export const heroField = () =>
  defineField({
    name: 'hero',
    title: 'Hero',
    type: 'reference',
    description: "Optional. Replaces the page's heading and owns the h1.",
    to: HERO_SCHEMA_TYPES.map((schema) => ({ type: schema.name })),
  });
