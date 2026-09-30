import { tv } from 'tailwind-variants';

export const actionGroupVariants = tv({
  base: ['sm:min-w-32'],
  variants: {
    isOnDark: {
      true: ['border-white/55 text-white', 'hover:border-white'],
    },
    isInline: {
      true: ['sm:min-w-0'],
      false: ['w-full sm:w-auto'],
    },
  },
});

export const actionGroupHiddenLabelVariants = tv({
  base: ['sr-only'],
});
