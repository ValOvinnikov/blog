import { tv } from '@platform/utils/tv/tv';

export const sidebarCollapseProviderVariants = tv({
  // `contents` keeps `Sidebar` and the main column direct flex children of `ShellFrame`'s root.
  base: ['contents', 'group/shell'],
});
