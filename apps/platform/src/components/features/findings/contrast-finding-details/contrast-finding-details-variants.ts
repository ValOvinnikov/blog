import { tv } from '@platform/utils/tv/tv';

export const contrastFindingDetailsVariants = tv({
  slots: {
    root: ['flex flex-col gap-1.5'],
    facts: ['flex flex-wrap items-center gap-x-3 gap-y-1'],
    code: ['font-mono text-platform-12-5'],
    secondary: ['block text-platform-12 text-platform-muted'],
    actions: ['flex flex-wrap items-center gap-2 pt-1'],
  },
});
