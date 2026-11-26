import { TEXT_ROLE } from '@shinefold/config';
import { tv, TYPOGRAPHY } from '@shinefold/ui/lib/styling';

export const brandLockupVariants = tv({
  slots: {
    root: ['inline-flex flex-col items-start gap-1'],
    lightMark: ['dark:hidden'],
    darkMark: ['hidden dark:inline-block'],
    tagline: ['hidden md:block', TYPOGRAPHY[TEXT_ROLE.CAPTION]],
  },
});
