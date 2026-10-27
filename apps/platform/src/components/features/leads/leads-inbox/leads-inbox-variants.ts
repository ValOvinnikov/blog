import { tv } from '@platform/utils/tv/tv';

export const leadsInboxVariants = tv({
  slots: {
    root: ['grid grid-cols-1 items-start gap-6 lg:grid-cols-2'],
    listColumn: [
      'min-w-0 rounded-admin',
      'outline-hidden focus-visible:ring-2 focus-visible:ring-admin-brand focus-visible:ring-offset-2',
    ],
    paneColumn: [
      'min-w-0',
      'lg:sticky lg:top-admin-topbar lg:max-h-[calc(100dvh-160px)] lg:self-start lg:overflow-y-auto lg:overscroll-contain',
    ],
  },
  variants: {
    hasSelection: {
      true: { listColumn: ['hidden lg:block'] },
      false: { paneColumn: ['hidden lg:block'] },
    },
  },
});
