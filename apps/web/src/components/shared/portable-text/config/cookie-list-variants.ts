import { tv } from '@blog/ui/lib/styling';

import { FULL_BLEED_TABLE } from './full-bleed';

export const cookieListVariants = tv({
  slots: {
    stack: ['space-y-4 sm:hidden'],
    entry: ['space-y-2 border-b border-divider pb-4'],
    term: ['font-semibold'],
    table: ['hidden sm:block', ...FULL_BLEED_TABLE],
  },
});
