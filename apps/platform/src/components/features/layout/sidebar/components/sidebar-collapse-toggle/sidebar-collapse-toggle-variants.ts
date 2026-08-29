import { tv } from '@platform/utils/tv/tv';

export const sidebarCollapseToggleVariants = tv({
  slots: {
    root: [
      'inline-flex shrink-0 items-center justify-center rounded-admin-sm p-1.5',
      'text-admin-side-text/75 transition-colors duration-base ease-console',
      'hover:bg-admin-side-line hover:text-white',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-brand',
    ],
    icon: ['transition-transform duration-base ease-console'],
  },
  variants: {
    isCollapsed: {
      true: { icon: [] },
      false: { icon: ['rotate-180'] },
    },
  },
  defaultVariants: {
    isCollapsed: false,
  },
});
