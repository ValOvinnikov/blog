import { TEXT_ROLE } from '@shinefold/config';
import {
  FOCUS_RING,
  STANDALONE_LINK_HOVER_UNDERLINE,
  TRANSITION_COLORS,
  tv,
  TYPOGRAPHY,
} from '@shinefold/ui/lib/styling';

export const adjacentPageLinkVariants = tv({
  slots: {
    root: [
      'flex min-w-0 items-start gap-2 rounded-sm',
      TYPOGRAPHY[TEXT_ROLE.ITEM_TITLE],
      STANDALONE_LINK_HOVER_UNDERLINE,
      TRANSITION_COLORS,
      FOCUS_RING,
    ],
    direction: ['sr-only'],
    title: ['min-w-0 break-words'],
    arrow: ['mt-[0.25em]'],
  },
  variants: {
    isNext: {
      true: { root: ['col-start-2 justify-self-end text-right'] },
      false: { root: ['justify-self-start'], arrow: ['rotate-180'] },
    },
  },
});
