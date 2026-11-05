import { tv } from '@platform/utils/tv/tv';

export const voiceFieldHeaderVariants = tv({
  slots: {
    root: ['flex flex-wrap items-start justify-between gap-x-3 gap-y-1.5'],
    labelGroup: ['flex min-w-0 flex-col gap-0.5'],
    label: ['text-admin-13 font-semibold text-admin-text'],
    status: ['inline-flex shrink-0 items-center gap-2'],
  },
  variants: {
    isInListRow: {
      true: {
        root: ['flex-nowrap items-center gap-2'],
        labelGroup: ['flex-1'],
        label: ['sr-only'],
      },
    },
  },
});
