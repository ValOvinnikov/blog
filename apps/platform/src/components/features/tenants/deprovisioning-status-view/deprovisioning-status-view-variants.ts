import { tv } from '@platform/utils/tv/tv';

export const deprovisioningStatusViewVariants = tv({
  slots: {
    root: ['flex flex-col gap-6'],
    cardsRow: ['flex flex-col gap-6', 'lg:grid lg:grid-cols-2 lg:items-start'],
    stepsCard: ['bg-admin-surface'],
    stepsSummary: ['flex items-center gap-2.5'],
    overallStatusLive: ['inline-flex items-center'],
    errorCard: [
      'flex flex-col gap-3 rounded-admin border p-[18px] shadow-admin',
      'border-admin-bad/30 bg-admin-bad-weak',
    ],
    errorHeadingRow: ['flex items-center gap-2'],
    errorHeadline: ['text-admin-bad'],
    errorIcon: ['flex-none text-admin-bad'],
    errorDetails: ['mt-1'],
    errorDetailsText: [
      'mt-2 rounded-admin-control bg-admin-surface-2 p-3',
      'font-mono text-xs text-admin-muted whitespace-pre-wrap break-words',
    ],
  },
});
