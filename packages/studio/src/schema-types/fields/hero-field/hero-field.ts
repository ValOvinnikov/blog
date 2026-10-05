import { sortModulesByKind } from '@blog/studio/structure/module-kinds/module-kinds';
import { defineField } from 'sanity';

export const heroField = ({ allow }: { allow: string[] }) =>
  defineField({
    name: 'hero',
    title: 'Hero',
    type: 'reference',
    description: "Optional. Replaces the page's heading and owns the h1.",
    to: sortModulesByKind(allow).map((type) => ({ type })),
  });
