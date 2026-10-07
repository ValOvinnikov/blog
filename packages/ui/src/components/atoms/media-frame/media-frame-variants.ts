import { tv } from '@blog/ui/lib/styling';
import type { VariantProps } from 'tailwind-variants';

export const mediaFrameVariants = tv({
  base: [
    'relative isolate overflow-hidden',
    'border border-border bg-surface-2 surface-nested',
  ],
  variants: {
    ratio: {
      video: ['aspect-video'],
      square: ['aspect-square'],
      portrait: ['aspect-[3/4]'],
      classic: ['aspect-[4/3]'],
    },
    shape: {
      rect: ['rounded-media'],
      circle: ['rounded-full'],
    },
  },
  defaultVariants: {
    shape: 'rect',
  },
});

export type TMediaFrameVariants = VariantProps<typeof mediaFrameVariants>;
export type TMediaFrameRatio = NonNullable<TMediaFrameVariants['ratio']>;
