import { FOCUS_RING_GROUND } from '@platform/constants/focus-ring';
import { focusRingClasses } from '@platform/utils/focus-ring-classes/focus-ring-classes';
import { tv } from '@platform/utils/tv/tv';

export const sidebarCollapseToggleVariants = tv({
  base: [
    'hidden size-9 shrink-0 items-center justify-center rounded-admin-control md:inline-flex',
    'border border-admin-control-line bg-admin-surface text-admin-muted',
    'transition-colors duration-base ease-smooth',
    'hover:border-admin-brand-ink hover:text-admin-text',
    'focus-visible:border-admin-brand-ink focus-visible:text-admin-text',
    focusRingClasses(FOCUS_RING_GROUND.BG),
  ],
});
