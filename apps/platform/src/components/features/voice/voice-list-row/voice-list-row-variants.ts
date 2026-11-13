import { tv } from '@platform/utils/tv/tv';

export const voiceListRowVariants = tv({
  slots: {
    labelGroup: ['flex shrink-0 flex-col gap-0.5 max-md:flex-1 md:w-[130px]'],
    label: ['text-platform-13-5 leading-4 font-semibold text-platform-text'],
    routeHint: [
      'font-platform-mono text-platform-12 leading-4 font-medium text-platform-muted max-md:hidden',
    ],
    text: [
      'min-w-0 flex-1 truncate text-platform-13-5 leading-4 text-platform-muted max-md:hidden',
    ],
    status: ['flex h-5 shrink-0 items-center'],
    panel: ['pt-1 pb-0.5'],
    error: [
      'px-1 pb-2 text-platform-11-5 leading-4 text-platform-bad md:px-2.5 md:pb-2.5',
    ],
  },
  variants: {
    hasError: {
      true: { label: ['text-platform-bad'] },
    },
  },
});
