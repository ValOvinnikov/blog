import { TEXT_LINK_STROKE_CLASSES } from '@platform/components/shared/text-link/text-link-variants';
import { FOCUS_RING_GROUND } from '@platform/constants/focus-ring';
import { focusRingClasses } from '@platform/utils/focus-ring-classes/focus-ring-classes';
import { tv } from '@platform/utils/tv/tv';

export const saveBarLinkClasses = [
  'rounded-admin-control text-admin-brand outline-hidden',
  TEXT_LINK_STROKE_CLASSES,
  'hover:text-admin-brand-strong',
  focusRingClasses(FOCUS_RING_GROUND.SURFACE),
];

export const saveBarVariants = tv({
  slots: {
    container: ['contents'],
    root: [
      'fixed inset-x-0 bottom-0 z-20 flex flex-col gap-2 rounded-none border-t border-admin-line',
      'bg-admin-surface text-admin-text shadow-admin-unsaved',
      'px-4 pt-2.5 pb-[calc(--spacing(3.5)+env(safe-area-inset-bottom))]',
      'md:left-admin-sidebar md:min-h-admin-dock group-data-[collapsed=true]/shell:md:left-admin-rail',
      'md:flex-row md:items-center md:gap-3 md:px-admin-content md:py-2 md:shadow-admin-dock',
    ],
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
