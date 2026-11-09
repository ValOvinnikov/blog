import { tv } from '@blog/ui/lib/styling';

export const cookieListVariants = tv({
  slots: {
    stack: ['space-y-4 sm:hidden'],
    entry: ['space-y-2 border-b border-divider pb-4'],
    term: ['font-semibold'],
    table: ['hidden sm:block'],
  },
});
