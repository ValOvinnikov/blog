import { tv } from '@platform/utils/tv/tv';

export const tenantPickerPaneVariants = tv({
  slots: {
    root: [
      'flex-1 px-4 py-5',
      'lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:overflow-y-auto lg:px-12 lg:pt-[100px] lg:pb-10',
    ],
    column: ['mx-auto flex w-full max-w-[600px] flex-col gap-3'],
    count: ['text-platform-12 text-platform-muted'],
    body: ['p-1.5'],
    item: ['border-t border-platform-line-2 first:border-t-0'],
    groupLabel: [
      'mt-1.5 border-t border-platform-line px-3.5 pt-3 pb-1.5 text-platform-12 font-semibold text-platform-muted',
      'first:mt-0 first:border-t-0',
    ],
    noMatch: ['px-3.5 py-3 text-platform-13 text-platform-muted'],
  },
});
