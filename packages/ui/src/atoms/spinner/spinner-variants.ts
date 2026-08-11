import { Size } from '@blog/config';
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
      [Size.SM]: { root: ['text-xs'] },
      [Size.MD]: { root: ['text-sm'] },
      [Size.LG]: { root: ['text-base'] },
    },
  },
  defaultVariants: {
    size: Size.MD,
  },
});

export type TSpinnerVariants = VariantProps<typeof spinnerVariants>;
