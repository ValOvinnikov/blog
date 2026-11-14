import { CONTENT_ALIGNMENT } from '@blog/config';
import { tv } from '@blog/ui/lib/styling';

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
