import { tv } from '@platform/utils/tv/tv';

export const previewAddressBarVariants = tv({
  slots: {
    root: ['flex items-center gap-3 border-b p-2'],
    dots: ['flex flex-none gap-1.5'],
    dot: ['size-2 rounded-full'],
    address: [
      'h-7 min-w-0 flex-1 rounded-admin-control border px-2',
      'truncate text-admin-12 leading-[26px]',
    ],
  },
  variants: {
    isDark: {
      true: {
        root: ['border-admin-rail-line'],
        dot: ['bg-admin-rail-raised'],
        address: [
          'border-admin-rail-line bg-admin-rail-raised text-admin-rail-text',
        ],
      },
      false: {
        root: ['border-admin-line-2'],
        dot: ['bg-admin-line'],
        address: ['border-admin-line-2 bg-admin-bg text-admin-muted'],
      },
    },
  },
});
