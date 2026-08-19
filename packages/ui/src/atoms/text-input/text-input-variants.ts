import { tv } from '@blog/ui/lib/styling';
import type { VariantProps } from 'tailwind-variants';

export const textInputVariants = tv({
  slots: {
    root: ['relative w-full'],
    leadingIcon: [
      'pointer-events-none absolute inset-y-0 left-3 flex items-center',
      'font-mono text-copy text-brand-primary select-none',
    ],
    trailingIcon: [
      'pointer-events-none absolute inset-y-0 right-3 flex items-center',
      'font-mono text-copy text-brand-primary select-none',
    ],
    input: [
      'w-full rounded-sm border bg-surface px-3 py-2',
      'font-mono text-copy text-text placeholder:text-subtle',
      'transition-colors duration-base ease-console',
      'border-border-strong',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary',
      'focus-visible:ring-offset-2 focus-visible:ring-offset-primary',
      'disabled:pointer-events-none disabled:border-border-emphasis disabled:bg-surface-2 disabled:text-muted disabled:placeholder:opacity-50',
    ],
  },
  variants: {
    invalid: {
      true: { input: ['border-error text-error', 'disabled:border-error'] },
    },
    hasLeadingIcon: {
      true: { input: ['pl-8'] },
    },
    hasTrailingIcon: {
      true: { input: ['pr-8'] },
    },
  },
});

export type TTextInputVariants = VariantProps<typeof textInputVariants>;
