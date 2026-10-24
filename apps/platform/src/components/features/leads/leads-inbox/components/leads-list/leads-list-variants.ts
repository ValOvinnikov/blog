import { tv } from '@platform/utils/tv/tv';

export const leadsListVariants = tv({
  slots: {
    list: ['flex flex-col'],
    sentinel: ['h-px'],
    footer: [
      'flex justify-center',
      'border-t border-admin-line-2 px-[18px] py-3',
    ],
  },
});
