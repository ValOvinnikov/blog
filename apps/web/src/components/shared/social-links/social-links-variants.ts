import { tv } from 'tailwind-variants';

export const socialLinksVariants = tv({
  base: ['flex flex-wrap gap-2 list-none'],
});

export const socialLinkOnDarkVariants = tv({
  variants: {
    isOnDark: {
      true: ['text-white hover:bg-white/15 hover:text-white'],
    },
  },
});
