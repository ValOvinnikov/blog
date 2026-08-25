import { tv } from 'tailwind-variants';

export const voiceFieldGroupVariants = tv({
  slots: {
    root: ['rounded-lg border border-border bg-surface shadow-sm'],
    header: ['flex flex-wrap items-baseline gap-2 border-b border-border p-4'],
    headerDescription: ['text-sm text-text-subtle'],
    body: ['flex flex-col gap-5 p-4'],
    fieldKey: [
      'rounded-sm bg-surface-2 px-1.5 py-0.5 font-mono text-label text-text-subtle',
    ],
  },
});
