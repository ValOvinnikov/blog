import { tv } from '@blog/ui/lib/styling';

// lg:aspect-[4/3] must stay literal (Tailwind's static scanner needs the
// full class name) and must match mediaFrameVariants's `classic` ratio; it
// only widens the default `video` ratio, per the home hero's design spec.
export const heroMediaVariants = tv({
  base: ['w-full', 'min-h-[170px]'],
  variants: {
    ratio: {
      video: ['lg:aspect-[4/3]'],
      square: [],
      portrait: [],
      classic: [],
    },
  },
});
