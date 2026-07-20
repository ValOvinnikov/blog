import { tv } from 'tailwind-variants';

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
    pre: ['text-code'],
    highlightedLine: ['bg-accent-muted'],
  },
});
