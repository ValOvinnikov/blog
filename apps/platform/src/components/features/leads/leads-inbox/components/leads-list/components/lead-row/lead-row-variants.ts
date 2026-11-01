import { FOCUS_RING_GROUND } from '@platform/constants/focus-ring';
import { insetFocusRingClasses } from '@platform/utils/focus-ring-classes/focus-ring-classes';
import { tv } from '@platform/utils/tv/tv';

export const leadRowVariants = tv({
  slots: {
    row: [
      'flex w-full min-w-0 min-h-11 flex-col gap-1 text-left',
      'border-b border-l-[3px] border-b-admin-line-2 px-[15px] py-3',
      'cursor-pointer hover:bg-admin-surface-2',
    ],
    top: ['flex min-w-0 items-center gap-2'],
    dot: ['size-2 flex-none rounded-full bg-admin-brand'],
    name: ['min-w-0 flex-1 truncate text-admin-13-5 text-admin-text'],
    time: ['flex-none text-admin-12 text-admin-muted'],
    preview: ['block truncate text-admin-12-5 text-admin-muted'],
    srOnly: ['sr-only'],
  },
  variants: {
    isRead: {
      true: { row: ['border-l-transparent'], name: ['font-normal'] },
      false: { row: ['border-l-admin-brand'], name: ['font-semibold'] },
    },
    isSelected: {
      true: {
        row: [
          'bg-admin-brand-weak ring-1 ring-inset ring-admin-brand hover:bg-admin-brand-weak focus-visible:ring-0',
          insetFocusRingClasses(FOCUS_RING_GROUND.BRAND_WEAK),
        ],
      },
      false: { row: [insetFocusRingClasses(FOCUS_RING_GROUND.SURFACE)] },
    },
  },
});
