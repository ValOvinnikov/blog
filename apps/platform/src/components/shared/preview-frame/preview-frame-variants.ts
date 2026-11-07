import { tv } from '@platform/utils/tv/tv';

export const previewFrameVariants = tv({
  slots: {
    root: ['@container flex min-w-0 flex-col gap-3'],
    toolbar: ['flex flex-wrap items-center gap-2'],
    actions: ['ml-auto flex flex-wrap items-center gap-2'],
    stage: ['rounded-admin bg-admin-preview-stage p-4 sm:p-6'],
    frame: ['@container mx-auto w-full transition-[max-width]'],
    notes: ['flex flex-col gap-1 text-admin-12 text-admin-muted'],
    title: [],
    headingRow: ['flex justify-between gap-3'],
    headingActions: ['ml-auto flex flex-none items-center gap-1.5'],
    readout: [
      'font-admin-mono text-admin-12 whitespace-nowrap text-admin-muted',
    ],
    sharedStage: ['relative rounded-admin bg-admin-theme-track'],
    status: [
      'flex items-start gap-x-2.5',
      // Held with or without a trailing button, so the row never resizes when one appears.
      'min-h-admin-status-row-phone lg:min-h-admin-status-row lg:pointer-coarse:min-h-admin-status-row-touch',
      'text-admin-12-5 leading-[18px] text-admin-muted',
    ],
    statusIcon: ['mt-px flex-none'],
    statusText: [
      'min-w-0 flex-[1_1_300px] [&_strong]:font-semibold [&_strong]:text-admin-text',
    ],
    statusAction: ['-mt-[7px] flex-none'],
  },
  variants: {
    isNarrow: {
      true: { frame: ['max-w-[390px]'] },
      false: { frame: ['max-w-full'] },
    },
    isCompact: {
      true: { sharedStage: ['p-2.5'] },
      false: { sharedStage: ['p-4'] },
    },
    isTitleHidden: {
      true: { title: ['sr-only'] },
      false: {},
    },
    hasHeadingActions: {
      true: { headingRow: ['items-center gap-2'] },
      false: { headingRow: ['items-baseline'] },
    },
    isAccent: {
      true: { statusIcon: ['text-admin-brand-strong'] },
      false: {},
    },
  },
});
