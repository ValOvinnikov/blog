import { tv } from '@platform/utils/tv/tv';

export const presetPickerVariants = tv({
  slots: {
    root: ['grid grid-cols-1 gap-3 sm:grid-cols-2'],
    card: [
      'relative cursor-pointer rounded-xl border-[1.5px] border-admin-line bg-admin-surface p-[14px]',
      'outline-hidden',
      'focus-visible:ring-2 focus-visible:ring-admin-brand focus-visible:ring-offset-2',
      'data-[disabled]:cursor-not-allowed data-[disabled]:opacity-[.55]',
    ],
    checkmark: [
      'absolute right-[11px] top-[11px] flex size-[18px] items-center justify-center',
      'rounded-full border-[1.5px] border-admin-line text-[11px] text-transparent',
    ],
    name: ['flex items-center gap-2 text-[14px] font-semibold text-admin-text'],
    description: ['mt-[3px] block text-[12px] text-admin-muted'],
    mini: [
      'mt-[11px] flex h-[52px] flex-col justify-center gap-1 rounded-md px-[9px]',
    ],
    miniPrimary: ['text-[11px]'],
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
      CONSOLE: {
        mini: ['bg-[#0f1115]'],
        miniPrimary: ['text-[oklch(0.7_0.16_250)]'],
        miniSecondary: ['text-admin-side-text'],
      },
      EDITORIAL: {
        mini: ['bg-[#fbf7f0]'],
        miniPrimary: ['text-[#2a2320]'],
        miniSecondary: ['text-[#8a7f74]'],
      },
    },
  },
});
