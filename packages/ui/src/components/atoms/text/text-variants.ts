import { TEXT_ROLE } from '@shinefold/config';
import { tv, TYPOGRAPHY } from '@shinefold/ui/lib/styling';

export const textVariants = tv({
  variants: {
    textRole: TYPOGRAPHY,
  },
  defaultVariants: {
    textRole: TEXT_ROLE.BODY,
  },
});
