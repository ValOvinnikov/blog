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
    fields: ['flex flex-col gap-5'],
    field: ['flex flex-col gap-1.5'],
    fieldLabel: ['text-sm font-medium text-text'],
    fieldError: ['text-xs text-error'],
    actions: ['mt-2 flex items-center justify-end'],
  },
});
