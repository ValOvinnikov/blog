import { tv } from '@shinefold/ui/lib/styling';

export const codeBlockVariants = tv({
  slots: {
    root: [
      'my-6 overflow-hidden rounded-lg border border-border',
      'bg-surface-2',
      'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-primary',
      'has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-ambient',
    ],
    filename: [
      'border-b border-border px-4 py-2',
      'font-mono text-xs text-text-muted',
    ],
    pre: ['text-code', 'focus-visible:outline-none'],
    highlightedLine: ['bg-(--code-highlight)'],
  },
});
