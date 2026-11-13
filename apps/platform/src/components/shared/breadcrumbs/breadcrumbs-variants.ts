import { FOCUS_RING_GROUND } from '@platform/constants/focus-ring';
import { focusRingClasses } from '@platform/utils/focus-ring-classes/focus-ring-classes';
import { tv } from '@platform/utils/tv/tv';

export const breadcrumbsVariants = tv({
  slots: {
    root: ['min-w-0 flex-1'],
    list: [
      'flex min-w-0 list-none flex-nowrap items-center gap-[7px] p-0 whitespace-nowrap text-platform-14 text-platform-muted',
    ],
    item: ['flex min-w-0 items-center gap-[7px]'],
    fullPathItem: ['flex flex-none items-center md:hidden'],
    sep: ['flex-none text-platform-12-5 text-platform-faint'],
    link: [
      'block min-w-0 truncate rounded-platform-control px-1 py-0.5 leading-10 text-platform-muted no-underline md:leading-normal',
      'hover:bg-platform-line-2 hover:text-platform-text',
      focusRingClasses(FOCUS_RING_GROUND.BG),
    ],
    current: ['max-w-[280px] truncate font-semibold text-platform-text'],
  },
  variants: {
    isShrinkable: {
      true: { item: 'min-w-12 flex-initial', current: 'min-w-0' },
      false: { item: 'flex-none' },
    },
    isHiddenOnPhone: {
      true: { item: 'hidden md:flex' },
    },
  },
  defaultVariants: { isShrinkable: false, isHiddenOnPhone: false },
});
