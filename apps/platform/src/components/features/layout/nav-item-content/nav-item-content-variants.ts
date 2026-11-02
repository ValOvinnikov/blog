import { tv } from '@platform/utils/tv/tv';
import type { VariantProps } from 'tailwind-variants';

// The sidebar renders only from `md` and the phone Menu only below it, so `md:` scopes a class to the sidebar and `max-md:` to the Menu.
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
    iconFrame: ['relative flex shrink-0'],
    // The 14px badge overlaps the 16px nav icon's lower-right corner by 6.5px on each axis.
    railBadge: [
      'absolute -right-[7.5px] -bottom-[7.5px] flex size-3.5 items-center justify-center rounded-full',
      'bg-admin-side transition-colors duration-base ease-smooth',
      'group-hover:bg-admin-side-line group-aria-[current=page]:bg-admin-side-raised',
    ],
  },
  variants: {
    hasStatus: {
      true: {
        rowIcon: ['mt-0.5 self-start'],
      },
    },
    hasRailBadge: {
      true: {
        rowIcon: ['group-focus-visible:text-admin-text-strong'],
      },
    },
    hasNeutralBadge: {
      true: {
        badgeSlot: ['max-md:bg-admin-pill-neutral-popover'],
      },
    },
    tone: {
      warn: {
        statusIcon: ['text-admin-warn'],
        railBadge: ['text-admin-warn'],
        statusText: STATUS_TEXT_MUTED,
      },
      brand: {
        statusIcon: ['text-admin-brand-ink'],
        railBadge: ['text-admin-brand-ink'],
        statusText: STATUS_TEXT_MUTED,
      },
      bad: {
        statusIcon: ['text-admin-bad'],
        railBadge: ['text-admin-bad'],
        statusText: ['text-admin-bad'],
      },
    },
  },
});

export type TNavItemStatusTone = NonNullable<
  VariantProps<typeof navItemContentVariants>['tone']
>;
