import { tv } from 'tailwind-variants';

export const tenantDetailsPanelVariants = tv({
  slots: {
    root: [
      'flex flex-col gap-4 rounded-md border border-border bg-surface p-6',
    ],
    fields: ['flex flex-col gap-5'],
    field: ['flex flex-col gap-1.5 rounded-md transition-colors duration-base'],
    fieldLabel: ['text-sm font-medium text-text'],
    fieldValue: ['break-words text-sm text-text'],
    fieldError: ['text-xs text-error'],
    actions: ['mt-2 flex items-center justify-end'],
  },
  variants: {
    locked: {
      // Not dimmed (that's what `disabled` does) — a subtle tinted card so a
      // read-only field still reads as distinct from an editable one.
      true: { field: ['bg-surface-2 px-3 py-2'] },
      false: {},
    },
  },
  defaultVariants: {
    locked: false,
  },
});
