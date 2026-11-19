import { tv } from '@shinefold/ui/lib/styling';

export const specimenVariants = tv({
  slots: {
    list: ['divide-y divide-border'],
    row: ['py-5 first:pt-0'],
    label: ['mb-2 font-mono text-label text-text-subtle uppercase'],
  },
});
