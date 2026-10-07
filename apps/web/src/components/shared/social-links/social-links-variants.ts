import { tv } from 'tailwind-variants';

export const socialLinksVariants = tv({
  base: ['flex flex-wrap gap-2 list-none'],
});

export const socialLinkOnDarkVariants = tv({
  variants: {
    isOnDark: {
      true: ['text-on-image hover:bg-on-image/15 hover:text-on-image'],
    },
  },
});
