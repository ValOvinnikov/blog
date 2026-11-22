import { tv } from '@platform/utils/tv/tv';

export const subscribersPhoneListVariants = tv({
  slots: {
    list: ['m-0 list-none p-0'],
    row: [
      'flex items-center gap-2 py-2 pr-1 pl-4',
      'border-t border-platform-line-2 first:border-t-0',
    ],
    text: ['flex min-w-0 flex-1 flex-col gap-0.5'],
    email: ['truncate text-platform-14 font-medium text-platform-text'],
    unavailable: ['text-platform-14 text-platform-muted'],
    confirmed: ['text-platform-13 text-platform-muted'],
    footer: [
      'flex items-center justify-between gap-2',
      'border-t border-platform-line-2 px-4 py-3',
      'text-platform-13 text-platform-muted',
    ],
  },
});
