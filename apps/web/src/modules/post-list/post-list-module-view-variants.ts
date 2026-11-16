import { CONTENT_ALIGNMENT } from '@shinefold/config';
import { tv } from '@shinefold/ui/lib/styling';

export const postListModuleViewVariants = tv({
  slots: {
    leadIn: ['mb-5 empty:hidden'],
    emptyMessage: ['text-base text-muted'],
  },
  variants: {
    align: {
      [CONTENT_ALIGNMENT.LEFT]: { leadIn: ['*:justify-start'] },
      [CONTENT_ALIGNMENT.CENTER]: { leadIn: ['*:justify-center'] },
    },
  },
  defaultVariants: { align: CONTENT_ALIGNMENT.LEFT },
});
