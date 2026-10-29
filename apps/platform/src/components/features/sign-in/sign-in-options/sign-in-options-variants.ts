import { tv } from '@platform/utils/tv/tv';

export const signInOptionsVariants = tv({
  slots: {
    root: ['flex flex-col gap-4'],
    providers: ['flex flex-col gap-2'],
    divider: [
      'flex items-center gap-3 text-admin-12 text-admin-muted',
      'before:h-px before:flex-1 before:bg-admin-line-2',
      'after:h-px after:flex-1 after:bg-admin-line-2',
    ],
  },
});
