import { sortModulesByTitle } from '@blog/studio/schema-types/fields/modules-field/sort-modules-by-title';
import { defineField } from 'sanity';

export const heroField = ({ allow }: { allow: string[] }) =>
  defineField({
    name: 'hero',
    title: 'Hero',
    type: 'reference',
    description: "Optional. Replaces the page's heading and owns the h1.",
    to: sortModulesByTitle(allow).map((type) => ({ type })),
  });
