import { tv } from '@platform/utils/tv/tv';
import type { VariantProps } from 'tailwind-variants';

// The sidebar renders only from `md` and the phone Menu only below it, so `md:` scopes a class to the sidebar.
const STATUS_TEXT_MUTED = [
  'text-admin-muted',
  'md:text-admin-side-muted md:group-hover:text-admin-side-text',
];

export const navItemContentVariants = tv({
  slots: {
    // The icon reads `aria-current` off its ancestor row via `group-aria-*`, not a state prop.
    rowIcon: [
      'text-admin-side-muted transition-colors duration-base ease-smooth',
      'group-aria-[current=page]:text-admin-text-strong',
    ],
    // `sr-only`, not `hidden`, so the label stays the row's accessible name when collapsed.
    rowBody: [
      'flex min-w-0 flex-1 flex-col',
      'group-data-[collapsed=true]/shell:sr-only',
    ],
    rowLabel: ['truncate'],
    rowReason: ['text-admin-12 leading-4 text-admin-side-muted'],
    badgeSlot: [
      'ml-auto shrink-0',
      'group-data-[collapsed=true]/shell:sr-only',
    ],
    statusSeparator: ['sr-only'],
    statusLine: [
      'mt-0.5 flex items-start gap-1.5',
      'text-admin-12 leading-4 font-medium',
    ],
    statusIcon: ['mt-px'],
    statusText: ['min-w-0 transition-colors duration-base ease-smooth'],
  },
  variants: {
    hasStatus: {
      true: {
        rowIcon: [
          'mt-0.5 self-start',
          'group-data-[collapsed=true]/shell:mt-0 group-data-[collapsed=true]/shell:self-center',
        ],
      },
    },
    tone: {
      warn: {
        statusIcon: ['text-admin-warn'],
        statusText: STATUS_TEXT_MUTED,
      },
      brand: {
        statusIcon: ['text-admin-brand-ink'],
        statusText: STATUS_TEXT_MUTED,
      },
      bad: {
        statusIcon: ['text-admin-bad'],
        statusText: ['text-admin-bad'],
      },
    },
  },
});

export type TNavItemStatusTone = NonNullable<
  VariantProps<typeof navItemContentVariants>['tone']
>;
