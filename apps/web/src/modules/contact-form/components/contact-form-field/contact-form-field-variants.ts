import { TEXT_ROLE } from '@shinefold/config';
import { tv, TYPOGRAPHY } from '@shinefold/ui/lib/styling';

export const contactFormFieldVariants = tv({
  slots: {
    root: ['flex min-w-0 flex-col gap-1.5'],
    label: [TYPOGRAPHY[TEXT_ROLE.CAPTION], 'text-text'],
    error: ['m-0', TYPOGRAPHY[TEXT_ROLE.META], 'text-error'],
  },
});
