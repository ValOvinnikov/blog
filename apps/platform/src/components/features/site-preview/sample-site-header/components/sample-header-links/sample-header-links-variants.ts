import { HEADER_SUBMENU_STYLE } from '@blog/config';
import { NAV_LINK } from '@blog/ui/lib/styling';
import { tv } from '@platform/utils/tv/tv';

export const sampleHeaderLinksVariants = tv({
  slots: {
    root: ['flex items-center gap-4'],
    link: [NAV_LINK],
    submenu: ['inline-flex items-center'],
    trigger: [
      'inline-flex items-center gap-1',
      NAV_LINK,
      'font-mono text-meta',
    ],
  },
  variants: {
    submenuStyle: {
      [HEADER_SUBMENU_STYLE.DROPDOWN]: { submenu: ['relative'] },
      [HEADER_SUBMENU_STYLE.WIDE_PANEL]: { submenu: [] },
    },
    isSubmenuOpen: {
      true: { trigger: ['nav-link-marked text-brand-primary'] },
      false: { trigger: ['text-muted hover:text-text'] },
    },
  },
});
