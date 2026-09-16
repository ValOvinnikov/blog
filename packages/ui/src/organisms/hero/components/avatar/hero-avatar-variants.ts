import { CONTENT_ALIGNMENT } from '@blog/config';
import { tv } from '@blog/ui/lib/styling';
import type { VariantProps } from 'tailwind-variants';

export const heroAvatarVariants = tv({
  base: [
    'rounded-full overflow-hidden',
    'size-24 sm:size-32',
    'mb-4',
    '[&>*]:size-full [&>*]:object-cover',
  ],
  variants: {
    alignment: {
      [CONTENT_ALIGNMENT.LEFT]: ['self-start'],
      [CONTENT_ALIGNMENT.CENTER]: ['self-center'],
      [CONTENT_ALIGNMENT.RIGHT]: ['self-end'],
    },
  },
});

export type THeroAvatarVariants = VariantProps<typeof heroAvatarVariants>;
