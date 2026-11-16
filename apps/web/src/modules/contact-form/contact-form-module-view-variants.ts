import { CONTENT_ALIGNMENT } from '@shinefold/config';
import { tv } from '@shinefold/ui/lib/styling';

export const contactFormModuleViewVariants = tv({
  slots: {
    column: ['w-full max-w-[35rem]'],
  },
  variants: {
    align: {
      [CONTENT_ALIGNMENT.LEFT]: {},
      [CONTENT_ALIGNMENT.CENTER]: { column: ['mx-auto'] },
    },
  },
  defaultVariants: { align: CONTENT_ALIGNMENT.LEFT },
});
