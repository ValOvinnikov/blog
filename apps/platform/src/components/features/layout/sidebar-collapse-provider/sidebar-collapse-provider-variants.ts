import { tv } from '@platform/utils/tv/tv';

export const sidebarCollapseProviderVariants = tv({
  // `contents` drops this element from the box layout tree so `Sidebar` and
  // `ShellFrame`'s main column stay direct flex children of `ShellFrame`'s
  // root — only the `data-collapsed` attribute and the `group/shell` marker
  // it carries are load-bearing.
  base: ['contents', 'group/shell'],
});
