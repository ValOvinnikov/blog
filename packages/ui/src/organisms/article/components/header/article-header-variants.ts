import { tv } from '@blog/ui/lib/styling';

export const articleHeaderVariants = tv({
  slots: {
    headingGroup: ['max-w-[800px] mx-auto'],
    category: ['mb-2'],
    title: ['mt-3 max-w-[18ch]'],
    lead: ['mt-4 max-w-measure'],
    meta: ['mt-4'],
    coverMedia: ['mt-5 max-w-page mx-auto'],
  },
});
