import { tv } from '@blog/ui/lib/styling';

export const authorBylineVariants = tv({
  slots: {
    root: ['flex items-start gap-4'],
    body: ['flex flex-col gap-1'],
    bio: ['mt-1'],
  },
});
