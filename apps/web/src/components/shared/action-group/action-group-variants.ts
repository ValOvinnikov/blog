import { tv } from 'tailwind-variants';

export const actionGroupVariants = tv({
  base: ['w-full sm:w-auto sm:min-w-32'],
  variants: {
    isOnDark: {
      true: ['border-white/55 text-white', 'hover:border-white'],
    },
    isInline: {
      true: ['sm:min-w-0'],
    },
  },
});

export const actionGroupHiddenLabelVariants = tv({
  base: ['sr-only'],
});
