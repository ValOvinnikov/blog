import { tv } from '@blog/ui/lib/styling';

export const mediaFrameVariants = tv({
  base: [
    'relative isolate overflow-hidden',
    'rounded-lg border border-border bg-surface-2',
  ],
  variants: {
    ratio: {
      video: ['aspect-video'],
      square: ['aspect-square'],
      portrait: ['aspect-[3/4]'],
      classic: ['aspect-[4/3]'],
    },
  },
});
