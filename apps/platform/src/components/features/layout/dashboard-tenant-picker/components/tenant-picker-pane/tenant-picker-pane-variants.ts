import { tv } from '@platform/utils/tv/tv';

export const tenantPickerPaneVariants = tv({
  slots: {
    root: [
      'flex-1 px-4 py-5',
      'lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:overflow-y-auto lg:px-12 lg:pt-[100px] lg:pb-10',
    ],
    column: ['mx-auto flex w-full max-w-[600px] flex-col gap-3'],
    count: ['text-admin-12 text-admin-muted'],
    body: ['p-1.5'],
    item: ['border-t border-admin-line-2 first:border-t-0'],
    groupLabel: [
      'mt-1.5 border-t border-admin-line px-3.5 pt-3 pb-1.5 text-admin-12 font-semibold text-admin-muted',
      'first:mt-0 first:border-t-0',
    ],
    noMatch: ['px-3.5 py-3 text-admin-13 text-admin-muted'],
  },
});
