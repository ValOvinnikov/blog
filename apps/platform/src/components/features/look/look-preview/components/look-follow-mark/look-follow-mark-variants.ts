import { tv } from '@platform/utils/tv/tv';

export const lookFollowMarkVariants = tv({
  slots: {
    root: ['contents'],
    mark: [
      'pointer-events-none absolute outline-admin-follow-mark outline-solid',
    ],
    tag: [
      'absolute left-0 z-2 flex items-center whitespace-nowrap',
      'bg-admin-follow-mark font-admin leading-none font-semibold text-white',
    ],
  },
  variants: {
    isTagBelow: {
      true: { tag: ['top-full'] },
      false: { tag: ['bottom-full'] },
    },
  },
});
