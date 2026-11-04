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
      'flex flex-col',
      'md:fixed md:right-0 md:bottom-0 md:left-admin-sidebar md:z-20 md:h-admin-dock',
      'group-data-[collapsed=true]/shell:md:left-admin-rail',
      'md:flex-row md:items-center md:gap-3 md:rounded-none md:border-0 md:border-t md:border-admin-line',
      'md:bg-admin-surface md:px-admin-content md:py-0 md:text-admin-text md:shadow-admin-dock',
    ],
    summary: [
      'inline-flex flex-wrap items-center',
      'md:gap-2.5 md:text-admin-13-5 md:leading-4',
    ],
    count: ['md:font-semibold'],
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
    isFloatingOnPhone: {
      true: {
        root: [
          'sticky bottom-3 z-10 gap-3 rounded-admin border p-3 shadow-admin-lg',
        ],
        summary: ['gap-2.5 text-admin-14'],
        count: ['font-semibold'],
      },
      false: {
        root: [
          'fixed inset-x-0 bottom-0 z-20 gap-2 rounded-none border-t border-admin-line',
          'bg-admin-surface text-admin-text shadow-admin-unsaved',
          'px-4 pt-2.5 pb-[calc(--spacing(3.5)+env(safe-area-inset-bottom))]',
        ],
        summary: ['gap-2 text-admin-13'],
        count: ['font-bold'],
      },
    },
    hasErrors: {
      true: {},
      false: {},
    },
  },
  compoundVariants: [
    {
      isFloatingOnPhone: true,
      hasErrors: true,
      class: {
        root: [
          'border-admin-bad-line bg-admin-bad-weak text-admin-bad',
          'md:bg-admin-surface md:text-admin-text',
        ],
      },
    },
    {
      isFloatingOnPhone: true,
      hasErrors: false,
      class: {
        root: ['border-admin-line bg-admin-surface text-admin-text'],
      },
    },
  ],
  defaultVariants: {
    isFloatingOnPhone: false,
    hasErrors: false,
  },
});
