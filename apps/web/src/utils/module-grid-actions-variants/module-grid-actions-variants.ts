import { CONTENT_ALIGNMENT } from '@shinefold/config';
import { tv } from '@shinefold/ui/lib/styling';

export const moduleGridActionsVariants = tv({
  slots: {
    actions: ['flex flex-wrap gap-3 mt-7'],
  },
  variants: {
    align: {
      [CONTENT_ALIGNMENT.LEFT]: { actions: ['justify-start'] },
      [CONTENT_ALIGNMENT.CENTER]: { actions: ['justify-center'] },
      [CONTENT_ALIGNMENT.RIGHT]: { actions: ['justify-end'] },
    },
  },
  defaultVariants: { align: CONTENT_ALIGNMENT.LEFT },
});
