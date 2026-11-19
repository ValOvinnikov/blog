import { TEXT_ROLE } from '@shinefold/config';
import { tv, TYPOGRAPHY } from '@shinefold/ui/lib/styling';

export const mediaCardFooterVariants = tv({
  slots: {
    root: [
      'relative z-10 flex items-center gap-2',
      'pointer-events-none [&_a]:pointer-events-auto [&_button]:pointer-events-auto',
      'mt-auto pt-3',
      TYPOGRAPHY[TEXT_ROLE.META],
    ],
    topic: ['inline-flex items-center gap-1 leading-none lowercase'],
  },
});
