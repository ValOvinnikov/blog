import { CONTENT_ALIGNMENT } from '@shinefold/config';
import { tv } from '@shinefold/ui/lib/styling';

export const embedModuleViewVariants = tv({
  variants: {
    isNarrow: { true: ['max-w-measure text-prose'] },
    align: {
      [CONTENT_ALIGNMENT.LEFT]: [],
      [CONTENT_ALIGNMENT.CENTER]: ['mx-auto text-center'],
    },
  },
  defaultVariants: { align: CONTENT_ALIGNMENT.LEFT },
});
