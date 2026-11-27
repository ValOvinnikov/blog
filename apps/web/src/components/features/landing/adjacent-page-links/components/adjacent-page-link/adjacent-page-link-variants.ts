import { TEXT_ROLE } from '@shinefold/config';
import {
  FOCUS_RING,
  STANDALONE_LINK_HOVER_UNDERLINE,
  tv,
  TYPOGRAPHY,
} from '@shinefold/ui/lib/styling';

export const adjacentPageLinkVariants = tv({
  slots: {
    root: [
      'flex min-w-0 items-start gap-2 rounded-sm',
      TYPOGRAPHY[TEXT_ROLE.ITEM_TITLE],
      'text-prose',
      STANDALONE_LINK_HOVER_UNDERLINE,
      FOCUS_RING,
    ],
    direction: ['sr-only'],
    title: ['min-w-0 break-words'],
    // Centres the 1rem arrow on the title's first line at text-prose's 1.7 leading.
    arrow: ['mt-[0.35em]'],
  },
  variants: {
    isNext: {
      true: { root: ['col-start-2 justify-self-end text-right'] },
      false: { root: ['justify-self-start'], arrow: ['rotate-180'] },
    },
  },
});
