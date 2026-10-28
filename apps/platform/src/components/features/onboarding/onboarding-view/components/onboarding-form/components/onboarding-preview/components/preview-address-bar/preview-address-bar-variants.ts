import { tv } from '@platform/utils/tv/tv';

export const previewAddressBarVariants = tv({
  slots: {
    root: ['flex items-center gap-3 border-b border-admin-line-2 p-2'],
    dots: ['flex flex-none gap-1.5'],
    dot: ['size-2 rounded-full bg-admin-line'],
    address: [
      'h-7 min-w-0 flex-1 rounded-admin-control border border-admin-line-2 bg-admin-bg px-2',
      'truncate text-admin-12 leading-[26px] text-admin-muted',
    ],
  },
});
