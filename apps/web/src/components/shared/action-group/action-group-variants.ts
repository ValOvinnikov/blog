import { tv } from '@shinefold/ui/lib/styling';

export const actionGroupVariants = tv({
  base: ['sm:min-w-32'],
  variants: {
    variant: {
      primary: [],
      ghost: [
        'in-[.skin-on-image]:border-on-image/55',
        'in-[.skin-on-image]:hover:border-on-image in-[.skin-on-image]:hover:bg-on-image/15 in-[.skin-on-image]:hover:text-on-image',
      ],
      link: [
        'sm:min-w-0 border-x-0',
        'in-[.skin-on-image]:hover:text-on-image',
      ],
    },
  },
  compoundVariants: [
    { variant: ['primary', 'ghost'], class: ['w-full sm:w-auto'] },
  ],
});

export const actionGroupHiddenLabelVariants = tv({
  base: ['sr-only'],
});
