import { tv } from '@platform/utils/tv/tv';

export const dashboardTenantPickerVariants = tv({
  slots: {
    root: [
      'flex min-h-dvh flex-col bg-admin-bg text-admin-text',
      'lg:grid lg:h-dvh lg:grid-cols-[300px_minmax(0,1fr)] lg:grid-rows-[minmax(0,1fr)_auto] lg:overflow-hidden',
    ],
    rail: [
      'flex flex-col gap-6 bg-admin-rail px-4 py-5',
      'lg:col-start-1 lg:row-start-1 lg:gap-11 lg:border-r lg:border-admin-rail-line lg:px-6 lg:pt-7 lg:pb-6',
    ],
    account: [
      'sticky bottom-0 border-t border-admin-rail-line bg-admin-rail px-4 pt-3 pb-[calc(--spacing(3)+env(safe-area-inset-bottom))]',
      'lg:static lg:col-start-1 lg:row-start-2 lg:border-r lg:border-t-0 lg:px-6 lg:pt-0 lg:pb-7',
    ],
    accountRule: ['lg:border-t lg:border-admin-rail-line lg:pt-4'],
  },
});
