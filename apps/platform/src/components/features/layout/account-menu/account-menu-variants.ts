import { MENU_POPUP_FIT_WIDTH } from '@platform/components/shared/menu-surface';
import { ACCOUNT_MENU_PLACEMENT } from '@platform/constants/account-menu';
import { FOCUS_RING_GROUND } from '@platform/constants/focus-ring';
import { focusRingClasses } from '@platform/utils/focus-ring-classes/focus-ring-classes';
import { COLOUR_TRANSITION_CLASSES } from '@platform/utils/transition-classes/transition-classes';
import { tv } from '@platform/utils/tv/tv';

const SIDEBAR_TRIGGER = [
  'rounded-platform border border-platform-control-line-tint bg-transparent',
  'hover:bg-platform-side-raised',
  'data-[popup-open]:border-platform-side-accent data-[popup-open]:bg-platform-side-raised',
  focusRingClasses(FOCUS_RING_GROUND.SIDE),
];

const EXPANDED_TRIGGER =
  'flex min-h-[52px] w-full items-center gap-2.5 px-2.5 py-2 text-left';

export const accountMenuVariants = tv({
  slots: {
    trigger: [COLOUR_TRANSITION_CLASSES],
    meta: ['flex min-w-0 flex-1 flex-col'],
    nameLine: [
      'truncate text-platform-13 leading-[18px] font-semibold text-platform-text',
    ],
    emailLine: ['truncate text-platform-12 leading-4 text-platform-muted'],
    chevron: ['text-platform-muted'],
    popup: [],
    header: [
      'mb-1 flex flex-col gap-0.5 border-b border-platform-popover-line px-2 py-2.5',
    ],
    headerName: [
      'text-platform-13 font-semibold wrap-anywhere text-platform-text',
    ],
    headerEmail: ['text-platform-12 wrap-anywhere text-platform-muted'],
    headerRole: ['mt-1 text-platform-12 text-platform-muted'],
    signOutIcon: ['text-platform-muted'],
  },
  variants: {
    placement: {
      [ACCOUNT_MENU_PLACEMENT.FOOT]: {
        trigger: [...SIDEBAR_TRIGGER, EXPANDED_TRIGGER],
        popup: [MENU_POPUP_FIT_WIDTH],
      },
      [ACCOUNT_MENU_PLACEMENT.RAIL]: {
        trigger: [
          ...SIDEBAR_TRIGGER,
          'flex size-[52px] items-center justify-center',
        ],
        popup: ['w-60'],
      },
      [ACCOUNT_MENU_PLACEMENT.MENU]: {
        trigger: [EXPANDED_TRIGGER, 'rounded-platform'],
        popup: ['w-[var(--anchor-width)]'],
      },
    },
  },
});
