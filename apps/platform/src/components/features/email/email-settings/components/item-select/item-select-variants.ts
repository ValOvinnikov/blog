import { tv } from '@platform/utils/tv/tv';

export const itemSelectVariants = tv({
  slots: {
    trigger: ['sm:w-60'],
    value: ['flex min-w-0 flex-col leading-tight'],
    valueName: ['truncate text-platform-13-5 font-semibold text-platform-text'],
    valueMeta: ['truncate text-platform-12 text-platform-muted'],
    itemText: ['flex min-w-0 flex-1 flex-col gap-0.5'],
    itemName: ['text-platform-13-5 text-platform-text'],
    itemDescription: ['text-platform-12 text-platform-muted'],
    badge: ['shrink-0'],
  },
});
