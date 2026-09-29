import { CONTENT_ALIGNMENT } from '@blog/config';
import { tv } from 'tailwind-variants';

export const logoWallModuleViewVariants = tv({
  base: ['flex flex-wrap gap-6'],
  variants: {
    align: {
      [CONTENT_ALIGNMENT.LEFT]: ['justify-start'],
      [CONTENT_ALIGNMENT.CENTER]: ['justify-center'],
    },
  },
  defaultVariants: { align: CONTENT_ALIGNMENT.LEFT },
});
