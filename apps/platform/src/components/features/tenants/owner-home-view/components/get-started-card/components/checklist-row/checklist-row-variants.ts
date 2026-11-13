import { tv } from '@platform/utils/tv/tv';

export const checklistRowVariants = tv({
  slots: {
    root: [
      'flex min-h-11 items-start gap-3',
      'border-t border-platform-line-2 px-platform-card py-3 first:border-t-0',
    ],
    body: ['flex min-w-0 flex-1 flex-col items-start gap-1'],
    title: ['text-platform-13-5 leading-5 font-semibold text-platform-text'],
    state: ['sr-only'],
    description: ['text-platform-12-5 leading-platform-18 text-platform-muted'],
    actions: ['flex flex-wrap items-center gap-2'],
  },
  variants: {
    isMuted: {
      true: { title: ['text-platform-muted'] },
      false: {},
    },
  },
});
