import { tv } from '@blog/ui/lib/styling';

export const cardMetaVariants = tv({
  slots: {
    root: [
      'mb-1.5 flex flex-wrap items-center gap-y-1',
      'font-mono text-label text-subtle',
    ],
    category: 'text-accent',
  },
});
