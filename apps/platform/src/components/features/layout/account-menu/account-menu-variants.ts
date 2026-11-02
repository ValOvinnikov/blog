import { FOCUS_RING_GROUND } from '@platform/constants/focus-ring';
import { focusRingClasses } from '@platform/utils/focus-ring-classes/focus-ring-classes';
import { tv } from '@platform/utils/tv/tv';
import type { VariantProps } from 'tailwind-variants';

const SIDEBAR_TRIGGER = [
  'rounded-admin border border-admin-control-line-tint bg-transparent',
  'hover:bg-admin-side-raised',
  'data-[popup-open]:border-admin-side-accent data-[popup-open]:bg-admin-side-raised',
  focusRingClasses(FOCUS_RING_GROUND.SIDE),
];

export const accountMenuVariants = tv({
  slots: {
    trigger: ['transition-colors duration-base ease-smooth'],
    meta: ['flex min-w-0 flex-1 flex-col'],
    nameLine: [
      'truncate text-admin-13 leading-[18px] font-semibold text-admin-text',
    ],
    emailLine: ['truncate text-admin-12 leading-4 text-admin-muted'],
    chevron: ['text-admin-muted'],
    pillLabel: ['sr-only'],
    popup: [],
    header: [
      'mb-1 flex flex-col gap-0.5 border-b border-admin-popover-line px-2 py-2.5',
    ],
    headerName: ['text-admin-13 font-semibold wrap-anywhere text-admin-text'],
    headerEmail: ['text-admin-12 wrap-anywhere text-admin-muted'],
    headerRole: ['mt-1 text-admin-12 text-admin-muted'],
    signOutIcon: ['text-admin-muted'],
  },
  variants: {
    placement: {
      foot: {
        trigger: [
          ...SIDEBAR_TRIGGER,
          'flex min-h-[52px] w-full items-center gap-2.5 px-2.5 py-2 text-left',
        ],
        popup: ['w-[var(--anchor-width)]'],
      },
      rail: {
        trigger: [
          ...SIDEBAR_TRIGGER,
          'flex size-[52px] items-center justify-center',
        ],
        popup: ['w-60'],
      },
      pill: {
        trigger: [
          'ml-auto inline-flex shrink-0 items-center rounded-full border border-admin-line md:hidden',
          'bg-admin-surface p-1 text-admin-muted shadow-admin',
          'hover:border-admin-brand hover:text-admin-text',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-brand',
          'focus-visible:ring-offset-2 focus-visible:ring-offset-admin-bg',
          'data-[popup-open]:border-admin-brand data-[popup-open]:text-admin-text',
        ],
        popup: ['w-60'],
      },
    },
  },
});

export type TAccountMenuPlacement = NonNullable<
  VariantProps<typeof accountMenuVariants>['placement']
>;
