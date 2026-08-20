import { tv } from 'tailwind-variants';

export const deleteTenantControlVariants = tv({
  slots: {
    card: [
      'flex flex-col gap-3 rounded-md border border-error/40 bg-surface p-6',
    ],
    backdrop: [
      'fixed inset-0 bg-primary/70 data-[starting-style]:opacity-0 data-[ending-style]:opacity-0 transition-opacity duration-base ease-console',
    ],
    popup: [
      'fixed top-1/2 left-1/2 w-full max-w-md -translate-x-1/2 -translate-y-1/2',
      'flex flex-col gap-4 rounded-md border border-border bg-surface p-6 shadow-lg',
      'data-[starting-style]:opacity-0 data-[ending-style]:opacity-0 transition-opacity duration-base ease-console',
    ],
    title: ['font-display text-lg font-medium text-text'],
    popupDescription: ['text-sm text-text-muted'],
    field: ['flex flex-col gap-1.5'],
    label: ['text-sm font-medium text-text'],
    hint: ['text-xs text-text-subtle'],
    actions: ['flex justify-end gap-2'],
  },
});
