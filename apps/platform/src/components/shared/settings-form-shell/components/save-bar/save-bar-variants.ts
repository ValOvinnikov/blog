import { FOCUS_RING_GROUND } from '@platform/constants/focus-ring';
import { focusRingClasses } from '@platform/utils/focus-ring-classes/focus-ring-classes';
import { tv } from '@platform/utils/tv/tv';

export const saveBarVariants = tv({
  slots: {
    root: [
      'sticky bottom-3 z-10 flex flex-col gap-3 rounded-admin border p-3 shadow-admin-lg',
      'md:fixed md:right-0 md:bottom-0 md:left-admin-sidebar md:z-20 md:h-admin-dock',
      'group-data-[collapsed=true]/shell:md:left-admin-rail',
      'md:flex-row md:items-center md:rounded-none md:border-0 md:border-t md:border-admin-line',
      'md:bg-admin-surface md:px-admin-content md:py-0 md:text-admin-text md:shadow-admin-dock',
    ],
    summary: [
      'inline-flex flex-wrap items-center gap-2.5 text-admin-14',
      'md:text-admin-13-5 md:leading-4',
    ],
    dot: ['size-[9px] shrink-0 rounded-full bg-admin-warn md:size-2'],
    count: ['font-semibold'],
    breakdown: ['text-admin-muted'],
    errorContent: [
      'flex flex-col gap-1 md:min-w-0 md:flex-1 md:gap-0',
      'lg:flex-row lg:items-center lg:gap-2.5',
    ],
    errorCount: [
      'text-admin-14 font-semibold text-admin-bad',
      'md:text-admin-13-5 md:leading-5 lg:text-admin-13 lg:leading-4',
    ],
    errorFollowUp: [
      'flex items-center gap-1.5 text-admin-13 whitespace-nowrap md:leading-admin-18',
      'lg:contents',
    ],
    errorLink: [
      'rounded-admin-control text-admin-brand underline underline-offset-2 outline-hidden',
      'hover:text-admin-brand-strong lg:leading-4',
      focusRingClasses(FOCUS_RING_GROUND.SURFACE),
    ],
    separator: ['text-admin-muted lg:hidden'],
    notSaved: ['text-admin-muted lg:ml-auto lg:text-admin-12-5'],
    actions: [
      'grid grid-cols-2 gap-2 md:ml-auto md:flex md:items-center md:gap-3',
    ],
    shortcut: ['hidden text-admin-12 text-admin-muted lg:inline'],
  },
  variants: {
    hasErrors: {
      true: {
        root: [
          'border-admin-bad-line bg-admin-bad-weak text-admin-bad',
          'md:bg-admin-surface md:text-admin-text',
        ],
      },
      false: {
        root: ['border-admin-line bg-admin-surface text-admin-text'],
      },
    },
  },
  defaultVariants: {
    hasErrors: false,
  },
});
