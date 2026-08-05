import { tv } from '@blog/ui/lib/styling';

export const newsletterSignupVariants = tv({
  slots: {
    root: ['w-full'],
    heading: ['font-display text-card-title font-medium text-text', 'm-0 mb-1'],
    description: ['font-body text-prose text-muted', 'm-0 mb-3'],
    form: ['flex flex-col gap-3'],
    field: [],
    submit: ['inline-flex items-center justify-center gap-2'],
    spinner: ['animate-spin'],
    error: ['font-mono text-meta text-danger', 'm-0 mt-2'],
    success: ['flex items-center gap-2', 'font-mono text-copy text-ok', 'm-0'],
    cursor: [
      'inline-block h-[1em] w-[0.5ch]',
      'bg-ok',
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
        error: ['w-full'],
        success: ['w-full'],
        label: ['shrink-0'],
      },
    },
  },
  defaultVariants: { variant: 'full' },
});
