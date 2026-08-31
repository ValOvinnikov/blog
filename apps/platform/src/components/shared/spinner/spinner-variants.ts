import { SIZE } from '@blog/config';
import { tv } from '@platform/utils/tv/tv';
import type { VariantProps } from 'tailwind-variants';

export const spinnerVariants = tv({
  slots: {
    root: ['inline-flex items-center gap-2', 'text-admin-muted'],
    glyph: [
      'inline-block shrink-0 rounded-full',
      'border-2 border-current border-t-transparent',
      'animate-spin motion-reduce:animate-none',
    ],
    text: ['text-sm'],
  },
  variants: {
    size: {
      [SIZE.SM]: { glyph: ['size-3.5'] },
      [SIZE.MD]: { glyph: ['size-4.5'] },
      [SIZE.LG]: { glyph: ['size-6'] },
    },
  },
  defaultVariants: {
    size: SIZE.MD,
  },
});

export type TSpinnerVariants = VariantProps<typeof spinnerVariants>;
