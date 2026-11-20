import { tv } from '@shinefold/ui/lib/styling';

export const articleHeaderVariants = tv({
  slots: {
    root: ['w-full'],
    headingGroup: ['max-w-[800px] mx-auto'],
    topic: ['mb-2 min-w-0'],
    title: ['mt-3'],
    lead: ['mt-4'],
    leadText: ['max-w-measure'],
    meta: ['mt-4'],
    belowMeta: ['mt-4'],
    coverMedia: ['mt-2 max-w-page mx-auto'],
  },
});
