import { tv } from '@platform/utils/tv/tv';

export const lookFieldVariants = tv({
  slots: {
    field: ['flex min-w-0 flex-col gap-1.5'],
    labelRow: ['flex flex-wrap items-center gap-2'],
    label: [
      'flex items-center gap-2 text-platform-13 leading-platform-18 font-semibold text-platform-text',
    ],
    optional: ['text-platform-12 font-medium text-platform-muted'],
    hint: ['m-0 text-platform-12-5 leading-platform-18 text-platform-muted'],
    error: ['text-platform-11-5 text-platform-bad'],
  },
});
