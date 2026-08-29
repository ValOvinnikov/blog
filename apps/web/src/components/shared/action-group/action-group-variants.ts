import { tv } from 'tailwind-variants';

export const actionGroupVariants = tv({
  base: [],
  variants: {
    isOnDark: {
      true: ['border-white/55 text-white', 'hover:border-white'],
    },
  },
});
