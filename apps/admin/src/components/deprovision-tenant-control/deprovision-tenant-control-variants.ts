import { tv } from 'tailwind-variants';

export const deprovisionTenantControlVariants = tv({
  slots: {
    card: [
      'flex flex-col gap-3 rounded-md border border-error/40 bg-surface p-6',
    ],
    archivedRow: ['flex flex-wrap items-center gap-3'],
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
    switchRow: ['flex items-center gap-2.5 text-sm text-text'],
    switchTrack: [
      'relative h-5 w-9 shrink-0 cursor-pointer rounded-full bg-secondary',
      'transition-colors duration-base ease-console',
      'data-[checked]:bg-brand-primary-solid',
      'outline-hidden focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-primary',
    ],
    switchThumb: [
      'absolute left-0.5 top-0.5 size-4 rounded-full bg-surface shadow',
      'transition-transform duration-base ease-console',
      'data-[checked]:translate-x-4',
    ],
    actions: ['flex justify-end gap-2'],
  },
});
