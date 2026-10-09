import { tv } from '@platform/utils/tv/tv';

export const domainVerificationCardSkeletonVariants = tv({
  slots: {
    title: ['h-4 w-48 max-w-full'],
    badge: ['h-5 w-24 rounded-full'],
    hint: ['h-3 w-24'],
    copy: ['mb-3.5 h-4 w-full max-w-md'],
    row: [
      'flex items-center gap-4 px-[10px] py-2.5',
      'border-b border-admin-line-2 last:border-b-0',
    ],
    typeCell: ['h-4 w-12'],
    nameCell: ['h-4 w-28'],
    valueCell: ['h-4 flex-1'],
  },
});
