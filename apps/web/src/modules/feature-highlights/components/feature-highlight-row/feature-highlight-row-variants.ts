import { tv } from 'tailwind-variants';

export const featureHighlightRowVariants = tv({
  slots: {
    root: [
      'grid grid-cols-1 gap-8',
      'lg:grid-cols-2 lg:items-center lg:gap-12',
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
        media: ['lg:order-2'],
        text: ['lg:order-1'],
      },
    },
  },
});
