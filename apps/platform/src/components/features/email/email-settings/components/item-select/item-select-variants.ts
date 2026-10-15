import { tv } from '@platform/utils/tv/tv';

export const itemSelectVariants = tv({
  slots: {
    trigger: ['sm:w-60'],
    value: ['flex min-w-0 flex-col leading-tight'],
    valueName: ['truncate text-admin-13-5 font-semibold text-admin-text'],
    valueMeta: ['truncate text-admin-12 text-admin-muted'],
    itemText: ['flex min-w-0 flex-1 flex-col gap-0.5'],
    itemName: ['text-admin-13-5 text-admin-text'],
    itemDescription: ['text-admin-12 text-admin-muted'],
    badge: ['shrink-0'],
  },
});
