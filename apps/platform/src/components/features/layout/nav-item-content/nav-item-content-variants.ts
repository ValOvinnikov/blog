import { tv } from '@platform/utils/tv/tv';
import type { VariantProps } from 'tailwind-variants';

// The sidebar renders only from `md` and the phone Menu only below it, so `md:` scopes a class to the sidebar and `max-md:` to the Menu.
const STATUS_TEXT_MUTED = [
  'text-platform-muted',
  'md:text-platform-side-muted md:group-hover:text-platform-side-text',
];

export const navItemContentVariants = tv({
  slots: {
    // The icon reads `aria-current` off its ancestor row via `group-aria-*`, not a state prop.
    rowIcon: [
      'text-platform-side-muted transition-colors duration-base ease-smooth',
      'group-aria-[current=page]:text-platform-text-strong',
      'max-md:text-platform-muted max-md:group-aria-[current=page]:text-platform-text',
    ],
    // `sr-only`, not `hidden`, so the label stays the row's accessible name when collapsed.
    rowBody: [
      'flex min-w-0 flex-1 flex-col',
      'group-data-[collapsed=true]/shell:sr-only',
    ],
    rowLabel: ['truncate'],
    rowReason: ['text-platform-12 leading-4 text-platform-side-muted'],
    badgeSlot: [
      'ml-auto shrink-0',
      'group-data-[collapsed=true]/shell:sr-only',
    ],
    statusSeparator: ['sr-only'],
    statusLine: [
      'mt-0.5 flex items-start gap-1.5',
      'text-platform-12 leading-4 font-medium',
    ],
    statusIcon: ['mt-px'],
    statusText: ['min-w-0 transition-colors duration-base ease-smooth'],
    iconFrame: ['relative flex shrink-0'],
    // The 14px badge overlaps the 16px nav icon's lower-right corner by 6.5px on each axis.
    railBadge: [
      'absolute -right-[7.5px] -bottom-[7.5px] flex size-3.5 items-center justify-center rounded-full',
      'bg-platform-side transition-colors duration-base ease-smooth',
      'group-hover:bg-platform-side-line group-aria-[current=page]:bg-platform-side-raised',
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
        rowIcon: ['group-focus-visible:text-platform-text-strong'],
      },
    },
    hasNeutralBadge: {
      true: {
        badgeSlot: ['max-md:bg-platform-pill-neutral-popover'],
      },
    },
    tone: {
      warn: {
        statusIcon: ['text-platform-warn'],
        railBadge: ['text-platform-warn'],
        statusText: STATUS_TEXT_MUTED,
      },
      brand: {
        statusIcon: ['text-platform-brand-ink'],
        railBadge: ['text-platform-brand-ink'],
        statusText: STATUS_TEXT_MUTED,
      },
      bad: {
        statusIcon: ['text-platform-bad'],
        railBadge: ['text-platform-bad'],
        statusText: ['text-platform-bad'],
      },
    },
  },
});

export type TNavItemStatusTone = NonNullable<
  VariantProps<typeof navItemContentVariants>['tone']
>;
