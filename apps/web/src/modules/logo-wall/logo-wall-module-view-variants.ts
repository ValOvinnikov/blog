import { CONTENT_ALIGNMENT } from '@blog/config';
import { tv } from 'tailwind-variants';

export const logoWallModuleViewVariants = tv({
  base: ['flex flex-wrap gap-6'],
  variants: {
    align: {
      [CONTENT_ALIGNMENT.LEFT]: ['justify-start'],
      [CONTENT_ALIGNMENT.CENTER]: ['justify-center'],
      [CONTENT_ALIGNMENT.RIGHT]: ['justify-end'],
    },
  },
  defaultVariants: { align: CONTENT_ALIGNMENT.LEFT },
});
