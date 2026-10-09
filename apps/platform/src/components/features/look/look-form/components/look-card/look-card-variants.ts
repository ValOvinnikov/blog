import { tv } from '@platform/utils/tv/tv';

export const lookCardVariants = tv({
  slots: {
    title: ['inline-flex items-center gap-2'],
    dot: ['size-2 shrink-0 rounded-full bg-admin-warn'],
    srOnly: ['sr-only'],
  },
});
