import { tv } from 'tailwind-variants';

export const tenantDetailsPanelVariants = tv({
  slots: {
    root: [
      'flex flex-col gap-4 rounded-md border border-border bg-surface p-6',
    ],
    fields: [
      'flex flex-col gap-5',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary',
    ],
    field: ['flex flex-col gap-1.5'],
    fieldLabel: ['text-sm font-medium text-text'],
    fieldError: ['text-xs text-error'],
    lockedValue: ['break-words font-mono text-copy text-text'],
    actions: ['mt-2 flex items-center justify-end'],
    lockAnnouncementLive: ['sr-only'],
    planControl: ['self-start'],
  },
});
