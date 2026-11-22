import { TEXT_ROLE } from '@shinefold/config';
import { tv, TYPOGRAPHY } from '@shinefold/ui/lib/styling';

export const quoteBlockVariants = tv({
  base: [
    'my-4 py-0.5 pl-4',
    'border-l-2 border-brand-primary',
    TYPOGRAPHY[TEXT_ROLE.QUOTE],
  ],
});
