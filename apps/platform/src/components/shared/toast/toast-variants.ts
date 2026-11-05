import { TOAST_TYPE } from '@blog/config';
import { FOCUS_RING_GROUND } from '@platform/constants/focus-ring';
import { focusRingClasses } from '@platform/utils/focus-ring-classes/focus-ring-classes';
import { tv } from '@platform/utils/tv/tv';

export const toastVariants = tv({
  slots: {
    root: [
      'pointer-events-auto relative flex max-w-[400px] items-center gap-[9px] overflow-hidden',
      'rounded-admin border border-l-0 border-admin-popover-line bg-admin-popover px-[14px] py-[11px]',
      'text-admin-13 text-admin-text shadow-admin-lg',
      'before:absolute before:inset-y-0 before:left-0 before:w-admin-bar',
      'transition-[opacity,transform] duration-[300ms] ease-out',
      'motion-reduce:transition-none',
    ],
    icon: [],
    spinner: [
      'inline-block size-3.5 shrink-0 animate-spin rounded-full',
      'border-2 border-admin-text/25 border-t-admin-text',
      'motion-reduce:animate-none',
    ],
    message: ['min-w-0 flex-1'],
    titleText: ['mr-1 font-semibold'],
    time: ['shrink-0 text-admin-muted'],
    action: [
      'shrink-0 cursor-pointer font-semibold text-admin-text underline-offset-2',
      'hover:underline',
    ],
    actionKey: ['ml-1 text-admin-muted'],
    dismiss: [
      'shrink-0 cursor-pointer rounded-admin-control text-admin-muted',
      'hover:text-admin-text',
      'focus-visible:text-admin-text',
      focusRingClasses(FOCUS_RING_GROUND.POPOVER),
    ],
  },
  variants: {
    type: {
      [TOAST_TYPE.SUCCESS]: {
        root: ['before:bg-admin-ok'],
        icon: ['text-admin-ok'],
      },
      [TOAST_TYPE.INFO]: {
        root: ['before:bg-admin-brand-ink'],
        icon: ['text-admin-brand-ink'],
      },
      [TOAST_TYPE.WARNING]: {
        root: ['before:bg-admin-warn'],
        icon: ['text-admin-warn'],
      },
      [TOAST_TYPE.ERROR]: {
        root: ['before:bg-admin-bad'],
        icon: ['text-admin-bad'],
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
