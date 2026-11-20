import { TEXT_ROLE } from '@shinefold/config';
import { tv, TYPOGRAPHY } from '@shinefold/ui/lib/styling';

export const postMetaVariants = tv({
  slots: {
    root: [
      'flex flex-wrap items-center gap-2',
      'border-t border-divider py-[14px]',
      TYPOGRAPHY[TEXT_ROLE.META],
    ],
    author: ['flex items-center gap-2'],
    authorName: ['text-text font-medium'],
    actions: ['w-full sm:ms-auto sm:w-auto'],
  },
});
