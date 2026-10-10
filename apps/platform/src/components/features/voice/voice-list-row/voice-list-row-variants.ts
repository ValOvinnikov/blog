import { tv } from '@platform/utils/tv/tv';

export const voiceListRowVariants = tv({
  slots: {
    labelGroup: ['flex w-[130px] shrink-0 flex-col gap-px max-sm:flex-1'],
    label: ['text-[13.5px] leading-5 font-semibold text-admin-text'],
    routeHint: ['text-[12px] text-admin-muted'],
    text: [
      'min-w-0 flex-1 truncate text-[13.5px] leading-5 text-admin-muted max-sm:hidden',
    ],
    status: ['flex h-5 shrink-0 items-center'],
    error: ['-mt-1.5 px-2.5 pb-3 text-[11.5px] text-admin-bad'],
  },
  variants: {
    hasError: {
      true: { label: ['text-admin-bad'] },
    },
  },
});
