import { PRESET_ID } from '@blog/config';
import { tv } from '@platform/utils/tv/tv';

const BAR_SHAPE = 'h-[3px] rounded-platform-bar';

export const presetMiniVariants = tv({
  slots: {
    root: [
      'flex h-[72px] flex-col gap-1 overflow-hidden rounded-platform-control p-2',
    ],
    nav: ['flex justify-between'],
    navBars: ['flex gap-1'],
    logo: [BAR_SHAPE, 'w-[22px] bg-(--preset-mini-muted) opacity-70'],
    bar: [BAR_SHAPE, 'bg-(--preset-mini-bar)'],
    navBar: ['w-[9px]'],
    title: ['text-platform-13 leading-platform-15 whitespace-nowrap'],
    tagline: [
      'text-platform-10-5 leading-[13px] whitespace-nowrap text-(--preset-mini-muted)',
    ],
    skeleton: ['flex flex-col gap-[3px]'],
    skeletonLong: ['w-4/5'],
    skeletonShort: ['w-[55%]'],
  },
  variants: {
    preset: {
      [PRESET_ID.CONSOLE]: {
        root: [
          'bg-[#0f1115] [--preset-mini-bar:#2a2f3a] [--preset-mini-muted:#c9cfda]',
        ],
        title: ['font-medium text-[#4f9cf0]'],
      },
      [PRESET_ID.EDITORIAL]: {
        root: [
          'bg-[#fbf7f0] [--preset-mini-bar:#e6ddd0] [--preset-mini-muted:#6f655b]',
        ],
        title: ['font-semibold text-[#2a2320]'],
      },
    },
  },
});
