import { TEXT_ROLE } from '@shinefold/config';
import { tv, TYPOGRAPHY } from '@shinefold/ui/lib/styling';

export const paginationVariants = tv({
  slots: {
    root: ['mt-8 flex flex-wrap items-center justify-center gap-2'],
    list: ['m-0 flex list-none items-center gap-1 p-0'],
    link: [
      'inline-flex h-9 min-w-9 items-center justify-center rounded-md px-2',
      TYPOGRAPHY[TEXT_ROLE.CAPTION],
      'transition-colors duration-base ease-smooth',
      'hover:text-text',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary',
      'focus-visible:ring-offset-2 focus-visible:ring-offset-ambient',
    ],
    ellipsis: [
      'inline-flex h-9 min-w-9 items-center justify-center',
      TYPOGRAPHY[TEXT_ROLE.CAPTION],
    ],
  },
  variants: {
    current: {
      true: {
        link: ['font-bold text-brand-primary bg-brand-primary-muted'],
      },
    },
  },
});
