import { tv } from '@platform/utils/tv/tv';

export const signedInAccountVariants = tv({
  slots: {
    root: ['flex flex-wrap items-center justify-between gap-x-3 gap-y-2'],
    email: ['min-w-0 text-admin-12 [overflow-wrap:anywhere]'],
  },
});
