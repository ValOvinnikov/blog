import { tv } from '@platform/utils/tv/tv';

export const leadsListVariants = tv({
  slots: {
    groups: ['flex flex-col gap-[18px]'],
    sentinel: ['h-px'],
    footer: [
      'flex justify-center',
      'border-t border-platform-line-2 px-[18px] py-3',
    ],
  },
});
