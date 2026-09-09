import { tv } from 'tailwind-variants';

export const postFeaturedModuleViewVariants = tv({
  slots: {
    leadGroup: ['flex flex-col', 'gap-3.5 md:gap-5 lg:gap-7'],
    grid: ['gap-3.5 md:gap-5 lg:gap-7'],
  },
});
