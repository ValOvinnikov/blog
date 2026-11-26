import { TEXT_ROLE } from '@shinefold/config';
import {
  FOCUS_RING,
  TRANSITION_COLORS,
  tv,
  TYPOGRAPHY,
} from '@shinefold/ui/lib/styling';

export const adjacentPageLinkVariants = tv({
  slots: {
    root: [
      'flex min-w-0 flex-col gap-1',
      'rounded-md border border-border px-card-x py-card-y no-underline',
      'hover:border-brand-primary',
      TRANSITION_COLORS,
      FOCUS_RING,
    ],
    direction: [TYPOGRAPHY[TEXT_ROLE.LABEL], 'text-subtle'],
    title: [TYPOGRAPHY[TEXT_ROLE.CARD_TITLE], 'break-words'],
  },
  variants: {
    isNext: {
      true: { root: ['items-end text-right', 'md:col-start-2'] },
      false: {},
    },
  },
});
