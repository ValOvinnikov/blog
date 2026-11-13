import { FOCUS_RING_GROUND } from '@platform/constants/focus-ring';
import { insetFocusRingClasses } from '@platform/utils/focus-ring-classes/focus-ring-classes';
import { tv } from '@platform/utils/tv/tv';

export const leadRowVariants = tv({
  slots: {
    row: [
      'flex w-full min-w-0 min-h-11 flex-col gap-1 text-left',
      'border-b border-l-[3px] border-b-platform-line-2 px-[15px] py-3',
      'cursor-pointer hover:bg-platform-surface-2',
    ],
    top: ['flex min-w-0 items-center gap-2'],
    dot: ['size-2 flex-none rounded-full bg-platform-brand'],
    name: ['min-w-0 flex-1 truncate text-platform-13-5 text-platform-text'],
    time: ['flex-none text-platform-12 text-platform-muted'],
    preview: ['block truncate text-platform-12-5 text-platform-muted'],
    srOnly: ['sr-only'],
  },
  variants: {
    isRead: {
      true: { row: ['border-l-transparent'], name: ['font-normal'] },
      false: { row: ['border-l-platform-brand'], name: ['font-semibold'] },
    },
    isSelected: {
      true: {
        row: [
          'bg-platform-brand-weak ring-1 ring-inset ring-platform-brand hover:bg-platform-brand-weak',
          // 3px and 5px, not 2px and 4px: the 1px brand edge stays outermost, then the 2px gap and ring.
          'focus-visible:outline-hidden focus-visible:shadow-[inset_0_0_0_3px_var(--platform-brand-weak),inset_0_0_0_5px_var(--platform-brand-ink)]',
        ],
      },
      false: { row: [insetFocusRingClasses(FOCUS_RING_GROUND.SURFACE)] },
    },
  },
});
