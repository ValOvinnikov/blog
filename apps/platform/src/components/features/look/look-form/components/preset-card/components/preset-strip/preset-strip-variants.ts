import { PRESET_ID } from '@blog/config';
import { FOCUS_RING_GROUND } from '@platform/constants/focus-ring';
import { DISABLED_AFFORDANCE_CLASSES } from '@platform/utils/disabled-state-classes/disabled-state-classes';
import { focusRingClasses } from '@platform/utils/focus-ring-classes/focus-ring-classes';
import { tv } from '@platform/utils/tv/tv';

export const presetStripVariants = tv({
  slots: {
    root: ['flex min-w-0 flex-nowrap gap-3'],
    chip: [
      'flex h-11 shrink-0 cursor-pointer items-center gap-2 rounded-admin-control bg-admin-surface pr-3 pl-1.5 lg:h-10',
      'text-admin-13-5 font-semibold whitespace-nowrap text-admin-text',
      focusRingClasses(FOCUS_RING_GROUND.SURFACE),
      ...DISABLED_AFFORDANCE_CLASSES,
    ],
    swatch: [
      'flex size-7 shrink-0 items-center justify-center rounded-admin-3 font-semibold',
    ],
    tick: ['text-admin-brand-ink'],
    description: ['sr-only'],
  },
  variants: {
    preset: {
      [PRESET_ID.CONSOLE]: {
        swatch: ['bg-[#eef1f5] text-admin-11 text-[#12141a]'],
      },
      [PRESET_ID.EDITORIAL]: {
        swatch: ['bg-[#f6efe4] text-admin-15 text-[#3b2a14]'],
      },
    },
    selected: {
      true: {
        chip: [
          'border-[1.5px] border-admin-brand-ink shadow-[0_0_0_3px_var(--admin-brand-weak)]',
        ],
      },
      false: {
        chip: [
          'm-[0.5px] border border-admin-control-line not-data-[disabled]:hover:border-admin-brand-ink',
        ],
      },
    },
  },
});
