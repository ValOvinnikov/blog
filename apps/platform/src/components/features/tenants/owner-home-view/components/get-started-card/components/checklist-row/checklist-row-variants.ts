import { tv } from '@platform/utils/tv/tv';

export const checklistRowVariants = tv({
  slots: {
    root: [
      'flex min-h-11 items-start gap-3',
      'border-t border-admin-line-2 px-admin-card py-3 first:border-t-0',
    ],
    body: ['flex min-w-0 flex-1 flex-col items-start gap-1'],
    title: ['text-admin-13-5 leading-5 font-semibold text-admin-text'],
    state: ['sr-only'],
    description: ['text-admin-12-5 leading-admin-18 text-admin-muted'],
    actions: ['flex flex-wrap items-center gap-2'],
  },
  variants: {
    isMuted: {
      true: { title: ['text-admin-muted'] },
      false: {},
    },
  },
});
