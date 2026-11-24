import { TEXT_ROLE } from '@shinefold/config';
import { BLOCK_RHYTHM, tv, TYPOGRAPHY } from '@shinefold/ui/lib/styling';

export const proseVariants = tv({
  base: [TYPOGRAPHY[TEXT_ROLE.BODY], BLOCK_RHYTHM],
});
