import { tv } from '@platform/utils/tv/tv';

export const deprovisioningStatusViewVariants = tv({
  slots: {
    root: ['mt-6 flex flex-col gap-6'],
    cardBody: ['flex flex-1 flex-col'],
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
