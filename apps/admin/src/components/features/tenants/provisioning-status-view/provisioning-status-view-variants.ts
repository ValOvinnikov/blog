import { tv } from '@admin/utils/tv/tv';

export const provisioningStatusViewVariants = tv({
  slots: {
    root: ['flex flex-col gap-6'],
    header: ['flex flex-col gap-1'],
    eyebrow: [
      'text-[11px] font-bold tracking-[0.06em] text-admin-faint uppercase',
    ],
    ownerRow: ['flex flex-wrap items-center gap-2'],
    startAction: ['flex'],
    layout: [
      'flex flex-col gap-6',
      'lg:grid lg:min-h-[420px] lg:grid-cols-[230px_minmax(0,1fr)]',
    ],
    steps: ['flex h-full flex-col'],
    stepsCard: ['flex flex-1 flex-col'],
    stepsCardBody: ['flex flex-1 flex-col'],
    list: ['flex flex-1 flex-col'],
    step: ['flex flex-1 flex-wrap gap-3'],
    indicatorCol: ['flex flex-none flex-col items-center self-stretch'],
    circle: [
      'flex h-6 w-6 flex-none items-center justify-center',
      'rounded-full text-xs font-bold',
    ],
    connector: ['my-1 w-0.5 flex-1 bg-admin-line-2'],
    stepBody: ['flex min-w-0 flex-1 flex-col gap-1 pb-4'],
    stepTitle: ['text-[13.5px] font-semibold text-admin-text'],
    stepStatusLive: ['inline-flex items-center'],
    visuallyHidden: ['sr-only'],
    detailsColumn: ['flex flex-col gap-4'],
    detailsHeader: ['flex items-center justify-end gap-3'],
    overallStatusLive: ['inline-flex items-center'],
    errorCard: [
      'flex flex-col gap-3 rounded-admin border p-[18px] shadow-admin',
      'border-admin-bad/30 bg-admin-bad-weak',
    ],
    errorHeadingRow: ['flex items-center gap-2'],
    errorHeadline: ['text-admin-bad'],
    errorIcon: ['flex-none text-admin-bad'],
    errorDetails: ['mt-1'],
    errorDetailsSummary: [
      'cursor-pointer text-[13px] font-medium text-admin-text',
      'underline-offset-2 hover:underline',
    ],
    errorDetailsText: [
      'mt-2 rounded-admin-sm bg-admin-surface-2 p-3',
      'font-mono text-xs text-admin-muted whitespace-pre-wrap break-words',
    ],
    goToTenantButton: ['self-start'],
  },
  variants: {
    status: {
      IDLE: { circle: ['bg-admin-line-2 text-admin-muted'] },
      RUNNING: { circle: ['bg-admin-warn text-white'] },
      DONE: { circle: ['bg-admin-ok text-white'] },
      FAILED: { circle: ['bg-admin-bad text-white'] },
    },
    isDone: {
      true: { connector: ['bg-admin-ok'] },
      false: {},
    },
  },
  defaultVariants: {
    isDone: false,
  },
});
