import { SIZE } from '@blog/config';
import { tv } from '@blog/ui/lib/styling';
import type { VariantProps } from 'tailwind-variants';

export const spinnerVariants = tv({
  slots: {
    root: [
      'inline-flex items-center gap-[0.7ch]',
      'font-mono',
      'text-brand-primary',
    ],
    glyph: [
      'inline-block',
      "before:inline-block before:w-[1ch] before:text-center before:content-['⠋']",
      'before:animate-[spin-dots_0.9s_infinite]',
      "motion-reduce:before:content-['⠿'] motion-reduce:before:animate-none",
    ],
    text: ['text-copy'],
  },
  variants: {
    size: {
      [SIZE.SM]: { root: ['text-xs'] },
      [SIZE.MD]: { root: ['text-sm'] },
      [SIZE.LG]: { root: ['text-base'] },
    },
  },
  defaultVariants: {
    size: SIZE.MD,
  },
});

export type TSpinnerVariants = VariantProps<typeof spinnerVariants>;
