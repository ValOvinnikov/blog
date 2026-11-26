import { TEXT_ROLE } from '@shinefold/config';
import { tv, TYPOGRAPHY } from '@shinefold/ui/lib/styling';

export const specimenVariants = tv({
  slots: {
    list: ['divide-y divide-border'],
    row: ['py-5 first:pt-0'],
    label: ['mb-2', TYPOGRAPHY[TEXT_ROLE.CAPTION], 'uppercase'],
  },
});
