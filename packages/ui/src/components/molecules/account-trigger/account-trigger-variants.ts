import { ACCOUNT_BUTTON_STYLE } from '@blog/config';
import { HEADER_CONTROL, tv } from '@blog/ui/lib/styling';
import type { VariantProps } from 'tailwind-variants';

export const accountTriggerVariants = tv({
  slots: {
    root: [
      'group inline-flex shrink-0 items-center justify-center p-0',
      HEADER_CONTROL,
    ],
    glyph: ['inline-grid size-6 shrink-0 place-items-center'],
    personIcon: [
      'text-muted',
      'group-hover:text-current group-aria-expanded:text-current',
    ],
    labels: [
      'inline-grid justify-items-start',
      'font-mono text-label whitespace-nowrap',
    ],
    label: ['col-start-1 row-start-1'],
    spareLabel: ['invisible col-start-1 row-start-1'],
    avatar: [],
  },
  variants: {
    appearance: {
      [ACCOUNT_BUTTON_STYLE.PILL]: {
        root: [
          'size-auto gap-1.5 pr-4 pl-1.5',
          'min-h-11 lg:min-h-9 pointer-coarse:min-h-11',
        ],
        avatar: ['size-6 text-xs'],
      },
      [ACCOUNT_BUTTON_STYLE.CIRCLE]: {
        root: ['size-11 lg:size-9 pointer-coarse:size-11'],
        avatar: [
          'size-10 text-sm',
          'lg:size-8 lg:text-xs pointer-coarse:size-10 pointer-coarse:text-sm',
        ],
      },
    },
  },
  defaultVariants: { appearance: ACCOUNT_BUTTON_STYLE.PILL },
});

export type TAccountTriggerVariants = VariantProps<
  typeof accountTriggerVariants
>;
