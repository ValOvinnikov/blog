import { tv } from '@platform/utils/tv/tv';

export const sidebarCollapseToggleVariants = tv({
  base: [
    'hidden size-9 shrink-0 items-center justify-center rounded-admin-control md:inline-flex',
    'border border-admin-control-line bg-admin-surface text-admin-muted',
    'transition-colors duration-base ease-smooth',
    'hover:border-admin-brand-ink hover:text-admin-text',
    'focus-visible:border-admin-brand-ink focus-visible:text-admin-text',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-brand-ink',
    'focus-visible:ring-offset-2 focus-visible:ring-offset-admin-bg',
  ],
});
