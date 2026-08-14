import { tv } from 'tailwind-variants';

export const voiceFieldVariants = tv({
  slots: {
    root: ['flex flex-col gap-1.5'],
    labelRow: ['flex flex-wrap items-baseline justify-between gap-2'],
    label: ['text-sm font-medium text-text'],
    keyBadge: [
      'rounded-sm bg-surface-2 px-1.5 py-0.5 font-mono text-label text-text-subtle',
    ],
    control: ['w-full'],
  },
});
