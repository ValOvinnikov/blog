import { tv } from '@platform/utils/tv/tv';

export const pageSkeletonVariants = tv({
  slots: {
    root: ['flex flex-col gap-6'],
    status: ['sr-only'],
    title: ['h-7 w-56 max-w-full'],
    description: ['mt-2 h-4 w-96 max-w-full'],
    cardTitle: ['h-4 w-40'],
    row: [
      'flex items-center gap-4 py-3',
      'border-b border-admin-line-2 last:border-b-0',
    ],
    primaryCell: ['h-4 flex-1'],
    secondaryCell: ['h-4 w-24'],
    badgeCell: ['h-5 w-16 rounded-full'],
  },
});
