import { tv } from 'tailwind-variants';

export const tenantDetailsPanelVariants = tv({
  slots: {
    root: [
      'flex flex-col gap-4 rounded-md border border-border bg-surface p-6',
    ],
    list: ['flex flex-col gap-3'],
    row: ['flex flex-col gap-0.5'],
    label: ['text-xs text-text-subtle'],
    value: ['break-words text-sm text-text'],
  },
});
