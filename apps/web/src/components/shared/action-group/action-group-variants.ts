import { tv } from 'tailwind-variants';

export const actionGroupVariants = tv({
  base: ['sm:min-w-32'],
  variants: {
    isOnDark: {
      true: ['text-on-image'],
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
        'border-on-image/55 hover:border-on-image hover:bg-on-image/15 hover:text-on-image',
      ],
    },
    {
      isOnDark: true,
      isInline: true,
      class: ['hover:text-on-image'],
    },
  ],
});

export const actionGroupHiddenLabelVariants = tv({
  base: ['sr-only'],
});
