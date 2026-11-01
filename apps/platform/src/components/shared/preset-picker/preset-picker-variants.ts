import { PRESET_ID } from '@blog/config';
import { FOCUS_RING_GROUND } from '@platform/constants/focus-ring';
import { DISABLED_AFFORDANCE_CLASSES } from '@platform/utils/disabled-state-classes/disabled-state-classes';
import { focusRingClasses } from '@platform/utils/focus-ring-classes/focus-ring-classes';
import { tv } from '@platform/utils/tv/tv';

export const presetPickerVariants = tv({
  slots: {
    root: ['grid grid-cols-1 gap-3 @sm:grid-cols-2'],
    card: [
      'relative cursor-pointer rounded-admin-control border-[1.5px] border-admin-line bg-admin-surface p-[14px]',
      focusRingClasses(FOCUS_RING_GROUND.SURFACE),
      ...DISABLED_AFFORDANCE_CLASSES,
    ],
    checkmark: [
      'absolute right-[11px] top-[11px] flex size-[18px] items-center justify-center',
      'rounded-full border-[1.5px] border-admin-control-line text-admin-11 text-transparent',
    ],
    name: [
      'flex items-center gap-2 text-admin-13-5 font-semibold text-admin-text',
    ],
    description: ['mt-[3px] block text-admin-12 text-admin-muted'],
    mini: [
      'mt-[11px] flex h-[52px] flex-col justify-center gap-1 rounded-admin-control px-[9px]',
    ],
    miniPrimary: ['text-admin-11'],
    miniSecondary: ['text-[10px] not-italic'],
  },
  variants: {
    selected: {
      true: {
        card: ['border-admin-brand shadow-[0_0_0_3px_var(--admin-brand-weak)]'],
        checkmark: ['border-admin-brand bg-admin-brand text-white'],
      },
      false: {},
    },
    preset: {
      [PRESET_ID.CONSOLE]: {
        mini: ['bg-[#0f1115]'],
        miniPrimary: ['text-[oklch(0.7_0.16_250)]'],
        miniSecondary: ['text-[#c9cfda]'],
      },
      [PRESET_ID.EDITORIAL]: {
        mini: ['bg-[#fbf7f0]'],
        miniPrimary: ['text-[#2a2320]'],
        miniSecondary: ['text-[#8a7f74]'],
      },
    },
  },
});
