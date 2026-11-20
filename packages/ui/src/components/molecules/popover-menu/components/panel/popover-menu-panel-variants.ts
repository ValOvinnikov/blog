import { POPOVER_SURFACE, tv } from '@shinefold/ui/lib/styling';

export const popoverMenuPanelVariants = tv({
  base: [POPOVER_SURFACE],
  variants: {
    shouldOpenFromStartOnPhone: {
      true: ['right-auto left-0 sm:right-0 sm:left-auto'],
    },
  },
});
