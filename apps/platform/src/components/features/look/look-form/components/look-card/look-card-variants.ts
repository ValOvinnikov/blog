import { tv } from '@platform/utils/tv/tv';

export const lookCardVariants = tv({
  slots: {
    title: ['inline-flex items-center gap-2'],
    body: ['flex flex-col gap-4'],
    dot: ['size-2 shrink-0 rounded-full bg-admin-warn'],
  },
});
