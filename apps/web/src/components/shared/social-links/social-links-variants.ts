import { tv } from '@shinefold/ui/lib/styling';

export const socialLinksVariants = tv({
  base: ['flex flex-wrap gap-2 list-none'],
});

export const socialLinkVariants = tv({
  base: [
    'in-[.skin-on-image]:text-on-image',
    'in-[.skin-on-image]:hover:bg-on-image/15 in-[.skin-on-image]:hover:text-on-image',
  ],
});
