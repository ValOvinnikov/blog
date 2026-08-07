import { tv } from 'tailwind-variants';

export const displayNameControlVariants = tv({
  slots: {
    root: [
      'flex w-full flex-col gap-2',
      'md:min-w-112 md:flex-row md:flex-wrap md:items-center',
    ],
    avatarInputRow: ['flex min-w-0 flex-1 items-center gap-2'],
    field: ['min-w-0 flex-1'],
    button: ['w-full', 'md:w-auto'],
  },
});
