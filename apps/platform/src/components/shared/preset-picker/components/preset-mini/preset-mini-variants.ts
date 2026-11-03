import { PRESET_ID } from '@blog/config';
import { tv } from '@platform/utils/tv/tv';

export const presetMiniVariants = tv({
  slots: {
    root: [
      'flex h-[72px] flex-col gap-1 overflow-hidden rounded-admin-control p-2',
    ],
    nav: ['flex justify-between'],
    navBars: ['flex gap-1'],
    logo: ['h-[3px] w-[22px] rounded-admin-bar opacity-70'],
    bar: ['h-[3px] w-[9px] rounded-admin-bar'],
    title: ['text-admin-13 leading-[15px] whitespace-nowrap'],
    tagline: ['text-[10.5px] leading-[13px] whitespace-nowrap'],
    skeleton: ['flex flex-col gap-[3px]'],
    skeletonLong: ['h-[3px] w-4/5 rounded-admin-bar'],
    skeletonShort: ['h-[3px] w-[55%] rounded-admin-bar'],
  },
  variants: {
    preset: {
      [PRESET_ID.CONSOLE]: {
        root: ['bg-[#0f1115]'],
        logo: ['bg-[#c9cfda]'],
        bar: ['bg-[#2a2f3a]'],
        skeletonLong: ['bg-[#2a2f3a]'],
        skeletonShort: ['bg-[#2a2f3a]'],
        title: ['font-medium text-[#4f9cf0]'],
        tagline: ['text-[#c9cfda]'],
      },
      [PRESET_ID.EDITORIAL]: {
        root: ['bg-[#fbf7f0]'],
        logo: ['bg-[#6f655b]'],
        bar: ['bg-[#e6ddd0]'],
        skeletonLong: ['bg-[#e6ddd0]'],
        skeletonShort: ['bg-[#e6ddd0]'],
        title: ['font-semibold text-[#2a2320]'],
        tagline: ['text-[#6f655b]'],
      },
    },
  },
});
