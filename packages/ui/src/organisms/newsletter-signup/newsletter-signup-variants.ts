import { CONTENT_ALIGNMENT } from '@blog/config';
import { tv } from '@blog/ui/lib/styling';
import type { VariantProps } from 'tailwind-variants';

export const newsletterSignupVariants = tv({
  slots: {
    root: [],
    body: ['grid grid-cols-1 p-0', 'md:grid-cols-[1.1fr_1fr]'],
    pitchPane: ['flex flex-col gap-3 p-8'],
    heading: [
      'font-mono text-card-title font-medium text-brand-primary',
      'm-0',
    ],
    supportingText: ['font-body text-prose text-text', 'm-0'],
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
    spinner: ['text-brand-primary-contrast'],
    label: ['font-mono text-copy text-text'],
    alert: [],
    // `prefix` + `label` group for `compact` — kept in its own inline-flex
    // wrapper so the two never split across rows under the root's own
    // `flex-col`/`sm:flex-row` stacking.
    promptGroup: ['inline-flex shrink-0 items-center gap-1'],
  },
  variants: {
    variant: {
      full: {
        root: ['w-full'],
        submit: ['w-full'],
      },
      compact: {
        root: [
          'flex w-full flex-col gap-2',
          'sm:inline-flex sm:w-auto sm:flex-row sm:flex-wrap sm:items-center',
          'rounded-sm border border-border border-l-3 border-l-brand-primary bg-surface-2',
          'px-3 py-2.5',
        ],
        form: [
          'flex flex-1 flex-col gap-2',
          'sm:flex-row sm:flex-wrap sm:items-center',
        ],
        field: ['flex-1 sm:min-w-[12rem]'],
        submit: ['shrink-0'],
        alert: ['flex-1'],
      },
    },
    align: {
      [CONTENT_ALIGNMENT.LEFT]: { pitchPane: ['items-start text-left'] },
      [CONTENT_ALIGNMENT.CENTER]: { pitchPane: ['items-center text-center'] },
      [CONTENT_ALIGNMENT.RIGHT]: { pitchPane: ['items-end text-right'] },
    },
  },
  defaultVariants: { variant: 'full', align: CONTENT_ALIGNMENT.LEFT },
});

export type TNewsletterSignupVariants = VariantProps<
  typeof newsletterSignupVariants
>;
