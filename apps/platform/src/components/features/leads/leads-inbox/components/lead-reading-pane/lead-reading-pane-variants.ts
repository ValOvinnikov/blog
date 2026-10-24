import { tv } from '@platform/utils/tv/tv';

export const leadReadingPaneVariants = tv({
  slots: {
    root: ['flex flex-col items-start gap-4'],
    back: ['lg:hidden'],
    card: ['w-full'],
    name: ['break-words'],
    body: ['flex flex-col gap-4'],
    email: [
      'break-all rounded-admin-control text-admin-brand underline underline-offset-2',
      'outline-hidden focus-visible:ring-2 focus-visible:ring-admin-brand focus-visible:ring-offset-2',
    ],
    message: ['break-words whitespace-pre-line'],
  },
});
