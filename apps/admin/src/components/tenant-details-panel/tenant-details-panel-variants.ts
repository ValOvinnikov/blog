import { tv } from 'tailwind-variants';

export const tenantDetailsPanelVariants = tv({
  slots: {
    root: [
      'flex flex-col gap-4 rounded-md border border-border bg-surface p-6',
    ],
    fields: ['flex flex-col gap-5'],
    field: ['flex flex-col gap-1.5'],
    fieldLabel: ['text-sm font-medium text-text'],
    fieldError: ['text-xs text-error'],
    actions: ['mt-2 flex items-center justify-end'],
    lockedInput: [],
  },
  variants: {
    locked: {
      // Not dimmed (that's what `disabled` does) — a background tint on the
      // `<input>` itself, since the input paints its own `bg-surface` over
      // any tint applied only to the wrapper around it.
      true: {
        lockedInput: ['[&>input]:cursor-default [&>input]:bg-surface-2'],
      },
      false: {},
    },
  },
  defaultVariants: {
    locked: false,
  },
});
