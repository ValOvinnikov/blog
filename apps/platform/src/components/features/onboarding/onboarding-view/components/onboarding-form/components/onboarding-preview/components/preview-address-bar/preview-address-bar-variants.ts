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
        root: ['border-admin-side-line'],
        dot: ['bg-admin-side-raised'],
        address: [
          'border-admin-side-line bg-admin-side-raised text-admin-side-text',
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
