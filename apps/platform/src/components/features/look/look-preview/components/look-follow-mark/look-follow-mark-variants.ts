import { tv } from '@platform/utils/tv/tv';

export const lookFollowMarkVariants = tv({
  slots: {
    root: ['contents'],
    mark: [
      'pointer-events-none absolute outline-platform-follow-mark outline-solid',
    ],
    edge: ['absolute outline-platform-follow-mark-ink outline-solid'],
    tag: [
      'absolute left-0 z-2 flex items-center whitespace-nowrap',
      'bg-platform-follow-mark font-platform leading-none font-semibold text-platform-follow-mark-ink',
    ],
  },
  variants: {
    isTagBelow: {
      true: { tag: ['top-full'] },
      false: { tag: ['bottom-full'] },
    },
  },
});
