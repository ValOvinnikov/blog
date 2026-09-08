import { tv } from '@blog/ui/lib/styling';
import type { VariantProps } from 'tailwind-variants';

/**
 * `isLead`'s 4:3 ratio must always match `mediaFrameVariants`'s `classic`
 * ratio, not a value invented locally.
 */
export const postCardMediaVariants = tv({
  base: ['relative w-full overflow-hidden', 'bg-surface-2'],
  variants: {
    isLead: {
      true: ['aspect-[4/3]'],
      false: ['aspect-video'],
    },
  },
  defaultVariants: { isLead: false },
});

export type TPostCardMediaVariants = VariantProps<typeof postCardMediaVariants>;
