import { tv } from 'tailwind-variants';

export const provisioningStatusViewVariants = tv({
  slots: {
    root: ['flex flex-col gap-6'],
    header: ['flex flex-col gap-1'],
    ownerRow: ['flex flex-wrap items-center gap-2'],
    startAction: ['flex'],
    layout: [
      'flex flex-col gap-6',
      'lg:grid lg:min-h-[420px] lg:grid-cols-[230px_minmax(0,1fr)]',
    ],
    steps: [
      'flex h-full flex-col rounded-md border border-border bg-surface p-6',
    ],
    list: ['flex flex-1 flex-col'],
    step: ['flex flex-1 flex-wrap gap-3'],
    indicatorCol: ['flex flex-none flex-col items-center self-stretch'],
    circle: [
      'flex h-6 w-6 flex-none items-center justify-center',
      'rounded-full border text-xs font-bold',
    ],
    connector: ['my-1 w-0.5 flex-1 bg-border'],
    stepBody: ['flex min-w-0 flex-1 flex-col gap-1 pb-4'],
    stepTitle: ['text-sm font-medium text-text'],
    stepStatusLive: ['inline-flex items-center'],
    visuallyHidden: ['sr-only'],
    failedBadge: [
      'inline-flex items-center rounded-sm border border-error bg-error/10',
      'px-2 py-0.5 font-mono text-label font-medium uppercase tracking-label text-error',
    ],
    detailsColumn: ['flex flex-col gap-4'],
    detailsHeader: ['flex items-center justify-end gap-3'],
    overallStatusLive: ['inline-flex items-center'],
    errorCard: [
      'flex flex-col gap-3 rounded-md border border-error bg-error-muted p-4',
    ],
    errorHeadingRow: ['flex items-center gap-2'],
    errorIcon: ['flex-none text-error'],
    errorDetails: ['mt-1'],
    errorDetailsSummary: [
      'cursor-pointer text-sm font-medium text-text',
      'underline-offset-2 hover:underline',
    ],
    errorDetailsText: [
      'mt-2 whitespace-pre-wrap break-words rounded-sm bg-surface-2 p-3',
      'font-mono text-xs text-text-muted',
    ],
    goToTenantButton: ['self-start'],
    dnsCard: ['rounded-md border border-border bg-surface p-6'],
    dnsRow: ['flex flex-wrap items-center gap-3'],
    dnsStatusLive: ['inline-flex items-center'],
  },
  variants: {
    status: {
      IDLE: { circle: ['border-border bg-surface-2 text-text-muted'] },
      RUNNING: { circle: ['border-warn bg-warn-muted text-warn'] },
      DONE: { circle: ['border-success bg-success-muted text-success'] },
      FAILED: { circle: ['border-error bg-error-muted text-error'] },
    },
    isDone: {
      true: { connector: ['bg-success'] },
      false: {},
    },
  },
  defaultVariants: {
    isDone: false,
  },
});
