import { FOCUS_RING_GROUND } from '@platform/constants/focus-ring';
import { focusRingClasses } from '@platform/utils/focus-ring-classes/focus-ring-classes';
import { tv } from '@platform/utils/tv/tv';

export const saveBarLinkClasses = [
  'rounded-admin-control text-admin-brand underline underline-offset-2 outline-hidden',
  'hover:text-admin-brand-strong',
  focusRingClasses(FOCUS_RING_GROUND.SURFACE),
];

export const saveBarVariants = tv({
  slots: {
    root: [
      'fixed inset-x-0 bottom-0 z-20 flex flex-col gap-2 rounded-none border-t border-admin-line',
      'bg-admin-surface text-admin-text shadow-admin-unsaved',
      'px-4 pt-2.5 pb-[calc(--spacing(3.5)+env(safe-area-inset-bottom))]',
      'md:left-admin-sidebar md:h-admin-dock group-data-[collapsed=true]/shell:md:left-admin-rail',
      'md:flex-row md:items-center md:gap-3 md:px-admin-content md:py-0 md:shadow-admin-dock',
    ],
    summary: [
      'inline-flex flex-wrap items-center gap-2 text-admin-13',
      'md:gap-2.5 md:text-admin-13-5 md:leading-4',
    ],
    count: ['font-bold md:font-semibold'],
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
    errorLink: [...saveBarLinkClasses, 'lg:leading-4'],
    separator: ['text-admin-muted lg:hidden'],
    notSaved: ['text-admin-muted lg:ml-auto lg:text-admin-12-5'],
    actions: [
      'grid grid-cols-2 gap-2 md:ml-auto md:flex md:items-center md:gap-3',
    ],
    shortcut: ['hidden text-admin-12 text-admin-muted lg:inline'],
  },
  variants: {
    hasPhoneFooter: {
      true: { root: ['max-md:hidden'] },
      false: {},
    },
  },
  defaultVariants: {
    hasPhoneFooter: false,
  },
});
