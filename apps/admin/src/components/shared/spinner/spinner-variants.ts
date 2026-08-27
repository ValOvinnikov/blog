import { tv } from '@admin/utils/tv/tv';
import { Size } from '@blog/config';
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
      [Size.SM]: { glyph: ['size-3.5'] },
      [Size.MD]: { glyph: ['size-4.5'] },
      [Size.LG]: { glyph: ['size-6'] },
    },
  },
  defaultVariants: {
    size: Size.MD,
  },
});

export type TSpinnerVariants = VariantProps<typeof spinnerVariants>;
