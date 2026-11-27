import { TEXT_ROLE } from '@shinefold/config';
import { POPOVER_SURFACE, tv, TYPOGRAPHY } from '@shinefold/ui/lib/styling';

export const signInPanelVariants = tv({
  slots: {
    root: [POPOVER_SURFACE, 'gap-2'],
    title: [TYPOGRAPHY[TEXT_ROLE.CARD_TITLE]],
    providers: ['mt-1 flex flex-col gap-2'],
    or: [
      'my-1.5 flex items-center gap-2.5',
      TYPOGRAPHY[TEXT_ROLE.META],
      'before:h-px before:flex-1 before:bg-border',
      'after:h-px after:flex-1 after:bg-border',
    ],
    hint: ['mt-1', TYPOGRAPHY[TEXT_ROLE.META]],
  },
});
