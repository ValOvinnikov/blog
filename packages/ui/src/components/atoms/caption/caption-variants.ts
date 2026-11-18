import { TEXT_ROLE } from '@shinefold/config';
import { tv, TYPOGRAPHY } from '@shinefold/ui/lib/styling';

export const captionVariants = tv({
  base: ['mt-2 leading-[1.5]', TYPOGRAPHY[TEXT_ROLE.CAPTION], 'text-[11px]'],
});
