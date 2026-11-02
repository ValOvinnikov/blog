import { tv } from '@platform/utils/tv/tv';

export const previewFrameVariants = tv({
  slots: {
    root: ['@container flex min-w-0 flex-col gap-3'],
    toolbar: ['flex flex-wrap items-center gap-2'],
    actions: ['ml-auto flex flex-wrap items-center gap-2'],
    stage: ['rounded-admin bg-admin-line-2 p-4 sm:p-6'],
    frame: ['@container mx-auto w-full transition-[max-width]'],
    notes: ['flex flex-col gap-1 text-admin-12 text-admin-muted'],
    title: [],
    headingRow: ['flex items-baseline justify-between gap-3'],
    readout: [
      'font-admin-mono text-admin-12 whitespace-nowrap text-admin-muted',
    ],
    sharedStage: ['relative rounded-admin bg-admin-theme-track'],
    status: [
      'flex flex-wrap items-start gap-x-2.5 gap-y-2',
      'text-admin-12-5 leading-[18px] text-admin-muted',
    ],
    statusIcon: ['mt-px flex-none'],
    statusText: [
      'min-w-0 flex-[1_1_300px] [&_strong]:font-semibold [&_strong]:text-admin-text',
    ],
    statusAction: ['-mt-[7px]'],
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
    isAccent: {
      true: { statusIcon: ['text-admin-brand-strong'] },
      false: {},
    },
  },
});
