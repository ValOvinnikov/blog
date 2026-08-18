import { tv } from 'tailwind-variants';

export const tenantDetailsFormVariants = tv({
  slots: {
    root: ['flex flex-col gap-6'],
    header: ['flex flex-col gap-1'],
    description: ['max-w-lg'],
    cardWrap: ['relative'],
    card: ['rounded-md border border-border bg-surface p-6'],
    overlay: [
      'absolute inset-0 z-10 flex items-center justify-center gap-2',
      'rounded-md bg-surface/80 backdrop-blur-sm',
    ],
    fields: ['flex flex-col gap-5'],
    field: ['flex flex-col gap-1.5'],
    label: ['text-sm font-medium text-text'],
    hint: ['text-xs text-text-subtle'],
    fieldError: ['text-xs text-error'],
    actions: ['mt-2 flex items-center justify-end'],
  },
  variants: {
    pending: {
      true: { card: ['opacity-50'] },
      false: {},
    },
  },
  defaultVariants: {
    pending: false,
  },
});
