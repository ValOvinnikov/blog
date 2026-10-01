import { tv } from 'tailwind-variants';

export const actionGroupVariants = tv({
  base: ['sm:min-w-32'],
  variants: {
    isOnDark: {
      true: ['text-white'],
    },
    isInline: {
      true: ['sm:min-w-0'],
      false: ['w-full sm:w-auto'],
    },
  },
  compoundVariants: [
    {
      isOnDark: false,
      isInline: true,
      class: ['border-x-0'],
    },
    {
      isOnDark: true,
      isInline: false,
      class: [
        'border-white/55 hover:border-white hover:bg-white/15 hover:text-white',
      ],
    },
    {
      isOnDark: true,
      isInline: true,
      class: ['hover:text-white/80'],
    },
  ],
});

export const actionGroupHiddenLabelVariants = tv({
  base: ['sr-only'],
});
