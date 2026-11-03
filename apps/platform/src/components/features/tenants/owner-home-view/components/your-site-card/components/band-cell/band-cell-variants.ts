import { tv } from '@platform/utils/tv/tv';

export const bandCellVariants = tv({
  slots: {
    root: [
      'min-w-0 border-t border-admin-line-2 px-4 py-3',
      'first:border-t-0 last:border-l',
      'md:border-t-0 md:border-l md:first:border-l-0 md:first:pl-[18px]',
      'lg:px-5 lg:py-4 lg:first:pl-[18px]',
    ],
    term: ['text-admin-12-5 leading-[18px] text-admin-muted'],
    value: [
      'm-0 mt-1 min-w-0 wrap-anywhere',
      'text-admin-14 leading-[22px] font-medium text-admin-text',
    ],
  },
  variants: {
    isFullRow: {
      true: { root: ['col-span-2 md:col-span-1'] },
      false: {},
    },
    isMono: {
      true: { value: ['font-mono text-admin-13'] },
      false: {},
    },
  },
  defaultVariants: { isFullRow: false, isMono: false },
});
