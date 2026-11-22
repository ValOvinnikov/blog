import { SUBSCRIBER_LIMIT_STATE } from '@platform/constants/subscribers';
import { tv } from '@platform/utils/tv/tv';

export const limitCardVariants = tv({
  slots: {
    body: ['flex flex-col gap-2.5 md:gap-3'],
    detail: ['text-platform-12 text-platform-muted'],
    value: [
      'm-0 flex items-baseline gap-1.5',
      'text-platform-14 font-medium text-platform-muted md:text-platform-15',
    ],
    count: [
      'text-platform-22 leading-none font-bold tabular-nums text-platform-text md:text-platform-24',
    ],
    note: ['m-0 text-platform-13'],
    wide: ['max-md:hidden'],
    narrow: ['md:hidden'],
  },
  variants: {
    state: {
      [SUBSCRIBER_LIMIT_STATE.UNDER]: { note: ['text-platform-muted'] },
      [SUBSCRIBER_LIMIT_STATE.NEAR]: {
        note: ['font-medium text-platform-warn'],
      },
      [SUBSCRIBER_LIMIT_STATE.PAUSED]: {
        note: ['font-semibold text-platform-bad'],
      },
    },
  },
});
