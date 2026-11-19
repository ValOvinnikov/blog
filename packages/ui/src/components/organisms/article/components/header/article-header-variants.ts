import { tv } from '@shinefold/ui/lib/styling';

export const articleHeaderVariants = tv({
  slots: {
    root: ['w-full'],
    headingGroup: ['max-w-[800px] mx-auto'],
    topicRow: ['mb-2 flex flex-wrap items-center gap-x-4 gap-y-2'],
    topic: ['mb-2 min-w-0'],
    action: ['ms-auto'],
    title: ['mt-3'],
    lead: ['mt-4 max-w-measure'],
    meta: ['mt-4'],
    coverMedia: ['mt-2 max-w-page mx-auto'],
  },
  variants: {
    hasAction: {
      true: { topic: ['mb-0'] },
    },
  },
});
