import { TOAST_TYPE } from '@blog/config';
import { FOCUS_RING_GROUND } from '@platform/constants/focus-ring';
import { focusRingClasses } from '@platform/utils/focus-ring-classes/focus-ring-classes';
import { tv } from '@platform/utils/tv/tv';

export const toastVariants = tv({
  slots: {
    root: [
      'pointer-events-auto relative flex max-w-[400px] items-center gap-[9px] overflow-hidden',
      'rounded-platform border border-l-0 border-platform-popover-line bg-platform-popover px-[14px] py-[11px]',
      'text-platform-13 text-platform-text shadow-platform-lg',
      'before:absolute before:inset-y-0 before:left-0 before:w-platform-bar',
      'transition-[opacity,transform] duration-[300ms] ease-out',
      'motion-reduce:transition-none',
    ],
    icon: [],
    spinner: [
      'inline-block size-3.5 shrink-0 animate-spin rounded-full',
      'border-2 border-platform-text/25 border-t-platform-text',
      'motion-reduce:animate-none',
    ],
    message: ['min-w-0 flex-1'],
    titleText: ['mr-1 font-semibold'],
    time: ['shrink-0 text-platform-muted'],
    action: [
      'shrink-0 cursor-pointer font-semibold text-platform-text underline-offset-2',
      'hover:underline',
    ],
    actionKey: ['ml-1 text-platform-muted'],
    dismiss: [
      'shrink-0 cursor-pointer rounded-platform-control text-platform-muted',
      'hover:text-platform-text',
      focusRingClasses(FOCUS_RING_GROUND.POPOVER),
    ],
  },
  variants: {
    type: {
      [TOAST_TYPE.SUCCESS]: {
        root: ['before:bg-platform-ok'],
        icon: ['text-platform-ok'],
      },
      [TOAST_TYPE.INFO]: {
        root: ['before:bg-platform-brand-ink'],
        icon: ['text-platform-brand-ink'],
      },
      [TOAST_TYPE.WARNING]: {
        root: ['before:bg-platform-warn'],
        icon: ['text-platform-warn'],
      },
      [TOAST_TYPE.ERROR]: {
        root: ['before:bg-platform-bad'],
        icon: ['text-platform-bad'],
      },
    },
    phase: {
      entering: { root: ['translate-x-2 opacity-0'] },
      visible: { root: ['translate-x-0 opacity-100'] },
      leaving: { root: ['translate-x-2 opacity-0'] },
    },
  },
  defaultVariants: {
    phase: 'visible',
  },
});
