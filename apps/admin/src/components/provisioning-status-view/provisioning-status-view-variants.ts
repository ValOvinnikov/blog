import { tv } from 'tailwind-variants';

export const provisioningStatusViewVariants = tv({
  slots: {
    root: ['flex flex-col gap-6'],
    header: ['flex flex-col gap-1'],
    description: ['text-sm text-text-muted'],
    startAction: ['flex'],
    card: ['rounded-md border border-border bg-surface p-6'],
    list: ['flex flex-col gap-4'],
    step: [
      'flex flex-wrap items-center gap-3',
      'border-b border-border pb-4 last:border-b-0 last:pb-0',
    ],
    stepBody: ['flex min-w-0 flex-1 flex-col gap-1'],
    stepTitle: ['text-sm font-medium text-text'],
    stepError: ['text-xs text-error'],
    failedBadge: [
      'inline-flex items-center rounded-sm border border-error bg-error/10',
      'px-2 py-0.5 font-mono text-label font-medium uppercase tracking-label text-error',
    ],
    dnsCard: ['rounded-md border border-border bg-surface p-6'],
    dnsRow: ['flex flex-wrap items-center gap-3'],
  },
});
