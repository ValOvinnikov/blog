import { tv } from '@platform/utils/tv/tv';

export const lookFollowMarkVariants = tv({
  slots: {
    mark: ['pointer-events-none absolute outline-[#4f46e5] outline-solid'],
    tag: [
      'absolute left-0 z-2 flex items-center whitespace-nowrap',
      'bg-[#4f46e5] font-admin leading-none font-semibold text-white',
    ],
  },
  variants: {
    isTagBelow: {
      true: { tag: ['top-full'] },
      false: { tag: ['bottom-full'] },
    },
  },
});
