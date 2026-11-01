import { MENU_RADIO_GROUP_SIZE } from '@platform/constants/menu-radio-group';
import { tv } from '@platform/utils/tv/tv';

export const menuRadioGroupVariants = tv({
  slots: {
    root: [
      'mb-1 flex flex-col gap-2 border-b border-admin-popover-line px-2 pt-2 pb-2.5',
    ],
    label: [
      'text-admin-11 leading-[14px] font-bold tracking-[0.09em] text-admin-muted uppercase',
    ],
    track: [
      'flex gap-[3px] rounded-admin-control border border-admin-control-line bg-admin-theme-track p-[3px]',
    ],
    item: [
      'inline-flex min-w-0 flex-auto items-center justify-center gap-[5px] px-1 py-[5px]',
      'rounded-admin-control border-0 bg-transparent whitespace-nowrap outline-none',
      'cursor-pointer text-admin-12-5 font-medium text-admin-muted',
      'data-[checked]:bg-admin-segment-on data-[checked]:font-semibold data-[checked]:text-admin-text data-[checked]:shadow-admin',
      'data-[highlighted]:not-data-[checked]:bg-admin-popover-hover data-[highlighted]:not-data-[checked]:text-admin-text',
      'data-[highlighted]:not-data-[checked]:shadow-[inset_0_0_0_2px_var(--admin-brand-ink)]',
    ],
    hint: ['text-admin-12 leading-4 text-admin-muted'],
  },
  variants: {
    size: {
      [MENU_RADIO_GROUP_SIZE.DESKTOP]: { item: ['min-h-8'] },
      [MENU_RADIO_GROUP_SIZE.TOUCH]: { item: ['min-h-11'] },
    },
  },
  defaultVariants: {
    size: MENU_RADIO_GROUP_SIZE.DESKTOP,
  },
});
