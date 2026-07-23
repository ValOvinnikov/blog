import { tv } from 'tailwind-variants';

export const authorPageVariants = tv({
  slots: {
    introHeader: ['flex flex-col gap-3'],
    socialLinks: ['max-w-measure'],
  },
});
