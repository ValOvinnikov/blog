import { BAR_CONTROL_CLASSES } from '@platform/utils/bar-control-classes/bar-control-classes';
import { tv } from '@platform/utils/tv/tv';

export const sidebarCollapseToggleVariants = tv({
  base: [
    ...BAR_CONTROL_CLASSES,
    'hidden size-9 shrink-0 items-center justify-center text-admin-muted md:inline-flex',
    'hover:text-admin-text',
    'focus-visible:border-admin-brand-ink focus-visible:text-admin-text',
  ],
});
