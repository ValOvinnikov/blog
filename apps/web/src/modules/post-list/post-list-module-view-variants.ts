import { tv } from 'tailwind-variants';

export const postListModuleViewVariants = tv({
  slots: {
    grid: ['gap-3.5 md:gap-5 lg:gap-7'],
    emptyMessage: ['text-copy text-muted'],
  },
});
