import { tv } from 'tailwind-variants';

export const actionGroupVariants = tv({
  base: ['sm:min-w-32'],
  variants: {
    isOnDark: {
      true: [
        'border-white/55 text-white',
        'hover:border-white hover:text-white',
      ],
    },
    isInline: {
      true: ['sm:min-w-0'],
      false: ['w-full sm:w-auto'],
    },
  },
  compoundVariants: [
    {
      isOnDark: true,
      isInline: false,
      class: ['hover:bg-white/15'],
    },
  ],
});

export const actionGroupHiddenLabelVariants = tv({
  base: ['sr-only'],
});
