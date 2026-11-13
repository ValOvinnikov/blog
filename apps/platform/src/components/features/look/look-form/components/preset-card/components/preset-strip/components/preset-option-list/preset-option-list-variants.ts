import { PRESET_LIST_LAYOUT } from '@platform/constants/preset-list';
import { tv } from '@platform/utils/tv/tv';

export const presetOptionListVariants = tv({
  base: ['group outline-none'],
  variants: {
    layout: {
      [PRESET_LIST_LAYOUT.GRID]: ['grid grid-cols-2 gap-1.5 px-2.5 pb-2.5'],
      [PRESET_LIST_LAYOUT.ROWS]: [
        'min-h-0 flex-1 overflow-y-auto overscroll-contain border-t border-platform-line-2',
        '[scrollbar-color:var(--platform-control-line)_transparent] [scrollbar-width:thin]',
        '[&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-platform-bar [&::-webkit-scrollbar-thumb]:bg-platform-control-line',
      ],
    },
  },
});
