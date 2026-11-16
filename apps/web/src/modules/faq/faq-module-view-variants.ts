import { CONTENT_ALIGNMENT } from '@shinefold/config';
import { tv } from '@shinefold/ui/lib/styling';

export const faqModuleViewVariants = tv({
  slots: {
    wrapper: ['w-full max-w-post text-prose'],
  },
  variants: {
    align: {
      [CONTENT_ALIGNMENT.LEFT]: {},
      [CONTENT_ALIGNMENT.CENTER]: { wrapper: ['mx-auto'] },
    },
  },
  defaultVariants: { align: CONTENT_ALIGNMENT.LEFT },
});
