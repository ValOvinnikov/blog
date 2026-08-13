import { tv } from 'tailwind-variants';

export const topbarVariants = tv({
  slots: {
    root: [
      'sticky top-0 z-10 flex items-center gap-3',
      'border-b border-border bg-primary/85 px-4 py-3 backdrop-blur-sm',
      'md:px-6',
    ],
    crumb: ['text-sm text-text-muted'],
    role: [
      'ml-auto inline-flex items-center gap-1.5 rounded-full border border-border',
      'bg-surface px-2.5 py-1 font-mono text-meta text-text-muted',
    ],
  },
});
