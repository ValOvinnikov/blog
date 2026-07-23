import { tv } from '@blog/ui/lib/styling';

export const articleHeaderVariants = tv({
  slots: {
    root: ['pt-6'],
    categories: ['flex flex-wrap items-center'],
    title: ['mt-3 max-w-[18ch]'],
    lead: ['mt-4 max-w-measure'],
    coverMedia: ['mt-5'],
  },
});
