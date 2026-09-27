import { tv } from '@blog/ui/lib/styling';

export const consentCategoryRowVariants = tv({
  slots: {
    root: [
      'flex items-start justify-between gap-4',
      'border-t border-border py-3 first:border-t-0',
    ],
    content: ['min-w-0 flex-1'],
    label: ['block font-mono text-copy font-medium text-text'],
    description: ['mt-1 text-card-copy text-subtle'],
  },
});
