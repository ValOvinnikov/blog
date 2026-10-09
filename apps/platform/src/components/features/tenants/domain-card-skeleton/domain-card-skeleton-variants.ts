import { tv } from '@platform/utils/tv/tv';

export const domainCardSkeletonVariants = tv({
  slots: {
    title: ['h-4 w-20'],
    badge: ['h-5 w-24 rounded-full'],
    action: ['h-7 w-14'],
    term: ['h-3.5 w-20'],
    value: ['h-4 w-40 max-w-full'],
  },
});
