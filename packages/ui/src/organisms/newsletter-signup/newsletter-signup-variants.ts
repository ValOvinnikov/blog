import { tv } from '@blog/ui/lib/styling';
import type { VariantProps } from 'tailwind-variants';

export const newsletterSignupVariants = tv({
  slots: {
    root: ['w-full'],
    body: ['grid grid-cols-1 p-0', 'md:grid-cols-[1.1fr_1fr]'],
    pitchPane: ['flex flex-col gap-3 p-8'],
    heading: ['font-mono text-card-title font-medium text-accent', 'm-0'],
    description: ['font-body text-prose text-text', 'm-0'],
    trustCues: [
      'flex flex-col gap-2 md:flex-row md:flex-wrap md:items-center md:gap-4',
      'm-0 list-none p-0',
      'font-mono text-label text-muted',
    ],
    trustCue: ['inline-flex items-center gap-1.5'],
    trustCueIcon: ['shrink-0 text-muted'],
    formPane: [
      'flex flex-col justify-center gap-3',
      'p-8',
      'border-t border-border md:border-t-0 md:border-l',
    ],
    form: ['flex flex-col gap-3'],
    field: [],
    submit: ['inline-flex items-center justify-center gap-2'],
    spinner: ['text-accent-contrast'],
    label: ['font-mono text-copy text-text'],
    alert: [],
  },
  variants: {
    variant: {
      full: {
        submit: ['w-full'],
      },
      compact: {
        root: [
          'flex flex-col gap-2',
          'sm:flex-row sm:flex-wrap sm:items-center',
          'rounded-sm border border-border border-l-3 border-l-accent bg-surface-2',
          'px-3 py-2.5',
        ],
        form: [
          'flex flex-1 flex-col gap-2',
          'sm:flex-row sm:flex-wrap sm:items-center',
        ],
        field: ['flex-1 sm:min-w-[12rem]'],
        submit: ['shrink-0'],
        label: ['shrink-0'],
        alert: ['flex-1'],
      },
    },
  },
  defaultVariants: { variant: 'full' },
});

export type TNewsletterSignupVariants = VariantProps<
  typeof newsletterSignupVariants
>;
