import { tv } from '@platform/utils/tv/tv';

export const bandCellVariants = tv({
  slots: {
    root: [
      'min-w-0 border-t border-platform-line-2 px-4 py-3',
      'first:border-t-0 last:border-l',
      'md:border-t-0 md:border-l md:first:border-l-0 md:first:pl-platform-card',
      'lg:px-5 lg:py-4 lg:first:pl-platform-card',
    ],
    term: ['text-platform-12-5 leading-platform-18 text-platform-muted'],
    value: [
      'm-0 mt-1 min-w-0 wrap-anywhere',
      'text-platform-14 leading-platform-22 font-medium text-platform-text',
    ],
  },
  variants: {
    isFullRow: {
      true: { root: ['col-span-2 md:col-span-1'] },
      false: {},
    },
    isMono: {
      true: { value: ['font-mono text-platform-13'] },
      false: {},
    },
  },
  defaultVariants: { isFullRow: false, isMono: false },
});
