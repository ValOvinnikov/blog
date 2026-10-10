import { tv } from '@platform/utils/tv/tv';

export const tenantsTableVariants = tv({
  slots: {
    visuallyHidden: ['sr-only'],
    tname: ['flex items-center gap-2.5'],
    name: ['text-admin-text'],
    domain: ['text-[12px] text-admin-muted'],
  },
});
