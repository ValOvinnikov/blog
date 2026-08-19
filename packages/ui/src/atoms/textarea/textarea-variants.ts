import { tv } from '@blog/ui/lib/styling';
import type { VariantProps } from 'tailwind-variants';

export const textareaVariants = tv({
  slots: {
    root: ['relative w-full'],
    prompt: [
      'pointer-events-none absolute top-2 left-3',
      'font-mono text-copy text-brand-primary select-none',
    ],
    textarea: [
      'w-full rounded-sm border bg-surface px-3 py-2',
      'font-body text-copy text-text placeholder:text-subtle',
      'transition-colors duration-base ease-console',
      'border-border-strong',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary',
      'focus-visible:ring-offset-2 focus-visible:ring-offset-primary',
      'disabled:pointer-events-none disabled:border-border-emphasis disabled:bg-surface-2 disabled:text-muted disabled:placeholder:opacity-50',
    ],
  },
  variants: {
    invalid: {
      true: {
        textarea: ['border-error text-error', 'disabled:border-error'],
      },
    },
    hasPrompt: {
      true: { textarea: ['pl-8'] },
    },
  },
});

export type TTextareaVariants = VariantProps<typeof textareaVariants>;
