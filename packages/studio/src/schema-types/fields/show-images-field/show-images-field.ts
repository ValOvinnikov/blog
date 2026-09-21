import { defineField } from 'sanity';

export const showImagesField = (options?: {
  title?: string;
  description?: string;
}) =>
  defineField({
    name: 'showImages',
    title: options?.title ?? 'Show Images',
    type: 'boolean',
    description: options?.description ?? "Show each post's image on its card.",
    initialValue: true,
  });
