import { defineField } from 'sanity';

export const heroField = ({ allow }: { allow: string[] }) =>
  defineField({
    name: 'hero',
    title: 'Hero',
    type: 'reference',
    description: "Optional. Replaces the page's heading and owns the h1.",
    to: allow.map((type) => ({ type })),
  });
