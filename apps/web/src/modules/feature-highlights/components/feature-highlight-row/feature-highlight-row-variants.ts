import { tv } from 'tailwind-variants';

export const featureHighlightRowVariants = tv({
  slots: {
    root: [
      'grid grid-cols-1 gap-8',
      'md:grid-cols-2 md:items-center md:gap-12',
    ],
    media: [],
    text: ['flex flex-col items-start gap-4 text-left'],
    heading: [],
    body: [],
    actions: ['flex flex-wrap gap-3'],
  },
  variants: {
    mediaSide: {
      start: {},
      end: {
        media: ['md:order-2'],
        text: ['md:order-1'],
      },
    },
    hasImage: {
      true: {},
      false: {
        text: ['md:col-span-2'],
      },
    },
  },
});
