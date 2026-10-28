import { HEADER_SUBMENU_STYLE } from '@blog/config';
import { tv } from '@platform/utils/tv/tv';

export const sampleHeaderLinksVariants = tv({
  slots: {
    root: ['flex items-center gap-4'],
    submenu: ['inline-flex items-center'],
    trigger: ['inline-flex items-center gap-1 font-mono text-meta text-muted'],
  },
  variants: {
    submenuStyle: {
      [HEADER_SUBMENU_STYLE.DROPDOWN]: { submenu: ['relative'] },
      [HEADER_SUBMENU_STYLE.WIDE_PANEL]: { submenu: [] },
    },
  },
});
