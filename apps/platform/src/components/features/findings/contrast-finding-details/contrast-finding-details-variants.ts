import { tv } from '@platform/utils/tv/tv';

export const contrastFindingDetailsVariants = tv({
  slots: {
    root: ['flex flex-col gap-1.5'],
    facts: ['flex flex-wrap items-center gap-x-3 gap-y-1'],
    code: ['font-mono text-admin-12-5'],
    secondary: ['block text-admin-12 text-admin-muted'],
    actions: ['flex flex-wrap items-center gap-2 pt-1'],
  },
});
