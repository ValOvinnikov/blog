import { CONTENT_ALIGNMENT } from '@blog/config';
import { tv } from '@blog/ui/lib/styling';
import type { VariantProps } from 'tailwind-variants';

export const newsletterSignupVariants = tv({
  slots: {
    root: [],
    body: ['grid grid-cols-1 p-0', '@3xl:grid-cols-[1.1fr_1fr]'],
    pitchPane: ['flex flex-col gap-3 p-8'],
    supportingText: ['font-body text-prose text-text', 'm-0'],
    trustCues: [
      'flex flex-col gap-2 md:flex-row md:flex-wrap md:items-center md:gap-4',
      'm-0 list-none p-0',
      'font-mono text-label text-muted',
    ],
    trustCue: ['inline-flex items-center gap-1.5'],
    trustCueIcon: ['shrink-0 text-muted'],
    formPane: ['flex flex-col justify-center gap-3', 'p-8'],
    form: ['flex flex-col gap-3'],
    field: [],
    submit: ['inline-flex items-center justify-center gap-2'],
    label: ['font-mono text-copy text-text'],
    alert: [],
    errorAlert: [],
    promptGroup: ['inline-flex shrink-0 items-center gap-1'],
  },
  variants: {
    variant: {
      full: {
        root: ['w-full', '@container'],
        form: ['@md:flex-row @md:flex-wrap', '@3xl:flex-col @3xl:flex-nowrap'],
        field: ['@md:min-w-0 @md:flex-1', '@3xl:flex-none'],
        submit: ['w-full', '@md:w-auto @md:shrink-0', '@3xl:w-full'],
        errorAlert: ['@md:basis-full', '@3xl:basis-auto'],
      },
      compact: {
        root: [
          'flex w-full flex-col gap-2',
          'sm:w-fit sm:max-w-full sm:flex-row sm:flex-wrap sm:items-center',
          'rounded-card border border-border bg-surface-2 surface-nested',
          'px-3 py-2.5',
        ],
        form: ['contents'],
        field: ['flex-1 sm:w-xs sm:min-w-[12rem] sm:max-w-xs sm:flex-auto'],
        submit: ['shrink-0'],
        alert: ['flex-1'],
        errorAlert: ['sm:basis-full sm:contain-inline-size'],
      },
    },
    hasPitch: {
      true: {
        formPane: ['border-t border-border @3xl:border-t-0 @3xl:border-l'],
      },
      false: {
        body: ['@3xl:grid-cols-1'],
      },
    },
    align: {
      [CONTENT_ALIGNMENT.LEFT]: {
        pitchPane: ['items-start text-left'],
        trustCues: ['items-start', 'md:justify-start'],
        promptGroup: ['max-sm:self-start'],
        root: ['sm:mr-auto sm:justify-start'],
      },
      [CONTENT_ALIGNMENT.CENTER]: {
        pitchPane: ['items-center text-center'],
        trustCues: ['items-center', 'md:justify-center'],
        promptGroup: ['max-sm:self-center'],
        root: ['sm:mx-auto sm:justify-center'],
      },
      [CONTENT_ALIGNMENT.RIGHT]: {
        pitchPane: ['items-end text-right'],
        trustCues: ['items-end', 'md:justify-end'],
        promptGroup: ['max-sm:self-end'],
        root: ['sm:ml-auto sm:justify-end'],
      },
    },
  },
  defaultVariants: {
    variant: 'full',
    align: CONTENT_ALIGNMENT.LEFT,
    hasPitch: true,
  },
});

export type TNewsletterSignupVariants = VariantProps<
  typeof newsletterSignupVariants
>;
