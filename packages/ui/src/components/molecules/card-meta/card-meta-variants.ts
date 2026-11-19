import { TEXT_ROLE } from '@shinefold/config';
import { tv, TYPOGRAPHY } from '@shinefold/ui/lib/styling';

export const cardMetaVariants = tv({
  slots: {
    root: [
      'mb-1.5 flex flex-wrap items-center gap-y-1',
      TYPOGRAPHY[TEXT_ROLE.META],
    ],
  },
});
