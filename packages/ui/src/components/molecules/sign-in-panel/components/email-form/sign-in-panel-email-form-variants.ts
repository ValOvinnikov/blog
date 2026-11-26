import { TEXT_ROLE } from '@shinefold/config';
import { tv, TYPOGRAPHY } from '@shinefold/ui/lib/styling';

export const signInPanelEmailFormVariants = tv({
  slots: {
    root: ['flex flex-col gap-2'],
    label: [TYPOGRAPHY[TEXT_ROLE.META], 'font-medium text-text'],
    submit: ['w-full'],
  },
});
