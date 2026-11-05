import { tv } from '@platform/utils/tv/tv';

export const voiceListRowVariants = tv({
  slots: {
    labelGroup: ['flex shrink-0 flex-col gap-0.5 max-md:flex-1 md:w-[130px]'],
    label: ['text-admin-13-5 leading-4 font-semibold text-admin-text'],
    routeHint: [
      'font-admin-mono text-admin-12 leading-4 font-medium text-admin-muted max-md:hidden',
    ],
    text: [
      'min-w-0 flex-1 truncate text-admin-13-5 leading-4 text-admin-muted max-md:hidden',
    ],
    status: ['flex h-5 shrink-0 items-center'],
    panel: ['flex flex-col gap-2 pt-1 pb-0.5'],
    error: [
      'px-1 pb-2 text-admin-11-5 leading-4 text-admin-bad md:px-2.5 md:pb-2.5',
    ],
  },
  variants: {
    hasError: {
      true: { label: ['text-admin-bad'] },
    },
  },
});
