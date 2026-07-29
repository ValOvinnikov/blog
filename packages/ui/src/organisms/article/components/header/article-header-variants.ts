import { tv } from '@blog/ui/lib/styling';

export const articleHeaderVariants = tv({
  slots: {
    category: ['mb-2'],
    title: ['mt-3 max-w-[18ch]'],
    meta: ['mt-4'],
    lead: ['mt-4 max-w-measure'],
    coverMedia: ['mt-5 max-w-page mx-auto'],
  },
});
