import { tv } from '@blog/ui/lib/styling';

export const featureHighlightRowVariants = tv({
  slots: {
    root: [
      'grid grid-cols-1 gap-8',
      'lg:grid-cols-2 lg:items-center lg:gap-12',
    ],
    media: [],
    frame: ['w-full max-h-[min(20rem,40svh)] lg:max-h-none', 'lg:aspect-[4/3]'],
    image: ['size-full object-cover'],
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
