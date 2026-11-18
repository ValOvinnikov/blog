import { tv } from '@shinefold/ui/lib/styling';

export const actionGroupVariants = tv({
  base: ['sm:min-w-32'],
  variants: {
    isInline: {
      true: ['sm:min-w-0 border-x-0'],
      false: ['w-full sm:w-auto'],
    },
  },
});

export const actionGroupHiddenLabelVariants = tv({
  base: ['sr-only'],
});
