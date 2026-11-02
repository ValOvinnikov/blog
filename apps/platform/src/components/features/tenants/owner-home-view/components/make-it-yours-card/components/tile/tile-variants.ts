import { FOCUS_RING_GROUND } from '@platform/constants/focus-ring';
import { focusRingClasses } from '@platform/utils/focus-ring-classes/focus-ring-classes';
import { tv } from '@platform/utils/tv/tv';

export const tileVariants = tv({
  slots: {
    root: [
      'flex min-h-16 items-center gap-3',
      'md:min-h-0 md:flex-col md:items-start md:gap-0',
      'rounded-admin border border-admin-line bg-admin-surface p-3.5',
      'shadow-admin no-underline',
      'hover:border-admin-brand hover:bg-admin-surface-2',
      focusRingClasses(FOCUS_RING_GROUND.SURFACE),
    ],
    icon: ['text-admin-brand'],
    text: ['flex min-w-0 flex-col md:mt-2 md:gap-0.5'],
    title: ['text-admin-13-5 leading-normal font-semibold text-admin-text'],
    description: ['text-admin-12-5 leading-normal text-admin-muted'],
  },
});
