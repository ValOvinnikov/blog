import { tv } from '@blog/ui/lib/styling';
import type { VariantProps } from 'tailwind-variants';

export const newsletterSignupVariants = tv({
  slots: {
    root: ['w-full'],
    heading: ['font-display text-card-title font-medium text-text', 'm-0 mb-1'],
    description: ['font-body text-prose text-muted', 'm-0 mb-3'],
    form: ['flex flex-col gap-3'],
    field: [],
    submit: ['inline-flex items-center justify-center gap-2'],
    spinner: ['animate-spin'],
    cursor: [
      'inline-block h-[1em] w-[0.5ch]',
      'bg-success',
      'animate-[blink_1s_steps(1)_infinite]',
    ],
    prompt: ['select-none text-accent'],
    label: ['font-mono text-copy text-text'],
  },
  variants: {
    variant: {
      full: {
        root: ['max-w-copy'],
        submit: ['w-full'],
      },
      compact: {
        root: [
          'rounded-sm border border-border border-l-3 border-l-accent bg-surface-2',
          'px-3 py-2.5',
        ],
        form: [
          'flex flex-col gap-2',
          'sm:flex-row sm:flex-wrap sm:items-center',
        ],
        field: ['flex-1 sm:min-w-[12rem]'],
        submit: ['shrink-0'],
        label: ['shrink-0'],
      },
    },
  },
  defaultVariants: { variant: 'full' },
});

export type TNewsletterSignupVariants = VariantProps<
  typeof newsletterSignupVariants
>;
