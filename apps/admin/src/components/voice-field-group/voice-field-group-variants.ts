import { tv } from 'tailwind-variants';

export const voiceFieldGroupVariants = tv({
  slots: {
    root: ['overflow-hidden rounded-md border border-border bg-surface'],
    header: [
      'flex items-baseline justify-between gap-2 border-b border-border px-4 py-2.5',
    ],
    title: ['font-display text-sm font-semibold text-text'],
    count: ['text-meta text-text-subtle'],
    body: ['flex flex-col gap-4 p-4'],
  },
});
