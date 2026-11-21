import { TEXT_ROLE } from '@shinefold/config';
import { tv, TYPOGRAPHY } from '@shinefold/ui/lib/styling';

export const proseVariants = tv({
  base: [TYPOGRAPHY[TEXT_ROLE.BODY], '[&>:where(p+p)]:mt-4'],
});
