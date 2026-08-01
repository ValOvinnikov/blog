import { tv } from '@blog/ui/lib/styling';

export const asideVariants = tv({
  slots: {
    root: [
      'my-6 rounded-sm p-4',
      'border-l-2 border-accent-muted',
      'bg-surface-2',
    ],
    label: ['mb-2'],
    body: ['font-read text-prose text-muted'],
  },
});
