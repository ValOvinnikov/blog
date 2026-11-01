import { tv } from '@platform/utils/tv/tv';

export const voiceFieldVariants = tv({
  slots: {
    root: ['flex flex-col gap-2'],
    header: ['flex flex-wrap items-start justify-between gap-x-3 gap-y-1.5'],
    status: ['inline-flex shrink-0 items-center gap-2'],
    labelGroup: ['flex min-w-0 flex-col gap-0.5'],
    label: ['text-admin-13 font-semibold text-admin-text'],
    token: ['font-mono text-admin-11 text-admin-text'],
    error: ['text-admin-11-5 text-admin-bad'],
  },
  variants: {
    hasVisibleLabel: {
      false: { label: 'sr-only' },
    },
  },
});
