import { SIZE, SPINNER_STYLE } from '@blog/config';
import { tv } from '@blog/ui/lib/styling';
import type { VariantProps } from 'tailwind-variants';

export const spinnerVariants = tv({
  slots: {
    root: ['inline-flex items-center gap-[0.7ch]', 'font-mono'],
    glyph: ['inline-block shrink-0'],
    text: ['text-copy'],
  },
  variants: {
    variant: {
      [SPINNER_STYLE.BRAILLE]: {
        glyph: [
          "before:inline-block before:w-[1ch] before:text-center before:content-['⠋']",
          'before:animate-[spin-dots_0.9s_infinite]',
          "motion-reduce:before:content-['⠿'] motion-reduce:before:animate-none",
        ],
      },
      [SPINNER_STYLE.RING]: {
        glyph: [
          'size-[1em] rounded-full',
          'border-2 border-current border-r-transparent',
          'animate-spin motion-reduce:animate-none',
        ],
      },
      [SPINNER_STYLE.DOTS]: {
        glyph: [
          "before:inline-block before:w-[3ch] before:text-center before:content-['•··']",
          'before:animate-[spin-ellipsis_0.9s_infinite]',
          "motion-reduce:before:content-['•••'] motion-reduce:before:animate-none",
        ],
      },
      [SPINNER_STYLE.PULSE]: {
        glyph: [
          'size-[0.6em] rounded-full bg-current',
          'animate-pulse motion-reduce:animate-none',
        ],
      },
    },
    size: {
      [SIZE.SM]: { root: ['text-xs'] },
      [SIZE.MD]: { root: ['text-sm'] },
      [SIZE.LG]: { root: ['text-base'] },
    },
  },
  defaultVariants: {
    variant: SPINNER_STYLE.BRAILLE,
    size: SIZE.MD,
  },
});

export type TSpinnerVariants = VariantProps<typeof spinnerVariants>;
