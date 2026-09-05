import { tv } from '@platform/utils/tv/tv';

export const provisioningStatusViewVariants = tv({
  slots: {
    root: ['flex flex-col gap-6'],
    ownerRow: ['flex flex-wrap items-center gap-2'],
    startAction: ['flex'],
    layout: [
      'flex flex-col gap-6',
      'lg:grid lg:min-h-[420px] lg:grid-cols-[230px_minmax(0,1fr)]',
    ],
    steps: ['flex h-full flex-col'],
    stepsCard: ['flex flex-1 flex-col'],
    stepsCardBody: ['flex flex-1 flex-col'],
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
  },
});
