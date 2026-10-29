import { tv } from '@platform/utils/tv/tv';

export const deadEndViewVariants = tv({
  slots: {
    content: ['flex flex-col items-start gap-4'],
    copy: ['flex flex-col gap-2'],
    description: ['text-admin-14 leading-relaxed'],
    actions: ['mt-2 flex flex-wrap items-center gap-2'],
    errorId: ['self-stretch border-t border-admin-line-2 pt-3 font-mono'],
    account: [
      'self-stretch border-t border-admin-line-2 pt-3 text-admin-muted',
    ],
  },
});
