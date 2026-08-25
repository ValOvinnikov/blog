import { tv } from 'tailwind-variants';

export const fontPickerVariants = tv({
  slots: {
    root: ['flex flex-col gap-2'],
    option: [
      'flex cursor-pointer items-center gap-3 rounded-md border border-border px-3 py-2.5',
      'transition-colors duration-base ease-console',
      'has-[[data-checked]]:border-brand-primary has-[[data-checked]]:bg-brand-primary-muted',
    ],
    radioRoot: [
      'flex size-4 shrink-0 items-center justify-center rounded-full border border-border-strong',
      'data-[checked]:border-brand-primary',
      'outline-hidden focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-primary',
    ],
    radioIndicator: ['size-2 rounded-full bg-brand-primary'],
    name: ['text-sm text-text'],
  },
});
