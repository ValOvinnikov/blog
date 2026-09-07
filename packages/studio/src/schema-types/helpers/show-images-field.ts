import { defineField } from 'sanity';

export const showImagesField = () =>
  defineField({
    name: 'showImages',
    title: 'Show Images',
    type: 'boolean',
    description: "Show each post's image on its card.",
    initialValue: true,
    validation: (rule) => rule.required(),
  });
