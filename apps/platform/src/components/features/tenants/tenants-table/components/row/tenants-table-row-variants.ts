import { tv } from '@platform/utils/tv/tv';

export const tenantsTableRowVariants = tv({
  slots: {
    tname: ['flex min-w-0 items-center gap-2.5'],
    lines: ['min-w-0'],
    name: ['text-platform-text max-md:truncate max-md:font-medium'],
    domain: ['text-platform-12 text-platform-muted max-md:truncate'],
  },
});
