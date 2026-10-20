import { tv } from '@blog/ui/lib/styling';

export const codeBlockVariants = tv({
  slots: {
    root: [
      'my-6 overflow-hidden rounded-lg border border-border',
      'bg-surface-2',
    ],
    filename: [
      'border-b border-border px-4 py-2',
      'font-mono text-xs text-text-muted',
    ],
    pre: [
      'text-code',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-primary',
    ],
    highlightedLine: ['bg-brand-primary-muted'],
  },
});
