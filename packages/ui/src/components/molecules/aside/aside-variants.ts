import { tv } from '@blog/ui/lib/styling';

export const asideVariants = tv({
  slots: {
    root: [
      'my-6 p-4',
      'border-l-2 border-brand-primary-muted',
      'bg-surface-2 surface-nested',
    ],
    label: ['mb-2'],
    body: ['font-read text-prose text-muted'],
  },
});
