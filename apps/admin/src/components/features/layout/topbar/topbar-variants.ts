import { tv } from '@admin/utils/tv/tv';

export const topbarVariants = tv({
  slots: {
    root: [
      'sticky top-0 z-10 flex items-center gap-3.5',
      'border-b border-admin-line bg-admin-bg/90 px-4 py-[11px] backdrop-blur-sm',
      'md:px-[26px]',
    ],
    role: [
      'ml-auto inline-flex items-center gap-[7px] rounded-full border border-admin-line',
      'bg-admin-surface py-1 pr-[11px] pl-1.5 text-xs whitespace-nowrap text-admin-muted shadow-admin',
    ],
    roleDot: ['size-[7px] shrink-0 rounded-full bg-admin-ok'],
    roleScope: ['text-admin-faint'],
  },
});
